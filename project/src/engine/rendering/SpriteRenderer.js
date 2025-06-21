/**
 * OneShot Predator Nukem - Sprite Renderer
 * Handles billboard sprite rendering for retro 2.5D aesthetic
 */

export class SpriteRenderer {
    constructor(gl) {
        this.gl = gl;
        this.shader = null;
        this.quadBuffer = null;
        this.quadUVBuffer = null;
        this.quadIndices = null;
        
        // Sprite quad geometry (centered at origin)
        this.quadVertices = new Float32Array([
            -0.5, -0.5, 0.0,  // Bottom left
             0.5, -0.5, 0.0,  // Bottom right
             0.5,  0.5, 0.0,  // Top right
            -0.5,  0.5, 0.0   // Top left
        ]);
        
        this.quadUVs = new Float32Array([
            0.0, 1.0,  // Bottom left
            1.0, 1.0,  // Bottom right
            1.0, 0.0,  // Top right
            0.0, 0.0   // Top left
        ]);
        
        this.quadIndexes = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
    }
    
    async initialize(shaderManager, textureManager) {
        this.shaderManager = shaderManager;
        this.textureManager = textureManager;
        
        // Get sprite shader
        this.shader = shaderManager.getShader('sprite');
        if (!this.shader) {
            throw new Error('Sprite shader not found');
        }
        
        // Create quad buffers
        this.createQuadBuffers();
        
        console.log('SpriteRenderer initialized successfully');
    }
    
    createQuadBuffers() {
        // Vertex buffer
        this.quadBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.quadVertices, this.gl.STATIC_DRAW);
        
        // UV buffer
        this.quadUVBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadUVBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.quadUVs, this.gl.STATIC_DRAW);
        
        // Index buffer
        this.quadIndices = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.quadIndices);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.quadIndexes, this.gl.STATIC_DRAW);
    }
    
    render(sprites, viewMatrix, projectionMatrix, camera) {
        if (sprites.length === 0) return;
        
        // Use sprite shader
        this.gl.useProgram(this.shader.program);
        
        // Set common uniforms
        this.gl.uniformMatrix4fv(this.shader.uniforms.u_viewMatrix, false, viewMatrix);
        this.gl.uniformMatrix4fv(this.shader.uniforms.u_projectionMatrix, false, projectionMatrix);
        
        // Get camera vectors for billboard calculation
        const cameraRight = camera.getRightVector();
        const cameraUp = camera.getUpVector();
        
        this.gl.uniform3fv(this.shader.uniforms.u_cameraRight, cameraRight);
        this.gl.uniform3fv(this.shader.uniforms.u_cameraUp, cameraUp);
        
        // Set up vertex attributes
        this.setupVertexAttributes();
        
        // Disable depth writing for sprites (but keep depth testing)
        this.gl.depthMask(false);
        
        // Render each sprite
        for (const sprite of sprites) {
            this.renderSprite(sprite);
        }
        
        // Re-enable depth writing
        this.gl.depthMask(true);
        
        // Clean up
        this.gl.disableVertexAttribArray(this.shader.attributes.a_position);
        this.gl.disableVertexAttribArray(this.shader.attributes.a_texCoord);
    }
    
    setupVertexAttributes() {
        // Bind position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
        this.gl.enableVertexAttribArray(this.shader.attributes.a_position);
        this.gl.vertexAttribPointer(this.shader.attributes.a_position, 3, this.gl.FLOAT, false, 0, 0);
        
        // Bind UV buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadUVBuffer);
        this.gl.enableVertexAttribArray(this.shader.attributes.a_texCoord);
        this.gl.vertexAttribPointer(this.shader.attributes.a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
        
        // Bind index buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.quadIndices);
    }
    
    renderSprite(sprite) {
        // Set sprite position and size
        this.gl.uniform3fv(this.shader.uniforms.u_spritePos, sprite.position);
        this.gl.uniform2fv(this.shader.uniforms.u_spriteSize, sprite.size || [1.0, 1.0]);
        
        // Set alpha
        this.gl.uniform1f(this.shader.uniforms.u_alpha, sprite.alpha || 1.0);
        
        // Bind texture
        const texture = this.textureManager.getTexture(sprite.texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.shader.uniforms.u_texture, 0);
        
        // Draw the sprite
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    
    // Utility method to create a sprite object
    createSprite(texture, position, size = [1.0, 1.0], alpha = 1.0) {
        return {
            texture: texture,
            position: position,
            size: size,
            alpha: alpha,
            visible: true
        };
    }
    
    // Batch rendering for multiple sprites with same texture (optimization)
    renderBatch(sprites, texture) {
        if (sprites.length === 0) return;
        
        // Bind texture once for all sprites
        const tex = this.textureManager.getTexture(texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.uniform1i(this.shader.uniforms.u_texture, 0);
        
        // Render each sprite in the batch
        for (const sprite of sprites) {
            if (sprite.visible !== false && sprite.texture === texture) {
                this.gl.uniform3fv(this.shader.uniforms.u_spritePos, sprite.position);
                this.gl.uniform2fv(this.shader.uniforms.u_spriteSize, sprite.size || [1.0, 1.0]);
                this.gl.uniform1f(this.shader.uniforms.u_alpha, sprite.alpha || 1.0);
                
                this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
            }
        }
    }
    
    // Animation support for sprite frames
    updateSpriteAnimation(sprite, deltaTime) {
        if (!sprite.animation) return;
        
        sprite.animation.currentTime += deltaTime;
        
        if (sprite.animation.currentTime >= sprite.animation.frameTime) {
            sprite.animation.currentFrame++;
            sprite.animation.currentTime = 0;
            
            if (sprite.animation.currentFrame >= sprite.animation.frames.length) {
                if (sprite.animation.loop) {
                    sprite.animation.currentFrame = 0;
                } else {
                    sprite.animation.currentFrame = sprite.animation.frames.length - 1;
                    sprite.animation.finished = true;
                }
            }
            
            // Update sprite texture to current frame
            sprite.texture = sprite.animation.frames[sprite.animation.currentFrame];
        }
    }
    
    // Create animation data for sprites
    createAnimation(frames, frameTime = 100, loop = true) {
        return {
            frames: frames,
            frameTime: frameTime,
            currentFrame: 0,
            currentTime: 0,
            loop: loop,
            finished: false
        };
    }
    
    // Create boar sprite with animation states
    createBoarSprite(position, variant = 1) {
        const sprite = this.createSprite(`boar_patrol_variant${variant}`, position, [2.0, 2.0]);
        
        // Add animation states
        sprite.animations = {
            patrol: this.createAnimation([
                `boar_patrol_variant${variant}`
            ], 500, true),
            charge: this.createAnimation([
                `boar_charge_variant${variant}`
            ], 200, true),
            death: this.createAnimation([
                `boar_death_variant${variant}`
            ], 1000, false)
        };
        
        sprite.currentState = 'patrol';
        sprite.animation = sprite.animations.patrol;
        
        return sprite;
    }
    
    // Update sprite state (for enemy AI)
    setSpriteState(sprite, state) {
        if (sprite.animations && sprite.animations[state]) {
            sprite.currentState = state;
            sprite.animation = sprite.animations[state];
            sprite.animation.currentFrame = 0;
            sprite.animation.currentTime = 0;
            sprite.animation.finished = false;
        }
    }
    
    cleanup() {
        if (this.quadBuffer) {
            this.gl.deleteBuffer(this.quadBuffer);
            this.quadBuffer = null;
        }
        if (this.quadUVBuffer) {
            this.gl.deleteBuffer(this.quadUVBuffer);
            this.quadUVBuffer = null;
        }
        if (this.quadIndices) {
            this.gl.deleteBuffer(this.quadIndices);
            this.quadIndices = null;
        }
    }
}