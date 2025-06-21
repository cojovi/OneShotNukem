/**
 * OneShot Predator Nukem - Shader Manager
 * Handles loading, compiling, and managing WebGL shaders
 */

export class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaders = new Map();
        this.currentShader = null;
    }

    async initialize() {
        await this.loadDefaultShaders();
        console.log('ShaderManager initialized successfully');
    }

    async loadDefaultShaders() {
        const shadersToLoad = {
            basic: {
                vertex: 'shaders/basic.vert',
                fragment: 'shaders/basic.frag'
            },
            sprite: {
                vertex: 'shaders/sprite.vert',
                fragment: 'shaders/sprite.frag'
            },
            skybox: {
                vertex: 'shaders/skybox.vert',
                fragment: 'shaders/skybox.frag'
            }
        };

        for (const [name, paths] of Object.entries(shadersToLoad)) {
            const vertexSource = await this.loadShaderSource(paths.vertex);
            const fragmentSource = await this.loadShaderSource(paths.fragment);
            await this.loadShader(name, vertexSource, fragmentSource);
        }
    }

    async loadShaderSource(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`Failed to load shader: ${filename}`);
            }
            return await response.text();
        } catch (error) {
            console.error(error);
            return this.getFallbackShader(filename.includes('.vert') ? 'vertex' : 'fragment');
        }
    }

    getFallbackShader(type) {
        if (type === 'vertex') {
            return `
                attribute vec3 a_position;
                uniform mat4 u_modelMatrix;
                uniform mat4 u_viewMatrix;
                uniform mat4 u_projectionMatrix;
                void main() {
                    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
                }
            `;
        }
        return `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // Magenta for missing shader
            }
        `;
    }

    async loadShader(name, vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return;
        }

        const program = this.linkProgram(vertexShader, fragmentShader);
        if (!program) {
            return;
        }

        const shader = {
            program,
            attributes: this.getAttributes(program),
            uniforms: this.getUniforms(program)
        };
        
        this.shaders.set(name, shader);
        console.log(`Shader '${name}' loaded successfully`);
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const typeName = type === this.gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
            console.error(`${typeName} shader compile error:`, this.gl.getShaderInfoLog(shader));
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
            console.error('Shader link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    getAttributes(program) {
        const attributes = {};
        const count = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < count; i++) {
            const info = this.gl.getActiveAttrib(program, i);
            attributes[info.name] = this.gl.getAttribLocation(program, info.name);
        }
        return attributes;
    }

    getUniforms(program) {
        const uniforms = {};
        const count = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = this.gl.getActiveUniform(program, i);
            uniforms[info.name] = this.gl.getUniformLocation(program, info.name);
        }
        return uniforms;
    }

    useShader(name) {
        const shader = this.shaders.get(name);
        if (shader && this.currentShader !== shader) {
            this.gl.useProgram(shader.program);
            this.currentShader = shader;
        }
        return shader;
    }

    getShader(name) {
        return this.shaders.get(name);
    }

    setCommonUniforms(shader, viewMatrix, projectionMatrix, modelMatrix) {
        if (shader.uniforms.u_viewMatrix) {
            this.gl.uniformMatrix4fv(shader.uniforms.u_viewMatrix, false, viewMatrix);
        }
        if (shader.uniforms.u_projectionMatrix) {
            this.gl.uniformMatrix4fv(shader.uniforms.u_projectionMatrix, false, projectionMatrix);
        }
        if (modelMatrix && shader.uniforms.u_modelMatrix) {
            this.gl.uniformMatrix4fv(shader.uniforms.u_modelMatrix, false, modelMatrix);
        }
    }

    cleanup() {
        for (const shader of this.shaders.values()) {
            this.gl.deleteProgram(shader.program);
        }
        this.shaders.clear();
    }
}