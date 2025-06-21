/**
 * OneShot Predator Nukem - Ranch Level Definitions
 * Defines the ranch environment levels using available textures
 */

export const RanchLevels = {
    /**
     * Level 1: Ranch Entrance - Starting area with basic fencing and barn
     */
    ranch_entrance: {
        id: 'ranch_entrance',
        name: 'Ranch Entrance',
        description: 'The main entrance to the Texas ranch',
        
        // Spawn points for player
        spawnPoints: {
            default: {
                position: [0, 1, 15],
                rotation: [0, Math.PI, 0] // Facing into ranch
            },
            from_pasture: {
                position: [-20, 1, 0],
                rotation: [0, Math.PI/2, 0]
            }
        },
        
        // Level geometry using available textures
        geometry: [
            // Main entrance gate posts
            {
                id: 'entrance_post_left',
                type: 'structure',
                structure: 'post',
                position: [-3, 0, 10],
                dimensions: { width: 0.5, height: 3, depth: 0.5 },
                texture: 'cedar_fence.png',
                collision: true
            },
            {
                id: 'entrance_post_right',
                type: 'structure',
                structure: 'post',
                position: [3, 0, 10],
                dimensions: { width: 0.5, height: 3, depth: 0.5 },
                texture: 'cedar_fence.png',
                collision: true
            },
            
            // Perimeter fencing - Left side
            {
                id: 'fence_left_1',
                type: 'fence',
                position: [-15, 0, 10],
                rotation: [0, Math.PI/2, 0],
                dimensions: { length: 20, height: 2 },
                texture: 'cedar_fence.png',
                collision: true
            },
            {
                id: 'fence_left_2',
                type: 'fence',
                position: [-25, 0, 0],
                rotation: [0, 0, 0],
                dimensions: { length: 20, height: 2 },
                texture: 'cedar_fence.png',
                collision: true
            },
            
            // Perimeter fencing - Right side
            {
                id: 'fence_right_1',
                type: 'fence',
                position: [15, 0, 10],
                rotation: [0, Math.PI/2, 0],
                dimensions: { length: 20, height: 2 },
                texture: 'cedar_fence.png',
                collision: true
            },
            {
                id: 'fence_right_2',
                type: 'fence',
                position: [25, 0, 0],
                rotation: [0, 0, 0],
                dimensions: { length: 20, height: 2 },
                texture: 'cedar_fence.png',
                collision: true
            },
            
            // Ground areas
            {
                id: 'entrance_ground',
                type: 'floor',
                position: [0, 0, 5],
                dimensions: { width: 50, depth: 30 },
                texture: 'ranch_ground.png',
                uvScale: [5, 3],
                collision: false
            },
            
            // Small barn structure
            {
                id: 'entrance_barn',
                type: 'structure',
                structure: 'barn',
                position: [15, 0, -5],
                dimensions: { width: 8, height: 6, depth: 12 },
                texture: 'barn_wood.png',
                collision: true
            }
        ],
        
        // Interactive environment objects
        environment: [
            // Entrance gate (requires no keycard initially)
            {
                id: 'entrance_gate',
                type: 'gate',
                position: [0, 0, 10],
                width: 6,
                height: 2.5,
                texture: 'cedar_fence.png',
                interactive: true,
                requirements: null, // No requirements for entrance
                openPosition: [0, 0, 10.5], // Slides to the side
                animationDuration: 2.0
            },
            
            // First keycard - Red keycard
            {
                id: 'red_keycard',
                type: 'keycard',
                keycardId: 'red',
                position: [15, 2, -5], // On top of barn
                interactive: true
            },
            
            // Information sign
            {
                id: 'ranch_sign',
                type: 'decoration',
                position: [-8, 0, 12],
                dimensions: { width: 2, height: 3, depth: 0.2 },
                texture: 'barn_wood.png',
                interactive: false
            }
        ],
        
        // Level boundaries and transitions
        boundaries: [
            {
                id: 'to_pasture',
                type: 'transition',
                bounds: {
                    minX: -30, maxX: -20,
                    minY: 0, maxY: 5,
                    minZ: -10, maxZ: 10
                },
                targetLevel: 'ranch_pasture',
                targetSpawn: 'from_entrance',
                requirements: {
                    keycards: ['red']
                }
            }
        ],
        
        // Audio settings
        backgroundMusic: 'western_background.wav',
        ambientSounds: [
            {
                file: 'wind_ambient.wav',
                position: [0, 5, 0],
                volume: 0.3,
                loop: true
            }
        ]
    },
    
    /**
     * Level 2: Ranch Pasture - Main grazing area with multiple structures
     */
    ranch_pasture: {
        id: 'ranch_pasture',
        name: 'Ranch Pasture',
        description: 'The main grazing area where wild hogs roam',
        
        spawnPoints: {
            from_entrance: {
                position: [-25, 1, 0],
                rotation: [0, -Math.PI/2, 0]
            },
            from_compound: {
                position: [25, 1, -25],
                rotation: [0, Math.PI, 0]
            },
            default: {
                position: [0, 1, 0],
                rotation: [0, 0, 0]
            }
        },
        
        geometry: [
            // Large pasture ground
            {
                id: 'pasture_ground',
                type: 'floor',
                position: [0, 0, 0],
                dimensions: { width: 80, depth: 60 },
                texture: 'ranch_grass.png',
                uvScale: [8, 6],
                collision: false
            },
            
            // Stone pathways
            {
                id: 'stone_path_main',
                type: 'floor',
                position: [0, 0.1, 0],
                dimensions: { width: 4, depth: 40 },
                texture: 'ranch_stone.png',
                uvScale: [1, 10],
                collision: false
            },
            {
                id: 'stone_path_cross',
                type: 'floor',
                position: [0, 0.1, 0],
                rotation: [0, Math.PI/2, 0],
                dimensions: { width: 4, depth: 50 },
                texture: 'ranch_stone.png',
                uvScale: [1, 12],
                collision: false
            },
            
            // Perimeter fencing - Pine fence for variety
            {
                id: 'pasture_fence_north',
                type: 'fence',
                position: [0, 0, 30],
                dimensions: { length: 80, height: 2.5 },
                texture: 'pine_fence.png',
                collision: true
            },
            {
                id: 'pasture_fence_south',
                type: 'fence',
                position: [0, 0, -30],
                dimensions: { length: 80, height: 2.5 },
                texture: 'pine_fence.png',
                collision: true
            },
            {
                id: 'pasture_fence_east',
                type: 'fence',
                position: [40, 0, 0],
                rotation: [0, Math.PI/2, 0],
                dimensions: { length: 60, height: 2.5 },
                texture: 'pine_fence.png',
                collision: true
            },
            {
                id: 'pasture_fence_west',
                type: 'fence',
                position: [-40, 0, 0],
                rotation: [0, Math.PI/2, 0],
                dimensions: { length: 60, height: 2.5 },
                texture: 'pine_fence.png',
                collision: true
            },
            
            // Feed barn
            {
                id: 'feed_barn',
                type: 'structure',
                structure: 'barn',
                position: [-20, 0, 15],
                dimensions: { width: 12, height: 8, depth: 16 },
                texture: 'barn_wood.png',
                collision: true
            },
            
            // Water trough structure
            {
                id: 'water_trough',
                type: 'structure',
                structure: 'box',
                position: [15, 0, -10],
                dimensions: { width: 6, height: 1, depth: 2 },
                texture: 'ranch_stone.png',
                collision: true
            },
            
            // Hay storage shed
            {
                id: 'hay_shed',
                type: 'structure',
                structure: 'shed',
                position: [25, 0, 20],
                dimensions: { width: 8, height: 5, depth: 10 },
                texture: 'barn_wood.png',
                collision: true
            }
        ],
        
        environment: [
            // Gate to entrance (requires red keycard)
            {
                id: 'entrance_gate',
                type: 'gate',
                position: [-35, 0, 0],
                width: 8,
                height: 2.5,
                texture: 'pine_fence.png',
                interactive: true,
                requirements: {
                    keycards: ['red']
                },
                openPosition: [-35, 0, 4],
                animationDuration: 2.5
            },
            
            // Switch to open compound gate
            {
                id: 'compound_switch',
                type: 'switch',
                switchId: 'compound_access',
                position: [20, 0, -15],
                interactive: true,
                requirements: null
            },
            
            // Blue keycard (harder to reach)
            {
                id: 'blue_keycard',
                type: 'keycard',
                keycardId: 'blue',
                position: [-20, 9, 15], // On top of feed barn
                interactive: true
            },
            
            // Decorative elements
            {
                id: 'feed_barrels',
                type: 'decoration',
                position: [-15, 0, 12],
                dimensions: { width: 1, height: 1.5, depth: 1 },
                texture: 'barn_wood.png',
                interactive: false
            },
            {
                id: 'hay_bales',
                type: 'decoration',
                position: [22, 0, 18],
                dimensions: { width: 2, height: 1, depth: 2 },
                texture: 'ranch_grass.png',
                interactive: false
            }
        ],
        
        boundaries: [
            {
                id: 'to_entrance',
                type: 'transition',
                bounds: {
                    minX: -45, maxX: -35,
                    minY: 0, maxY: 5,
                    minZ: -5, maxZ: 5
                },
                targetLevel: 'ranch_entrance',
                targetSpawn: 'from_pasture'
            },
            {
                id: 'to_compound',
                type: 'transition',
                bounds: {
                    minX: 35, maxX: 45,
                    minY: 0, maxY: 5,
                    minZ: -30, maxZ: -20
                },
                targetLevel: 'ranch_compound',
                targetSpawn: 'from_pasture',
                requirements: {
                    switches: ['compound_access'],
                    keycards: ['blue']
                }
            }
        ],
        
        backgroundMusic: 'banjo_melody.wav',
        ambientSounds: [
            {
                file: 'wind_ambient.wav',
                position: [0, 5, 0],
                volume: 0.2,
                loop: true
            },
            {
                file: 'distant_cattle.wav',
                position: [-20, 2, 15],
                volume: 0.4,
                loop: true
            }
        ]
    },
    
    /**
     * Level 3: Ranch Compound - Final area with complex structures
     */
    ranch_compound: {
        id: 'ranch_compound',
        name: 'Ranch Compound',
        description: 'The main ranch compound with multiple buildings',
        
        spawnPoints: {
            from_pasture: {
                position: [30, 1, -25],
                rotation: [0, -Math.PI/2, 0]
            },
            default: {
                position: [0, 1, 0],
                rotation: [0, 0, 0]
            }
        },
        
        geometry: [
            // Compound ground - mixed surfaces
            {
                id: 'compound_ground_main',
                type: 'floor',
                position: [0, 0, 0],
                dimensions: { width: 60, depth: 50 },
                texture: 'ranch_ground.png',
                uvScale: [6, 5],
                collision: false
            },
            {
                id: 'compound_courtyard',
                type: 'floor',
                position: [0, 0.1, 0],
                dimensions: { width: 30, depth: 25 },
                texture: 'ranch_stone.png',
                uvScale: [6, 5],
                collision: false
            },
            
            // Main ranch house
            {
                id: 'ranch_house',
                type: 'structure',
                structure: 'barn',
                position: [0, 0, -15],
                dimensions: { width: 20, height: 10, depth: 15 },
                texture: 'barn_wood.png',
                collision: true
            },
            
            // Equipment barn
            {
                id: 'equipment_barn',
                type: 'structure',
                structure: 'barn',
                position: [-20, 0, 10],
                dimensions: { width: 15, height: 12, depth: 20 },
                texture: 'barn_wood.png',
                collision: true
            },
            
            // Storage silos
            {
                id: 'silo_1',
                type: 'structure',
                structure: 'cylinder',
                position: [20, 0, 15],
                dimensions: { width: 4, height: 15, depth: 4 },
                texture: 'ranch_stone.png',
                collision: true
            },
            {
                id: 'silo_2',
                type: 'structure',
                structure: 'cylinder',
                position: [25, 0, 15],
                dimensions: { width: 4, height: 15, depth: 4 },
                texture: 'ranch_stone.png',
                collision: true
            },
            
            // Compound walls
            {
                id: 'compound_wall_north',
                type: 'wall',
                position: [0, 0, 25],
                dimensions: { width: 60, height: 3 },
                texture: 'ranch_stone.png',
                collision: true
            },
            {
                id: 'compound_wall_south',
                type: 'wall',
                position: [0, 0, -25],
                dimensions: { width: 60, height: 3 },
                texture: 'ranch_stone.png',
                collision: true
            },
            {
                id: 'compound_wall_east',
                type: 'wall',
                position: [30, 0, 0],
                rotation: [0, Math.PI/2, 0],
                dimensions: { width: 50, height: 3 },
                texture: 'ranch_stone.png',
                collision: true
            },
            {
                id: 'compound_wall_west',
                type: 'wall',
                position: [-30, 0, 0],
                rotation: [0, Math.PI/2, 0],
                dimensions: { width: 50, height: 3 },
                texture: 'ranch_stone.png',
                collision: true
            }
        ],
        
        environment: [
            // Final gate back to pasture
            {
                id: 'pasture_gate',
                type: 'gate',
                position: [35, 0, -25],
                width: 10,
                height: 3,
                texture: 'ranch_stone.png',
                interactive: true,
                requirements: {
                    switches: ['compound_access'],
                    keycards: ['blue']
                },
                openPosition: [35, 0, -20],
                animationDuration: 3.0
            },
            
            // Master switch for compound systems
            {
                id: 'master_switch',
                type: 'switch',
                switchId: 'compound_master',
                position: [0, 0, -10],
                interactive: true,
                requirements: {
                    keycards: ['blue']
                }
            },
            
            // Final keycard - Gold keycard
            {
                id: 'gold_keycard',
                type: 'keycard',
                keycardId: 'gold',
                position: [0, 12, -15], // On top of ranch house
                interactive: true
            },
            
            // Equipment and decorations
            {
                id: 'tractor',
                type: 'decoration',
                position: [-15, 0, 8],
                dimensions: { width: 3, height: 2, depth: 5 },
                texture: 'ranch_stone.png',
                interactive: false
            },
            {
                id: 'feed_mixer',
                type: 'decoration',
                position: [-25, 0, 15],
                dimensions: { width: 2, height: 3, depth: 2 },
                texture: 'barn_wood.png',
                interactive: false
            },
            {
                id: 'water_tank',
                type: 'decoration',
                position: [15, 0, -10],
                dimensions: { width: 3, height: 4, depth: 3 },
                texture: 'ranch_stone.png',
                interactive: false
            }
        ],
        
        boundaries: [
            {
                id: 'to_pasture',
                type: 'transition',
                bounds: {
                    minX: 35, maxX: 40,
                    minY: 0, maxY: 5,
                    minZ: -30, maxZ: -20
                },
                targetLevel: 'ranch_pasture',
                targetSpawn: 'from_compound'
            }
        ],
        
        backgroundMusic: 'western_background.wav',
        ambientSounds: [
            {
                file: 'machinery_ambient.wav',
                position: [-20, 2, 10],
                volume: 0.3,
                loop: true
            },
            {
                file: 'wind_ambient.wav',
                position: [0, 8, 0],
                volume: 0.2,
                loop: true
            }
        ]
    }
};

/**
 * Skybox configurations for each level
 */
export const SkyboxConfigs = {
    ranch_entrance: {
        size: 100,
        timeOfDay: 'day',
        windSpeed: 0.1,
        colors: {
            horizon: [0.9, 0.8, 0.7, 1.0],
            zenith: [0.5, 0.7, 0.9, 1.0],
            ground: [0.4, 0.6, 0.3, 1.0]
        },
        cloudLayers: [
            { height: 30, speed: 0.3, density: 0.2, size: 15 },
            { height: 45, speed: 0.2, density: 0.15, size: 25 }
        ]
    },
    
    ranch_pasture: {
        size: 120,
        timeOfDay: 'day',
        windSpeed: 0.15,
        colors: {
            horizon: [0.85, 0.75, 0.65, 1.0],
            zenith: [0.4, 0.65, 0.85, 1.0],
            ground: [0.3, 0.5, 0.2, 1.0]
        },
        cloudLayers: [
            { height: 25, speed: 0.4, density: 0.25, size: 20 },
            { height: 40, speed: 0.25, density: 0.2, size: 30 },
            { height: 55, speed: 0.15, density: 0.1, size: 40 }
        ]
    },
    
    ranch_compound: {
        size: 100,
        timeOfDay: 'afternoon',
        windSpeed: 0.08,
        colors: {
            horizon: [0.95, 0.85, 0.75, 1.0],
            zenith: [0.6, 0.75, 0.9, 1.0],
            ground: [0.35, 0.55, 0.25, 1.0]
        },
        cloudLayers: [
            { height: 35, speed: 0.2, density: 0.3, size: 25 },
            { height: 50, speed: 0.1, density: 0.2, size: 35 }
        ]
    }
};