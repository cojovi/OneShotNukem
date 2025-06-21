/**
 * OneShot Predator Nukem - Input Manager
 * Handles keyboard and mouse input for FPS controls
 */

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.camera = null;
        
        // Input state
        this.keys = new Set();
        this.mouseButtons = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.mouseWheelDelta = 0;
        
        // Pointer lock state
        this.pointerLocked = false;
        this.pointerLockRequested = false;
        
        // Input settings
        this.mouseSensitivity = 1.0;
        this.invertY = false;
        
        // Key mappings
        this.keyMap = {
            // Movement
            'KeyW': 'forward',
            'KeyS': 'backward',
            'KeyA': 'left',
            'KeyD': 'right',
            'Space': 'jump',
            'ShiftLeft': 'sprint',
            'ShiftRight': 'sprint',
            
            // Actions
            'Mouse0': 'fire',
            'Mouse2': 'aim',
            'KeyR': 'reload',
            'KeyE': 'interact',
            'KeyF': 'flashlight',
            
            // UI
            'Escape': 'menu',
            'Tab': 'scoreboard',
            'KeyM': 'map'
        };
        
        // Action states
        this.actions = new Map();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        
        // Focus events
        window.addEventListener('blur', () => this.onWindowBlur());
        window.addEventListener('focus', () => this.onWindowFocus());
        
        // Canvas click to request pointer lock
        this.canvas.addEventListener('click', () => this.requestPointerLock());
    }
    
    // Event handlers
    onKeyDown(event) {
        if (event.repeat) return;
        
        this.keys.add(event.code);
        
        const action = this.keyMap[event.code];
        if (action) {
            this.setAction(action, true);
            
            // Prevent default for game keys
            if (this.pointerLocked) {
                event.preventDefault();
            }
        }
        
        // Handle special keys
        if (event.code === 'Escape' && this.pointerLocked) {
            this.exitPointerLock();
        }
    }
    
    onKeyUp(event) {
        this.keys.delete(event.code);
        
        const action = this.keyMap[event.code];
        if (action) {
            this.setAction(action, false);
        }
    }
    
    onMouseDown(event) {
        const button = `Mouse${event.button}`;
        this.mouseButtons.add(button);
        
        const action = this.keyMap[button];
        if (action) {
            this.setAction(action, true);
        }
        
        if (this.pointerLocked) {
            event.preventDefault();
        }
    }
    
    onMouseUp(event) {
        const button = `Mouse${event.button}`;
        this.mouseButtons.delete(button);
        
        const action = this.keyMap[button];
        if (action) {
            this.setAction(action, false);
        }
    }
    
    onMouseMove(event) {
        if (this.pointerLocked) {
            // Use movement deltas when pointer is locked
            this.mouseDelta.x = event.movementX || 0;
            this.mouseDelta.y = event.movementY || 0;
        } else {
            // Track absolute position when not locked
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
        }
    }
    
    onMouseWheel(event) {
        this.mouseWheelDelta = event.deltaY;
        
        if (this.pointerLocked) {
            event.preventDefault();
        }
    }
    
    onPointerLockChange() {
        this.pointerLocked = document.pointerLockElement === this.canvas;
        
        if (this.pointerLocked) {
            console.log('Pointer lock acquired');
        } else {
            console.log('Pointer lock released');
            this.clearInput();
        }
    }
    
    onPointerLockError() {
        console.error('Pointer lock failed');
        this.pointerLockRequested = false;
    }
    
    onWindowBlur() {
        // Clear all input when window loses focus
        this.clearInput();
    }
    
    onWindowFocus() {
        // Clear input state when window regains focus
        this.clearInput();
    }
    
    // Pointer lock management
    requestPointerLock() {
        if (!this.pointerLocked && !this.pointerLockRequested) {
            this.pointerLockRequested = true;
            this.canvas.requestPointerLock();
        }
    }
    
    exitPointerLock() {
        if (this.pointerLocked) {
            document.exitPointerLock();
        }
    }
    
    // Input state management
    setAction(action, active) {
        this.actions.set(action, active);
    }
    
    getAction(action) {
        return this.actions.get(action) || false;
    }
    
    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }
    
    isMouseButtonPressed(button) {
        return this.mouseButtons.has(`Mouse${button}`);
    }
    
    clearInput() {
        this.keys.clear();
        this.mouseButtons.clear();
        this.actions.clear();
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.mouseWheelDelta = 0;
    }
    
    // Camera integration
    setCamera(camera) {
        this.camera = camera;
    }
    
    update(deltaTime) {
        if (!this.camera) return;
        
        // Handle mouse look
        if (this.pointerLocked && (this.mouseDelta.x !== 0 || this.mouseDelta.y !== 0)) {
            const deltaX = this.mouseDelta.x * this.mouseSensitivity;
            const deltaY = this.mouseDelta.y * this.mouseSensitivity * (this.invertY ? -1 : 1);
            
            this.camera.rotate(deltaX, deltaY);
            
            // Reset mouse delta
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
        
        // Handle movement
        if (this.getAction('forward')) {
            this.camera.moveForward(deltaTime);
        }
        if (this.getAction('backward')) {
            this.camera.moveBackward(deltaTime);
        }
        if (this.getAction('left')) {
            this.camera.moveLeft(deltaTime);
        }
        if (this.getAction('right')) {
            this.camera.moveRight(deltaTime);
        }
        if (this.getAction('jump')) {
            this.camera.jump();
        }
        
        // Handle sprint
        this.camera.setSprint(this.getAction('sprint'));
        
        // Reset wheel delta
        this.mouseWheelDelta = 0;
    }
    
    // Configuration
    setMouseSensitivity(sensitivity) {
        this.mouseSensitivity = sensitivity;
    }
    
    setInvertY(invert) {
        this.invertY = invert;
    }
    
    // Key binding
    bindKey(keyCode, action) {
        this.keyMap[keyCode] = action;
    }
    
    unbindKey(keyCode) {
        delete this.keyMap[keyCode];
    }
    
    // Utility methods
    getMousePosition() {
        return { ...this.mousePosition };
    }
    
    getMouseDelta() {
        return { ...this.mouseDelta };
    }
    
    getMouseWheelDelta() {
        return this.mouseWheelDelta;
    }
    
    isPointerLocked() {
        return this.pointerLocked;
    }
    
    // Input state queries for UI
    getInputState() {
        return {
            pointerLocked: this.pointerLocked,
            activeKeys: Array.from(this.keys),
            activeMouseButtons: Array.from(this.mouseButtons),
            activeActions: Array.from(this.actions.entries()).filter(([_, active]) => active).map(([action, _]) => action)
        };
    }
    
    // Cleanup
    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('wheel', this.onMouseWheel);
        this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('pointerlockerror', this.onPointerLockError);
        window.removeEventListener('blur', this.onWindowBlur);
        window.removeEventListener('focus', this.onWindowFocus);
        this.canvas.removeEventListener('click', this.requestPointerLock);
        
        // Exit pointer lock if active
        if (this.pointerLocked) {
            this.exitPointerLock();
        }
        
        // Clear state
        this.clearInput();
    }
}