
    /**
     * Asset Preloader - Efficiently loads and caches game assets
     */
    class AssetPreloader {
        constructor() {
            this.cache = new Map();
            this.loadingPromises = new Map();
            this.totalAssets = 0;
            this.loadedAssets = 0;
        }
        
        async preloadImage(url) {
            if (this.cache.has(url)) {
                return this.cache.get(url);
            }
            
            if (this.loadingPromises.has(url)) {
                return this.loadingPromises.get(url);
            }
            
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.cache.set(url, img);
                    this.loadedAssets++;
                    resolve(img);
                };
                img.onerror = reject;
                img.src = url;
            });
            
            this.loadingPromises.set(url, promise);
            this.totalAssets++;
            
            return promise;
        }
        
        async preloadAudio(url) {
            if (this.cache.has(url)) {
                return this.cache.get(url);
            }
            
            const promise = new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    this.cache.set(url, audio);
                    this.loadedAssets++;
                    resolve(audio);
                };
                audio.onerror = reject;
                audio.src = url;
            });
            
            this.loadingPromises.set(url, promise);
            this.totalAssets++;
            
            return promise;
        }
        
        getProgress() {
            return this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 0;
        }
        
        get(url) {
            return this.cache.get(url);
        }
    }
    
    window.AssetPreloader = AssetPreloader;
        