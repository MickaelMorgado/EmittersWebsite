"use client"

import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"


interface GalaxyProps {
  count: number
  spacing: number
  color: string
}

function Galaxy({ count, spacing, color }: GalaxyProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  const positions = useMemo(() => {
    const temp = new THREE.Object3D()
    const positions = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 8
      const radius = Math.pow(Math.random(), 0.5) * (25 * spacing)
      const armOffset = (i % 3) * ((Math.PI * 2) / 3)

      const x = Math.cos(angle + armOffset) * radius + (Math.random() - 0.5) * (5 * spacing)
      const z = Math.sin(angle + armOffset) * radius + (Math.random() - 0.5) * (5 * spacing)
      const y = (Math.random() - 0.5) * (4 * spacing)

      temp.position.set(x, y, z)
      temp.scale.setScalar(Math.random() * 0.5 + 0.5)
      temp.updateMatrix()

      positions.push(temp.matrix.clone())
    }

    return positions
  }, [count, spacing])

  useFrame((state) => {
    if (meshRef.current) {
      positions.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true

      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  )
}

export default function GalaxyVisualization() {
  const [inputValue, setInputValue] = useState<string>("10000")
  const [visualizedNumber, setVisualizedNumber] = useState<number>(0)
  const [spacing, setSpacing] = useState<number>(1)
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff")

  const colorOptions = [
    { value: "#ffffff", label: "White" },
    { value: "#ff6b6b", label: "Red" },
    { value: "#4ecdc4", label: "Cyan" },
    { value: "#45b7d1", label: "Blue" },
    { value: "#96ceb4", label: "Green" },
    { value: "#feca57", label: "Yellow" },
    { value: "#ff9ff3", label: "Pink" },
    { value: "#a29bfe", label: "Purple" },
    { value: "#fd79a8", label: "Rose" },
    { value: "#fdcb6e", label: "Orange" },
  ]

  const handleVisualize = () => {
    const num = Number.parseInt(inputValue)
    if (!isNaN(num) && num > 0 && num <= 21000000) {
      setVisualizedNumber(num)
    }
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute top-30 left-1/2 transform -translate-x-1/2 z-10 flex flex-col gap-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
        <div className="flex">This is a data (counter) visualizer. <br />Tell me what number would you like to see!</div>
        <div className="flex gap-4 ">
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs">Count</label>
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter number (1-21,000,000)"
              className="w-32 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              min="1"
              max="21000000"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs">Space</label>
            <Input
              type="number"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
              placeholder="Spacing"
              className="w-20 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              min="0.1"
              max="5"
              step="0.1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs">Color</label>
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger className="w-24 bg-white/10 text-white border-white/20 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border-white/20">
                {colorOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-white/20 focus:bg-white/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: option.value }} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleVisualize} variant="secondary">
            Visualize
          </Button>
        </div>
      </div>

      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 20, 50], fov: 60 }}>
          <color attach="background" args={["#000000"]} />

          {/*<Stars radius={300} depth={50} count={1000} factor={4} saturation={0} fade />*/}

          {visualizedNumber > 0 && <Galaxy count={visualizedNumber} spacing={spacing} color={selectedColor} />}

          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

          <EffectComposer>
            {/*<DepthOfField focusDistance={0.5} focalLength={1} bokehScale={30} />*/}
            <Bloom luminanceThreshold={0} luminanceSmoothing={1} height={100} intensity={10} />
            <Vignette eskil={false} offset={0.001} darkness={1} />
            <Noise opacity={0.04} />
          </EffectComposer>
        </Canvas>
      </div>
    </div>
  )
}
