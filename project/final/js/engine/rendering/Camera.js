/**
 * OneShot Predator Nukem - FPS Camera System
 * Handles first-person camera with mouse look and WASD movement
 */

export class Camera {
    constructor() {
        // Camera position and orientation
        this.position = new Float32Array([0, 1.8, 5]); // Eye level height
        this.rotation = new Float32Array([0, 0]); // Pitch, Yaw
        
        // Camera vectors
        this.forward = new Float32Array([0, 0, -1]);
        this.right = new Float32Array([1, 0, 0]);
        this.up = new Float32Array([0, 1, 0]);
        this.worldUp = new Float32Array([0, 1, 0]);
        
        // Projection settings
        this.fov = 75 * Math.PI / 180; // 75 degrees in radians
        this.aspectRatio = 16 / 9;
        this.nearPlane = 0.1;
        this.farPlane = 100.0;
        
        // Movement settings
        this.moveSpeed = 5.0; // units per second
        this.sprintMultiplier = 2.0;
        this.mouseSensitivity = 0.002;
        this.jumpSpeed = 8.0;
        this.gravity = -20.0;
        
        // Movement state
        this.velocity = new Float32Array([0, 0, 0]);
        this.isGrounded = true;
        this.isSprinting = false;
        
        // Matrices
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        
        // Constraints
        this.maxPitch = Math.PI / 2 - 0.1; // Prevent gimbal lock
        this.minPitch = -Math.PI / 2 + 0.1;
        
        this.updateVectors();
        this.updateProjectionMatrix();
    }
    
    update(deltaTime) {
        // Apply gravity if not grounded
        if (!this.isGrounded) {
            this.velocity[1] += this.gravity * deltaTime / 1000;
        }
        
        // Update position based on velocity
        for (let i = 0; i < 3; i++) {
            this.position[i] += this.velocity[i] * deltaTime / 1000;
        }
        
        // Simple ground collision (y = 1.8 is eye level)
        if (this.position[1] <= 1.8) {
            this.position[1] = 1.8;
            this.velocity[1] = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        this.updateViewMatrix();
    }
    
    // Movement methods
    moveForward(deltaTime) {
        const speed = this.getMoveSpeed() * deltaTime / 1000;
        this.position[0] += this.forward[0] * speed;
        this.position[2] += this.forward[2] * speed;
    }
    
    moveBackward(deltaTime) {
        const speed = this.getMoveSpeed() * deltaTime / 1000;
        this.position[0] -= this.forward[0] * speed;
        this.position[2] -= this.forward[2] * speed;
    }
    
    moveRight(deltaTime) {
        const speed = this.getMoveSpeed() * deltaTime / 1000;
        this.position[0] += this.right[0] * speed;
        this.position[2] += this.right[2] * speed;
    }
    
    moveLeft(deltaTime) {
        const speed = this.getMoveSpeed() * deltaTime / 1000;
        this.position[0] -= this.right[0] * speed;
        this.position[2] -= this.right[2] * speed;
    }
    
    jump() {
        if (this.isGrounded) {
            this.velocity[1] = this.jumpSpeed;
            this.isGrounded = false;
        }
    }
    
    setSprint(sprinting) {
        this.isSprinting = sprinting;
    }
    
    getMoveSpeed() {
        return this.moveSpeed * (this.isSprinting ? this.sprintMultiplier : 1.0);
    }
    
    // Mouse look
    rotate(deltaX, deltaY) {
        this.rotation[1] += deltaX * this.mouseSensitivity; // Yaw
        this.rotation[0] += deltaY * this.mouseSensitivity; // Pitch
        
        // Constrain pitch to prevent flipping
        this.rotation[0] = Math.max(this.minPitch, Math.min(this.maxPitch, this.rotation[0]));
        
        this.updateVectors();
    }
    
    updateVectors() {
        // Calculate forward vector from pitch and yaw
        const pitch = this.rotation[0];
        const yaw = this.rotation[1];
        
        this.forward[0] = Math.cos(pitch) * Math.sin(yaw);
        this.forward[1] = Math.sin(pitch);
        this.forward[2] = Math.cos(pitch) * Math.cos(yaw);
        
        // Normalize forward vector
        this.normalize(this.forward);
        
        // Calculate right vector (cross product of forward and world up)
        this.cross(this.forward, this.worldUp, this.right);
        this.normalize(this.right);
        
        // Calculate up vector (cross product of right and forward)
        this.cross(this.right, this.forward, this.up);
        this.normalize(this.up);
    }
    
    updateViewMatrix() {
        // Create look-at matrix
        const target = new Float32Array(3);
        target[0] = this.position[0] + this.forward[0];
        target[1] = this.position[1] + this.forward[1];
        target[2] = this.position[2] + this.forward[2];
        
        this.lookAt(this.position, target, this.up, this.viewMatrix);
    }
    
    updateProjectionMatrix() {
        this.perspective(this.fov, this.aspectRatio, this.nearPlane, this.farPlane, this.projectionMatrix);
    }
    
    // Matrix operations
    lookAt(eye, center, up, out) {
        const f = new Float32Array(3);
        const s = new Float32Array(3);
        const u = new Float32Array(3);
        
        // f = normalize(center - eye)
        f[0] = center[0] - eye[0];
        f[1] = center[1] - eye[1];
        f[2] = center[2] - eye[2];
        this.normalize(f);
        
        // s = normalize(cross(f, up))
        this.cross(f, up, s);
        this.normalize(s);
        
        // u = cross(s, f)
        this.cross(s, f, u);
        
        out[0] = s[0];
        out[1] = u[0];
        out[2] = -f[0];
        out[3] = 0;
        out[4] = s[1];
        out[5] = u[1];
        out[6] = -f[1];
        out[7] = 0;
        out[8] = s[2];
        out[9] = u[2];
        out[10] = -f[2];
        out[11] = 0;
        out[12] = -this.dot(s, eye);
        out[13] = -this.dot(u, eye);
        out[14] = this.dot(f, eye);
        out[15] = 1;
    }
    
    perspective(fovy, aspect, near, far, out) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = 2 * far * near * nf;
        out[15] = 0;
    }
    
    // Vector operations
    normalize(v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (length > 0) {
            v[0] /= length;
            v[1] /= length;
            v[2] /= length;
        }
    }
    
    cross(a, b, out) {
        out[0] = a[1] * b[2] - a[2] * b[1];
        out[1] = a[2] * b[0] - a[0] * b[2];
        out[2] = a[0] * b[1] - a[1] * b[0];
    }
    
    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    
    // Getters
    getPosition() {
        return this.position;
    }
    
    getForwardVector() {
        return this.forward;
    }
    
    getRightVector() {
        return this.right;
    }
    
    getUpVector() {
        return this.up;
    }
    
    getViewMatrix(out = null) {
        if (out) {
            for (let i = 0; i < 16; i++) {
                out[i] = this.viewMatrix[i];
            }
            return out;
        }
        return this.viewMatrix;
    }
    
    getProjectionMatrix(out = null) {
        if (out) {
            for (let i = 0; i < 16; i++) {
                out[i] = this.projectionMatrix[i];
            }
            return out;
        }
        return this.projectionMatrix;
    }
    
    // Setters
    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
    }
    
    setRotation(pitch, yaw) {
        this.rotation[0] = pitch;
        this.rotation[1] = yaw;
        this.updateVectors();
    }
    
    setAspectRatio(ratio) {
        this.aspectRatio = ratio;
        this.updateProjectionMatrix();
    }
    
    setFOV(fov) {
        this.fov = fov * Math.PI / 180;
        this.updateProjectionMatrix();
    }
    
    // Utility methods
    getDistanceTo(position) {
        const dx = this.position[0] - position[0];
        const dy = this.position[1] - position[1];
        const dz = this.position[2] - position[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    isPointInView(position, radius = 0) {
        // Simple frustum culling check
        const toPoint = new Float32Array(3);
        toPoint[0] = position[0] - this.position[0];
        toPoint[1] = position[1] - this.position[1];
        toPoint[2] = position[2] - this.position[2];
        
        // Check if point is in front of camera
        const forwardDot = this.dot(toPoint, this.forward);
        if (forwardDot < this.nearPlane - radius) return false;
        if (forwardDot > this.farPlane + radius) return false;
        
        // Simple angular check (could be improved with proper frustum planes)
        this.normalize(toPoint);
        const angle = Math.acos(this.dot(toPoint, this.forward));
        return angle < this.fov / 2 + radius;
    }
}