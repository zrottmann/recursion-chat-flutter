# Flutter Setup & Deployment Guide

## Quick Setup for Development

### 1. Flutter SDK Installation (Windows)

The Flutter SDK is already downloaded in your system. To set it up:

```bash
# Add Flutter to your PATH (one-time setup)
export PATH="$PATH:/c/Users/Zrott/Downloads/flutter_windows_3.32.8-stable/flutter/bin"

# Or on Windows Command Prompt:
set PATH=%PATH%;C:\Users\Zrott\Downloads\flutter_windows_3.32.8-stable\flutter\bin

# Verify Flutter installation
flutter --version
flutter doctor
```

### 2. Install Dependencies

```bash
cd recursion_chat_flutter
flutter pub get
```

### 3. Configure Appwrite

Update `lib/services/appwrite_service.dart` with your Appwrite settings:

```dart
static const String endpoint = 'https://cloud.appwrite.io/v1';
static const String projectId = 'YOUR_PROJECT_ID';  // Update this
static const String databaseId = 'YOUR_DATABASE_ID'; // Update this
```

### 4. Run the App

```bash
# For web (recommended for testing)
flutter run -d chrome

# For desktop
flutter run -d windows

# For mobile (requires device/emulator)
flutter run
```

## Deployment Options

### Option 1: Web Deployment (Appwrite Sites)

```bash
# Build for web
flutter build web --release --web-renderer canvaskit

# Upload build/web/ contents to Appwrite Sites
```

### Option 2: Firebase Hosting

```bash
flutter build web --release
firebase init hosting
firebase deploy
```

### Option 3: Netlify

```bash
flutter build web --release
# Drag build/web/ folder to Netlify deploy
```

### Option 4: GitHub Pages

```bash
flutter build web --release --base-href /recursion-chat-flutter/
# Push build/web/ to gh-pages branch
```

## Troubleshooting

### Common Issues

1. **Flutter command not found**
   - Ensure Flutter bin directory is in your PATH
   - Try running from the Flutter directory directly

2. **Dependencies not resolving**
   ```bash
   flutter clean
   flutter pub get
   ```

3. **Build errors**
   - Check `flutter doctor` for missing dependencies
   - Ensure all required SDKs are installed

4. **Web CORS issues**
   - Configure Appwrite CORS settings to allow your domain
   - For local development, add `localhost:*` to allowed origins

### Validation

Run the project validator to check everything is set up correctly:

```bash
python validate_project.py
```

## Project Structure

```
recursion_chat_flutter/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   ├── screens/               # UI screens
│   └── services/              # Business logic
├── web/                       # Web deployment files
├── build_and_deploy.sh       # Automated build script
└── validate_project.py       # Project validation
```

## Next Steps

1. **Install Flutter SDK** following the instructions above
2. **Configure Appwrite** with your project details
3. **Run the app** locally for testing
4. **Build and deploy** to your preferred hosting platform

The Flutter version eliminates all React Error #301 infinite render loop issues and provides a stable, high-performance chat application!

---

**Repository**: https://github.com/zrottmann/recursion-chat-flutter
**Issues**: Report any problems in the GitHub Issues section