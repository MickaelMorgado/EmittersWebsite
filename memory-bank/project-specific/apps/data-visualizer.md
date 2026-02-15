# Data Visualizer

Interactive 3D galaxy visualization tool for comparing numeric data sets.

## Features

- **Galaxy Visualization**: Represents numeric values as particles in a 3D galaxy/nebula structure.
- **Data Comparison**:
  - Add multiple numbers for simultaneous comparison.
  - Assign different colors to each data set.
  - Toggle visibility of individual data sets.
- **Interactive Controls**:
  - Adjust spatial spacing between data points.
  - OrbitControls for free rotation and zoom (Orbit, Pan, Zoom).
- **Post-Processing**: High-fidelity visual effects including Bloom, Noise, and Vignette.

## Technical Details

- **Location**: `node-projects/my-app/src/app/dataVisualizer/`
- **Rendering Engine**: React Three Fiber (Three.js).
- **Instance Rendering**: Uses `instancedMesh` for high performance when rendering millions of points.
- **Components**:
  - `Galaxy`: Handles the creation and animation of the point cloud.
  - `EffectComposer`: Manages post-processing shaders.
  - `Sidebar`: Provides UI for data entry and configuration.

## Dependencies

- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing`
- `three`
- `@/components/ui/button`, `@/components/ui/input`, etc.
