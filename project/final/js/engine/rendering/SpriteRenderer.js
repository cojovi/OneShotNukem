/**
 * OneShot Predator Nukem - Sprite Renderer
 * Handles rendering of billboarded sprites for 2.5D effect
 */

export class SpriteRenderer {
    constructor(gl) {
        this.gl = gl;
        this.shader = null;
        this.textureManager = null;
        
        this.quadVao = null;
        this.quadVbo = null;
        this.quadIbo = null;
        
        this.stats = {
            drawCalls: 0,
            triangleCount: 0
        };
    }

    async initialize(shaderManager, textureManager) {
        this.shader = shaderManager.getShader('sprite');
        this.textureManager = textureManager;
        this.createQuadBuffers();
        console.log('SpriteRenderer initialized');
    }

    createQuadBuffers() {
        const gl = this.gl;
        
        const vertices = new Float32Array([
            -0.5, -0.5, 0.0,
             0.5, -0.5, 0.0,
             0.5,  0.5, 0.0,
            -0.5,  0.5, 0.0,
        ]);

        const uvs = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ]);

        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);

        this.quadVao = gl.createVertexArray();
        gl.bindVertexArray(this.quadVao);

        this.quadVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        this.quadIbo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIbo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    render(sprites, viewMatrix, projectionMatrix, camera) {
        if (!this.shader || sprites.length === 0) {
            return;
        }

        this.stats.drawCalls = 0;
        this.stats.triangleCount = 0;

        this.gl.useProgram(this.shader.program);
        this.gl.bindVertexArray(this.quadVao);
        
        this.gl.uniformMatrix4fv(this.shader.uniforms.u_viewMatrix, false, viewMatrix);
        this.gl.uniformMatrix4fv(this.shader.uniforms.u_projectionMatrix, false, projectionMatrix);
        
        const cameraPosition = camera.getPosition();
        sprites.sort((a, b) => {
            const distA = vec3.squaredDistance(cameraPosition, a.position);
            const distB = vec3.squaredDistance(cameraPosition, b.position);
            return distB - distA; // Sort from far to near
        });

        for (const sprite of sprites) {
            if (sprite.visible) {
                this.renderSprite(sprite);
            }
        }
        
        this.gl.bindVertexArray(null);
    }
    
    renderSprite(sprite) {
        this.textureManager.bindTexture(sprite.texture, 0);
        this.gl.uniform1i(this.shader.uniforms.uSampler, 0);
        
        this.gl.uniform3fv(this.shader.uniforms.u_spritePos, sprite.position);
        this.gl.uniform2fv(this.shader.uniforms.u_spriteSize, sprite.size);
        this.gl.uniform1f(this.shader.uniforms.u_alpha, sprite.alpha);
        
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        
        this.stats.drawCalls++;
        this.stats.triangleCount += 2;
    }

    cleanup() {
        this.gl.deleteVertexArray(this.quadVao);
        this.gl.deleteBuffer(this.quadVbo);
        this.gl.deleteBuffer(this.quadIbo);
    }
    
    getStats() {
        return this.stats;
    }
}