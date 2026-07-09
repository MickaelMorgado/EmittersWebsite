export type TrafficLevel = 'low' | 'medium' | 'high' | 'severe';

export interface Waypoint {
  lng: number;
  lat: number;
}

/** A portion of a route with its own traffic condition (Google Maps style) */
export interface RouteSegment {
  waypoints: Waypoint[]; // consecutive points, shares endpoints with neighbors
  trafficLevel: TrafficLevel;
  distanceM: number;
  share: number; // 0..1 — portion of total route distance
}

export interface Route {
  id: string;
  name: string;
  description: string;
  waypoints: Waypoint[];
  segments: RouteSegment[];
  distanceM: number;
  baseDurationMin: number; // duration with zero traffic
  etaMin: number; // duration with current traffic
  color: string; // route identity color (like Google's blue)
}

export interface TrafficState {
  routes: Route[];
  lastUpdated: Date;
  isRefreshing: boolean;
}
