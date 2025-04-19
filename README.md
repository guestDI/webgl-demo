# WebGL Interactive Cube Demo

An interactive WebGL demo featuring two independently rotating cubes with dynamic lighting and a starfield background effect.

## Features

- **Interactive 3D Cubes**
  - Two independently rotating cubes with different color schemes
  - Mouse/touch interaction for manual rotation
  - Smooth auto-rotation when not interacting
  - Dynamic rotation speeds based on user interaction

- **Advanced Lighting System**
  - Interactive light switch to toggle lighting
  - Real-time directional lighting with proper shadows
  - Enhanced brightness for the second cube
  - Dynamic specular highlights
  - Ambient, diffuse, and specular lighting components
  - Minimum visibility threshold to ensure good visibility

- **Starfield Background**
  - Dynamic star movement towards the viewer
  - Smooth animation and depth effect
  - Optimized rendering for performance

## Technical Details

- Built with WebGL and React
- Uses gl-matrix for matrix operations
- Implements custom shaders for lighting and effects
- Responsive design that adapts to screen size
- Touch and mouse interaction support

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:3000`

## Controls

- **Mouse/Touch**: Click and drag to rotate the cubes
- **Light Switch**: Toggle the light switch in the top-right corner to control lighting
- The left cube responds to interaction on the left half of the screen
- The right cube responds to interaction on the right half of the screen

## Project Structure

- `src/WebGLCube.jsx`: Main component containing WebGL setup and rendering logic
- `src/colors.js`: Color definitions for the cube faces
- `public/`: Static assets and HTML template

## Dependencies

- React
- gl-matrix
- WebGL

## License

MIT License
