"use client";
import { Environment, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { metalMaterialParams, redMaterialParams } from "./constants";

import { Mesh, Object3D } from "three";

function CodeModel(props: any) {
  const group = useRef<Object3D>(null!);
  const { scene, animations } = useGLTF("/assets/models/Code.gltf");
  const { actions, mixer } = useAnimations(animations, group);

  // Set up glow on specific parts
  scene.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const meshIndex = mesh.parent?.children.indexOf(mesh);
      if (meshIndex === 2) {
        mesh.material = new THREE.MeshStandardMaterial({...redMaterialParams});
      } else {
        mesh.material = new THREE.MeshStandardMaterial({...metalMaterialParams});
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

  // Play all animations
  useFrame((state, delta) => {
    mixer?.update(delta);
  });

  return <primitive ref={group} object={scene} scale={1.5} position={[0, -2, 0]} {...props} />;
}

export default function Code3D() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 5, 17], fov: 75 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        shadows
      >
        <Environment preset="studio" environmentIntensity={0.05} />
        <ambientLight intensity={0.5} color={0xff0000} />
        <directionalLight position={[1, 1, 1]} intensity={1} />
        <Suspense fallback={null}>
          <CodeModel />
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
