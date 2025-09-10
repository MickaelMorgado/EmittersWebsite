'use client';
import {
  Box,
  CameraShake,
  Environment,
  Line,
  OrbitControls,
  Text
} from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useRef } from 'react';
import dataset from './dataset.json';

// Define node type
interface NodeType {
  name: string;
  blockchain?: string;
  token?: string;
  position: [number, number, number];
}

function Scene() {
  const nodes: NodeType[] = [];
  const edges: Array<[[number, number, number], [number, number, number]]> = [];

  // Build node and edge lists
  function traverse(
    obj: any,
    center: [number, number, number],
    radius: number,
    parentPos?: [number, number, number],
    level = 0
  ) {
    Object.entries(obj).forEach(([key, value], idx, arr) => {
      const angle = (idx / arr.length) * Math.PI * 2;
      const x = center[0] + Math.cos(angle) * radius;
      const z = center[2] + Math.sin(angle) * radius;
      const y = -level * 1;
      const pos: [number, number, number] = [x, y, z];
      const data = value as any;
      if (data.name) {
        nodes.push({ name: key.toUpperCase(), blockchain: data.blockchain, token: data.token, position: pos });
        if (parentPos) edges.push([parentPos, pos]);
        if (data.child) traverse(data.child, pos, radius / 1, pos, level + 0.75);
      } else {
        traverse(data, center, radius / 4, parentPos, level + 1);
      }
    });
  }
  traverse(dataset, [0, 0, 0], 10);

  const adjustedEdges = edges;

  // Leva UI props
  const materialProps = useControls({
    color: '#333333',
    opacity: { value: 0.9, min: 0, max: 1, step: 0.01 },
    thickness: { value: 0.15, min: 0, max: 3, step: 0.05 },
    roughness: { value: 0, min: 0, max: 1, step: 0.1 },
    transmission: { value: 0.9, min: 0, max: 1, step: 0.1 },
    ior: { value: 0.5, min: 0, max: 3, step: 0.1 },
    chromaticAberration: { value: 0.15, min: 0, max: 1 },
    backside: { value: true },
  });
  const textProps = useControls({ color: '#ff7300' });

  // Token color mapping
  const tokensList = Array.from(new Set(nodes.map(n => n.token).filter(Boolean))) as string[];
  const palette = ['#e6194b','#3cb44b','#ffe119','#0082c8','#f58231','#911eb4','#46f0f0','#f032e6','#d2f53c','#fabebe'];
  const tokenColors: Record<string, string> = {};
  tokensList.forEach((t, i) => { tokenColors[t] = palette[i % palette.length]; });

  // Refs for controls and light
  const controlsRef = useRef<any>(null);

  // Auto-target camera every 5 seconds and zoom in
  useEffect(() => {
    const iv = setInterval(() => {
      if (nodes.length && controlsRef.current) {
        const idx = Math.floor(Math.random() * nodes.length);
        const [x, y, z] = nodes[idx].position;
        controlsRef.current.target.set(x, y, z);
        controlsRef.current.update();
        // Zoom camera closer to the target
        controlsRef.current.object.position.set(x, y, z + 2);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [nodes]);

  // LOD-enabled node component
  function NodeLOD({ n, idx }: { n: NodeType; idx: number }) {
    const meshRef = useRef<any>(null);
    const text1Ref = useRef<any>(null);
    const text2Ref = useRef<any>(null);
    const { camera } = useThree();
    useFrame(() => {
      if (!meshRef.current) return;
      const distance = meshRef.current.position.distanceTo(camera.position);
      const baseTrans = materialProps.transmission;
      const baseOpac = materialProps.opacity;
      if (distance > 20) {
        meshRef.current.material.transmission = 1;
        meshRef.current.material.opacity = 0.5;
        meshRef.current.material.ior = 0;
        if (text1Ref.current) text1Ref.current.visible = false;
        if (text2Ref.current) text2Ref.current.visible = false;
      } else {
        meshRef.current.material.transmission = baseTrans;
        meshRef.current.material.opacity = baseOpac;
        if (text1Ref.current) text1Ref.current.visible = true;
        if (text2Ref.current) text2Ref.current.visible = true;
      }
    });
    return (
      <group key={idx} position={n.position}>
        <Box ref={meshRef} args={[1, 0.6, 0.05]}>
          {/* <MeshTransmissionMaterial {...materialProps} /> */}
        </Box>
        <Text
          ref={text1Ref}
          position={[-0.4, 0.1, 0.03]}
          fontSize={0.1}
          color={n.token ? tokenColors[n.token] : textProps.color}
          anchorX="left"
          anchorY="middle"
        >
          {n.name}
        </Text>
        <Text
          ref={text2Ref}
          position={[-0.4, -0.1, 0.03]}
          fontSize={0.05}
          color={n.token ? tokenColors[n.token] : textProps.color}
          anchorX="left"
          anchorY="middle"
        >
          {n.name ? `NAME: ${n.name}` : ''}
          {n.blockchain ? `\nBLOCKCHAIN: ${n.blockchain}` : ''}
          {n.token ? `\nTOKEN: ${n.token}` : ''}
        </Text>
      </group>
    );
  }

  return (
    <>
      <ambientLight intensity={1} />
      {/*<Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade /> */}
      
      {adjustedEdges.map(([s,e], i) => (
        <Line key={i} points={[s,e]} color="#333" lineWidth={1} />
      ))}

      {nodes.map((n, i) => (
        <NodeLOD key={i} n={n} idx={i} />
      ))}

      <OrbitControls ref={controlsRef} makeDefault autoRotateSpeed={0.1} zoomSpeed={1} />
    </>
  );
}

const ThreeJSCryptoVisualizer = () => (
  <div className="fixed inset-0 w-full h-full bg-black">
    <Canvas camera={{ position: [0, 0, 10], fov: 75 }} style={{ width: '100%', height: '100%' }}>
      <Scene />
      {/*<CameraSwing amplitude={3} frequency={.25} /> */}
      <Environment preset="city" environmentIntensity={0.1} />
      <CameraShake yawFrequency={1} maxYaw={0.05} pitchFrequency={1} maxPitch={0.05} rollFrequency={0.5} maxRoll={0.5} intensity={0.2} />
    </Canvas>
  </div>
);

export default ThreeJSCryptoVisualizer;
