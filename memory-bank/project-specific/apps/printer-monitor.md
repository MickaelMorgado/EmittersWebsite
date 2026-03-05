# 3D Printer Monitor

Multi-camera monitoring system designed for tracking 3D print progress across multiple devices.

## Features

- **Static 2x2 Grid**: Fixed display layout for up to 4 concurrent camera feeds.
- **Device Management**:
  - Enumeration of available video input devices.
  - Ability to select and toggle specific cameras.
  - Optimized for use with virtual webcams (e.g., Iriun) to use mobile phones as printer cameras.
- **UI/UX**:
  - Sidebar for camera selection and management.
  - Labeling of camera feeds for easy identification.
- **System Diagnostics**: Error messaging for permission or hardware issues.

## Technical Details

- **Location**: `node-projects/my-app/src/app/printer-monitor/`
- **APIs**: WebRTC / `navigator.mediaDevices`.
- **Logic**:
  - Manages `MediaStream` objects for each active camera.
  - Uses `video` elements for low-latency preview.
  - Cleans up tracks on component unmount or camera de-selection.

## Dependencies

- `lucide-react`
- `Sidebar` component (`@/components/sidebar`)
