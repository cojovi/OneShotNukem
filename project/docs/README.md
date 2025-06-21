# OneShot Predator Nukem - WebGL Game Engine

A complete WebGL-based 3D game engine with retro 2.5D graphics for the first-person shooter "OneShot Predator Nukem".

## Overview

This engine provides a comprehensive foundation for building retro-style FPS games in the browser, featuring:

- **WebGL-based 3D rendering** with retro sprite-based graphics
- **Complete FPS controls** including WASD movement, mouse look, sprint, and jump
- **Billboard sprite rendering** for enemies and items with 2.5D aesthetic
- **Web Audio API integration** for positional audio and music
- **Efficient collision detection** with spatial partitioning
- **Modular architecture** for easy expansion and customization

## Architecture

### Core Engine Components

```
src/engine/
├── core/
│   ├── Engine.js          # Main engine class and game loop
│   └── GameObject.js      # Base game object and component system
├── rendering/
│   ├── Renderer.js        # WebGL rendering pipeline
│   ├── ShaderManager.js   # Shader compilation and management
│   ├── TextureManager.js  # Texture loading and caching
│   ├── SpriteRenderer.js  # Billboard sprite rendering
│   └── Camera.js          # FPS camera with mouse look
├── audio/
│   └── AudioManager.js    # Web Audio API integration
├── input/
│   └── InputManager.js    # Keyboard/mouse input with pointer lock
├── collision/
│   └── CollisionSystem.js # 3D collision detection
└── utils/
    └── MathUtils.js       # Vector/matrix math utilities
```

### Rendering Pipeline

1. **3D Geometry Rendering**: Walls, floors, and static objects using traditional 3D meshes
2. **Billboard Sprite Rendering**: Enemies and items that always face the camera
3. **Retro Post-Processing**: 256-color palette quantization for authentic retro look
4. **Performance Optimization**: Spatial culling, draw call batching, and efficient resource management

### Audio System

- **Positional 3D Audio**: Sounds positioned in 3D space with distance falloff
- **Music Management**: Background music with fade in/out transitions
- **Sound Effects**: Gunshots, enemy sounds, footsteps with pitch variation
- **Volume Controls**: Separate master, music, and SFX volume controls

### Input System

- **FPS Controls**: WASD movement, mouse look, sprint (Shift), jump (Space)
- **Pointer Lock API**: Seamless mouse control for first-person camera
- **Configurable Bindings**: Customizable key mappings and mouse sensitivity
- **Action System**: High-level input actions abstracted from raw input

### Collision Detection

- **Multiple Collider Types**: Box, sphere, and capsule colliders
- **Spatial Partitioning**: Grid-based optimization for large worlds
- **Layer-based Filtering**: Collision layers for different object types
- **Raycast Support**: Line-of-sight and projectile collision detection

## Getting Started

### Prerequisites

- Modern web browser with WebGL support
- Local web server (for loading assets and modules)

### Running the Game

1. **Start a local web server** in the project root:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Open the game** in your browser:
   ```
   http://localhost:8000/project/final/index.html
   ```

3. **Test the engine** (optional):
   ```
   http://localhost:8000/project/final/test.html
   ```

### Controls

- **W, A, S, D**: Move forward, left, backward, right
- **Mouse**: Look around (click to enable pointer lock)
- **Left Click**: Shoot
- **Right Click**: Aim
- **Space**: Jump
- **Shift**: Sprint
- **R**: Reload
- **Escape**: Pause menu
- **F3**: Toggle performance stats

## Engine Features

### WebGL Rendering

- **Modern WebGL**: Uses WebGL 2.0 with fallback to WebGL 1.0
- **Efficient Shaders**: Optimized vertex and fragment shaders for retro aesthetic
- **Texture Management**: Automatic texture loading with fallback support
- **Performance Monitoring**: Real-time FPS, draw calls, and triangle count

### Retro 2.5D Graphics

- **Billboard Sprites**: Enemies and items always face the camera
- **256-Color Palette**: Quantized colors for authentic retro look
- **Pixelated Rendering**: Nearest-neighbor filtering for sharp pixels
- **Sprite Animation**: Multi-frame sprite animations with state management

### Audio Integration

- **Web Audio API**: Advanced audio processing and effects
- **3D Positional Audio**: Sounds positioned in 3D space
- **Audio Streaming**: Efficient loading and playback of audio files
- **Cross-browser Compatibility**: Handles browser autoplay policies

### Performance Optimization

- **60 FPS Target**: Optimized for smooth 60 FPS gameplay
- **Draw Call Batching**: Minimizes WebGL state changes
- **Spatial Culling**: Only renders visible objects
- **Memory Management**: Efficient resource cleanup and garbage collection

## Asset Integration

The engine integrates with the existing asset library:

### Textures (128x128, PNG, 256-color palette)
- `cedar_fence.png` - Cedar fence texture
- `pine_fence.png` - Pine fence texture  
- `barn_wood.png` - Barn wood texture
- `ranch_ground.png` - Ground texture
- `ranch_grass.png` - Grass texture
- `ranch_stone.png` - Stone texture

### Sprites (64x64, PNG, 256-color palette)
- `boar_patrol_variant1.png` - Wild boar patrol state
- `boar_patrol_variant2.png` - Wild boar patrol state (variant)
- `boar_charge_variant1.png` - Wild boar charging state
- `boar_charge_variant2.png` - Wild boar charging state (variant)
- `boar_death_variant1.png` - Wild boar death state
- `boar_death_variant2.png` - Wild boar death state (variant)

### Audio (WAV, 22050 Hz, 16-bit mono)
- `western_background.wav` - Background music
- `banjo_melody.wav` - Banjo melody
- `gunshot.wav` - Gunshot sound effect
- `boar_grunt.wav` - Wild boar grunt
- `footstep.wav` - Footstep sound

## Development

### Adding New Game Objects

```javascript
import { GameObject } from '../src/engine/core/GameObject.js';

// Create a new game object
const wall = new GameObject('Wall');
wall.setPosition(10, 0, 0);
wall.setMesh(renderer.createQuad(4, 3));
wall.setTexture('cedar_fence');

// Add to engine
engine.addGameObject(wall);
```

### Creating Sprites

```javascript
// Create an enemy sprite
const boarSprite = engine.renderer.spriteRenderer.createBoarSprite(
    [5, 1, 5],  // position
    1           // variant
);

// Add to engine
engine.addSprite(boarSprite);
```

### Handling Collisions

```javascript
// Create a collision callback
const onCollision = (otherObject, collision) => {
    console.log('Collision with:', otherObject.name);
    console.log('Collision normal:', collision.normal);
};

// Set up collision detection
const collider = engine.collisionSystem.createBoxCollider(
    gameObject, 
    [2, 2, 2],  // size
    [0, 0, 0],  // offset
    engine.collisionSystem.layers.ENEMY
);

engine.collisionSystem.addCollider(collider);
engine.collisionSystem.setCollisionCallback(gameObject, onCollision);
```

## Browser Compatibility

- **Chrome 60+**: Full support
- **Firefox 55+**: Full support  
- **Safari 12+**: Full support
- **Edge 79+**: Full support

## Performance Guidelines

- **Target 60 FPS** on desktop browsers
- **Optimize draw calls** by batching similar objects
- **Use texture atlases** for sprites when possible
- **Implement LOD** for distant objects
- **Profile regularly** using browser dev tools

## Troubleshooting

### Common Issues

1. **WebGL not supported**: Ensure browser supports WebGL
2. **Assets not loading**: Check that web server is running
3. **Audio not playing**: Click to interact with page first (browser policy)
4. **Poor performance**: Check WebGL extensions and reduce quality settings

### Debug Tools

- **F3**: Toggle performance statistics
- **Browser Console**: Check for WebGL errors
- **Test Page**: Use `test.html` to verify engine components

## License

This engine is created for the OneShot Predator Nukem game project. All assets are generator-created for royalty-free use.

## Technical Specifications

- **WebGL Version**: 2.0 with 1.0 fallback
- **Target Resolution**: 1280x720 (16:9 aspect ratio)
- **Color Depth**: 256-color retro palette
- **Audio Format**: WAV, 22050 Hz, 16-bit mono
- **Texture Format**: PNG, power-of-2 sizes preferred
- **Performance Target**: 60 FPS on desktop, 30 FPS on mobile