#!/usr/bin/env node

/**
 * Build script for Appwrite Sites deployment
 * Creates a static landing page in the dist directory
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Building Flutter Recursion Chat static version...');

// Create dist directory (ensure absolute path resolution)
const distDir = path.resolve('dist');
const relativeDistDir = 'dist';

// Always create fresh dist directory
if (fs.existsSync(relativeDistDir)) {
    fs.rmSync(relativeDistDir, { recursive: true, force: true });
}
fs.mkdirSync(relativeDistDir, { recursive: true });
console.log(`📁 Created fresh dist directory at: ${distDir}`);

// Copy static files
const staticDir = 'static';
if (fs.existsSync(staticDir)) {
    const files = fs.readdirSync(staticDir);
    files.forEach(file => {
        const srcPath = path.join(staticDir, file);
        const destPath = path.join(relativeDistDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${file} to dist/ (${path.resolve(destPath)})`);
    });
} else {
    console.log('⚠️  Static directory not found, creating basic index.html');
    
    // Create a basic index.html if static doesn't exist
    const basicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recursion Chat - Flutter Version</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        .github-link { 
            display: inline-block; 
            background: #24292e; 
            color: white; 
            text-decoration: none; 
            padding: 15px 30px; 
            border-radius: 8px; 
            margin: 20px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💬 Recursion Chat - Flutter Version</h1>
        <p>A stable, high-performance chat application built with Flutter.</p>
        <p><strong>This project requires the Flutter SDK to build and run.</strong></p>
        <a href="https://github.com/zrottmann/recursion-chat-flutter" class="github-link">
            View on GitHub
        </a>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
            <h3>Why Flutter?</h3>
            <p>Eliminates React's infinite render loops (Error #301) and provides stable, cross-platform performance.</p>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, 'index.html'), basicHtml);
    console.log('✅ Created basic index.html in dist/');
}

// Create a simple manifest for PWA
const manifest = {
    "name": "Recursion Chat Flutter",
    "short_name": "RecursionChat",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#6366f1",
    "description": "Flutter chat application with Appwrite backend"
};

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('✅ Created manifest.json');

console.log('🎉 Build complete! Files are ready in dist/ directory');
console.log('📁 Files created:');
const distFiles = fs.readdirSync(relativeDistDir);
distFiles.forEach(file => {
    const fullPath = path.resolve(relativeDistDir, file);
    const stats = fs.statSync(fullPath);
    console.log(`   - ${file} (${stats.size} bytes at ${fullPath})`);
});

// Debug: Show current working directory and dist location
console.log('\n🔍 Debug info:');
console.log(`   Working directory: ${process.cwd()}`);
console.log(`   Dist directory: ${distDir}`);
console.log(`   Relative dist: ${relativeDistDir}`);
console.log(`   Dist exists: ${fs.existsSync(relativeDistDir)}`);

console.log('\n🌐 Ready for deployment to Appwrite Sites!');