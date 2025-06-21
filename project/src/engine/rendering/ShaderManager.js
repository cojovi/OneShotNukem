/**
 * OneShot Predator Nukem - Shader Manager
 * Handles WebGL shader compilation, linking, and management
 */

export class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaders = new Map();
        this.currentShader = null;
    }
    
    async initialize() {
        try {
            // Load and compile basic 3D shader
            await this.loadShader('basic', 
                await this.loadShaderSource('basic.vert'),
                await this.loadShaderSource('basic.frag')
            );
            
            // Load and compile billboard sprite shader
            await this.loadShader('sprite',
                await this.loadShaderSource('sprite.vert'),
                await this.loadShaderSource('sprite.frag')
            );
            
            console.log('ShaderManager initialized successfully');
            return true;
        } catch (error) {
            console.error('ShaderManager initialization failed:', error);
            return false;
        }
    }
    
    async loadShaderSource(filename) {
        try {
            const response = await fetch(`./shaders/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load shader: ${filename}`);
            }
            return await response.text();
        } catch (error) {
            console.warn(`Could not load shader file ${filename}, using fallback`);
            return this.getFallbackShader(filename);
        }
    }
    
    getFallbackShader(filename) {
        const fallbacks = {
            'basic.vert': `
                attribute vec3 a_position;
                attribute vec2 a_texCoord;
                attribute vec3 a_normal;
                
                uniform mat4 u_modelMatrix;
                uniform mat4 u_viewMatrix;
                uniform mat4 u_projectionMatrix;
                
                varying vec2 v_texCoord;
                varying vec3 v_normal;
                varying vec3 v_worldPos;
                
                void main() {
                    vec4 worldPos = u_modelMatrix * vec4(a_position, 1.0);
                    v_worldPos = worldPos.xyz;
                    v_texCoord = a_texCoord;
                    v_normal = normalize((u_modelMatrix * vec4(a_normal, 0.0)).xyz);
                    
                    gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
                }
            `,
            'basic.frag': `
                precision mediump float;
                
                uniform sampler2D u_texture;
                uniform vec3 u_lightDir;
                uniform vec3 u_lightColor;
                uniform vec3 u_ambientColor;
                
                varying vec2 v_texCoord;
                varying vec3 v_normal;
                varying vec3 v_worldPos;
                
                void main() {
                    vec4 texColor = texture2D(u_texture, v_texCoord);
                    
                    // Simple directional lighting
                    float lightIntensity = max(dot(normalize(v_normal), normalize(-u_lightDir)), 0.0);
                    vec3 lighting = u_ambientColor + u_lightColor * lightIntensity;
                    
                    gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
                }
            `,
            'sprite.vert': `
                attribute vec3 a_position;
                attribute vec2 a_texCoord;
                
                uniform mat4 u_viewMatrix;
                uniform mat4 u_projectionMatrix;
                uniform vec3 u_spritePos;
                uniform vec2 u_spriteSize;
                uniform vec3 u_cameraRight;
                uniform vec3 u_cameraUp;
                
                varying vec2 v_texCoord;
                
                void main() {
                    // Billboard calculation - always face camera
                    vec3 worldPos = u_spritePos + 
                                   u_cameraRight * a_position.x * u_spriteSize.x +
                                   u_cameraUp * a_position.y * u_spriteSize.y;
                    
                    v_texCoord = a_texCoord;
                    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(worldPos, 1.0);
                }
            `,
            'sprite.frag': `
                precision mediump float;
                
                uniform sampler2D u_texture;
                uniform float u_alpha;
                
                varying vec2 v_texCoord;
                
                void main() {
                    vec4 texColor = texture2D(u_texture, v_texCoord);
                    
                    // Discard transparent pixels for retro look
                    if (texColor.a < 0.1) {
                        discard;
                    }
                    
                    gl_FragColor = vec4(texColor.rgb, texColor.a * u_alpha);
                }
            `
        };
        
        return fallbacks[filename] || '';
    }
    
    async loadShader(name, vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            throw new Error(`Failed to compile shaders for ${name}`);
        }
        
        const program = this.linkProgram(vertexShader, fragmentShader);
        if (!program) {
            throw new Error(`Failed to link shader program for ${name}`);
        }
        
        // Get attribute and uniform locations
        const attributes = this.getAttributes(program);
        const uniforms = this.getUniforms(program);
        
        const shader = {
            name,
            program,
            attributes,
            uniforms,
            vertexShader,
            fragmentShader
        };
        
        this.shaders.set(name, shader);
        console.log(`Shader '${name}' loaded successfully`);
        
        return shader;
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            console.error('Shader compilation error:', error);
            console.error('Shader source:', source);
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    linkProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            console.error('Shader program linking error:', error);
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    getAttributes(program) {
        const attributes = {};
        const attributeCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        
        for (let i = 0; i < attributeCount; i++) {
            const attribute = this.gl.getActiveAttrib(program, i);
            const location = this.gl.getAttribLocation(program, attribute.name);
            attributes[attribute.name] = location;
        }
        
        return attributes;
    }
    
    getUniforms(program) {
        const uniforms = {};
        const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        
        for (let i = 0; i < uniformCount; i++) {
            const uniform = this.gl.getActiveUniform(program, i);
            const location = this.gl.getUniformLocation(program, uniform.name);
            uniforms[uniform.name] = location;
        }
        
        return uniforms;
    }
    
    useShader(name) {
        const shader = this.shaders.get(name);
        if (!shader) {
            console.warn(`Shader '${name}' not found`);
            return null;
        }
        
        if (this.currentShader !== shader) {
            this.gl.useProgram(shader.program);
            this.currentShader = shader;
        }
        
        return shader;
    }
    
    getShader(name) {
        return this.shaders.get(name);
    }
    
    hasShader(name) {
        return this.shaders.has(name);
    }
    
    deleteShader(name) {
        const shader = this.shaders.get(name);
        if (shader) {
            this.gl.deleteProgram(shader.program);
            this.gl.deleteShader(shader.vertexShader);
            this.gl.deleteShader(shader.fragmentShader);
            this.shaders.delete(name);
            
            if (this.currentShader === shader) {
                this.currentShader = null;
            }
        }
    }
    
    cleanup() {
        for (const [name, shader] of this.shaders) {
            this.deleteShader(name);
        }
        this.shaders.clear();
        this.currentShader = null;
    }
    
    // Utility method to set common uniforms
    setCommonUniforms(shader, viewMatrix, projectionMatrix, modelMatrix = null) {
        if (shader.uniforms.u_viewMatrix) {
            this.gl.uniformMatrix4fv(shader.uniforms.u_viewMatrix, false, viewMatrix);
        }
        if (shader.uniforms.u_projectionMatrix) {
            this.gl.uniformMatrix4fv(shader.uniforms.u_projectionMatrix, false, projectionMatrix);
        }
        if (modelMatrix && shader.uniforms.u_modelMatrix) {
            this.gl.uniformMatrix4fv(shader.uniforms.u_modelMatrix, false, modelMatrix);
        }
        
        // Set default lighting
        if (shader.uniforms.u_lightDir) {
            this.gl.uniform3f(shader.uniforms.u_lightDir, 0.5, -1.0, 0.3);
        }
        if (shader.uniforms.u_lightColor) {
            this.gl.uniform3f(shader.uniforms.u_lightColor, 1.0, 0.9, 0.8);
        }
        if (shader.uniforms.u_ambientColor) {
            this.gl.uniform3f(shader.uniforms.u_ambientColor, 0.3, 0.3, 0.4);
        }
    }
}