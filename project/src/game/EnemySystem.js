/**
 * OneShot Predator Nukem - Enemy System
 * Handles wild boar enemies with AI behaviors using existing sprites
 */

import { GameObject, Component, DynamicObject } from '../engine/core/GameObject.js';

export class EnemyManager extends Component {
    constructor() {
        super();
        this.enemies = [];
        this.spawnPoints = [];
        this.maxEnemies = 10;
        this.spawnCooldown = 5000; // 5 seconds between spawns
        this.lastSpawnTime = 0;
    }

    onAttach() {
        console.log('EnemyManager attached');
        this.setupSpawnPoints();
    }

    setupSpawnPoints() {
        // Define spawn points for each level
        // These will be populated based on level data
        this.spawnPoints = [
            { position: [10, 0, 10], variant: 1 },
            { position: [-10, 0, 15], variant: 2 },
            { position: [20, 0, -5], variant: 1 },
            { position: [-15, 0, -10], variant: 2 }
        ];
    }

    spawnEnemy(position, variant = 1) {
        if (this.enemies.length >= this.maxEnemies) {
            return null;
        }

        const enemy = new WildBoar(this.gameObject.engine, position, variant);
        this.enemies.push(enemy);
        this.gameObject.engine.addGameObject(enemy);
        
        console.log(`Spawned wild boar variant ${variant} at position:`, position);
        return enemy;
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    update(deltaTime) {
        const currentTime = performance.now();
        
        // Auto-spawn enemies if below max count
        if (this.enemies.length < this.maxEnemies && 
            currentTime - this.lastSpawnTime >= this.spawnCooldown) {
            
            const spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            this.spawnEnemy(spawnPoint.position, spawnPoint.variant);
            this.lastSpawnTime = currentTime;
        }

        // Clean up destroyed enemies
        this.enemies = this.enemies.filter(enemy => !enemy.destroyed);
    }

    getEnemyCount() {
        return this.enemies.length;
    }

    getAllEnemies() {
        return [...this.enemies];
    }
}

export class EnemyAI extends Component {
    constructor(variant = 1) {
        super();
        this.variant = variant;
        this.state = 'patrol';
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 3.0;
        this.chargeSpeed = 8.0;
        this.aggroRange = 15.0;
        this.attackRange = 2.0;
        this.damage = 20;
        
        // AI state timers
        this.stateTimer = 0;
        this.patrolTimer = 0;
        this.chargeTimer = 0;
        
        // Movement
        this.patrolDirection = new Float32Array([0, 0, 1]);
        this.targetPosition = new Float32Array([0, 0, 0]);
        this.lastPlayerPosition = new Float32Array([0, 0, 0]);
        
        // Zig-zag charge pattern
        this.zigzagTimer = 0;
        this.zigzagDirection = 1;
        this.zigzagIntensity = 2.0;
        
        // Audio
        this.lastGruntTime = 0;
        this.gruntCooldown = 3000;
    }

    onAttach() {
        console.log(`EnemyAI attached - variant ${this.variant}`);
        this.setupCollider();
        this.initializePatrol();
    }

    setupCollider() {
        // Create sphere collider for the boar
        const collider = this.gameObject.engine.collisionSystem.createSphereCollider(
            this.gameObject, 1.0, [0, 0, 0], this.gameObject.engine.collisionSystem.layers.ENEMY
        );
        this.gameObject.setCollider(collider);
        this.gameObject.engine.collisionSystem.addCollider(collider);
    }

    initializePatrol() {
        // Set random patrol direction
        const angle = Math.random() * Math.PI * 2;
        this.patrolDirection[0] = Math.sin(angle);
        this.patrolDirection[2] = Math.cos(angle);
        this.patrolTimer = Math.random() * 3000 + 2000; // 2-5 seconds
    }

    update(deltaTime) {
        if (this.health <= 0) {
            this.handleDeath();
            return;
        }

        this.stateTimer += deltaTime;
        
        // Get player position for AI decisions
        const playerPosition = this.gameObject.engine.camera.getPosition();
        const distanceToPlayer = this.getDistanceToPlayer(playerPosition);
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime, playerPosition, distanceToPlayer);
                break;
            case 'charge':
                this.updateCharge(deltaTime, playerPosition, distanceToPlayer);
                break;
            case 'death':
                this.updateDeath(deltaTime);
                break;
        }

        // Update sprite animation and play sounds
        this.updateAudio(deltaTime);
    }

    updatePatrol(deltaTime, playerPosition, distanceToPlayer) {
        // Check if player is in aggro range
        if (distanceToPlayer <= this.aggroRange) {
            this.setState('charge');
            this.lastPlayerPosition[0] = playerPosition[0];
            this.lastPlayerPosition[1] = playerPosition[1];
            this.lastPlayerPosition[2] = playerPosition[2];
            return;
        }

        // Continue patrol movement
        this.patrolTimer -= deltaTime;
        
        if (this.patrolTimer <= 0) {
            // Change patrol direction
            this.initializePatrol();
        }

        // Move in patrol direction
        const moveSpeed = this.speed * (deltaTime / 1000);
        this.gameObject.velocity[0] = this.patrolDirection[0] * moveSpeed;
        this.gameObject.velocity[2] = this.patrolDirection[2] * moveSpeed;
        
        // Face movement direction
        this.gameObject.lookAt([
            this.gameObject.position[0] + this.patrolDirection[0],
            this.gameObject.position[1],
            this.gameObject.position[2] + this.patrolDirection[2]
        ]);

        // Check for wall collisions and change direction
        this.checkWallCollisions();
    }

    updateCharge(deltaTime, playerPosition, distanceToPlayer) {
        // If player is too far, return to patrol
        if (distanceToPlayer > this.aggroRange * 1.5) {
            this.setState('patrol');
            return;
        }

        // Update target to current player position
        this.lastPlayerPosition[0] = playerPosition[0];
        this.lastPlayerPosition[1] = playerPosition[1];
        this.lastPlayerPosition[2] = playerPosition[2];

        // Calculate direction to player with zig-zag pattern
        const dirToPlayer = new Float32Array(3);
        dirToPlayer[0] = this.lastPlayerPosition[0] - this.gameObject.position[0];
        dirToPlayer[1] = 0;
        dirToPlayer[2] = this.lastPlayerPosition[2] - this.gameObject.position[2];
        
        // Normalize direction
        const length = Math.sqrt(dirToPlayer[0]*dirToPlayer[0] + dirToPlayer[2]*dirToPlayer[2]);
        if (length > 0) {
            dirToPlayer[0] /= length;
            dirToPlayer[2] /= length;
        }

        // Add zig-zag pattern
        this.zigzagTimer += deltaTime;
        if (this.zigzagTimer >= 500) { // Change direction every 0.5 seconds
            this.zigzagDirection *= -1;
            this.zigzagTimer = 0;
        }

        // Calculate perpendicular vector for zig-zag
        const perpendicular = new Float32Array(2);
        perpendicular[0] = -dirToPlayer[2] * this.zigzagDirection * this.zigzagIntensity;
        perpendicular[1] = dirToPlayer[0] * this.zigzagDirection * this.zigzagIntensity;

        // Apply zig-zag to movement direction
        const finalDirection = new Float32Array(3);
        finalDirection[0] = dirToPlayer[0] + perpendicular[0] * 0.3;
        finalDirection[1] = 0;
        finalDirection[2] = dirToPlayer[2] + perpendicular[1] * 0.3;

        // Move towards player with zig-zag
        const chargeSpeed = this.chargeSpeed * (deltaTime / 1000);
        this.gameObject.velocity[0] = finalDirection[0] * chargeSpeed;
        this.gameObject.velocity[2] = finalDirection[2] * chargeSpeed;

        // Face the player
        this.gameObject.lookAt(this.lastPlayerPosition);

        // Check if close enough to attack
        if (distanceToPlayer <= this.attackRange) {
            this.attackPlayer();
        }

        // Check for wall collisions
        this.checkWallCollisions();
    }

    updateDeath(deltaTime) {
        // Death animation is handled by sprite system
        // Remove enemy after death animation completes
        if (this.stateTimer >= 2000) { // 2 second death animation
            this.gameObject.destroy();
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        
        console.log(`Boar ${this.variant} state: ${this.state} -> ${newState}`);
        this.state = newState;
        this.stateTimer = 0;
        
        // Update sprite animation based on state
        this.updateSpriteState();
    }

    updateSpriteState() {
        // Update sprite renderer state
        const spriteRenderer = this.gameObject.engine.renderer.spriteRenderer;
        if (spriteRenderer && this.gameObject.sprite) {
            spriteRenderer.setSpriteState(this.gameObject.sprite, this.state);
        }
    }

    checkWallCollisions() {
        // Check for collisions with environment
        const collisions = this.gameObject.engine.collisionSystem.getCollisions(this.gameObject.collider);
        
        for (const collision of collisions) {
            if (collision.layer === this.gameObject.engine.collisionSystem.layers.ENVIRONMENT) {
                // Bounce off walls by reversing direction
                if (this.state === 'patrol') {
                    this.patrolDirection[0] *= -1;
                    this.patrolDirection[2] *= -1;
                    this.patrolTimer = Math.random() * 2000 + 1000;
                } else if (this.state === 'charge') {
                    // Try to go around obstacle
                    this.zigzagDirection *= -1;
                    this.zigzagTimer = 0;
                }
                break;
            }
        }
    }

    attackPlayer() {
        // Deal damage to player
        console.log(`Boar attacks player for ${this.damage} damage!`);
        
        // Play attack sound
        this.gameObject.engine.audioManager.playSound('boar_attack');
        
        // Push player back slightly
        const playerPos = this.gameObject.engine.camera.getPosition();
        const pushDirection = new Float32Array(3);
        pushDirection[0] = playerPos[0] - this.gameObject.position[0];
        pushDirection[1] = 0;
        pushDirection[2] = playerPos[2] - this.gameObject.position[2];
        
        // Normalize and apply push
        const length = Math.sqrt(pushDirection[0]*pushDirection[0] + pushDirection[2]*pushDirection[2]);
        if (length > 0) {
            pushDirection[0] = (pushDirection[0] / length) * 5.0;
            pushDirection[2] = (pushDirection[2] / length) * 5.0;
            
            // Apply push to camera/player (would need player controller integration)
            // For now, just log the attack
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        console.log(`Boar takes ${damage} damage, health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.setState('death');
        } else {
            // Become aggressive when hit
            if (this.state === 'patrol') {
                this.setState('charge');
            }
        }
    }

    handleDeath() {
        if (this.state !== 'death') {
            this.setState('death');
            
            // Play death sound
            this.gameObject.engine.audioManager.playSound('boar_death');
            
            // Remove from enemy manager
            const enemyManager = this.gameObject.engine.gameObjects.find(obj => 
                obj.hasComponent && obj.hasComponent(EnemyManager)
            );
            if (enemyManager) {
                const manager = enemyManager.getComponent(EnemyManager);
                manager.removeEnemy(this.gameObject);
            }
        }
    }

    updateAudio(deltaTime) {
        const currentTime = performance.now();
        
        // Play grunt sounds occasionally
        if (currentTime - this.lastGruntTime >= this.gruntCooldown) {
            if (Math.random() < 0.3) { // 30% chance
                this.gameObject.engine.audioManager.playSound('boar_grunt', this.gameObject.position);
                this.lastGruntTime = currentTime;
            }
        }
    }

    getDistanceToPlayer(playerPosition) {
        const dx = playerPosition[0] - this.gameObject.position[0];
        const dy = playerPosition[1] - this.gameObject.position[1];
        const dz = playerPosition[2] - this.gameObject.position[2];
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
}

// Wild Boar GameObject class
export class WildBoar extends DynamicObject {
    constructor(engine, position, variant = 1) {
        super(`WildBoar_${variant}`);
        this.engine = engine;
        this.variant = variant;
        
        // Set position
        this.setPosition(position[0], position[1], position[2]);
        
        // Add AI component
        this.addComponent(new EnemyAI(variant));
        
        // Create sprite
        this.createSprite();
        
        console.log(`Created wild boar variant ${variant} at position:`, position);
    }

    createSprite() {
        // Create sprite using the sprite renderer
        const spriteRenderer = this.engine.renderer.spriteRenderer;
        if (spriteRenderer) {
            this.sprite = spriteRenderer.createBoarSprite(this.position, this.variant);
            
            // Add sprite to renderer
            if (!this.engine.sprites) {
                this.engine.sprites = [];
            }
            this.engine.sprites.push(this.sprite);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update sprite position to match game object
        if (this.sprite) {
            this.sprite.position[0] = this.position[0];
            this.sprite.position[1] = this.position[1] + 1.0; // Raise sprite above ground
            this.sprite.position[2] = this.position[2];
            
            // Update sprite animation
            const spriteRenderer = this.engine.renderer.spriteRenderer;
            if (spriteRenderer) {
                spriteRenderer.updateSpriteAnimation(this.sprite, deltaTime);
            }
        }
    }

    destroy() {
        // Remove sprite from renderer
        if (this.sprite && this.engine.sprites) {
            const index = this.engine.sprites.indexOf(this.sprite);
            if (index > -1) {
                this.engine.sprites.splice(index, 1);
            }
        }
        
        super.destroy();
    }
}

// Navigation/Pathfinding helper (basic implementation)
export class SimpleNavigation {
    constructor(levelGeometry) {
        this.levelGeometry = levelGeometry;
        this.gridSize = 2.0;
        this.navGrid = new Map();
        this.generateNavGrid();
    }

    generateNavGrid() {
        // Generate a simple navigation grid based on level geometry
        // This is a basic implementation - could be enhanced with proper navmesh
        const bounds = this.levelGeometry.getBounds();
        
        for (let x = bounds.min[0]; x <= bounds.max[0]; x += this.gridSize) {
            for (let z = bounds.min[2]; z <= bounds.max[2]; z += this.gridSize) {
                const position = [x, 0, z];
                const walkable = !this.levelGeometry.isWall(position);
                
                const gridKey = `${Math.floor(x/this.gridSize)},${Math.floor(z/this.gridSize)}`;
                this.navGrid.set(gridKey, {
                    position: position,
                    walkable: walkable
                });
            }
        }
        
        console.log(`Generated navigation grid with ${this.navGrid.size} cells`);
    }

    findPath(start, end) {
        // Simple A* pathfinding implementation
        // For now, return direct path - could be enhanced with proper A*
        return [start, end];
    }

    isWalkable(position) {
        const gridKey = `${Math.floor(position[0]/this.gridSize)},${Math.floor(position[2]/this.gridSize)}`;
        const cell = this.navGrid.get(gridKey);
        return cell ? cell.walkable : false;
    }
}