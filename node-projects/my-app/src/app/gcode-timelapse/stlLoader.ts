// STL model loader for G-code timelapse visualization
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

export interface STLModel {
  mesh: THREE.Mesh;
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
  dimensions: THREE.Vector3;
}

export async function loadSTLModel(file: File): Promise<STLModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const loader = new STLLoader();
        
        // Load the STL data
        const geometry = loader.parse(arrayBuffer);
        
        // Create material for the STL model
        const material = new THREE.MeshStandardMaterial({
          color: 0x444444, // Dark gray for the final model
          metalness: 0.1,
          roughness: 0.8,
          transparent: true,
          opacity: 0.3, // Semi-transparent to see through
          depthWrite: false,
          side: THREE.DoubleSide
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Calculate bounding box and center
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const dimensions = boundingBox.getSize(new THREE.Vector3());
        
        // Store original position for reset
        mesh.userData.originalPosition = center.clone();
        
        resolve({
          mesh,
          boundingBox,
          center,
          dimensions
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read STL file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export interface Offsets {
  x: number;
  y: number;
  z: number;
}

export function setupSTLModelForVisualization(stlModel: STLModel, gcodePoints: any[], offsets: Offsets = { x: 0, y: 0, z: 0 }): THREE.Mesh {
  const { mesh, center, dimensions } = stlModel;
  
  // Store base position before offsets
  mesh.userData.basePosition = new THREE.Vector3();
  
  // Calculate transformation based on G-code bounds
  if (gcodePoints.length > 0) {
    // Calculate G-code bounds (same as in GCodeVisualizer)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    gcodePoints.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });

    // Calculate scale (same as in GCodeVisualizer)
    const maxDimension = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const scale = maxDimension > 0 ? 300 / maxDimension : 1;

    // Apply transformations
    mesh.scale.set(scale, scale, scale);
    
    // Apply the same rotation as G-code points (-90° around X axis)
    mesh.rotation.x = -Math.PI / 2;
    
    // Calculate the center of the G-code bounds (before rotation)
    const gcodeCenterX = (minX + maxX) / 2;
    const gcodeCenterY = (minY + maxY) / 2;
    const gcodeCenterZ = (minZ + maxZ) / 2;
    
    // Apply the same rotation transformation to the G-code center
    // This matches exactly what the GCodeVisualizer does to the points
    const rotatedGcodeCenterY = gcodeCenterY * Math.cos(-Math.PI/2) - gcodeCenterZ * Math.sin(-Math.PI/2);
    const rotatedGcodeCenterZ = gcodeCenterY * Math.sin(-Math.PI/2) + gcodeCenterZ * Math.cos(-Math.PI/2);
    
    // Position the STL model at the rotated G-code center
    mesh.position.set(gcodeCenterX, rotatedGcodeCenterY, rotatedGcodeCenterZ);
    
    // Adjust for the STL model's center offset
    // Move the STL model by its own center offset
    mesh.position.x -= center.x * scale;
    mesh.position.y -= center.y * scale;
    mesh.position.z -= center.z * scale;
    
    // Store base position (before offsets)
    mesh.userData.basePosition.copy(mesh.position);
  }
  
  // Apply offsets
  mesh.position.add(new THREE.Vector3(offsets.x, offsets.y, offsets.z));
  mesh.userData.currentOffsets = offsets;
  
  return mesh;
}

export function updateSTLModelOffsets(mesh: THREE.Mesh, offsets: Offsets) {
  if (mesh.userData.basePosition) {
    // Reset to base
    mesh.position.copy(mesh.userData.basePosition);
    // Apply new offsets
    mesh.position.add(new THREE.Vector3(offsets.x, offsets.y, offsets.z));
    mesh.userData.currentOffsets = offsets;
  }
}


export function updateSTLModelVisibility(mesh: THREE.Mesh, isVisible: boolean, isPlaying: boolean) {
  if (isVisible && isPlaying) {
    // During animation: semi-transparent
    (mesh.material as THREE.MeshStandardMaterial).opacity = 0.2;
    mesh.visible = true;
  } else if (isVisible && !isPlaying) {
    // After animation: more opaque
    (mesh.material as THREE.MeshStandardMaterial).opacity = 0.6;
    mesh.visible = true;
  } else {
    // Hidden
    mesh.visible = false;
  }
}