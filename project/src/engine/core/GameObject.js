/**
 * OneShot Predator Nukem - GameObject Base Class
 * Base class for all game objects in the world
 */

import { MathUtils } from '../utils/MathUtils.js';

export class GameObject {
    constructor(name = 'GameObject') {
        this.name = name;
        this.id = GameObject.generateId();
        
        // Transform
        this.position = new Float32Array([0, 0, 0]);
        this.rotation = new Float32Array([0, 0, 0]); // Euler angles (pitch, yaw, roll)
        this.scale = new Float32Array([1, 1, 1]);
        
        // Rendering
        this.mesh = null;
        this.texture = null;
        this.visible = true;
        
        // Physics
        this.isStatic = false;
        this.velocity = new Float32Array([0, 0, 0]);
        this.acceleration = new Float32Array([0, 0, 0]);
        
        // Collision
        this.collider = null;
        
        // State
        this.active = true;
        this.destroyed = false;
        
        // Cached matrices
        this.modelMatrix = new Float32Array(16);
        this.modelMatrixDirty = true;
        
        // Components
        this.components = new Map();
        
        // Children
        this.children = [];
        this.parent = null;
    }
    
    static idCounter = 0;
    static generateId() {
        return ++GameObject.idCounter;
    }
    
    // Transform methods
    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        this.modelMatrixDirty = true;
    }
    
    getPosition() {
        return this.position;
    }
    
    translate(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
        this.modelMatrixDirty = true;
    }
    
    setRotation(pitch, yaw, roll = 0) {
        this.rotation[0] = pitch;
        this.rotation[1] = yaw;
        this.rotation[2] = roll;
        this.modelMatrixDirty = true;
    }
    
    getRotation() {
        return this.rotation;
    }
    
    rotate(pitch, yaw, roll = 0) {
        this.rotation[0] += pitch;
        this.rotation[1] += yaw;
        this.rotation[2] += roll;
        this.modelMatrixDirty = true;
    }
    
    setScale(x, y = x, z = x) {
        this.scale[0] = x;
        this.scale[1] = y;
        this.scale[2] = z;
        this.modelMatrixDirty = true;
    }
    
    getScale() {
        return this.scale;
    }
    
    // Matrix operations
    getModelMatrix(out = null) {
        if (this.modelMatrixDirty) {
            this.updateModelMatrix();
        }
        
        if (out) {
            for (let i = 0; i < 16; i++) {
                out[i] = this.modelMatrix[i];
            }
            return out;
        }
        
        return this.modelMatrix;
    }
    
    updateModelMatrix() {
        // Create transformation matrix: T * R * S
        MathUtils.mat4Identity(this.modelMatrix);
        
        // Apply translation
        MathUtils.mat4Translate(this.modelMatrix, this.modelMatrix, this.position);
        
        // Apply rotation (Y, X, Z order)
        if (this.rotation[1] !== 0) {
            MathUtils.mat4RotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
        }
        
        // Apply scale
        if (this.scale[0] !== 1 || this.scale[1] !== 1 || this.scale[2] !== 1) {
            MathUtils.mat4Scale(this.modelMatrix, this.modelMatrix, this.scale);
        }
        
        this.modelMatrixDirty = false;
    }
    
    // Forward vector (for movement)
    getForward() {
        const forward = new Float32Array(3);
        const yaw = this.rotation[1];
        forward[0] = Math.sin(yaw);
        forward[1] = 0;
        forward[2] = Math.cos(yaw);
        return forward;
    }
    
    getRight() {
        const right = new Float32Array(3);
        const yaw = this.rotation[1];
        right[0] = Math.cos(yaw);
        right[1] = 0;
        right[2] = -Math.sin(yaw);
        return right;
    }
    
    // Distance calculations
    getDistanceTo(other) {
        if (other.position) {
            return MathUtils.vec3Distance(this.position, other.position);
        }
        return MathUtils.vec3Distance(this.position, other);
    }
    
    getDistanceSquaredTo(other) {
        if (other.position) {
            return MathUtils.vec3DistanceSquared(this.position, other.position);
        }
        return MathUtils.vec3DistanceSquared(this.position, other);
    }
    
    // Look at target
    lookAt(target) {
        const targetPos = target.position || target;
        const dx = targetPos[0] - this.position[0];
        const dz = targetPos[2] - this.position[2];
        
        this.rotation[1] = Math.atan2(dx, dz);
        this.modelMatrixDirty = true;
    }
    
    // Component system
    addComponent(component) {
        const componentName = component.constructor.name;
        this.components.set(componentName, component);
        component.gameObject = this;
        
        if (component.onAttach) {
            component.onAttach();
        }
    }
    
    getComponent(componentClass) {
        const componentName = componentClass.name;
        return this.components.get(componentName);
    }
    
    hasComponent(componentClass) {
        const componentName = componentClass.name;
        return this.components.has(componentName);
    }
    
    removeComponent(componentClass) {
        const componentName = componentClass.name;
        const component = this.components.get(componentName);
        
        if (component) {
            if (component.onDetach) {
                component.onDetach();
            }
            this.components.delete(componentName);
        }
    }
    
    // Hierarchy
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        child.parent = this;
        this.children.push(child);
    }
    
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }
    
    // Lifecycle methods
    update(deltaTime) {
        if (!this.active || this.destroyed) return;
        
        // Update physics
        if (!this.isStatic) {
            this.updatePhysics(deltaTime);
        }
        
        // Update components
        for (const component of this.components.values()) {
            if (component.update) {
                component.update(deltaTime);
            }
        }
        
        // Update children
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }
    
    updatePhysics(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Apply acceleration to velocity
        this.velocity[0] += this.acceleration[0] * dt;
        this.velocity[1] += this.acceleration[1] * dt;
        this.velocity[2] += this.acceleration[2] * dt;
        
        // Apply velocity to position
        this.position[0] += this.velocity[0] * dt;
        this.position[1] += this.velocity[1] * dt;
        this.position[2] += this.velocity[2] * dt;
        
        this.modelMatrixDirty = true;
    }
    
    // Rendering
    setMesh(mesh) {
        this.mesh = mesh;
    }
    
    setTexture(texture) {
        this.texture = texture;
    }
    
    // Collision
    setCollider(collider) {
        this.collider = collider;
        if (collider) {
            collider.gameObject = this;
        }
    }
    
    // State management
    setActive(active) {
        this.active = active;
    }
    
    isActive() {
        return this.active && !this.destroyed;
    }
    
    destroy() {
        this.destroyed = true;
        
        // Destroy components
        for (const component of this.components.values()) {
            if (component.onDestroy) {
                component.onDestroy();
            }
        }
        this.components.clear();
        
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Destroy children
        for (const child of this.children) {
            child.destroy();
        }
        this.children.length = 0;
    }
    
    // Utility methods
    clone() {
        const clone = new GameObject(this.name + '_clone');
        
        // Copy transform
        MathUtils.vec3Copy(clone.position, this.position);
        MathUtils.vec3Copy(clone.rotation, this.rotation);
        MathUtils.vec3Copy(clone.scale, this.scale);
        
        // Copy properties
        clone.mesh = this.mesh;
        clone.texture = this.texture;
        clone.visible = this.visible;
        clone.isStatic = this.isStatic;
        
        return clone;
    }
    
    toString() {
        return `GameObject(${this.name}, id: ${this.id}, pos: [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)}])`;
    }
}

// Specialized GameObject classes
export class StaticObject extends GameObject {
    constructor(name = 'StaticObject') {
        super(name);
        this.isStatic = true;
    }
}

export class DynamicObject extends GameObject {
    constructor(name = 'DynamicObject') {
        super(name);
        this.isStatic = false;
    }
}

// Component base class
export class Component {
    constructor() {
        this.gameObject = null;
    }
    
    onAttach() {
        // Override in derived classes
    }
    
    onDetach() {
        // Override in derived classes
    }
    
    update(deltaTime) {
        // Override in derived classes
    }
    
    onDestroy() {
        // Override in derived classes
    }
}