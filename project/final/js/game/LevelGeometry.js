/**
 * OneShot Predator Nukem - Level Geometry
 * Creates 3D geometry for level structures using ranch textures
 */

import { GameObject } from '../engine/core/GameObject.js';

export class LevelGeometry extends GameObject {
    constructor(geometryDef, engine) {
        super(`geometry_${geometryDef.id}`);
        
        this.engine = engine;
        this.geometryDef = geometryDef;
        this.meshes = [];
        this.textures = new Map();
        
        // Geometry properties
        this.type = geometryDef.type; // 'wall', 'floor', 'ceiling', 'fence', 'structure'
        this.dimensions = geometryDef.dimensions;
        this.textureId = geometryDef.texture;
        this.uvScale = geometryDef.uvScale || [1, 1];
        
        // Collision properties
        this.isStatic = true;
        this.generateCollision = geometryDef.collision !== false;
        
        console.log(`LevelGeometry created: ${this.name}`);
    }
    
    async initialize() {
        try {
            // Load texture
            await this.loadTexture();
            
            // Generate geometry based on type
            switch (this.type) {
                case 'wall':
                    this.createWallGeometry();
                    break;
                case 'floor':
                    this.createFloorGeometry();
                    break;
                case 'ceiling':
                    this.createCeilingGeometry();
                    break;
                case 'fence':
                    this.createFenceGeometry();
                    break;
                case 'structure':
                    this.createStructureGeometry();
                    break;
                default:
                    console.warn(`Unknown geometry type: ${this.type}`);
            }
            
            // Generate collision if needed
            if (this.generateCollision) {
                this.createCollisionGeometry();
            }
            
            console.log(`LevelGeometry initialized: ${this.name}`);
            
        } catch (error) {
            console.error(`Failed to initialize geometry ${this.name}:`, error);
        }
    }
    
    async loadTexture() {
        const texturePath = `./assets/textures/${this.textureId}`;
        this.texture = await this.engine.renderer.textureManager.loadTexture(
            this.textureId, 
            texturePath
        );
    }
    
    /**
     * Create wall geometry (vertical plane)
     */
    createWallGeometry() {
        const { width, height } = this.dimensions;
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        
        // Wall vertices (facing positive Z)
        const vertices = new Float32Array([
            // Front face
            -halfWidth, -halfHeight, 0,  // Bottom left
             halfWidth, -halfHeight, 0,  // Bottom right
             halfWidth,  halfHeight, 0,  // Top right
            -halfWidth,  halfHeight, 0   // Top left
        ]);
        
        // UV coordinates with scaling
        const uvs = new Float32Array([
            0, 0,                           // Bottom left
            this.uvScale[0], 0,             // Bottom right
            this.uvScale[0], this.uvScale[1], // Top right
            0, this.uvScale[1]              // Top left
        ]);
        
        // Normals (facing camera)
        const normals = new Float32Array([
            0, 0, 1,  // Front face normal
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ]);
        
        // Indices for two triangles
        const indices = new Uint16Array([
            0, 1, 2,  // First triangle
            0, 2, 3   // Second triangle
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
    }
    
    /**
     * Create floor geometry (horizontal plane)
     */
    createFloorGeometry() {
        const { width, depth } = this.dimensions;
        const halfWidth = width * 0.5;
        const halfDepth = depth * 0.5;
        
        // Floor vertices (Y = 0, facing up)
        const vertices = new Float32Array([
            -halfWidth, 0, -halfDepth,  // Back left
             halfWidth, 0, -halfDepth,  // Back right
             halfWidth, 0,  halfDepth,  // Front right
            -halfWidth, 0,  halfDepth   // Front left
        ]);
        
        const uvs = new Float32Array([
            0, 0,
            this.uvScale[0], 0,
            this.uvScale[0], this.uvScale[1],
            0, this.uvScale[1]
        ]);
        
        const normals = new Float32Array([
            0, 1, 0,  // Up normal
            0, 1, 0,
            0, 1, 0,
            0, 1, 0
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
    }
    
    /**
     * Create ceiling geometry (horizontal plane facing down)
     */
    createCeilingGeometry() {
        const { width, depth, height } = this.dimensions;
        const halfWidth = width * 0.5;
        const halfDepth = depth * 0.5;
        
        const vertices = new Float32Array([
            -halfWidth, height, -halfDepth,
            -halfWidth, height,  halfDepth,
             halfWidth, height,  halfDepth,
             halfWidth, height, -halfDepth
        ]);
        
        const uvs = new Float32Array([
            0, 0,
            0, this.uvScale[1],
            this.uvScale[0], this.uvScale[1],
            this.uvScale[0], 0
        ]);
        
        const normals = new Float32Array([
            0, -1, 0,  // Down normal
            0, -1, 0,
            0, -1, 0,
            0, -1, 0
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
    }
    
    /**
     * Create fence geometry (thin wall with posts)
     */
    createFenceGeometry() {
        const { length, height } = this.dimensions;
        const thickness = 0.1;
        const postSpacing = 2.0;
        const postCount = Math.floor(length / postSpacing) + 1;
        
        const vertices = [];
        const uvs = [];
        const normals = [];
        const indices = [];
        let vertexIndex = 0;
        
        // Create fence panels
        for (let i = 0; i < postCount - 1; i++) {
            const x1 = (i * postSpacing) - (length * 0.5);
            const x2 = ((i + 1) * postSpacing) - (length * 0.5);
            
            // Panel vertices
            const panelVerts = [
                x1, 0, 0,           x2, 0, 0,
                x2, height, 0,      x1, height, 0
            ];
            
            vertices.push(...panelVerts);
            
            // Panel UVs
            const panelUVs = [
                0, 0,  1, 0,  1, 1,  0, 1
            ];
            uvs.push(...panelUVs);
            
            // Panel normals
            const panelNormals = [
                0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1
            ];
            normals.push(...panelNormals);
            
            // Panel indices
            indices.push(
                vertexIndex, vertexIndex + 1, vertexIndex + 2,
                vertexIndex, vertexIndex + 2, vertexIndex + 3
            );
            vertexIndex += 4;
        }
        
        // Create fence posts
        for (let i = 0; i < postCount; i++) {
            const x = (i * postSpacing) - (length * 0.5);
            const postVerts = this.createPostVertices(x, height, thickness);
            vertices.push(...postVerts);
            
            // Post UVs and normals (simplified)
            for (let j = 0; j < 8; j++) {
                uvs.push(0, 0);
                normals.push(0, 0, 1);
            }
            
            // Post indices (box geometry)
            const postIndices = this.createBoxIndices(vertexIndex);
            indices.push(...postIndices);
            vertexIndex += 8;
        }
        
        this.createMesh(
            new Float32Array(vertices),
            new Float32Array(uvs),
            new Float32Array(normals),
            new Uint16Array(indices)
        );
    }
    
    /**
     * Create structure geometry (barn, shed, etc.)
     */
    createStructureGeometry() {
        const { width, height, depth } = this.dimensions;
        const structure = this.geometryDef.structure || 'barn';
        
        switch (structure) {
            case 'barn':
                this.createBarnGeometry(width, height, depth);
                break;
            case 'shed':
                this.createShedGeometry(width, height, depth);
                break;
            default:
                this.createBoxGeometry(width, height, depth);
        }
    }
    
    /**
     * Create barn geometry with peaked roof
     */
    createBarnGeometry(width, height, depth) {
        const halfWidth = width * 0.5;
        const halfDepth = depth * 0.5;
        const roofHeight = height * 0.3;
        
        const vertices = [];
        const uvs = [];
        const normals = [];
        const indices = [];
        let vertexIndex = 0;
        
        // Walls
        const walls = [
            // Front wall
            { verts: [-halfWidth, 0, halfDepth, halfWidth, 0, halfDepth, halfWidth, height, halfDepth, -halfWidth, height, halfDepth], normal: [0, 0, 1] },
            // Back wall
            { verts: [halfWidth, 0, -halfDepth, -halfWidth, 0, -halfDepth, -halfWidth, height, -halfDepth, halfWidth, height, -halfDepth], normal: [0, 0, -1] },
            // Left wall
            { verts: [-halfWidth, 0, -halfDepth, -halfWidth, 0, halfDepth, -halfWidth, height, halfDepth, -halfWidth, height, -halfDepth], normal: [-1, 0, 0] },
            // Right wall
            { verts: [halfWidth, 0, halfDepth, halfWidth, 0, -halfDepth, halfWidth, height, -halfDepth, halfWidth, height, halfDepth], normal: [1, 0, 0] }
        ];
        
        for (const wall of walls) {
            vertices.push(...wall.verts);
            uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
            normals.push(...wall.normal, ...wall.normal, ...wall.normal, ...wall.normal);
            indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
            vertexIndex += 4;
        }
        
        // Peaked roof
        const roofTop = height + roofHeight;
        const roofVerts = [
            // Front roof face
            -halfWidth, height, halfDepth, 0, roofTop, halfDepth, halfWidth, height, halfDepth,
            // Back roof face
            halfWidth, height, -halfDepth, 0, roofTop, -halfDepth, -halfWidth, height, -halfDepth,
            // Left roof face
            -halfWidth, height, halfDepth, -halfWidth, height, -halfDepth, 0, roofTop, -halfDepth, 0, roofTop, halfDepth,
            // Right roof face
            halfWidth, height, -halfDepth, halfWidth, height, halfDepth, 0, roofTop, halfDepth, 0, roofTop, -halfDepth
        ];
        
        vertices.push(...roofVerts);
        
        // Add roof UVs, normals, and indices
        for (let i = 0; i < 4; i++) {
            if (i < 2) {
                // Triangular faces
                uvs.push(0, 0, 0.5, 1, 1, 0);
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                vertexIndex += 3;
            } else {
                // Quad faces
                uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
                vertexIndex += 4;
            }
            normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
        }
        
        this.createMesh(
            new Float32Array(vertices),
            new Float32Array(uvs),
            new Float32Array(normals),
            new Uint16Array(indices)
        );
    }
    
    /**
     * Create mesh from geometry data
     */
    createMesh(vertices, uvs, normals, indices) {
        const gl = this.engine.gl;
        
        // Create vertex buffer
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Create UV buffer
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        
        // Create normal buffer
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        
        // Create index buffer
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        // Store mesh data
        this.mesh = {
            vertexBuffer,
            uvBuffer,
            normalBuffer,
            indexBuffer,
            indexCount: indices.length,
            vertexCount: vertices.length / 3
        };
    }
    
    /**
     * Create collision geometry
     */
    createCollisionGeometry() {
        const bounds = this.calculateBounds();
        
        this.collider = {
            type: 'box',
            bounds: bounds,
            isStatic: true
        };
        
        // Register with collision system
        this.engine.collisionSystem.addCollider(this);
    }
    
    /**
     * Calculate bounding box
     */
    calculateBounds() {
        const { dimensions } = this.geometryDef;
        
        switch (this.type) {
            case 'wall':
                return {
                    minX: -dimensions.width * 0.5,
                    maxX: dimensions.width * 0.5,
                    minY: 0,
                    maxY: dimensions.height,
                    minZ: -0.1,
                    maxZ: 0.1
                };
            case 'floor':
            case 'ceiling':
                return {
                    minX: -dimensions.width * 0.5,
                    maxX: dimensions.width * 0.5,
                    minY: -0.1,
                    maxY: 0.1,
                    minZ: -dimensions.depth * 0.5,
                    maxZ: dimensions.depth * 0.5
                };
            default:
                return {
                    minX: -dimensions.width * 0.5,
                    maxX: dimensions.width * 0.5,
                    minY: 0,
                    maxY: dimensions.height || 1,
                    minZ: -dimensions.depth * 0.5,
                    maxZ: dimensions.depth * 0.5
                };
        }
    }
    
    /**
     * Helper: Create post vertices for fence
     */
    createPostVertices(x, height, thickness) {
        const half = thickness * 0.5;
        return [
            // Bottom face
            x - half, 0, -half,  x + half, 0, -half,
            x + half, 0,  half,  x - half, 0,  half,
            // Top face
            x - half, height, -half,  x + half, height, -half,
            x + half, height,  half,  x - half, height,  half
        ];
    }
    
    /**
     * Helper: Create box indices
     */
    createBoxIndices(startIndex) {
        return [
            // Bottom face
            startIndex, startIndex + 1, startIndex + 2,
            startIndex, startIndex + 2, startIndex + 3,
            // Top face
            startIndex + 4, startIndex + 7, startIndex + 6,
            startIndex + 4, startIndex + 6, startIndex + 5
        ];
    }
    
    /**
     * Update geometry (if needed for animations)
     */
    update(deltaTime) {
        // Most geometry is static, but gates might animate
        if (this.geometryDef.animated) {
            this.updateAnimation(deltaTime);
        }
    }
    
    /**
     * Render the geometry
     */
    render(renderer, camera) {
        if (!this.visible || !this.mesh) return;
        
        renderer.renderMesh(this.mesh, this.texture, this.getModelMatrix(), camera);
    }
}