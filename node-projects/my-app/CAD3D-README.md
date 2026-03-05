# 3D CAD Application

A modern, interactive 3D CAD application built with React, Three.js, and React Three Fiber. This application provides a professional-grade interface for creating, manipulating, and exporting 3D models.

## Features

### 🎯 Core Functionality
- **3D Object Creation**: Add primitive shapes (boxes, spheres, cylinders)
- **Real-time 3D Rendering**: High-quality WebGL-based 3D viewport
- **Object Manipulation**: Move, rotate, and scale objects in 3D space
- **STL Export**: Export models as STL files for 3D printing
- **Interactive Selection**: Click-to-select objects with visual feedback

### 🎨 User Interface
- **Professional Toolbar**: Clean, modern interface with iconography
- **3D Outline Panel**: Side panel showing all objects with properties
- **Center Bottom Controls**: Transformation tools positioned for easy access
- **Toggleable Selection Mode**: Smart mode switching to prevent export conflicts
- **Visual Feedback**: Object highlighting and selection states

### 🛠️ Technical Features
- **React Three Fiber**: Modern React integration with Three.js
- **TypeScript**: Full type safety and development experience
- **Responsive Design**: Works on various screen sizes
- **Performance Optimized**: Efficient rendering and state management
- **Accessibility**: Keyboard-friendly controls and clear visual indicators

## Installation

```bash
cd node-projects/my-app
npm install
npm run dev
```

## Usage

### Creating Objects
1. Click the toolbar buttons to add primitive shapes
2. Objects appear in the 3D viewport and 3D Outline panel
3. Each object is automatically selected for immediate manipulation

### Object Selection and Manipulation
1. **Toggle Selection Mode**: Click the Select button (MousePointer icon)
2. **Select Objects**: Click any object in the 3D viewport
3. **Transformation Tools**: Available when an object is selected AND in selection mode
   - **Move**: Translate objects in 3D space
   - **Rotate**: Rotate objects around their axes
   - **Scale**: Resize objects uniformly
   - **Edit**: (Placeholder for future vertex editing)

### 3D Outline Panel
- **Object List**: Shows all created objects with their properties
- **Selection Highlighting**: Blue background indicates selected object
- **Property Editing**: Direct input fields for position and scale
- **Color Picker**: Change object colors instantly

### Exporting Models
1. **Exit Selection Mode**: Click Select button to turn it off (gray state)
2. **Export Button**: Only appears when not in selection mode
3. **STL Generation**: Creates properly formatted STL files
4. **Download**: Automatic file download as `cad_model.stl`

## Design Decisions

### Two-State Control System
The application implements a two-state system to prevent user confusion:

1. **Selection Mode (Blue Select Button)**:
   - Object selection enabled
   - Transformation tools visible when object selected
   - Export button hidden to prevent outline export

2. **Non-Selection Mode (Gray Select Button)**:
   - Object selection disabled
   - Transformation tools hidden
   - Export button visible for clean model export

### Why Hide Export in Selection Mode?
- **Prevents Outline Export**: Selection outlines would interfere with clean STL export
- **User Experience**: Clear separation between editing and exporting workflows
- **Professional Workflow**: Matches industry-standard CAD software patterns

### Object Selection Logic
- **Selection Mode Required**: Objects can only be selected when selection mode is active
- **Visual Consistency**: Both 3D viewport and 3D Outline panel update simultaneously
- **Deselection on Mode Change**: Exiting selection mode clears all selections

## Technical Architecture

### State Management
```typescript
// Core state variables
const [objects, setObjects] = useState<ObjectData[]>([])
const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null)
const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false)
const [controlMode, setControlMode] = useState<'move' | 'rotate' | 'scale' | 'edit'>('move')
```

### Component Structure
- **Main Component**: `CAD3D` - Orchestrates the entire application
- **Object Component**: `Object3D` - Renders individual 3D objects with selection logic
- **Toolbar**: Left-side primitive creation tools
- **3D Outline Panel**: Right-side object management panel
- **Control Tools**: Center-bottom transformation controls

### STL Export Process
1. **Scene Creation**: Temporary Three.js scene with all objects
2. **Transformation Application**: Apply position, rotation, and scale to geometry
3. **Geometry Traversal**: Extract triangle face data from all meshes
4. **Normal Calculation**: Compute accurate face normals for each triangle
5. **STL Generation**: Format data into proper STL file structure
6. **File Download**: Create downloadable STL file with 6-decimal precision

## File Structure

```
node-projects/my-app/
├── src/
│   └── app/
│       └── cad3d/
│           └── page.tsx          # Main 3D CAD application
├── package.json                  # Dependencies and scripts
└── CAD3D-README.md              # This documentation file
```

## Dependencies

### Core Libraries
- **React**: UI framework
- **TypeScript**: Type safety
- **Three.js**: 3D graphics engine
- **@react-three/fiber**: React integration for Three.js
- **@react-three/drei**: Additional Three.js helpers

### UI Components
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling framework

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **WebGL Support**: Required for 3D rendering
- **Touch Support**: Mobile and tablet friendly
- **Performance**: Optimized for smooth 60fps rendering

## Future Enhancements

### Planned Features
- **Vertex Editing**: Direct manipulation of object vertices
- **Advanced Primitives**: Torus, cone, custom meshes
- **Material System**: Textures, shaders, and advanced materials
- **Import Functionality**: Load existing 3D models
- **Undo/Redo**: History management for user actions
- **Snap Tools**: Precision alignment and measurement tools

### Technical Improvements
- **Performance Optimization**: Level-of-detail and culling
- **Collaboration**: Real-time multi-user editing
- **Cloud Integration**: Save/load models to cloud storage
- **Plugin System**: Extensible tool architecture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests:
- Create a GitHub issue
- Check the project documentation
- Review the code comments for implementation details

---

**Note**: This application is designed as a demonstration of modern 3D CAD interface patterns and may not include all features of professional CAD software.