import { Route, RouteSegment, TrafficLevel, Waypoint } from './types';
import { haversineM, TRAFFIC_MULTIPLIER } from './utils';

// Origin: Praceta da Boavista 5, Gambelas, Faro
const ORIGIN = { lng: -7.9857, lat: 37.0432 };
// Destination: R. Gen. Teofilo da Trindade 29, Faro
const DESTINATION = { lng: -7.9350, lat: 37.0153 };

export { ORIGIN, DESTINATION };

// Route A — Via EN125 (main highway corridor, longest but fastest normally)
// Waypoints trace the EN125 / IP1 approach from Gambelas toward Faro center
const ROUTE_A_WAYPOINTS: Waypoint[] = [
  { lng: -7.9857, lat: 37.0432 }, // Start: Praceta da Boavista
  { lng: -7.9820, lat: 37.0420 },
  { lng: -7.9780, lat: 37.0405 },
  { lng: -7.9740, lat: 37.0385 },
  { lng: -7.9700, lat: 37.0360 }, // EN125 junction
  { lng: -7.9650, lat: 37.0330 },
  { lng: -7.9600, lat: 37.0295 },
  { lng: -7.9560, lat: 37.0265 },
  { lng: -7.9520, lat: 37.0240 },
  { lng: -7.9490, lat: 37.0218 },
  { lng: -7.9460, lat: 37.0200 },
  { lng: -7.9430, lat: 37.0185 },
  { lng: -7.9400, lat: 37.0172 },
  { lng: -7.9370, lat: 37.0162 },
  { lng: -7.9350, lat: 37.0153 }, // End: R. Gen. Teofilo da Trindade
];

// Route B — Via Faro city center (shorter distance, urban streets)
const ROUTE_B_WAYPOINTS: Waypoint[] = [
  { lng: -7.9857, lat: 37.0432 }, // Start
  { lng: -7.9840, lat: 37.0415 },
  { lng: -7.9810, lat: 37.0390 },
  { lng: -7.9775, lat: 37.0360 },
  { lng: -7.9740, lat: 37.0325 },
  { lng: -7.9700, lat: 37.0290 }, // Av. 5 de Outubro
  { lng: -7.9660, lat: 37.0260 },
  { lng: -7.9620, lat: 37.0235 },
  { lng: -7.9580, lat: 37.0215 },
  { lng: -7.9540, lat: 37.0198 },
  { lng: -7.9500, lat: 37.0183 },
  { lng: -7.9460, lat: 37.0170 },
  { lng: -7.9420, lat: 37.0160 },
  { lng: -7.9390, lat: 37.0155 },
  { lng: -7.9350, lat: 37.0153 }, // End
];

// Route C — Via back roads / Parque das Cidades (longer, less traffic)
const ROUTE_C_WAYPOINTS: Waypoint[] = [
  { lng: -7.9857, lat: 37.0432 }, // Start
  { lng: -7.9870, lat: 37.0408 },
  { lng: -7.9875, lat: 37.0380 },
  { lng: -7.9860, lat: 37.0355 },
  { lng: -7.9840, lat: 37.0330 },
  { lng: -7.9815, lat: 37.0305 },
  { lng: -7.9790, lat: 37.0282 },
  { lng: -7.9760, lat: 37.0262 },
  { lng: -7.9720, lat: 37.0243 },
  { lng: -7.9680, lat: 37.0230 },
  { lng: -7.9640, lat: 37.0220 },
  { lng: -7.9590, lat: 37.0210 },
  { lng: -7.9540, lat: 37.0200 },
  { lng: -7.9490, lat: 37.0192 },
  { lng: -7.9440, lat: 37.0180 },
  { lng: -7.9400, lat: 37.0170 },
  { lng: -7.9370, lat: 37.0162 },
  { lng: -7.9350, lat: 37.0153 }, // End
];

// ─── Segment-based traffic (Google Maps style) ──────────────────────────────

const LEVELS: TrafficLevel[] = ['low', 'medium', 'high', 'severe'];
const SEGMENT_CHUNK = 2; // waypoint intervals per segment (~7-9 segments per route)

/**
 * Spatially coherent traffic: congestion clusters instead of pure random.
 * Random walk over 0..3 — adjacent segments have similar conditions.
 * bias 0..1 — higher = route tends toward congestion.
 */
function generateTrafficLevels(count: number, bias: number): TrafficLevel[] {
  const levels: TrafficLevel[] = [];
  let v = Math.random() * 1.2 + bias * 1.6; // start value 0..~2.8
  for (let i = 0; i < count; i++) {
    v += (Math.random() - 0.5) * 1.5 + (bias - 0.5) * 0.45;
    v = Math.max(0, Math.min(3, v));
    levels.push(LEVELS[Math.round(v)]);
  }
  return levels;
}

/** Split waypoints into segments sharing boundary points, distance-weighted */
function chunkIntoSegments(
  waypoints: Waypoint[],
  levels: TrafficLevel[],
  totalRouteDistanceM: number
): RouteSegment[] {
  const chunks: Waypoint[][] = [];
  for (let i = 0; i < waypoints.length - 1; i += SEGMENT_CHUNK) {
    const end = Math.min(i + SEGMENT_CHUNK, waypoints.length - 1);
    chunks.push(waypoints.slice(i, end + 1));
  }

  const havDists = chunks.map((pts) =>
    pts.reduce((acc, p, idx) => (idx === 0 ? 0 : acc + haversineM(pts[idx - 1], p)), 0)
  );
  const totalHav = havDists.reduce((a, b) => a + b, 0);

  return chunks.map((pts, i) => {
    const share = totalHav > 0 ? havDists[i] / totalHav : 1 / chunks.length;
    return {
      waypoints: pts,
      trafficLevel: levels[i] ?? 'low',
      distanceM: Math.round(share * totalRouteDistanceM),
      share,
    };
  });
}

function segmentCount(waypoints: Waypoint[]): number {
  return Math.ceil((waypoints.length - 1) / SEGMENT_CHUNK);
}

interface RouteDef {
  id: string;
  name: string;
  description: string;
  waypoints: Waypoint[];
  distanceM: number;
  baseDurationMin: number;
  color: string;
}

function buildRoute(def: RouteDef, congestionBias: number): Route {
  const levels = generateTrafficLevels(segmentCount(def.waypoints), congestionBias);
  const segments = chunkIntoSegments(def.waypoints, levels, def.distanceM);
  const etaMin = Math.round(
    segments.reduce(
      (acc, seg) => acc + def.baseDurationMin * seg.share * TRAFFIC_MULTIPLIER[seg.trafficLevel],
      0
    )
  );
  return { ...def, segments, etaMin };
}

export function generateRoutes(): Route[] {
  return [
    buildRoute(
      {
        id: 'route-a',
        name: 'Via EN125',
        description: 'Main highway — fastest in clear traffic',
        waypoints: ROUTE_A_WAYPOINTS,
        distanceM: 8960,
        baseDurationMin: 22,
        color: '#3b82f6',
      },
      0.62 // highway: congestion-prone at rush hour
    ),
    buildRoute(
      {
        id: 'route-b',
        name: 'Via City Center',
        description: 'Urban streets — moderate traffic expected',
        waypoints: ROUTE_B_WAYPOINTS,
        distanceM: 7800,
        baseDurationMin: 18,
        color: '#a855f7',
      },
      0.48
    ),
    buildRoute(
      {
        id: 'route-c',
        name: 'Via Back Roads',
        description: 'Longer path — avoids main congestion points',
        waypoints: ROUTE_C_WAYPOINTS,
        distanceM: 10200,
        baseDurationMin: 25,
        color: '#f97316',
      },
      0.28 // back roads: usually clear
    ),
  ];
}
