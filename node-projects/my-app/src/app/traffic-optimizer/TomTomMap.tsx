'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DESTINATION, ORIGIN } from './routeData';
import { Route } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { tt?: any }
}

const SDK_VERSION = '6.25.0';
const CSS_URL = `https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/${SDK_VERSION}/maps/maps.css`;
const JS_URL = `https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/${SDK_VERSION}/maps/maps-web.min.js`;

let sdkPromise: Promise<any> | null = null;

function loadSdk(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.tt) return Promise.resolve(window.tt);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = JS_URL;
      script.async = true;
      script.onload = () => resolve(window.tt);
      script.onerror = () => reject(new Error('Failed to load TomTom SDK'));
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

// Google Maps traffic palette, matched to TomTom flow tiles
const LEVEL_COLOR_EXPR = [
  'match', ['get', 'level'],
  'low', '#63d668',
  'medium', '#ffb14d',
  'high', '#f23c32',
  'severe', '#8e1b12',
  '#63d668',
];

const DIM_COLOR = '#9aa0a6'; // Google's gray for alternative routes

export default function TomTomMap({
  apiKey,
  routes,
  selectedRouteId,
}: {
  apiKey: string;
  routes: Route[];
  selectedRouteId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const drawnIdsRef = useRef<string[]>([]);
  const fitDoneRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // ── Init map once per key ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    loadSdk()
      .then((tt) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = tt.map({
          key: apiKey,
          container: containerRef.current,
          center: [(ORIGIN.lng + DESTINATION.lng) / 2, (ORIGIN.lat + DESTINATION.lat) / 2],
          zoom: 12.5,
          dragRotate: false,
        });
        mapRef.current = map;

        map.on('load', () => {
          if (cancelled) return;
          // Force recalculate dimensions — container may have settled after SDK init
          map.resize();

          // Live traffic flow tiles — colors every road by current speed (Google Maps style)
          map.showTrafficFlow();

          new tt.Marker({ color: '#059669' })
            .setLngLat([ORIGIN.lng, ORIGIN.lat])
            .addTo(map);
          new tt.Marker({ color: '#dc2626' })
            .setLngLat([DESTINATION.lng, DESTINATION.lat])
            .addTo(map);

          setMapReady(true);
        });

        map.on('error', (e: any) => {
          const msg = e?.error?.message ?? '';
          if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
            setMapError('Map tiles rejected the API key (403).');
          }
        });
      })
      .catch((err) => setMapError(err.message));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
      fitDoneRef.current = false;
      drawnIdsRef.current = [];
    };
  }, [apiKey]);

  // ── Draw route layers whenever routes change ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || routes.length === 0) return;

    // Clear previous layers/sources
    drawnIdsRef.current.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    drawnIdsRef.current
      .filter((id) => !id.endsWith('-casing'))
      .forEach((id) => {
        if (map.getSource(id)) map.removeSource(id);
      });
    drawnIdsRef.current = [];

    routes.forEach((route) => {
      const srcId = `route-${route.id}`;
      const featureCollection = {
        type: 'FeatureCollection',
        features: route.segments.map((seg) => ({
          type: 'Feature',
          properties: { level: seg.trafficLevel },
          geometry: {
            type: 'LineString',
            coordinates: seg.waypoints.map((w) => [w.lng, w.lat]),
          },
        })),
      };

      map.addSource(srcId, { type: 'geojson', data: featureCollection });

      // Dark casing under the colored line — crisp Google Maps look
      map.addLayer({
        id: `${srcId}-casing`,
        type: 'line',
        source: srcId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1f2937', 'line-width': 9, 'line-opacity': 0.85 },
      });
      map.addLayer({
        id: srcId,
        type: 'line',
        source: srcId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': LEVEL_COLOR_EXPR, 'line-width': 6 },
      });

      drawnIdsRef.current.push(`${srcId}-casing`, srcId);
    });

    // Fit view to all routes (only on first draw — avoid recentering every refresh)
    if (!fitDoneRef.current && window.tt) {
      const bounds = new window.tt.LngLatBounds();
      routes.forEach((r) => r.waypoints.forEach((w) => bounds.extend([w.lng, w.lat])));
      map.fitBounds(bounds, { padding: 70, maxZoom: 14.5 });
      fitDoneRef.current = true;
    }
  }, [routes, mapReady]);

  // ── Selection styling (Google-style: alternates go gray) ──────────────
  const applySelection = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    routes.forEach((route) => {
      const id = `route-${route.id}`;
      if (!map.getLayer(id)) return;
      const emphasized = selectedRouteId === route.id;
      const dimmed = selectedRouteId !== null && !emphasized;

      map.setPaintProperty(id, 'line-color', dimmed ? DIM_COLOR : LEVEL_COLOR_EXPR);
      map.setPaintProperty(id, 'line-width', emphasized ? 8 : dimmed ? 4 : 6);
      map.setPaintProperty(id, 'line-opacity', dimmed ? 0.65 : 1);
      map.setPaintProperty(`${id}-casing`, 'line-width', emphasized ? 12 : dimmed ? 6 : 9);
      map.setPaintProperty(`${id}-casing`, 'line-opacity', dimmed ? 0.4 : 0.85);
    });

    // Bring selected route to the top
    if (selectedRouteId) {
      const id = `route-${selectedRouteId}`;
      if (map.getLayer(`${id}-casing`)) map.moveLayer(`${id}-casing`);
      if (map.getLayer(id)) map.moveLayer(id);
    }
  }, [routes, selectedRouteId, mapReady]);

  useEffect(() => {
    applySelection();
  }, [applySelection]);

  return (
    <div className="w-full h-full" style={{ position: 'relative', minHeight: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]">
          <span className="text-sm text-white/40">Loading TomTom map...</span>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]">
          <span className="text-sm text-red-400 max-w-sm text-center px-4">{mapError}</span>
        </div>
      )}
    </div>
  );
}
