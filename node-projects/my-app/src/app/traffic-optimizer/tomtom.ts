import { Route, RouteSegment, TrafficLevel, Waypoint } from './types';
import { haversineM } from './utils';
import { DESTINATION, ORIGIN } from './routeData';

// ─── TomTom Routing API response types (partial) ────────────────────────────

interface TomTomPoint {
  latitude: number;
  longitude: number;
}

interface TomTomSection {
  sectionType: string;
  startPointIndex: number;
  endPointIndex: number;
  simpleCategory?: string; // JAM | ROAD_WORK | ROAD_CLOSURE | OTHER
  magnitudeOfDelay?: number; // 0 unknown, 1 minor, 2 moderate, 3 major, 4 undefined
  effectiveSpeedInKmh?: number;
}

interface TomTomSummary {
  lengthInMeters: number;
  travelTimeInSeconds: number;
  trafficDelayInSeconds: number;
  noTrafficTravelTimeInSeconds?: number;
}

interface TomTomRoute {
  summary: TomTomSummary;
  legs: { points: TomTomPoint[] }[];
  sections: TomTomSection[];
}

const ROUTE_COLORS = ['#3b82f6', '#a855f7', '#f97316'];
const ROUTE_NAMES = ['Fastest route', 'Alternative A', 'Alternative B'];

/**
 * Fetch up to 3 real routes with live traffic sections from TomTom Routing API.
 * Free tier: 2,500 requests/day — https://developer.tomtom.com
 */
export async function fetchTomTomRoutes(apiKey: string): Promise<Route[]> {
  const locations = `${ORIGIN.lat},${ORIGIN.lng}:${DESTINATION.lat},${DESTINATION.lng}`;
  const params = new URLSearchParams({
    key: apiKey,
    maxAlternatives: '2',
    traffic: 'true',
    sectionType: 'traffic',
    computeTravelTimeFor: 'all',
    routeType: 'fastest',
    travelMode: 'car',
  });
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403) {
      throw new Error('TomTom API key rejected (403). Check the key or its allowed domains.');
    }
    throw new Error(`TomTom routing failed (${res.status}): ${body.slice(0, 160)}`);
  }

  const data = await res.json();
  const routes: TomTomRoute[] = data.routes ?? [];
  if (routes.length === 0) throw new Error('TomTom returned no routes.');

  return routes.slice(0, 3).map(toRoute);
}

// ─── Response → app Route conversion ─────────────────────────────────────────

function magnitudeToLevel(magnitude?: number, category?: string): TrafficLevel {
  if (category === 'ROAD_CLOSURE') return 'severe';
  switch (magnitude) {
    case 1: return 'medium';
    case 2: return 'high';
    case 3:
    case 4: return 'severe';
    default: return 'medium'; // unknown delay — assume moderate
  }
}

function toRoute(r: TomTomRoute, index: number): Route {
  const points: Waypoint[] = r.legs
    .flatMap((leg) => leg.points)
    .map((p) => ({ lng: p.longitude, lat: p.latitude }));

  // Traffic sections mark congested index ranges; everything else = free flow
  const trafficSections = (r.sections ?? [])
    .filter((s) => s.sectionType === 'TRAFFIC')
    .sort((a, b) => a.startPointIndex - b.startPointIndex);

  const ranges: { start: number; end: number; level: TrafficLevel }[] = [];
  let cursor = 0;
  for (const s of trafficSections) {
    const start = Math.max(0, Math.min(s.startPointIndex, points.length - 1));
    const end = Math.max(0, Math.min(s.endPointIndex, points.length - 1));
    if (start > cursor) ranges.push({ start: cursor, end: start, level: 'low' });
    ranges.push({ start, end, level: magnitudeToLevel(s.magnitudeOfDelay, s.simpleCategory) });
    cursor = end;
  }
  if (cursor < points.length - 1) ranges.push({ start: cursor, end: points.length - 1, level: 'low' });
  if (ranges.length === 0) ranges.push({ start: 0, end: points.length - 1, level: 'low' });

  const segments: RouteSegment[] = ranges
    .filter((rg) => rg.end > rg.start)
    .map((rg) => {
      const pts = points.slice(rg.start, rg.end + 1);
      const dist = pts.reduce(
        (acc, p, i) => (i === 0 ? 0 : acc + haversineM(pts[i - 1], p)),
        0
      );
      return { waypoints: pts, trafficLevel: rg.level, distanceM: Math.round(dist), share: 0 };
    });

  const totalDist = segments.reduce((a, s) => a + s.distanceM, 0) || 1;
  segments.forEach((s) => { s.share = s.distanceM / totalDist; });

  const sum = r.summary;
  const etaMin = Math.round(sum.travelTimeInSeconds / 60);
  const baseSec = sum.noTrafficTravelTimeInSeconds
    ?? sum.travelTimeInSeconds - (sum.trafficDelayInSeconds ?? 0);
  const baseMin = Math.round(baseSec / 60);
  const delayMin = Math.max(0, etaMin - baseMin);

  return {
    id: `route-${index}`,
    name: ROUTE_NAMES[index] ?? `Route ${index + 1}`,
    description:
      delayMin > 1
        ? `+${delayMin} min delay due to traffic right now`
        : 'No significant traffic delay',
    waypoints: points,
    segments,
    distanceM: sum.lengthInMeters,
    baseDurationMin: baseMin,
    etaMin,
    color: ROUTE_COLORS[index % ROUTE_COLORS.length],
  };
}
