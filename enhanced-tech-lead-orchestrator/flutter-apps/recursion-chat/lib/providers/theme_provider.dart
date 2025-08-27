import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  bool _isFirstTimeUser = true;

  // Getters
  ThemeMode get themeMode => _themeMode;
  bool get isFirstTimeUser => _isFirstTimeUser;
  bool get isDarkMode => _themeMode == ThemeMode.dark;
  bool get isLightMode => _themeMode == ThemeMode.light;
  bool get isSystemMode => _themeMode == ThemeMode.system;

  // Initialize theme from stored preferences
  Future<void> initializeTheme() async {
    // TODO: Load from shared preferences
    // For now, default to system theme
    _themeMode = ThemeMode.system;
    _updateSystemUI();
    notifyListeners();
  }

  // Toggle between light and dark themes
  void toggleTheme() {
    if (_themeMode == ThemeMode.light) {
      _themeMode = ThemeMode.dark;
    } else if (_themeMode == ThemeMode.dark) {
      _themeMode = ThemeMode.light;
    } else {
      // If system mode, toggle to opposite of current system theme
      final brightness = WidgetsBinding.instance.platformDispatcher.platformBrightness;
      _themeMode = brightness == Brightness.dark ? ThemeMode.light : ThemeMode.dark;
    }
    
    _updateSystemUI();
    _saveThemePreference();
    notifyListeners();
  }

  // Set specific theme mode
  void setThemeMode(ThemeMode mode) {
    if (_themeMode != mode) {
      _themeMode = mode;
      _updateSystemUI();
      _saveThemePreference();
      notifyListeners();
    }
  }

  // Set light theme
  void setLightTheme() {
    setThemeMode(ThemeMode.light);
  }

  // Set dark theme
  void setDarkTheme() {
    setThemeMode(ThemeMode.dark);
  }

  // Set system theme
  void setSystemTheme() {
    setThemeMode(ThemeMode.system);
  }

  // Mark first time user setup as complete
  void completeFirstTimeSetup() {
    _isFirstTimeUser = false;
    _saveFirstTimePreference();
    notifyListeners();
  }

  // Update system UI overlay style based on current theme
  void _updateSystemUI() {
    final brightness = _getCurrentBrightness();
    final isDark = brightness == Brightness.dark;
    
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
        systemNavigationBarColor: isDark ? const Color(0xFF1C1B1F) : const Color(0xFFFFFBFE),
        systemNavigationBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      ),
    );
  }

  // Get current brightness based on theme mode
  Brightness _getCurrentBrightness() {
    switch (_themeMode) {
      case ThemeMode.light:
        return Brightness.light;
      case ThemeMode.dark:
        return Brightness.dark;
      case ThemeMode.system:
        return WidgetsBinding.instance.platformDispatcher.platformBrightness;
    }
  }

  // Save theme preference to storage
  Future<void> _saveThemePreference() async {
    // TODO: Implement shared preferences
    // SharedPreferences prefs = await SharedPreferences.getInstance();
    // prefs.setString('theme_mode', _themeMode.toString());
  }

  // Save first time user preference
  Future<void> _saveFirstTimePreference() async {
    // TODO: Implement shared preferences
    // SharedPreferences prefs = await SharedPreferences.getInstance();
    // prefs.setBool('is_first_time_user', _isFirstTimeUser);
  }

  // Get theme mode display name
  String getThemeModeDisplayName() {
    switch (_themeMode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }

  // Get theme icon
  IconData getThemeIcon() {
    switch (_themeMode) {
      case ThemeMode.light:
        return Icons.light_mode;
      case ThemeMode.dark:
        return Icons.dark_mode;
      case ThemeMode.system:
        return Icons.brightness_auto;
    }
  }

  // Get all available theme modes
  List<ThemeMode> get availableThemeModes => [
    ThemeMode.light,
    ThemeMode.dark,
    ThemeMode.system,
  ];

  // Check if current theme is effective dark mode
  bool isEffectiveDarkMode(BuildContext context) {
    switch (_themeMode) {
      case ThemeMode.light:
        return false;
      case ThemeMode.dark:
        return true;
      case ThemeMode.system:
        return MediaQuery.of(context).platformBrightness == Brightness.dark;
    }
  }
}