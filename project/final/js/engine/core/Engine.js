/**
 * OneShot Predator Nukem - Core Game Engine
 * Main engine class that coordinates all game systems
 */

export class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.running = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // Engine systems
        this.renderer = null;
        this.camera = null;
        this.inputManager = null;
        this.audioManager = null;
        this.collisionSystem = null;
        
        // Game state
        this.gameObjects = [];
        this.sprites = [];
        
        this.initWebGL();
    }
    
    initWebGL() {
        // Get WebGL context with optimal settings
        const contextOptions = {
            alpha: false,
            depth: true,
            stencil: false,
            antialias: false, // Disabled for retro aesthetic
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance"
        };
        
        this.gl = this.canvas.getContext('webgl2', contextOptions) || 
                  this.canvas.getContext('webgl', contextOptions);
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // Set up WebGL state
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        
        // Enable blending for sprites
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        console.log('WebGL initialized successfully');
        console.log('WebGL Version:', this.gl.getParameter(this.gl.VERSION));
        console.log('GLSL Version:', this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION));
    }
    
    async initialize() {
        try {
            // Initialize all engine systems
            const { Renderer } = await import('../rendering/Renderer.js');
            const { Camera } = await import('../rendering/Camera.js');
            const { InputManager } = await import('../input/InputManager.js');
            const { AudioManager } = await import('../audio/AudioManager.js');
            const { CollisionSystem } = await import('../collision/CollisionSystem.js');
            
            this.renderer = new Renderer(this.gl);
            this.camera = new Camera();
            this.inputManager = new InputManager(this.canvas);
            this.audioManager = new AudioManager();
            this.collisionSystem = new CollisionSystem();
            
            await this.renderer.initialize();
            await this.audioManager.initialize();
            
            // Set up camera controls
            this.inputManager.setCamera(this.camera);
            
            console.log('Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('Engine initialization failed:', error);
            return false;
        }
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('Engine started');
    }
    
    stop() {
        this.running = false;
        console.log('Engine stopped');
    }
    
    gameLoop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent spiral of death
        if (this.deltaTime > 50) {
            this.deltaTime = 50;
        }
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update input
        this.inputManager.update(deltaTime);
        
        // Update camera
        this.camera.update(deltaTime);
        
        // Update game objects
        for (const gameObject of this.gameObjects) {
            if (gameObject.update) {
                gameObject.update(deltaTime);
            }
        }
        
        // Update collision system
        this.collisionSystem.update(this.gameObjects);
        
        // Update audio
        this.audioManager.update(deltaTime);
    }
    
    render() {
        // Clear the screen
        this.gl.clearColor(0.2, 0.3, 0.4, 1.0); // Retro blue-gray sky
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Render the scene
        this.renderer.render(this.camera, this.gameObjects, this.sprites);
    }
    
    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
    }
    
    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }
    }
    
    addSprite(sprite) {
        this.sprites.push(sprite);
    }
    
    removeSprite(sprite) {
        const index = this.sprites.indexOf(sprite);
        if (index > -1) {
            this.sprites.splice(index, 1);
        }
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.camera.setAspectRatio(width / height);
        console.log(`Engine resized to ${width}x${height}`);
    }
    
    getStats() {
        return {
            fps: Math.round(1000 / this.deltaTime),
            deltaTime: this.deltaTime,
            gameObjects: this.gameObjects.length,
            sprites: this.sprites.length
        };
    }
}