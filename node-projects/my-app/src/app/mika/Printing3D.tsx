"use client";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

import { Mesh, Object3D } from "three";

function PrintingModel(props: any) {
  const group = useRef<Object3D>(null!);
  const { scene, animations } = useGLTF("/tools/js/threejs/models/A1Mini.gltf");
  const { actions, mixer } = useAnimations(animations, group);

  // Set up glow on specific parts
  scene.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      mesh.material = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.7,
        metalness: 0.3,
      });
      if (mesh.name === "head" || mesh.name.includes("nozzle")) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 2.0,
          roughness: 0.3,
          metalness: 0.8,
        });
      }
    }
  });

  // Play all animations explicitly on mount
  useEffect(() => {
    if (mixer && animations.length > 0) {
      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      });
    }
  }, [mixer, animations]);

  // Update animation mixer on each frame
  useFrame((state, delta) => {
    mixer?.update(delta);
  });

  return <primitive ref={group} object={scene} scale={1.1} position={[0, -2, 0]} {...props} />;
}

export default function Printing3D() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        shadows
        onCreated={({ gl }) => {
          gl.setScissorTest(false);
          gl.getContext().disable(gl.getContext().STENCIL_TEST);
        }}
      >
        <ambientLight intensity={0.5} color={0xff0000} />
        <directionalLight position={[1, 1, 1]} intensity={1} />
        <Suspense fallback={null}>
          <PrintingModel />
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.4}
              luminanceSmoothing={0.1}
              height={300}
              intensity={1}
              radius={0.8}
            />
          </EffectComposer>
        </Suspense>
        <OrbitControls enableDamping enableZoom={false} autoRotate autoRotateSpeed={1.0} />
      </Canvas>
    </div>
  );
}
