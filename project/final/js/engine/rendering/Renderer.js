/**
 * OneShot Predator Nukem - WebGL Renderer
 * Handles all rendering operations for the game
 */

export class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.shaderManager = null;
        this.textureManager = null;
        this.spriteRenderer = null;
        this.skybox = null;
        
        this.stats = {
            drawCalls: 0,
            triangleCount: 0
        };
    }

    async initialize() {
        const { ShaderManager } = await import('./ShaderManager.js');
        const { TextureManager } = await import('./TextureManager.js');
        const { SpriteRenderer } = await import('./SpriteRenderer.js');

        this.shaderManager = new ShaderManager(this.gl);
        this.textureManager = new TextureManager(this.gl);
        this.spriteRenderer = new SpriteRenderer(this.gl);

        await this.shaderManager.initialize();
        await this.textureManager.initialize();
        await this.spriteRenderer.initialize(this.shaderManager, this.textureManager);
        
        await this.loadDefaultTextures();
        console.log('Renderer initialized successfully');
    }
    
    async loadDefaultTextures() {
        // Load textures needed for the game
        await this.textureManager.loadTexture('placeholder', 'assets/textures/placeholder.png');
        console.log('Default textures loaded');
    }

    render(camera, gameObjects, sprites) {
        this.stats.drawCalls = 0;
        this.stats.triangleCount = 0;

        const viewMatrix = camera.getViewMatrix();
        const projectionMatrix = camera.getProjectionMatrix();

        this.updateMatrices(camera);
        
        // Render solid geometry
        this.renderGeometry(gameObjects, viewMatrix, projectionMatrix);
        
        // Render sprites
        this.renderSprites(sprites, viewMatrix, projectionMatrix, camera);
        
        // Render skybox last
        if (this.skybox) {
            this.skybox.render(this, camera);
        }
    }
    
    updateMatrices(camera) {
        // This can be used for camera-related updates if needed
    }

    renderGeometry(gameObjects, viewMatrix, projectionMatrix) {
        for (const gameObject of gameObjects) {
            if (gameObject.mesh && gameObject.isActive()) {
                this.renderMesh(gameObject, viewMatrix, projectionMatrix);
            }
        }
    }
    
    renderMesh(gameObject, viewMatrix, projectionMatrix) {
        const shader = this.shaderManager.useShader('basic');
        if (!shader) return;
        
        this.gl.useProgram(shader.program);
        
        const modelMatrix = gameObject.getModelMatrix();
        
        this.shaderManager.setCommonUniforms(shader, viewMatrix, projectionMatrix, modelMatrix);
        
        // Bind texture
        if (gameObject.texture) {
            this.textureManager.bindTexture(gameObject.texture, 0);
            this.gl.uniform1i(shader.uniforms.uSampler, 0);
        } else {
            this.textureManager.bindTexture('placeholder', 0);
            this.gl.uniform1i(shader.uniforms.uSampler, 0);
        }

        // Bind VAO and draw
        this.gl.bindVertexArray(gameObject.mesh.vao);
        this.gl.drawElements(this.gl.TRIANGLES, gameObject.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);

        this.stats.drawCalls++;
        this.stats.triangleCount += gameObject.mesh.indices.length / 3;
    }

    renderSprites(sprites, viewMatrix, projectionMatrix, camera) {
        if (this.spriteRenderer) {
            this.spriteRenderer.render(sprites, viewMatrix, projectionMatrix, camera);
            this.stats.drawCalls += this.spriteRenderer.getStats().drawCalls;
            this.stats.triangleCount += this.spriteRenderer.getStats().triangleCount;
        }
    }

    createMesh(vertices, uvs = null, normals = null, indices = null) {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        const vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);

        let uvBuffer = null;
        if (uvs) {
            uvBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uvBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, uvs, this.gl.STATIC_DRAW);
            this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(1);
        }

        let normalBuffer = null;
        if (normals) {
            normalBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);
            this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(2);
        }

        let ibo = null;
        if (indices) {
            ibo = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
        }
        
        this.gl.bindVertexArray(null);
        
        return {
            vao,
            vbo,
            uvBuffer,
            normalBuffer,
            ibo,
            vertices,
            uvs,
            normals,
            indices
        };
    }

    getStats() {
        return this.stats;
    }
}