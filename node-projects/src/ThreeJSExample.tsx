import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Group, Mesh, Object3DEventMap } from 'three';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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

const A3DModel = () => {
    const gltf = useLoader(GLTFLoader, '../src/assets/3DModels/01.glb');

    // Assign the loaded model to the group's children
    // useEffect(() => {
    //     if (gltf && gltf.scene) {
    //         if (groupRef.current) {
    //             groupRef.current.add(gltf.scene);
    //         }
    //     }
    // }, [gltf]);

    // return <group ref={groupRef} />;
    return <primitive object={gltf.scene} />;
};

const ThreeJSExample = () => {
    return (
        <Canvas
            camera={{
                position: [5, 5, -5], // Adjust camera position if needed
                fov: 75,
            }}
        >
            <ambientLight intensity={2} />
            <pointLight position={[10, 10, 10]} />
            <A3DModel />
            <OrbitControls />
        </Canvas>
    );
}

export default ThreeJSExample;
