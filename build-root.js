#!/usr/bin/env node

/**
 * Alternative build script for Appwrite Sites deployment
 * Places files directly in the root directory instead of dist/
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Building Flutter Recursion Chat for root deployment...');

// Files to create in root directory
const outputFiles = {
    'index.html': null, // Will be loaded from static/index.html or created
    'manifest.json': {
        "name": "Recursion Chat Flutter",
        "short_name": "RecursionChat",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#667eea",
        "theme_color": "#6366f1",
        "description": "Flutter chat application with Appwrite backend"
    }
};

// Copy or create index.html
const staticIndexPath = 'static/index.html';
if (fs.existsSync(staticIndexPath)) {
    const indexContent = fs.readFileSync(staticIndexPath, 'utf8');
    fs.writeFileSync('index.html', indexContent);
    console.log('✅ Copied index.html from static/ to root');
} else {
    // Create basic index.html
    const basicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recursion Chat - Flutter Version</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 40px; text-align: center; min-height: 100vh;
        }
        .container { 
            max-width: 600px; margin: 0 auto; background: white; 
            border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 20px; }
        .status { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .github-link { 
            display: inline-block; background: #24292e; color: white; 
            text-decoration: none; padding: 15px 30px; border-radius: 8px; margin: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💬 Recursion Chat - Flutter Version</h1>
        <div class="status">
            <h3>🚀 Flutter Project Deployed</h3>
            <p><strong>This is a Flutter application that requires the Flutter SDK to run fully.</strong></p>
            <p>✅ No React Error #301 infinite loops<br>
               ✅ Cross-platform support (Web, iOS, Android, Desktop)<br>
               ✅ Material Design 3 UI<br>
               ✅ Real-time chat with Appwrite backend</p>
        </div>
        <a href="https://github.com/zrottmann/recursion-chat-flutter" class="github-link">
            📂 View Source Code on GitHub
        </a>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
            <h3>Local Development Setup:</h3>
            <p>1. Install Flutter SDK<br>
               2. Clone repository<br>
               3. Run: <code>flutter pub get</code><br>
               4. Run: <code>flutter run -d chrome</code></p>
        </div>
    </div>
</body>
</html>`;
    fs.writeFileSync('index.html', basicHtml);
    console.log('✅ Created index.html in root directory');
}

// Create manifest.json
fs.writeFileSync('manifest.json', JSON.stringify(outputFiles['manifest.json'], null, 2));
console.log('✅ Created manifest.json in root directory');

// Debug info
console.log('\n🔍 Build Results:');
console.log(`   Working directory: ${process.cwd()}`);
console.log(`   index.html exists: ${fs.existsSync('index.html')}`);
console.log(`   manifest.json exists: ${fs.existsSync('manifest.json')}`);

if (fs.existsSync('index.html')) {
    const stats = fs.statSync('index.html');
    console.log(`   index.html size: ${stats.size} bytes`);
}

console.log('\n🎉 Root deployment build complete!');
console.log('🌐 Files are ready in root directory for Appwrite Sites!');