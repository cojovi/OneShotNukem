/**
 * OneShot Predator Nukem - Combat UI System
 * Displays health, ammo, weapon info, and combat stats
 */

export class CombatUI {
    constructor(engine) {
        this.engine = engine;
        this.hudElement = null;
        this.healthBar = null;
        this.ammoDisplay = null;
        this.weaponDisplay = null;
        this.enemyCounter = null;
        this.crosshair = null;
        
        this.createHUD();
        this.setupEventListeners();
    }

    createHUD() {
        // Create main HUD container
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'combat-hud';
        this.hudElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Courier New', monospace;
            color: #ff6600;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;

        // Create crosshair
        this.crosshair = document.createElement('div');
        this.crosshair.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid #ff6600;
            border-radius: 50%;
            opacity: 0.8;
        `;
        this.hudElement.appendChild(this.crosshair);

        // Create health bar
        const healthContainer = document.createElement('div');
        healthContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 200px;
            height: 30px;
            background: rgba(0,0,0,0.7);
            border: 2px solid #ff6600;
            border-radius: 5px;
        `;

        this.healthBar = document.createElement('div');
        this.healthBar.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00);
            border-radius: 3px;
            transition: width 0.3s ease;
        `;
        healthContainer.appendChild(this.healthBar);

        const healthLabel = document.createElement('div');
        healthLabel.textContent = 'HEALTH';
        healthLabel.style.cssText = `
            position: absolute;
            top: -25px;
            left: 0;
            font-size: 14px;
            font-weight: bold;
        `;
        healthContainer.appendChild(healthLabel);

        this.hudElement.appendChild(healthContainer);

        // Create ammo display
        this.ammoDisplay = document.createElement('div');
        this.ammoDisplay.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 24px;
            font-weight: bold;
            text-align: right;
        `;
        this.hudElement.appendChild(this.ammoDisplay);

        // Create weapon display
        this.weaponDisplay = document.createElement('div');
        this.weaponDisplay.style.cssText = `
            position: absolute;
            bottom: 80px;
            right: 20px;
            font-size: 18px;
            font-weight: bold;
            text-align: right;
        `;
        this.hudElement.appendChild(this.weaponDisplay);

        // Create enemy counter
        this.enemyCounter = document.createElement('div');
        this.enemyCounter.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 16px;
            font-weight: bold;
            text-align: right;
        `;
        this.hudElement.appendChild(this.enemyCounter);

        // Create stats display
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 14px;
            line-height: 1.4;
        `;
        this.hudElement.appendChild(this.statsDisplay);

        // Add to document
        document.body.appendChild(this.hudElement);
    }

    setupEventListeners() {
        // Listen for combat UI updates
        this.engine.addEventListener('combatUIUpdate', (event) => {
            this.updateHUD(event.detail);
        });

        // Listen for damage effects
        this.engine.addEventListener('playerDamage', (event) => {
            this.showDamageEffect();
        });
    }

    updateHUD(data) {
        // Update health bar
        if (data.health) {
            const healthPercent = data.health.percentage;
            this.healthBar.style.width = `${healthPercent}%`;
            
            // Change color based on health
            if (healthPercent > 60) {
                this.healthBar.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
            } else if (healthPercent > 30) {
                this.healthBar.style.background = 'linear-gradient(90deg, #ffff00, #ff6600)';
            } else {
                this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
            }
        }

        // Update ammo display
        if (data.weapon) {
            this.ammoDisplay.innerHTML = `
                <div>AMMO: ${data.weapon.ammo}</div>
                <div style="font-size: 14px; opacity: 0.8;">MAX: ${data.weapon.maxAmmo}</div>
            `;
            
            // Update weapon display
            this.weaponDisplay.innerHTML = `
                <div>${data.weapon.type.toUpperCase()}</div>
                <div style="font-size: 12px; opacity: 0.8;">
                    ${data.weapon.canFire ? 'READY' : 'RELOADING'}
                </div>
            `;
        }

        // Update enemy counter
        if (data.enemies !== undefined) {
            this.enemyCounter.innerHTML = `
                <div>ENEMIES: ${data.enemies}</div>
            `;
        }

        // Update stats
        if (data.stats) {
            this.statsDisplay.innerHTML = `
                <div>KILLS: ${data.stats.enemiesKilled}</div>
                <div>SHOTS: ${data.stats.shotsFired}</div>
                <div>ACCURACY: ${data.stats.accuracy.toFixed(1)}%</div>
            `;
        }
    }

    showDamageEffect() {
        // Create red flash overlay
        const damageOverlay = document.createElement('div');
        damageOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 999;
            animation: damageFlash 0.3s ease-out;
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes damageFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(damageOverlay);

        // Remove after animation
        setTimeout(() => {
            if (damageOverlay.parentNode) {
                damageOverlay.parentNode.removeChild(damageOverlay);
            }
        }, 300);
    }

    showMuzzleFlash() {
        // Create muzzle flash effect on crosshair
        this.crosshair.style.boxShadow = '0 0 20px #ffff00, 0 0 40px #ff6600';
        this.crosshair.style.borderColor = '#ffff00';
        
        setTimeout(() => {
            this.crosshair.style.boxShadow = 'none';
            this.crosshair.style.borderColor = '#ff6600';
        }, 100);
    }

    showHitMarker() {
        // Create hit marker
        const hitMarker = document.createElement('div');
        hitMarker.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            margin: -20px 0 0 -20px;
            border: 3px solid #ff0000;
            transform: rotate(45deg);
            opacity: 1;
            animation: hitMarkerFade 0.5s ease-out;
        `;

        // Add CSS animation for hit marker
        const style = document.createElement('style');
        style.textContent = `
            @keyframes hitMarkerFade {
                0% { opacity: 1; transform: rotate(45deg) scale(1); }
                100% { opacity: 0; transform: rotate(45deg) scale(1.5); }
            }
        `;
        document.head.appendChild(style);

        this.hudElement.appendChild(hitMarker);

        // Remove after animation
        setTimeout(() => {
            if (hitMarker.parentNode) {
                hitMarker.parentNode.removeChild(hitMarker);
            }
        }, 500);
    }

    showKillFeed(enemyType) {
        // Create kill notification
        const killNotification = document.createElement('div');
        killNotification.style.cssText = `
            position: absolute;
            top: 100px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #ff6600;
            border-radius: 5px;
            padding: 10px;
            font-size: 16px;
            font-weight: bold;
            animation: killFeedSlide 3s ease-out;
        `;
        killNotification.textContent = `WILD ${enemyType.toUpperCase()} ELIMINATED`;

        // Add CSS animation for kill feed
        const style = document.createElement('style');
        style.textContent = `
            @keyframes killFeedSlide {
                0% { transform: translateX(100%); opacity: 0; }
                10% { transform: translateX(0); opacity: 1; }
                90% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        this.hudElement.appendChild(killNotification);

        // Remove after animation
        setTimeout(() => {
            if (killNotification.parentNode) {
                killNotification.parentNode.removeChild(killNotification);
            }
        }, 3000);
    }

    showGameOver() {
        // Create game over screen
        const gameOverScreen = document.createElement('div');
        gameOverScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            font-size: 48px;
            font-weight: bold;
            color: #ff0000;
            text-shadow: 4px 4px 8px rgba(0,0,0,1);
        `;

        gameOverScreen.innerHTML = `
            <div>GAME OVER</div>
            <div style="font-size: 24px; margin-top: 20px; color: #ff6600;">
                The wild hogs have overrun the ranch!
            </div>
            <div style="font-size: 16px; margin-top: 40px; color: #ffffff;">
                Press R to restart
            </div>
        `;

        document.body.appendChild(gameOverScreen);
    }

    hide() {
        if (this.hudElement) {
            this.hudElement.style.display = 'none';
        }
    }

    show() {
        if (this.hudElement) {
            this.hudElement.style.display = 'block';
        }
    }

    cleanup() {
        if (this.hudElement && this.hudElement.parentNode) {
            this.hudElement.parentNode.removeChild(this.hudElement);
        }
    }
}