import * as THREE from "three";
import { AnimationMixer, DoubleSide } from "three";
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Component, useRef } from 'react';
import { Group, Mesh, Object3DEventMap } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Environment } from '@react-three/drei';

gsap.registerPlugin(ScrollTrigger);

const MyGLTFModel = () => {
    const modelRef = useRef();
    const mixerRef = useRef();

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
    });

    // Set scale and add the model to the scene
    gltf.scene.scale.set(0.35, 0.35, 0.35);

    // Create animation mixer
    if (!mixerRef.current) {
        mixerRef.current = new AnimationMixer(gltf.scene);
    }

    // Play animation
    useFrame((_, delta) => {
        if (mixerRef.current) mixerRef.current.update(delta);
    });
    debugger
    if (gltf.animations[0]) {
        // Play specific animation
        const action = mixerRef.current?.clipAction(gltf.animations[0]);
        if (action) {
            action.play();
            action.paused = true;
        }
    
        if (mixerRef.current) createAnimation(mixerRef.current, action, gltf.animations[0], 1.5);
    }

    return <primitive object={gltf.scene} ref={modelRef} />;
};

const createAnimation = (mixer, action, clip, animationSpeed=1) => {
    let proxy = {
        get time() {
            return mixer.time;
        },
        set time(value) {
            action.paused = false;
            mixer.setTime(value);
            action.paused = true;
        }
    };

    let scrollingTL = gsap.timeline({
        scrollTrigger: {
            trigger: document.getElementById("website-content"),
            start: "top",
            end: "bottom",
            pin: false,
            // scrub: true,
            // markers: true,
            onUpdate: function ({ progress }) {
                const normalizedProgress = Math.max(0, Math.min(clip.duration - 0.01, progress * clip.duration * animationSpeed));

                proxy.time = normalizedProgress;
                // console.log(`${proxy.time}, ${normalizedProgress}, ${clip.duration}`)
            }
        }
    });

    // scrollingTL.to(proxy, {
    //     time: clip.duration,
    //     // repeat: 3,
    // });
};

// const groupRef = useRef<Group<Object3DEventMap>>(null);

/*
    const POSModel = ({ modelPath }: { modelPath: string }) => {
        const gltf = useLoader(GLTFLoader, modelPath);
        console.log(gltf.scene);

        return <primitive object={gltf.scene} />;
    }

    const POS1 = () => {
        const modelPath = "../src/assets/3DModels/pos1.glb";
        return (
            <>
                <POSModel modelPath={modelPath} />
            </>
        );
    };

    const POS2 = () => {
        const modelPath = "../src/assets/3DModels/pos2.glb";
        return (
            <>
                <POSModel modelPath={modelPath} />
            </>
        );
    };

    const POS3 = () => {
        const modelPath = "../src/assets/3DModels/StabilizedNewPOSWithAnimations.glb";
        return (
            <>
                <POSModel modelPath={modelPath} />
            </>
        );
    };
*/

const ThreeJSExample = () => {
    return (
        <div id="floating-canvas">
            <Canvas
                camera={{
                    position: [1, 0, 0],
                    fov: 75,
                }}
                style={{ pointerEvents: 'none' }}
            >
                <Environment preset="studio" environmentIntensity={.15} />
                <ambientLight intensity={10} />
                <directionalLight intensity={5} position={[20, 30, 0]} />
                <MyGLTFModel />
                <OrbitControls enableZoom={false} />
            </Canvas>
        </div>
    );
}

export default ThreeJSExample;
