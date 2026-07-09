'use client';

import { Grid, OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { DESTINATION, ORIGIN } from './routeData';
import { Route, RouteSegment } from './types';
import { lngLatToXZ, overallTrafficLevel, trafficColor, trafficEmissive } from './utils';

const ROUTE_Y = 0.15;
const DIM_COLOR = '#5f6368'; // Google's gray for alternative routes

// ─── Per-segment traffic tube (Google Maps style portions) ──────────────────

function SegmentTube({
  segment,
  emphasized,
  dimmed,
}: {
  segment: RouteSegment;
  emphasized: boolean;
  dimmed: boolean;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const curve = useMemo(() => {
    const pts = segment.waypoints.map((wp) => {
      const [x, , z] = lngLatToXZ(wp.lng, wp.lat);
      return new THREE.Vector3(x, ROUTE_Y, z);
    });
    return new THREE.CatmullRomCurve3(pts);
  }, [segment.waypoints]);

  const color = dimmed ? DIM_COLOR : trafficColor(segment.trafficLevel);
  const emissive = dimmed ? '#4a4d52' : trafficEmissive(segment.trafficLevel);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    if (dimmed) {
      matRef.current.emissiveIntensity = 0.55;
      return;
    }
    const t = clock.getElapsedTime();
    const heavy = segment.trafficLevel === 'high' || segment.trafficLevel === 'severe';
    const base =
      segment.trafficLevel === 'severe' ? 1.0 :
      segment.trafficLevel === 'high' ? 0.75 :
      segment.trafficLevel === 'medium' ? 0.45 : 0.35;
    // Heavy traffic pulses faster — feels like brake lights
    matRef.current.emissiveIntensity = base + Math.sin(t * (heavy ? 3.2 : 1.8)) * 0.15;
  });

  const radius = emphasized ? 0.032 : dimmed ? 0.015 : 0.021;
  const opacity = emphasized ? 1 : dimmed ? 0.4 : 0.9;

  return (
    <mesh>
      <tubeGeometry args={[curve, 48, radius, 8, false]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={emissive}
        emissiveIntensity={0.5}
        transparent
        opacity={opacity}
        roughness={0.35}
        metalness={0.3}
      />
    </mesh>
  );
}

// ─── Full route: segments + rounded joints ──────────────────────────────────

function RouteTraffic({
  route,
  emphasized,
  dimmed,
}: {
  route: Route;
  emphasized: boolean;
  dimmed: boolean;
}) {
  const radius = emphasized ? 0.032 : dimmed ? 0.015 : 0.021;

  return (
    <group>
      {route.segments.map((seg, i) => (
        <SegmentTube key={i} segment={seg} emphasized={emphasized} dimmed={dimmed} />
      ))}
      {/* Joint spheres smooth the segment transitions */}
      {route.segments.slice(1).map((seg, i) => {
        const wp = seg.waypoints[0];
        const [x, , z] = lngLatToXZ(wp.lng, wp.lat);
        const color = dimmed ? DIM_COLOR : trafficColor(seg.trafficLevel);
        return (
          <mesh key={`joint-${i}`} position={[x, ROUTE_Y, z]}>
            <sphereGeometry args={[radius, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={dimmed ? '#4a4d52' : trafficEmissive(seg.trafficLevel)}
              emissiveIntensity={dimmed ? 0.55 : 0.5}
              transparent
              opacity={emphasized ? 1 : dimmed ? 0.4 : 0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Flow particles along route (speed reflects congestion) ─────────────────

function RouteParticles({ route, hidden }: { route: Route; hidden: boolean }) {
  const particleCount = 6;
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const curve = useMemo(() => {
    const points = route.waypoints.map((wp) => {
      const [x, , z] = lngLatToXZ(wp.lng, wp.lat);
      return new THREE.Vector3(x, ROUTE_Y + 0.07, z);
    });
    return new THREE.CatmullRomCurve3(points);
  }, [route.waypoints]);

  // Congested routes move slower — visual feedback like watching cars crawl
  const speed = useMemo(() => {
    const overall = overallTrafficLevel(route);
    return { low: 0.14, medium: 0.1, high: 0.065, severe: 0.045 }[overall];
  }, [route]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const offset = (t * speed + i / particleCount) % 1;
      const pos = curve.getPoint(offset);
      mesh.position.set(pos.x, pos.y, pos.z);
    });
  });

  if (hidden) return null;

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
        >
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Map pin marker ──────────────────────────────────────────────────────────

function MapPin({
  lng,
  lat,
  color,
}: {
  lng: number;
  lat: number;
  color: string;
}) {
  const [x, , z] = lngLatToXZ(lng, lat);
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
    }
  });

  return (
    <group ref={ref} position={[x, 0.3, z]}>
      {/* Pole */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Pin head */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.1, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ─── City ground plane ───────────────────────────────────────────────────────

function CityGround() {
  return (
    <>
      {/* Base terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0a0e1a" roughness={1} metalness={0} />
      </mesh>

      {/* Grid overlay */}
      <Grid
        args={[30, 20]}
        position={[0, 0, 0]}
        cellSize={0.5}
        cellThickness={0.3}
        cellColor="#1a2540"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#1e3a5f"
        fadeDistance={25}
        fadeStrength={1}
      />

      {/* Subtle city block shapes */}
      {CITY_BLOCKS.map((block, i) => (
        <mesh key={i} position={[block.x, 0.01, block.z]} rotation={[-Math.PI / 2, 0, block.rot]}>
          <planeGeometry args={[block.w, block.h]} />
          <meshStandardMaterial color="#0d1525" transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  );
}

// Rough city block layout (visual only, approximate Faro districts)
const CITY_BLOCKS = [
  { x: 0.5, z: 0.8, w: 1.2, h: 0.6, rot: 0.1 },
  { x: -0.8, z: 0.3, w: 0.8, h: 0.4, rot: 0 },
  { x: 1.8, z: -0.2, w: 1.0, h: 0.5, rot: 0.05 },
  { x: -1.5, z: -0.5, w: 0.7, h: 0.8, rot: -0.1 },
  { x: 0.2, z: -0.9, w: 1.4, h: 0.6, rot: 0 },
  { x: 2.5, z: 0.5, w: 0.9, h: 0.7, rot: 0.15 },
  { x: -2.0, z: 0.8, w: 0.6, h: 0.5, rot: 0 },
  { x: 1.0, z: 1.5, w: 1.1, h: 0.4, rot: 0.08 },
  { x: -0.3, z: -1.5, w: 0.8, h: 0.6, rot: -0.05 },
  { x: 3.0, z: -0.8, w: 0.7, h: 0.5, rot: 0 },
];

// ─── Mini buildings ──────────────────────────────────────────────────────────

function CityBuildings() {
  const buildings = useMemo(() => {
    const rng = (seed: number) => {
      const x = Math.sin(seed) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 60 }, (_, i) => ({
      x: (rng(i * 3.1) - 0.5) * 22,
      z: (rng(i * 7.3) - 0.5) * 15,
      w: 0.1 + rng(i * 2.1) * 0.3,
      d: 0.1 + rng(i * 5.7) * 0.3,
      h: 0.05 + rng(i * 11.3) * 0.4,
      bright: rng(i * 13.7) > 0.85,
    }));
  }, []);

  return (
    <>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={b.bright ? '#1e3a5f' : '#0d1a2e'}
            emissive={b.bright ? '#0a2040' : '#000'}
            emissiveIntensity={b.bright ? 0.5 : 0}
            roughness={0.8}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Main scene ──────────────────────────────────────────────────────────────

function Scene({
  routes,
  selectedRouteId,
}: {
  routes: Route[];
  selectedRouteId: string | null;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#1a3a6a" />
      <pointLight position={[-5, 4, -3]} intensity={0.4} color="#0a2040" />

      {/* Environment */}
      <Stars radius={80} depth={50} count={3000} factor={2} fade speed={0.5} />
      <CityGround />
      <CityBuildings />

      {/* Routes with per-segment traffic coloring */}
      {routes.map((route) => {
        const emphasized = selectedRouteId === route.id;
        const dimmed = selectedRouteId !== null && !emphasized;
        return (
          <group key={route.id}>
            <RouteTraffic route={route} emphasized={emphasized} dimmed={dimmed} />
            <RouteParticles route={route} hidden={dimmed} />
          </group>
        );
      })}

      {/* Map pins */}
      <MapPin lng={ORIGIN.lng} lat={ORIGIN.lat} color="#00ff88" />
      <MapPin lng={DESTINATION.lng} lat={DESTINATION.lat} color="#ff4444" />

      {/* Camera controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
        maxDistance={18}
        minDistance={2}
      />
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function TrafficMap({
  routes,
  selectedRouteId,
}: {
  routes: Route[];
  selectedRouteId: string | null;
}) {
  return (
    <Canvas
      camera={{ position: [0, 6.5, 7.5], fov: 55 }}
      style={{ background: '#020812' }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene routes={routes} selectedRouteId={selectedRouteId} />
    </Canvas>
  );
}
