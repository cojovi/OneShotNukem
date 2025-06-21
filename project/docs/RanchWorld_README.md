# OneShot Predator Nukem - Ranch World System

## Overview

The Ranch World System provides a complete 3-level Texas ranch environment for the OneShot Predator Nukem game. This system creates an interconnected ranch setting with progression mechanics, environmental objects, and immersive 2.5D retro graphics.

## Features

### Level System
- **3 Connected Levels**: Ranch Entrance, Ranch Pasture, and Ranch Compound
- **Seamless Transitions**: Connected areas with keycard/switch-based progression
- **Modular Design**: Easy to expand with additional levels

### Environment
- **Authentic Ranch Textures**: Cedar fence, pine fence, barn wood, ranch ground, grass, and stone
- **Interactive Objects**: Gates, switches, keycards, and decorative elements
- **Collision Detection**: Full 3D collision system for level geometry
- **Parallax Skybox**: Dynamic sky with moving clouds and day/night atmosphere

### Progression System
- **Keycard Collection**: Red, Blue, and Gold keycards for area access
- **Switch Activation**: Environmental switches that unlock gates and areas
- **Level Boundaries**: Automatic transition zones between connected areas

## Architecture

### Core Classes

#### `LevelManager`
- Manages level loading, transitions, and player progress
- Handles keycard inventory and switch states
- Coordinates level boundaries and spawn points

#### `LevelGeometry`
- Creates 3D geometry for walls, floors, fences, and structures
- Supports multiple geometry types: wall, floor, ceiling, fence, structure
- Integrates with collision system for solid objects

#### `EnvironmentObject`
- Interactive objects: gates, switches, keycards, decorations
- Animation system for opening gates and floating keycards
- Player interaction detection and feedback

#### `Skybox`
- Parallax sky dome with gradient colors
- Moving cloud layers at different heights and speeds
- Distant terrain silhouettes for horizon depth

#### `Game`
- Main game coordinator that integrates all systems
- Event handling for interactions and transitions
- Performance tracking and game state management

## Level Definitions

### Ranch Entrance
- **Starting Area**: Main gate with cedar fence posts
- **Collectibles**: Red keycard on barn roof
- **Progression**: Red keycard required to access Ranch Pasture
- **Features**: Welcome sign, entrance barn, perimeter fencing

### Ranch Pasture
- **Main Area**: Large grazing field with stone pathways
- **Structures**: Feed barn, water trough, hay storage shed
- **Collectibles**: Blue keycard on feed barn roof
- **Progression**: Switch activation + Blue keycard for Ranch Compound access
- **Features**: Pine fencing, decorative hay bales and feed barrels

### Ranch Compound
- **Final Area**: Main ranch buildings and facilities
- **Structures**: Ranch house, equipment barn, storage silos
- **Collectibles**: Gold keycard on ranch house roof
- **Features**: Stone walls, tractor, feed mixer, water tank
- **Completion**: Master switch activation with Gold keycard

## Technical Implementation

### Texture Usage
All textures are 128x128 pixels with 256-color retro palette:
- `cedar_fence.png` - Entrance gates and posts
- `pine_fence.png` - Pasture perimeter fencing
- `barn_wood.png` - Building structures and decorations
- `ranch_ground.png` - Dirt pathways and courtyards
- `ranch_grass.png` - Pasture ground and hay bales
- `ranch_stone.png` - Stone paths, walls, and structures

### Audio Integration
- **Background Music**: Western-themed tracks per level
- **3D Positional Audio**: Environmental sounds positioned in 3D space
- **Interactive Sounds**: Keycard pickup, switch activation, gate opening

### Performance Optimization
- **Static Geometry**: Level structures use static collision for performance
- **LOD System**: Distant objects simplified for better frame rates
- **Texture Reuse**: Efficient texture management with shared materials
- **60 FPS Target**: Optimized rendering pipeline maintains smooth gameplay

## File Structure

```
src/game/
├── Game.js                 # Main game coordinator
├── LevelManager.js         # Level loading and progression
├── LevelGeometry.js        # 3D geometry creation
├── EnvironmentObject.js    # Interactive objects
├── Skybox.js              # Parallax skybox system
└── RanchLevels.js         # Level definitions and configs

final/shaders/
├── skybox.vert            # Skybox vertex shader
└── skybox.frag            # Skybox fragment shader
```

## Integration

The ranch world system integrates with the existing engine through:

1. **Engine Integration**: `main.js` imports and initializes the `Game` class
2. **Rendering**: Uses existing WebGL renderer and shader system
3. **Audio**: Integrates with existing `AudioManager` for 3D sound
4. **Input**: Works with existing `InputManager` for player controls
5. **Collision**: Uses existing `CollisionSystem` for physics

## Usage

### Initialization
```javascript
import { Game } from './src/game/Game.js';

const ranchGame = new Game(engine);
await ranchGame.initialize();
```

### Level Loading
```javascript
// Load specific level with spawn point
await levelManager.loadLevel('ranch_pasture', 'from_entrance');
```

### Progress Tracking
```javascript
// Add keycard to inventory
levelManager.addKeycard('red');

// Activate switch
levelManager.activateSwitch('compound_access');

// Check progression requirements
const canProgress = levelManager.canProgress('gate_id', requirements);
```

## Customization

### Adding New Levels
1. Define level data in `RanchLevels.js`
2. Create skybox configuration in `SkyboxConfigs`
3. Register level with `LevelManager`

### Creating New Objects
1. Add object definition to level's `environment` array
2. Specify type, position, and interaction requirements
3. Objects automatically integrate with collision and rendering

### Modifying Progression
1. Update `requirements` in level boundaries
2. Add new keycard types or switch IDs
3. Modify progression logic in `LevelManager`

## Build Instructions

1. **Prerequisites**: Ensure WebGL engine is initialized
2. **Assets**: Verify all texture files are in `final/assets/textures/`
3. **Shaders**: Confirm skybox shaders are in `final/shaders/`
4. **Integration**: Import `Game` class in main application
5. **Testing**: Load `index.html` in WebGL-compatible browser

## Performance Notes

- **Target**: 60 FPS on modern browsers
- **Memory**: ~50MB texture memory for all ranch assets
- **Rendering**: ~500-1000 draw calls per frame depending on level
- **Audio**: 3D positioned audio with distance attenuation

## Future Enhancements

- **Dynamic Weather**: Rain, wind effects on skybox
- **Day/Night Cycle**: Time-based lighting and sky colors
- **Additional Levels**: Expand ranch with more connected areas
- **Interactive Elements**: More complex puzzle mechanics
- **Wildlife**: Ambient ranch animals and birds

## Troubleshooting

### Common Issues
1. **Textures not loading**: Check file paths in asset inventory
2. **Collision not working**: Verify geometry has collision enabled
3. **Audio not positioned**: Ensure AudioManager supports 3D audio
4. **Performance issues**: Reduce skybox complexity or geometry detail

### Debug Information
Press F1 in-game to display:
- Current FPS and performance stats
- Player position and current level
- Keycard inventory and switch states
- Engine statistics and draw calls

## Credits

Ranch World System designed for OneShot Predator Nukem retro FPS game. All assets generated for royalty-free use with authentic Texas ranch theming and 256-color retro aesthetic.