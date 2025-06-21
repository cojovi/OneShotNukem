/**
 * OneShot Predator Nukem - Environment Object
 * Interactive objects in the ranch environment (gates, switches, keycards, etc.)
 */

import { GameObject } from '../engine/core/GameObject.js';

export class EnvironmentObject extends GameObject {
    constructor(objectDef, engine) {
        super(`env_${objectDef.id}`);
        
        this.engine = engine;
        this.objectDef = objectDef;
        this.objectType = objectDef.type; // 'gate', 'switch', 'keycard', 'decoration'
        
        // Interactive properties
        this.interactive = objectDef.interactive !== false;
        this.interactionRange = objectDef.interactionRange || 2.0;
        this.activated = false;
        this.collected = false;
        
        // Animation properties
        this.animating = false;
        this.animationTime = 0;
        this.animationDuration = objectDef.animationDuration || 1.0;
        
        // Gate-specific properties
        if (this.objectType === 'gate') {
            this.isOpen = false;
            this.openPosition = objectDef.openPosition || [0, 0, 0];
            this.closedPosition = [...this.position];
        }
        
        // Switch-specific properties
        if (this.objectType === 'switch') {
            this.switchId = objectDef.switchId;
            this.requirements = objectDef.requirements;
        }
        
        // Keycard-specific properties
        if (this.objectType === 'keycard') {
            this.keycardId = objectDef.keycardId;
            this.floatAnimation = true;
            this.floatOffset = 0;
        }
        
        console.log(`EnvironmentObject created: ${this.name} (${this.objectType})`);
    }
    
    async initialize() {
        try {
            // Load texture/sprite based on object type
            await this.loadAssets();
            
            // Create geometry
            this.createGeometry();
            
            // Set up collision if interactive
            if (this.interactive) {
                this.setupInteraction();
            }
            
            // Set initial position
            this.setPosition(this.objectDef.position);
            
            console.log(`EnvironmentObject initialized: ${this.name}`);
            
        } catch (error) {
            console.error(`Failed to initialize environment object ${this.name}:`, error);
        }
    }
    
    async loadAssets() {
        const assetMap = {
            'gate': 'cedar_fence.png',
            'switch': 'ranch_stone.png',
            'keycard': 'ranch_stone.png', // Will be rendered as sprite
            'decoration': this.objectDef.texture || 'barn_wood.png'
        };
        
        const textureFile = assetMap[this.objectType];
        const texturePath = `./assets/textures/${textureFile}`;
        
        this.texture = await this.engine.renderer.textureManager.loadTexture(
            `${this.objectType}_${this.name}`,
            texturePath
        );
    }
    
    createGeometry() {
        switch (this.objectType) {
            case 'gate':
                this.createGateGeometry();
                break;
            case 'switch':
                this.createSwitchGeometry();
                break;
            case 'keycard':
                this.createKeycardGeometry();
                break;
            case 'decoration':
                this.createDecorationGeometry();
                break;
        }
    }
    
    /**
     * Create gate geometry (moveable fence section)
     */
    createGateGeometry() {
        const width = this.objectDef.width || 3.0;
        const height = this.objectDef.height || 2.0;
        const thickness = 0.2;
        
        const vertices = new Float32Array([
            // Front face
            -width/2, 0, thickness/2,
             width/2, 0, thickness/2,
             width/2, height, thickness/2,
            -width/2, height, thickness/2,
            
            // Back face
             width/2, 0, -thickness/2,
            -width/2, 0, -thickness/2,
            -width/2, height, -thickness/2,
             width/2, height, -thickness/2
        ]);
        
        const uvs = new Float32Array([
            // Front face
            0, 0,  1, 0,  1, 1,  0, 1,
            // Back face
            0, 0,  1, 0,  1, 1,  0, 1
        ]);
        
        const normals = new Float32Array([
            // Front face normals
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
            // Back face normals
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1
        ]);
        
        const indices = new Uint16Array([
            // Front face
            0, 1, 2,  0, 2, 3,
            // Back face
            4, 5, 6,  4, 6, 7
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
        
        // Set up collision
        this.collider = {
            type: 'box',
            bounds: {
                minX: -width/2, maxX: width/2,
                minY: 0, maxY: height,
                minZ: -thickness/2, maxZ: thickness/2
            },
            isStatic: true
        };
    }
    
    /**
     * Create switch geometry (stone pedestal with lever)
     */
    createSwitchGeometry() {
        const size = 0.5;
        const height = 1.0;
        
        // Simple box geometry for switch base
        const vertices = new Float32Array([
            // Base (stone pedestal)
            -size, 0, -size,  size, 0, -size,  size, height, -size,  -size, height, -size, // Front
             size, 0,  size, -size, 0,  size, -size, height,  size,   size, height,  size, // Back
            -size, 0, -size, -size, 0,  size, -size, height,  size,  -size, height, -size, // Left
             size, 0,  size,  size, 0, -size,  size, height, -size,   size, height,  size, // Right
            -size, height, -size, -size, height,  size,  size, height,  size,  size, height, -size, // Top
            -size, 0,  size, -size, 0, -size,  size, 0, -size,  size, 0,  size  // Bottom
        ]);
        
        const uvs = new Float32Array(Array(24).fill([0, 0, 1, 0, 1, 1, 0, 1]).flat());
        const normals = new Float32Array([
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Front
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // Back
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, // Left
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // Right
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // Top
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0  // Bottom
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,       // Front
            4, 5, 6, 4, 6, 7,       // Back
            8, 9, 10, 8, 10, 11,    // Left
            12, 13, 14, 12, 14, 15, // Right
            16, 17, 18, 16, 18, 19, // Top
            20, 21, 22, 20, 22, 23  // Bottom
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
        
        // Set up interaction collision
        this.collider = {
            type: 'box',
            bounds: {
                minX: -size, maxX: size,
                minY: 0, maxY: height,
                minZ: -size, maxZ: size
            },
            isStatic: true,
            trigger: true
        };
    }
    
    /**
     * Create keycard geometry (floating sprite)
     */
    createKeycardGeometry() {
        const size = 0.3;
        
        // Simple quad for keycard sprite
        const vertices = new Float32Array([
            -size, 0, 0,  size, 0, 0,  size, size*2, 0,  -size, size*2, 0
        ]);
        
        const uvs = new Float32Array([
            0, 0,  1, 0,  1, 1,  0, 1
        ]);
        
        const normals = new Float32Array([
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
        
        // Set up collection trigger
        this.collider = {
            type: 'sphere',
            radius: 1.0,
            isStatic: true,
            trigger: true
        };
    }
    
    /**
     * Create decoration geometry
     */
    createDecorationGeometry() {
        const { width, height, depth } = this.objectDef.dimensions || { width: 1, height: 1, depth: 1 };
        
        // Simple box for decorations
        this.createBoxGeometry(width, height, depth);
    }
    
    /**
     * Create box geometry helper
     */
    createBoxGeometry(width, height, depth) {
        const w = width * 0.5;
        const h = height;
        const d = depth * 0.5;
        
        const vertices = new Float32Array([
            // Front, Back, Left, Right, Top, Bottom faces
            -w, 0, d,  w, 0, d,  w, h, d,  -w, h, d,
             w, 0, -d, -w, 0, -d, -w, h, -d,  w, h, -d,
            -w, 0, -d, -w, 0, d, -w, h, d, -w, h, -d,
             w, 0, d,  w, 0, -d,  w, h, -d,  w, h, d,
            -w, h, d, -w, h, -d,  w, h, -d,  w, h, d,
            -w, 0, -d, -w, 0, d,  w, 0, d,  w, 0, -d
        ]);
        
        const uvs = new Float32Array(Array(24).fill([0, 0, 1, 0, 1, 1, 0, 1]).flat());
        
        const normals = new Float32Array([
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,       4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,    12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
        ]);
        
        this.createMesh(vertices, uvs, normals, indices);
    }
    
    /**
     * Create WebGL mesh
     */
    createMesh(vertices, uvs, normals, indices) {
        const gl = this.engine.gl;
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
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
     * Set up interaction system
     */
    setupInteraction() {
        // Register with collision system for interaction detection
        if (this.collider) {
            this.engine.collisionSystem.addCollider(this);
        }
    }
    
    /**
     * Handle player interaction
     */
    interact(player) {
        if (!this.interactive || this.animating) return false;
        
        switch (this.objectType) {
            case 'gate':
                return this.handleGateInteraction();
            case 'switch':
                return this.handleSwitchInteraction();
            case 'keycard':
                return this.handleKeycardInteraction();
            default:
                return false;
        }
    }
    
    /**
     * Handle gate interaction
     */
    handleGateInteraction() {
        if (this.isOpen) return false;
        
        // Check if player has required keycards/switches
        const levelManager = this.engine.levelManager;
        if (!levelManager.canProgress(this.name, this.objectDef.requirements)) {
            console.log(`Gate ${this.name} requires: ${JSON.stringify(this.objectDef.requirements)}`);
            return false;
        }
        
        this.openGate();
        return true;
    }
    
    /**
     * Handle switch interaction
     */
    handleSwitchInteraction() {
        if (this.activated) return false;
        
        this.activated = true;
        this.animateSwitch();
        
        // Notify level manager
        const levelManager = this.engine.levelManager;
        levelManager.activateSwitch(this.switchId);
        
        // Play sound effect
        this.engine.audioManager.playSound('switch_activate', this.position);
        
        console.log(`Switch activated: ${this.switchId}`);
        return true;
    }
    
    /**
     * Handle keycard interaction
     */
    handleKeycardInteraction() {
        if (this.collected) return false;
        
        this.collected = true;
        this.visible = false;
        
        // Notify level manager
        const levelManager = this.engine.levelManager;
        levelManager.addKeycard(this.keycardId);
        
        // Play sound effect
        this.engine.audioManager.playSound('keycard_pickup', this.position);
        
        console.log(`Keycard collected: ${this.keycardId}`);
        return true;
    }
    
    /**
     * Open gate animation
     */
    openGate() {
        this.isOpen = true;
        this.animating = true;
        this.animationTime = 0;
        
        // Play gate opening sound
        this.engine.audioManager.playSound('gate_open', this.position);
        
        console.log(`Gate opening: ${this.name}`);
    }
    
    /**
     * Animate switch activation
     */
    animateSwitch() {
        this.animating = true;
        this.animationTime = 0;
        
        // Simple color change or rotation animation
        // Implementation depends on shader capabilities
    }
    
    /**
     * Update object (animations, floating, etc.)
     */
    update(deltaTime) {
        if (!this.active) return;
        
        // Handle animations
        if (this.animating) {
            this.updateAnimation(deltaTime);
        }
        
        // Handle keycard floating animation
        if (this.objectType === 'keycard' && !this.collected) {
            this.updateFloatingAnimation(deltaTime);
        }
        
        // Check for player interaction
        if (this.interactive && !this.animating) {
            this.checkPlayerInteraction();
        }
    }
    
    /**
     * Update animations
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime / 1000;
        
        if (this.objectType === 'gate' && this.isOpen) {
            const progress = Math.min(this.animationTime / this.animationDuration, 1);
            const easeProgress = this.easeInOutCubic(progress);
            
            // Interpolate position
            for (let i = 0; i < 3; i++) {
                this.position[i] = this.closedPosition[i] + 
                    (this.openPosition[i] - this.closedPosition[i]) * easeProgress;
            }
            
            if (progress >= 1) {
                this.animating = false;
                // Remove collision when fully open
                this.collider = null;
            }
        }
    }
    
    /**
     * Update floating animation for keycards
     */
    updateFloatingAnimation(deltaTime) {
        this.floatOffset += deltaTime / 1000;
        const floatHeight = Math.sin(this.floatOffset * 2) * 0.2;
        this.position[1] = this.objectDef.position[1] + floatHeight;
        
        // Rotate keycard
        this.rotation[1] += deltaTime / 1000;
    }
    
    /**
     * Check if player is in interaction range
     */
    checkPlayerInteraction() {
        const playerPos = this.engine.camera.getPosition();
        const distance = this.getDistanceToPlayer(playerPos);
        
        if (distance <= this.interactionRange) {
            // Show interaction prompt (would need UI system)
            if (this.engine.inputManager.isKeyPressed('KeyE')) {
                this.interact();
            }
        }
    }
    
    /**
     * Get distance to player
     */
    getDistanceToPlayer(playerPos) {
        const dx = playerPos[0] - this.position[0];
        const dy = playerPos[1] - this.position[1];
        const dz = playerPos[2] - this.position[2];
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    /**
     * Easing function for smooth animations
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Render the environment object
     */
    render(renderer, camera) {
        if (!this.visible || !this.mesh) return;
        
        renderer.renderMesh(this.mesh, this.texture, this.getModelMatrix(), camera);
    }
}