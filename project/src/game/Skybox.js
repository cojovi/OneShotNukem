/**
 * OneShot Predator Nukem - Skybox System
 * Creates parallax skybox for ranch environment atmosphere
 */

import { GameObject } from '../engine/core/GameObject.js';

export class Skybox extends GameObject {
    constructor(engine, skyboxConfig) {
        super('skybox');
        
        this.engine = engine;
        this.config = skyboxConfig;
        
        // Skybox properties
        this.size = skyboxConfig.size || 100.0;
        this.layers = skyboxConfig.layers || [];
        this.meshes = [];
        this.textures = new Map();
        
        // Parallax properties
        this.parallaxLayers = [];
        this.windSpeed = skyboxConfig.windSpeed || 0.1;
        this.cloudOffset = 0;
        
        // Sky gradient colors (retro 256-color palette)
        this.skyColors = skyboxConfig.colors || {
            horizon: [0.8, 0.7, 0.6, 1.0],  // Warm horizon
            zenith: [0.4, 0.6, 0.9, 1.0],   // Blue sky
            ground: [0.3, 0.5, 0.2, 1.0]    // Green ground
        };
        
        console.log('Skybox created');
    }
    
    async initialize() {
        try {
            // Create sky dome geometry
            this.createSkyDome();
            
            // Create distant terrain
            this.createDistantTerrain();
            
            // Create cloud layers
            await this.createCloudLayers();
            
            // Create sun/moon
            this.createCelestialBodies();
            
            console.log('Skybox initialized');
            
        } catch (error) {
            console.error('Failed to initialize skybox:', error);
        }
    }
    
    /**
     * Create sky dome with gradient
     */
    createSkyDome() {
        const segments = 32;
        const rings = 16;
        const radius = this.size;
        
        const vertices = [];
        const uvs = [];
        const colors = [];
        const indices = [];
        
        // Generate dome vertices
        for (let ring = 0; ring <= rings; ring++) {
            const phi = (ring / rings) * Math.PI * 0.5; // 0 to PI/2 (hemisphere)
            const y = Math.cos(phi) * radius;
            const ringRadius = Math.sin(phi) * radius;
            
            for (let segment = 0; segment <= segments; segment++) {
                const theta = (segment / segments) * Math.PI * 2;
                const x = Math.cos(theta) * ringRadius;
                const z = Math.sin(theta) * ringRadius;
                
                vertices.push(x, y, z);
                uvs.push(segment / segments, ring / rings);
                
                // Interpolate sky color based on height
                const heightFactor = ring / rings;
                const color = this.interpolateColor(
                    this.skyColors.horizon,
                    this.skyColors.zenith,
                    heightFactor
                );
                colors.push(...color);
            }
        }
        
        // Generate indices
        for (let ring = 0; ring < rings; ring++) {
            for (let segment = 0; segment < segments; segment++) {
                const current = ring * (segments + 1) + segment;
                const next = current + segments + 1;
                
                // Two triangles per quad
                indices.push(current, next, current + 1);
                indices.push(next, next + 1, current + 1);
            }
        }
        
        this.createSkyMesh(
            new Float32Array(vertices),
            new Float32Array(uvs),
            new Float32Array(colors),
            new Uint16Array(indices),
            'sky_dome'
        );
    }
    
    /**
     * Create distant terrain silhouette
     */
    createDistantTerrain() {
        const segments = 64;
        const radius = this.size * 0.9;
        const baseHeight = -5;
        const maxHeight = 15;
        
        const vertices = [];
        const uvs = [];
        const colors = [];
        const indices = [];
        
        // Generate terrain ring
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create height variation for hills
            const noise1 = Math.sin(angle * 3) * 0.5;
            const noise2 = Math.sin(angle * 7) * 0.3;
            const noise3 = Math.sin(angle * 13) * 0.2;
            const heightVariation = (noise1 + noise2 + noise3) * maxHeight;
            
            const groundHeight = baseHeight + Math.max(0, heightVariation);
            
            // Ground vertex
            vertices.push(x, groundHeight, z);
            uvs.push(i / segments, 0);
            colors.push(...this.skyColors.ground);
            
            // Sky connection vertex
            vertices.push(x, baseHeight, z);
            uvs.push(i / segments, 1);
            colors.push(...this.skyColors.horizon);
        }
        
        // Generate indices for terrain strip
        for (let i = 0; i < segments; i++) {
            const current = i * 2;
            const next = (i + 1) * 2;
            
            // Two triangles connecting ground to sky
            indices.push(current, next, current + 1);
            indices.push(next, next + 1, current + 1);
        }
        
        this.createSkyMesh(
            new Float32Array(vertices),
            new Float32Array(uvs),
            new Float32Array(colors),
            new Uint16Array(indices),
            'distant_terrain'
        );
    }
    
    /**
     * Create cloud layers for parallax effect
     */
    async createCloudLayers() {
        const cloudLayers = this.config.cloudLayers || [
            { height: 30, speed: 0.5, density: 0.3, size: 20 },
            { height: 45, speed: 0.3, density: 0.2, size: 35 },
            { height: 60, speed: 0.1, density: 0.1, size: 50 }
        ];
        
        for (let i = 0; i < cloudLayers.length; i++) {
            const layer = cloudLayers[i];
            await this.createCloudLayer(layer, i);
        }
    }
    
    /**
     * Create individual cloud layer
     */
    async createCloudLayer(layerConfig, layerIndex) {
        const cloudCount = 20;
        const radius = this.size * 0.8;
        
        const vertices = [];
        const uvs = [];
        const colors = [];
        const indices = [];
        let vertexIndex = 0;
        
        // Generate cloud quads
        for (let i = 0; i < cloudCount; i++) {
            const angle = (i / cloudCount) * Math.PI * 2 + (Math.random() - 0.5);
            const distance = radius + (Math.random() - 0.5) * 20;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const y = layerConfig.height + (Math.random() - 0.5) * 5;
            
            const size = layerConfig.size + (Math.random() - 0.5) * 10;
            const alpha = layerConfig.density + (Math.random() - 0.5) * 0.1;
            
            // Cloud quad vertices
            const cloudVerts = [
                x - size, y, z - size,
                x + size, y, z - size,
                x + size, y, z + size,
                x - size, y, z + size
            ];
            
            vertices.push(...cloudVerts);
            
            // UVs for cloud texture
            uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
            
            // Cloud color with transparency
            const cloudColor = [1, 1, 1, alpha];
            for (let j = 0; j < 4; j++) {
                colors.push(...cloudColor);
            }
            
            // Indices for cloud quad
            indices.push(
                vertexIndex, vertexIndex + 1, vertexIndex + 2,
                vertexIndex, vertexIndex + 2, vertexIndex + 3
            );
            vertexIndex += 4;
        }
        
        const layerMesh = this.createSkyMesh(
            new Float32Array(vertices),
            new Float32Array(uvs),
            new Float32Array(colors),
            new Uint16Array(indices),
            `cloud_layer_${layerIndex}`
        );
        
        // Store parallax info
        this.parallaxLayers.push({
            mesh: layerMesh,
            speed: layerConfig.speed,
            originalVertices: vertices,
            height: layerConfig.height
        });
    }
    
    /**
     * Create sun and moon
     */
    createCelestialBodies() {
        // Sun
        this.createCelestialBody('sun', {
            position: [this.size * 0.7, this.size * 0.5, this.size * 0.3],
            size: 8,
            color: [1.0, 0.9, 0.7, 1.0]
        });
        
        // Moon (if night time)
        if (this.config.timeOfDay === 'night') {
            this.createCelestialBody('moon', {
                position: [-this.size * 0.6, this.size * 0.4, -this.size * 0.4],
                size: 6,
                color: [0.9, 0.9, 1.0, 0.8]
            });
        }
    }
    
    /**
     * Create sun or moon
     */
    createCelestialBody(name, config) {
        const size = config.size;
        const [x, y, z] = config.position;
        
        const vertices = new Float32Array([
            x - size, y - size, z,
            x + size, y - size, z,
            x + size, y + size, z,
            x - size, y + size, z
        ]);
        
        const uvs = new Float32Array([
            0, 0,  1, 0,  1, 1,  0, 1
        ]);
        
        const colors = new Float32Array([
            ...config.color, ...config.color, ...config.color, ...config.color
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3
        ]);
        
        this.createSkyMesh(vertices, uvs, colors, indices, name);
    }
    
    /**
     * Create WebGL mesh for skybox components
     */
    createSkyMesh(vertices, uvs, colors, indices, name) {
        const gl = this.engine.gl;
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        const mesh = {
            name,
            vertexBuffer,
            uvBuffer,
            colorBuffer,
            indexBuffer,
            indexCount: indices.length,
            vertexCount: vertices.length / 3
        };
        
        this.meshes.push(mesh);
        return mesh;
    }
    
    /**
     * Interpolate between two colors
     */
    interpolateColor(color1, color2, factor) {
        const result = [];
        for (let i = 0; i < 4; i++) {
            result[i] = color1[i] + (color2[i] - color1[i]) * factor;
        }
        return result;
    }
    
    /**
     * Update skybox (cloud movement, etc.)
     */
    update(deltaTime) {
        // Update cloud parallax
        this.cloudOffset += this.windSpeed * deltaTime / 1000;
        
        // Update parallax layers
        for (const layer of this.parallaxLayers) {
            this.updateParallaxLayer(layer, deltaTime);
        }
        
        // Update time-based effects (sun position, etc.)
        if (this.config.dynamicTime) {
            this.updateTimeOfDay(deltaTime);
        }
    }
    
    /**
     * Update parallax layer movement
     */
    updateParallaxLayer(layer, deltaTime) {
        const offset = layer.speed * this.cloudOffset;
        
        // Update cloud positions (simple rotation around Y axis)
        const gl = this.engine.gl;
        const vertices = new Float32Array(layer.originalVertices);
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Rotate around Y axis
            const cos = Math.cos(offset);
            const sin = Math.sin(offset);
            
            vertices[i] = x * cos - z * sin;
            vertices[i + 2] = x * sin + z * cos;
        }
        
        // Update vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    }
    
    /**
     * Update time of day effects
     */
    updateTimeOfDay(deltaTime) {
        // Implement day/night cycle if needed
        // This would adjust sky colors and celestial body positions
    }
    
    /**
     * Render skybox
     */
    render(renderer, camera) {
        if (!this.visible) return;
        
        const gl = this.engine.gl;
        
        // Disable depth writing for skybox
        gl.depthMask(false);
        
        // Render all skybox meshes
        for (const mesh of this.meshes) {
            this.renderSkyMesh(renderer, camera, mesh);
        }
        
        // Re-enable depth writing
        gl.depthMask(true);
    }
    
    /**
     * Render individual sky mesh
     */
    renderSkyMesh(renderer, camera, mesh) {
        // Use skybox shader (vertex colors instead of textures)
        const shader = renderer.shaderManager.getShader('skybox');
        if (!shader) {
            console.warn('Skybox shader not found');
            return;
        }
        
        const gl = this.engine.gl;
        gl.useProgram(shader.program);
        
        // Set camera position to center skybox on player
        const cameraPos = camera.getPosition();
        const skyboxMatrix = new Float32Array(16);
        
        // Create translation matrix to center skybox on camera
        this.createTranslationMatrix(skyboxMatrix, cameraPos[0], 0, cameraPos[2]);
        
        // Set uniforms
        const mvpMatrix = new Float32Array(16);
        this.multiplyMatrices(mvpMatrix, camera.getViewProjectionMatrix(), skyboxMatrix);
        
        gl.uniformMatrix4fv(shader.uniforms.u_mvpMatrix, false, mvpMatrix);
        
        // Bind vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
        gl.enableVertexAttribArray(shader.attributes.a_position);
        gl.vertexAttribPointer(shader.attributes.a_position, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorBuffer);
        gl.enableVertexAttribArray(shader.attributes.a_color);
        gl.vertexAttribPointer(shader.attributes.a_color, 4, gl.FLOAT, false, 0, 0);
        
        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    
    /**
     * Create translation matrix
     */
    createTranslationMatrix(out, x, y, z) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = x; out[13] = y; out[14] = z; out[15] = 1;
    }
    
    /**
     * Multiply two 4x4 matrices
     */
    multiplyMatrices(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        
        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
        
        out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        
        out[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
        out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
        out[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
        out[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
        
        out[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
        out[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
        out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
        out[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
        
        out[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
        out[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
        out[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
        out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
    }
}