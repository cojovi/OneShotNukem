# OneShot Predator Nukem - Deployment Instructions

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
```apache
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
```

### Nginx
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(mp3|ogg|wav)$ {
    expires 1M;
    add_header Cache-Control "public";
}
```

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
