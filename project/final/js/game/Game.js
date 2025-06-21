/**
 * OneShot Predator Nukem - Main Game Class
 * Integrates all game systems and manages the ranch world
 */

import { LevelManager } from './LevelManager.js';
import { Skybox } from './Skybox.js';
import { RanchLevels, SkyboxConfigs } from './RanchLevels.js';
import { CombatManager } from './CombatManager.js';

export class Game {
    constructor(engine) {
        this.engine = engine;
        this.initialized = false;
        
        // Game systems
        this.levelManager = null;
        this.skybox = null;
        this.combatManager = null;
        
        // Game state
        this.gameState = 'loading'; // 'loading', 'playing', 'paused', 'menu'
        this.currentLevel = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 60;
        
        console.log('Game instance created');
    }
    
    /**
     * Initialize the game world
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Game already initialized');
            return true;
        }
        
        try {
            console.log('Initializing game world...');
            
            // Initialize level manager
            this.levelManager = new LevelManager(this.engine);
            this.engine.levelManager = this.levelManager; // Make available to engine
            
            // Initialize combat manager
            this.combatManager = new CombatManager();
            this.combatManager.gameObject = this.engine; // Attach to engine as game object
            this.combatManager.onAttach();
            
            // Register all ranch levels
            this.registerLevels();
            
            // Initialize skybox for first level
            await this.initializeSkybox('ranch_entrance');
            
            // Load the starting level
            await this.levelManager.loadLevel('ranch_entrance', 'default');
            
            // Set up game event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            this.gameState = 'playing';
            
            console.log('Game world initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.gameState = 'error';
            return false;
        }
    }
    
    /**
     * Register all level definitions
     */
    registerLevels() {
        console.log('Registering ranch levels...');
        
        // Register each level from RanchLevels
        for (const [levelId, levelData] of Object.entries(RanchLevels)) {
            this.levelManager.registerLevel(levelId, levelData);
        }
        
        console.log(`Registered ${Object.keys(RanchLevels).length} levels`);
    }
    
    /**
     * Initialize skybox for a level
     */
    async initializeSkybox(levelId) {
        const skyboxConfig = SkyboxConfigs[levelId];
        if (!skyboxConfig) {
            console.warn(`No skybox config found for level: ${levelId}`);
            return;
        }
        
        // Remove existing skybox
        if (this.skybox) {
            this.engine.removeGameObject(this.skybox);
        }
        
        // Create new skybox
        this.skybox = new Skybox(this.engine, skyboxConfig);
        await this.skybox.initialize();
        
        // Add to engine
        this.engine.addGameObject(this.skybox);
        
        console.log(`Skybox initialized for level: ${levelId}`);
    }
    
    /**
     * Set up event listeners for game interactions
     */
    setupEventListeners() {
        // Listen for level transitions
        this.engine.addEventListener('levelTransition', (event) => {
            this.handleLevelTransition(event.detail);
        });
        
        // Listen for player interactions
        this.engine.addEventListener('playerInteraction', (event) => {
            this.handlePlayerInteraction(event.detail);
        });
        
        // Listen for game state changes
        this.engine.addEventListener('gameStateChange', (event) => {
            this.handleGameStateChange(event.detail);
        });
    }
    
    /**
     * Handle level transitions
     */
    async handleLevelTransition(transitionData) {
        const { targetLevel, targetSpawn } = transitionData;
        
        console.log(`Transitioning to level: ${targetLevel}`);
        
        // Update skybox for new level
        await this.initializeSkybox(targetLevel);
        
        // Load the new level
        const success = await this.levelManager.loadLevel(targetLevel, targetSpawn);
        
        if (success) {
            this.currentLevel = targetLevel;
            console.log(`Level transition completed: ${targetLevel}`);
        } else {
            console.error(`Failed to transition to level: ${targetLevel}`);
        }
    }
    
    /**
     * Handle player interactions with environment objects
     */
    handlePlayerInteraction(interactionData) {
        const { objectType, objectId, success } = interactionData;
        
        if (success) {
            // Play appropriate sound effect
            switch (objectType) {
                case 'keycard':
                    this.engine.audioManager.playSound('keycard_pickup');
                    break;
                case 'switch':
                    this.engine.audioManager.playSound('switch_activate');
                    break;
                case 'gate':
                    this.engine.audioManager.playSound('gate_open');
                    break;
            }
            
            // Update UI if needed
            this.updateUI(interactionData);
        }
    }
    
    /**
     * Handle game state changes
     */
    handleGameStateChange(stateData) {
        const { newState, oldState } = stateData;
        
        this.gameState = newState;
        
        switch (newState) {
            case 'paused':
                this.engine.audioManager.pauseAll();
                break;
            case 'playing':
                this.engine.audioManager.resumeAll();
                break;
            case 'menu':
                this.showMainMenu();
                break;
        }
        
        console.log(`Game state changed: ${oldState} -> ${newState}`);
    }
    
    /**
     * Update game logic
     */
    update(deltaTime) {
        if (!this.initialized || this.gameState !== 'playing') {
            return;
        }
        
        // Update level manager
        this.levelManager.update(deltaTime);
        
        // Update skybox
        if (this.skybox) {
            this.skybox.update(deltaTime);
        }
        
        // Update combat manager
        if (this.combatManager) {
            this.combatManager.update(deltaTime);
        }
        
        // Update performance tracking
        this.updatePerformanceTracking(deltaTime);
        
        // Check for player input
        this.handleInput(deltaTime);
        
        // Update game-specific logic
        this.updateGameLogic(deltaTime);
    }
    
    /**
     * Handle player input
     */
    handleInput(deltaTime) {
        const input = this.engine.inputManager;
        
        // Check for interaction key (E)
        if (input.isKeyPressed('KeyE')) {
            this.checkPlayerInteractions();
        }
        
        // Check for pause key (ESC)
        if (input.isKeyPressed('Escape')) {
            this.togglePause();
        }
        
        // Check for debug keys
        if (input.isKeyPressed('F1')) {
            this.toggleDebugInfo();
        }
    }
    
    /**
     * Check for nearby interactive objects
     */
    checkPlayerInteractions() {
        const playerPos = this.engine.camera.getPosition();
        const interactionRange = 3.0;
        
        // Find nearby interactive objects
        const nearbyObjects = this.engine.gameObjects.filter(obj => {
            if (!obj.interactive || !obj.position) return false;
            
            const distance = this.calculateDistance(playerPos, obj.position);
            return distance <= interactionRange;
        });
        
        // Interact with closest object
        if (nearbyObjects.length > 0) {
            const closestObject = nearbyObjects.reduce((closest, obj) => {
                const closestDist = this.calculateDistance(playerPos, closest.position);
                const objDist = this.calculateDistance(playerPos, obj.position);
                return objDist < closestDist ? obj : closest;
            });
            
            if (closestObject.interact) {
                const success = closestObject.interact(this.getPlayerData());
                
                // Dispatch interaction event
                this.engine.dispatchEvent('playerInteraction', {
                    objectType: closestObject.objectType,
                    objectId: closestObject.name,
                    success: success
                });
            }
        }
    }
    
    /**
     * Update game-specific logic
     */
    updateGameLogic(deltaTime) {
        // Check win conditions
        this.checkWinConditions();
        
        // Update environmental effects
        this.updateEnvironmentalEffects(deltaTime);
        
        // Update audio positioning
        this.updateAudioPositioning();
    }
    
    /**
     * Check win conditions
     */
    checkWinConditions() {
        const progress = this.levelManager.playerProgress;
        
        // Check if all hogs are eliminated
        let totalEnemies = 0;
        if (this.combatManager && this.combatManager.enemyManager) {
            totalEnemies = this.combatManager.getEnemyCount();
        }
        
        // Win condition: All hogs eliminated and player has explored all areas
        const hasExploredAllAreas = progress.keycards.has('gold') && 
                                   progress.switchesActivated.has('compound_master') &&
                                   progress.currentLevelId === 'ranch_compound';
        
        const allHogsEliminated = totalEnemies === 0 && this.combatManager.getCombatStats().enemiesKilled > 0;
        
        if (hasExploredAllAreas && allHogsEliminated) {
            this.handleGameWin();
        }
        
        // Alternative win condition: Eliminate a minimum number of hogs (fallback)
        const combatStats = this.combatManager ? this.combatManager.getCombatStats() : { enemiesKilled: 0 };
        if (combatStats.enemiesKilled >= 25 && totalEnemies === 0) {
            this.handleGameWin();
        }
    }
    
    /**
     * Update environmental effects
     */
    updateEnvironmentalEffects(deltaTime) {
        // Update wind effects on grass/trees
        // Update particle systems
        // Update dynamic lighting
    }
    
    /**
     * Update 3D audio positioning
     */
    updateAudioPositioning() {
        const playerPos = this.engine.camera.getPosition();
        const playerRot = this.engine.camera.getRotation();
        
        // Update listener position for 3D audio
        this.engine.audioManager.updateListener(playerPos, playerRot);
    }
    
    /**
     * Update performance tracking
     */
    updatePerformanceTracking(deltaTime) {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        const newState = this.gameState === 'playing' ? 'paused' : 'playing';
        this.engine.dispatchEvent('gameStateChange', {
            oldState: this.gameState,
            newState: newState
        });
    }
    
    /**
     * Toggle debug information display
     */
    toggleDebugInfo() {
        // Toggle debug overlay showing FPS, position, level info, etc.
        console.log('Debug Info:', {
            fps: this.currentFPS,
            level: this.currentLevel,
            playerPos: this.engine.camera.getPosition(),
            progress: this.levelManager.playerProgress
        });
    }
    
    /**
     * Handle game win
     */
    handleGameWin() {
        console.log('Game won!');
        this.gameState = 'won';
        
        // Play victory music
        this.engine.audioManager.playSound('victory_fanfare');
        
        // Get final game statistics
        const combatStats = this.combatManager ? this.combatManager.getCombatStats() : {
            enemiesKilled: 0,
            shotsFired: 0,
            accuracy: 0
        };
        
        // Dispatch game complete event with statistics
        this.engine.dispatchEvent('gameComplete', {
            hogsKilled: combatStats.enemiesKilled,
            shotsFired: combatStats.shotsFired,
            accuracy: combatStats.accuracy,
            completedAt: Date.now()
        });
        
        // Show win screen
        this.showWinScreen();
    }
    
    /**
     * Show win screen
     */
    showWinScreen() {
        // Implementation would show victory UI
        console.log('Victory! You have secured the ranch from wild hogs!');
    }
    
    /**
     * Show main menu
     */
    showMainMenu() {
        // Implementation would show main menu UI
        console.log('Main menu displayed');
    }
    
    /**
     * Update UI elements
     */
    updateUI(data) {
        // Update keycard inventory display
        // Update objective text
        // Update interaction prompts
    }
    
    /**
     * Get player data for interactions
     */
    getPlayerData() {
        return {
            position: this.engine.camera.getPosition(),
            rotation: this.engine.camera.getRotation(),
            inventory: this.levelManager.playerProgress.keycards,
            switches: this.levelManager.playerProgress.switchesActivated
        };
    }
    
    /**
     * Calculate distance between two points
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    /**
     * Get current game statistics
     */
    getGameStats() {
        return {
            fps: this.currentFPS,
            level: this.currentLevel,
            gameState: this.gameState,
            playerProgress: this.levelManager ? this.levelManager.playerProgress : null,
            engineStats: this.engine.getStats()
        };
    }
    
    /**
     * Restart game
     */
    async restart() {
        console.log('Restarting game...');
        
        // Reset level manager
        if (this.levelManager) {
            await this.levelManager.loadLevel('ranch_entrance', 'default');
        }
        
        // Reset game state
        this.gameState = 'playing';
        
        console.log('Game restarted');
    }
    
    /**
     * Cleanup game resources
     */
    cleanup() {
        console.log('Cleaning up game resources...');
        
        // Remove skybox
        if (this.skybox) {
            this.engine.removeGameObject(this.skybox);
            this.skybox = null;
        }
        
        // Cleanup level manager
        if (this.levelManager) {
            this.levelManager.unloadCurrentLevel();
            this.levelManager = null;
        }
        
        // Cleanup combat manager
        if (this.combatManager) {
            this.combatManager.cleanup();
            this.combatManager = null;
        }
        
        this.initialized = false;
        console.log('Game cleanup completed');
    }
}