/**
 * Integration Test for OneShot Predator Nukem
 * Tests if all systems can be loaded and initialized properly
 */

// Test if we can import all the main modules
async function testModuleImports() {
    console.log('Testing module imports...');
    
    try {
        // Test engine imports
        const { Engine } = await import('./src/engine/core/Engine.js');
        console.log('✓ Engine import successful');
        
        // Test game imports
        const { Game } = await import('./src/game/Game.js');
        console.log('✓ Game import successful');
        
        // Test UI imports
        const { GameStateManager } = await import('./final/js/GameStateManager.js');
        console.log('✓ GameStateManager import successful');
        
        const { MinimapRenderer } = await import('./final/js/MinimapRenderer.js');
        console.log('✓ MinimapRenderer import successful');
        
        return true;
    } catch (error) {
        console.error('✗ Module import failed:', error);
        return false;
    }
}

// Test if we can create a mock canvas and initialize the engine
async function testEngineInitialization() {
    console.log('Testing engine initialization...');
    
    try {
        // Create a mock canvas element
        const canvas = {
            width: 1280,
            height: 720,
            getContext: function(type, options) {
                // Mock WebGL context
                return {
                    enable: () => {},
                    cullFace: () => {},
                    frontFace: () => {},
                    blendFunc: () => {},
                    getParameter: (param) => 'Mock WebGL',
                    clearColor: () => {},
                    clear: () => {},
                    viewport: () => {},
                    COLOR_BUFFER_BIT: 16384,
                    DEPTH_BUFFER_BIT: 256,
                    DEPTH_TEST: 2929,
                    CULL_FACE: 2884,
                    BACK: 1029,
                    CCW: 2305,
                    BLEND: 3042,
                    SRC_ALPHA: 770,
                    ONE_MINUS_SRC_ALPHA: 771,
                    VERSION: 7938,
                    SHADING_LANGUAGE_VERSION: 35724
                };
            },
            addEventListener: () => {},
            style: {}
        };
        
        const { Engine } = await import('./src/engine/core/Engine.js');
        const engine = new Engine(canvas);
        console.log('✓ Engine creation successful');
        
        return true;
    } catch (error) {
        console.error('✗ Engine initialization failed:', error);
        return false;
    }
}

// Test if assets exist
async function testAssetAvailability() {
    console.log('Testing asset availability...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const assetPaths = [
        './final/assets/sprites',
        './final/assets/textures',
        './final/assets/audio',
        './final/shaders'
    ];
    
    let allAssetsExist = true;
    
    for (const assetPath of assetPaths) {
        try {
            const stats = fs.statSync(assetPath);
            if (stats.isDirectory()) {
                console.log(`✓ Asset directory exists: ${assetPath}`);
            } else {
                console.log(`✗ Asset path is not a directory: ${assetPath}`);
                allAssetsExist = false;
            }
        } catch (error) {
            console.log(`✗ Asset directory missing: ${assetPath}`);
            allAssetsExist = false;
        }
    }
    
    return allAssetsExist;
}

// Main test function
async function runIntegrationTests() {
    console.log('=== OneShot Predator Nukem Integration Test ===\n');
    
    const results = {
        moduleImports: await testModuleImports(),
        engineInit: await testEngineInitialization(),
        assets: await testAssetAvailability()
    };
    
    console.log('\n=== Test Results ===');
    console.log('Module Imports:', results.moduleImports ? '✓ PASS' : '✗ FAIL');
    console.log('Engine Initialization:', results.engineInit ? '✓ PASS' : '✗ FAIL');
    console.log('Asset Availability:', results.assets ? '✓ PASS' : '✗ FAIL');
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\nOverall Result:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
    
    return allPassed;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    runIntegrationTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export { runIntegrationTests };