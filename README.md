# Recursion Chat Flutter

A modern, stable chat application built with Flutter and Appwrite, designed to eliminate the rendering issues experienced in React applications.

## Features

✅ **Stable Architecture**: No infinite render loops or React-specific issues
✅ **Cross-Platform**: Works on Web, iOS, Android, and Desktop
✅ **Real-time Chat**: Powered by Appwrite Realtime API
✅ **Modern UI**: Material Design 3 with custom theming
✅ **Authentication**: Email/password and OAuth support
✅ **Room-based Chat**: Multiple chat rooms with member management
✅ **Responsive Design**: Optimized for all screen sizes

## Why Flutter?

After experiencing persistent React Error #301 (infinite render loops) in the original React implementation, Flutter provides:

- **Predictable State Management**: No hook dependency issues
- **Stable Widget Lifecycle**: No useEffect infinite loops
- **Better Performance**: Native compilation and efficient rendering
- **Consistent Behavior**: Same codebase across all platforms

## Architecture

```
lib/
├── main.dart                 # App entry point
├── models/
│   └── user_model.dart      # Data models
├── screens/
│   ├── auth_screen.dart     # Authentication UI
│   ├── home_screen.dart     # Main app wrapper
│   ├── room_selection_screen.dart  # Room list
│   └── chat_screen.dart     # Chat interface
└── services/
    ├── auth_service.dart    # Authentication logic
    └── appwrite_service.dart # Backend integration
```

## Setup

### Prerequisites

- Flutter SDK (3.0+)
- Appwrite Cloud account
- Web browser for development

### Installation

1. **Clone and setup**:
   ```bash
   cd recursion_chat_flutter
   flutter pub get
   ```

2. **Configure Appwrite**:
   - Update `endpoint` and `projectId` in `lib/services/appwrite_service.dart`
   - Create collections in Appwrite Console:
     - `users`: User profiles
     - `rooms`: Chat rooms  
     - `messages`: Chat messages

3. **Run the app**:
   ```bash
   flutter run -d chrome  # For web
   flutter run            # For mobile/desktop
   ```

## Appwrite Configuration

### Collections Schema

**Users Collection (`users`)**:
```json
{
  "user_id": "string",
  "email": "string", 
  "username": "string",
  "name": "string",
  "created_at": "datetime"
}
```

**Rooms Collection (`rooms`)**:
```json
{
  "name": "string",
  "description": "string", 
  "member_count": "integer"
}
```

**Messages Collection (`messages`)**:
```json
{
  "content": "string",
  "user_id": "string",
  "username": "string", 
  "room_id": "string",
  "is_ai": "boolean",
  "timestamp": "datetime"
}
```

### Permissions

Set appropriate read/write permissions for each collection based on your security requirements.

## Development

### State Management

Uses Provider pattern for clean, predictable state management:

- **AuthService**: Handles authentication state
- **AppwriteService**: Manages backend communication
- **No complex hooks**: Simple, straightforward state updates

### Key Benefits Over React Version

1. **No Infinite Loops**: Flutter's widget lifecycle prevents React's useEffect dependency issues
2. **Better Performance**: Native compilation vs JavaScript interpretation  
3. **Consistent Rendering**: No unstable function references or memoization issues
4. **Simpler Debugging**: Clear widget tree vs complex React component hierarchy
5. **Cross-Platform Ready**: Single codebase for all platforms

## Deployment

### Web Deployment

1. **Build for web**:
   ```bash
   flutter build web
   ```

2. **Deploy to Appwrite Sites**:
   - Upload `build/web` folder contents
   - Configure routing for SPA
   - Set up custom domain if needed

### Mobile Deployment

Follow Flutter's deployment guides for:
- [Android Play Store](https://docs.flutter.dev/deployment/android)
- [iOS App Store](https://docs.flutter.dev/deployment/ios)

## Troubleshooting

### Common Issues

**Build failures**: Run `flutter clean && flutter pub get`
**Web CORS errors**: Configure Appwrite CORS settings
**Authentication issues**: Verify Appwrite project configuration

### Performance Optimization

- Enable web renderers: `flutter run -d chrome --web-renderer canvaskit`
- Optimize for production: `flutter build web --release`
- Use code splitting for large apps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow Flutter/Dart style guidelines
4. Test on multiple platforms
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Note**: This Flutter version was created to solve persistent React Error #301 issues in the original implementation, providing a more stable and performant chat application.