/**
 * OneShot Predator Nukem - Math Utilities
 * Common mathematical operations for 3D graphics and game logic
 */

export class MathUtils {
    // Constants
    static PI = Math.PI;
    static TWO_PI = Math.PI * 2;
    static HALF_PI = Math.PI / 2;
    static DEG_TO_RAD = Math.PI / 180;
    static RAD_TO_DEG = 180 / Math.PI;
    static EPSILON = 1e-6;
    
    // Vector operations
    static vec3Create(x = 0, y = 0, z = 0) {
        return new Float32Array([x, y, z]);
    }
    
    static vec3Copy(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        return out;
    }
    
    static vec3Add(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
    }
    
    static vec3Subtract(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    }
    
    static vec3Scale(out, a, scale) {
        out[0] = a[0] * scale;
        out[1] = a[1] * scale;
        out[2] = a[2] * scale;
        return out;
    }
    
    static vec3Normalize(out, a) {
        const length = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
        if (length > this.EPSILON) {
            const invLength = 1.0 / length;
            out[0] = a[0] * invLength;
            out[1] = a[1] * invLength;
            out[2] = a[2] * invLength;
        } else {
            out[0] = out[1] = out[2] = 0;
        }
        return out;
    }
    
    static vec3Length(a) {
        return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    }
    
    static vec3LengthSquared(a) {
        return a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    }
    
    static vec3Distance(a, b) {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    static vec3DistanceSquared(a, b) {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        return dx * dx + dy * dy + dz * dz;
    }
    
    static vec3Dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    
    static vec3Cross(out, a, b) {
        out[0] = a[1] * b[2] - a[2] * b[1];
        out[1] = a[2] * b[0] - a[0] * b[2];
        out[2] = a[0] * b[1] - a[1] * b[0];
        return out;
    }
    
    static vec3Lerp(out, a, b, t) {
        out[0] = a[0] + t * (b[0] - a[0]);
        out[1] = a[1] + t * (b[1] - a[1]);
        out[2] = a[2] + t * (b[2] - a[2]);
        return out;
    }
    
    // Matrix operations
    static mat4Create() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
    
    static mat4Identity(out) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    }
    
    static mat4Copy(out, a) {
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        return out;
    }
    
    static mat4Multiply(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        
        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
        
        out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        
        out[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
        out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
        out[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
        out[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
        
        out[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
        out[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
        out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
        out[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
        
        out[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
        out[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
        out[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
        out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
        
        return out;
    }
    
    static mat4Translate(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
            const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
            const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
            
            out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
            out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
            out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
            
            out[12] = a00 * x + a10 * y + a20 * z + a[12];
            out[13] = a01 * x + a11 * y + a21 * z + a[13];
            out[14] = a02 * x + a12 * y + a22 * z + a[14];
            out[15] = a03 * x + a13 * y + a23 * z + a[15];
        }
        
        return out;
    }
    
    static mat4Scale(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        
        return out;
    }
    
    static mat4RotateY(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        if (a !== out) {
            out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
            out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        }
        
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        
        return out;
    }
    
    // Utility functions
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    static lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    static smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    }
    
    static degToRad(degrees) {
        return degrees * this.DEG_TO_RAD;
    }
    
    static radToDeg(radians) {
        return radians * this.RAD_TO_DEG;
    }
    
    static isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }
    
    static nextPowerOf2(value) {
        value--;
        value |= value >> 1;
        value |= value >> 2;
        value |= value >> 4;
        value |= value >> 8;
        value |= value >> 16;
        return value + 1;
    }
    
    static random(min = 0, max = 1) {
        return min + Math.random() * (max - min);
    }
    
    static randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    }
    
    // Game-specific utilities
    static wrapAngle(angle) {
        while (angle > Math.PI) angle -= this.TWO_PI;
        while (angle < -Math.PI) angle += this.TWO_PI;
        return angle;
    }
    
    static angleDifference(a, b) {
        return this.wrapAngle(b - a);
    }
    
    static moveTowards(current, target, maxDelta) {
        const delta = target - current;
        if (Math.abs(delta) <= maxDelta) {
            return target;
        }
        return current + Math.sign(delta) * maxDelta;
    }
    
    static moveTowardsAngle(current, target, maxDelta) {
        const delta = this.angleDifference(current, target);
        if (Math.abs(delta) <= maxDelta) {
            return target;
        }
        return current + Math.sign(delta) * maxDelta;
    }
    
    // Easing functions for animations
    static easeInQuad(t) {
        return t * t;
    }
    
    static easeOutQuad(t) {
        return t * (2 - t);
    }
    
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeInCubic(t) {
        return t * t * t;
    }
    
    static easeOutCubic(t) {
        return (--t) * t * t + 1;
    }
    
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}