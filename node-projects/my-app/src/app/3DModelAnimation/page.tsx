"use client"

import { Environment, OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import { useEffect, useState } from "react"
import * as THREE from "three"

function CodeModel(props: JSX.IntrinsicElements["group"]) {
  const { scene } = useGLTF("/3DModelAnimation/A1Mini.gltf")
  const [clippingPlane, setClippingPlane] = useState<THREE.Plane>(
    () => new THREE.Plane(new THREE.Vector3(0, -3, 0), 0) // flip Y so it builds upward
  )

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        ;(child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.7,
          metalness: 0.3,
          clippingPlanes: [clippingPlane],
          clipShadows: true,
        })
      }
    })

    // Delay start (e.g., 1.5s)
    const delay = 1500
    setTimeout(() => {
      let progress = -5 // start below ground
      const target = 5   // how high the reveal goes
      const step = 0.01  // animation speed

      const animate = () => {
        progress += step
        clippingPlane.constant = progress
        if (progress < target) requestAnimationFrame(animate)
      }
      animate()
    }, delay)
  }, [scene, clippingPlane])

  return <primitive object={scene} scale={1.5} position={[0, -2, 0]} {...props} />
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
    { value: "#55FF55", label: "Green" },
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
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [10, 10, 15], fov: 80, near: 1.0 }}
          gl={{ localClippingEnabled: true }} // enable clipping globally
        >
          <color attach="background" args={["#000000"]} />

          <Environment
            files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr"
            background={false}
            environmentIntensity={0.4}
          />

          {/* 3D model */}
          <ambientLight color={0xffffff} intensity={0.1} />
          <CodeModel />

          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

          <EffectComposer>
            <Bloom luminanceThreshold={0} luminanceSmoothing={1} height={100} intensity={10} />
            <Vignette eskil={false} offset={0.001} darkness={1} />
            <Noise opacity={0.01} />
          </EffectComposer>
        </Canvas>
      </div>
    </div>
  )
}
