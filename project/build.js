/**
 * Build Script for OneShot Predator Nukem
 * Creates production-ready build and verifies all components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GameBuilder {
    constructor() {
        this.buildDir = path.join(__dirname, 'dist');
        this.sourceDir = path.join(__dirname, 'final');
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Clean and create build directory
     */
    prepareBuildDirectory() {
        console.log('Preparing build directory...');
        
        // Remove existing build directory
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true, force: true });
        }
        
        // Create new build directory
        fs.mkdirSync(this.buildDir, { recursive: true });
        
        console.log('✓ Build directory prepared');
    }

    /**
     * Copy files recursively
     */
    copyDirectory(src, dest) {
        if (!fs.existsSync(src)) {
            this.errors.push(`Source directory does not exist: ${src}`);
            return;
        }

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    /**
     * Copy game files to build directory
     */
    copyGameFiles() {
        console.log('Copying game files...');
        
        try {
            this.copyDirectory(this.sourceDir, this.buildDir);
            console.log('✓ Game files copied successfully');
        } catch (error) {
            this.errors.push(`Failed to copy game files: ${error.message}`);
        }
    }

    /**
     * Verify critical files exist
     */
    verifyCriticalFiles() {
        console.log('Verifying critical files...');
        
        const criticalFiles = [
            'index.html',
            'js/main.js',
            'js/GameStateManager.js',
            'js/MinimapRenderer.js',
            'css/style.css',
            'config.json'
        ];

        const criticalDirectories = [
            'assets',
            'assets/sprites',
            'assets/textures',
            'assets/audio',
            'shaders'
        ];

        // Check files
        for (const file of criticalFiles) {
            const filePath = path.join(this.buildDir, file);
            if (!fs.existsSync(filePath)) {
                this.errors.push(`Critical file missing: ${file}`);
            } else {
                console.log(`✓ ${file}`);
            }
        }

        // Check directories
        for (const dir of criticalDirectories) {
            const dirPath = path.join(this.buildDir, dir);
            if (!fs.existsSync(dirPath)) {
                this.errors.push(`Critical directory missing: ${dir}`);
            } else {
                console.log(`✓ ${dir}/`);
            }
        }
    }

    /**
     * Optimize HTML for production
     */
    optimizeHTML() {
        console.log('Optimizing HTML...');
        
        const htmlPath = path.join(this.buildDir, 'index.html');
        
        if (!fs.existsSync(htmlPath)) {
            this.errors.push('index.html not found for optimization');
            return;
        }

        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Add performance optimizations
        const optimizations = [
            // Add preload hints for critical resources
            '<link rel="preload" href="js/main.js" as="script">',
            '<link rel="preload" href="css/style.css" as="style">',
            '<link rel="preload" href="assets/oneshot.png" as="image">',
            // Add meta tags for better performance
            '<meta name="theme-color" content="#2c1810">',
            '<meta name="apple-mobile-web-app-capable" content="yes">',
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
        ];

        // Insert optimizations in head
        const headCloseIndex = html.indexOf('</head>');
        if (headCloseIndex !== -1) {
            const optimizationHTML = '    ' + optimizations.join('\n    ') + '\n';
            html = html.slice(0, headCloseIndex) + optimizationHTML + html.slice(headCloseIndex);
        }

        fs.writeFileSync(htmlPath, html);
        console.log('✓ HTML optimized for production');
    }

    /**
     * Create build manifest
     */
    createBuildManifest() {
        console.log('Creating build manifest...');
        
        const manifest = {
            name: "OneShot Predator Nukem",
            version: "1.0.0",
            buildDate: new Date().toISOString(),
            buildNumber: Date.now(),
            files: this.getFileList(this.buildDir),
            performance: {
                targetFPS: 60,
                optimized: true
            },
            deployment: {
                ready: this.errors.length === 0,
                errors: this.errors,
                warnings: this.warnings
            }
        };

        const manifestPath = path.join(this.buildDir, 'build-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log('✓ Build manifest created');
        return manifest;
    }

    /**
     * Get list of all files in directory
     */
    getFileList(dir, relativeTo = dir) {
        const files = [];
        
        if (!fs.existsSync(dir)) return files;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(relativeTo, fullPath);
            
            if (entry.isDirectory()) {
                files.push(...this.getFileList(fullPath, relativeTo));
            } else {
                const stats = fs.statSync(fullPath);
                files.push({
                    path: relativePath.replace(/\\/g, '/'), // Normalize path separators
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                });
            }
        }
        
        return files;
    }

    /**
     * Validate JavaScript files
     */
    validateJavaScript() {
        console.log('Validating JavaScript files...');
        
        const jsFiles = [
            'js/main.js',
            'js/GameStateManager.js',
            'js/MinimapRenderer.js'
        ];

        for (const jsFile of jsFiles) {
            const filePath = path.join(this.buildDir, jsFile);
            
            if (!fs.existsSync(filePath)) {
                this.errors.push(`JavaScript file missing: ${jsFile}`);
                continue;
            }

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Basic syntax validation
                if (content.includes('import ') && !content.includes('export ')) {
                    this.warnings.push(`${jsFile} has imports but no exports`);
                }
                
                // Check for common issues
                if (content.includes('console.log') && !content.includes('DEBUG')) {
                    this.warnings.push(`${jsFile} contains console.log statements`);
                }
                
                console.log(`✓ ${jsFile} validated`);
                
            } catch (error) {
                this.errors.push(`Failed to validate ${jsFile}: ${error.message}`);
            }
        }
    }

    /**
     * Create deployment instructions
     */
    createDeploymentInstructions() {
        const instructions = `# OneShot Predator Nukem - Deployment Instructions

## Quick Deploy

### Option 1: Static File Hosting
1. Upload the entire 'dist/' directory to your web server
2. Ensure the web server serves files with correct MIME types:
   - .js files as 'application/javascript'
   - .json files as 'application/json'
   - .png files as 'image/png'
   - .mp3/.ogg files as 'audio/mpeg' or 'audio/ogg'

### Option 2: GitHub Pages
1. Create a new repository on GitHub
2. Upload the contents of 'dist/' to the repository
3. Enable GitHub Pages in repository settings
4. Your game will be available at: https://username.github.io/repository-name

### Option 3: Netlify
1. Go to https://netlify.com
2. Drag and drop the 'dist/' folder onto the deploy area
3. Your game will be deployed instantly with a random URL

### Option 4: Vercel
1. Install Vercel CLI: npm i -g vercel
2. Run 'vercel' in the 'dist/' directory
3. Follow the prompts to deploy

## Server Configuration

### Apache (.htaccess)
\`\`\`apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Set correct MIME types
AddType application/javascript .js
AddType application/json .json

# Enable caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType audio/mpeg "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType text/css "access plus 1 week"
</IfModule>
\`\`\`

### Nginx
\`\`\`nginx
location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \\.(mp3|ogg|wav)$ {
    expires 1M;
    add_header Cache-Control "public";
}
\`\`\`

## Performance Tips

1. **Enable GZIP compression** on your server
2. **Use HTTPS** for better performance and security
3. **Enable HTTP/2** if available
4. **Set proper cache headers** for static assets
5. **Use a CDN** for global distribution

## Testing Deployment

After deployment, test the following:
1. Game loads without errors
2. All assets load correctly
3. Audio plays properly
4. Controls respond correctly
5. Performance is acceptable (check with F3)

## Troubleshooting

- **CORS errors**: Ensure files are served over HTTP/HTTPS, not file://
- **Module loading errors**: Check that .js files have correct MIME type
- **Audio not playing**: Some browsers require user interaction before audio
- **Poor performance**: Enable hardware acceleration in browser settings

## Support

For deployment issues, check:
1. Browser console for error messages
2. Network tab for failed resource loads
3. Server logs for any errors
4. Build manifest (build-manifest.json) for build information
`;

        const instructionsPath = path.join(this.buildDir, 'DEPLOYMENT.md');
        fs.writeFileSync(instructionsPath, instructions);
        
        console.log('✓ Deployment instructions created');
    }

    /**
     * Run the complete build process
     */
    async build() {
        console.log('=== OneShot Predator Nukem Build Process ===\n');
        
        try {
            // Build steps
            this.prepareBuildDirectory();
            this.copyGameFiles();
            this.verifyCriticalFiles();
            this.validateJavaScript();
            this.optimizeHTML();
            this.createDeploymentInstructions();
            
            // Create build manifest
            const manifest = this.createBuildManifest();
            
            // Report results
            console.log('\n=== Build Results ===');
            
            if (this.errors.length > 0) {
                console.log('❌ Build FAILED with errors:');
                this.errors.forEach(error => console.log(`  - ${error}`));
                return false;
            }
            
            if (this.warnings.length > 0) {
                console.log('⚠️  Build completed with warnings:');
                this.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            
            console.log('✅ Build completed successfully!');
            console.log(`📁 Build output: ${this.buildDir}`);
            console.log(`📊 Total files: ${manifest.files.length}`);
            console.log(`🚀 Ready for deployment`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Build process failed:', error);
            return false;
        }
    }
}

// Run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const builder = new GameBuilder();
    builder.build().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export { GameBuilder };