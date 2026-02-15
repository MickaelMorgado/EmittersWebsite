"use client"

import { Html, OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"
import Sidebar from "../../components/sidebar"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"

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
  verticality: number
  color: string
  name: string
  showLabel: boolean
  onHover: (index: number | null) => void
  index: number
  xOffset?: number
  zOffset?: number
}

function Galaxy({ count, spacing, verticality, color, name, showLabel, onHover, index, xOffset = 0, zOffset = 0 }: GalaxyProps) {
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
      const y = (Math.random() - 0.5) * (4 * spacing * verticality)

      temp.position.set(x, y, z)
      temp.scale.setScalar(Math.random() * 0.05 + 0.05)
      temp.updateMatrix()

      positions.push(temp.matrix.clone())
    }

    return positions
  }, [count, spacing, verticality, xOffset, zOffset])

  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      positions.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <group 
      ref={groupRef} 
      position={[xOffset, 0, zOffset]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(index)
      }}
      onPointerOut={() => onHover(null)}
    >
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color={color} />
      </instancedMesh>
      {showLabel && (
        <Html position={[0, 0, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded border border-white/20 text-xs font-bold whitespace-nowrap" style={{ color: color }}>
            {name}
          </div>
        </Html>
      )}
    </group>
  )
}

export default function GalaxyVisualization() {
  const [comparisons, setComparisons] = useState<Array<{number: string, color: string, visible: boolean, name: string, description: string}>>([
    {number: "10000", color: "#ffffff", visible: true, name: "Galaxy 1", description: "Deep space observation of a high-density stellar cluster."}
  ])
  const [spacing, setSpacing] = useState<number>(1)
  const [verticality, setVerticality] = useState<number>(1)
  const [dispersion, setDispersion] = useState<number>(80)
  const [mainTitle, setMainTitle] = useState<string>("Project Galaxy")
  const [mainDescription, setMainDescription] = useState<string>("A multi-dimensional comparison of complex datasets.")
  const [isDispersed, setIsDispersed] = useState<boolean>(false)
  const [showLabels, setShowLabels] = useState<boolean>(true)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)].value
    setComparisons([...comparisons, { 
      number: "1000", 
      color: randomColor, 
      visible: true, 
      name: `Galaxy ${comparisons.length + 1}`,
      description: "" 
    }])
  }

  const updateComparison = (index: number, field: 'number' | 'color' | 'name' | 'description', value: string) => {
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
            <div className="flex gap-4">
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
                <label className="text-white text-xs">Dispersion</label>
                <Input
                  type="number"
                  value={dispersion}
                  onChange={(e) => setDispersion(Number(e.target.value))}
                  placeholder="Distance"
                  className="w-20 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  min="20"
                  max="200"
                  step="5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white text-xs">Verticality</label>
                <Input
                  type="number"
                  value={verticality}
                  onChange={(e) => setVerticality(Number(e.target.value))}
                  placeholder="Thickness"
                  className="w-20 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white text-xs">Layout</label>
                <Button 
                  onClick={() => setIsDispersed(!isDispersed)}
                  variant="secondary"
                  size="sm"
                  className="h-10 px-4 whitespace-nowrap"
                >
                  {isDispersed ? "Dispersed" : "Blended"}
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white text-xs">Labels</label>
                <Button 
                  onClick={() => setShowLabels(!showLabels)}
                  variant={showLabels ? "secondary" : "outline"}
                  size="sm"
                  className="h-10 px-4 whitespace-nowrap"
                >
                  {showLabels ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <label className="text-cyan-500 text-[10px] uppercase tracking-widest font-bold">Main Identity</label>
              <Input
                type="text"
                value={mainTitle}
                onChange={(e) => setMainTitle(e.target.value)}
                placeholder="Project Title"
                className="bg-white/10 border-white/20 text-white h-8 text-sm"
              />
              <textarea
                value={mainDescription}
                onChange={(e) => setMainDescription(e.target.value)}
                placeholder="Global description..."
                className="bg-white/10 border-white/20 text-white p-2 text-xs rounded h-20 focus:outline-none focus:ring-1 focus:ring-secondary resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              {comparisons.map((comp, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={comp.name}
                      onChange={(e) => updateComparison(index, 'name', e.target.value)}
                      placeholder="Galaxy Name"
                      className="bg-white/10 border-white/20 text-white flex-grow h-8"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
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
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-white text-xs">Description</label>
                    <textarea
                      value={comp.description}
                      onChange={(e) => updateComparison(index, 'description', e.target.value)}
                      placeholder="Describe this data..."
                      className="bg-white/10 border-white/20 text-white p-2 text-xs rounded h-16 focus:outline-none focus:ring-1 focus:ring-secondary resize-none"
                    />
                  </div>
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
                const totalVisible = comparisons.filter(c => c.visible).length
                const visibleIndex = comparisons.slice(0, index).filter(c => c.visible).length
                
                let xOff = 0;
                let zOff = 0;
                
                if (isDispersed) {
                  const cols = 2; // 2 columns grid
                  const row = Math.floor(visibleIndex / cols);
                  const col = visibleIndex % cols;
                  
                  const totalRows = Math.ceil(totalVisible / cols);
                  const gridSpacing = dispersion;
                  
                  xOff = (col - (cols - 1) / 2) * gridSpacing;
                  zOff = (row - (totalRows - 1) / 2) * gridSpacing;
                }
                
                return (
                  <Galaxy 
                    key={index} 
                    count={count} 
                    spacing={spacing} 
                    verticality={verticality}
                    color={comp.color} 
                    name={comp.name}
                    showLabel={showLabels}
                    onHover={setHoveredIndex}
                    index={index}
                    xOffset={xOff} 
                    zOffset={zOff} 
                  />
                )
              }
              return null
            })}

            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

            <EffectComposer>
              <Bloom luminanceThreshold={0} luminanceSmoothing={1} height={100} intensity={10} />
              <Vignette eskil={false} offset={0.001} darkness={1} />
              <Noise opacity={0.03} />
            </EffectComposer>
          </Canvas>

          {/* Bottom Right Description Card (Cyberpunk Style) */}
          <div className="absolute bottom-6 right-6 z-20 pointer-events-none transition-all duration-500">
            <div className="bg-black/60 backdrop-blur-xl rounded-lg border border-white/10 p-5 min-w-[300px] max-w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-lg font-light tracking-[0.3em] uppercase heading-shine">
                    {hoveredIndex !== null ? comparisons[hoveredIndex].name : (mainTitle || "Data Analysis")}
                  </h2>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: hoveredIndex !== null ? comparisons[hoveredIndex].color : (comparisons[0]?.color || "#fff") }} />
                </div>
                
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />
                
                <p className="text-gray-300 text-xs tracking-widest leading-relaxed uppercase font-light">
                  {hoveredIndex !== null 
                    ? (comparisons[hoveredIndex].description || "NO DATA DECRYPTED") 
                    : (mainDescription || "INITIALIZING GLOBAL SENSORS...")
                  }
                </p>
                
                <div className="flex items-center gap-3 mt-3 text-[9px] tracking-[0.2em] text-white/40">
                  <span className="text-secondary">SYSTEM ACTIVE</span>
                  <span>|</span>
                  <span>{hoveredIndex !== null ? `NODE_${hoveredIndex + 1}` : "MAIN_BUFFER"}</span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </>
  )
}
