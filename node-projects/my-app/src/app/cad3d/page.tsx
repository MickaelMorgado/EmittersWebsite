'use client'
import DraggableNumberInput from '@/components/DraggableNumberInput'
import { ContactShadows, Edges, Environment, GizmoHelper, GizmoViewcube, Grid, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Camera, Download, Edit3, Eye, EyeOff, Move, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'

export default function CAD3D() {
  const [objects, setObjects] = useState<Array<{type: string, name?: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: string, shapePoints?: number[][], sketchId?: string, visible?: boolean}>>([])
  const [selectedTool, setSelectedTool] = useState('box')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<[number, number] | null>(null)
  const [dragEnd, setDragEnd] = useState<[number, number] | null>(null)
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(true)
  const [isCameraDragging, setIsCameraDragging] = useState<boolean>(false)
  
  // CAD Mode State
  const [mode, setMode] = useState<'3d' | 'sketch'>('3d')
  const [sketchTool, setSketchTool] = useState<'draw' | 'rectangle' | 'circle' | 'select' | 'edit'>('draw')
  const [sketchShapes, setSketchShapes] = useState<Array<{id: string, type: string, points: Array<[number, number]>, color: string, extruded: boolean, orientation: 'TOP' | 'FRONT' | 'RIGHT' | 'BOTTOM' | 'BACK' | 'LEFT'}>>([])
  const [selectedVertex, setSelectedVertex] = useState<{shapeIndex: number, vertexIndex: number} | null>(null)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [currentSketchPoints, setCurrentSketchPoints] = useState<Array<[number, number]>>([])
  const [collisions, setCollisions] = useState<Array<{shape1: number, shape2: number}>>([])
  const [showCollisionDialog, setShowCollisionDialog] = useState(false)
  const [sketchPlaneOrientation, setSketchPlaneOrientation] = useState<'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'NONE'>('NONE')
  
  // History State for Undo/Redo
  const [history, setHistory] = useState<Array<{objects: typeof objects, sketchShapes: typeof sketchShapes}>>([])
  const [redoStack, setRedoStack] = useState<Array<{objects: typeof objects, sketchShapes: typeof sketchShapes}>>([])
  
  // Flag to prevent history push during undo/redo or initial load
  const isInternalUpdate = useRef(false)
  
  // Ref to access camera controls from outside the Canvas
  const cameraControlsRef = useRef<{
    setCameraView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => void
    toggleCameraMode: () => void
    switchToPerspective: () => void
  } | null>(null)
  
  // Ref for OrbitControls to enforce update when we manually set camera
  const orbitControlsRef = useRef<any>(null)
  
  // Primary neon-lime color variable for consistent theming (RGBA format)
  const primaryColorHex = '#d4ff00'
  const primaryColor = 'rgba(212, 255, 0, 1)'
  const buttonTextColor = '#000000'
  const buttonColor = 'rgba(255, 255, 255, 0.05)'
  const primaryButtonTextColor = '#000000'
  const panelColor = 'rgba(15, 15, 15, 0.7)'
  const panelPadding = '12px'
  const panelBorderRadius = '12px'
  const inputBackgroundColor = 'rgba(0, 0, 0, 0.3)'
  const inputBorderColor = 'rgba(255, 255, 255, 0.1)'
  const defaultMeshColor = '#aaaaaa'
  
  // Persistence: Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cad3d_scene')
    if (saved) {
      try {
        const { objects: savedObjects, sketchShapes: savedShapes } = JSON.parse(saved)
        isInternalUpdate.current = true
        setObjects(savedObjects)
        setSketchShapes(savedShapes)
        setTimeout(() => { isInternalUpdate.current = false }, 100)
      } catch (e) {
        console.error('Failed to load scene', e)
      }
    }
  }, [])

  // Persistence: Save to localStorage
  useEffect(() => {
    if (isInternalUpdate.current) return
    localStorage.setItem('cad3d_scene', JSON.stringify({ objects, sketchShapes }))
  }, [objects, sketchShapes])

  const pushToHistory = (newObjects = objects, newShapes = sketchShapes) => {
    if (isInternalUpdate.current) return
    setHistory(prev => [...prev.slice(-49), { objects: JSON.parse(JSON.stringify(objects)), sketchShapes: JSON.parse(JSON.stringify(sketchShapes)) }])
    setRedoStack([])
  }

  const undo = () => {
    if (history.length === 0) return
    const prevState = history[history.length - 1]
    
    setRedoStack(prev => [...prev, { objects: JSON.parse(JSON.stringify(objects)), sketchShapes: JSON.parse(JSON.stringify(sketchShapes)) }])
    
    isInternalUpdate.current = true
    setObjects(prevState.objects)
    setSketchShapes(prevState.sketchShapes)
    setHistory(prev => prev.slice(0, -1))
    setTimeout(() => { isInternalUpdate.current = false }, 100)
  }

  const redo = () => {
    if (redoStack.length === 0) return
    const nextState = redoStack[redoStack.length - 1]
    
    setHistory(prev => [...prev, { objects: JSON.parse(JSON.stringify(objects)), sketchShapes: JSON.parse(JSON.stringify(sketchShapes)) }])
    
    isInternalUpdate.current = true
    setObjects(nextState.objects)
    setSketchShapes(nextState.sketchShapes)
    setRedoStack(prev => prev.slice(0, -1))
    setTimeout(() => { isInternalUpdate.current = false }, 100)
  }

  const removeObject = (index: number) => {
    pushToHistory()
    setObjects(prev => prev.filter((_, i) => i !== index))
  }

  const updateObject = (index: number, updates: Partial<typeof objects[0]>) => {
    setObjects(prev => prev.map((obj, i) => i === index ? { ...obj, ...updates } : obj))
  }

  const handleDeleteVertex = () => {
    if (!selectedVertex) return
    const { shapeIndex, vertexIndex } = selectedVertex
    const shape = sketchShapes[shapeIndex]
    if (!shape) return
    
    // Constraints
    if (shape.type === 'polyline' && shape.points.length <= 2) {
       setSketchShapes((prev: any) => prev.filter((_: any, i: number) => i !== shapeIndex))
       setSelectedVertex(null)
    } else if (shape.type === 'polygon' && shape.points.length <= 3) {
       setSketchShapes((prev: any) => prev.filter((_: any, i: number) => i !== shapeIndex))
       setSelectedVertex(null)
    } else {
       const newPoints = shape.points.filter((_, i) => i !== vertexIndex)
       
       if (shape.type === 'rectangle') {
           const newShape = { ...shape, type: 'polygon', points: newPoints }
            setSketchShapes((prev: any) => prev.map((s: any, i: number) => i === shapeIndex ? newShape : s))
       } else if (shape.type === 'circle') {
            setSketchShapes((prev: any) => prev.filter((_: any, i: number) => i !== shapeIndex))
       } else {
            const newShape = { ...shape, points: newPoints }
            setSketchShapes((prev: any) => prev.map((s: any, i: number) => i === shapeIndex ? newShape : s))
       }
       setSelectedVertex(null)
    }
  }

  // Detect collisions between shapes (shared vertices)
  const detectShapeCollisions = (shapes: typeof sketchShapes) => {
    const collisionPairs: Array<{shape1: number, shape2: number}> = []
    const threshold = 0.3 // Distance threshold for considering points as "touching"
    
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const shape1 = shapes[i]
        const shape2 = shapes[j]
        
        // Check if any points from shape1 are close to any points from shape2
        let hasCollision = false
        for (const p1 of shape1.points) {
          for (const p2 of shape2.points) {
            const dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
            if (dist < threshold) {
              hasCollision = true
              break
            }
          }
          if (hasCollision) break
        }
        
        if (hasCollision) {
          collisionPairs.push({ shape1: i, shape2: j })
        }
      }
    }
    
    return collisionPairs
  }


  // Sync sketches to 3D objects and switch to 3D mode
  const handleFinishSketch = () => {
    // Check for collisions before proceeding
    if (collisions.length > 0) {
      setShowCollisionDialog(true)
      return
    }
    
    pushToHistory()
    proceedWithFinish()
  }

  // Combine overlapping shapes into a single shape
  const combineOverlappingShapes = () => {
    if (collisions.length === 0) return
    
    let nextShapes = [...sketchShapes]
    const processedIndices = new Set<number>()
    const mergedShapes: typeof sketchShapes = []
    
    for (let i = 0; i < nextShapes.length; i++) {
      if (processedIndices.has(i)) continue
      
      let currentShape = { ...nextShapes[i] }
      processedIndices.add(i)
      
      let foundNewCollision = true
      while (foundNewCollision) {
        foundNewCollision = false
        for (let j = 0; j < nextShapes.length; j++) {
          if (processedIndices.has(j)) continue
          
          const collisionPairs = detectShapeCollisions([currentShape, nextShapes[j]])
          if (collisionPairs.length > 0) {
            currentShape.points = [...currentShape.points, ...nextShapes[j].points]
            processedIndices.add(j)
            foundNewCollision = true
          }
        }
      }
      
      const uniquePoints: Array<[number, number]> = []
      currentShape.points.forEach(p1 => {
        if (!uniquePoints.some(p2 => Math.sqrt(Math.pow(p1[0]-p2[0], 2) + Math.pow(p1[1]-p2[1], 2)) < 0.1)) {
          uniquePoints.push(p1)
        }
      })
      currentShape.points = uniquePoints
      mergedShapes.push(currentShape)
    }
    
    pushToHistory(objects, mergedShapes)
    setSketchShapes(mergedShapes)
    proceedWithFinish(mergedShapes)
  }
  
  const proceedWithFinish = (shapesToUse = sketchShapes) => {
    // Note: We don't check for length === 0 because we might need to remove orphaned objects if user deleted all sketches
    // if (sketchShapes.length === 0) { setMode('3d'); return; }

    setObjects(prev => {
        // 1. Identify sketches that still exist
        const activeSketchIds = new Set(shapesToUse.map(s => s.id))
        
        // 2. Remove objects that were linked to sketches that no longer exist
        let nextObjects = prev.filter(obj => !obj.sketchId || activeSketchIds.has(obj.sketchId))

        const DEFAULT_EXTRUSION = 0.5

        // 3. Update or Create objects for current sketches
        shapesToUse.forEach((shape, index) => {
             let props: any = null

             if (shape.points.length >= 2) {
                 // Calculate centroid for positioning (in 2D sketch space)
                 let cu = 0, cv = 0
                 shape.points.forEach(p => { cu += p[0]; cv += p[1] })
                 cu /= shape.points.length
                 cv /= shape.points.length
                 
                 // Convert points to relative coordinates (centered at origin)
                 const rel = shape.points.map(p => [p[0] - cu, p[1] - cv])
                 
                 // Map 2D sketch space to 3D based on orientation
                 let position: [number, number, number] = [0, 0, 0]
                 let rotation: [number, number, number] = [0, 0, 0]
                 let scale: [number, number, number] = [1, 1, DEFAULT_EXTRUSION]

                 switch (shape.orientation) {
                    case 'TOP':
                    case 'BOTTOM':
                        position = [cu, 0, cv]
                        rotation = [Math.PI/2, 0, 0]
                        break
                    case 'FRONT':
                    case 'BACK':
                        position = [cu, cv, 0]
                        rotation = [0, 0, 0]
                        break
                    case 'RIGHT':
                    case 'LEFT':
                        position = [0, cv, cu]
                        rotation = [0, -Math.PI/2, 0]
                        break
                 }
                 
                 props = {
                   type: 'extrusion',
                   name: `Extrusion ${index + 1}`,
                   position: position,
                   rotation: rotation,
                   scale: scale,
                   color: '#888888',
                   shapePoints: rel,
                   visible: true,
                   orientation: shape.orientation
                 }
             }

             if (props) {
                 const existingIdx = nextObjects.findIndex(obj => obj.sketchId === shape.id)
                 if (existingIdx !== -1) {
                     nextObjects[existingIdx] = {
                         ...nextObjects[existingIdx],
                         ...props,
                         name: nextObjects[existingIdx].name || props.name,
                         scale: nextObjects[existingIdx].scale, // Preserving current extrusion depth
                         sketchId: shape.id
                     }
                 } else {
                     nextObjects.push({
                         ...props,
                         sketchId: shape.id
                     })
                 }
             }
        })

        return nextObjects
    })

    setMode('3d')
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (document.activeElement?.tagName === 'INPUT') return

      switch (e.key.toLowerCase()) {
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
        case 'tab': // Toggle between 3D and Sketch mode
          e.preventDefault()
          if (mode === '3d') {
             setMode('sketch')
          } else {
             handleFinishSketch()
          }
          break
        // Camera orientation shortcuts (Web-friendly)
        case '1': // Front view
          if (e.shiftKey) {
            // Shift+1 for back view
            setCameraView('back')
          } else {
            setCameraView('front')
          }
          break
        case '3': // Right view
          if (e.shiftKey) {
            // Shift+3 for left view
            setCameraView('left')
          } else {
            setCameraView('right')
          }
          break
        case '7': // Top view
          if (e.shiftKey) {
            // Shift+7 for bottom view
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
        case 'z': // Undo
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            undo()
          }
          break
        case 'y': // Redo
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            redo()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectIndex, removeObject, mode])

  useEffect(() => {
    if (mode === 'sketch') {
      const detected = detectShapeCollisions(sketchShapes)
      setCollisions(detected)
    } else {
      setCollisions([])
    }
  }, [sketchShapes, mode])
  const setCameraView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => {
    // Call the function from the ref if it exists
    if (cameraControlsRef.current) {
      cameraControlsRef.current.setCameraView(view)
    }
    console.log('Camera view:', view)
  }

  const toggleCameraMode = () => {
    // Call the function from the ref if it exists
    if (cameraControlsRef.current) {
      cameraControlsRef.current.toggleCameraMode()
    }
    console.log('Toggle camera mode')
  }

  // Camera control implementation for external use
  const handleCameraView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => {
    // This will be passed to CameraGizmo as a prop
  }

  const handleToggleCameraMode = () => {
    // This will be passed to CameraGizmo as a prop
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
          
      <div className="absolute top-4 left-4" style={{ zIndex: 50, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '12px' }}>
        {/* Main Panel */}
        <div style={{ backgroundColor: panelColor, backdropFilter: 'blur(3px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>3D CAD Tools</h2>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                  onClick={undo}
                  disabled={history.length === 0}
                  className="flex-1 p-2 rounded bg-black/50 hover:bg-black/70 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                  title="Undo (Ctrl+Z)"
              >
                  <RotateCcw size={14} />
                  <span className="text-[10px]">Undo</span>
              </button>
              <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="flex-1 p-2 rounded bg-black/50 hover:bg-black/70 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                  title="Redo (Ctrl+Y)"
              >
                  <RotateCw size={14} />
                  <span className="text-[10px]">Redo</span>
              </button>
            </div>
            
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
          </div>
        </div>

        {/* Plane Warning (Next to/Below tools) */}
        {mode === 'sketch' && sketchPlaneOrientation === 'NONE' && (
          <div 
            className="p-3 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              backdropFilter: 'blur(10px)', 
              borderRadius: panelBorderRadius,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              maxWidth: '220px'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Alignment Required</span>
            </div>
            <p className="text-[9px] leading-tight opacity-90">
              Orbit the camera until it snaps to a standard axis view to enable sketching.
            </p>
          </div>
        )}
      </div>

      {/* Plane Indicator Toast - Moved to screen center-top */}
      {mode === 'sketch' && sketchPlaneOrientation !== 'NONE' && (
        <div 
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full border border-white/20 flex items-center gap-3 transform transition-all duration-300 animate-in fade-in zoom-in-95 shadow-2xl"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', color: primaryColor }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse shadow-[0_0_10px_currentColor]" />
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] leading-none">
            Sketching on {sketchPlaneOrientation} PLANE
          </span>
        </div>
      )}

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
                ...(!isCameraDragging && {
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
                  <span className={`text-xs font-medium uppercase tracking-tighter ${
                    selectedObjectIndex === index ? 'text-purple-300' : 'text-gray-200'
                  }`} style={{ color: selectedObjectIndex === index ? primaryColor : undefined }}>
                    {obj.name || obj.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const isVisible = obj.visible !== false
                      updateObject(index, { visible: !isVisible })
                    }}
                    className="transition-colors hover:text-white"
                    style={{
                      color: obj.visible !== false ? primaryColor : '#666',
                      backgroundColor: 'transparent',
                      padding: '2px',
                    }}
                    title={obj.visible !== false ? 'Hide' : 'Show'}
                  >
                    {obj.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent selection when clicking delete
                      removeObject(index)
                    }}
                    className="transition-colors hover:text-white"
                    style={{
                      color: '#ef4444',
                      backgroundColor: 'transparent',
                      padding: '2px',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
      <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-full mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Extrusion Distance</span>
                    <DraggableNumberInput
                      value={obj.scale[2]}
                      onChange={(value) => {
                        // pushToHistory() // Frequent calls handled by DraggableNumberInput internal state or onFinish
                        updateObject(index, { scale: [obj.scale[0], obj.scale[1], value] })
                      }}
                      min={-500}
                      max={500}
                      step={0.1}
                      label="Distance"
                      dragSensitivity={0.05}
                      decimals={2}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Collision Warning Toast */}
      {collisions.length > 0 && mode === 'sketch' && (
        <div 
          className="absolute bottom-40 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl animate-pulse"
          style={{ 
            backgroundColor: 'rgba(255, 171, 0, 0.15)', 
            borderColor: 'rgba(255, 171, 0, 0.5)', 
            backdropFilter: 'blur(10px)',
            color: '#ffab00',
            zIndex: 100,
            maxWidth: '300px'
          }}
        >
          <AlertTriangle size={20} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Overlapping Shapes</span>
            <span className="text-[10px] opacity-90 leading-tight">
              {collisions.length} collision{collisions.length > 1 ? 's' : ''} detected. 
              Shapes may be combined when extruded.
            </span>
          </div>
        </div>
      )}

      {/* Collision Confirmation Dialog */}
      {showCollisionDialog && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[1000]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)' }}
        >
          <div 
            className="w-full max-w-md p-6 rounded-xl border"
            style={{ 
              backgroundColor: panelColor, 
              borderColor: 'rgba(255, 171, 0, 0.3)',
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <AlertTriangle size={24} className="text-yellow-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Overlapping Sketches Detected</h2>
            </div>
            
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              You have {collisions.length} overlapping shape{collisions.length > 1 ? 's' : ''}. 
              Would you like to combine them into single objects or keep them separate?
            </p>
            
              {sketchPlaneOrientation === 'NONE' && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 leading-tight">
                  <span className="font-bold uppercase block mb-1">Notice</span>
                  Orbit the camera to a standard axis view (Front, Top, Right, etc.) to enable sketching.
                </div>
              )}
              
              <div className="flex gap-2">
              <button
                onClick={() => {
                  if (sketchPlaneOrientation === 'NONE') return
                  combineOverlappingShapes()
                  setShowCollisionDialog(false)
                }}
                disabled={sketchPlaneOrientation === 'NONE'}
                className="w-full py-2.5 rounded-lg font-bold transition-all text-sm disabled:opacity-30"
                style={{ 
                  backgroundColor: primaryColor, 
                  color: buttonTextColor,
                  boxShadow: `0 0 15px ${primaryColor}44`
                }}
              >
                Combine & Finish
              </button>
              
              <button
                onClick={() => {
                  setShowCollisionDialog(false)
                  proceedWithFinish()
                }}
                className="w-full py-2.5 rounded-lg font-bold transition-all text-sm border border-white/20 text-white hover:bg-white/5"
              >
                Keep Separate
              </button>
              </div>
              
              <button
                onClick={() => setShowCollisionDialog(false)}
                className="w-full py-2.5 rounded-lg font-medium transition-all text-xs text-gray-400 hover:text-white"
              >
                Go Back to Sketch
              </button>
          </div>
        </div>
      )}

      {/* 3D Viewport */}
      <Canvas 
        shadows
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        onClick={handleCanvasClick}
        gl={{ antialias: true, stencil: true }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Environment preset="night" />
        
        <ContactShadows 
          position={[0, -0.01, 0]} 
          opacity={0.4} 
          scale={20} 
          blur={2.4} 
          far={4.5} 
        />
        <OrbitControls 
          ref={orbitControlsRef}
          makeDefault
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
            visible={obj.visible !== false}
            isSelected={selectedObjectIndex === index}
            onClick={() => setSelectedObjectIndex(index)}
            mode={mode}
          />
        ))}
        
        {/* Transform controls removed per user request */}
        
        {/* Camera Controls Component with Ref */}
        <CameraControls 
          controlsRef={cameraControlsRef}
          orbitControlsRef={orbitControlsRef}
        />
        
        {/* 2D Sketch Plane - Only visible in sketch mode */}
        {mode === 'sketch' && (
          <SketchPlane 
            sketchTool={sketchTool}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            currentSketchPoints={currentSketchPoints}
            setCurrentSketchPoints={setCurrentSketchPoints}
            sketchShapes={sketchShapes}
            setSketchShapes={setSketchShapes}
            objects={objects}
            setObjects={setObjects}
            selectedVertex={selectedVertex}
            setSelectedVertex={setSelectedVertex}
            handleDeleteVertex={() => {
              if (selectedVertex) {
                const newShapes = [...sketchShapes]
                const shape = newShapes[selectedVertex.shapeIndex]
                const newPoints = [...shape.points]
                newPoints.splice(selectedVertex.vertexIndex, 1)
                if (newPoints.length < 2) {
                  // If too few points, delete the shape
                  setSketchShapes(prev => prev.filter((_, i) => i !== selectedVertex.shapeIndex))
                  setSelectedVertex(null)
                } else {
                  newShapes[selectedVertex.shapeIndex] = { ...shape, points: newPoints }
                  setSketchShapes(newShapes)
                  setSelectedVertex(null)
                }
              }
            }}
            primaryColor={primaryColor}
            orientation={sketchPlaneOrientation}
          />
        )}

        <CameraWatcher setOrientation={setSketchPlaneOrientation} />
        
        {/* Camera Gizmo - Bottom Right Corner */}
        <GizmoHelper
          alignment="bottom-right"
          margin={[80, 80]}
          onUpdate={() => {}}
        >
          <GizmoViewcube />
        </GizmoHelper>
        
        
      </Canvas>

      {/* Control Tools - Center Bottom Toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2" style={{ backgroundColor: panelColor, backdropFilter: 'blur(3px)', padding: panelPadding, borderRadius: panelBorderRadius, color: 'white', zIndex: 50, display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Persistent CAD Mode Toggle Button */}
        <button
          onClick={() => {
            if (mode === '3d') {
              setMode('sketch')
            } else {
              handleFinishSketch()
            }
          }}
          className={`px-4 py-2 rounded-lg transition-all duration-300 font-semibold text-sm ${
            mode === '3d' ? 'text-white' : 'text-black'
          }`}
          style={{
            backgroundColor: mode === '3d' ? '#333333' : primaryColor,
            boxShadow: mode === '3d' 
              ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'
              : '0 4px 15px rgba(192, 240, 82, 0.4), 0 2px 10px rgba(192, 240, 82, 0.3)',
            border: mode === '3d' ? '1px solid #555' : '1px solid rgba(192, 240, 82, 0.5)',
            transform: 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            if (mode === '3d') {
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)'
            } else {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(192, 240, 82, 0.6), 0 4px 15px rgba(192, 240, 82, 0.45)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            if (mode === '3d') {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'
            } else {
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(192, 240, 82, 0.4), 0 2px 10px rgba(192, 240, 82, 0.3)'
            }
          }}
          title={mode === '3d' ? 'Switch to 2D Sketch Mode (Tab)' : 'Finish Sketch (Tab)'}
        >
          {mode === '3d' ? 'Switch to Sketch' : 'Finish Sketch'}
        </button>

        {/* Context-Sensitive Tools */}
        {mode === '3d' ? (
          // 3D Mode Tools
          <></>
        ) : (
          // 2D Sketch Mode Tools
          <>
            {/* Draw Tool (unified line/polygon) */}
            <button
              onClick={() => setSketchTool('draw')}
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
                sketchTool === 'draw' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: sketchTool === 'draw' ? primaryColor : buttonColor,
                color: sketchTool === 'draw' ? buttonTextColor : 'white',
                boxShadow: sketchTool === 'draw' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Draw Tool (D) - Click to add points, close loop for polygon"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20L8 16M8 16L12 12M8 16L4 12M12 12L16 8M12 12L8 8M16 8L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Rectangle Tool */}
            <button
              onClick={() => setSketchTool('rectangle')}
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
                sketchTool === 'rectangle' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: sketchTool === 'rectangle' ? primaryColor : buttonColor,
                color: sketchTool === 'rectangle' ? buttonTextColor : 'white',
                boxShadow: sketchTool === 'rectangle' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Rectangle Tool (R)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>

            {/* Circle Tool */}
            <button
              onClick={() => setSketchTool('circle')}
              className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
                sketchTool === 'circle' 
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: sketchTool === 'circle' ? primaryColor : buttonColor,
                color: sketchTool === 'circle' ? buttonTextColor : 'white',
                boxShadow: sketchTool === 'circle' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
              }}
              title="Circle Tool (C)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>

            {/* Edit Points Tool */}
            <div className="flex gap-1 bg-black/50 rounded-lg p-1">
              <button
                onClick={() => setSketchTool('edit')}
                className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center ${
                  sketchTool === 'edit' 
                    ? '' 
                    : ''
                }`}
                style={{
                  backgroundColor: sketchTool === 'edit' ? primaryColor : buttonColor,
                  color: sketchTool === 'edit' ? buttonTextColor : 'white',
                  boxShadow: sketchTool === 'edit' ? `0 0 15px rgba(200, 246, 92, 0.25), 0 0 30px rgba(200, 246, 92, 0.12)` : undefined
                }}
                title="Edit Points (E)"
              >
                <Edit3 size={24} />
              </button>
              
              {sketchTool === 'edit' && (
                <>
                  <button
                    onClick={() => setSketchTool('edit')} // Already in edit mode
                    className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center`}
                    style={{
                      backgroundColor: primaryColor,
                      color: buttonTextColor,
                      opacity: 1 // Dim slightly to imply it's the active mode indicator
                    }}
                    title="Move Points (Drag)"
                  >
                    <Move size={24} />
                  </button>
                  <button
                    onClick={handleDeleteVertex}
                    disabled={!selectedVertex}
                    className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center`}
                    style={{
                      backgroundColor: selectedVertex ? '#ff4444' : '#333',
                      color: 'white',
                       pointerEvents: selectedVertex ? 'auto' : 'none',
                       opacity: selectedVertex ? 1 : 0.5
                    }}
                    title="Delete Point (Del)"
                  >
                    <Trash2 size={24} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CameraWatcher({ setOrientation }: { setOrientation: (o: 'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'NONE') => void }) {
  const { camera } = useThree()
  
  useFrame(() => {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    
    // Check alignment with axes
    const threshold = 0.9995
    
    const up = new THREE.Vector3(0, 1, 0)
    const down = new THREE.Vector3(0, -1, 0)
    const right = new THREE.Vector3(1, 0, 0)
    const left = new THREE.Vector3(-1, 0, 0)
    const front = new THREE.Vector3(0, 0, 1)
    const back = new THREE.Vector3(0, 0, -1)
    
    if (dir.dot(down) > threshold) setOrientation('TOP')
    else if (dir.dot(up) > threshold) setOrientation('BOTTOM')
    else if (dir.dot(back) > threshold) setOrientation('FRONT')
    else if (dir.dot(front) > threshold) setOrientation('BACK')
    else if (dir.dot(left) > threshold) setOrientation('RIGHT')
    else if (dir.dot(right) > threshold) setOrientation('LEFT')
    else setOrientation('NONE')
  })
  
  return null
}



function Object3D({ 
  name, 
  type, 
  position, 
  rotation, 
  scale, 
  color, 
  shapePoints, 
  isSelected, 
  onClick, 
  mode,
  visible,
  orientation 
}: {
  name: string, 
  type: string, 
  position: [number, number, number], 
  rotation: [number, number, number], 
  scale: [number, number, number], 
  color: string, 
  shapePoints?: number[][], 
  isSelected?: boolean, 
  onClick?: () => void, 
  mode?: '3d' | 'sketch',
  visible?: boolean,
  orientation?: 'TOP' | 'FRONT' | 'RIGHT' | 'BOTTOM' | 'BACK' | 'LEFT'
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useEffect(() => {
    if (meshRef.current && onClick) {
      meshRef.current.userData = { onClick }
    }
  }, [onClick])

  const shouldShowOutline = isSelected
  
  // Memoize geometry for complex shapes
  const extrusionGeometry = useMemo(() => {
    if (type === 'extrusion' && shapePoints) {
      const shape = new THREE.Shape()
      shape.moveTo(shapePoints[0][0], shapePoints[0][1])
      for (let i = 1; i < shapePoints.length; i++) {
        shape.lineTo(shapePoints[i][0], shapePoints[i][1])
      }
      shape.closePath()
      
      const extrudeSettings = {
        steps: 1,
        depth: 1, // Standard depth, scaled by object Z scale
        bevelEnabled: false,
      }
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings)
    }
    return null
  }, [type, shapePoints])
  
  // Determine if we're in sketch mode for transparency
  const isSketchMode = mode === 'sketch'
  
  // Base material properties
  const materialProps = {
    color: color,
    transparent: isSketchMode,
    opacity: isSketchMode ? 0.3 : 1.0, // Increased visibility in sketch mode
    roughness: 0.3,
    metalness: 0.2
  }

  if (visible === false) return null

  switch (type) {
    case 'extrusion':
      if (!extrusionGeometry) return null
      return (
        <group>
          <mesh 
            ref={meshRef}
            name={name}
            position={(() => {
                // Adjust position based on orientation to keep extrusion centered on the plane
                switch (orientation) {
                    case 'FRONT':
                    case 'BACK':
                        return [position[0], position[1], -scale[2]/2]
                    case 'RIGHT':
                    case 'LEFT':
                        return [-scale[2]/2, position[1], position[2]]
                    default: // TOP/BOTTOM
                        return [position[0], -scale[2] / 2, position[2]]
                }
            })()} 
            rotation={rotation} 
            scale={scale}
            onClick={onClick}
            geometry={extrusionGeometry}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...materialProps} />
            {shouldShowOutline && <Edges color="white" threshold={15} />}
          </mesh>
        </group>
      )
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
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial {...materialProps} />
            {shouldShowOutline && <Edges color="white" threshold={15} />}
          </mesh>
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
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial {...materialProps} />
            {shouldShowOutline && <Edges color="white" threshold={15} />}
          </mesh>
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
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshStandardMaterial {...materialProps} />
            {shouldShowOutline && <Edges color="white" threshold={15} />}
          </mesh>
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
  // Camera Gizmo UI only - camera controls are handled by the version inside Canvas
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
          onClick={() => setCameraView('top')}
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
          onClick={toggleCameraMode}
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
          onClick={() => setCameraView('bottom')}
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
          onClick={() => setCameraView('left')}
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
          onClick={() => setCameraView('front')}
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
          onClick={() => setCameraView('right')}
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
          onClick={() => setCameraView('back')}
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

// Camera Controls Component - handles actual camera functionality inside Canvas
function CameraControls({ 
  controlsRef,
  orbitControlsRef
}: { 
  controlsRef: React.MutableRefObject<{
    setCameraView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => void
    toggleCameraMode: () => void
    switchToPerspective: () => void
  } | null>
  orbitControlsRef: React.MutableRefObject<any>
}) {
  const { camera, gl, set, scene } = useThree()
  
  const switchToPerspective = () => {
    if (camera instanceof THREE.PerspectiveCamera) return // Already perspective

    const perspectiveCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    perspectiveCamera.position.copy(camera.position)
    perspectiveCamera.quaternion.copy(camera.quaternion)
    perspectiveCamera.updateProjectionMatrix()
    
    set({ camera: perspectiveCamera })
  }

  const switchToOrtho = () => {
    if (camera instanceof THREE.OrthographicCamera) return // Already ortho

    const aspect = window.innerWidth / window.innerHeight
    const distance = camera.position.length() || 10
    const frustumSize = distance
    
    const orthoCamera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2, 
      frustumSize * aspect / 2, 
      frustumSize / 2, 
      -frustumSize / 2, 
      0.1, 
      1000
    )
    
    orthoCamera.position.copy(camera.position)
    orthoCamera.quaternion.copy(camera.quaternion)
    orthoCamera.updateProjectionMatrix()

    set({ camera: orthoCamera })
  }

  // Override the setCameraView function to actually implement camera control
  const handleSetCameraView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'camera') => {
    // Define camera positions for each view
    const viewPositions = {
      front: { position: [0, 0, 10], target: [0, 0, 0] },
      back: { position: [0, 0, -10], target: [0, 0, 0] },
      right: { position: [10, 0, 0], target: [0, 0, 0] },
      left: { position: [-10, 0, 0], target: [0, 0, 0] },
      top: { position: [0, 10, 0], target: [0, 0, 0] },
      bottom: { position: [0, -10, 0], target: [0, 0, 0] },
      camera: { position: [5, 5, 5], target: [0, 0, 0] }
    }
    
    const targetView = viewPositions[view]
    if (targetView) {
      // Just move the active camera, do not auto-switch modes
      camera.position.set(targetView.position[0], targetView.position[1], targetView.position[2])
      camera.lookAt(targetView.target[0], targetView.target[1], targetView.target[2])
      
      // Ensure orientation is upright for standard views to prevent roll
      if (view === 'top' || view === 'bottom') {
        camera.up.set(0, 0, -1) 
      } else {
        camera.up.set(0, 1, 0)
      }
      
      camera.updateProjectionMatrix()
      
      // Reset OrbitControls target to center to avoid jumps
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0)
        orbitControlsRef.current.update()
      }
      
      // Trigger a render
      gl.render(scene, camera)
    }
  }

  // Manual toggle for camera mode
  const handleToggleCameraMode = () => {
    if (camera instanceof THREE.PerspectiveCamera) {
      switchToOrtho()
    } else {
      switchToPerspective()
    }
  }

  // Update the parent component's functions
  useEffect(() => {
    if (controlsRef) {
      controlsRef.current = {
        setCameraView: handleSetCameraView,
        toggleCameraMode: handleToggleCameraMode,
        switchToPerspective: () => switchToPerspective()
      }
    }
  }, [camera, gl, set, handleSetCameraView, handleToggleCameraMode, switchToPerspective])

  return null
}

// 2D Sketch Plane Component
function SketchPlane({ 
  sketchTool, 
  isDrawing, 
  setIsDrawing, 
  currentSketchPoints, 
  setCurrentSketchPoints, 
  sketchShapes, 
  setSketchShapes, 
  objects, 
  setObjects,
  selectedVertex,
  setSelectedVertex,
  handleDeleteVertex,
  primaryColor,
  orientation
}: { 
  sketchTool: 'draw' | 'rectangle' | 'circle' | 'select' | 'edit'
  isDrawing: boolean
  setIsDrawing: (val: boolean) => void
  currentSketchPoints: Array<[number, number]>
  setCurrentSketchPoints: (points: Array<[number, number]>) => void
  sketchShapes: Array<{id: string, type: string, points: Array<[number, number]>, color: string, extruded: boolean, orientation: 'TOP' | 'FRONT' | 'RIGHT' | 'BOTTOM' | 'BACK' | 'LEFT'}>
  setSketchShapes: React.Dispatch<React.SetStateAction<Array<{id: string, type: string, points: Array<[number, number]>, color: string, extruded: boolean, orientation: 'TOP' | 'FRONT' | 'RIGHT' | 'BOTTOM' | 'BACK' | 'LEFT'}>>>
  objects: Array<{type: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: string, sketchId?: string}>
  setObjects: React.Dispatch<React.SetStateAction<Array<{type: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: string, sketchId?: string}>>>
  selectedVertex: {shapeIndex: number, vertexIndex: number} | null
  setSelectedVertex: React.Dispatch<React.SetStateAction<{shapeIndex: number, vertexIndex: number} | null>>
  handleDeleteVertex: () => void
  primaryColor: string
  orientation: 'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT' | 'NONE'
}) {
  const { camera, gl, raycaster, mouse, scene } = useThree()
  const planeRef = useRef<THREE.Mesh>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [dragStartPoint, setDragStartPoint] = useState<[number, number] | null>(null)
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null)

  // Handle mouse events for drawing

  
  const finishShape = () => {
    if (currentSketchPoints.length > 0) {
      let finalPoints = [...currentSketchPoints]
      
      let shapeType: string = sketchTool
      
      if (sketchTool === 'rectangle' && finalPoints.length === 4) {
         // Keep as is
      } else if (sketchTool === 'circle' && finalPoints.length === 2) {
         // Keep as is
      } else if (sketchTool === 'draw') {
         // Remove the last "cursor" point
         finalPoints.pop()
         
         // Ensure we have enough points
         if (finalPoints.length < 2) {
            cancelShape()
            return
         }
         
         // Check if loop is closed (first point === last point)
         const firstPoint = finalPoints[0]
         const lastPoint = finalPoints[finalPoints.length - 1]
         const dist = Math.sqrt(Math.pow(lastPoint[0] - firstPoint[0], 2) + Math.pow(lastPoint[1] - firstPoint[1], 2))
         
         if (dist < 0.1 && finalPoints.length >= 3) {
            // Closed loop -> polygon
            shapeType = 'polygon'
            // Ensure loop is closed
            if (finalPoints[0] !== finalPoints[finalPoints.length - 1]) {
                finalPoints.push(finalPoints[0])
            }
         } else {
            // Open polyline
            shapeType = 'polyline'
         }
      }

      const newShape = {
        id: `shape_${Date.now()}`,
        type: shapeType,
        points: finalPoints,
        color: '#c0f052',
        extruded: false,
        orientation: orientation === 'NONE' ? 'TOP' : orientation
      }
      
      setSketchShapes((prev: any) => [...prev, newShape])
      setCurrentSketchPoints([])
      setIsDrawing(false)
      setDragStartPoint(null)
    }
  }
  
  const cancelShape = () => {
    setCurrentSketchPoints([])
    setIsDrawing(false)
    setDragStartPoint(null)
  }

  // Helper for grid snapping
  const snapToGrid = (val: number, step: number = 0.5) => {
    return Math.round(val / step) * step
  }

  // Helper for vertex snapping
  const getSnappingPoint = (point: [number, number]): { point: [number, number], snapped: boolean } => {
    // Check for snapping to existing vertices
    const snapThreshold = 0.5
    let closestDist = Infinity
    let closestPoint: [number, number] | null = null

    // Iterate through all existing shapes to find vertices
    sketchShapes.forEach(shape => {
      shape.points.forEach(p => {
        const dist = Math.sqrt(Math.pow(p[0] - point[0], 2) + Math.pow(p[1] - point[1], 2))
        if (dist < snapThreshold && dist < closestDist) {
          closestDist = dist
          closestPoint = p
        }
      })
    })

    // Also check start point if drawing with draw tool (for closing loop)
    if (sketchTool === 'draw' && isDrawing && currentSketchPoints.length > 0) {
       const startPoint = currentSketchPoints[0]
       const dist = Math.sqrt(Math.pow(startPoint[0] - point[0], 2) + Math.pow(startPoint[1] - point[1], 2))
       if (dist < snapThreshold && dist < closestDist) {
           closestDist = dist
           closestPoint = startPoint
       }
    }

    if (closestPoint) {
      return { point: closestPoint, snapped: true }
    }

    // Default to grid snapping
    return { 
      point: [snapToGrid(point[0]), snapToGrid(point[1])],
      snapped: false
    }
  }

  // Get mouse position on the sketch plane
  const getMousePointOnPlane = (e: any): { point: [number, number], snapped: boolean } | null => {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    // Update raycaster
    mouse.set(x, y)
    raycaster.setFromCamera(mouse, camera)

    // Raycast onto dynamic plane based on orientation
    let planeNormal = new THREE.Vector3(0, 1, 0)
    switch (orientation) {
        case 'FRONT': planeNormal.set(0, 0, 1); break
        case 'BACK':  planeNormal.set(0, 0, -1); break
        case 'RIGHT': planeNormal.set(1, 0, 0); break
        case 'LEFT':  planeNormal.set(-1, 0, 0); break
        case 'TOP':    planeNormal.set(0, 1, 0); break
        case 'BOTTOM': planeNormal.set(0, -1, 0); break
    }

    const plane = new THREE.Plane(planeNormal, 0)
    const intersection = new THREE.Vector3()
    
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      // Map 3D intersection back to 2D sketch points based on orientation
      let u = 0, v = 0
      switch (orientation) {
          case 'TOP':
          case 'BOTTOM':
              u = intersection.x
              v = intersection.z
              break
          case 'FRONT':
          case 'BACK':
              u = intersection.x
              v = intersection.y
              break
          case 'RIGHT':
              v = intersection.y
              break
      }
      return getSnappingPoint([u, v])
    }
    
    return null
  }
  
  
  // State for visual feedback of snapping
  const [activeSnapPoint, setActiveSnapPoint] = useState<[number, number] | null>(null)
  // const [selectedVertex, setSelectedVertex] = useState<{shapeIndex: number, vertexIndex: number} | null>(null) // Lifted
  const [isDraggingVertex, setIsDraggingVertex] = useState(false)

  // Handle mouse events for drawing
  const handlePointerDown = (e: any) => {
    // Right-click to cancel drawing
    if (e.button === 2 && isDrawing && sketchTool === 'draw') {
      cancelShape()
      e.stopPropagation()
      return
    }
    
    // Only allow left click (button 0) for drawing/editing
    if (e.button !== 0) return

    // If Editing Points
    if (sketchTool === 'edit') {
       const result = getMousePointOnPlane(e)
       if (!result) return
       const { point } = result

       // Check collision with vertices
       // We prioritize the selected shape if possible, but check all
       // Actually, usually you only edit the selected shape.
       // Let's enforce: Must select shape first? 
       // Or just check all vertices.
       // Let's check all vertices of ALL shapes for ease of use.
       
       const clickThreshold = 0.5
       let hitVertex: { shapeIndex: number, vertexIndex: number } | null = null
       
       sketchShapes.forEach((shape, sIdx) => {
          shape.points.forEach((p, vIdx) => {
             const dist = Math.sqrt(Math.pow(p[0] - point[0], 2) + Math.pow(p[1] - point[1], 2))
             if (dist < clickThreshold) {
                hitVertex = { shapeIndex: sIdx, vertexIndex: vIdx }
             }
          })
       })

        if (hitVertex) {
           const vertex = hitVertex as { shapeIndex: number, vertexIndex: number }
           setSelectedVertex(vertex)
           setSelectedShapeIndex(vertex.shapeIndex) // Auto-select shape
           setIsDraggingVertex(true)
           setIsMouseDown(true)
           e.stopPropagation() // Prevent other handlers
           return
        } else {
          // Deselect point if clicking empty space
          setSelectedVertex(null)
       }
       
       // Allow selecting shape body to select generic shape context
       // Fallthrough to standard selection logic if implemented or return
       return
    }

    if (sketchTool === 'select') return

    // ... Standard Drawing Logic ...
    // Prevent default to stop camera moves if we are drawing
    // But we need to be careful not to block OrbitControls if we are just panning
    // For now, drawing takes precedence
    
    const result = getMousePointOnPlane(e)
    if (!result) return
    const { point } = result

    if (!isDrawing) {
       // Start Drawing (Click 1)
       setIsMouseDown(true)
       setDragStartPoint(point)
       // Initialize with two points: start and current (same)
       setCurrentSketchPoints([point, point]) 
       setIsDrawing(true)
    } else {
       // Continue/Finish Drawing (Click 2+)
       
       if (sketchTool === 'draw') {
         // Check closure
         const startPoint = currentSketchPoints[0]
         const dist = Math.sqrt(Math.pow(point[0] - startPoint[0], 2) + Math.pow(point[1] - startPoint[1], 2))
         
         if (dist < 0.5 && currentSketchPoints.length > 3) {
           finishShape() // Close loop
         } else {
           // Add new point
           // Update the "floating" point to be fixed, and add a new floating point
           const newPoints = [...currentSketchPoints]
           newPoints[newPoints.length - 1] = point // Fix current
           newPoints.push(point) // Add new floating
           setCurrentSketchPoints(newPoints)
         }
       } else {
         // Rectangle, Circle -> Finish on 2nd Click
         finishShape()
       }
    }
  }

  const handlePointerMove = (e: any) => {
    const result = getMousePointOnPlane(e)
    
    // Update snap visual
    if (result && result.snapped) {
        setActiveSnapPoint(result.point)
    } else {
        setActiveSnapPoint(null)
    }

    if (!result) return
    const { point } = result

    // Vertex Dragging Logic
    if (sketchTool === 'edit' && isDraggingVertex && selectedVertex) {
       const newShapes = [...sketchShapes]
       const shape = newShapes[selectedVertex.shapeIndex]
       const newPoints = [...shape.points]
       
       // Special handling for Rectangle/Circle to maintain specific geometry?
       // For now, allow free deformation (effectively converting to Polygon behavior for points)
       // Or enforce constraints.
       // User asked to "edit these point".
       // If I drag a rectangle corner, it becomes a generic quad.
       // If I drag a circle point? Circle is defined by [Center, RadiusPoint].
       // Moving center -> Moves circle. Moving radius point -> Resizes.
       // Let's support that.
       
       if (shape.type === 'rectangle') {
           // Convert to polygon if a point is dragged
           const updatedShape = { ...shape, type: 'polygon', points: newPoints }
           updatedShape.points[selectedVertex.vertexIndex] = point
           newShapes[selectedVertex.shapeIndex] = updatedShape
       } else if (shape.type === 'circle') {
           const [center, radiusPoint] = newPoints
           if (selectedVertex.vertexIndex === 0) { // Dragging center
               newPoints[0] = point
           } else if (selectedVertex.vertexIndex === 1) { // Dragging radius point
               const radius = Math.sqrt(Math.pow(point[0] - center[0], 2) + Math.pow(point[1] - center[1], 2))
               newPoints[1] = [radius, 0] // Store radius as [radius, 0]
           }
           newShapes[selectedVertex.shapeIndex] = { ...shape, points: newPoints }
       } else {
           // For line and polygon, just update the point
           newPoints[selectedVertex.vertexIndex] = point
           newShapes[selectedVertex.shapeIndex] = { ...shape, points: newPoints }
       }
       
       setSketchShapes(newShapes)
       return
    }

    if (isDrawing) {
       // Always update the last point to follow cursor (Rubber banding)
       const updatedPoints = [...currentSketchPoints]
       
       if (sketchTool === 'draw') {
         updatedPoints[updatedPoints.length - 1] = point
       } else if (sketchTool === 'rectangle') {
         // Rect logic needs start point and current point to define 4 corners
         const start = updatedPoints[0]
         updatedPoints[1] = [point[0], start[1]]
         updatedPoints[2] = point
         updatedPoints[3] = [start[0], point[1]]
         // Note: We might need to ensure points array length is correct
         if (updatedPoints.length < 4) {
             // Should not happen if initialized correctly in PointerDown
         }
       } else if (sketchTool === 'circle') {
         const start = updatedPoints[0]
         const radius = Math.sqrt(Math.pow(point[0] - start[0], 2) + Math.pow(point[1] - start[1], 2))
         updatedPoints[1] = [radius, 0]
       }
       
       setCurrentSketchPoints(updatedPoints)
    }
  }

  const handlePointerUp = (e: any) => {
    if (sketchTool === 'edit' && isDraggingVertex) {
        setIsDraggingVertex(false)
        setIsMouseDown(false)
        return
    }
    
    // No-op for Click-Click workflow
    // We only track mouse down/up for general state if needed, but drawing logic is in Down
    setIsMouseDown(false)
  }

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to cancel drawing
      if (e.key === 'Escape') {
        if (isDrawing && sketchTool === 'draw') {
          cancelShape()
          e.preventDefault()
          return
        }
      }
      
      // Delete/Backspace for vertex or shape deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (sketchTool === 'edit' && selectedVertex) {
           handleDeleteVertex()
        } else if (selectedShapeIndex !== null) {
          // Delete entire shape
          setSketchShapes((prev: any) => prev.filter((_item: any, i: number) => i !== selectedShapeIndex))
          setSelectedShapeIndex(null)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedShapeIndex, selectedVertex, sketchTool, sketchShapes, setSketchShapes, handleDeleteVertex, isDrawing, cancelShape])

  // Handle shape selection
  const handleShapeClick = (shapeIndex: number) => {
    if (sketchTool === 'select') {
      setSelectedShapeIndex(shapeIndex === selectedShapeIndex ? null : shapeIndex)
    }
  }


  return (
    <>
      {/* Sketch Plane */}
      <mesh 
        rotation={(() => {
            switch (orientation) {
                case 'FRONT': return [0, 0, 0]
                case 'BACK': return [0, Math.PI, 0]
                case 'RIGHT': return [0, -Math.PI/2, 0]
                case 'LEFT': return [0, Math.PI/2, 0]
                case 'BOTTOM': return [Math.PI/2, 0, 0]
                default: return [-Math.PI / 2, 0, 0] // TOP
            }
        })()}
        position={[0, 0, 0]} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Grid Helper on Plane */}
      <Grid 
        args={[100, 100]} 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#444" 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#222" 
        fadeDistance={50}
        infiniteGrid
        rotation={(() => {
            switch (orientation) {
                case 'FRONT': return [Math.PI/2, 0, 0]
                case 'BACK': return [Math.PI/2, 0, 0]
                case 'RIGHT': return [Math.PI/2, 0, Math.PI/2]
                case 'LEFT': return [Math.PI/2, 0, Math.PI/2]
                case 'BOTTOM': return [0, 0, 0]
                default: return [0, 0, 0] // TOP
            }
        })()} 
      />

      {/* Existing Shapes */}
      {sketchShapes.map((shape, index) => (
        <group key={shape.id}>
          {shape.type === 'poly' || shape.type === 'polygon' || shape.type === 'polyline' ? (
             <line>
               <bufferGeometry attach="geometry">
                 <bufferAttribute 
                   attach="attributes-position"
                   args={[
                     new Float32Array(
                       (shape.type === 'polygon' ? [...shape.points, shape.points[0]] : shape.points)
                         .flatMap(p => {
                            switch (shape.orientation) {
                                case 'FRONT':
                                case 'BACK':
                                    return [p[0], p[1], 0.01]
                                case 'RIGHT':
                                case 'LEFT':
                                    return [0.01, p[1], p[0]]
                                default: // TOP/BOTTOM
                                    return [p[0], 0.01, p[1]]
                            }
                         })
                     ),
                     3
                   ]}
                 />
               </bufferGeometry>
               <lineBasicMaterial attach="material" color={selectedShapeIndex === index ? primaryColor : shape.color} linewidth={2} />
             </line>
          ) : shape.type === 'rectangle' ? (
             <line>
               <bufferGeometry attach="geometry">
                 <bufferAttribute 
                   attach="attributes-position"
                   args={[
                     new Float32Array([
                       ...shape.points, shape.points[0]
                     ].flatMap(p => {
                        switch (shape.orientation) {
                            case 'FRONT':
                            case 'BACK':
                                return [p[0], p[1], 0.01]
                            case 'RIGHT':
                            case 'LEFT':
                                return [0.01, p[1], p[0]]
                            default: // TOP/BOTTOM
                                return [p[0], 0.01, p[1]]
                        }
                     })),
                     3
                   ]}
                 />
               </bufferGeometry>
               <lineBasicMaterial attach="material" color={selectedShapeIndex === index ? primaryColor : shape.color} linewidth={2} />
             </line>
          ) : shape.type === 'circle' ? (
             <mesh 
                position={(() => {
                    switch (shape.orientation) {
                        case 'FRONT':
                        case 'BACK':
                            return [shape.points[0][0], shape.points[0][1], 0.01]
                        case 'RIGHT':
                        case 'LEFT':
                            return [0.01, shape.points[0][1], shape.points[0][0]]
                        default: // TOP/BOTTOM
                            return [shape.points[0][0], 0.01, shape.points[0][1]]
                    }
                })()} 
                rotation={(() => {
                    switch (shape.orientation) {
                        case 'FRONT':
                        case 'BACK':
                            return [0, 0, 0]
                        case 'RIGHT':
                        case 'LEFT':
                            return [0, -Math.PI/2, 0]
                        default: // TOP/BOTTOM
                            return [-Math.PI / 2, 0, 0]
                    }
                })()}
             >
               <ringGeometry args={[shape.points[1][0] - 0.05, shape.points[1][0], 64]} />
               <meshBasicMaterial color={selectedShapeIndex === index ? primaryColor : shape.color} side={THREE.DoubleSide} />
             </mesh>
          ) : null}

          {/* Selection Visuals */}
          {selectedShapeIndex === index && (
            <line>
               <bufferGeometry attach="geometry">
               <bufferAttribute 
                   attach="attributes-position"
                   args={[
                     new Float32Array(
                       (shape.type === 'polygon' || shape.type === 'rectangle' ? [...shape.points, shape.points[0]] : shape.points)
                         .flatMap(p => [p[0], 0.015, p[1]])
                     ),
                     3
                   ]}
                 />
               </bufferGeometry>
               <lineBasicMaterial attach="material" color={primaryColor} linewidth={4} opacity={0.5} transparent />
            </line>
          )}

          {/* Interactive Vertices (when in edit mode) */}
          {sketchTool === 'edit' && shape.points.map((p, vIdx) => (
             <mesh 
               key={vIdx} 
               position={(() => {
                    switch (shape.orientation) {
                        case 'FRONT':
                        case 'BACK':
                            return [p[0], p[1], 0.02]
                        case 'RIGHT':
                        case 'LEFT':
                            return [0.02, p[1], p[0]]
                        default: // TOP/BOTTOM
                            return [p[0], 0.02, p[1]]
                    }
               })()}
               onClick={(e) => {
                 e.stopPropagation()
                 setSelectedVertex({ shapeIndex: index, vertexIndex: vIdx })
               }}
             >
               <sphereGeometry args={[selectedVertex?.shapeIndex === index && selectedVertex?.vertexIndex === vIdx ? 0.12 : 0.08]} />
               <meshBasicMaterial color={selectedVertex?.shapeIndex === index && selectedVertex?.vertexIndex === vIdx ? '#ffab00' : 'white'} />
             </mesh>
          ))}
        </group>
      ))}

      {/* Current Drawing Shape Visualization */}
      {isDrawing && currentSketchPoints.length > 0 && (
        <group>
          <line>
            <bufferGeometry attach="geometry">
               <bufferAttribute 
                attach="attributes-position"
                args={[
                  new Float32Array(currentSketchPoints.flatMap(p => {
                    switch (orientation) {
                        case 'FRONT':
                        case 'BACK':
                            return [p[0], p[1], 0.01]
                        case 'RIGHT':
                        case 'LEFT':
                            return [0.01, p[1], p[0]]
                        default: // TOP/BOTTOM
                            return [p[0], 0.01, p[1]]
                    }
                  })),
                  3
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color={primaryColor} linewidth={2} />
          </line>
          {/* Snap feedback */}
          {activeSnapPoint && (
             <mesh position={(() => {
                switch (orientation) {
                    case 'FRONT':
                    case 'BACK':
                        return [activeSnapPoint[0], activeSnapPoint[1], 0.02]
                    case 'RIGHT':
                    case 'LEFT':
                        return [0.02, activeSnapPoint[1], activeSnapPoint[0]]
                    default: // TOP/BOTTOM
                        return [activeSnapPoint[0], 0.02, activeSnapPoint[1]]
                }
             })()}>
               <sphereGeometry args={[0.1]} />
               <meshBasicMaterial color={primaryColor} />
             </mesh>
          )}
        </group>
      )}
    </>
  )
}
