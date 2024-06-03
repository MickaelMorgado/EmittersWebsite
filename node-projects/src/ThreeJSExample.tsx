import * as THREE from "three";
import { AnimationMixer, DoubleSide } from "three";
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CameraShake, Environment } from '@react-three/drei';

gsap.registerPlugin(ScrollTrigger);

let scrollProgress = 0;

// Created my own type to add mixer and action on each object and control them:
type Modified3DObject = THREE.Object3D & {
    mixer?: AnimationMixer;
    animationAction?: THREE.AnimationAction;
};

const animationProgress = (
    progress: number,
    action: THREE.AnimationAction
) => {
    const clipDuration = action.getClip().duration;
    const normalizedProgress = Math.max(0, Math.min(clipDuration - 0.01, progress * clipDuration * 1.6));

    return normalizedProgress;
}

const MyGLTFScene = () => {
    const modelRef = useRef();
    let updatedModels: Modified3DObject[] = [];

    // Load GLTF model
    const gltf = useLoader(GLTFLoader, '../src/assets/3DModels/StabilizedNewDoublePOSWithAnimations.glb');

    // Traverse through the loaded model to set properties
    gltf.scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.material.side = DoubleSide;
            node.material.metalness = 0.9;
            node.material.roughness = 0.7;

            if (node.material.name === "Glass") {
                node.material.metalness = 1;
                node.material.roughness = 0;
                node.material.transparent = true;
            }

            if (node.material.name === "Glass dark.002") {
                node.material.metalness = 1;
                node.material.roughness = 0;
                node.material.opacity = 0;
                node.material.transparent = true;
            }
            
            if (node.material.name === "Glossy Plastic") {
                node.material.metalness = 1;
                node.material.roughness = 0;
            }
            
            if (node.material.name === "Glossy Plastic.001") {
                node.material.metalness = 1;
                node.material.roughness = 0;
            }

        }
        
        //const blackPOS = gltf.scene.getObjectByName("Black POS"); // node.children[1].children[0].children[0].children[6].material 

    });

    const blackPOS = gltf.scene.getObjectByName("POSAnimationHook001");
    blackPOS.children[0].children[0].children[3].material = new THREE.MeshStandardMaterial({ color: 0x000000 });

    gltf.scene.children.forEach((child: Modified3DObject) => {
        if (child.name === 'POSAnimationHook') {
            if (gltf.animations.length > 0) {
                const animation = gltf.animations[0];
                const mixer = new THREE.AnimationMixer(child);
                const action = mixer.clipAction(animation);
                action.play();
                action.paused = true;

                child.mixer = mixer;
                child.animationAction = action;

                updatedModels.push(child);

                useFrame((_, delta) => {
                    if (mixer) {
                        action.paused = false;
                        mixer.setTime(animationProgress(scrollProgress, action));
                        action.paused = true;
                    }
                });
            }
        }
        if (child.name === 'POSAnimationHook001') {
            if (gltf.animations.length > 0) {
                const animation = gltf.animations[1];
                const mixer = new THREE.AnimationMixer(child);
                const action = mixer.clipAction(animation);
                action.play();
                action.paused = true;

                child.mixer = mixer;
                child.animationAction = action;

                updatedModels.push(child);

                useFrame((_, delta) => {
                    if (mixer) {
                        action.paused = false;
                        mixer.setTime(animationProgress(scrollProgress, action));
                        action.paused = true;
                    }
                });
            }
        }
    });

    // Set scale and add the model to the scene
    gltf.scene.scale.set(0.35, 0.35, 0.35);

    gsap.timeline({
        scrollTrigger: {
            trigger: document.getElementById("website-content"),
            start: "top",
            end: "bottom",
            pin: false,
            scrub: true,
            // markers: true,
            onUpdate: function ({ progress }) {
                scrollProgress = progress;
            }
        },
    });

    return <primitive object={gltf.scene} ref={modelRef} />;
};


const ThreeJSExample = () => {
    return (
        <div id="floating-canvas">
            <Canvas
                camera={
                    {
                        fov: 40,
                        position: [2, 0.05, 0.15],
                        rotation: new THREE.Euler(0, 1.5, 0, 'XYZ'),
                    }
                }
                style={{ pointerEvents: 'none' }}
            >
                <CameraShake
                    maxPitch={0.05}
                    maxRoll={0}
                    maxYaw={0}
                    pitchFrequency={0.2}
                    rollFrequency={0}
                    yawFrequency={0}
                />
                <Environment preset="studio" environmentIntensity={.15} />
                <ambientLight intensity={10} />
                <directionalLight intensity={5} position={[20, 30, 0]} />
                <MyGLTFScene />
            </Canvas>
        </div>
    );
}

export default ThreeJSExample;
