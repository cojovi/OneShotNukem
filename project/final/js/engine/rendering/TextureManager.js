/**
 * OneShot Predator Nukem - Texture Manager
 * Handles loading and managing WebGL textures
 */

export class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
        this.defaultTexture = null;
    }

    async initialize() {
        this.createDefaultTexture();
        console.log('TextureManager initialized');
    }

    createDefaultTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Create a 1x1 magenta pixel
        const pixel = new Uint8Array([255, 0, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        this.defaultTexture = texture;
        this.textures.set('default', texture);
    }

    async loadTexture(name, url) {
        try {
            const image = await this.loadImage(url);
            const texture = this.createTextureFromImage(image);
            this.textures.set(name, texture);
            console.log(`Texture '${name}' loaded from ${url}`);
            return texture;
        } catch (error) {
            console.error(`Failed to load texture '${name}' from ${url}:`, error);
            return this.defaultTexture;
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = url;
            image.onload = () => resolve(image);
            image.onerror = (e) => reject(`Failed to load image at ${url}`);
        });
    }

    createTextureFromImage(image) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        }

        return texture;
    }

    getTexture(name) {
        return this.textures.get(name) || this.defaultTexture;
    }
    
    bindTexture(name, unit = 0) {
        const texture = this.getTexture(name);
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    }
    
    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    cleanup() {
        for (const texture of this.textures.values()) {
            this.gl.deleteTexture(texture);
        }
        this.textures.clear();
    }
}