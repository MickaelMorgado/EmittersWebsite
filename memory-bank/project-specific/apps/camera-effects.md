# Camera Effects

Real-time 3D avatar visualizer powered by MediaPipe pose detection, featuring a cyberpunk obsidian/chrome aesthetic.

## Features

- **Motion Capture Avatar**:
  - Low-poly 3D robot head and bust that mimics the user's movements.
  - MediaPipe Pose detection for high-accuracy tracking of head, shoulders, and limb orientation.
  - "Liquid-smooth" animation using high-factor lerping (0.96) for professional movement quality.
- **Cyberpunk Aesthetic**:
  - "Obsidian/Chrome" materials with high clearcoat and metallic properties.
  - Pulsing neon eyes and rim lighting.
  - Post-processing Bloom for a futuristic glow.
- **Diagnostic Tools**:
  - Optional debug overlay showing the MediaPipe skeleton and tracking landmarks.
  - In-scene GUI for manual camera positioning.
- **Hardware Integration**: Optimized for high-performance webcam usage.

## Technical Details

- **Location**: `node-projects/my-app/src/app/camera-effects/`
- **Detection Engine**: MediaPipe Pose (`@mediapipe/pose`).
- **Rendering Engine**: React Three Fiber (Three.js).
- **Core Components**:
  - `OrigamiCharacter`: Handles the mapping of landmarks to 3D object transformations (Yaw, Pitch, Roll).
  - `RobotHead`: GLTF model with procedural obsidian materials.
  - `Scene`: Manages environment lighting, fog, and post-processing effects.
- **Physics/Math**: Uses custom interpolation and rotation logic to ensure stable head tracking.

## Dependencies

- `@react-three/fiber`
- `@react-three/postprocessing`
- `lil-gui`
- `three`
- MediaPipe Pose (loaded via CDN)
