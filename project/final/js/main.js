/**
 * OneShot Predator Nukem - Main Game Entry Point
 * Initializes the game engine and manages the game lifecycle
 */

import { Engine } from '../../src/engine/core/Engine.js';
import { Game as RanchGame } from '../../src/game/Game.js';
import { GameStateManager } from './GameStateManager.js';
import { MinimapRenderer } from './MinimapRenderer.js';

class Game {
    constructor() {
        this.engine = null;
        this.canvas = null;
        this.gameState = 'loading'; // loading, menu, playing, paused
        this.loadingProgress = 0;
        this.gameStateManager = null;
        this.minimapRenderer = null;
        
        // UI elements
        this.ui = {
            loadingScreen: null,
            loadingProgress: null,
            loadingText: null,
            mainMenu: null,
            controlsScreen: null,
            settingsScreen: null,
            pauseMenu: null,
            gameHUD: null,
            clickToStart: null,
            performanceStats: null,
            errorDisplay: null
        };
        
        // Game objects
        this.gameObjects = [];
        this.sprites = [];
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Settings
        this.settings = {
            masterVolume: 1.0,
            musicVolume: 0.7,
            sfxVolume: 0.8,
            mouseSensitivity: 1.0,
            invertY: false,
            showPerformanceStats: false
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Get canvas and UI elements
            this.canvas = document.getElementById('gameCanvas');
            this.initUI();
            
            // Set up canvas
            this.setupCanvas();
            
            // Initialize engine
            this.engine = new Engine(this.canvas);
            
            // Initialize game state manager
            this.gameStateManager = new GameStateManager(this.engine);
            
            // Initialize minimap renderer
            const minimapCanvas = document.getElementById('minimapCanvas');
            if (minimapCanvas) {
                this.minimapRenderer = new MinimapRenderer(minimapCanvas, this.engine);
            }
            
            // Load game assets and initialize engine
            await this.loadGame();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Show main menu
            this.showMainMenu();
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }
    
    initUI() {
        this.ui.loadingScreen = document.getElementById('loadingScreen');
        this.ui.loadingProgress = document.getElementById('loadingProgress');
        this.ui.loadingText = document.getElementById('loadingText');
        this.ui.mainMenu = document.getElementById('mainMenu');
        this.ui.controlsScreen = document.getElementById('controlsScreen');
        this.ui.settingsScreen = document.getElementById('settingsScreen');
        this.ui.pauseMenu = document.getElementById('pauseMenu');
        this.ui.gameHUD = document.getElementById('gameHUD');
        this.ui.clickToStart = document.getElementById('clickToStart');
        this.ui.performanceStats = document.getElementById('performanceStats');
        this.ui.errorDisplay = document.getElementById('errorDisplay');
    }
    
    setupCanvas() {
        // Set up canvas for retro pixelated rendering
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
        }
        
        // Handle canvas resize
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerRect = container.getBoundingClientRect();
        
        // Maintain 16:9 aspect ratio
        const targetAspect = 16 / 9;
        let width = containerRect.width;
        let height = containerRect.height;
        
        if (width / height > targetAspect) {
            width = height * targetAspect;
        } else {
            height = width / targetAspect;
        }
        
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        if (this.engine) {
            this.engine.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    async loadGame() {
        this.updateLoadingProgress(0, 'Initializing WebGL...');
        
        // Initialize engine
        const engineInitialized = await this.engine.initialize();
        if (!engineInitialized) {
            throw new Error('Failed to initialize game engine');
        }
        
        this.updateLoadingProgress(25, 'Loading textures...');
        
        // Create basic game world
        await this.createGameWorld();
        
        this.updateLoadingProgress(50, 'Loading audio...');
        
        // Start background music
        this.engine.audioManager.startBackgroundMusic();
        
        this.updateLoadingProgress(75, 'Setting up game objects...');
        
        // Create initial game objects
        this.createInitialGameObjects();
        
        this.updateLoadingProgress(100, 'Ready to play!');
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    async createGameWorld() {
        // Initialize the comprehensive ranch world system
        this.ranchGame = new RanchGame(this.engine);
        const success = await this.ranchGame.initialize();
        
        if (!success) {
            throw new Error('Failed to initialize ranch world');
        }
        
        console.log('Ranch world system initialized successfully');
    }
    
    createInitialGameObjects() {
        // Create some wild boar sprites
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const boarSprite = this.engine.renderer.spriteRenderer.createBoarSprite(
                [x, 1, z],
                Math.random() > 0.5 ? 1 : 2
            );
            
            this.engine.addSprite(boarSprite);
        }
    }
    
    setupEventListeners() {
        // Basic menu buttons (GameStateManager handles most UI now)
        document.getElementById('showControls').addEventListener('click', () => this.showControls());
        document.getElementById('showSettings').addEventListener('click', () => this.showSettings());
        document.getElementById('backFromControls').addEventListener('click', () => this.showMainMenu());
        document.getElementById('backFromSettings').addEventListener('click', () => this.showMainMenu());
        
        // Pause menu (some handled by GameStateManager)
        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('pauseSettings').addEventListener('click', () => this.showSettings());
        document.getElementById('quitToMenu').addEventListener('click', () => this.quitToMenu());
        
        // Settings
        this.setupSettingsListeners();
        
        // Error handling
        document.getElementById('reloadButton').addEventListener('click', () => location.reload());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Click to start
        this.ui.clickToStart.addEventListener('click', () => this.hideClickToStart());
        
        // Performance stats toggle (F3)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                this.togglePerformanceStats();
            }
        });
        
        // Listen for game completion
        this.engine.addEventListener('gameComplete', (event) => {
            this.gameStateManager.handleGameComplete(event.detail);
        });
        
        // Listen for player death
        this.engine.addEventListener('playerDeath', () => {
            this.gameStateManager.showGameOverScreen();
        });
    }
    
    setupSettingsListeners() {
        // Volume controls
        const masterVolume = document.getElementById('masterVolume');
        const musicVolume = document.getElementById('musicVolume');
        const sfxVolume = document.getElementById('sfxVolume');
        const mouseSensitivity = document.getElementById('mouseSensitivity');
        const invertY = document.getElementById('invertY');
        
        masterVolume.addEventListener('input', (e) => {
            this.settings.masterVolume = e.target.value / 100;
            document.getElementById('masterVolumeValue').textContent = e.target.value + '%';
            if (this.engine) {
                this.engine.audioManager.setMasterVolume(this.settings.masterVolume);
            }
        });
        
        musicVolume.addEventListener('input', (e) => {
            this.settings.musicVolume = e.target.value / 100;
            document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
            if (this.engine) {
                this.engine.audioManager.setMusicVolume(this.settings.musicVolume);
            }
        });
        
        sfxVolume.addEventListener('input', (e) => {
            this.settings.sfxVolume = e.target.value / 100;
            document.getElementById('sfxVolumeValue').textContent = e.target.value + '%';
            if (this.engine) {
                this.engine.audioManager.setSFXVolume(this.settings.sfxVolume);
            }
        });
        
        mouseSensitivity.addEventListener('input', (e) => {
            this.settings.mouseSensitivity = parseFloat(e.target.value);
            document.getElementById('mouseSensitivityValue').textContent = e.target.value;
            if (this.engine) {
                this.engine.inputManager.setMouseSensitivity(this.settings.mouseSensitivity);
            }
        });
        
        invertY.addEventListener('change', (e) => {
            this.settings.invertY = e.target.checked;
            if (this.engine) {
                this.engine.inputManager.setInvertY(this.settings.invertY);
            }
        });
    }
    
    handleKeyDown(event) {
        if (event.code === 'Escape') {
            const currentState = this.gameStateManager.getCurrentState();
            if (currentState === 'playing') {
                this.gameStateManager.pauseGame();
            } else if (currentState === 'paused') {
                this.gameStateManager.resumeGame();
            }
        }
    }
    
    // Game state management (delegated to GameStateManager)
    startGame() {
        // This method is now handled by GameStateManager
        // Keep for compatibility but delegate to state manager
        this.gameStateManager.startGame();
    }
    
    pauseGame() {
        this.gameStateManager.pauseGame();
    }
    
    resumeGame() {
        this.gameStateManager.resumeGame();
    }
    
    quitToMenu() {
        this.gameStateManager.showMainMenu();
    }
    
    // UI management
    showMainMenu() {
        this.hideAllMenus();
        this.ui.mainMenu.classList.remove('hidden');
        this.gameState = 'menu';
    }
    
    showControls() {
        this.hideAllMenus();
        this.ui.controlsScreen.classList.remove('hidden');
    }
    
    showSettings() {
        this.hideAllMenus();
        this.ui.settingsScreen.classList.remove('hidden');
    }
    
    hideAllMenus() {
        this.ui.loadingScreen.classList.add('hidden');
        this.ui.mainMenu.classList.add('hidden');
        this.ui.controlsScreen.classList.add('hidden');
        this.ui.settingsScreen.classList.add('hidden');
        this.ui.pauseMenu.classList.add('hidden');
        this.ui.clickToStart.classList.add('hidden');
    }
    
    hideClickToStart() {
        this.ui.clickToStart.classList.add('hidden');
    }
    
    updateLoadingProgress(progress, text) {
        this.loadingProgress = progress;
        this.ui.loadingProgress.style.width = progress + '%';
        this.ui.loadingText.textContent = text;
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.ui.errorDisplay.classList.remove('hidden');
    }
    
    togglePerformanceStats() {
        this.settings.showPerformanceStats = !this.settings.showPerformanceStats;
        if (this.settings.showPerformanceStats) {
            this.ui.performanceStats.classList.remove('hidden');
        } else {
            this.ui.performanceStats.classList.add('hidden');
        }
    }
    
    // Game loop
    startGameLoop() {
        let lastTime = 0;
        const gameLoop = (currentTime) => {
            const currentState = this.gameStateManager.getCurrentState();
            if (currentState === 'playing') {
                const deltaTime = currentTime - lastTime;
                lastTime = currentTime;
                
                // Update ranch game system
                if (this.ranchGame) {
                    this.ranchGame.update(deltaTime);
                }
                
                this.updatePerformanceStats(currentTime);
                this.updateHUD();
                requestAnimationFrame(gameLoop);
            }
        };
        requestAnimationFrame(gameLoop);
    }
    
    updatePerformanceStats(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            if (this.settings.showPerformanceStats) {
                document.getElementById('fpsCounter').textContent = this.fps;
                
                const renderStats = this.engine.renderer.getStats();
                document.getElementById('drawCalls').textContent = renderStats.drawCalls;
                document.getElementById('triangles').textContent = renderStats.triangles;
            }
        }
    }
    
    updateHUD() {
        // Get combat data from ranch game
        let combatData = null;
        if (this.ranchGame && this.ranchGame.combatManager) {
            const healthData = this.ranchGame.combatManager.getPlayerHealth();
            const weaponData = this.ranchGame.combatManager.getWeaponInfo();
            const enemyCount = this.ranchGame.combatManager.getEnemyCount();
            const combatStats = this.ranchGame.combatManager.getCombatStats();
            
            combatData = {
                health: healthData,
                weapon: weaponData,
                enemies: enemyCount,
                stats: combatStats
            };
            
            // Update health bar
            if (healthData) {
                const healthPercent = healthData.percentage;
                const healthBar = document.getElementById('healthBar');
                const healthText = document.getElementById('healthText');
                
                if (healthBar && healthText) {
                    healthBar.style.width = healthPercent + '%';
                    healthText.textContent = healthData.current;
                    
                    // Add low health warning
                    const healthContainer = healthBar.parentElement.parentElement;
                    if (healthPercent < 25) {
                        healthContainer.classList.add('low-health');
                    } else {
                        healthContainer.classList.remove('low-health');
                    }
                }
            }
            
            // Update weapon and ammo display
            if (weaponData) {
                const ammoCount = document.getElementById('ammoCount');
                const ammoReserve = document.getElementById('ammoReserve');
                const weaponName = document.getElementById('weaponName');
                
                if (ammoCount && ammoReserve && weaponName) {
                    ammoCount.textContent = weaponData.ammo;
                    ammoReserve.textContent = weaponData.maxAmmo;
                    weaponName.textContent = weaponData.type.toUpperCase();
                    
                    // Add low ammo warning
                    const ammoDisplay = ammoCount.parentElement;
                    if (weaponData.ammo < weaponData.maxAmmo * 0.2) {
                        ammoDisplay.classList.add('low-ammo');
                    } else {
                        ammoDisplay.classList.remove('low-ammo');
                    }
                }
            }
            
            // Update score with hogs killed
            const scoreValue = document.getElementById('scoreValue');
            if (scoreValue && combatStats) {
                scoreValue.textContent = combatStats.enemiesKilled + ' HOGS';
            }
        }
        
        // Update ranch-specific information
        if (this.ranchGame) {
            const gameStats = this.ranchGame.getGameStats();
            
            // Update current objective
            const objectiveText = document.getElementById('currentObjective');
            if (objectiveText) {
                if (gameStats.playerProgress) {
                    const keycards = Array.from(gameStats.playerProgress.keycards);
                    if (keycards.length === 0) {
                        objectiveText.textContent = 'Find keycards to access new areas';
                    } else if (keycards.length < 3) {
                        objectiveText.textContent = 'Continue searching for more keycards';
                    } else {
                        objectiveText.textContent = 'Eliminate all remaining wild hogs';
                    }
                } else {
                    objectiveText.textContent = 'Eliminate all wild hogs';
                }
            }
        }
        
        // Update game state manager with combat data
        if (combatData && this.gameStateManager) {
            this.gameStateManager.updateGameStats(combatData);
        }
        
        // Update minimap
        if (this.minimapRenderer && this.gameStateManager.getCurrentState() === 'playing') {
            this.minimapRenderer.render();
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause game when tab is not visible
        if (window.game && window.game.gameState === 'playing') {
            window.game.pauseGame();
        }
    }
});

// Export for debugging
window.Game = Game;