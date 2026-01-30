'use client'
import { Grid, OrbitControls, TransformControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Box, Download, Edit3, Expand, Move, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'

export default function CAD3D() {
  const [objects, setObjects] = useState<Array<{type: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: string}>>([])
  const [selectedTool, setSelectedTool] = useState('box')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<[number, number] | null>(null)
  const [dragEnd, setDragEnd] = useState<[number, number] | null>(null)
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(true)
  const [controlMode, setControlMode] = useState<'move' | 'rotate' | 'scale' | 'edit'>('move')
  const [isTransformDragging, setIsTransformDragging] = useState<boolean>(false)
  
  // Primary purple color variable for consistent theming (RGBA format)
  const primaryColorHex = '#c8f65c'
  const primaryColor = 'rgba(200, 246, 92, 1)'
  const buttonTextColor = '#000000'
  const buttonColor = '#000000'
  const primaryButtonTextColor = '#000000'
  const panelColor = 'rgba(0, 0, 0, 0.4)'
  const panelPadding = '12px'
  const panelBorderRadius = '8px'
  const inputBackgroundColor = '#222222'
  const inputBorderColor = '#333'
  
  const addPrimitive = (type: string) => {
    const newObject = {
      type,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      color: '#cccccc'
    }
    setObjects(prev => [...prev, newObject])
  }

  const removeObject = (index: number) => {
    setObjects(prev => prev.filter((_, i) => i !== index))
  }

  const updateObject = (index: number, updates: Partial<typeof objects[0]>) => {
    setObjects(prev => prev.map((obj, i) => i === index ? { ...obj, ...updates } : obj))
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (document.activeElement?.tagName === 'INPUT') return

      switch (e.key.toLowerCase()) {
        case 'g': // Grab / Move
          if (selectedObjectIndex !== null) setControlMode('move')
          break
        case 'r': // Rotate
          if (selectedObjectIndex !== null) setControlMode('rotate')
          break
        case 's': // Scale
          if (selectedObjectIndex !== null) setControlMode('scale')
          break
        case 'escape': // Cancel / Deselect
          setSelectedObjectIndex(null)
          break
        case 'delete': // Delete
        case 'backspace':
          if (selectedObjectIndex !== null) {
            removeObject(selectedObjectIndex)
            setSelectedObjectIndex(null)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectIndex, removeObject])

  const exportSTL = () => {
    // Create a scene to hold all objects for export
    const scene = new THREE.Scene()
    
    // Add all objects to the scene using the same logic as the main scene
    objects.forEach(obj => {
      let geometry
      switch (obj.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(1, 1, 1)
          break
        case 'sphere':
          geometry = new THREE.SphereGeometry(0.5, 32, 32)
          break
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
          break
        default:
          return
      }
      
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: obj.color }))
      mesh.position.set(obj.position[0], obj.position[1], obj.position[2])
      mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2])
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2])
      
      // Apply transformations to geometry by baking them into the vertices
      mesh.updateMatrixWorld(true)
      geometry.applyMatrix4(mesh.matrixWorld)
      
      // Create a new mesh with the transformed geometry to ensure clean export
      const transformedMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: obj.color }))
      scene.add(transformedMesh)
    })
    
    // Fake rotate the scene to match OBJ coordinate system
    // Rotate -90 degrees around X axis to convert Y-up to Z-up
    scene.rotation.x = -Math.PI / 2
    
    // Use STLExporter for professional-grade export
    const exporter = new STLExporter()
    
    // Export options
    const options = {
      binary: false, // Use ASCII format for better compatibility
      includeNormals: true, // Include face normals
      includeColors: false, // Don't include colors in STL
      includeMaterials: false // Don't include materials in STL
    }
    
    // Generate STL string
    const stlString = exporter.parse(scene, options) as string
    
    // Log STL export result
    console.log('STL Export Result:')
    console.log('Objects exported:', objects.length)
    console.log('STL string length:', stlString.length)
    console.log('STL content preview:', stlString.substring(0, 200) + '...')
    
    // Create download link
    const blob = new Blob([stlString], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cad_model.stl'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportOBJ = () => {
    // Create a scene to hold all objects for export
    const scene = new THREE.Scene()
    
    // Add all objects to the scene using the same logic as the main scene
    objects.forEach((obj, index) => {
      let geometry
      switch (obj.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(1, 1, 1)
          break
        case 'sphere':
          geometry = new THREE.SphereGeometry(0.5, 32, 32)
          break
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
          break
        default:
          return
      }
      
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: obj.color }))
      mesh.position.set(obj.position[0], obj.position[1], obj.position[2])
      mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2])
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2])
      
      // Apply transformations to geometry by baking them into the vertices
      mesh.updateMatrixWorld(true)
      geometry.applyMatrix4(mesh.matrixWorld)
      
      // Create a new mesh with the transformed geometry to ensure clean export
      const transformedMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: obj.color }))
      
      // Set object name for grouping in OBJ file
      transformedMesh.name = `${obj.type}_${index}`
      
      scene.add(transformedMesh)
    })
    
    // Use OBJExporter for human-readable export
    const exporter = new OBJExporter()
    
    // Generate OBJ string
    const objString = exporter.parse(scene)
    
    // Log OBJ export result
    console.log('OBJ Export Result:')
    console.log('Objects exported:', objects.length)
    console.log('OBJ string length:', objString.length)
    console.log('OBJ content preview:', objString.substring(0, 300) + '...')
    
    // Create download link
    const blob = new Blob([objString], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cad_model.obj'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Handle canvas click to deselect when clicking on empty space
  const handleCanvasClick = (e: any) => {
    // In React Three Fiber, we need to check if the click actually hit an object
    // The onClick event on Canvas provides intersection information
    if (e.intersections && e.intersections.length === 0) {
      // No intersections means we clicked on empty space
      setSelectedObjectIndex(null)
    }
    // If there are intersections, we clicked on an object, so don't deselect
  }

  return (
    <div className="h-screen w-screen relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4" style={{ backgroundColor: panelColor, backdropFilter: 'blur(10px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', zIndex: 50 }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>3D CAD Tools</h2>
        <div className="space-y-2">
          <button
            onClick={() => addPrimitive('box')}
            className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
              selectedTool === 'box' ? '' : ''
            }`}
            style={{
              backgroundColor: selectedTool === 'box' ? primaryColor : buttonColor,
              color: selectedTool === 'box' ? buttonTextColor : 'white'
            }}
          >
            <Box size={14} />
            Add Box
          </button>
          <button
            onClick={() => addPrimitive('sphere')}
            className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
              selectedTool === 'sphere' ? '' : ''
            }`}
            style={{
              backgroundColor: selectedTool === 'sphere' ? primaryColor : buttonColor,
              color: selectedTool === 'sphere' ? buttonTextColor : 'white'
            }}
          >
            <Box size={14} />
            Add Sphere
          </button>
          <button
            onClick={() => addPrimitive('cylinder')}
            className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
              selectedTool === 'cylinder' ? '' : ''
            }`}
            style={{
              backgroundColor: selectedTool === 'cylinder' ? primaryColor : buttonColor,
              color: selectedTool === 'cylinder' ? buttonTextColor : 'white'
            }}
          >
            <Box size={14} />
            Add Cylinder
          </button>
          <>
            <button
              onClick={exportSTL}
              className="w-full px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: buttonColor,
                color: 'white'
              }}
            >
              <Download size={14} />
              Export STL
            </button>
            <button
              onClick={exportOBJ}
              className="w-full px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: buttonColor,
                color: 'white'
              }}
            >
              <Download size={14} />
              Export OBJ
            </button>
          </>
        </div>
      </div>

      {/* 3D Outline Panel */}
      <div className="absolute top-4 right-4" style={{ backgroundColor: panelColor, backdropFilter: 'blur(10px)', padding: '8px', borderRadius: '8px', color: 'white', zIndex: 50, maxHeight: '320px', overflowY: 'auto' }}>
        <h2 className="text-xs font-semibold mb-2" style={{ color: primaryColor }}>3D Outline ({objects.length})</h2>
        {objects.length === 0 ? (
          <p className="text-gray-400 text-xs">No objects yet</p>
        ) : (
          objects.map((obj, index) => (
            <div 
              key={index} 
              className={`mb-1 p-1.5 rounded transition-all duration-200 cursor-pointer ${
                selectedObjectIndex === index 
                  ? `border-2 border-[${primaryColor}]` 
                  : `hover:bg-[${primaryColorHex}]`
              }`}

              onClick={() => setSelectedObjectIndex(index)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full border border-white/50"
                    style={{ backgroundColor: obj.color }}
                  />
                  <span className={`text-xs font-medium ${
                    selectedObjectIndex === index ? 'text-purple-300' : 'text-gray-200'
                  }`} style={{ color: selectedObjectIndex === index ? primaryColor : undefined }}>
                    {obj.type}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation() // Prevent selection when clicking delete
                    removeObject(index)
                  }}
                  className="transition-colors"
                  style={{
                    color: 'red',
                    backgroundColor: buttonColor,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-200 mb-1">Translation</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">X</span>
                    <input
                      type="number"
                      placeholder="X"
                      value={obj.position[0]}
                      onChange={(e) => updateObject(index, { position: [parseFloat(e.target.value), obj.position[1], obj.position[2]] })}
                      className="w-[100px] rounded px-0.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: inputBackgroundColor,
                        borderColor: inputBorderColor,
                        borderWidth: '1px',
                        color: 'white'
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Y</span>
                    <input
                      type="number"
                      placeholder="Y"
                      value={obj.position[2]}
                      onChange={(e) => updateObject(index, { position: [obj.position[0], obj.position[1], parseFloat(e.target.value)] })}
                      className="w-[100px] rounded px-0.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: inputBackgroundColor,
                        borderColor: inputBorderColor,
                        borderWidth: '1px',
                        color: 'white'
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Z</span>
                    <input
                      type="number"
                      placeholder="Z"
                      value={obj.position[1]}
                      onChange={(e) => updateObject(index, { position: [obj.position[0], parseFloat(e.target.value), obj.position[2]] })}
                      className="w-[100px] rounded px-0.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: inputBackgroundColor,
                        borderColor: inputBorderColor,
                        borderWidth: '1px',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="text-xs text-gray-400">Scale</span>
                  <input
                    type="number"
                    placeholder="Scale"
                    value={obj.scale[0]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      updateObject(index, { scale: [val, val, val] })
                    }}
                    className="w-[100px] rounded px-0.5 py-0.5 text-xs"
                    style={{
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      borderWidth: '1px',
                      color: 'white'
                    }}
                  />
                  <span className="text-xs text-gray-400">Color</span>
                  <input
                    type="color"
                    value={obj.color}
                    onChange={(e) => updateObject(index, { color: e.target.value })}
                    className="w-5 h-5 rounded-full overflow-hidden cursor-pointer"
                    style={{
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      borderWidth: '1px'
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3D Viewport */}
      <Canvas 
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        onClick={handleCanvasClick}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          enabled={true}
          mouseButtons={{
            LEFT: undefined, // Disable left mouse button for orbiting
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.DOLLY
          }}
          keys={{
            LEFT: 'KeyA', // A key
            UP: 'KeyW',   // W key
            RIGHT: 'KeyD', // D key
            BOTTOM: 'KeyS' // S key
          }}
        />
        <Grid 
          args={[20, 20]} 
          cellSize={1} 
          cellThickness={0.5} 
          cellColor="#333333" 
          sectionSize={2} 
          sectionThickness={1} 
          sectionColor="#222222" 
          fadeDistance={20}
          followCamera={true}
          infiniteGrid={true}
        />
        
        {/* Render Objects */}
        {objects.map((obj, index) => (
          <Object3D 
            key={index} 
            name={`object-${index}`}
            {...obj} 
            isSelected={selectedObjectIndex === index}
            onClick={() => setSelectedObjectIndex(index)}
            controlMode={controlMode}
          />
        ))}
        
        {/* Transform Controls - Only show when object is selected AND not in edit mode */}
        {selectedObjectIndex !== null && (
          <SceneControls 
            selectedObjectName={`object-${selectedObjectIndex}`}
            controlMode={controlMode}
            setIsTransformDragging={setIsTransformDragging}
            updateObject={updateObject}
            selectedIndex={selectedObjectIndex}
          />
        )}
        
      </Canvas>

      {/* Control Tools - Center Bottom Toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2" style={{ backgroundColor: panelColor, backdropFilter: 'blur(10px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', zIndex: 50, display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* Object Transformation Tools - Only show when object is selected */}
        {selectedObjectIndex !== null && (
          <>
            
            {/* Move Tool */}
            <button
              onClick={() => setControlMode('move')}
            className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                controlMode === 'move' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: controlMode === 'move' ? primaryColor : buttonColor,
                color: controlMode === 'move' ? buttonTextColor : 'white',
                boxShadow: controlMode === 'move' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Move"
            >
              <Move size={24} />
            </button>

            {/* Rotate Tool */}
            <button
              onClick={() => setControlMode('rotate')}
            className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                controlMode === 'rotate' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: controlMode === 'rotate' ? primaryColor : buttonColor,
                color: controlMode === 'rotate' ? buttonTextColor : 'white',
                boxShadow: controlMode === 'rotate' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Rotate"
            >
              <RotateCcw size={24} />
            </button>

            {/* Scale Tool */}
            <button
              onClick={() => setControlMode('scale')}
            className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                controlMode === 'scale' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: controlMode === 'scale' ? primaryColor : buttonColor,
                color: controlMode === 'scale' ? buttonTextColor : 'white',
                boxShadow: controlMode === 'scale' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Scale"
            >
              <Expand size={24} />
            </button>

            {/* Edit Tool */}
            <button
              onClick={() => setControlMode('edit')}
            className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                controlMode === 'edit' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: controlMode === 'edit' ? primaryColor : buttonColor,
                color: controlMode === 'edit' ? buttonTextColor : 'white',
                boxShadow: controlMode === 'edit' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Edit Vertices"
            >
              <Edit3 size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SceneControls({ 
  selectedObjectName, 
  controlMode, 
  setIsTransformDragging, 
  updateObject, 
  selectedIndex 
}: { 
  selectedObjectName: string | null
  controlMode: 'move' | 'rotate' | 'scale' | 'edit'
  setIsTransformDragging: (val: boolean) => void
  updateObject: (index: number, updates: any) => void
  selectedIndex: number | null
}) {
  const { scene } = useThree()
  const targetObject = selectedObjectName ? scene.getObjectByName(selectedObjectName) : undefined

  if (!targetObject || controlMode === 'edit') return null

  return (
    <TransformControls
      object={targetObject}
      mode={controlMode === 'move' ? 'translate' : controlMode === 'rotate' ? 'rotate' : 'scale'}
      space="local"
      showX={true}
      showY={true}
      showZ={true}
      enabled={true}
      onMouseDown={() => setIsTransformDragging(true)}
      onMouseUp={() => setIsTransformDragging(false)}
      onObjectChange={(e) => {
        if (e && selectedIndex !== null) {
          // e.target is the TransformControls instance
          // e.target.object is the object being transformed
          const controls = e.target as any // casting to any to avoid strict type checks on internal properties if types are missing
          const obj = controls.object
          
          if (obj) {
            updateObject(selectedIndex, {
              position: [obj.position.x, obj.position.y, obj.position.z],
              rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
              scale: [obj.scale.x, obj.scale.y, obj.scale.z]
            })
          }
        }
      }}
    />
  )
}

function Object3D({ name, type, position, rotation, scale, color, isSelected, onClick, controlMode }: {name: string, type: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: string, isSelected?: boolean, onClick?: () => void, controlMode?: 'select' | 'move' | 'rotate' | 'scale' | 'edit'}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useEffect(() => {
    if (meshRef.current && onClick) {
      meshRef.current.userData = { onClick }
    }
  }, [onClick])

  const shouldShowOutline = isSelected

  switch (type) {
    case 'box':
      return (
        <group>
          <mesh 
            ref={meshRef}
            name={name}
            position={position} 
            rotation={rotation} 
            scale={scale}
            onClick={onClick}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {shouldShowOutline && (
            <mesh 
              position={position} 
              rotation={rotation} 
              scale={scale}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial 
                color={0xffffff} 
                wireframe={true} 
                transparent={true} 
                opacity={0.5}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )
    case 'sphere':
      return (
        <group>
          <mesh 
            ref={meshRef}
            name={name}
            position={position} 
            rotation={rotation} 
            scale={scale}
            onClick={onClick}
          >
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {shouldShowOutline && (
            <mesh 
              position={position} 
              rotation={rotation} 
              scale={scale}
            >
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshBasicMaterial 
                color={0xffffff} 
                wireframe={true} 
                transparent={true} 
                opacity={0.5}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )
    case 'cylinder':
      return (
        <group>
          <mesh 
            ref={meshRef}
            name={name}
            position={position} 
            rotation={rotation} 
            scale={scale}
            onClick={onClick}
          >
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {shouldShowOutline && (
            <mesh 
              position={position} 
              rotation={rotation} 
              scale={scale}
            >
              <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
              <meshBasicMaterial 
                color={0xffffff} 
                wireframe={true} 
                transparent={true} 
                opacity={0.5}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )
    default:
      return null
  }
}
