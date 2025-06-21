/**
 * OneShot Predator Nukem - Collision System
 * Handles efficient collision detection for 3D game objects
 */

export class CollisionSystem {
    constructor() {
        this.colliders = [];
        this.staticColliders = [];
        this.dynamicColliders = [];
        
        // Spatial partitioning grid
        this.gridSize = 10.0;
        this.grid = new Map();
        
        // Collision layers
        this.layers = {
            PLAYER: 1,
            ENEMY: 2,
            PROJECTILE: 4,
            ENVIRONMENT: 8,
            PICKUP: 16
        };
        
        // Collision callbacks
        this.collisionCallbacks = new Map();
    }
    
    // Add collider to the system
    addCollider(collider) {
        this.colliders.push(collider);
        
        if (collider.isStatic) {
            this.staticColliders.push(collider);
        } else {
            this.dynamicColliders.push(collider);
        }
        
        this.updateGridPosition(collider);
    }
    
    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index > -1) {
            this.colliders.splice(index, 1);
        }
        
        const staticIndex = this.staticColliders.indexOf(collider);
        if (staticIndex > -1) {
            this.staticColliders.splice(staticIndex, 1);
        }
        
        const dynamicIndex = this.dynamicColliders.indexOf(collider);
        if (dynamicIndex > -1) {
            this.dynamicColliders.splice(dynamicIndex, 1);
        }
        
        this.removeFromGrid(collider);
    }
    
    // Create different types of colliders
    createBoxCollider(gameObject, size, offset = [0, 0, 0], layer = this.layers.ENVIRONMENT) {
        return {
            gameObject: gameObject,
            type: 'box',
            size: size, // [width, height, depth]
            offset: offset,
            layer: layer,
            isStatic: gameObject.isStatic || false,
            isTrigger: false,
            gridCells: new Set()
        };
    }
    
    createSphereCollider(gameObject, radius, offset = [0, 0, 0], layer = this.layers.ENVIRONMENT) {
        return {
            gameObject: gameObject,
            type: 'sphere',
            radius: radius,
            offset: offset,
            layer: layer,
            isStatic: gameObject.isStatic || false,
            isTrigger: false,
            gridCells: new Set()
        };
    }
    
    createCapsuleCollider(gameObject, radius, height, offset = [0, 0, 0], layer = this.layers.PLAYER) {
        return {
            gameObject: gameObject,
            type: 'capsule',
            radius: radius,
            height: height,
            offset: offset,
            layer: layer,
            isStatic: false,
            isTrigger: false,
            gridCells: new Set()
        };
    }
    
    // Spatial grid management
    getGridKey(x, z) {
        const gridX = Math.floor(x / this.gridSize);
        const gridZ = Math.floor(z / this.gridSize);
        return `${gridX},${gridZ}`;
    }
    
    updateGridPosition(collider) {
        // Remove from old grid cells
        this.removeFromGrid(collider);
        
        // Get collider bounds
        const bounds = this.getColliderBounds(collider);
        
        // Add to new grid cells
        const minGridX = Math.floor(bounds.min[0] / this.gridSize);
        const maxGridX = Math.floor(bounds.max[0] / this.gridSize);
        const minGridZ = Math.floor(bounds.min[2] / this.gridSize);
        const maxGridZ = Math.floor(bounds.max[2] / this.gridSize);
        
        for (let x = minGridX; x <= maxGridX; x++) {
            for (let z = minGridZ; z <= maxGridZ; z++) {
                const key = `${x},${z}`;
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                this.grid.get(key).add(collider);
                collider.gridCells.add(key);
            }
        }
    }
    
    removeFromGrid(collider) {
        for (const key of collider.gridCells) {
            const cell = this.grid.get(key);
            if (cell) {
                cell.delete(collider);
                if (cell.size === 0) {
                    this.grid.delete(key);
                }
            }
        }
        collider.gridCells.clear();
    }
    
    // Get potential collision candidates using spatial grid
    getPotentialCollisions(collider) {
        const candidates = new Set();
        
        for (const key of collider.gridCells) {
            const cell = this.grid.get(key);
            if (cell) {
                for (const other of cell) {
                    if (other !== collider) {
                        candidates.add(other);
                    }
                }
            }
        }
        
        return Array.from(candidates);
    }
    
    // Main update method
    update(gameObjects) {
        // Update dynamic collider positions
        for (const collider of this.dynamicColliders) {
            this.updateGridPosition(collider);
        }
        
        // Check collisions for dynamic objects
        for (const collider of this.dynamicColliders) {
            this.checkCollisions(collider);
        }
    }
    
    checkCollisions(collider) {
        const candidates = this.getPotentialCollisions(collider);
        
        for (const other of candidates) {
            // Skip if same layer collision not allowed
            if (!this.shouldCollide(collider.layer, other.layer)) {
                continue;
            }
            
            const collision = this.testCollision(collider, other);
            if (collision) {
                this.handleCollision(collider, other, collision);
            }
        }
    }
    
    shouldCollide(layer1, layer2) {
        // Define collision matrix
        const collisionMatrix = {
            [this.layers.PLAYER]: [this.layers.ENEMY, this.layers.ENVIRONMENT, this.layers.PICKUP],
            [this.layers.ENEMY]: [this.layers.PLAYER, this.layers.PROJECTILE, this.layers.ENVIRONMENT],
            [this.layers.PROJECTILE]: [this.layers.ENEMY, this.layers.ENVIRONMENT],
            [this.layers.ENVIRONMENT]: [this.layers.PLAYER, this.layers.ENEMY, this.layers.PROJECTILE],
            [this.layers.PICKUP]: [this.layers.PLAYER]
        };
        
        return collisionMatrix[layer1] && collisionMatrix[layer1].includes(layer2);
    }
    
    // Collision detection methods
    testCollision(collider1, collider2) {
        if (collider1.type === 'box' && collider2.type === 'box') {
            return this.testBoxBox(collider1, collider2);
        } else if (collider1.type === 'sphere' && collider2.type === 'sphere') {
            return this.testSphereSphere(collider1, collider2);
        } else if (collider1.type === 'box' && collider2.type === 'sphere') {
            return this.testBoxSphere(collider1, collider2);
        } else if (collider1.type === 'sphere' && collider2.type === 'box') {
            return this.testBoxSphere(collider2, collider1);
        } else if (collider1.type === 'capsule') {
            return this.testCapsuleCollision(collider1, collider2);
        } else if (collider2.type === 'capsule') {
            return this.testCapsuleCollision(collider2, collider1);
        }
        
        return null;
    }
    
    testBoxBox(box1, box2) {
        const pos1 = this.getColliderPosition(box1);
        const pos2 = this.getColliderPosition(box2);
        
        const halfSize1 = [box1.size[0] / 2, box1.size[1] / 2, box1.size[2] / 2];
        const halfSize2 = [box2.size[0] / 2, box2.size[1] / 2, box2.size[2] / 2];
        
        const dx = Math.abs(pos1[0] - pos2[0]);
        const dy = Math.abs(pos1[1] - pos2[1]);
        const dz = Math.abs(pos1[2] - pos2[2]);
        
        if (dx < halfSize1[0] + halfSize2[0] &&
            dy < halfSize1[1] + halfSize2[1] &&
            dz < halfSize1[2] + halfSize2[2]) {
            
            // Calculate penetration
            const penetrationX = halfSize1[0] + halfSize2[0] - dx;
            const penetrationY = halfSize1[1] + halfSize2[1] - dy;
            const penetrationZ = halfSize1[2] + halfSize2[2] - dz;
            
            // Find minimum penetration axis
            let normal = [0, 0, 0];
            let penetration = 0;
            
            if (penetrationX <= penetrationY && penetrationX <= penetrationZ) {
                normal[0] = pos1[0] < pos2[0] ? -1 : 1;
                penetration = penetrationX;
            } else if (penetrationY <= penetrationZ) {
                normal[1] = pos1[1] < pos2[1] ? -1 : 1;
                penetration = penetrationY;
            } else {
                normal[2] = pos1[2] < pos2[2] ? -1 : 1;
                penetration = penetrationZ;
            }
            
            return {
                normal: normal,
                penetration: penetration,
                point: [(pos1[0] + pos2[0]) / 2, (pos1[1] + pos2[1]) / 2, (pos1[2] + pos2[2]) / 2]
            };
        }
        
        return null;
    }
    
    testSphereSphere(sphere1, sphere2) {
        const pos1 = this.getColliderPosition(sphere1);
        const pos2 = this.getColliderPosition(sphere2);
        
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const combinedRadius = sphere1.radius + sphere2.radius;
        
        if (distance < combinedRadius) {
            const penetration = combinedRadius - distance;
            const normal = distance > 0 ? [dx / distance, dy / distance, dz / distance] : [1, 0, 0];
            
            return {
                normal: normal,
                penetration: penetration,
                point: [
                    pos1[0] - normal[0] * sphere1.radius,
                    pos1[1] - normal[1] * sphere1.radius,
                    pos1[2] - normal[2] * sphere1.radius
                ]
            };
        }
        
        return null;
    }
    
    testBoxSphere(box, sphere) {
        const boxPos = this.getColliderPosition(box);
        const spherePos = this.getColliderPosition(sphere);
        
        const halfSize = [box.size[0] / 2, box.size[1] / 2, box.size[2] / 2];
        
        // Find closest point on box to sphere center
        const closest = [
            Math.max(boxPos[0] - halfSize[0], Math.min(spherePos[0], boxPos[0] + halfSize[0])),
            Math.max(boxPos[1] - halfSize[1], Math.min(spherePos[1], boxPos[1] + halfSize[1])),
            Math.max(boxPos[2] - halfSize[2], Math.min(spherePos[2], boxPos[2] + halfSize[2]))
        ];
        
        const dx = spherePos[0] - closest[0];
        const dy = spherePos[1] - closest[1];
        const dz = spherePos[2] - closest[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < sphere.radius) {
            const penetration = sphere.radius - distance;
            const normal = distance > 0 ? [dx / distance, dy / distance, dz / distance] : [0, 1, 0];
            
            return {
                normal: normal,
                penetration: penetration,
                point: closest
            };
        }
        
        return null;
    }
    
    testCapsuleCollision(capsule, other) {
        // Simplified capsule collision (treat as sphere for now)
        const sphereCollider = {
            ...capsule,
            type: 'sphere',
            radius: capsule.radius
        };
        
        return this.testCollision(sphereCollider, other);
    }
    
    // Utility methods
    getColliderPosition(collider) {
        const gameObject = collider.gameObject;
        const pos = gameObject.position || [0, 0, 0];
        
        return [
            pos[0] + collider.offset[0],
            pos[1] + collider.offset[1],
            pos[2] + collider.offset[2]
        ];
    }
    
    getColliderBounds(collider) {
        const pos = this.getColliderPosition(collider);
        
        if (collider.type === 'box') {
            const halfSize = [collider.size[0] / 2, collider.size[1] / 2, collider.size[2] / 2];
            return {
                min: [pos[0] - halfSize[0], pos[1] - halfSize[1], pos[2] - halfSize[2]],
                max: [pos[0] + halfSize[0], pos[1] + halfSize[1], pos[2] + halfSize[2]]
            };
        } else if (collider.type === 'sphere') {
            return {
                min: [pos[0] - collider.radius, pos[1] - collider.radius, pos[2] - collider.radius],
                max: [pos[0] + collider.radius, pos[1] + collider.radius, pos[2] + collider.radius]
            };
        } else if (collider.type === 'capsule') {
            const halfHeight = collider.height / 2;
            return {
                min: [pos[0] - collider.radius, pos[1] - halfHeight - collider.radius, pos[2] - collider.radius],
                max: [pos[0] + collider.radius, pos[1] + halfHeight + collider.radius, pos[2] + collider.radius]
            };
        }
        
        return { min: pos, max: pos };
    }
    
    // Collision response
    handleCollision(collider1, collider2, collision) {
        // Trigger callbacks
        const callback1 = this.collisionCallbacks.get(collider1.gameObject);
        const callback2 = this.collisionCallbacks.get(collider2.gameObject);
        
        if (callback1) {
            callback1(collider2.gameObject, collision);
        }
        if (callback2) {
            callback2(collider1.gameObject, { ...collision, normal: [-collision.normal[0], -collision.normal[1], -collision.normal[2]] });
        }
        
        // Apply physics response for non-trigger colliders
        if (!collider1.isTrigger && !collider2.isTrigger) {
            this.resolveCollision(collider1, collider2, collision);
        }
    }
    
    resolveCollision(collider1, collider2, collision) {
        // Simple position correction
        if (!collider1.isStatic && !collider2.isStatic) {
            // Both dynamic - split correction
            const correction = collision.penetration / 2;
            this.moveGameObject(collider1.gameObject, [
                collision.normal[0] * correction,
                collision.normal[1] * correction,
                collision.normal[2] * correction
            ]);
            this.moveGameObject(collider2.gameObject, [
                -collision.normal[0] * correction,
                -collision.normal[1] * correction,
                -collision.normal[2] * correction
            ]);
        } else if (!collider1.isStatic) {
            // Only collider1 is dynamic
            this.moveGameObject(collider1.gameObject, [
                collision.normal[0] * collision.penetration,
                collision.normal[1] * collision.penetration,
                collision.normal[2] * collision.penetration
            ]);
        } else if (!collider2.isStatic) {
            // Only collider2 is dynamic
            this.moveGameObject(collider2.gameObject, [
                -collision.normal[0] * collision.penetration,
                -collision.normal[1] * collision.penetration,
                -collision.normal[2] * collision.penetration
            ]);
        }
    }
    
    moveGameObject(gameObject, offset) {
        if (gameObject.position) {
            gameObject.position[0] += offset[0];
            gameObject.position[1] += offset[1];
            gameObject.position[2] += offset[2];
        }
    }
    
    // Callback registration
    setCollisionCallback(gameObject, callback) {
        this.collisionCallbacks.set(gameObject, callback);
    }
    
    removeCollisionCallback(gameObject) {
        this.collisionCallbacks.delete(gameObject);
    }
    
    // Raycast
    raycast(origin, direction, maxDistance = 100, layerMask = 0xFFFFFFFF) {
        const hits = [];
        
        // Simple raycast implementation
        for (const collider of this.colliders) {
            if (!(collider.layer & layerMask)) continue;
            
            const hit = this.raycastCollider(origin, direction, maxDistance, collider);
            if (hit) {
                hits.push(hit);
            }
        }
        
        // Sort by distance
        hits.sort((a, b) => a.distance - b.distance);
        return hits;
    }
    
    raycastCollider(origin, direction, maxDistance, collider) {
        // Simplified ray-box intersection
        if (collider.type === 'box') {
            const bounds = this.getColliderBounds(collider);
            const t = this.rayBoxIntersection(origin, direction, bounds.min, bounds.max);
            
            if (t >= 0 && t <= maxDistance) {
                const point = [
                    origin[0] + direction[0] * t,
                    origin[1] + direction[1] * t,
                    origin[2] + direction[2] * t
                ];
                
                return {
                    gameObject: collider.gameObject,
                    distance: t,
                    point: point,
                    normal: [0, 1, 0] // Simplified normal
                };
            }
        }
        
        return null;
    }
    
    rayBoxIntersection(origin, direction, boxMin, boxMax) {
        let tMin = 0;
        let tMax = Infinity;
        
        for (let i = 0; i < 3; i++) {
            if (Math.abs(direction[i]) < 1e-6) {
                if (origin[i] < boxMin[i] || origin[i] > boxMax[i]) {
                    return -1;
                }
            } else {
                const t1 = (boxMin[i] - origin[i]) / direction[i];
                const t2 = (boxMax[i] - origin[i]) / direction[i];
                
                const tNear = Math.min(t1, t2);
                const tFar = Math.max(t1, t2);
                
                tMin = Math.max(tMin, tNear);
                tMax = Math.min(tMax, tFar);
                
                if (tMin > tMax) {
                    return -1;
                }
            }
        }
        
        return tMin >= 0 ? tMin : tMax;
    }
    
    // Get all collisions for a specific collider
    getCollisions(collider) {
        const collisions = [];
        const candidates = this.getPotentialCollisions(collider);
        
        for (const other of candidates) {
            // Skip if same layer collision not allowed
            if (!this.shouldCollide(collider.layer, other.layer)) {
                continue;
            }
            
            const collision = this.testCollision(collider, other);
            if (collision) {
                collisions.push({
                    gameObject: other.gameObject,
                    layer: other.layer,
                    point: collision.point,
                    normal: collision.normal,
                    penetration: collision.penetration
                });
            }
        }
        
        return collisions;
    }
    
    // Cleanup
    cleanup() {
        this.colliders.length = 0;
        this.staticColliders.length = 0;
        this.dynamicColliders.length = 0;
        this.grid.clear();
        this.collisionCallbacks.clear();
    }
}