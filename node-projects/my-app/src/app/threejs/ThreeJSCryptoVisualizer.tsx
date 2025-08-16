'use client';

import { Box, CameraShake, Environment, MeshTransmissionMaterial, OrbitControls, Stars, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import dataset from './dataset.json';

// Define the node type interface
interface NodeType {
  name: string;
  layer?: string;
  blockchain?: string;
  position: [number, number, number];
}

function CameraSwing({ amplitude = 5, frequency = 1 }: { amplitude?: number; frequency?: number }) {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    camera.position.x = Math.sin(clock.getElapsedTime() * frequency) * amplitude;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Scene component
function Scene() {
  // Build nodes recursively based on dataset hierarchy
  const nodes: NodeType[] = [];
  function traverse(obj: any, center: [number, number, number], radius: number) {
    const entries = Object.entries(obj);
    entries.forEach(([key, value], idx) => {
      const angle = (idx / entries.length) * Math.PI * 2;
      const pos: [number, number, number] = [
        center[0] + Math.cos(angle) * radius,
        0,
        center[2] + Math.sin(angle) * radius,
      ];
      const nodeData = value as any;
      if (nodeData.name) {
        nodes.push({
          name: key.toUpperCase(),
          blockchain: nodeData.blockchain,
          position: pos,
        });
        // If this entry has children, recurse with smaller radius
        if (nodeData.child) {
          traverse(nodeData.child, pos, radius / 2);
        }
      } else {
        // Dive deeper if no direct name property
        traverse(nodeData, pos, radius / 2);
      }
    });
  }
  traverse(dataset, [0, 0, 0], 5);

  // Leva controls for material and text
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

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      <pointLight position={[0, 0, 0]} intensity={100} />

      {nodes.map((node, index) => (
        <group key={index} position={node.position}>
          <Box position={[0, 0, 0]} args={[1, 0.6, 0.05]}>
            <MeshTransmissionMaterial {...materialProps} />
            <Text
              position={[-0.4, 0, 0.03]}
              fontSize={0.1}
              color="#ff7300"
              anchorX="left"
              anchorY="middle"
            >
              {node.name}
            </Text>
            <Text
              position={[-0.4, -0.1, 0.03]}
              fontSize={0.05}
              anchorX="left"
              anchorY="middle"
            >
              {node.blockchain ? `BLOCKCHAINS: ${node.blockchain}` : ''}
            </Text>
          </Box>
        </group>
      ))}

      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
}

const ThreeJSCryptoVisualizer = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }} style={{ width: '100%', height: '100%' }}>
        <Scene />
        {/*<CameraSwing amplitude={1} frequency={0.75} /> */}
        <directionalLight intensity={2} position={[0, 2, 3]} />
        <Environment preset="city" environmentIntensity={0.1} />
        <OrbitControls makeDefault autoRotateSpeed={0.1} zoomSpeed={0.1} />
        <CameraShake
          yawFrequency={1}
          maxYaw={0.05}
          pitchFrequency={1}
          maxPitch={0.05}
          rollFrequency={0.5}
          maxRoll={0.5}
          intensity={0.2}
        />
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 text-white z-10">
        <h1 className="text-2xl font-bold mb-2">Three.js Full Screen</h1>
        <p className="text-sm opacity-75">Use mouse to orbit, zoom, and pan</p>
      </div>
      <div className="absolute bottom-4 right-4 text-white text-xs opacity-50 z-10">
        <p>Left click + drag: Rotate</p>
        <p>Right click + drag: Pan</p>
        <p>Scroll: Zoom</p>
      </div>
    </div>
  );
};

export default ThreeJSCryptoVisualizer;
