'use client';

import { Box, Environment, MeshTransmissionMaterial, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { useRef } from 'react';
import * as THREE from 'three';

// Define node type
interface NodeType {
  name: string;
  blockchain?: string;
  token?: string;
  position: [number, number, number];
}

export default function BlockChainVisualizer() {
  const nodes: NodeType[] = [
    { position: [0, 0, 0], name: 'Block 1290912' },
    { position: [6, 0, 0], name: 'Block 1290911' },
    { position: [12, 0, 0], name: 'Block 1290899' },
    { position: [18, 0, 0], name: 'Block 1290898' },
    { position: [24, 0, 0], name: 'Block 1290897' },
    { position: [30, 0, 0], name: 'Block 1290896' },
    { position: [36, 0, 0], name: 'Block 1290895' },
    { position: [42, 0, 0], name: 'Block 1290894' },
    { position: [48, 0, 0], name: 'Block 1290893' },
    { position: [54, 0, 0], name: 'Block 1290892' },
    { position: [60, 0, 0], name: 'Block 1290891' },
    { position: [66, 0, 0], name: 'Block 1290890' },
    { position: [72, 0, 0], name: 'Block 1290889' },
    { position: [78, 0, 0], name: 'Block 1290888' },
    { position: [84, 0, 0], name: 'Block 1290887' },
    { position: [90, 0, 0], name: 'Block 1290886' },
    { position: [96, 0, 0], name: 'Block 1290885' },
    { position: [102, 0, 0], name: 'Block 1290884' },
    { position: [108, 0, 0], name: 'Block 1290883' },
    { position: [114, 0, 0], name: 'Block 1290882' },
    { position: [120, 0, 0], name: 'Block 1290881' },
    { position: [126, 0, 0], name: 'Block 1290880' }
  ];

  const materialProps = useControls({
    color: '#ffc900',
    opacity: { value: 1, min: 0, max: 1, step: 0.01 },
    thickness: { value: 0.3, min: 0, max: 3, step: 0.05 },
    roughness: { value: 0, min: 0, max: 1, step: 0.1 },
    transmission: { value: 0.9, min: 0, max: 1, step: 0.1 },
    ior: { value: 2.3, min: 0, max: 3, step: 0.1 },
    chromaticAberration: { value: 0.45, min: 0, max: 1 },
    backside: { value: false },
  });

  const groupRef = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008;
    }
  });


  return (
    <group ref={groupRef}>
      <ambientLight intensity={1} />
      {nodes.map((n, i) => (
        <group key={i} position={n.position}>
          <Box args={[3, 3, 3]}>
            <MeshTransmissionMaterial {...materialProps} />
          </Box>
          <Text
            position={[-1, 0.3, 0.03]}
            fontSize={0.5}
            color="orange"
            anchorX="left"
            anchorY="middle"
          >
            Block {i}
          </Text>
          <Text
            position={[-1, -0.1, 0.03]}
            fontSize={.4}
            color="orange"
            anchorX="left"
            anchorY="middle"
          >
            {'Lorem ipsum dolor \nfsnfnsf sdfnsf \nsdfsdfsdf'}
          </Text>
        </group>
      ))}
      <Environment preset="city" environmentIntensity={0.1} />
    </group>
  );
}
