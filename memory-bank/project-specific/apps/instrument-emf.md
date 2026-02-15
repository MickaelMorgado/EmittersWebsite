# EMF Detector

Simulator that detects "radiation" intensity based on real-time network latency, styled as a retro-industrial handheld detector.

## Features

- **Network-Based Intensity**: Maps real-time round-trip time (RTT/Ping) to audio-visual "radiation" levels.
- **Audio Feedback**: Chaotic, electrical "clicking" sounds that increase in frequency and volume with higher network latency.
- **Retro UI Display**:
  - Seven-segment digital font for numeric values.
  - Industrial yellow-and-black aesthetic ("LINKA·01").
  - Simulated ghost "8888" background effect.
- **Debug Mode**: Allows users to override network data with a manual slider for testing intensity levels.
- **Configurable Thresholds**:
  - Dual-handle range slider for mapping specific ping ranges (e.g., 40ms to 80ms) to full audio intensity.
  - Adjustable max display range.

## Technical Details

- **Location**: `node-projects/my-app/src/app/emf-detector/`
- **Network Logic**: Uses the `navigator.connection` API and real `fetch` requests to Cloudflare's speed test endpoint for accurate latency measurement.
- **Audio Synthesis**: Uses `AudioContext` with `sawtooth` oscillators for the signature industrial sound.
- **Components**:
  - `SevenSegmentDisplay`: Renders text in a digital clock style.
  - `DualRangeSlider`: Custom touch-supported range selection.
- **UI Styling**: `sevenSegmentFont.css` for the custom digital look.

## Dependencies

- `lucide-react`: For the Wifi icon.
- `AudioContext` API.
