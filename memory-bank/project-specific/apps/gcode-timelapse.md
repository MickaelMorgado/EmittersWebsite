# G-code Timelapse

Interactive 3D visualization tool for G-code paths, featuring a simulated printer nozzle and timelapse animation.

## Features

- **G-code Parsing**: Reads and interprets standard G-code files to extract toolpaths and extrusion commands.
- **3D Visualization**:
  - Real-time rendering of filament paths.
  - High-intensity red glowing nozzle simulation.
  - Low-opacity visualization of completed layers.
- **STL Model Overlay**: Upload an STL file to see the intended final model as a ghosted reference behind the toolpaths.
- **Animation Controls**:
  - Play/Pause/Reset functionality.
  - Variable speed control (0.1x to 5x).
  - Manual progress scrubbing via slider.
- **Adaptive Camera**:
  - "Nozzle Follow" mode: Camera smoothly lerps and stays centered on the active print point.
  - OrbitControls for manual inspection.

## Technical Details

- **Location**: `node-projects/my-app/src/app/gcode-timelapse/`
- **Modules**:
  - `gcodeParser.ts`: Logic for interpreting G-code commands (G0, G1, etc.) and identifying extrusions.
  - `stlLoader.ts`: Helper for loading and positioning STL models.
- **Rendering**: React Three Fiber with `@react-three/postprocessing` (Bloom effect).
- **Optimization**: Uses `Float32BufferAttribute` for efficient updates of path geometries during animation.

## Dependencies

- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing`
- `three`
