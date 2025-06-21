/**
 * OneShot Predator Nukem - Texture Manager
 * Handles WebGL texture loading, caching, and management
 */

export class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
        this.loadingTextures = new Map();
        this.defaultTexture = null;
        
        this.createDefaultTexture();
    }
    
    createDefaultTexture() {
        // Create a 1x1 white texture as fallback
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        const pixel = new Uint8Array([255, 255, 255, 255]);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel
        );
        
        this.defaultTexture = texture;
        this.textures.set('default', texture);
    }
    
    async loadTexture(name, url) {
        // Check if texture is already loaded
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }
        
        // Check if texture is currently loading
        if (this.loadingTextures.has(name)) {
            return await this.loadingTextures.get(name);
        }
        
        // Start loading the texture
        const loadPromise = this.loadTextureFromUrl(name, url);
        this.loadingTextures.set(name, loadPromise);
        
        try {
            const texture = await loadPromise;
            this.loadingTextures.delete(name);
            return texture;
        } catch (error) {
            this.loadingTextures.delete(name);
            console.error(`Failed to load texture ${name}:`, error);
            return this.defaultTexture;
        }
    }
    
    loadTextureFromUrl(name, url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            
            image.onload = () => {
                try {
                    const texture = this.createTextureFromImage(image);
                    this.textures.set(name, texture);
                    console.log(`Texture '${name}' loaded successfully`);
                    resolve(texture);
                } catch (error) {
                    reject(error);
                }
            };
            
            image.onerror = () => {
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            // Set CORS if needed
            image.crossOrigin = 'anonymous';
            image.src = url;
        });
    }
    
    createTextureFromImage(image) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // Upload the image data
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, image
        );
        
        // Set texture parameters for retro pixelated look
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        
        // Generate mipmaps if power of 2
        if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
        }
        
        return texture;
    }
    
    createTextureFromCanvas(name, canvas) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas
        );
        
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        
        this.textures.set(name, texture);
        return texture;
    }
    
    createTextureFromData(name, width, height, data, format = this.gl.RGBA) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, format, width, height, 0,
            format, this.gl.UNSIGNED_BYTE, data
        );
        
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        
        this.textures.set(name, texture);
        return texture;
    }
    
    getTexture(name) {
        return this.textures.get(name) || this.defaultTexture;
    }
    
    hasTexture(name) {
        return this.textures.has(name);
    }
    
    deleteTexture(name) {
        const texture = this.textures.get(name);
        if (texture && texture !== this.defaultTexture) {
            this.gl.deleteTexture(texture);
            this.textures.delete(name);
        }
    }
    
    bindTexture(name, unit = 0) {
        const texture = this.getTexture(name);
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        return texture;
    }
    
    // Utility methods
    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }
    
    // Create texture atlas for sprites (optimization)
    async createSpriteAtlas(sprites) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate atlas size (simple grid layout)
        const spriteSize = 64; // Based on asset inventory
        const cols = Math.ceil(Math.sqrt(sprites.length));
        const rows = Math.ceil(sprites.length / cols);
        
        canvas.width = cols * spriteSize;
        canvas.height = rows * spriteSize;
        
        const atlasData = {
            texture: null,
            sprites: new Map()
        };
        
        let loadedCount = 0;
        const totalSprites = sprites.length;
        
        return new Promise((resolve, reject) => {
            sprites.forEach((spriteName, index) => {
                const img = new Image();
                img.onload = () => {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const x = col * spriteSize;
                    const y = row * spriteSize;
                    
                    ctx.drawImage(img, x, y, spriteSize, spriteSize);
                    
                    // Store UV coordinates
                    atlasData.sprites.set(spriteName, {
                        u: x / canvas.width,
                        v: y / canvas.height,
                        width: spriteSize / canvas.width,
                        height: spriteSize / canvas.height
                    });
                    
                    loadedCount++;
                    if (loadedCount === totalSprites) {
                        atlasData.texture = this.createTextureFromCanvas('spriteAtlas', canvas);
                        resolve(atlasData);
                    }
                };
                
                img.onerror = () => reject(new Error(`Failed to load sprite: ${spriteName}`));
                img.src = `./assets/sprites/${spriteName}.png`;
            });
        });
    }
    
    cleanup() {
        for (const [name, texture] of this.textures) {
            if (texture !== this.defaultTexture) {
                this.gl.deleteTexture(texture);
            }
        }
        this.textures.clear();
        this.loadingTextures.clear();
        
        if (this.defaultTexture) {
            this.gl.deleteTexture(this.defaultTexture);
            this.defaultTexture = null;
        }
    }
    
    getStats() {
        return {
            loadedTextures: this.textures.size,
            loadingTextures: this.loadingTextures.size
        };
    }
}