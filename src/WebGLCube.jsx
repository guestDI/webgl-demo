import React, { useEffect, useRef, useState } from 'react';
import { mat4 } from 'gl-matrix';
import { faceColors1, faceColors2 } from './colors';

const WebGLCube = () => {
    const canvasRef = useRef(null);
    const [cubeRotations, setCubeRotations] = useState([
        { x: 0, y: 0 }, // First cube
        { x: 0, y: 0 }  // Second cube
    ]);
    const [rotationSpeeds, setRotationSpeeds] = useState([
        { x: 0, y: 0 }, // First cube
        { x: 0, y: 0 }  // Second cube
    ]);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [activeCube, setActiveCube] = useState(null); // Track which cube is being interacted with
    const lastInteractionTime = useRef([Date.now(), Date.now()]);
    const [isLightOn, setIsLightOn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl');

        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        // Define vertex shader
        const vertexShaderSource = `
            precision highp float;
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform float uLightOn;
            uniform vec3 uLightPosition;
            
            varying lowp vec4 vColor;
            varying float vLightIntensity;
            
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
                
                vec3 vertexPosition = (uModelViewMatrix * aVertexPosition).xyz;
                vec3 lightDirection = normalize(uLightPosition - vertexPosition);
                vec3 normal = normalize(vertexPosition);
                
                // Enhanced directional lighting with maximum brightness
                float diffuse = max(dot(normal, lightDirection), 0.0);
                vec3 reflectDir = reflect(-lightDirection, normal);
                float specular = pow(max(dot(normalize(-vertexPosition), reflectDir), 0.0), 32.0);
                
                // Check if this is the second cube (x position > 0)
                float isSecondCube = step(0.0, vertexPosition.x);
                
                // Base lighting with maximum brightness
                float ambient = 0.2; // Increased ambient for better base visibility
                float diffuseIntensity = 1.5 * diffuse; // Maximum directional lighting
                float specularIntensity = 0.5 * specular; // Strong highlights
                
                // Calculate base lighting intensity
                float baseIntensity = ambient + (diffuseIntensity + specularIntensity) * uLightOn;
                
                // For second cube, multiply the final intensity with maximum boost
                float secondCubeBoost = 1.0 + 1.0 * isSecondCube * uLightOn;
                
                // Ensure minimum visibility while maintaining shadow definition
                vLightIntensity = max(baseIntensity * secondCubeBoost, 0.25);
            }
        `;

        // Define fragment shader
        const fragmentShaderSource = `
            precision highp float;
            varying lowp vec4 vColor;
            varying float vLightIntensity;
            
            void main() {
                gl_FragColor = vec4(vColor.rgb * vLightIntensity, vColor.a);
            }
        `;

        // Create shader program
        const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

        // Collect all the info needed to use the shader program
        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                lightOn: gl.getUniformLocation(shaderProgram, 'uLightOn'),
                lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
            },
        };

        // Initialize buffers
        const buffers = initBuffers(gl);

        // Mouse event handlers
        const handleMouseDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cubeWidth = canvas.width / 2;
            const clickedCube = x < cubeWidth ? 0 : 1;
            
            setIsDragging(true);
            setActiveCube(clickedCube);
            setLastMousePos({
                x: e.clientX,
                y: e.clientY
            });
        };

        const handleMouseMove = (e) => {
            if (!isDragging || activeCube === null) return;
            
            const deltaX = e.clientX - lastMousePos.x;
            const deltaY = e.clientY - lastMousePos.y;
            
            // Update rotation speeds based on mouse movement
            setRotationSpeeds(prev => {
                const newSpeeds = [...prev];
                newSpeeds[activeCube] = {
                    x: deltaY * 0.01,
                    y: deltaX * 0.01
                };
                return newSpeeds;
            });

            // Update last interaction time
            lastInteractionTime.current[activeCube] = Date.now();
            
            setLastMousePos({
                x: e.clientX,
                y: e.clientY
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setActiveCube(null);
        };

        // Add event listeners
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        // Touch event handlers
        const handleTouchStart = (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            
            const cubeWidth = canvas.width / 2;
            const clickedCube = x < cubeWidth ? 0 : 1;
            
            setIsDragging(true);
            setActiveCube(clickedCube);
            setLastMousePos({
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            });
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            if (!isDragging || activeCube === null) return;
            
            const deltaX = e.touches[0].clientX - lastMousePos.x;
            const deltaY = e.touches[0].clientY - lastMousePos.y;
            
            // Update rotation speeds based on touch movement
            setRotationSpeeds(prev => {
                const newSpeeds = [...prev];
                newSpeeds[activeCube] = {
                    x: deltaY * 0.01,
                    y: deltaX * 0.01
                };
                return newSpeeds;
            });

            // Update last interaction time
            lastInteractionTime.current[activeCube] = Date.now();
            
            setLastMousePos({
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            });
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            setActiveCube(null);
        };

        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);

        let autoRotationAngles = [0, 0];
        let animationFrameId;

        // Render loop
        function render() {
            const currentTime = Date.now();
            
            // Update rotation speeds and angles for both cubes
            setCubeRotations(prev => {
                const newRotations = [...prev];
                
                for (let i = 0; i < 2; i++) {
                    const timeSinceLastInteraction = currentTime - lastInteractionTime.current[i];
                    
                    // Gradually decrease speed if no recent interaction
                    if (timeSinceLastInteraction > 100) { // Start slowing down after 100ms
                        const decayFactor = Math.exp(-timeSinceLastInteraction / 1000); // Decay over 1 second
                        setRotationSpeeds(prevSpeeds => {
                            const newSpeeds = [...prevSpeeds];
                            newSpeeds[i] = {
                                x: prevSpeeds[i].x * decayFactor,
                                y: prevSpeeds[i].y * decayFactor
                            };
                            return newSpeeds;
                        });
                    }
                    
                    // Update rotation based on current speed
                    newRotations[i] = {
                        x: prev[i].x + rotationSpeeds[i].x,
                        y: prev[i].y + rotationSpeeds[i].y
                    };
                }
                
                return newRotations;
            });

            autoRotationAngles = autoRotationAngles.map(angle => angle + 0.01);
            drawScene(gl, programInfo, buffers, autoRotationAngles);
            animationFrameId = requestAnimationFrame(render);
        }

        animationFrameId = requestAnimationFrame(render);

        // Cleanup function
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, [rotationSpeeds, isDragging, lastMousePos, activeCube, isLightOn]);

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
            return null;
        }

        return shaderProgram;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        const positions = [
            // Front face
            -0.5, -0.5,  0.5,
            0.5, -0.5,  0.5,
            0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,

            // Back face
            -0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
            0.5,  0.5, -0.5,
            0.5, -0.5, -0.5,

            // Top face
            -0.5,  0.5, -0.5,
            -0.5,  0.5,  0.5,
            0.5,  0.5,  0.5,
            0.5,  0.5, -0.5,

            // Bottom face
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5,  0.5,
            -0.5, -0.5,  0.5,

            // Right face
            0.5, -0.5, -0.5,
            0.5,  0.5, -0.5,
            0.5,  0.5,  0.5,
            0.5, -0.5,  0.5,

            // Left face
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        let colors1 = [];
        let colors2 = [];

        for (let j = 0; j < faceColors1.length; ++j) {
            const c1 = faceColors1[j];
            const c2 = faceColors2[j];
            colors1 = colors1.concat(c1, c1, c1, c1);
            colors2 = colors2.concat(c2, c2, c2, c2);
        }

        const colorBuffer1 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer1);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors1), gl.STATIC_DRAW);

        const colorBuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer2);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color1: colorBuffer1,
            color2: colorBuffer2,
            indices: indexBuffer,
        };
    }

    function drawScene(gl, programInfo, buffers, autoRotationAngles) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();

        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        // Use the shader program before setting uniforms
        gl.useProgram(programInfo.program);

        // Set light position and state - adjusted for maximum brightness
        const lightPosition = [1.5, 1.5, -3.0];
        gl.uniform3fv(programInfo.uniformLocations.lightPosition, lightPosition);
        gl.uniform1f(programInfo.uniformLocations.lightOn, isLightOn ? 1.0 : 0.0);

        // Set projection matrix
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );

        // Draw first cube
        const modelViewMatrix1 = mat4.create();
        mat4.translate(modelViewMatrix1, modelViewMatrix1, [-1.5, 0.0, -6.0]);
        mat4.rotate(modelViewMatrix1, modelViewMatrix1, cubeRotations[0].x, [1, 0, 0]);
        mat4.rotate(modelViewMatrix1, modelViewMatrix1, cubeRotations[0].y, [0, 1, 0]);
        mat4.rotate(modelViewMatrix1, modelViewMatrix1, autoRotationAngles[0], [0, 1, 0]);

        // Set model view matrix for first cube
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix1
        );

        // Draw second cube
        const modelViewMatrix2 = mat4.create();
        mat4.translate(modelViewMatrix2, modelViewMatrix2, [1.5, 0.0, -6.0]);
        mat4.rotate(modelViewMatrix2, modelViewMatrix2, cubeRotations[1].x, [1, 0, 0]);
        mat4.rotate(modelViewMatrix2, modelViewMatrix2, cubeRotations[1].y, [0, 1, 0]);
        mat4.rotate(modelViewMatrix2, modelViewMatrix2, autoRotationAngles[1], [0, 1, 0]);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Draw first cube
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color1);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        }
        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

        // Draw second cube
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color2);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        }

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix2
        );
        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ width: '100%', height: '100%' }}
            />
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isLightOn ? '#ffff00' : '#666666',
                    boxShadow: isLightOn ? '0 0 30px #ffff00, 0 0 50px rgba(255, 255, 0, 0.5)' : 'none',
                    transition: 'all 0.3s ease'
                }} />
                <button
                    onClick={() => setIsLightOn(!isLightOn)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isLightOn ? 'Turn Off' : 'Turn On'}
                </button>
            </div>
        </div>
    );
};

export default WebGLCube;