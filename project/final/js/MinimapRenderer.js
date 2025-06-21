/**
 * OneShot Predator Nukem - Minimap Renderer
 * Renders a simple top-down minimap showing player position and enemies
 */

export class MinimapRenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;
        this.scale = 0.1; // Scale factor for world to minimap coordinates
        this.mapSize = 120; // Size of the minimap in pixels
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        this.canvas.width = this.mapSize;
        this.canvas.height = this.mapSize;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    render() {
        // Clear the minimap
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.mapSize, this.mapSize);
        
        // Draw border
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.mapSize - 2, this.mapSize - 2);
        
        // Get player position
        const playerPos = this.engine.camera.getPosition();
        const playerMapX = this.mapSize / 2;
        const playerMapY = this.mapSize / 2;
        
        // Draw level boundaries (simple rectangle)
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, this.mapSize - 20, this.mapSize - 20);
        
        // Draw enemies
        this.drawEnemies(playerPos, playerMapX, playerMapY);
        
        // Draw player
        this.drawPlayer(playerMapX, playerMapY);
        
        // Draw player direction indicator
        this.drawPlayerDirection(playerMapX, playerMapY);
    }
    
    drawEnemies(playerPos, playerMapX, playerMapY) {
        // Get enemies from combat manager
        if (this.engine.combatManager && this.engine.combatManager.enemyManager) {
            const enemies = this.engine.gameObjects.filter(obj => 
                obj.hasComponent && obj.hasComponent(this.engine.combatManager.enemyManager.constructor)
            );
            
            enemies.forEach(enemy => {
                if (enemy.position) {
                    const relativeX = (enemy.position[0] - playerPos[0]) * this.scale;
                    const relativeZ = (enemy.position[2] - playerPos[2]) * this.scale;
                    
                    const enemyMapX = playerMapX + relativeX;
                    const enemyMapY = playerMapY + relativeZ;
                    
                    // Only draw if within minimap bounds
                    if (enemyMapX >= 0 && enemyMapX <= this.mapSize && 
                        enemyMapY >= 0 && enemyMapY <= this.mapSize) {
                        
                        this.ctx.fillStyle = '#e74c3c';
                        this.ctx.beginPath();
                        this.ctx.arc(enemyMapX, enemyMapY, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Add pulsing effect for active enemies
                        this.ctx.strokeStyle = '#ff6b6b';
                        this.ctx.lineWidth = 1;
                        this.ctx.stroke();
                    }
                }
            });
        }
    }
    
    drawPlayer(x, y) {
        // Draw player as a blue dot
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add white outline
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawPlayerDirection(x, y) {
        // Get player rotation
        const rotation = this.engine.camera.getRotation();
        const yaw = rotation[1]; // Y-axis rotation
        
        // Draw direction line
        const lineLength = 8;
        const endX = x + Math.sin(yaw) * lineLength;
        const endY = y - Math.cos(yaw) * lineLength; // Negative because canvas Y is flipped
        
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
    
    worldToMinimap(worldPos, playerPos, playerMapX, playerMapY) {
        const relativeX = (worldPos[0] - playerPos[0]) * this.scale;
        const relativeZ = (worldPos[2] - playerPos[2]) * this.scale;
        
        return {
            x: playerMapX + relativeX,
            y: playerMapY + relativeZ
        };
    }
    
    setScale(scale) {
        this.scale = scale;
    }
    
    resize(size) {
        this.mapSize = size;
        this.canvas.width = size;
        this.canvas.height = size;
    }
}