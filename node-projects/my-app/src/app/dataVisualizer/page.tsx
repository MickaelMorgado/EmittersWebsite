"use client"

import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import Sidebar from "../../components/sidebar"

const chatGPTRequest = async (message: string) => {
    try {
      //setIsLoading(true);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer `,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
          }),
        }
      );

      if (!response.ok) throw new Error('Error with the API request.');

      const data = await response.json();
      const reply = data.choices[0].message.content;

      //appendMessage(reply, 'bot');
      return reply;
    } catch (error) {
      //appendMessage('Error: Unable to fetch response.', 'bot');
      console.error(error);
    } finally {
      //setIsLoading(false);
    }
  };

interface GalaxyProps {
  count: number
  spacing: number
  color: string
  xOffset?: number
}

function Galaxy({ count, spacing, color, xOffset = 0 }: GalaxyProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  const positions = useMemo(() => {
    const temp = new THREE.Object3D()
    const positions = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 8
      const radius = Math.pow(Math.random(), 0.5) * (25 * spacing)
      const armOffset = (i % 3) * ((Math.PI * 2) / 3)

      const x = Math.cos(angle + armOffset) * radius + (Math.random() - 0.5) * (5 * spacing) + xOffset
      const z = Math.sin(angle + armOffset) * radius + (Math.random() - 0.5) * (5 * spacing)
      const y = (Math.random() - 0.5) * (4 * spacing)

      temp.position.set(x, y, z)
      temp.scale.setScalar(Math.random() * 0.05 + 0.05)
      temp.updateMatrix()

      positions.push(temp.matrix.clone())
    }

    return positions
  }, [count, spacing, xOffset])

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
  const [comparisons, setComparisons] = useState<Array<{number: string, color: string, visible: boolean}>>([{number: "10000", color: "#ffffff", visible: true}])
  const [spacing, setSpacing] = useState<number>(1)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

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

  const addComparison = () => {
    setComparisons([...comparisons, {number: "1000", color: "#ff6b6b", visible: true}])
  }

  const updateComparison = (index: number, field: 'number' | 'color', value: string) => {
    const newComparisons = [...comparisons]
    newComparisons[index][field] = value
    setComparisons(newComparisons)
  }

  const removeComparison = (index: number) => {
    if (comparisons.length > 1) {
      setComparisons(comparisons.filter((_, i) => i !== index))
    }
  }

  const toggleVisibility = (index: number) => {
    const newComparisons = [...comparisons]
    newComparisons[index].visible = !newComparisons[index].visible
    setComparisons(newComparisons)
  }

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        title="Data Visualizer"
      >
        <div className="flex flex-col gap-4">
          <div className="flex">Add multiple numbers for comparison!</div>
          <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2">
              {comparisons.map((comp, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-white text-xs">Count {index === 0 ? '(Bigger)' : ''}</label>
                    <Input
                      type="number"
                      value={comp.number}
                      onChange={(e) => updateComparison(index, 'number', e.target.value)}
                      placeholder="Enter number"
                      className="w-32 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      min="1"
                      max="21000000"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-white text-xs">Color</label>
                    <Select value={comp.color} onValueChange={(value) => updateComparison(index, 'color', value)}>
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
                  <div className="flex flex-col gap-1">
                    <label className="text-white text-xs">Visible</label>
                    <Button
                      onClick={() => toggleVisibility(index)}
                      variant={comp.visible ? "secondary" : "outline"}
                      size="sm"
                      className="w-16"
                    >
                      <i className={`fas ${comp.visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </Button>
                  </div>
                  {comparisons.length > 1 && (
                    <Button onClick={() => removeComparison(index)} variant="destructive" size="sm">
                      -
                    </Button>
                  )}
                </div>
              ))}
              <Button onClick={addComparison} variant="secondary" className="w-fit">
                + Add Comparison
              </Button>
            </div>
          </div>
          {/*
          <div id="chat-container" className="flex flex-col gap-2">
            <div id="input-container" className="flex gap-2">
              <input type="text" id="input" placeholder="Type your message here" className="flex-grow border rounded" />
              <button
                id="send"
                className="border rounded"
                onClick={async () => {
                  const textArea = document.getElementById("messages") as HTMLTextAreaElement;
                  const inputValue = (document.getElementById("input") as HTMLInputElement)?.value || "";
                  const reply = await chatGPTRequest(
                    `You are a numeric data responder.
Rules:
- Always reply in JSON format like { "value": xxxx, "description"?: xxxx }.
- Give me only a numeric integer value for the question I ask.
- If the number is very large and would break a data visualizer, reduce it so that the numeric part has at most 7 digits.
- Include in "description" the approximate multiplier needed to reconstruct the original value:
    - If the original value is around tens of millions, description should say "we might multiply this value by 100".
    - If the original value is around millions, description should say "we might multiply this value by 10".
    - For larger values, adapt the multiplier accordingly (*1000, *10000, etc.).
- No explanations, no text outside JSON.
Question:
 ${inputValue}`
                  );
                  if (textArea && reply) {
                    textArea.value = reply;
                  }
                  updateComparison(0, 'number', JSON.parse(reply).value);
                }}
              >
                Send
              </button>
            </div>
            <textarea id="messages" className="flex-grow w-full h-[20px]"></textarea>
          </div>
          */}
        </div>
      </Sidebar>

      <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 20, 50], fov: 60, near: 1.0 }}>
            <color attach="background" args={["#000000"]} />

            {/*<Stars radius={300} depth={50} count={1000} factor={4} saturation={0} fade />*/}

            {comparisons.map((comp, index) => {
              const count = Number.parseInt(comp.number)
              if (count > 0 && count <= 21000000 && comp.visible) {
                return <Galaxy key={index} count={count} spacing={spacing} color={comp.color} />
              }
              return null
            })}

            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

            <EffectComposer>
              {/*<DepthOfField focusDistance={0.5} focalLength={1} bokehScale={30} />*/}
              <Bloom luminanceThreshold={0} luminanceSmoothing={1} height={100} intensity={10} />
              <Vignette eskil={false} offset={0.001} darkness={1} />
              <Noise opacity={0.03} />
            </EffectComposer>
          </Canvas>
      </div>
    </>
  )
}
