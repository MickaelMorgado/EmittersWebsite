"use client"

import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

export type GalaxyAnimationState = 'idle' | 'listening' | 'processing' | 'speaking' | 'event'

interface GalaxyProps {
  count: number
  spacing: number
  color: string
  animationState: GalaxyAnimationState
}

export function Galaxy({ count, spacing, color, animationState }: GalaxyProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const [dummy] = useState(() => new THREE.Object3D())
  const [originalPositions, setOriginalPositions] = useState<THREE.Vector3[]>([])

  // Animation parameters based on state
  const getAnimationParams = () => {
    switch (animationState) {
      case 'listening':
        return { speed: 0.002, multiplier: 1, rotationSpeed: 0.002 }
      case 'processing':
        return { speed: 0.004, multiplier: 0.3, rotationSpeed: 0.004 }
      case 'speaking':
        return { speed: 0.010, multiplier: 6, rotationSpeed: 0.010 }
      case 'event':
        return { speed: 0.020, multiplier: 15, rotationSpeed: 0.050 }
      default: // idle
        return { speed: 0.0002, multiplier: 4, rotationSpeed: 0.0002 }
    }
  }

  const { speed, multiplier, rotationSpeed } = getAnimationParams()

  useEffect(() => {
    if (meshRef.current) {
      const newOriginalPositions: THREE.Vector3[] = []

      // Initialize particle positions
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 8
        const radius = Math.pow(Math.random(), 0.5) * (25 * spacing)
        const armOffset = (i % 3) * ((Math.PI * 2) / 3)

        const x = Math.cos(angle + armOffset) * radius + (Math.random() - 0.5) * (5 * spacing)
        const z = Math.sin(angle + armOffset) * radius + (Math.random() - 0.5) * (5 * spacing)
        const y = (Math.random() - 0.5) * (4 * spacing)

        // Store original positions for restoration
        newOriginalPositions.push(new THREE.Vector3(x, y, z))

        dummy.position.set(x, y, z)
        dummy.scale.setScalar(Math.random() * 0.05 + 0.05)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }

      setOriginalPositions(newOriginalPositions)
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [count, spacing, dummy])

  // Animation loop
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime

      // Update particle positions and animations
      for (let i = 0; i < count; i++) {
        meshRef.current.getMatrixAt(i, dummy.matrix)
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)

        // Movement with multiplier
        const offsetX = Math.sin(time * 0.5 + i * 0.1) * 0.5 * 5 * multiplier
        const offsetY = Math.cos(time * 0.3 + i * 0.15) * 0.3 * 0.5 * multiplier
        const offsetZ = Math.sin(time * 0.7 + i * 0.05) * 0.4 * 1.5 * multiplier

        dummy.position.x += offsetX
        dummy.position.y += offsetY
        dummy.position.z += offsetZ

        // Strong spherical constraint to maintain galaxy shape
        const distanceFromCenter = Math.sqrt(
          dummy.position.x * dummy.position.x +
          dummy.position.y * dummy.position.y +
          dummy.position.z * dummy.position.z
        )

        // Use stored original position for restoration
        const originalPos = originalPositions[i]
        if (originalPos) {
          const maxRadius = 30

          // Hard boundary enforcement - keep particles within spherical bounds
          if (distanceFromCenter > maxRadius) {
            const normalizedX = dummy.position.x / distanceFromCenter
            const normalizedY = dummy.position.y / distanceFromCenter
            const normalizedZ = dummy.position.z / distanceFromCenter

            dummy.position.x = normalizedX * maxRadius
            dummy.position.y = normalizedY * maxRadius
            dummy.position.z = normalizedZ * maxRadius
          }

          // Strong restoration force toward original position
          const restorationStrength = (animationState === 'speaking' || animationState === 'event') ? 0.05 : 0.02
          const pullStrength = restorationStrength * (multiplier > 1 ? multiplier * 0.1 : 1)

          dummy.position.x += (originalPos.x - dummy.position.x) * pullStrength
          dummy.position.y += (originalPos.y - dummy.position.y) * pullStrength
          dummy.position.z += (originalPos.z - dummy.position.z) * pullStrength
        }

        // Processing contraction effect for idle state
        if (multiplier < 0.5) {
          const contractionFactor = 0.99
          dummy.position.x *= contractionFactor
          dummy.position.y *= contractionFactor
          dummy.position.z *= contractionFactor
        }

        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }

      meshRef.current.instanceMatrix.needsUpdate = true

      // Apply rotation based on animation state
      meshRef.current.rotation.y += rotationSpeed
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.8, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  )
}
