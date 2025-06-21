/**
 * OneShot Predator Nukem - Weapon System
 * Handles all weapon mechanics including rifle, shotgun, and TNT
 */

import { GameObject, Component } from '../engine/core/GameObject.js';

export class WeaponSystem extends Component {
    constructor() {
        super();
        this.weapons = new Map();
        this.currentWeapon = null;
        this.ammo = {
            rifle: 30,
            shotgun: 12,
            tnt: 3
        };
        this.maxAmmo = {
            rifle: 100,
            shotgun: 50,
            tnt: 10
        };
    }

    onAttach() {
        // Initialize weapons
        this.initializeWeapons();
        
        // Set starting weapon
        this.switchWeapon('rifle');
    }

    initializeWeapons() {
        // Lever-action rifle (starting weapon)
        this.weapons.set('rifle', new LeverActionRifle(this.gameObject.engine));
        
        // Pump shotgun (pickup weapon)
        this.weapons.set('shotgun', new PumpShotgun(this.gameObject.engine));
        
        // TX-TNT bundles
        this.weapons.set('tnt', new TNTBundle(this.gameObject.engine));
    }

    switchWeapon(weaponName) {
        if (this.weapons.has(weaponName)) {
            this.currentWeapon = this.weapons.get(weaponName);
            console.log(`Switched to ${weaponName}`);
            return true;
        }
        return false;
    }

    fire(position, direction) {
        if (!this.currentWeapon) return false;
        
        const weaponType = this.getCurrentWeaponType();
        if (this.ammo[weaponType] <= 0) {
            // Play empty click sound
            this.gameObject.engine.audioManager.playSound('empty_click');
            return false;
        }

        const success = this.currentWeapon.fire(position, direction);
        if (success) {
            this.ammo[weaponType]--;
            return true;
        }
        return false;
    }

    reload() {
        if (!this.currentWeapon) return false;
        
        const weaponType = this.getCurrentWeaponType();
        const maxClip = this.currentWeapon.clipSize;
        const currentAmmo = this.ammo[weaponType];
        const maxAmmo = this.maxAmmo[weaponType];
        
        if (currentAmmo < maxClip && maxAmmo > currentAmmo) {
            const reloadAmount = Math.min(maxClip - currentAmmo, maxAmmo - currentAmmo);
            this.ammo[weaponType] += reloadAmount;
            
            // Play reload sound
            this.currentWeapon.playReloadSound();
            return true;
        }
        return false;
    }

    addAmmo(weaponType, amount) {
        if (this.ammo.hasOwnProperty(weaponType)) {
            this.ammo[weaponType] = Math.min(
                this.ammo[weaponType] + amount,
                this.maxAmmo[weaponType]
            );
            return true;
        }
        return false;
    }

    getCurrentWeaponType() {
        for (const [type, weapon] of this.weapons) {
            if (weapon === this.currentWeapon) {
                return type;
            }
        }
        return null;
    }

    getAmmoCount(weaponType = null) {
        const type = weaponType || this.getCurrentWeaponType();
        return this.ammo[type] || 0;
    }

    update(deltaTime) {
        if (this.currentWeapon) {
            this.currentWeapon.update(deltaTime);
        }
    }
}

// Base weapon class
class Weapon {
    constructor(engine) {
        this.engine = engine;
        this.damage = 10;
        this.fireRate = 1000; // ms between shots
        this.lastFireTime = 0;
        this.clipSize = 10;
        this.reloadTime = 2000;
        this.isReloading = false;
        this.projectileSpeed = 50;
        this.range = 100;
    }

    canFire() {
        const currentTime = performance.now();
        return !this.isReloading && (currentTime - this.lastFireTime) >= this.fireRate;
    }

    fire(position, direction) {
        if (!this.canFire()) return false;
        
        this.lastFireTime = performance.now();
        this.createProjectile(position, direction);
        this.playFireSound();
        return true;
    }

    createProjectile(position, direction) {
        // Override in derived classes
    }

    playFireSound() {
        this.engine.audioManager.playSound('gunshot');
    }

    playReloadSound() {
        // Override in derived classes for specific reload sounds
        this.engine.audioManager.playSound('reload');
    }

    update(deltaTime) {
        // Handle reload timing
        if (this.isReloading) {
            // Reload logic handled by WeaponSystem
        }
    }
}

// Lever-action rifle implementation
class LeverActionRifle extends Weapon {
    constructor(engine) {
        super(engine);
        this.damage = 25;
        this.fireRate = 800; // Slower than modern rifles
        this.clipSize = 8;
        this.reloadTime = 1500;
        this.projectileSpeed = 80;
        this.range = 150;
    }

    createProjectile(position, direction) {
        const projectile = new RifleProjectile(this.engine, position, direction, this.damage);
        this.engine.addGameObject(projectile);
    }

    playFireSound() {
        this.engine.audioManager.playSound('gunshot');
    }
}

// Pump shotgun implementation
class PumpShotgun extends Weapon {
    constructor(engine) {
        super(engine);
        this.damage = 15; // Per pellet
        this.pelletCount = 6;
        this.fireRate = 1200; // Slower pump action
        this.clipSize = 6;
        this.reloadTime = 2500;
        this.projectileSpeed = 60;
        this.range = 80;
        this.spread = 0.3; // Radians
    }

    createProjectile(position, direction) {
        // Create multiple pellets for shotgun spread
        for (let i = 0; i < this.pelletCount; i++) {
            const spreadDirection = this.addSpread(direction, this.spread);
            const projectile = new ShotgunPellet(this.engine, position, spreadDirection, this.damage);
            this.engine.addGameObject(projectile);
        }
    }

    addSpread(direction, spread) {
        const spreadDir = new Float32Array(3);
        const randomSpread = (Math.random() - 0.5) * spread;
        const randomSpread2 = (Math.random() - 0.5) * spread;
        
        // Add random spread to direction
        spreadDir[0] = direction[0] + randomSpread;
        spreadDir[1] = direction[1] + randomSpread2;
        spreadDir[2] = direction[2];
        
        // Normalize
        const length = Math.sqrt(spreadDir[0]*spreadDir[0] + spreadDir[1]*spreadDir[1] + spreadDir[2]*spreadDir[2]);
        spreadDir[0] /= length;
        spreadDir[1] /= length;
        spreadDir[2] /= length;
        
        return spreadDir;
    }

    playFireSound() {
        this.engine.audioManager.playSound('shotgun_blast');
    }
}

// TNT bundle implementation
class TNTBundle extends Weapon {
    constructor(engine) {
        super(engine);
        this.damage = 100; // High explosive damage
        this.fireRate = 2000; // Slow throwing rate
        this.clipSize = 1;
        this.reloadTime = 3000;
        this.projectileSpeed = 25;
        this.range = 50;
        this.explosionRadius = 8;
    }

    createProjectile(position, direction) {
        const projectile = new TNTProjectile(this.engine, position, direction, this.damage, this.explosionRadius);
        this.engine.addGameObject(projectile);
    }

    playFireSound() {
        this.engine.audioManager.playSound('tnt_throw');
    }
}

// Projectile classes
class Projectile extends GameObject {
    constructor(engine, position, direction, damage, name = 'Projectile') {
        super(name);
        this.engine = engine;
        this.damage = damage;
        this.speed = 50;
        this.lifetime = 3000; // 3 seconds
        this.age = 0;
        
        // Set initial position and velocity
        this.setPosition(position[0], position[1], position[2]);
        this.velocity[0] = direction[0] * this.speed;
        this.velocity[1] = direction[1] * this.speed;
        this.velocity[2] = direction[2] * this.speed;
        
        // Create collider for projectile
        this.setupCollider();
    }

    setupCollider() {
        const collider = this.engine.collisionSystem.createSphereCollider(
            this, 0.1, [0, 0, 0], this.engine.collisionSystem.layers.PROJECTILE
        );
        this.setCollider(collider);
        this.engine.collisionSystem.addCollider(collider);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Check for collisions
        this.checkCollisions();
    }

    checkCollisions() {
        // Check collision with enemies and environment
        const collisions = this.engine.collisionSystem.getCollisions(this.collider);
        
        for (const collision of collisions) {
            const other = collision.gameObject;
            
            // Hit enemy
            if (other.hasComponent && other.hasComponent(EnemyAI)) {
                this.hitEnemy(other);
                this.destroy();
                return;
            }
            
            // Hit environment
            if (collision.layer === this.engine.collisionSystem.layers.ENVIRONMENT) {
                this.hitEnvironment(collision);
                this.destroy();
                return;
            }
        }
    }

    hitEnemy(enemy) {
        // Deal damage to enemy
        const enemyAI = enemy.getComponent(EnemyAI);
        if (enemyAI) {
            enemyAI.takeDamage(this.damage);
        }
    }

    hitEnvironment(collision) {
        // Create impact effect
        this.createImpactEffect(collision.point);
    }

    createImpactEffect(position) {
        // Create visual/audio impact effect
        this.engine.audioManager.playSound('bullet_impact', position);
    }

    destroy() {
        if (this.collider) {
            this.engine.collisionSystem.removeCollider(this.collider);
        }
        super.destroy();
    }
}

class RifleProjectile extends Projectile {
    constructor(engine, position, direction, damage) {
        super(engine, position, direction, damage, 'RifleProjectile');
        this.speed = 80;
        this.lifetime = 2000;
    }
}

class ShotgunPellet extends Projectile {
    constructor(engine, position, direction, damage) {
        super(engine, position, direction, damage, 'ShotgunPellet');
        this.speed = 60;
        this.lifetime = 1500;
    }
}

class TNTProjectile extends Projectile {
    constructor(engine, position, direction, damage, explosionRadius) {
        super(engine, position, direction, damage, 'TNTProjectile');
        this.speed = 25;
        this.lifetime = 5000;
        this.explosionRadius = explosionRadius;
        this.fuseTime = 3000; // 3 second fuse
        this.hasExploded = false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Check fuse timer
        if (this.age >= this.fuseTime && !this.hasExploded) {
            this.explode();
        }
    }

    hitEnvironment(collision) {
        // TNT explodes on impact
        this.explode();
    }

    explode() {
        if (this.hasExploded) return;
        this.hasExploded = true;
        
        // Create explosion effect
        this.createExplosion();
        
        // Damage all enemies in radius
        this.damageEnemiesInRadius();
        
        // Play explosion sound
        this.engine.audioManager.playSound('explosion', this.position);
        
        this.destroy();
    }

    createExplosion() {
        // Create visual explosion effect
        console.log(`TNT explosion at position: ${this.position}`);
    }

    damageEnemiesInRadius() {
        // Find all enemies within explosion radius
        const enemies = this.engine.gameObjects.filter(obj => 
            obj.hasComponent && obj.hasComponent(EnemyAI)
        );
        
        for (const enemy of enemies) {
            const distance = this.getDistanceTo(enemy);
            if (distance <= this.explosionRadius) {
                // Damage falls off with distance
                const damageFalloff = 1 - (distance / this.explosionRadius);
                const finalDamage = this.damage * damageFalloff;
                
                const enemyAI = enemy.getComponent(EnemyAI);
                if (enemyAI) {
                    enemyAI.takeDamage(finalDamage);
                }
            }
        }
    }
}

// Import EnemyAI class (will be defined in EnemySystem.js)
let EnemyAI;
export function setEnemyAIClass(enemyAIClass) {
    EnemyAI = enemyAIClass;
}