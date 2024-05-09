import * as THREE from "three";

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Component, useRef, useState } from 'react';
import { Group, Mesh, Object3DEventMap } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import {
//     ChromaticAberration,
//     DepthOfField, 
//     EffectComposer, 
//     Noise,
//     SMAA,
// } from '@react-three/postprocessing';
import { OrbitControls, Environment } from '@react-three/drei';

const Cube = () => {
    const meshRef = useRef<Mesh>(null);

    const [isHovered, setIsHovered] = useState(false);

    useFrame((state, delta) => {
        const speed = isHovered ? 8 : 2;
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * speed;
            meshRef.current.rotation.y += delta * speed;
        }
    });

    return (
        <mesh
            ref={meshRef}
            onPointerEnter={(event) => (event.stopPropagation(), setIsHovered(true))}
            onPointerLeave={() => (setIsHovered(false))}
        >
            <boxGeometry args={[2, 2, 4]} />
            <meshStandardMaterial color={isHovered ? "lightblue" : "red"} />
        </mesh>
    );
};

// const groupRef = useRef<Group<Object3DEventMap>>(null);

const POS = (props: any) => {
    const gltf = useLoader(GLTFLoader, '../src/assets/3DModels/01-grouped.glb');
    //const { nodes, materials } = useLoader(GLTFLoader, '../src/assets/3DModels/01-grouped.glb');

    // Assign the loaded model to the group's children
    // useEffect(() => {
    //     if (gltf && gltf.scene) {
    //         if (groupRef.current) {
    //             groupRef.current.add(gltf.scene);
    //         }
    //     }
    // }, [gltf]);

    console.log(gltf.scene);
    
    // return <group ref={groupRef} />;
    return <primitive object={gltf.scenes[0]} />;
    // return (
    //     <group {...props} dispose={null}>
    //         <mesh castShadow receiveShadow geometry={nodes.A920.geometry} material={materials['Material.001']} />
    //         <mesh castShadow receiveShadow geometry={nodes.A920.geometry} material={materials['Material.002']} />
    //     </group>
    // )
};

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

const ThreeJSExample = () => {
    return (
        <Canvas
            camera={{
                position: [5, 5, -5], // Adjust camera position if needed
                fov: 75,
            }}
        >
            {/* <Environment preset="warehouse" /> */}
            <ambientLight intensity={2} />
            <directionalLight intensity={3} position={[20, 18, 20]} castShadow />
            <POS1 />
            <POS2 />
            <OrbitControls />
            {/*
                <EffectComposer>
                    <ChromaticAberration radialModulation={true} modulationOffset={0} />
                    <DepthOfField focusDistance={0} focalLength={0.005} bokehScale={1} height={480} />
                    <Noise opacity={0.01} />
                    <SMAA />
                </EffectComposer>
            */}
        </Canvas>
    );
}

export default ThreeJSExample;
