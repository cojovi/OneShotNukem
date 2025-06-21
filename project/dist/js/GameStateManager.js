/**
 * OneShot Predator Nukem - Game State Manager
 * Manages all game states, menus, and UI flow
 */

export class GameStateManager {
    constructor(engine) {
        this.engine = engine;
        this.currentState = 'loading';
        this.previousState = null;
        this.gameStartTime = null;
        this.gameEndTime = null;
        this.difficulty = 'normal';
        
        // Game statistics
        this.gameStats = {
            hogsKilled: 0,
            shotsFired: 0,
            accuracy: 0,
            completionTime: 0,
            difficulty: 'normal'
        };
        
        // UI elements
        this.ui = {};
        this.initializeUI();
        this.setupEventListeners();
    }
    
    initializeUI() {
        // Get existing UI elements
        this.ui.loadingScreen = document.getElementById('loadingScreen');
        this.ui.mainMenu = document.getElementById('mainMenu');
        this.ui.controlsScreen = document.getElementById('controlsScreen');
        this.ui.settingsScreen = document.getElementById('settingsScreen');
        this.ui.pauseMenu = document.getElementById('pauseMenu');
        this.ui.gameHUD = document.getElementById('gameHUD');
        this.ui.clickToStart = document.getElementById('clickToStart');
        
        // Create new UI elements
        this.createDifficultyMenu();
        this.createVictoryScreen();
        this.createGameOverScreen();
        this.enhanceHUD();
    }
    
    createDifficultyMenu() {
        const difficultyMenu = document.createElement('div');
        difficultyMenu.id = 'difficultyMenu';
        difficultyMenu.className = 'overlay hidden';
        difficultyMenu.innerHTML = `
            <div class="menu-content">
                <img src="assets/oneshot.png" alt="OneShot Predator Nukem" class="logo">
                <h2>Select Difficulty</h2>
                <div class="difficulty-options">
                    <button id="easyMode" class="difficulty-button easy">
                        <div class="difficulty-name">EASY</div>
                        <div class="difficulty-desc">More health, slower enemies</div>
                    </button>
                    <button id="normalMode" class="difficulty-button normal selected">
                        <div class="difficulty-name">NORMAL</div>
                        <div class="difficulty-desc">Balanced gameplay</div>
                    </button>
                    <button id="hardMode" class="difficulty-button hard">
                        <div class="difficulty-name">HARD</div>
                        <div class="difficulty-desc">Less health, faster enemies</div>
                    </button>
                    <button id="nightmareMode" class="difficulty-button nightmare">
                        <div class="difficulty-name">NIGHTMARE</div>
                        <div class="difficulty-desc">One shot kills, aggressive AI</div>
                    </button>
                </div>
                <div class="menu-buttons">
                    <button id="startWithDifficulty" class="menu-button">Start Game</button>
                    <button id="backFromDifficulty" class="menu-button">Back</button>
                </div>
            </div>
        `;
        
        document.getElementById('gameContainer').appendChild(difficultyMenu);
        this.ui.difficultyMenu = difficultyMenu;
    }
    
    createVictoryScreen() {
        const victoryScreen = document.createElement('div');
        victoryScreen.id = 'victoryScreen';
        victoryScreen.className = 'overlay hidden';
        victoryScreen.innerHTML = `
            <div class="victory-content">
                <div class="victory-header">
                    <img src="assets/oneshot_small.png" alt="OneShot" class="victory-logo">
                    <h1>RANCH SECURED!</h1>
                    <p>The wild hog menace has been eliminated</p>
                </div>
                
                <div class="victory-stats">
                    <div class="stat-row">
                        <span class="stat-label">Hogs Culled:</span>
                        <span id="finalHogsKilled" class="stat-value">0</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Accuracy:</span>
                        <span id="finalAccuracy" class="stat-value">0%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Completion Time:</span>
                        <span id="finalTime" class="stat-value">00:00</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Difficulty:</span>
                        <span id="finalDifficulty" class="stat-value">Normal</span>
                    </div>
                </div>
                
                <div class="victory-rank">
                    <div id="rankTitle" class="rank-title">RANCH DEFENDER</div>
                    <div id="rankDescription" class="rank-description">You've done Texas proud!</div>
                </div>
                
                <div class="leaderboard-section">
                    <h3>Local Best Times</h3>
                    <div id="leaderboardList" class="leaderboard-list">
                        <!-- Leaderboard entries will be populated here -->
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button id="playAgain" class="menu-button">Play Again</button>
                    <button id="backToMenu" class="menu-button">Main Menu</button>
                </div>
            </div>
        `;
        
        document.getElementById('gameContainer').appendChild(victoryScreen);
        this.ui.victoryScreen = victoryScreen;
    }
    
    createGameOverScreen() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.className = 'overlay hidden';
        gameOverScreen.innerHTML = `
            <div class="gameover-content">
                <div class="gameover-header">
                    <h1>GAME OVER</h1>
                    <p>The wild hogs have overrun the ranch!</p>
                </div>
                
                <div class="gameover-stats">
                    <div class="stat-row">
                        <span class="stat-label">Hogs Culled:</span>
                        <span id="gameoverHogsKilled" class="stat-value">0</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Survival Time:</span>
                        <span id="gameoverTime" class="stat-value">00:00</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Accuracy:</span>
                        <span id="gameoverAccuracy" class="stat-value">0%</span>
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button id="restartGame" class="menu-button">Try Again</button>
                    <button id="backToMenuFromGameOver" class="menu-button">Main Menu</button>
                </div>
            </div>
        `;
        
        document.getElementById('gameContainer').appendChild(gameOverScreen);
        this.ui.gameOverScreen = gameOverScreen;
    }
    
    enhanceHUD() {
        // Add additional HUD elements
        const hudEnhancements = document.createElement('div');
        hudEnhancements.id = 'hudEnhancements';
        hudEnhancements.innerHTML = `
            <div class="hud-timer">
                <div class="timer-label">TIME</div>
                <div id="gameTimer" class="timer-value">00:00</div>
            </div>
            
            <div class="hud-objectives">
                <div class="objectives-label">OBJECTIVE</div>
                <div id="currentObjective" class="objective-text">Eliminate all wild hogs</div>
            </div>
            
            <div class="hud-minimap">
                <div class="minimap-container">
                    <canvas id="minimapCanvas" width="120" height="120"></canvas>
                </div>
            </div>
        `;
        
        this.ui.gameHUD.appendChild(hudEnhancements);
    }
    
    setupEventListeners() {
        // Difficulty selection
        document.getElementById('easyMode').addEventListener('click', () => this.selectDifficulty('easy'));
        document.getElementById('normalMode').addEventListener('click', () => this.selectDifficulty('normal'));
        document.getElementById('hardMode').addEventListener('click', () => this.selectDifficulty('hard'));
        document.getElementById('nightmareMode').addEventListener('click', () => this.selectDifficulty('nightmare'));
        
        // Menu navigation
        document.getElementById('startWithDifficulty').addEventListener('click', () => this.startGameWithDifficulty());
        document.getElementById('backFromDifficulty').addEventListener('click', () => this.showMainMenu());
        
        // Victory screen
        document.getElementById('playAgain').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
        
        // Game over screen
        document.getElementById('restartGame').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuFromGameOver').addEventListener('click', () => this.showMainMenu());
        
        // Override existing start game button
        const startGameBtn = document.getElementById('startGame');
        if (startGameBtn) {
            startGameBtn.removeEventListener('click', startGameBtn.onclick);
            startGameBtn.addEventListener('click', () => this.showDifficultyMenu());
        }
        
        // Listen for game events
        this.engine.addEventListener('gameStateChange', (event) => {
            this.handleGameStateChange(event.detail);
        });
        
        this.engine.addEventListener('combatUIUpdate', (event) => {
            this.updateGameStats(event.detail);
        });
        
        this.engine.addEventListener('gameComplete', (event) => {
            this.handleGameComplete(event.detail);
        });
    }
    
    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Update UI selection
        document.querySelectorAll('.difficulty-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById(difficulty + 'Mode').classList.add('selected');
    }
    
    showDifficultyMenu() {
        this.hideAllMenus();
        this.ui.difficultyMenu.classList.remove('hidden');
        this.setState('difficulty');
    }
    
    startGameWithDifficulty() {
        this.gameStats.difficulty = this.difficulty;
        this.gameStartTime = Date.now();
        this.applyDifficultySettings();
        this.startGame();
    }
    
    applyDifficultySettings() {
        const settings = {
            easy: { playerHealth: 150, enemySpeed: 0.7, enemyDamage: 0.5 },
            normal: { playerHealth: 100, enemySpeed: 1.0, enemyDamage: 1.0 },
            hard: { playerHealth: 75, enemySpeed: 1.3, enemyDamage: 1.5 },
            nightmare: { playerHealth: 25, enemySpeed: 1.5, enemyDamage: 3.0 }
        };
        
        const difficultySettings = settings[this.difficulty];
        
        // Apply settings to game systems
        if (this.engine.combatManager) {
            this.engine.combatManager.maxPlayerHealth = difficultySettings.playerHealth;
            this.engine.combatManager.playerHealth = difficultySettings.playerHealth;
        }
        
        // Store settings for enemy spawning
        this.engine.difficultySettings = difficultySettings;
    }
    
    startGame() {
        this.setState('playing');
        this.hideAllMenus();
        this.ui.gameHUD.classList.remove('hidden');
        
        if (!this.engine.inputManager.isPointerLocked()) {
            this.ui.clickToStart.classList.remove('hidden');
        }
        
        this.engine.start();
        this.startGameTimer();
    }
    
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            if (this.currentState === 'playing') {
                const elapsed = Date.now() - this.gameStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                const timerElement = document.getElementById('gameTimer');
                if (timerElement) {
                    timerElement.textContent = timeString;
                }
            }
        }, 1000);
    }
    
    pauseGame() {
        this.setState('paused');
        this.ui.pauseMenu.classList.remove('hidden');
        this.engine.stop();
    }
    
    resumeGame() {
        this.setState('playing');
        this.ui.pauseMenu.classList.add('hidden');
        this.engine.start();
    }
    
    showMainMenu() {
        this.setState('menu');
        this.hideAllMenus();
        this.ui.mainMenu.classList.remove('hidden');
        this.ui.gameHUD.classList.add('hidden');
        this.engine.stop();
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    handleGameComplete(data) {
        this.gameEndTime = Date.now();
        this.gameStats.completionTime = this.gameEndTime - this.gameStartTime;
        this.showVictoryScreen();
    }
    
    showVictoryScreen() {
        this.setState('victory');
        this.hideAllMenus();
        
        // Update victory screen with final stats
        document.getElementById('finalHogsKilled').textContent = this.gameStats.hogsKilled;
        document.getElementById('finalAccuracy').textContent = this.gameStats.accuracy.toFixed(1) + '%';
        document.getElementById('finalDifficulty').textContent = this.difficulty.toUpperCase();
        
        const minutes = Math.floor(this.gameStats.completionTime / 60000);
        const seconds = Math.floor((this.gameStats.completionTime % 60000) / 1000);
        document.getElementById('finalTime').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Calculate rank
        this.calculateRank();
        
        // Update leaderboard
        this.updateLeaderboard();
        
        this.ui.victoryScreen.classList.remove('hidden');
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    showGameOverScreen() {
        this.setState('gameOver');
        this.hideAllMenus();
        
        // Update game over screen with stats
        document.getElementById('gameoverHogsKilled').textContent = this.gameStats.hogsKilled;
        document.getElementById('gameoverAccuracy').textContent = this.gameStats.accuracy.toFixed(1) + '%';
        
        const elapsed = Date.now() - this.gameStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('gameoverTime').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.ui.gameOverScreen.classList.remove('hidden');
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    calculateRank() {
        const { hogsKilled, accuracy, completionTime, difficulty } = this.gameStats;
        const timeInMinutes = completionTime / 60000;
        
        let rank = 'RANCH HAND';
        let description = 'You helped out on the ranch.';
        
        if (difficulty === 'nightmare' && accuracy > 80 && timeInMinutes < 10) {
            rank = 'LEGENDARY HUNTER';
            description = 'Your skills are the stuff of legend!';
        } else if (accuracy > 90 && timeInMinutes < 15) {
            rank = 'SHARPSHOOTER';
            description = 'Every shot counts with you!';
        } else if (hogsKilled > 50 && timeInMinutes < 20) {
            rank = 'HOG SLAYER';
            description = 'You showed those hogs who\'s boss!';
        } else if (accuracy > 70) {
            rank = 'MARKSMAN';
            description = 'Your aim is true and steady.';
        } else if (hogsKilled > 25) {
            rank = 'RANCH DEFENDER';
            description = 'You\'ve done Texas proud!';
        }
        
        document.getElementById('rankTitle').textContent = rank;
        document.getElementById('rankDescription').textContent = description;
    }
    
    updateLeaderboard() {
        const leaderboard = this.getLeaderboard();
        const newEntry = {
            difficulty: this.difficulty,
            hogsKilled: this.gameStats.hogsKilled,
            accuracy: this.gameStats.accuracy,
            time: this.gameStats.completionTime,
            date: new Date().toLocaleDateString()
        };
        
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => {
            // Sort by difficulty first, then by time
            const difficultyOrder = { nightmare: 4, hard: 3, normal: 2, easy: 1 };
            if (difficultyOrder[a.difficulty] !== difficultyOrder[b.difficulty]) {
                return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
            }
            return a.time - b.time;
        });
        
        // Keep only top 5 entries
        const topEntries = leaderboard.slice(0, 5);
        this.saveLeaderboard(topEntries);
        this.displayLeaderboard(topEntries);
    }
    
    getLeaderboard() {
        const stored = localStorage.getItem('oneshotPredatorLeaderboard');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveLeaderboard(leaderboard) {
        localStorage.setItem('oneshotPredatorLeaderboard', JSON.stringify(leaderboard));
    }
    
    displayLeaderboard(leaderboard) {
        const listElement = document.getElementById('leaderboardList');
        listElement.innerHTML = '';
        
        leaderboard.forEach((entry, index) => {
            const minutes = Math.floor(entry.time / 60000);
            const seconds = Math.floor((entry.time % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="difficulty">${entry.difficulty.toUpperCase()}</span>
                <span class="time">${timeString}</span>
                <span class="kills">${entry.hogsKilled} kills</span>
                <span class="accuracy">${entry.accuracy.toFixed(1)}%</span>
            `;
            
            listElement.appendChild(entryElement);
        });
        
        if (leaderboard.length === 0) {
            listElement.innerHTML = '<div class="no-entries">No entries yet</div>';
        }
    }
    
    restartGame() {
        this.gameStats = {
            hogsKilled: 0,
            shotsFired: 0,
            accuracy: 0,
            completionTime: 0,
            difficulty: this.difficulty
        };
        
        // Reset game systems
        if (this.engine.combatManager) {
            this.engine.combatManager.reset();
        }
        
        this.startGameWithDifficulty();
    }
    
    updateGameStats(combatData) {
        if (combatData.stats) {
            this.gameStats.hogsKilled = combatData.stats.enemiesKilled;
            this.gameStats.shotsFired = combatData.stats.shotsFired;
            this.gameStats.accuracy = combatData.stats.accuracy;
        }
    }
    
    handleGameStateChange(stateData) {
        const { newState } = stateData;
        
        switch (newState) {
            case 'gameOver':
                this.showGameOverScreen();
                break;
            case 'paused':
                this.pauseGame();
                break;
            case 'playing':
                if (this.currentState === 'paused') {
                    this.resumeGame();
                }
                break;
        }
    }
    
    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        console.log(`Game state changed: ${this.previousState} -> ${this.currentState}`);
    }
    
    hideAllMenus() {
        const menus = [
            this.ui.loadingScreen,
            this.ui.mainMenu,
            this.ui.controlsScreen,
            this.ui.settingsScreen,
            this.ui.pauseMenu,
            this.ui.difficultyMenu,
            this.ui.victoryScreen,
            this.ui.gameOverScreen,
            this.ui.clickToStart
        ];
        
        menus.forEach(menu => {
            if (menu) {
                menu.classList.add('hidden');
            }
        });
    }
    
    getCurrentState() {
        return this.currentState;
    }
    
    getGameStats() {
        return { ...this.gameStats };
    }
}