/**
 * OneShot Predator Nukem - Combat Manager
 * Integrates weapon system, enemy system, and combat mechanics
 */

import { Component } from '../engine/core/GameObject.js';
import { WeaponSystem, setEnemyAIClass } from './WeaponSystem.js';
import { EnemyManager, EnemyAI, WildBoar } from './EnemySystem.js';
import { CombatUI } from './CombatUI.js';

export class CombatManager extends Component {
    constructor() {
        super();
        this.weaponSystem = null;
        this.enemyManager = null;
        this.combatUI = null;
        this.combatStats = {
            enemiesKilled: 0,
            shotsFired: 0,
            accuracy: 0,
            damageDealt: 0,
            damageTaken: 0
        };
        
        // Player combat state
        this.playerHealth = 100;
        this.maxPlayerHealth = 100;
        this.lastDamageTime = 0;
        this.damageImmunityTime = 1000; // 1 second immunity after taking damage
        
        // Combat events
        this.combatEvents = [];
    }

    onAttach() {
        console.log('CombatManager attached');
        
        // Set up cross-references between systems
        setEnemyAIClass(EnemyAI);
        
        // Initialize weapon system
        this.weaponSystem = new WeaponSystem();
        this.gameObject.addComponent(this.weaponSystem);
        
        // Initialize enemy manager
        this.enemyManager = new EnemyManager();
        this.gameObject.addComponent(this.enemyManager);
        
        // Initialize combat UI
        this.combatUI = new CombatUI(this.gameObject.engine);
        
        // Set up input handlers
        this.setupInputHandlers();
        
        // Set up collision handlers
        this.setupCollisionHandlers();
    }

    setupInputHandlers() {
        // Input handling will be done in the update method
        // using the existing input manager's action system
        console.log('Combat input handlers set up');
    }

    setupCollisionHandlers() {
        // Listen for projectile-enemy collisions
        this.gameObject.engine.addEventListener('collision', (event) => {
            this.handleCollision(event.detail);
        });
    }

    handleFireWeapon() {
        const camera = this.gameObject.engine.camera;
        const position = camera.getPosition();
        const direction = camera.getForwardVector();
        
        const success = this.weaponSystem.fire(position, direction);
        if (success) {
            this.combatStats.shotsFired++;
            
            // Add muzzle flash effect
            this.createMuzzleFlash(position, direction);
            
            // Add screen shake for weapon feedback
            this.addScreenShake(2.0, 100);
        }
    }

    handleReload() {
        const success = this.weaponSystem.reload();
        if (success) {
            console.log('Reloading weapon...');
        }
    }

    handleCollision(collisionData) {
        const { objectA, objectB, point } = collisionData;
        
        // Check for projectile hitting enemy
        if (this.isProjectile(objectA) && this.isEnemy(objectB)) {
            this.handleProjectileHitEnemy(objectA, objectB, point);
        } else if (this.isProjectile(objectB) && this.isEnemy(objectA)) {
            this.handleProjectileHitEnemy(objectB, objectA, point);
        }
        
        // Check for enemy hitting player
        if (this.isEnemy(objectA) && this.isPlayer(objectB)) {
            this.handleEnemyHitPlayer(objectA, point);
        } else if (this.isEnemy(objectB) && this.isPlayer(objectA)) {
            this.handleEnemyHitPlayer(objectB, point);
        }
    }

    handleProjectileHitEnemy(projectile, enemy, point) {
        // Deal damage to enemy
        const enemyAI = enemy.getComponent(EnemyAI);
        if (enemyAI) {
            enemyAI.takeDamage(projectile.damage);
            this.combatStats.damageDealt += projectile.damage;
            
            // Check if enemy died
            if (enemyAI.health <= 0) {
                this.handleEnemyKilled(enemy);
            }
            
            // Create hit effect
            this.createHitEffect(point, projectile.damage);
        }
    }

    handleEnemyHitPlayer(enemy, point) {
        const currentTime = performance.now();
        
        // Check damage immunity
        if (currentTime - this.lastDamageTime < this.damageImmunityTime) {
            return;
        }
        
        const enemyAI = enemy.getComponent(EnemyAI);
        if (enemyAI) {
            const damage = enemyAI.damage;
            this.playerHealth = Math.max(0, this.playerHealth - damage);
            this.combatStats.damageTaken += damage;
            this.lastDamageTime = currentTime;
            
            console.log(`Player takes ${damage} damage! Health: ${this.playerHealth}/${this.maxPlayerHealth}`);
            
            // Create damage effect
            this.createPlayerDamageEffect(damage);
            
            // Check if player died
            if (this.playerHealth <= 0) {
                this.handlePlayerDeath();
            }
        }
    }

    handleEnemyKilled(enemy) {
        this.combatStats.enemiesKilled++;
        
        // Calculate accuracy
        if (this.combatStats.shotsFired > 0) {
            this.combatStats.accuracy = (this.combatStats.enemiesKilled / this.combatStats.shotsFired) * 100;
        }
        
        console.log(`Enemy killed! Total: ${this.combatStats.enemiesKilled}`);
        
        // Create death effect
        this.createDeathEffect(enemy.position);
        
        // Award points or items
        this.awardKillReward();
    }

    handlePlayerDeath() {
        console.log('Player has died!');
        
        // Dispatch player death event with final stats
        this.gameObject.engine.dispatchEvent('playerDeath', {
            hogsKilled: this.combatStats.enemiesKilled,
            shotsFired: this.combatStats.shotsFired,
            accuracy: this.combatStats.accuracy,
            survivalTime: Date.now()
        });
        
        // Trigger game over
        this.gameObject.engine.dispatchEvent('gameStateChange', {
            oldState: 'playing',
            newState: 'gameOver'
        });
    }

    createMuzzleFlash(position, direction) {
        // Create visual muzzle flash effect
        const flashPosition = new Float32Array(3);
        flashPosition[0] = position[0] + direction[0] * 0.5;
        flashPosition[1] = position[1] + direction[1] * 0.5;
        flashPosition[2] = position[2] + direction[2] * 0.5;
        
        // Add light flash effect (would integrate with lighting system)
        console.log('Muzzle flash at:', flashPosition);
    }

    createHitEffect(position, damage) {
        // Create blood splatter or hit spark effect
        console.log(`Hit effect at ${position} for ${damage} damage`);
        
        // Play hit sound
        this.gameObject.engine.audioManager.playSound('enemy_hit', position);
    }

    createDeathEffect(position) {
        // Create death explosion/gib effect
        console.log('Death effect at:', position);
        
        // Play death sound
        this.gameObject.engine.audioManager.playSound('enemy_death', position);
    }

    createPlayerDamageEffect(damage) {
        // Create screen flash or damage indicator
        console.log(`Player damage effect: ${damage}`);
        
        // Play damage sound
        this.gameObject.engine.audioManager.playSound('player_hurt');
    }

    addScreenShake(intensity, duration) {
        // Add screen shake effect to camera
        const camera = this.gameObject.engine.camera;
        if (camera.addShake) {
            camera.addShake(intensity, duration);
        }
    }

    awardKillReward() {
        // Award ammo or health pickups
        const rewardType = Math.random();
        
        if (rewardType < 0.3) {
            // Award rifle ammo
            this.weaponSystem.addAmmo('rifle', 10);
            console.log('Found rifle ammo!');
        } else if (rewardType < 0.5) {
            // Award shotgun ammo
            this.weaponSystem.addAmmo('shotgun', 5);
            console.log('Found shotgun shells!');
        } else if (rewardType < 0.6) {
            // Award TNT
            this.weaponSystem.addAmmo('tnt', 1);
            console.log('Found TNT bundle!');
        }
        // Otherwise no reward
    }

    // Utility methods for collision detection
    isProjectile(gameObject) {
        return gameObject.name && gameObject.name.includes('Projectile');
    }

    isEnemy(gameObject) {
        return gameObject.hasComponent && gameObject.hasComponent(EnemyAI);
    }

    isPlayer(gameObject) {
        // Player is represented by camera in this system
        return gameObject === this.gameObject.engine.camera;
    }

    // Spawn enemies at specific locations
    spawnEnemyAt(position, variant = 1) {
        return this.enemyManager.spawnEnemy(position, variant);
    }

    // Get combat statistics
    getCombatStats() {
        return { ...this.combatStats };
    }

    // Get player health
    getPlayerHealth() {
        return {
            current: this.playerHealth,
            max: this.maxPlayerHealth,
            percentage: (this.playerHealth / this.maxPlayerHealth) * 100
        };
    }

    // Heal player
    healPlayer(amount) {
        this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
        console.log(`Player healed for ${amount}. Health: ${this.playerHealth}/${this.maxPlayerHealth}`);
    }

    // Get weapon info for UI
    getWeaponInfo() {
        if (!this.weaponSystem.currentWeapon) return null;
        
        const weaponType = this.weaponSystem.getCurrentWeaponType();
        return {
            type: weaponType,
            ammo: this.weaponSystem.getAmmoCount(weaponType),
            maxAmmo: this.weaponSystem.maxAmmo[weaponType],
            canFire: this.weaponSystem.currentWeapon.canFire()
        };
    }

    // Get enemy count for UI
    getEnemyCount() {
        return this.enemyManager.getEnemyCount();
    }

    update(deltaTime) {
        // Handle input
        this.handleInput(deltaTime);
        
        // Update combat systems
        if (this.weaponSystem) {
            this.weaponSystem.update(deltaTime);
        }
        
        if (this.enemyManager) {
            this.enemyManager.update(deltaTime);
        }
        
        // Process combat events
        this.processCombatEvents(deltaTime);
        
        // Update UI elements
        this.updateCombatUI();
    }
    
    handleInput(deltaTime) {
        const inputManager = this.gameObject.engine.inputManager;
        
        // Handle weapon firing
        if (inputManager.getAction('fire')) {
            this.handleFireWeapon();
        }
        
        // Handle reload
        if (inputManager.isKeyPressed('KeyR')) {
            this.handleReload();
        }
        
        // Handle weapon switching
        if (inputManager.isKeyPressed('Digit1')) {
            this.weaponSystem.switchWeapon('rifle');
        } else if (inputManager.isKeyPressed('Digit2')) {
            this.weaponSystem.switchWeapon('shotgun');
        } else if (inputManager.isKeyPressed('Digit3')) {
            this.weaponSystem.switchWeapon('tnt');
        }
    }

    processCombatEvents(deltaTime) {
        // Process any queued combat events
        for (let i = this.combatEvents.length - 1; i >= 0; i--) {
            const event = this.combatEvents[i];
            event.timer -= deltaTime;
            
            if (event.timer <= 0) {
                this.executeCombatEvent(event);
                this.combatEvents.splice(i, 1);
            }
        }
    }

    executeCombatEvent(event) {
        switch (event.type) {
            case 'spawn_enemy':
                this.spawnEnemyAt(event.position, event.variant);
                break;
            case 'award_ammo':
                this.weaponSystem.addAmmo(event.weaponType, event.amount);
                break;
            case 'heal_player':
                this.healPlayer(event.amount);
                break;
        }
    }

    updateCombatUI() {
        // Update UI elements with current combat state
        // This would integrate with a UI system
        const uiData = {
            health: this.getPlayerHealth(),
            weapon: this.getWeaponInfo(),
            enemies: this.getEnemyCount(),
            stats: this.getCombatStats()
        };
        
        // Dispatch UI update event
        this.gameObject.engine.dispatchEvent('combatUIUpdate', uiData);
    }

    // Queue a combat event
    queueCombatEvent(type, data, delay = 0) {
        this.combatEvents.push({
            type: type,
            timer: delay,
            ...data
        });
    }

    // Reset combat state (for level transitions)
    reset() {
        this.playerHealth = this.maxPlayerHealth;
        this.combatStats = {
            enemiesKilled: 0,
            shotsFired: 0,
            accuracy: 0,
            damageDealt: 0,
            damageTaken: 0
        };
        this.combatEvents = [];
        
        console.log('Combat state reset');
    }

    cleanup() {
        // Clean up combat systems
        if (this.weaponSystem) {
            this.gameObject.removeComponent(WeaponSystem);
        }
        
        if (this.enemyManager) {
            this.gameObject.removeComponent(EnemyManager);
        }
        
        if (this.combatUI) {
            this.combatUI.cleanup();
            this.combatUI = null;
        }
        
        console.log('CombatManager cleaned up');
    }
}