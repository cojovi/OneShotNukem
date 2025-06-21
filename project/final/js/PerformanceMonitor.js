
    /**
     * Performance Monitor - Tracks FPS and performance metrics
     */
    class PerformanceMonitor {
        constructor() {
            this.frameCount = 0;
            this.lastTime = performance.now();
            this.fps = 60;
            this.frameTime = 0;
            this.maxFrameTime = 0;
            this.minFrameTime = Infinity;
            this.averageFrameTime = 0;
            this.frameTimes = [];
            this.maxSamples = 60;
        }
        
        update() {
            const now = performance.now();
            this.frameTime = now - this.lastTime;
            this.lastTime = now;
            
            // Track frame times
            this.frameTimes.push(this.frameTime);
            if (this.frameTimes.length > this.maxSamples) {
                this.frameTimes.shift();
            }
            
            // Update statistics
            this.maxFrameTime = Math.max(this.maxFrameTime, this.frameTime);
            this.minFrameTime = Math.min(this.minFrameTime, this.frameTime);
            this.averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            
            this.frameCount++;
            
            // Calculate FPS every second
            if (this.frameCount % 60 === 0) {
                this.fps = Math.round(1000 / this.averageFrameTime);
                
                // Warn if performance is poor
                if (this.fps < 50) {
                    console.warn(`Performance warning: FPS dropped to ${this.fps}`);
                }
                
                // Log performance stats in debug mode
                if (window.DEBUG_PERFORMANCE) {
                    console.log(`FPS: ${this.fps}, Avg Frame Time: ${this.averageFrameTime.toFixed(2)}ms`);
                }
            }
        }
        
        getStats() {
            return {
                fps: this.fps,
                frameTime: this.frameTime,
                averageFrameTime: this.averageFrameTime,
                maxFrameTime: this.maxFrameTime,
                minFrameTime: this.minFrameTime
            };
        }
        
        reset() {
            this.frameCount = 0;
            this.maxFrameTime = 0;
            this.minFrameTime = Infinity;
            this.frameTimes = [];
        }
    }
    
    // Export for use in main game
    window.PerformanceMonitor = PerformanceMonitor;
        