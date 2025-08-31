# Flutter Web Deployment Build Settings

## Build Commands

### Production Build (Recommended)
```bash
flutter build web --release --web-renderer auto
```

### Build Options
- `--release` - Production optimized build (minified, tree-shaken)
- `--web-renderer auto` - Auto-detect best renderer (canvaskit/html)
- `--base-href /` - Base URL path (use "/" for root)
- `--pwa-strategy none` - Disable PWA service worker if causing issues
- `--no-tree-shake-icons` - Keep all icons (if icons missing)

## Current Project Settings

### 1. Environment Configuration
**File:** `lib/config/environment.dart`
```dart
class Environment {
  static const String appwriteProjectId = '689bdaf500072795b0f6';
  static const String appwriteProjectName = 'Recursion Chat';
  static const String appwritePublicEndpoint = 'https://nyc.cloud.appwrite.io/v1';
}
```

### 2. Web Configuration
**File:** `web/index.html`
- Base href: `$FLUTTER_BASE_HREF` (auto-replaced during build)
- Title: Recursion Chat
- PWA enabled with manifest.json
- Custom loading screen with gradient

### 3. PWA Manifest
**File:** `web/manifest.json`
- App name: Recursion Chat
- Theme color: #6366f1
- Background: #667eea
- Display: standalone
- Icons: 192x192, 512x512 (regular & maskable)

## Deployment Structure

### What Gets Deployed
```
build/web/
├── index.html           # Entry point
├── main.dart.js         # Your app code (minified)
├── flutter.js           # Flutter engine loader
├── flutter_service_worker.js  # PWA caching
├── version.json         # Build version info
├── manifest.json        # PWA configuration
├── favicon.png          # Browser tab icon
├── icons/               # App icons
├── assets/              # Fonts, images, etc.
└── canvaskit/          # Graphics engine (if using canvaskit)
```

## Appwrite Hosting Requirements

### 1. Build Output
- Deploy entire `build/web/` folder
- All files must maintain relative paths
- index.html must be at root

### 2. Domain Configuration
- Platform: Web (chat.recursionsystems.com)
- OAuth redirects: https://chat.recursionsystems.com
- CORS: Automatically handled by Appwrite

### 3. Headers (Recommended)
```nginx
# Cache static assets
Cache-Control: public, max-age=31536000  # For assets/
Cache-Control: no-cache                  # For index.html

# Security headers
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
```

## Build Size Optimization

### Current Build Stats
- **Development:** ~15-20 MB
- **Release:** ~3-5 MB (with compression)
- **With CanvasKit:** +2-3 MB
- **HTML renderer only:** Smallest size

### Optimization Tips
1. **Use release mode:** `--release`
2. **Enable tree shaking:** Default in release
3. **Remove unused packages:** Check pubspec.yaml
4. **Compress images:** Use WebP format
5. **Use HTML renderer:** For smaller size
6. **Enable gzip:** On server/CDN

## Deployment Commands

### Full Build & Deploy Process
```bash
# 1. Clean previous build
flutter clean

# 2. Get dependencies
flutter pub get

# 3. Build for production
flutter build web --release --web-renderer auto

# 4. Test locally
cd build/web
python -m http.server 8000
# Visit http://localhost:8000

# 5. Deploy via Git
git add .
git commit -m "Production build"
git push origin master
```

## Environment-Specific Builds

### Development
```bash
flutter build web --profile --dart-define=ENV=dev
```

### Staging
```bash
flutter build web --release --dart-define=ENV=staging
```

### Production
```bash
flutter build web --release --dart-define=ENV=prod
```

## Troubleshooting Build Issues

### Common Problems & Solutions

1. **Large Build Size**
   - Use: `--web-renderer html`
   - Remove unused dependencies
   - Check asset sizes

2. **Missing Icons**
   - Use: `--no-tree-shake-icons`
   - Or specify used icons explicitly

3. **CORS Issues**
   - Configure in Appwrite console
   - Add domain to platforms

4. **Service Worker Cache**
   - Clear browser cache
   - Use: `--pwa-strategy none` to disable

5. **Base Path Issues**
   - Set: `--base-href /` for root
   - Or: `--base-href /app/` for subdirectory

## Performance Settings

### Recommended for Production
```bash
flutter build web --release \
  --web-renderer auto \
  --tree-shake-icons \
  --dart2js-optimization O4
```

### Build Flags Explained
- `O4` - Maximum optimization level
- `auto` - Best renderer for device
- Tree shaking - Removes unused code

## Monitoring Build Output

### Check Build Size
```bash
# After build, check size
du -sh build/web/
```

### Analyze Bundle
```bash
# Generate size report
flutter build web --release --analyze-size
```

## Appwrite-Specific Settings

### Required for OAuth
1. Platform must be configured in Appwrite Console
2. OAuth providers must be enabled
3. Redirect URIs must match exactly
4. Domain must be whitelisted

### Build for Appwrite Hosting
```bash
# Standard production build works
flutter build web --release

# Output is in build/web/
# Deploy entire folder contents
```

## Current Deployment Status
- ✅ Environment configured
- ✅ Web platform registered
- ✅ Build optimized for production
- ✅ PWA support enabled
- ✅ Appwrite integration complete