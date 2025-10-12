"use client";
import { Environment, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useRef } from "react";
import * as THREE from "three";

import { Mesh, Object3D } from "three";
import { metalMaterialParams, redMaterialParams } from "./constants";

function AquariumModel(props: any) {
  const group = useRef<Object3D>(null!);
  const { scene, animations } = useGLTF("/assets/models/Aquarium.gltf");
  const { actions, mixer } = useAnimations(animations, group);


  // Set up glow on specific parts
  scene.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const meshIndex = mesh.parent?.children.indexOf(mesh);
      if (meshIndex === 1 || meshIndex === 2 || meshIndex === 3) {
        mesh.material = new THREE.MeshStandardMaterial({...redMaterialParams});
      } else {
        mesh.material = new THREE.MeshStandardMaterial({...metalMaterialParams});
      }
    }
  });

  // Play all animations
  useFrame((state, delta) => {
    mixer?.update(delta);
  });

  return <primitive ref={group} object={scene} scale={0.35} position={[0, -2, 0]} {...props} />;
}

export default function Aquarium3D() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        shadows
      >
                <Environment preset="studio" environmentIntensity={0.05} />
        <ambientLight intensity={0.5} color={0xff0000} />
        <directionalLight position={[1, 1, 1]} intensity={1} />
        <Suspense fallback={null}>
          <AquariumModel />
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
        <OrbitControls enableDamping enableZoom={false} autoRotate autoRotateSpeed={1.0} />
      </Canvas>
    </div>
  );
}
