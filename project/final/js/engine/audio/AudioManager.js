/**
 * OneShot Predator Nukem - Audio Manager
 * Handles Web Audio API integration for music and sound effects
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Audio buffers
        this.audioBuffers = new Map();
        this.loadingAudio = new Map();
        
        // Active audio sources
        this.activeSources = new Set();
        this.musicSource = null;
        
        // Volume settings
        this.masterVolume = 1.0;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        
        // 3D audio settings
        this.listener = null;
        
        // Audio file paths based on asset inventory
        this.audioFiles = {
            music: {
                'western_background': './assets/audio/western_background.wav',
                'banjo_melody': './assets/audio/banjo_melody.wav'
            },
            sfx: {
                'gunshot': './assets/audio/gunshot.wav',
                'boar_grunt': './assets/audio/boar_grunt.wav',
                'footstep': './assets/audio/footstep.wav'
            }
        };
    }
    
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.masterGain.gain.value = this.masterVolume;
            this.musicGain.gain.value = this.musicVolume;
            this.sfxGain.gain.value = this.sfxVolume;
            
            // Set up 3D audio listener
            this.listener = this.audioContext.listener;
            if (this.listener.positionX) {
                // Modern Web Audio API
                this.listener.positionX.value = 0;
                this.listener.positionY.value = 0;
                this.listener.positionZ.value = 0;
                this.listener.forwardX.value = 0;
                this.listener.forwardY.value = 0;
                this.listener.forwardZ.value = -1;
                this.listener.upX.value = 0;
                this.listener.upY.value = 1;
                this.listener.upZ.value = 0;
            } else {
                // Legacy Web Audio API
                this.listener.setPosition(0, 0, 0);
                this.listener.setOrientation(0, 0, -1, 0, 1, 0);
            }
            
            // Load audio files
            await this.loadAudioFiles();
            
            console.log('AudioManager initialized successfully');
            return true;
        } catch (error) {
            console.error('AudioManager initialization failed:', error);
            return false;
        }
    }
    
    async loadAudioFiles() {
        const loadPromises = [];
        
        // Load music files
        for (const [name, url] of Object.entries(this.audioFiles.music)) {
            loadPromises.push(this.loadAudioBuffer(name, url));
        }
        
        // Load SFX files
        for (const [name, url] of Object.entries(this.audioFiles.sfx)) {
            loadPromises.push(this.loadAudioBuffer(name, url));
        }
        
        await Promise.all(loadPromises);
    }
    
    async loadAudioBuffer(name, url) {
        if (this.audioBuffers.has(name)) {
            return this.audioBuffers.get(name);
        }
        
        if (this.loadingAudio.has(name)) {
            return await this.loadingAudio.get(name);
        }
        
        const loadPromise = this.fetchAndDecodeAudio(name, url);
        this.loadingAudio.set(name, loadPromise);
        
        try {
            const buffer = await loadPromise;
            this.loadingAudio.delete(name);
            return buffer;
        } catch (error) {
            this.loadingAudio.delete(name);
            console.error(`Failed to load audio: ${name}`, error);
            return null;
        }
    }
    
    async fetchAndDecodeAudio(name, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.audioBuffers.set(name, audioBuffer);
            console.log(`Audio '${name}' loaded successfully`);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to fetch/decode audio ${name}:`, error);
            return null;
        }
    }
    
    // Music playback
    playMusic(name, loop = true, fadeIn = true) {
        // Stop current music
        this.stopMusic();
        
        const buffer = this.audioBuffers.get(name);
        if (!buffer) {
            console.warn(`Music '${name}' not found`);
            return null;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        
        // Create gain node for fade effects
        const gainNode = this.audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        if (fadeIn) {
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 2);
        }
        
        source.start();
        this.musicSource = { source, gainNode };
        
        return this.musicSource;
    }
    
    stopMusic(fadeOut = true) {
        if (this.musicSource) {
            if (fadeOut) {
                const fadeTime = 1.5;
                this.musicSource.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
                setTimeout(() => {
                    if (this.musicSource) {
                        this.musicSource.source.stop();
                        this.musicSource = null;
                    }
                }, fadeTime * 1000);
            } else {
                this.musicSource.source.stop();
                this.musicSource = null;
            }
        }
    }
    
    // Sound effect playback
    playSound(name, options = {}) {
        const buffer = this.audioBuffers.get(name);
        if (!buffer) {
            console.warn(`Sound '${name}' not found`);
            return null;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        let finalNode = source;
        
        // Apply volume
        if (options.volume !== undefined) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = options.volume;
            finalNode.connect(gainNode);
            finalNode = gainNode;
        }
        
        // Apply 3D positioning
        if (options.position) {
            const pannerNode = this.audioContext.createPanner();
            pannerNode.panningModel = 'HRTF';
            pannerNode.distanceModel = 'inverse';
            pannerNode.refDistance = 1;
            pannerNode.maxDistance = 50;
            pannerNode.rolloffFactor = 1;
            pannerNode.coneInnerAngle = 360;
            pannerNode.coneOuterAngle = 0;
            pannerNode.coneOuterGain = 0;
            
            if (pannerNode.positionX) {
                // Modern Web Audio API
                pannerNode.positionX.value = options.position[0];
                pannerNode.positionY.value = options.position[1];
                pannerNode.positionZ.value = options.position[2];
            } else {
                // Legacy Web Audio API
                pannerNode.setPosition(options.position[0], options.position[1], options.position[2]);
            }
            
            finalNode.connect(pannerNode);
            finalNode = pannerNode;
        }
        
        // Connect to SFX gain
        finalNode.connect(this.sfxGain);
        
        // Apply pitch/playback rate
        if (options.pitch) {
            source.playbackRate.value = options.pitch;
        }
        
        // Start playback
        const startTime = options.delay ? this.audioContext.currentTime + options.delay : 0;
        source.start(startTime);
        
        // Track active source
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
        };
        
        return source;
    }
    
    // 3D audio listener update
    updateListener(position, forward, up) {
        if (!this.listener) return;
        
        if (this.listener.positionX) {
            // Modern Web Audio API
            this.listener.positionX.value = position[0];
            this.listener.positionY.value = position[1];
            this.listener.positionZ.value = position[2];
            this.listener.forwardX.value = forward[0];
            this.listener.forwardY.value = forward[1];
            this.listener.forwardZ.value = forward[2];
            this.listener.upX.value = up[0];
            this.listener.upY.value = up[1];
            this.listener.upZ.value = up[2];
        } else {
            // Legacy Web Audio API
            this.listener.setPosition(position[0], position[1], position[2]);
            this.listener.setOrientation(forward[0], forward[1], forward[2], up[0], up[1], up[2]);
        }
    }
    
    // Volume control
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.masterGain.gain.value = this.masterVolume;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.musicGain.gain.value = this.musicVolume;
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sfxGain.gain.value = this.sfxVolume;
    }
    
    // Game-specific audio methods
    playGunshot(position = null) {
        return this.playSound('gunshot', {
            position: position,
            volume: 0.8
        });
    }
    
    playBoarGrunt(position) {
        return this.playSound('boar_grunt', {
            position: position,
            volume: 0.6,
            pitch: 0.8 + Math.random() * 0.4 // Random pitch variation
        });
    }
    
    playFootstep(position = null) {
        return this.playSound('footstep', {
            position: position,
            volume: 0.3,
            pitch: 0.9 + Math.random() * 0.2
        });
    }
    
    startBackgroundMusic() {
        this.playMusic('western_background', true, true);
    }
    
    // Update method for camera integration
    update(deltaTime) {
        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Utility methods
    isPlaying(source) {
        return this.activeSources.has(source);
    }
    
    stopAllSounds() {
        for (const source of this.activeSources) {
            source.stop();
        }
        this.activeSources.clear();
    }
    
    getStats() {
        return {
            loadedBuffers: this.audioBuffers.size,
            activeSources: this.activeSources.size,
            contextState: this.audioContext ? this.audioContext.state : 'none'
        };
    }
    
    // Cleanup
    cleanup() {
        this.stopMusic(false);
        this.stopAllSounds();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.audioBuffers.clear();
        this.loadingAudio.clear();
        this.activeSources.clear();
    }
}