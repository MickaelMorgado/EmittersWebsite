'use client'
import { Edges, Environment, GizmoHelper, GizmoViewcube, Grid, Html, OrbitControls, TransformControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RotateCcw, RotateCw, Download } from 'lucide-react'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { VersionBadge } from '@/components/VersionBadge'

type Vertex = [number, number, number]
type Face = number[]
interface EditableMesh { vertices: Vertex[]; faces: Face[] }

function createCube(): EditableMesh {
  return {
    vertices: [
      [-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5],
      [-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5],
    ],
    faces: [
      [4,5,6,7],[1,0,3,2],[5,1,2,6],[0,4,7,3],[7,6,2,3],[0,1,5,4],
    ],
  }
}

function getFaceNormal(mesh: EditableMesh, fi: number): THREE.Vector3 {
  const f = mesh.faces[fi]
  const a = new THREE.Vector3(...mesh.vertices[f[0]])
  const b = new THREE.Vector3(...mesh.vertices[f[1]])
  const c = new THREE.Vector3(...mesh.vertices[f[2]])
  return new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize()
}

function getFaceCenter(mesh: EditableMesh, fi: number): THREE.Vector3 {
  const f = mesh.faces[fi]
  const center = new THREE.Vector3()
  f.forEach(i => center.add(new THREE.Vector3(...mesh.vertices[i])))
  return center.divideScalar(f.length)
}

function buildGeometry(mesh: EditableMesh): THREE.BufferGeometry {
  const pos: number[] = [], nrm: number[] = []
  mesh.faces.forEach(face => {
    if (face.length < 3) return
    const v = face.map(i => new THREE.Vector3(...mesh.vertices[i]))
    const n = new THREE.Vector3().crossVectors(v[1].clone().sub(v[0]), v[2].clone().sub(v[0])).normalize()
    for (let tri = 1; tri < face.length - 1; tri++) {
      for (const j of [0, tri, tri+1]) { pos.push(v[j].x,v[j].y,v[j].z); nrm.push(n.x,n.y,n.z) }
    }
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  return geo
}

function buildFaceHighlight(mesh: EditableMesh, fi: number): THREE.BufferGeometry {
  const f = mesh.faces[fi]
  const offset = getFaceNormal(mesh, fi).multiplyScalar(0.005)
  const v = f.map(i => new THREE.Vector3(...mesh.vertices[i]).add(offset))
  const pos: number[] = []
  for (let tri = 1; tri < f.length - 1; tri++) {
    for (const j of [0, tri, tri+1]) pos.push(v[j].x, v[j].y, v[j].z)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return geo
}

function extrudeFace(mesh: EditableMesh, fi: number, amount: number): EditableMesh {
  const face = mesh.faces[fi]
  const n = getFaceNormal(mesh, fi)
  const verts = mesh.vertices.map(v => [...v] as Vertex)
  const base = [...face] as number[]
  const ni = [verts.length, verts.length+1, verts.length+2, verts.length+3]
  base.forEach(vi => {
    const v = mesh.vertices[vi]
    verts.push([v[0]+n.x*amount, v[1]+n.y*amount, v[2]+n.z*amount])
  })
  const faces = mesh.faces.map(f => [...f] as Face)
  faces[fi] = ni as unknown as Face
  faces.push([base[0],base[1],ni[1],ni[0]] as Face)
  faces.push([base[1],base[2],ni[2],ni[1]] as Face)
  faces.push([base[2],base[3],ni[3],ni[2]] as Face)
  faces.push([base[3],base[0],ni[0],ni[3]] as Face)
  return { vertices: verts, faces }
}

function insetFace(mesh: EditableMesh, fi: number, amount: number): EditableMesh {
  const face = mesh.faces[fi]
  const center = getFaceCenter(mesh, fi)
  const verts = mesh.vertices.map(v => [...v] as Vertex)
  const base = [...face] as number[]
  const ni = [verts.length, verts.length+1, verts.length+2, verts.length+3]
  base.forEach(vi => {
    const v = mesh.vertices[vi]
    const dx = center.x - v[0], dy = center.y - v[1], dz = center.z - v[2]
    const dist = Math.hypot(dx, dy, dz)
    const t = dist > 0 ? Math.min(amount / dist, 0.99) : 0
    verts.push([v[0]+dx*t, v[1]+dy*t, v[2]+dz*t])
  })
  const faces = mesh.faces.map(f => [...f] as Face)
  faces[fi] = ni as unknown as Face
  faces.push([base[0],base[1],ni[1],ni[0]] as Face)
  faces.push([base[1],base[2],ni[2],ni[1]] as Face)
  faces.push([base[2],base[3],ni[3],ni[2]] as Face)
  faces.push([base[3],base[0],ni[0],ni[3]] as Face)
  return { vertices: verts, faces }
}

function bevelVertex(mesh: EditableMesh, vi: number, amount: number, mode: 'chamfer' | 'bevel'): EditableMesh {
  const verts: Vertex[] = mesh.vertices.map(v => [...v] as Vertex)
  const vPos = new THREE.Vector3(...mesh.vertices[vi])
  const capVerts: { ni: number; fi: number }[] = []

  const faces: Face[] = mesh.faces.map((face, fi) => {
    const p = face.indexOf(vi)
    if (p === -1) return [...face]

    let target: THREE.Vector3
    if (mode === 'chamfer') {
      // aim toward midpoint of the two edge-neighbours inside this face
      const prev = new THREE.Vector3(...mesh.vertices[face[(p - 1 + face.length) % face.length]])
      const next = new THREE.Vector3(...mesh.vertices[face[(p + 1) % face.length]])
      target = prev.add(next).multiplyScalar(0.5)
    } else {
      // aim toward face centre (smoother rounding)
      const fc = new THREE.Vector3()
      face.forEach(idx => fc.add(new THREE.Vector3(...mesh.vertices[idx])))
      target = fc.divideScalar(face.length)
    }

    const dir = target.clone().sub(vPos)
    const dist = dir.length()
    const t = dist > 0 ? Math.min(amount / dist, 0.95) : 0
    const ni = verts.length
    verts.push([vPos.x + dir.x * t, vPos.y + dir.y * t, vPos.z + dir.z * t])
    capVerts.push({ ni, fi })
    return face.map(idx => idx === vi ? ni : idx)
  })

  // Sort cap vertices angularly → well-wound cap polygon
  if (capVerts.length >= 3) {
    const avgN = new THREE.Vector3()
    capVerts.forEach(({ fi }) => avgN.add(getFaceNormal(mesh, fi)))
    avgN.normalize()
    const capPs = capVerts.map(({ ni }) => new THREE.Vector3(...verts[ni]))
    const cent = capPs.reduce((a, p) => a.clone().add(p), new THREE.Vector3()).multiplyScalar(1 / capPs.length)
    const bU = capPs[0].clone().sub(cent).normalize()
    const bV = new THREE.Vector3().crossVectors(avgN, bU).normalize()
    capVerts.sort((a, b) => {
      const pa = new THREE.Vector3(...verts[a.ni]).sub(cent)
      const pb = new THREE.Vector3(...verts[b.ni]).sub(cent)
      return Math.atan2(pa.dot(bV), pa.dot(bU)) - Math.atan2(pb.dot(bV), pb.dot(bU))
    })
    faces.push(capVerts.map(c => c.ni))
  }

  return { vertices: verts, faces }
}

function inwardNeighbor(face: number[], vi: number, vj: number): number {
  const p = face.indexOf(vi)
  const prev = face[(p - 1 + face.length) % face.length]
  const next = face[(p + 1) % face.length]
  return prev === vj ? next : prev
}

function chamferEdge(mesh: EditableMesh, vi: number, vj: number, amount: number, mode: 'chamfer' | 'bevel' = 'chamfer'): EditableMesh {
  const sharedFis = mesh.faces.reduce((acc, face, fi) => {
    if (face.indexOf(vi) !== -1 && face.indexOf(vj) !== -1) acc.push(fi)
    return acc
  }, [] as number[])
  if (sharedFis.length < 2) return mesh

  const [fi1, fi2] = sharedFis
  const face1 = mesh.faces[fi1], face2 = mesh.faces[fi2]
  const verts: Vertex[] = mesh.vertices.map(v => [...v] as Vertex)
  const viPos = new THREE.Vector3(...mesh.vertices[vi])
  const vjPos = new THREE.Vector3(...mesh.vertices[vj])

  const nudge = (from: THREE.Vector3, towardIdx: number): Vertex => {
    const to = new THREE.Vector3(...mesh.vertices[towardIdx])
    const dir = to.clone().sub(from)
    const dist = dir.length()
    const t = dist > 0 ? Math.min(amount / dist, 0.95) : 0
    return [from.x + dir.x * t, from.y + dir.y * t, from.z + dir.z * t]
  }

  const n1vi = verts.length; verts.push(nudge(viPos, inwardNeighbor(face1, vi, vj)))
  const n1vj = verts.length; verts.push(nudge(vjPos, inwardNeighbor(face1, vj, vi)))
  const n2vi = verts.length; verts.push(nudge(viPos, inwardNeighbor(face2, vi, vj)))
  const n2vj = verts.length; verts.push(nudge(vjPos, inwardNeighbor(face2, vj, vi)))

  const faces: Face[] = mesh.faces.map((face, fi) => {
    if (fi !== fi1 && fi !== fi2) return [...face]
    const nvi = fi === fi1 ? n1vi : n2vi
    const nvj = fi === fi1 ? n1vj : n2vj
    return face.map(idx => idx === vi ? nvi : idx === vj ? nvj : idx)
  })

  // determine winding: new face normal should match avg of the two face normals
  const expectedN = getFaceNormal(mesh, fi1).add(getFaceNormal(mesh, fi2)).normalize()
  const a = new THREE.Vector3(...verts[n1vi])
  const b = new THREE.Vector3(...verts[n1vj])
  const c = new THREE.Vector3(...verts[n2vi])
  const proposedN = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a))
  const windCW = proposedN.dot(expectedN) > 0

  if (mode === 'chamfer') {
    // Single flat cut face
    if (windCW) {
      faces.push([n1vi, n1vj, n2vj, n2vi])
    } else {
      faces.push([n1vi, n2vi, n2vj, n1vj])
    }
  } else {
    // Bevel: 2-segment arc — bisector midpoints per endpoint, 2 faces
    const bisector = (pos: THREE.Vector3, nb1Idx: number, nb2Idx: number): Vertex => {
      const nb1 = new THREE.Vector3(...mesh.vertices[nb1Idx])
      const nb2 = new THREE.Vector3(...mesh.vertices[nb2Idx])
      const d1 = nb1.clone().sub(pos).normalize()
      const d2 = nb2.clone().sub(pos).normalize()
      const bisDir = d1.add(d2).normalize()
      return [pos.x + bisDir.x * amount, pos.y + bisDir.y * amount, pos.z + bisDir.z * amount]
    }

    const nmidVi = verts.length
    verts.push(bisector(viPos, inwardNeighbor(face1, vi, vj), inwardNeighbor(face2, vi, vj)))
    const nmidVj = verts.length
    verts.push(bisector(vjPos, inwardNeighbor(face1, vj, vi), inwardNeighbor(face2, vj, vi)))

    if (windCW) {
      faces.push([n1vi, n1vj, nmidVj, nmidVi])
      faces.push([nmidVi, nmidVj, n2vj, n2vi])
    } else {
      faces.push([n1vi, nmidVi, nmidVj, n1vj])
      faces.push([nmidVi, n2vi, n2vj, nmidVj])
    }
  }

  return { vertices: verts, faces }
}

function getMeshEdges(mesh: EditableMesh): Array<[number, number]> {
  const seen = new Set<string>()
  const edges: Array<[number, number]> = []
  mesh.faces.forEach(face => {
    for (let i = 0; i < face.length; i++) {
      const a = face[i], b = face[(i + 1) % face.length]
      const key = `${Math.min(a,b)},${Math.max(a,b)}`
      if (!seen.has(key)) { seen.add(key); edges.push([Math.min(a,b) as number, Math.max(a,b) as number]) }
    }
  })
  return edges
}

function exportSTL(mesh: EditableMesh) {
  const scene = new THREE.Scene()
  const geo = buildGeometry(mesh)
  geo.computeVertexNormals()
  scene.add(new THREE.Mesh(geo))
  const stl = new STLExporter().parse(scene) as string
  const url = URL.createObjectURL(new Blob([stl], { type: 'text/plain' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'model.stl' })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ExtrudeHandle({
  mesh, faceIdx, depth, groupRef, onDepthChange, onConfirm,
}: {
  mesh: EditableMesh
  faceIdx: number
  depth: number
  groupRef: React.RefObject<THREE.Group>
  onDepthChange: (d: number) => void
  onConfirm: () => void
}) {
  const { camera, gl, size } = useThree()
  const baseRef = useRef<{ x: number; y: number } | null>(null)

  const normal = useMemo(() => getFaceNormal(mesh, faceIdx), [mesh, faceIdx])
  const localCenter = useMemo(() => getFaceCenter(mesh, faceIdx), [mesh, faceIdx])

  // Keep mutable refs so event handlers always read the latest values
  // without needing to be re-registered on every render
  const cameraRef    = useRef(camera)
  const sizeRef      = useRef(size)
  const wcRef        = useRef(new THREE.Vector3())  // world-space face center
  const wnRef        = useRef(new THREE.Vector3())  // world-space face normal
  const cbDepth      = useRef(onDepthChange)
  const cbConfirm    = useRef(onConfirm)

  // Keep callback refs current
  useEffect(() => { cbDepth.current   = onDepthChange }, [onDepthChange])
  useEffect(() => { cbConfirm.current = onConfirm },     [onConfirm])

  // Keep camera / size current
  useEffect(() => { cameraRef.current = camera }, [camera])
  useEffect(() => { sizeRef.current   = size   }, [size])

  // Recompute world-space geometry when face changes
  useEffect(() => {
    const c = localCenter.clone()
    if (groupRef.current) groupRef.current.localToWorld(c)
    wcRef.current.copy(c)

    const n = normal.clone()
    if (groupRef.current) {
      const mat = new THREE.Matrix3().getNormalMatrix(groupRef.current.matrixWorld)
      n.applyMatrix3(mat).normalize()
    }
    wnRef.current.copy(n)
  }, [localCenter, normal, groupRef])

  // Register listeners ONCE — never re-registers, so baseRef is never wiped mid-drag
  useEffect(() => {
    const el = gl.domElement

    const onMove = (e: PointerEvent) => {
      const cam  = cameraRef.current
      const sz   = sizeRef.current
      const wc   = wcRef.current
      const wn   = wnRef.current

      if (!baseRef.current) {
        baseRef.current = { x: e.clientX, y: e.clientY }
        return
      }

      // Project face normal to screen space
      const p0 = wc.clone().project(cam)
      const p1 = wc.clone().add(wn).project(cam)
      const sx0 = (p0.x + 1) / 2 * sz.width,  sy0 = (-p0.y + 1) / 2 * sz.height
      const sx1 = (p1.x + 1) / 2 * sz.width,  sy1 = (-p1.y + 1) / 2 * sz.height
      const len = Math.hypot(sx1 - sx0, sy1 - sy0)
      if (len < 0.001) return

      const dot = (e.clientX - baseRef.current.x) * (sx1 - sx0) / len
                + (e.clientY - baseRef.current.y) * (sy1 - sy0) / len

      let worldPerPx = 0.005
      if (cam instanceof THREE.PerspectiveCamera) {
        const fovRad = (cam.fov * Math.PI) / 180
        worldPerPx = (2 * cam.position.distanceTo(wc) * Math.tan(fovRad / 2)) / sz.height
      }

      cbDepth.current(dot * worldPerPx)
    }

    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { e.stopPropagation(); cbConfirm.current() }
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('mousedown',   onDown)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('mousedown',   onDown)
    }
  }, [gl])  // ← gl only — listeners never re-register during drag

  // For rendering the visual handle we recompute world-space values from the memos
  // (wcRef/wnRef are for the event handlers only)
  const worldCenter = useMemo(() => {
    const c = localCenter.clone()
    if (groupRef.current) groupRef.current.localToWorld(c)
    return c
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCenter, groupRef])

  const worldNormal = useMemo(() => {
    const n = normal.clone()
    if (groupRef.current) {
      const mat = new THREE.Matrix3().getNormalMatrix(groupRef.current.matrixWorld)
      n.applyMatrix3(mat).normalize()
    }
    return n
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normal, groupRef])

  const handleWorldPos = worldCenter.clone().add(worldNormal.clone().multiplyScalar(depth + 0.18))
  const toLocal = (wp: THREE.Vector3) =>
    groupRef.current ? groupRef.current.worldToLocal(wp.clone()) : wp.clone()

  const localHandle = toLocal(handleWorldPos)
  const linePositions = new Float32Array([
    localCenter.x, localCenter.y, localCenter.z,
    localHandle.x, localHandle.y, localHandle.z,
  ])

  const sign = depth >= 0 ? '+' : ''
  const labelPos = toLocal(
    worldCenter.clone().add(worldNormal.clone().multiplyScalar(depth * 0.5 + 0.28))
  )

  return (
    <>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#d4ff00" />
      </line>
      <mesh position={localHandle.toArray() as [number,number,number]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#d4ff00" />
      </mesh>
      <mesh position={localCenter.toArray() as [number,number,number]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#d4ff00" opacity={0.6} transparent />
      </mesh>
      {/* Floating measurement label */}
      <Html position={labelPos.toArray() as [number,number,number]} center occlude={false} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.82)',
          border: '1px solid #d4ff0088',
          color: '#d4ff00',
          padding: '3px 8px',
          borderRadius: 5,
          fontSize: 12,
          fontFamily: 'monospace',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {sign}{depth.toFixed(3)} m
        </div>
      </Html>
    </>
  )
}

function InsetHandle({
  mesh, faceIdx, amount, groupRef, onAmountChange, onConfirm,
}: {
  mesh: EditableMesh
  faceIdx: number
  amount: number
  groupRef: React.RefObject<THREE.Group>
  onAmountChange: (a: number) => void
  onConfirm: () => void
}) {
  const { camera, gl, size } = useThree()
  const baseRef = useRef<{ x: number; y: number } | null>(null)
  const localCenter = useMemo(() => getFaceCenter(mesh, faceIdx), [mesh, faceIdx])
  const cameraRef = useRef(camera)
  const sizeRef   = useRef(size)
  const wcRef     = useRef(new THREE.Vector3())
  const cbAmount  = useRef(onAmountChange)
  const cbConfirm = useRef(onConfirm)
  useEffect(() => { cbAmount.current  = onAmountChange }, [onAmountChange])
  useEffect(() => { cbConfirm.current = onConfirm      }, [onConfirm])
  useEffect(() => { cameraRef.current = camera         }, [camera])
  useEffect(() => { sizeRef.current   = size           }, [size])
  useEffect(() => {
    const c = localCenter.clone()
    if (groupRef.current) groupRef.current.localToWorld(c)
    wcRef.current.copy(c)
  }, [localCenter, groupRef])
  useEffect(() => {
    const el = gl.domElement
    const onMove = (e: PointerEvent) => {
      if (!baseRef.current) { baseRef.current = { x: e.clientX, y: e.clientY }; return }
      const cam = cameraRef.current, sz = sizeRef.current, wc = wcRef.current
      const dx = e.clientX - baseRef.current.x
      let worldPerPx = 0.005
      if (cam instanceof THREE.PerspectiveCamera) {
        const fovRad = (cam.fov * Math.PI) / 180
        worldPerPx = (2 * cam.position.distanceTo(wc) * Math.tan(fovRad / 2)) / sz.height
      }
      cbAmount.current(Math.max(0, dx * worldPerPx))
    }
    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { e.stopPropagation(); cbConfirm.current() }
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('mousedown',   onDown)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('mousedown',   onDown)
    }
  }, [gl])
  const worldCenter = useMemo(() => {
    const c = localCenter.clone()
    if (groupRef.current) groupRef.current.localToWorld(c)
    return c
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCenter, groupRef])
  const localPos = groupRef.current
    ? groupRef.current.worldToLocal(worldCenter.clone())
    : localCenter.clone()
  return (
    <>
      <mesh position={localPos.toArray() as [number,number,number]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#00cfff" />
      </mesh>
      <Html position={localPos.toArray() as [number,number,number]} center occlude={false} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.82)', border: '1px solid #00cfff88', color: '#00cfff',
          padding: '3px 8px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace',
          fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em',
          transform: 'translateY(-22px)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          ↔ {amount.toFixed(3)} m
        </div>
      </Html>
    </>
  )
}

function BevelHandle({
  mesh, vertexIdx, amount, mode, groupRef, onAmountChange, onModeChange, onConfirm,
}: {
  mesh: EditableMesh
  vertexIdx: number
  amount: number
  mode: 'chamfer' | 'bevel'
  groupRef: React.RefObject<THREE.Group>
  onAmountChange: (a: number) => void
  onModeChange: (m: 'chamfer' | 'bevel') => void
  onConfirm: () => void
}) {
  const { camera, gl, size } = useThree()
  const baseRef  = useRef<{ x: number; y: number } | null>(null)
  const vPos     = useMemo(() => new THREE.Vector3(...mesh.vertices[vertexIdx]), [mesh, vertexIdx])
  const cameraRef  = useRef(camera)
  const sizeRef    = useRef(size)
  const wcRef      = useRef(new THREE.Vector3())
  const cbAmount   = useRef(onAmountChange)
  const cbMode     = useRef(onModeChange)
  const cbConfirm  = useRef(onConfirm)
  useEffect(() => { cbAmount.current  = onAmountChange  }, [onAmountChange])
  useEffect(() => { cbMode.current    = onModeChange    }, [onModeChange])
  useEffect(() => { cbConfirm.current = onConfirm       }, [onConfirm])
  useEffect(() => { cameraRef.current = camera          }, [camera])
  useEffect(() => { sizeRef.current   = size            }, [size])
  useEffect(() => {
    const wp = vPos.clone()
    if (groupRef.current) groupRef.current.localToWorld(wp)
    wcRef.current.copy(wp)
  }, [vPos, groupRef])
  useEffect(() => {
    const el = gl.domElement
    const onMove = (e: PointerEvent) => {
      if (!baseRef.current) { baseRef.current = { x: e.clientX, y: e.clientY }; return }
      const dx = e.clientX - baseRef.current.x
      const cam = cameraRef.current, sz = sizeRef.current, wc = wcRef.current
      let worldPerPx = 0.005
      if (cam instanceof THREE.PerspectiveCamera) {
        const fovRad = (cam.fov * Math.PI) / 180
        worldPerPx = (2 * cam.position.distanceTo(wc) * Math.tan(fovRad / 2)) / sz.height
      }
      cbAmount.current(Math.max(0, Math.abs(dx) * worldPerPx))
      cbMode.current(dx >= 0 ? 'chamfer' : 'bevel')
    }
    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { e.stopPropagation(); cbConfirm.current() }
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('mousedown',   onDown)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('mousedown',   onDown)
    }
  }, [gl])

  const color = mode === 'chamfer' ? '#ff9f00' : '#ff5599'
  const localPos = groupRef.current ? groupRef.current.worldToLocal(wcRef.current.clone()) : vPos.clone()

  return (
    <>
      <mesh position={localPos.toArray() as [number,number,number]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={localPos.toArray() as [number,number,number]} center occlude={false} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.85)', border: `1px solid ${color}88`, color,
          padding: '3px 8px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace',
          fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em',
          transform: 'translateY(-22px)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {mode === 'chamfer' ? '◇' : '◉'} {amount.toFixed(3)} m
        </div>
      </Html>
    </>
  )
}

function EdgeBevelHandle({
  mesh, vi, vj, amount, mode, groupRef, onAmountChange, onModeChange, onConfirm,
}: {
  mesh: EditableMesh; vi: number; vj: number; amount: number
  mode: 'chamfer' | 'bevel'; groupRef: React.RefObject<THREE.Group>
  onAmountChange: (a: number) => void
  onModeChange: (m: 'chamfer' | 'bevel') => void
  onConfirm: () => void
}) {
  const { camera, gl, size } = useThree()
  const baseRef    = useRef<{ x: number; y: number } | null>(null)
  const midpoint   = useMemo(() => {
    const a = new THREE.Vector3(...mesh.vertices[vi])
    const b = new THREE.Vector3(...mesh.vertices[vj])
    return a.clone().add(b).multiplyScalar(0.5)
  }, [mesh, vi, vj])
  const cameraRef  = useRef(camera)
  const sizeRef    = useRef(size)
  const wcRef      = useRef(new THREE.Vector3())
  const cbAmount   = useRef(onAmountChange)
  const cbMode     = useRef(onModeChange)
  const cbConfirm  = useRef(onConfirm)
  useEffect(() => { cbAmount.current  = onAmountChange  }, [onAmountChange])
  useEffect(() => { cbMode.current    = onModeChange    }, [onModeChange])
  useEffect(() => { cbConfirm.current = onConfirm       }, [onConfirm])
  useEffect(() => { cameraRef.current = camera          }, [camera])
  useEffect(() => { sizeRef.current   = size            }, [size])
  useEffect(() => {
    const wp = midpoint.clone()
    if (groupRef.current) groupRef.current.localToWorld(wp)
    wcRef.current.copy(wp)
  }, [midpoint, groupRef])
  useEffect(() => {
    const el = gl.domElement
    const onMove = (e: PointerEvent) => {
      if (!baseRef.current) { baseRef.current = { x: e.clientX, y: e.clientY }; return }
      const dx = e.clientX - baseRef.current.x
      const cam = cameraRef.current, sz = sizeRef.current, wc = wcRef.current
      let worldPerPx = 0.005
      if (cam instanceof THREE.PerspectiveCamera) {
        const fovRad = (cam.fov * Math.PI) / 180
        worldPerPx = (2 * cam.position.distanceTo(wc) * Math.tan(fovRad / 2)) / sz.height
      }
      cbAmount.current(Math.max(0, Math.abs(dx) * worldPerPx))
      cbMode.current(dx >= 0 ? 'chamfer' : 'bevel')
    }
    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { e.stopPropagation(); cbConfirm.current() }
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('mousedown',   onDown)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('mousedown',   onDown)
    }
  }, [gl])
  const color = mode === 'chamfer' ? '#ff9f00' : '#ff5599'
  const localPos = groupRef.current ? groupRef.current.worldToLocal(wcRef.current.clone()) : midpoint.clone()
  return (
    <>
      <mesh position={localPos.toArray() as [number,number,number]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={localPos.toArray() as [number,number,number]} center occlude={false} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.85)', border: `1px solid ${color}88`, color,
          padding: '3px 8px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace',
          fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em',
          transform: 'translateY(-22px)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {mode === 'chamfer' ? '◇' : '◉'} {amount.toFixed(3)} m
        </div>
      </Html>
    </>
  )
}

function Scene({
  mesh, selectedFace, onFaceClick, transformMode,
  extrudeActive, extrudeDepth, onDepthChange, onExtrudeConfirm,
  insetActive, insetAmount, onAmountChange, onInsetConfirm,
  selectedVertex, onVertexClick,
  bevelActive, bevelAmount, bevelMode, onBevelAmountChange, onBevelModeChange, onBevelConfirm,
  selectedEdge, onEdgeClick,
  edgeBevelActive, edgeBevelAmount, edgeBevelMode, onEdgeBevelAmountChange, onEdgeBevelModeChange, onEdgeBevelConfirm,
}: {
  mesh: EditableMesh
  selectedFace: number | null
  onFaceClick: (i: number) => void
  transformMode: 'translate' | 'rotate' | 'scale' | null
  extrudeActive: boolean
  extrudeDepth: number
  onDepthChange: (d: number) => void
  onExtrudeConfirm: () => void
  insetActive: boolean
  insetAmount: number
  onAmountChange: (a: number) => void
  onInsetConfirm: () => void
  selectedVertex: number | null
  onVertexClick: (vi: number) => void
  bevelActive: boolean
  bevelAmount: number
  bevelMode: 'chamfer' | 'bevel'
  onBevelAmountChange: (a: number) => void
  onBevelModeChange: (m: 'chamfer' | 'bevel') => void
  onBevelConfirm: () => void
  selectedEdge: [number,number] | null
  onEdgeClick: (vi: number, vj: number) => void
  edgeBevelActive: boolean
  edgeBevelAmount: number
  edgeBevelMode: 'chamfer' | 'bevel'
  onEdgeBevelAmountChange: (a: number) => void
  onEdgeBevelModeChange: (m: 'chamfer' | 'bevel') => void
  onEdgeBevelConfirm: () => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const orbitRef = useRef<any>(null)
  const [hoveredVertex, setHoveredVertex] = useState<number | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<[number,number] | null>(null)

  const anyToolActive = extrudeActive || insetActive || bevelActive || edgeBevelActive
  const displayMesh = extrudeActive && selectedFace !== null
    ? extrudeFace(mesh, selectedFace, extrudeDepth)
    : insetActive && selectedFace !== null
    ? insetFace(mesh, selectedFace, insetAmount)
    : bevelActive && selectedVertex !== null
    ? bevelVertex(mesh, selectedVertex, bevelAmount, bevelMode)
    : edgeBevelActive && selectedEdge !== null
    ? chamferEdge(mesh, selectedEdge[0], selectedEdge[1], edgeBevelAmount, edgeBevelMode)
    : mesh

  const edges = useMemo(() => getMeshEdges(displayMesh), [displayMesh])
  const geometry = useMemo(() => buildGeometry(displayMesh), [displayMesh])
  const highlightGeo = useMemo(() =>
    selectedFace !== null && !anyToolActive ? buildFaceHighlight(mesh, selectedFace) : null,
    [mesh, selectedFace, anyToolActive]
  )

  return (
    <>
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        enabled={!anyToolActive}
        mouseButtons={{ LEFT: undefined as any, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.DOLLY }}
      />
      <group ref={groupRef}>
        <mesh
          geometry={geometry}
          castShadow
          receiveShadow
          onClick={e => {
            e.stopPropagation()
            if (transformMode || anyToolActive) return
            onFaceClick(Math.floor((e.faceIndex ?? 0) / 2))
          }}
        >
          <meshPhysicalMaterial color="#c8cdd6" roughness={0.35} metalness={0.08} reflectivity={0.3} envMapIntensity={0.6} />
          <Edges threshold={15} color="#222428" lineWidth={1} />
        </mesh>
        {highlightGeo && (
          <mesh geometry={highlightGeo}>
            <meshBasicMaterial color="#d4ff00" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
        {extrudeActive && selectedFace !== null && (
          <ExtrudeHandle
            mesh={mesh}
            faceIdx={selectedFace}
            depth={extrudeDepth}
            groupRef={groupRef}
            onDepthChange={onDepthChange}
            onConfirm={onExtrudeConfirm}
          />
        )}
        {insetActive && selectedFace !== null && (
          <InsetHandle
            mesh={mesh}
            faceIdx={selectedFace}
            amount={insetAmount}
            groupRef={groupRef}
            onAmountChange={onAmountChange}
            onConfirm={onInsetConfirm}
          />
        )}
        {bevelActive && selectedVertex !== null && (
          <BevelHandle
            mesh={mesh}
            vertexIdx={selectedVertex}
            amount={bevelAmount}
            mode={bevelMode}
            groupRef={groupRef}
            onAmountChange={onBevelAmountChange}
            onModeChange={onBevelModeChange}
            onConfirm={onBevelConfirm}
          />
        )}
        {/* Vertex spheres: appear only on hover / when selected */}
        {!anyToolActive && mesh.vertices.map((v, vi) => {
          const hov = hoveredVertex === vi, sel = selectedVertex === vi
          return (
            <mesh key={`v${vi}`} position={v as [number,number,number]}
              onPointerOver={e => { e.stopPropagation(); setHoveredVertex(vi) }}
              onPointerOut={() => setHoveredVertex(p => p === vi ? null : p)}
              onClick={e => { e.stopPropagation(); onVertexClick(vi) }}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color={sel ? '#ff9f00' : '#88aaee'} transparent opacity={hov || sel ? 1 : 0} depthWrite={false} />
            </mesh>
          )
        })}
        {/* Edge lines: highlight on hover/selection; invisible cylinder for hit detection */}
        {!anyToolActive && edges.map(([a, b]) => {
          const nk = `${a},${b}`
          const isHov = hoveredEdge !== null && `${hoveredEdge[0]},${hoveredEdge[1]}` === nk
          const isSel = selectedEdge !== null && `${selectedEdge[0]},${selectedEdge[1]}` === nk
          const pa = displayMesh.vertices[a], pb = displayMesh.vertices[b]
          const mid: [number,number,number] = [(pa[0]+pb[0])/2,(pa[1]+pb[1])/2,(pa[2]+pb[2])/2]
          const dir = new THREE.Vector3(pb[0]-pa[0], pb[1]-pa[1], pb[2]-pa[2])
          const len = dir.length()
          dir.normalize()
          const yAxis = new THREE.Vector3(0,1,0)
          const dot = dir.dot(yAxis)
          const quat = Math.abs(dot) > 0.9999
            ? (dot > 0 ? new THREE.Quaternion() : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI))
            : new THREE.Quaternion().setFromUnitVectors(yAxis, dir)
          const linePos = new Float32Array([pa[0],pa[1],pa[2], pb[0],pb[1],pb[2]])
          return (
            <group key={`e${nk}`}>
              {(isHov || isSel) && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[linePos, 3]} count={2} />
                  </bufferGeometry>
                  <lineBasicMaterial color={isSel ? '#ff9f00' : '#88ccff'} />
                </line>
              )}
              <mesh position={mid} quaternion={[quat.x, quat.y, quat.z, quat.w]}
                onPointerOver={e => { e.stopPropagation(); setHoveredEdge([a, b]) }}
                onPointerOut={() => setHoveredEdge(p => p && `${p[0]},${p[1]}` === nk ? null : p)}
                onClick={e => { e.stopPropagation(); onEdgeClick(a, b) }}>
                <cylinderGeometry args={[0.018, 0.018, len, 4]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          )
        })}
        {edgeBevelActive && selectedEdge !== null && (
          <EdgeBevelHandle
            mesh={mesh}
            vi={selectedEdge[0]} vj={selectedEdge[1]}
            amount={edgeBevelAmount}
            mode={edgeBevelMode}
            groupRef={groupRef}
            onAmountChange={onEdgeBevelAmountChange}
            onModeChange={onEdgeBevelModeChange}
            onConfirm={onEdgeBevelConfirm}
          />
        )}
      </group>
      {transformMode && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false }}
          onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true }}
        />
      )}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewcube />
      </GizmoHelper>
    </>
  )
}

const FACE_NAMES = ['Front','Back','Right','Left','Top','Bottom']
const primary = '#d4ff00'
const panel = 'rgba(13,13,13,0.88)'
const panelBorder = '1px solid rgba(255,255,255,0.07)'

export default function CAD3D() {
  const [mesh, setMesh] = useState<EditableMesh>(createCube)
  const [selectedFace, setSelectedFace] = useState<number | null>(null)
  const [transformMode, setTransformMode] = useState<'translate'|'rotate'|'scale'|null>(null)
  const [extrudeActive, setExtrudeActive] = useState(false)
  const [extrudeDepth, setExtrudeDepth] = useState(0)
  const [insetActive, setInsetActive] = useState(false)
  const [insetAmount, setInsetAmount] = useState(0)
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null)
  const [bevelActive, setBevelActive] = useState(false)
  const [bevelAmount, setBevelAmount] = useState(0)
  const [bevelMode, setBevelMode] = useState<'chamfer'|'bevel'>('chamfer')
  const [selectedEdge, setSelectedEdge] = useState<[number,number] | null>(null)
  const [edgeBevelActive, setEdgeBevelActive] = useState(false)
  const [edgeBevelAmount, setEdgeBevelAmount] = useState(0)
  const [edgeBevelMode, setEdgeBevelMode] = useState<'chamfer'|'bevel'>('chamfer')
  const [typeBuffer, setTypeBuffer] = useState('')  // numeric input during extrude/inset
  const [history, setHistory] = useState<EditableMesh[]>([])
  const [redoStack, setRedoStack] = useState<EditableMesh[]>([])

  const pushHistory = useCallback((prev: EditableMesh) => {
    setHistory(h => [...h.slice(-49), prev])
    setRedoStack([])
  }, [])

  const undo = useCallback(() => {
    if (!history.length) return
    setRedoStack(r => [...r, mesh])
    setMesh(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }, [history, mesh])

  const redo = useCallback(() => {
    if (!redoStack.length) return
    setHistory(h => [...h, mesh])
    setMesh(redoStack[redoStack.length - 1])
    setRedoStack(r => r.slice(0, -1))
  }, [redoStack, mesh])

  const startExtrude = useCallback(() => {
    if (selectedFace === null) return
    setExtrudeDepth(0)
    setTypeBuffer('')
    setExtrudeActive(true)
  }, [selectedFace])

  const confirmExtrude = useCallback(() => {
    if (selectedFace === null) return
    pushHistory(mesh)
    setMesh(extrudeFace(mesh, selectedFace, extrudeDepth))
    setExtrudeActive(false)
    setExtrudeDepth(0)
    setTypeBuffer('')
    setSelectedFace(null)
  }, [mesh, selectedFace, extrudeDepth, pushHistory])

  const cancelExtrude = useCallback(() => {
    setExtrudeActive(false)
    setExtrudeDepth(0)
    setTypeBuffer('')
  }, [])

  const startInset = useCallback(() => {
    if (selectedFace === null) return
    setInsetAmount(0)
    setTypeBuffer('')
    setInsetActive(true)
  }, [selectedFace])

  const confirmInset = useCallback(() => {
    if (selectedFace === null) return
    pushHistory(mesh)
    setMesh(insetFace(mesh, selectedFace, insetAmount))
    setInsetActive(false)
    setInsetAmount(0)
    setTypeBuffer('')
    // keep selectedFace so inner face is ready for extrusion
  }, [mesh, selectedFace, insetAmount, pushHistory])

  const cancelInset = useCallback(() => {
    setInsetActive(false)
    setInsetAmount(0)
    setTypeBuffer('')
  }, [])

  const startBevel = useCallback(() => {
    if (selectedVertex === null) return
    setBevelAmount(0)
    setTypeBuffer('')
    setBevelActive(true)
  }, [selectedVertex])

  const confirmBevel = useCallback(() => {
    if (selectedVertex === null) return
    pushHistory(mesh)
    setMesh(bevelVertex(mesh, selectedVertex, bevelAmount, bevelMode))
    setBevelActive(false)
    setBevelAmount(0)
    setTypeBuffer('')
    setSelectedVertex(null)
  }, [mesh, selectedVertex, bevelAmount, bevelMode, pushHistory])

  const cancelBevel = useCallback(() => {
    setBevelActive(false)
    setBevelAmount(0)
    setTypeBuffer('')
  }, [])

  const startEdgeBevel = useCallback(() => {
    if (selectedEdge === null) return
    setEdgeBevelAmount(0)
    setTypeBuffer('')
    setEdgeBevelActive(true)
  }, [selectedEdge])

  const confirmEdgeBevel = useCallback(() => {
    if (selectedEdge === null) return
    pushHistory(mesh)
    setMesh(chamferEdge(mesh, selectedEdge[0], selectedEdge[1], edgeBevelAmount, edgeBevelMode))
    setEdgeBevelActive(false)
    setEdgeBevelAmount(0)
    setTypeBuffer('')
    setSelectedEdge(null)
  }, [mesh, selectedEdge, edgeBevelAmount, pushHistory])

  const cancelEdgeBevel = useCallback(() => {
    setEdgeBevelActive(false)
    setEdgeBevelAmount(0)
    setTypeBuffer('')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      // Numeric input during extrude, inset, vertex bevel or edge bevel
      if (extrudeActive || insetActive || bevelActive || edgeBevelActive) {
        if (/^[0-9]$/.test(e.key) ||
            (e.key === '.' && !typeBuffer.includes('.')) ||
            (e.key === '-' && typeBuffer === '' && extrudeActive)) {
          e.preventDefault()
          const next = typeBuffer + e.key
          setTypeBuffer(next)
          const val = parseFloat(next)
          if (!isNaN(val)) {
            if (extrudeActive) setExtrudeDepth(val)
            else setInsetAmount(Math.max(0, val))
          }
          return
        }
        if (e.key === 'Backspace') {
          e.preventDefault()
          const next = typeBuffer.slice(0, -1)
          setTypeBuffer(next)
          const val = parseFloat(next)
          if (!isNaN(val)) {
            if (extrudeActive) setExtrudeDepth(val)
            else if (insetActive) setInsetAmount(Math.max(0, val))
            else setBevelAmount(Math.max(0, val))
          } else if (next === '' || next === '-') {
            if (extrudeActive) setExtrudeDepth(0)
            else if (insetActive) setInsetAmount(0)
            else if (bevelActive) setBevelAmount(0)
            else setEdgeBevelAmount(0)
          }
          return
        }
        if (e.key === 'Escape') {
          if (extrudeActive) cancelExtrude()
          else if (insetActive) cancelInset()
          else if (bevelActive) cancelBevel()
          else cancelEdgeBevel()
          return
        }
        if (e.key === 'Enter') {
          if (extrudeActive) confirmExtrude()
          else if (insetActive) confirmInset()
          else if (bevelActive) confirmBevel()
          else confirmEdgeBevel()
          return
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case 'escape':
          setSelectedFace(null); setSelectedEdge(null); setSelectedVertex(null); setTransformMode(null)
          break
        case 'e':
          if (selectedFace !== null) startExtrude()
          break
        case 'i':
          if (selectedFace !== null) startInset()
          break
        case 'b':
          if (selectedEdge !== null && !edgeBevelActive) startEdgeBevel()
          else if (selectedVertex !== null && !bevelActive) startBevel()
          break
        case 'g': setTransformMode(m => m === 'translate' ? null : 'translate'); break
        case 'r': setTransformMode(m => m === 'rotate' ? null : 'rotate'); break
        case 's':
          if (!(e.ctrlKey || e.metaKey)) setTransformMode(m => m === 'scale' ? null : 'scale')
          break
        case 'z': if (e.ctrlKey || e.metaKey) { e.preventDefault(); undo() } break
        case 'y': if (e.ctrlKey || e.metaKey) { e.preventDefault(); redo() } break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedFace, selectedVertex, selectedEdge, extrudeActive, insetActive, bevelActive, edgeBevelActive, typeBuffer, startExtrude, startInset, startBevel, startEdgeBevel, cancelExtrude, cancelInset, cancelBevel, cancelEdgeBevel, confirmExtrude, confirmInset, confirmBevel, confirmEdgeBevel, undo, redo])

  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ background: '#0a0a0a' }}>

      <div className="absolute top-4 left-4 z-50 flex flex-col gap-3" style={{ width: 176 }}>
        <div style={{ background: panel, backdropFilter: 'blur(12px)', borderRadius: 12, padding: '12px 14px', border: panelBorder, color: 'white' }}>
          <div className="text-xs font-bold mb-3" style={{ color: primary, letterSpacing: '0.12em' }}>CAD 3D</div>

          <div className="flex gap-1.5 mb-3">
            <button onClick={undo} disabled={!history.length} title="Ctrl+Z"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs disabled:opacity-25 hover:bg-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>
              <RotateCcw size={10}/> Undo
            </button>
            <button onClick={redo} disabled={!redoStack.length} title="Ctrl+Y"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs disabled:opacity-25 hover:bg-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>
              <RotateCw size={10}/> Redo
            </button>
          </div>

          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5" style={{ fontSize: 8 }}>Transform</div>
          {(['translate','rotate','scale'] as const).map(mode => {
            const active = transformMode === mode
            return (
              <button key={mode}
                onClick={() => setTransformMode(m => m === mode ? null : mode)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium mb-1 transition-all"
                style={{
                  background: active ? primary : 'rgba(255,255,255,0.05)',
                  color: active ? '#000' : '#999',
                  boxShadow: active ? ('0 0 10px ' + primary + '44') : 'none',
                }}>
                <span className="capitalize">{mode}</span>
                <span style={{ opacity: 0.5, fontSize: 9 }}>{mode[0].toUpperCase()}</span>
              </button>
            )
          })}

          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-3 mb-1.5" style={{ fontSize: 8 }}>Modeling</div>
          <button
            onClick={startExtrude}
            disabled={selectedFace === null || extrudeActive || insetActive}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium mb-1 transition-all disabled:opacity-30"
            style={{ background: extrudeActive ? primary : 'rgba(255,255,255,0.05)', color: extrudeActive ? '#000' : '#999' }}>
            <span>Extrude</span>
            <span style={{ opacity: 0.5, fontSize: 9 }}>E</span>
          </button>
          <button
            onClick={startInset}
            disabled={selectedFace === null || extrudeActive || insetActive}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium mb-1 transition-all disabled:opacity-30"
            style={{ background: insetActive ? '#00cfff' : 'rgba(255,255,255,0.05)', color: insetActive ? '#000' : '#999' }}>
            <span>Inset</span>
            <span style={{ opacity: 0.5, fontSize: 9 }}>I</span>
          </button>
          <button
            onClick={startEdgeBevel}
            disabled={selectedEdge === null || edgeBevelActive}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium mb-1 transition-all disabled:opacity-30"
            style={{ background: edgeBevelActive ? '#ff9f00' : 'rgba(255,255,255,0.05)', color: edgeBevelActive ? '#000' : '#999' }}>
            <span>Bevel / Chamfer</span>
            <span style={{ opacity: 0.5, fontSize: 9 }}>B</span>
          </button>
          <button
            onClick={startBevel}
            disabled={selectedVertex === null || bevelActive}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium mb-1 transition-all disabled:opacity-30"
            style={{ background: bevelActive ? '#ff9f00' : 'rgba(255,255,255,0.05)', color: bevelActive ? '#000' : '#999' }}>
            <span>Vertex Bevel</span>
            <span style={{ opacity: 0.5, fontSize: 9 }}>B</span>
          </button>

          {!extrudeActive && !insetActive && !edgeBevelActive && !bevelActive && selectedFace === null && selectedEdge === null && selectedVertex === null && (
            <p className="text-xs text-gray-700 mt-1 leading-tight">Click face · edge dot · vertex dot</p>
          )}
          {selectedFace !== null && !extrudeActive && !insetActive && (
            <div className="mt-1 px-2 py-1 rounded text-xs" style={{ background: primary + '18', color: primary }}>
              {FACE_NAMES[selectedFace] ?? ('Face ' + (selectedFace + 1))} selected
            </div>
          )}
          {selectedEdge !== null && !edgeBevelActive && (
            <div className="mt-1 px-2 py-1 rounded text-xs" style={{ background: '#ff9f0018', color: '#ff9f00' }}>
              Edge {selectedEdge[0]}–{selectedEdge[1]} selected
            </div>
          )}
          {selectedVertex !== null && !bevelActive && (
            <div className="mt-1 px-2 py-1 rounded text-xs" style={{ background: '#ff990018', color: '#ff9900' }}>
              Vertex {selectedVertex} selected
            </div>
          )}
        </div>

        <div style={{ background: panel, backdropFilter: 'blur(12px)', borderRadius: 10, padding: '9px 14px', border: panelBorder, color: 'white' }}>
          <button onClick={() => exportSTL(mesh)}
            className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors py-0.5">
            <Download size={11}/> Export STL
          </button>
        </div>
      </div>

      {extrudeActive ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full flex items-center gap-3"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid ' + primary + '55', color: primary }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: primary }} />
          <span className="text-xs font-bold tracking-wide">
            {typeBuffer
              ? <>{typeBuffer}<span style={{ opacity: 0.4 }}>|</span></>
              : <>{extrudeDepth >= 0 ? '+' : ''}{extrudeDepth.toFixed(3)}</>
            }
          </span>
          <span className="text-xs text-gray-500 ml-1">
            {typeBuffer ? 'Enter confirm  Backspace  ESC cancel' : 'type value or drag · click confirm · ESC cancel'}
          </span>
        </div>
      ) : edgeBevelActive ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full flex items-center gap-3"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: `1px solid ${edgeBevelMode === 'chamfer' ? '#ff9f0055' : '#ff559955'}`, color: edgeBevelMode === 'chamfer' ? '#ff9f00' : '#ff5599' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: edgeBevelMode === 'chamfer' ? '#ff9f00' : '#ff5599' }} />
          <span className="text-xs font-bold tracking-wide">
            {edgeBevelMode === 'chamfer' ? '◇ Chamfer' : '◉ Bevel'}&nbsp;
            {typeBuffer ? <>{typeBuffer}<span style={{ opacity: 0.4 }}>|</span></> : <>{edgeBevelAmount.toFixed(3)}</>}
          </span>
          <span className="text-xs text-gray-500 ml-1">← bevel &nbsp; chamfer →&nbsp; click/Enter confirm&nbsp; ESC cancel</span>
        </div>
      ) : bevelActive ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full flex items-center gap-3"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: `1px solid ${bevelMode === 'chamfer' ? '#ff9f0055' : '#ff559955'}`, color: bevelMode === 'chamfer' ? '#ff9f00' : '#ff5599' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: bevelMode === 'chamfer' ? '#ff9f00' : '#ff5599' }} />
          <span className="text-xs font-bold tracking-wide">
            {bevelMode === 'chamfer' ? '◇ Chamfer' : '◉ Bevel'} {typeBuffer
              ? <>{typeBuffer}<span style={{ opacity: 0.4 }}>|</span></>
              : <>{bevelAmount.toFixed(3)}</>
            }
          </span>
          <span className="text-xs text-gray-500 ml-1">← bevel  chamfer →  click/Enter confirm  ESC cancel</span>
        </div>
      ) : insetActive ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full flex items-center gap-3"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid #00cfff55', color: '#00cfff' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00cfff' }} />
          <span className="text-xs font-bold tracking-wide">
            {typeBuffer
              ? <>{typeBuffer}<span style={{ opacity: 0.4 }}>|</span></>
              : <>Inset {insetAmount.toFixed(3)}</>
            }
          </span>
          <span className="text-xs text-gray-500 ml-1">
            {typeBuffer ? 'Enter confirm  Backspace  ESC cancel' : 'drag right · type value · click confirm · ESC cancel'}
          </span>
        </div>
      ) : transformMode ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full flex items-center gap-3"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', border: '1px solid ' + primary + '44', color: primary }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: primary }} />
          <span className="text-xs font-bold tracking-wide capitalize">{transformMode} mode  drag axis handles</span>
          <span className="text-xs text-gray-500">ESC to exit</span>
        </div>
      ) : (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: panelBorder, color: '#444', fontSize: 10 }}>
          Middle-drag orbit  Right-drag zoom  G/R/S transform  click face then E
        </div>
      )}

      <Canvas shadows camera={{ position: [2.5,2.5,2.5], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#0d0d0d']} />
        {/* 3-point lighting for strong face contrast */}
        <ambientLight intensity={0.08} />
        <hemisphereLight args={['#4488ff', '#ff8844', 0.25]} />
        <directionalLight position={[5, 8, 5]} intensity={2.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-near={0.1} shadow-camera-far={50} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
        <directionalLight position={[-4, 2, -4]} intensity={0.5} color="#6688cc" />
        <directionalLight position={[0, -3, 3]} intensity={0.3} color="#ffcc88" />
        <Grid args={[20,20]} cellSize={0.5} cellColor="#191919" sectionSize={2} sectionColor="#242424" fadeDistance={20} infiniteGrid />
        <Scene
          mesh={mesh}
          selectedFace={selectedFace}
          onFaceClick={i => { setSelectedFace(p => p === i ? null : i); setSelectedEdge(null); setSelectedVertex(null) }}
          transformMode={transformMode}
          extrudeActive={extrudeActive}
          extrudeDepth={extrudeDepth}
          onDepthChange={setExtrudeDepth}
          onExtrudeConfirm={confirmExtrude}
          insetActive={insetActive}
          insetAmount={insetAmount}
          onAmountChange={setInsetAmount}
          onInsetConfirm={confirmInset}
          selectedVertex={selectedVertex}
          onVertexClick={vi => { setSelectedVertex(p => p === vi ? null : vi); setSelectedFace(null); setSelectedEdge(null) }}
          bevelActive={bevelActive}
          bevelAmount={bevelAmount}
          bevelMode={bevelMode}
          onBevelAmountChange={setBevelAmount}
          onBevelModeChange={setBevelMode}
          onBevelConfirm={confirmBevel}
          selectedEdge={selectedEdge}
          onEdgeClick={(a, b) => { setSelectedEdge(p => p && p[0]===a && p[1]===b ? null : [a,b]); setSelectedFace(null); setSelectedVertex(null) }}
          edgeBevelActive={edgeBevelActive}
          edgeBevelAmount={edgeBevelAmount}
          edgeBevelMode={edgeBevelMode}
          onEdgeBevelAmountChange={setEdgeBevelAmount}
          onEdgeBevelModeChange={setEdgeBevelMode}
          onEdgeBevelConfirm={confirmEdgeBevel}
        />
      </Canvas>

      <VersionBadge projectName="cad3d" />
    </div>
  )
}
