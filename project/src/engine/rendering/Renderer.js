/**
 * OneShot Predator Nukem - WebGL Renderer
 * Handles 3D rendering and billboard sprite rendering for retro 2.5D aesthetic
 */

import { ShaderManager } from './ShaderManager.js';
import { TextureManager } from './TextureManager.js';
import { SpriteRenderer } from './SpriteRenderer.js';

export class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.shaderManager = new ShaderManager(gl);
        this.textureManager = new TextureManager(gl);
        this.spriteRenderer = new SpriteRenderer(gl);
        
        // Rendering state
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        this.modelMatrix = new Float32Array(16);
        
        // Performance tracking
        this.drawCalls = 0;
        this.triangles = 0;
    }
    
    async initialize() {
        try {
            // Initialize shader manager
            await this.shaderManager.initialize();
            
            // Initialize sprite renderer
            await this.spriteRenderer.initialize(this.shaderManager, this.textureManager);
            
            // Load default textures
            await this.loadDefaultTextures();
            
            console.log('Renderer initialized successfully');
            return true;
        } catch (error) {
            console.error('Renderer initialization failed:', error);
            return false;
        }
    }
    
    async loadDefaultTextures() {
        // Load ranch environment textures
        const textures = [
            'cedar_fence.png',
            'pine_fence.png', 
            'barn_wood.png',
            'ranch_ground.png',
            'ranch_grass.png',
            'ranch_stone.png'
        ];
        
        for (const texture of textures) {
            await this.textureManager.loadTexture(
                texture.replace('.png', ''),
                `./assets/textures/${texture}`
            );
        }
        
        // Load sprite textures
        const sprites = [
            'boar_patrol_variant1.png',
            'boar_patrol_variant2.png',
            'boar_charge_variant1.png',
            'boar_charge_variant2.png',
            'boar_death_variant1.png',
            'boar_death_variant2.png'
        ];
        
        for (const sprite of sprites) {
            await this.textureManager.loadTexture(
                sprite.replace('.png', ''),
                `./assets/sprites/${sprite}`
            );
        }
    }
    
    render(camera, gameObjects, sprites) {
        // Reset performance counters
        this.drawCalls = 0;
        this.triangles = 0;
        
        // Update matrices
        this.updateMatrices(camera);
        
        // Render 3D geometry first (walls, floors, etc.)
        this.renderGeometry(gameObjects);
        
        // Render billboard sprites (enemies, items)
        this.renderSprites(sprites, camera);
    }
    
    updateMatrices(camera) {
        // Get view and projection matrices from camera
        camera.getViewMatrix(this.viewMatrix);
        camera.getProjectionMatrix(this.projectionMatrix);
    }
    
    renderGeometry(gameObjects) {
        const shader = this.shaderManager.getShader('basic');
        if (!shader) return;
        
        this.gl.useProgram(shader.program);
        
        // Set common uniforms
        this.gl.uniformMatrix4fv(shader.uniforms.u_viewMatrix, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(shader.uniforms.u_projectionMatrix, false, this.projectionMatrix);
        
        for (const gameObject of gameObjects) {
            if (gameObject.mesh && gameObject.visible !== false) {
                this.renderMesh(gameObject, shader);
            }
        }
    }
    
    renderMesh(gameObject, shader) {
        const mesh = gameObject.mesh;
        
        // Set model matrix
        gameObject.getModelMatrix(this.modelMatrix);
        this.gl.uniformMatrix4fv(shader.uniforms.u_modelMatrix, false, this.modelMatrix);
        
        // Bind texture if available
        if (gameObject.texture) {
            const texture = this.textureManager.getTexture(gameObject.texture);
            if (texture) {
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.uniform1i(shader.uniforms.u_texture, 0);
            }
        }
        
        // Bind vertex data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertexBuffer);
        this.gl.enableVertexAttribArray(shader.attributes.a_position);
        this.gl.vertexAttribPointer(shader.attributes.a_position, 3, this.gl.FLOAT, false, 0, 0);
        
        if (mesh.uvBuffer && shader.attributes.a_texCoord !== undefined) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.uvBuffer);
            this.gl.enableVertexAttribArray(shader.attributes.a_texCoord);
            this.gl.vertexAttribPointer(shader.attributes.a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
        }
        
        if (mesh.normalBuffer && shader.attributes.a_normal !== undefined) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
            this.gl.enableVertexAttribArray(shader.attributes.a_normal);
            this.gl.vertexAttribPointer(shader.attributes.a_normal, 3, this.gl.FLOAT, false, 0, 0);
        }
        
        // Draw the mesh
        if (mesh.indexBuffer) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, mesh.indexCount, this.gl.UNSIGNED_SHORT, 0);
            this.triangles += mesh.indexCount / 3;
        } else {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, mesh.vertexCount);
            this.triangles += mesh.vertexCount / 3;
        }
        
        this.drawCalls++;
    }
    
    renderSprites(sprites, camera) {
        if (sprites.length === 0) return;
        
        // Sort sprites by distance for proper alpha blending
        const cameraPos = camera.getPosition();
        sprites.sort((a, b) => {
            const distA = this.getDistanceSquared(a.position, cameraPos);
            const distB = this.getDistanceSquared(b.position, cameraPos);
            return distB - distA; // Far to near
        });
        
        // Render sprites using sprite renderer
        this.spriteRenderer.render(sprites, this.viewMatrix, this.projectionMatrix, camera);
        
        this.drawCalls += sprites.length;
    }
    
    getDistanceSquared(pos1, pos2) {
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        return dx * dx + dy * dy + dz * dz;
    }
    
    // Utility methods for creating basic geometry
    createQuad(width = 1, height = 1) {
        const vertices = new Float32Array([
            -width/2, -height/2, 0,
             width/2, -height/2, 0,
             width/2,  height/2, 0,
            -width/2,  height/2, 0
        ]);
        
        const uvs = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
        
        return this.createMesh(vertices, uvs, null, indices);
    }
    
    createCube(size = 1) {
        const s = size / 2;
        const vertices = new Float32Array([
            // Front face
            -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,
            // Back face
            -s, -s, -s,  -s,  s, -s,   s,  s, -s,   s, -s, -s,
            // Top face
            -s,  s, -s,  -s,  s,  s,   s,  s,  s,   s,  s, -s,
            // Bottom face
            -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s,
            // Right face
             s, -s, -s,   s,  s, -s,   s,  s,  s,   s, -s,  s,
            // Left face
            -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s
        ]);
        
        const indices = new Uint16Array([
            0,  1,  2,    0,  2,  3,    // front
            4,  5,  6,    4,  6,  7,    // back
            8,  9,  10,   8,  10, 11,   // top
            12, 13, 14,   12, 14, 15,   // bottom
            16, 17, 18,   16, 18, 19,   // right
            20, 21, 22,   20, 22, 23    // left
        ]);
        
        return this.createMesh(vertices, null, null, indices);
    }
    
    createMesh(vertices, uvs = null, normals = null, indices = null) {
        const mesh = {
            vertexBuffer: this.gl.createBuffer(),
            vertexCount: vertices.length / 3
        };
        
        // Upload vertex data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        
        // Upload UV data if provided
        if (uvs) {
            mesh.uvBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.uvBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, uvs, this.gl.STATIC_DRAW);
        }
        
        // Upload normal data if provided
        if (normals) {
            mesh.normalBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);
        }
        
        // Upload index data if provided
        if (indices) {
            mesh.indexBuffer = this.gl.createBuffer();
            mesh.indexCount = indices.length;
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
        }
        
        return mesh;
    }
    
    getStats() {
        return {
            drawCalls: this.drawCalls,
            triangles: this.triangles
        };
    }
}