# Sounder

Audio-reactive 3D visualizer that creates a chaotic, immersive environment responding to microphone input.

## Features

- **Microphone Integration**: Real-time audio analysis using the Web Audio API.
- **Spectrum Analysis**: Divided into Low, Mid, and High frequency bands to drive different visual effects.
- **Dynamic 3D Visualization**:
  - 20 animated "bars" (experimental geometries) that scale and rotate based on audio intensity.
  - HSL color shifting synchronized with audio.
- **Disorienting Camera**: Automated camera movement that orbits and shifts based on audio peaks.
- **Post-Processing Chaos**:
  - Intensity-based Bloom.
  - Audio-reactive Glitch and Vignette effects.
  - Constant Noise overlay.

## Technical Details

- **Location**: `node-projects/my-app/src/app/sounder/`
- **Component Structure**:
  - `page.tsx`: Page wrapper.
  - `ThreeAudioVisualizer.tsx`: Main logic including AudioContext, AnalyserNode, and Three.js rendering.
- **Audio Logic**:
  - `fftSize`: 4096.
  - Normalizes frequency data to trigger visual thresholds.
- **Rendering**: React Three Fiber with `@react-three/postprocessing`.

## Dependencies

- `@react-three/fiber`
- `@react-three/postprocessing`
- `three`
