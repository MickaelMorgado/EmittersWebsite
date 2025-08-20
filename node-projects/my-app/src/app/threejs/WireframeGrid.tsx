'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function WireframeGrid() {
  const gridRef = useRef<THREE.GridHelper>(null!);

  useFrame(() => {
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.0008;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[2000, 100, 0xffff00, 0xffffff]}
      material-opacity={.2}
      material-transparent={true}
    />
  );
}
