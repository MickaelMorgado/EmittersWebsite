"use client";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense } from "react";
import * as THREE from "three";

export default function Main3DModel() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: "transparent", width: "100vw", height: "100vh" }}
        shadows
      >
        <Environment preset="studio" environmentIntensity={0.05} />
        <ambientLight intensity={0.5} color={0xff0000} />
        <directionalLight position={[1, 1, 1]} intensity={1} />

        <Suspense fallback={null}>
          <mesh position={[0, 8, 0]} scale={14}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshStandardMaterial
              color={new THREE.Color(0xff0000)}
              metalness={1}
              roughness={.2}
              transparent
              opacity={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.4}
              luminanceSmoothing={0.1}
              height={300}
              intensity={1}
              radius={0.4}
            />
          </EffectComposer>
        </Suspense>

        <OrbitControls enableDamping enableZoom={false} autoRotate autoRotateSpeed={2.0} />
      </Canvas>
    </div>
  );
}
