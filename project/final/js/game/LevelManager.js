/**
 * OneShot Predator Nukem - Level Manager
 * Manages level loading, transitions, and progression
 */

import { GameObject } from '../engine/core/GameObject.js';

export class LevelManager {
    constructor(engine) {
        this.engine = engine;
        this.currentLevel = null;
        this.levels = new Map();
        this.transitionInProgress = false;
        
        // Level progression state
        this.playerProgress = {
            keycards: new Set(),
            switchesActivated: new Set(),
            currentLevelId: 'ranch_entrance'
        };
        
        // Level boundaries and spawn points
        this.spawnPoints = new Map();
        this.levelBoundaries = new Map();
        
        console.log('LevelManager initialized');
    }
    
    /**
     * Register a level definition
     */
    registerLevel(levelId, levelData) {
        this.levels.set(levelId, levelData);
        
        // Store spawn points
        if (levelData.spawnPoints) {
            this.spawnPoints.set(levelId, levelData.spawnPoints);
        }
        
        // Store level boundaries
        if (levelData.boundaries) {
            this.levelBoundaries.set(levelId, levelData.boundaries);
        }
        
        console.log(`Level registered: ${levelId}`);
    }
    
    /**
     * Load and activate a level
     */
    async loadLevel(levelId, spawnPointId = 'default') {
        if (this.transitionInProgress) {
            console.warn('Level transition already in progress');
            return false;
        }
        
        if (!this.levels.has(levelId)) {
            console.error(`Level not found: ${levelId}`);
            return false;
        }
        
        this.transitionInProgress = true;
        
        try {
            // Unload current level
            if (this.currentLevel) {
                await this.unloadCurrentLevel();
            }
            
            // Load new level
            const levelData = this.levels.get(levelId);
            await this.loadLevelGeometry(levelData);
            await this.loadLevelEnvironment(levelData);
            await this.loadLevelAudio(levelData);
            
            // Set player spawn position
            this.setPlayerSpawn(levelId, spawnPointId);
            
            this.currentLevel = levelId;
            this.playerProgress.currentLevelId = levelId;
            
            console.log(`Level loaded: ${levelId}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to load level ${levelId}:`, error);
            return false;
        } finally {
            this.transitionInProgress = false;
        }
    }
    
    /**
     * Unload current level and clean up resources
     */
    async unloadCurrentLevel() {
        if (!this.currentLevel) return;
        
        // Remove all level game objects
        const levelObjects = this.engine.gameObjects.filter(obj => 
            obj.levelId === this.currentLevel
        );
        
        for (const obj of levelObjects) {
            this.engine.removeGameObject(obj);
        }
        
        // Stop level-specific audio
        this.engine.audioManager.stopAllSounds();
        
        console.log(`Level unloaded: ${this.currentLevel}`);
    }
    
    /**
     * Load level geometry (walls, floors, ceilings)
     */
    async loadLevelGeometry(levelData) {
        const { LevelGeometry } = await import('./LevelGeometry.js');
        
        for (const geometryDef of levelData.geometry) {
            const geometry = new LevelGeometry(geometryDef, this.engine);
            geometry.levelId = levelData.id;
            await geometry.initialize();
            this.engine.addGameObject(geometry);
        }
    }
    
    /**
     * Load environmental objects (fences, barns, etc.)
     */
    async loadLevelEnvironment(levelData) {
        const { EnvironmentObject } = await import('./EnvironmentObject.js');
        
        for (const envDef of levelData.environment || []) {
            const envObj = new EnvironmentObject(envDef, this.engine);
            envObj.levelId = levelData.id;
            await envObj.initialize();
            this.engine.addGameObject(envObj);
        }
    }
    
    /**
     * Load level-specific audio
     */
    async loadLevelAudio(levelData) {
        if (levelData.backgroundMusic) {
            await this.engine.audioManager.playMusic(levelData.backgroundMusic);
        }
        
        // Load ambient sounds
        for (const ambientSound of levelData.ambientSounds || []) {
            await this.engine.audioManager.playAmbientSound(
                ambientSound.file,
                ambientSound.position,
                ambientSound.volume || 0.5
            );
        }
    }
    
    /**
     * Set player spawn position
     */
    setPlayerSpawn(levelId, spawnPointId) {
        const spawnPoints = this.spawnPoints.get(levelId);
        if (!spawnPoints || !spawnPoints[spawnPointId]) {
            console.warn(`Spawn point not found: ${levelId}:${spawnPointId}`);
            return;
        }
        
        const spawn = spawnPoints[spawnPointId];
        this.engine.camera.setPosition(spawn.position);
        this.engine.camera.setRotation(spawn.rotation || [0, 0, 0]);
        
        console.log(`Player spawned at: ${levelId}:${spawnPointId}`);
    }
    
    /**
     * Check if player can progress to next area
     */
    canProgress(gateId, requirements) {
        if (!requirements) return true;
        
        // Check keycard requirements
        if (requirements.keycards) {
            for (const keycard of requirements.keycards) {
                if (!this.playerProgress.keycards.has(keycard)) {
                    return false;
                }
            }
        }
        
        // Check switch requirements
        if (requirements.switches) {
            for (const switchId of requirements.switches) {
                if (!this.playerProgress.switchesActivated.has(switchId)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Add keycard to player inventory
     */
    addKeycard(keycardId) {
        this.playerProgress.keycards.add(keycardId);
        console.log(`Keycard acquired: ${keycardId}`);
    }
    
    /**
     * Activate a switch
     */
    activateSwitch(switchId) {
        this.playerProgress.switchesActivated.add(switchId);
        console.log(`Switch activated: ${switchId}`);
    }
    
    /**
     * Check level boundaries and handle transitions
     */
    checkLevelBoundaries(playerPosition) {
        const boundaries = this.levelBoundaries.get(this.currentLevel);
        if (!boundaries) return;
        
        for (const boundary of boundaries) {
            if (this.isPlayerInBoundary(playerPosition, boundary)) {
                if (boundary.type === 'transition') {
                    this.handleLevelTransition(boundary);
                } else if (boundary.type === 'gate') {
                    this.handleGateInteraction(boundary);
                }
            }
        }
    }
    
    /**
     * Check if player is within a boundary
     */
    isPlayerInBoundary(playerPos, boundary) {
        const [x, y, z] = playerPos;
        const bounds = boundary.bounds;
        
        return x >= bounds.minX && x <= bounds.maxX &&
               y >= bounds.minY && y <= bounds.maxY &&
               z >= bounds.minZ && z <= bounds.maxZ;
    }
    
    /**
     * Handle level transition
     */
    handleLevelTransition(boundary) {
        if (this.canProgress(boundary.id, boundary.requirements)) {
            this.loadLevel(boundary.targetLevel, boundary.targetSpawn);
        } else {
            console.log('Cannot progress - requirements not met');
            // Show UI message about missing requirements
        }
    }
    
    /**
     * Handle gate interaction
     */
    handleGateInteraction(boundary) {
        if (this.canProgress(boundary.id, boundary.requirements)) {
            // Open gate or activate mechanism
            this.openGate(boundary.id);
        }
    }
    
    /**
     * Open a gate
     */
    openGate(gateId) {
        // Find gate object and animate opening
        const gateObject = this.engine.gameObjects.find(obj => 
            obj.name === `gate_${gateId}`
        );
        
        if (gateObject && gateObject.open) {
            gateObject.open();
        }
    }
    
    /**
     * Update level manager
     */
    update(deltaTime) {
        if (!this.currentLevel) return;
        
        // Check level boundaries
        const playerPos = this.engine.camera.getPosition();
        this.checkLevelBoundaries(playerPos);
    }
    
    /**
     * Get current level info
     */
    getCurrentLevelInfo() {
        if (!this.currentLevel) return null;
        
        return {
            id: this.currentLevel,
            data: this.levels.get(this.currentLevel),
            progress: this.playerProgress
        };
    }
}