# 📱 Android Studio Setup Guide for Recursion Chat

## 🚀 **Quick Start Instructions**

### **Step 1: Open Project in Android Studio**
1. Launch Android Studio
2. Choose "Open an Existing Project"
3. Navigate to: `C:\Users\Zrott\OneDrive\Desktop\Claude\Recursion\recursion-app\client\android`
4. Click "OK" to open the project

### **Step 2: Wait for Gradle Sync**
- Android Studio will automatically sync Gradle
- This may take 2-3 minutes on first run
- Look for "Gradle sync successful" in the status bar

### **Step 3: Set Up Device/Emulator**

#### **Option A: Physical Device**
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Accept debugging permissions when prompted

#### **Option B: Android Emulator**
1. Open AVD Manager (Tools → AVD Manager)
2. Create Virtual Device → Choose Phone → Pixel 6 Pro (recommended)
3. Download System Image: API 34 (Android 14)
4. Configure AVD → Finish
5. Launch emulator

### **Step 4: Run the App**
1. Select your device/emulator from the device dropdown
2. Click the green "Run" button (▶️) or press Shift+F10
3. App will install and launch automatically

---

## 🔧 **Project Configuration Details**

### **Native Authentication Features**
- ✅ **Email/Password Login** - No browser popups
- ✅ **Secure Storage** - Using Capacitor Preferences
- ✅ **Biometric Ready** - Framework prepared for fingerprint/face
- ✅ **Device Validation** - Security through device info tracking

### **Key Files to Inspect**
- `MainActivity.java` - Native app entry point
- `AndroidManifest.xml` - App permissions and configuration
- `capacitor.config.json` - Capacitor configuration
- `build.gradle` - Dependencies and build settings

### **Debugging Features Enabled**
- 📊 Logcat output shows authentication flows
- 🔍 Breakpoints work in MainActivity.java
- 📱 Device debugging for network calls
- 🛠️ Chrome DevTools for web content inspection

---

## 🧪 **Testing Native Authentication**

### **Test Scenarios**
1. **First Launch** - Should show native auth screen (not web)
2. **Email Signup** - Create account with email/password
3. **Email Login** - Sign in with existing credentials
4. **Session Persistence** - App remembers login after restart
5. **Biometric Setup** - Option appears after successful login
6. **Network Integration** - Chat functionality works after auth

### **Expected Behavior**
- ❌ **NO** browser windows or OAuth popups
- ✅ Native input fields for email/password
- ✅ "📱 Native App - Secure Authentication" badge visible
- ✅ Biometric authentication option (on supported devices)
- ✅ Secure credential storage using device keystore

### **Debug Logging**
Check Logcat for these authentication events:
```
[NativeAuth] Session restored from secure storage
[NativeAuth] Biometric authentication available
[NativeAuth] Device info validated
[API] POST /api/auth/signin - success
```

---

## 🏗️ **Build Variants**

### **Debug Build (Recommended for Testing)**
- Includes debugging symbols
- Connects to localhost:5174 for development
- Detailed logging enabled
- APK location: `app/build/outputs/apk/debug/app-debug.apk`

### **Release Build (Production)**
- Optimized and obfuscated
- Connects to chat.recursionsystems.com
- Minimal logging
- APK requires code signing for distribution

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

**Gradle Sync Fails**
```bash
./gradlew clean
./gradlew build
```

**App Crashes on Launch**
- Check Logcat for stack traces
- Verify server is running on port 5174
- Clear app data and reinstall

**Authentication Not Working**
- Verify backend server is running
- Check network connectivity
- Look for API errors in Logcat

**Emulator Performance Issues**
- Allocate more RAM to emulator (4GB+)
- Enable hardware acceleration
- Use x86_64 system images

### **Useful Commands**
```bash
# Clean and rebuild
./gradlew clean assembleDebug

# Install on connected device
./gradlew installDebug

# Generate signed APK
./gradlew assembleRelease
```

---

## 📋 **Pre-Requirements Checklist**
- ✅ Android Studio Arctic Fox or newer
- ✅ Java 11+ (configured in local.properties)
- ✅ Android SDK API 34+ installed
- ✅ Backend server running on port 5174
- ✅ Physical device or emulator configured

## 🎯 **Success Criteria**
- App launches without browser dependencies
- Native authentication UI is displayed
- User can create account and login
- Chat functionality works after authentication
- No OAuth redirects or popups occur

Ready to test the native authentication experience! 🚀