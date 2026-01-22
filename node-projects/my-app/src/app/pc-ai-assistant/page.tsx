"use client"

import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useRef, useState } from "react"
import { io, Socket } from 'socket.io-client'
import * as THREE from "three"

// Galaxy Component
interface GalaxyProps {
  count: number
  spacing: number
  color: string
  animationState: 'idle' | 'listening' | 'processing' | 'speaking'
}

function Galaxy({ count, spacing, color, animationState }: GalaxyProps) {
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
      default: // idle
        return { speed: 0.0002, multiplier: 4, rotationSpeed: 0.0002 }
    }
  }

  const { speed, multiplier, rotationSpeed } = getAnimationParams()

  useEffect(() => {
    console.log(`Galaxy: Initializing ${count} particles with spacing ${spacing}`)

    if (meshRef.current) {
      try {
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

        console.log('Galaxy: Particles initialized successfully')
      } catch (error) {
        console.error('Galaxy: Error initializing particles:', error)
      }
    } else {
      console.warn('Galaxy: Mesh ref not available during initialization')
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
          const originalDistance = originalPos.length()
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
          const restorationStrength = animationState === 'speaking' ? 0.05 : 0.02
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

// Main PC AI Assistant Component
export default function PCAIAssistant() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [status, setStatus] = useState('Ready 🎨')
  const [animationState, setAnimationState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [particleColor, setParticleColor] = useState('#ffffff')
  const [inputMessage, setInputMessage] = useState('')
  const [conversationLines, setConversationLines] = useState<string[]>([])

  useEffect(() => {
    console.log('PC AI Assistant: Initializing Socket.io connection...')

    try {
      // Initialize Socket.io connection
      const newSocket = io('http://localhost:3001', {
        transports: ['websocket', 'polling']
      })
      setSocket(newSocket)

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('PC AI Assistant: Connected to voice server')
        setStatus('Connected 🎨')
      })

      newSocket.on('disconnect', () => {
        console.log('PC AI Assistant: Disconnected from voice server')
        setStatus('Disconnected ⚠️')
      })

      newSocket.on('connect_error', (error) => {
        console.error('PC AI Assistant: Socket connection error:', error)
        setStatus('Connection Error ❌')
      })

      // Socket event handlers
      newSocket.on('speech_start', () => {
        console.log('PC AI Assistant: Speech start event received')
        setAnimationState('listening')
        setParticleColor('#ff0000')
        setStatus('Listening... 🔴')
      })

      newSocket.on('speech_end', () => {
        console.log('PC AI Assistant: Speech end event received')
        setAnimationState('processing')
        setParticleColor('#0000ff')
        setStatus('Processing... 🔵')
      })

      newSocket.on('ai_response_start', () => {
        console.log('PC AI Assistant: AI response start event received')
        setAnimationState('speaking')
        setParticleColor('#00ff00')
        setStatus('Speaking... 🟢')
      })

      newSocket.on('ai_response_end', () => {
        console.log('PC AI Assistant: AI response end event received')
        setAnimationState('idle')
        setParticleColor('#ffffff')
        setStatus('Ready 🎨')
      })

      // Conversation text events
      newSocket.on('user_speech', (text: string) => {
        console.log('PC AI Assistant: User speech received:', text)
        addConversationText(`You: ${text}`)
      })

      newSocket.on('ai_response', (text: string) => {
        console.log('PC AI Assistant: AI response text received:', text)
        addConversationText(`AI: ${text}`)
      })

    } catch (error) {
      console.error('PC AI Assistant: Error initializing socket:', error)
      setStatus('Socket Error ❌')
    }

    return () => {
      if (socket) {
        console.log('PC AI Assistant: Cleaning up socket connection')
        socket.close()
      }
    }
  }, [])

  const handleSendMessage = () => {
    if (socket && inputMessage.trim()) {
      // Emit message to server
      socket.emit('message', inputMessage.trim())
      setInputMessage('')
    }
  }

  const addConversationText = (text: string) => {
    // Add full text as single line
    setConversationLines(prev => [...prev, text])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Title */}
      <div className="absolute top-5 right-5 z-10 text-right">
        <h1 className="text-white text-2xl font-semibold drop-shadow-lg">
          AI Galaxy Assistant
        </h1>
        <p className="text-gray-400 text-sm font-light drop-shadow-md">
          Voice-Activated Neural Network
        </p>
      </div>

      {/* Conversation Text Display */}
      <div
        className="fixed bottom-[50%] top-[0%] left-1/2 transform -translate-x-1/2 text-center z-20 flex flex-col justify-end"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0) 100%)'
        }}
      >
        {conversationLines.slice(-10).map((line, index) => (
          <div
            key={conversationLines.length - 10 + index}
            className="text-white text-lg font-light mb-8 transition-all duration-500"
          >
            {line}
          </div>
        ))}
      </div>

      {/* Status Display */}
      <div className="fixed bottom-[40%] left-1/2 transform -translate-x-1/2 z-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
        <span className="text-white text-lg font-light">{status}</span>
      </div>


      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 20, 75], fov: 60, near: 1.0 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
          }}
          onCreated={({ gl }) => {
            console.log('PC AI Assistant: Three.js canvas created')
            gl.setClearColor('#000000')
          }}
          onError={(error) => {
            console.error('PC AI Assistant: Canvas error:', error)
          }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-xl">Loading Galaxy...</div>
            </div>
          }>
            <color attach="background" args={["#000000"]} />

            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[0, 0, 500]} intensity={1} color="#4169E1" />

            {/* Galaxy */}
            <Galaxy
              count={3000}
              spacing={1}
              color={particleColor}
              animationState={animationState}
            />

            {/* Camera Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={animationState === 'listening' ? 0.02 : 0.5}
            />

            {/* Post-processing Effects */}
            <EffectComposer>
              <Bloom
                luminanceThreshold={0}
                luminanceSmoothing={1}
                height={100}
                intensity={100}
              />
              <Noise opacity={0.03} />
              <Vignette
                offset={0.001}
                darkness={1}
                eskil={false}
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
