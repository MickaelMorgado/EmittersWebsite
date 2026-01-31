'use client'
import DraggableNumberInput from '@/components/DraggableNumberInput'
import { Grid, OrbitControls, TransformControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Box, Download, Edit3, Expand, MousePointer, Move, RotateCcw, Trash2, Camera, Eye, EyeOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
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
  const [isCameraDragging, setIsCameraDragging] = useState<boolean>(false)
  
  // Primary purple color variable for consistent theming (RGBA format)
  const primaryColorHex = '#c0f052'
  const primaryColor = 'rgba(192, 240, 82, 1)'
  const buttonTextColor = '#000000'
  const buttonColor = '#000000'
  const primaryButtonTextColor = '#000000'
  const panelColor = 'rgba(0, 0, 0, 0.8)'
  const panelPadding = '10px'
  const panelBorderRadius = '8px'
  const inputBackgroundColor = '#222222'
  const inputBorderColor = '#333'
  const defaultMeshColor = '#888'
  
  const addPrimitive = (type: string) => {
    const newObject = {
      type,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      color: defaultMeshColor
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
        // Camera orientation shortcuts (Blender-style)
        case '1': // Front view
          if (e.ctrlKey) {
            // Ctrl+1 for back view
            setCameraView('back')
          } else {
            setCameraView('front')
          }
          break
        case '3': // Right view
          if (e.ctrlKey) {
            // Ctrl+3 for left view
            setCameraView('left')
          } else {
            setCameraView('right')
          }
          break
        case '7': // Top view
          if (e.ctrlKey) {
            // Ctrl+7 for bottom view
            setCameraView('bottom')
          } else {
            setCameraView('top')
          }
          break
        case '5': // Toggle orthographic/perspective
          toggleCameraMode()
          break
        case '0': // Camera view
          setCameraView('camera')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectIndex, removeObject])

  // Camera control functions
  const setCameraView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => {
    // This will be implemented in the CameraGizmo component
    console.log('Camera view:', view)
  }

  const toggleCameraMode = () => {
    // This will be implemented in the CameraGizmo component
    console.log('Toggle camera mode')
  }

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
      <div className="absolute top-4 left-4" style={{ backgroundColor: panelColor, backdropFilter: 'blur(3px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', zIndex: 50 }}>
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
      <div className="absolute top-4 right-4" style={{ backgroundColor: panelColor, backdropFilter: 'blur(3px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', zIndex: 50, maxHeight: '100%', overflowY: 'auto' }}>
        <h2 className="text-xs font-semibold mb-2" style={{ color: primaryColor }}>3D Outline ({objects.length})</h2>
        {objects.length === 0 ? (
          <p className="text-gray-400 text-xs">No objects yet</p>
        ) : (
          objects.map((obj, index) => (
            <div 
              key={index} 
              className={`mb-1 p-1.5 rounded transition-all duration-300 cursor-pointer ${
                selectedObjectIndex === index 
                  ? 'shadow-2xl' 
                  : ''
              }`}
              style={{
                backgroundColor: selectedObjectIndex === index ? 'rgba(192, 240, 82, 0.15)' : '',
                border: selectedObjectIndex === index ? '2px solid rgba(192, 240, 82, 0.8)' : '',
                boxShadow: selectedObjectIndex === index 
                  ? '0 0 20px rgba(192, 240, 82, 0.4), 0 0 40px rgba(192, 240, 82, 0.25), inset 0 0 15px rgba(192, 240, 82, 0.1)' 
                  : '',
                transform: selectedObjectIndex === index ? 'translateY(-1px)' : 'translateY(0)',
                boxSizing: 'border-box',
                ...(!isTransformDragging && {
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                })
              }}
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
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">             
                    <div className="flex" style={{ borderRadius: '6px', overflow: 'hidden' }}>
                      <DraggableNumberInput
                        value={obj.position[0]}
                        onChange={(value) => updateObject(index, { position: [value, obj.position[1], obj.position[2]] })}
                        min={-100}
                        max={100}
                        step={0.1}
                        label="X"
                        dragSensitivity={0.01}
                        decimals={1}
                        className="w-full"
                      />
                      <DraggableNumberInput
                        value={obj.position[2]}
                        onChange={(value) => updateObject(index, { position: [obj.position[0], obj.position[1], value] })}
                        min={-100}
                        max={100}
                        step={0.1}
                        label="Y"
                        dragSensitivity={0.01}
                        decimals={1}
                        className="w-full"
                      />
                      <DraggableNumberInput
                        value={obj.position[1]}
                        onChange={(value) => updateObject(index, { position: [obj.position[0], value, obj.position[2]] })}
                        min={-100}
                        max={100}
                        step={0.1}
                        label="Z"
                        dragSensitivity={0.01}
                        decimals={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">    
                    <div className="flex" style={{ borderRadius: '6px', overflow: 'hidden' }}>
                    <DraggableNumberInput
                      value={obj.rotation[0]}
                      onChange={(value) => updateObject(index, { rotation: [value, obj.rotation[1], obj.rotation[2]] })}
                      min={-6.28}
                      max={6.28}
                      step={0.1}
                      label="X"
                      dragSensitivity={0.005}
                      decimals={4}
                      className="w-full"
                    />
                    <DraggableNumberInput
                      value={obj.rotation[1]}
                      onChange={(value) => updateObject(index, { rotation: [obj.rotation[0], value, obj.rotation[2]] })}
                      min={-6.28}
                      max={6.28}
                      step={0.1}
                      label="Y"
                      dragSensitivity={0.005}
                      decimals={4}
                      className="w-full"
                    />
                    <DraggableNumberInput
                      value={obj.rotation[2]}
                      onChange={(value) => updateObject(index, { rotation: [obj.rotation[0], obj.rotation[1], value] })}
                      min={-6.28}
                      max={6.28}
                      step={0.1}
                      label="Z"
                      dragSensitivity={0.005}
                      decimals={4}
                      className="w-full"
                    />
                    </div>
                  </div>
                  <div className="flex flex-col">             
                    <div className="flex" style={{ borderRadius: '6px', overflow: 'hidden' }}>
                      <DraggableNumberInput
                        value={obj.scale[0]}
                        onChange={(value) => updateObject(index, { scale: [value, obj.scale[1], obj.scale[2]] })}
                        min={0.1}
                        max={100}
                        step={0.1}
                        label="X"
                        dragSensitivity={0.01}
                        decimals={1}
                        className="w-full"
                      />
                      <DraggableNumberInput
                        value={obj.scale[1]}
                        onChange={(value) => updateObject(index, { scale: [obj.scale[0], value, obj.scale[2]] })}
                        min={0.1}
                        max={100}
                        step={0.1}
                        label="Y"
                        dragSensitivity={0.01}
                        decimals={1}
                        className="w-full"
                      />
                      <DraggableNumberInput
                        value={obj.scale[2]}
                        onChange={(value) => updateObject(index, { scale: [obj.scale[0], obj.scale[1], value] })}
                        min={0.1}
                        max={100}
                        step={0.1}
                        label="Z"
                        dragSensitivity={0.01}
                        decimals={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
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
        <directionalLight position={[10, 10, 5]} intensity={1} />
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
        
        {/* Camera Gizmo - Inside Canvas */}
        <CameraGizmo 
          setCameraView={setCameraView}
          toggleCameraMode={toggleCameraMode}
          isCameraDragging={isCameraDragging}
          setIsCameraDragging={setIsCameraDragging}
        />
        
      </Canvas>

      {/* Control Tools - Center Bottom Toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2" style={{ backgroundColor: panelColor, backdropFilter: 'blur(3px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', zIndex: 50, display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Object Transformation Tools - Only show when object is selected */}
        {selectedObjectIndex !== null && (
          <>
            
            {/* Move Tool */}
            <button
              onClick={() => setControlMode('move')}
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
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
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
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
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
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
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
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

            {/* Deselect Tool */}
            <button
              onClick={() => setSelectedObjectIndex(null)}
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center`}
              style={{
                backgroundColor: buttonColor,
                color: 'white',
                boxShadow: `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)`
              }}
              title="Deselect All (Escape)"
            >
              <MousePointer size={24} />
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

// Camera Gizmo Component
function CameraGizmo({ 
  setCameraView, 
  toggleCameraMode, 
  isCameraDragging, 
  setIsCameraDragging 
}: { 
  setCameraView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => void
  toggleCameraMode: () => void
  isCameraDragging: boolean
  setIsCameraDragging: (val: boolean) => void
}) {
  const { camera, gl } = useThree()
  
  // Camera control implementation
  const handleCameraView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => {
    const target = new THREE.Vector3(0, 0, 0)
    let position: THREE.Vector3
    
    switch (view) {
      case 'front':
        position = new THREE.Vector3(0, 0, 5)
        break
      case 'back':
        position = new THREE.Vector3(0, 0, -5)
        break
      case 'right':
        position = new THREE.Vector3(5, 0, 0)
        break
      case 'left':
        position = new THREE.Vector3(-5, 0, 0)
        break
      case 'top':
        position = new THREE.Vector3(0, 5, 0)
        break
      case 'bottom':
        position = new THREE.Vector3(0, -5, 0)
        break
      case 'camera':
        // Use current camera position
        position = camera.position.clone()
        break
    }
    
    // Smoothly animate camera to new position
    const startPos = camera.position.clone()
    const startLook = camera.getWorldDirection(new THREE.Vector3()).clone()
    const endLook = new THREE.Vector3().subVectors(target, position).normalize()
    
    const duration = 500 // ms
    const startTime = Date.now()
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      
      camera.position.lerpVectors(startPos, position, ease)
      camera.lookAt(target)
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      } else {
        camera.lookAt(target)
      }
    }
    
    animateCamera()
  }
  
  // Override the setCameraView function to use actual implementation
  const actualSetCameraView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => {
    handleCameraView(view)
  }
  
  const actualToggleCameraMode = () => {
    // Toggle between perspective and orthographic
    const isPerspective = camera.type === 'PerspectiveCamera'
    
    if (isPerspective) {
      // Switch to orthographic
      const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight
      const d = 5
      const orthoCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000)
      orthoCamera.position.copy(camera.position)
      orthoCamera.rotation.copy(camera.rotation)
      // Replace camera in scene
      camera.parent?.add(orthoCamera)
      camera.parent?.remove(camera)
    } else {
      // Switch to perspective
      const perspectiveCamera = new THREE.PerspectiveCamera(50, gl.domElement.clientWidth / gl.domElement.clientHeight, 0.1, 1000)
      perspectiveCamera.position.copy(camera.position)
      perspectiveCamera.rotation.copy(camera.rotation)
      // Replace camera in scene
      camera.parent?.add(perspectiveCamera)
      camera.parent?.remove(camera)
    }
  }

  return (
    <div className="absolute bottom-4 right-4" style={{ zIndex: 60 }}>
      <div 
        className="bg-black bg-opacity-80 backdrop-blur-md rounded-lg p-3 border border-gray-600"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '6px',
          minWidth: '120px'
        }}
      >
        {/* Top Row: Top, Camera, Bottom */}
        <button
          onClick={() => actualSetCameraView('top')}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Top View (7)"
        >
          <ArrowUp size={16} />
        </button>
        <button
          onClick={() => actualToggleCameraMode()}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Toggle Camera Mode (5)"
        >
          <Camera size={16} />
        </button>
        <button
          onClick={() => actualSetCameraView('bottom')}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Bottom View (Ctrl+7)"
        >
          <ArrowDown size={16} />
        </button>

        {/* Middle Row: Left, Front, Right */}
        <button
          onClick={() => actualSetCameraView('left')}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Left View (Ctrl+3)"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={() => actualSetCameraView('front')}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Front View (1)"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => actualSetCameraView('right')}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Right View (3)"
        >
          <ArrowRight size={16} />
        </button>

        {/* Bottom Row: Back, Empty, Empty */}
        <button
          onClick={() => actualSetCameraView('back')}
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-gray-600"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555'
          }}
          title="Back View (Ctrl+1)"
        >
          <EyeOff size={16} />
        </button>
        <div className="w-8 h-8"></div>
        <div className="w-8 h-8"></div>
      </div>
    </div>
  )
}
