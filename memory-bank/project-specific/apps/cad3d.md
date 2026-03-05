# 3D CAD App

Simple yet powerful 3D CAD software for creating, sketching, and manipulating 3D objects in the browser.

## Overview

The 3D CAD App is a web-based modeling tool that supports both direct 3D object manipulation and 2D sketching with extrusion. It's designed for quick prototyping and exporting models to standard formats.

## Key Features

- **3D & Sketch Modes**: Toggle between direct 3D placement and 2D sketching on specific planes (Top, Front, Right, etc.).
- **Sketch Tools**: Draw freehand polylines, rectangles, and circles.
- **Auto-Extrusion**: Sketches are automatically converted into 3D extrusions when switching back to 3D mode.
- **Object Manipulation**: Move, rotate, and scale 3D objects with a dedicated UI.
- **Collision Detection**: Detects and warns about overlapping shapes in sketch mode.
- **Export Support**: Export models to STL and OBJ formats for use in other 3D software or 3D printing.
- **Undo/Redo & Persistence**: Full history support for edits and automatic saving to local storage.

## Technical Details

- **Frontend**: Next.js, React Three Fiber, Three.js.
- **Exporters**: Uses Three.js `OBJExporter` and `STLExporter`.
- **Components**: Includes custom components like `DraggableNumberInput`, `EdgedMesh`, and `Galaxy`.
- **Location**: `node-projects/my-app/src/app/cad3d/`

## Usage

1. Open the 3D CAD App.
2. Use the "3D" panel to add primitive shapes (box, sphere, cylinder).
3. Toggle to "Sketch" mode (Tab key) to draw on a specific plane.
4. Align the camera to a standard view (1, 3, 7 keys) to enable sketching.
5. Finish sketching to see your shapes extruded into the 3D scene.
6. Export your design using the STL or OBJ buttons.
