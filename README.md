# WebGL Cube Demo

A 3D interactive cube demo built with React and WebGL. This project demonstrates basic 3D graphics concepts including:
- 3D object rendering
- Interactive camera controls
- Vertex and fragment shaders
- Buffer management
- Matrix transformations

## Features

- Interactive 3D cube with colored faces
- Mouse and touch controls for rotation
- Smooth auto-rotation animation
- WebGL-based rendering
- Responsive design

## How It Works

### Core Components

1. **WebGL Context Setup**
   - The cube is rendered using WebGL, initialized through a canvas element
   - The context is created with `canvas.getContext('webgl')`

2. **Shader Program**
   - **Vertex Shader**: Transforms 3D vertices into 2D screen space
     ```glsl
     attribute vec4 aVertexPosition;
     attribute vec4 aVertexColor;
     uniform mat4 uModelViewMatrix;
     uniform mat4 uProjectionMatrix;
     varying lowp vec4 vColor;
     
     void main() {
         gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
         vColor = aVertexColor;
     }
     ```
   - **Fragment Shader**: Colors each pixel of the rendered cube
     ```glsl
     varying lowp vec4 vColor;
     
     void main() {
         gl_FragColor = vColor;
     }
     ```

3. **Buffer Management**
   - Position buffer: Stores 3D coordinates of cube vertices
   - Color buffer: Stores RGBA colors for each face
   - Index buffer: Defines how vertices form triangles

4. **Animation and Interaction**
   - Auto-rotation: Continuous rotation around Y-axis
   - User interaction: Mouse/touch drag controls for manual rotation
   - Matrix transformations: Handles both auto-rotation and user input

### Key Functions

1. **`initBuffers(gl)`**
   - Creates and initializes buffers for vertex positions, colors, and indices
   - Defines the cube's geometry and face colors

2. **`drawScene(gl, programInfo, buffers, autoRotationAngle)`**
   - Sets up the view and projection matrices
   - Applies transformations (translation, rotation)
   - Binds buffers and draws the cube

3. **`initShaderProgram(gl, vsSource, fsSource)`**
   - Compiles and links vertex and fragment shaders
   - Creates the WebGL program used for rendering

4. **`loadShader(gl, type, source)`**
   - Compiles individual shaders
   - Handles shader compilation errors

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Controls

- **Mouse/Touch**: Click and drag to rotate the cube
- The cube also auto-rotates continuously

## Dependencies

- React
- Vite
- gl-matrix (for matrix operations)
- WebGL

## Project Structure

```
src/
  ├── WebGLCube.jsx    # Main WebGL cube component
  ├── App.jsx          # App container
  ├── main.jsx         # Entry point
  └── index.css        # Global styles
```

## Technical Details

### Matrix Transformations

The cube's position and orientation are controlled through matrix transformations:
- Model-View Matrix: Controls the cube's position and rotation
- Projection Matrix: Defines the camera's perspective

### Animation Loop

The animation uses `requestAnimationFrame` for smooth rendering:
```javascript
function render() {
    autoRotationAngle += 0.01;
    drawScene(gl, programInfo, buffers, autoRotationAngle);
    animationFrameId = requestAnimationFrame(render);
}
```

### User Interaction

Mouse and touch events update the cube's rotation:
```javascript
const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setRotation(prev => ({
        x: prev.x + deltaY * 0.01,
        y: prev.y + deltaX * 0.01
    }));
};
```
