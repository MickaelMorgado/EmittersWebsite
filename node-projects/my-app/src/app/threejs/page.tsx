'use client';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import dynamic from 'next/dynamic';
import BlockChainVisualizer from './BlockChainVisualizer';
const WireframeGrid = dynamic(
  () => import('./WireframeGrid'),
  { ssr: false }
);

const ThreeJSCryptoVisualizerPage = () => {
return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <Leva hidden />
      <Canvas camera={{ position: [0, 10, 10], fov: 75 }}>
        <WireframeGrid />
        <BlockChainVisualizer />
      </Canvas>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
      </div>
    </div>
  );
};

export default ThreeJSCryptoVisualizerPage;
