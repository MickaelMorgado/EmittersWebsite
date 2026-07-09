import { Route, TrafficLevel, Waypoint } from './types';

// Faro city center bounding box (roughly)
// lat: 37.005 – 37.060, lng: -8.010 – -7.920
const MAP_CENTER_LNG = -7.9600;
const MAP_CENTER_LAT = 37.0290;
const SCALE = 220; // world units per degree — fits the Gambelas→Faro span (~0.05°) in ~9 units
const LNG_COMPRESS = Math.cos((MAP_CENTER_LAT * Math.PI) / 180); // Mercator-ish x correction

/**
 * Convert a [lng, lat] pair to Three.js [x, y, z] coordinates.
 * Y-axis = 0 (flat map), elevation is z for height.
 */
export function lngLatToXZ(lng: number, lat: number): [number, number, number] {
  const x = (lng - MAP_CENTER_LNG) * SCALE * LNG_COMPRESS;
  const z = -(lat - MAP_CENTER_LAT) * SCALE;
  return [x, 0, z];
}

// ─── Traffic (Google Maps palette) ──────────────────────────────────────────

export const TRAFFIC_MULTIPLIER: Record<TrafficLevel, number> = {
  low: 1.0,
  medium: 1.35,
  high: 1.85,
  severe: 2.6,
};

export const TRAFFIC_LABELS: Record<TrafficLevel, string> = {
  low: 'Fast',
  medium: 'Moderate',
  high: 'Slow',
  severe: 'Jammed',
};

/** Google Maps traffic colors */
export function trafficColor(level: TrafficLevel): string {
  switch (level) {
    case 'low': return '#63d668';
    case 'medium': return '#ffb14d';
    case 'high': return '#f23c32';
    case 'severe': return '#8e1b12';
  }
}

export function trafficEmissive(level: TrafficLevel): string {
  switch (level) {
    case 'low': return '#2e9e3e';
    case 'medium': return '#c77e2a';
    case 'high': return '#c22a20';
    case 'severe': return '#5e0f08';
  }
}

// ─── Geo helpers ─────────────────────────────────────────────────────────────

/** Haversine distance in meters */
export function haversineM(a: Waypoint, b: Waypoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ─── ETA computation (per-segment, like Google) ─────────────────────────────

/** Total ETA in minutes — each segment slowed by its own traffic level */
export function routeEtaMin(route: Route): number {
  const minutes = route.segments.reduce(
    (acc, seg) =>
      acc + route.baseDurationMin * seg.share * TRAFFIC_MULTIPLIER[seg.trafficLevel],
    0
  );
  return Math.round(minutes);
}

/** Distance-weighted overall congestion for a route */
export function overallTrafficLevel(route: Route): TrafficLevel {
  const num: Record<TrafficLevel, number> = { low: 0, medium: 1, high: 2, severe: 3 };
  const avg = route.segments.reduce(
    (acc, s) => acc + num[s.trafficLevel] * s.share,
    0
  );
  if (avg < 0.5) return 'low';
  if (avg < 1.3) return 'medium';
  if (avg < 2.15) return 'high';
  return 'severe';
}
