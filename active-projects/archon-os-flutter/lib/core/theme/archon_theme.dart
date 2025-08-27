import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ArchonTheme {
  // Cyber/Futuristic Color Palette
  static const Color primaryCyan = Color(0xFF00FFFF);
  static const Color secondaryBlue = Color(0xFF0080FF);
  static const Color accentPurple = Color(0xFF8000FF);
  static const Color successGreen = Color(0xFF00FF80);
  static const Color warningOrange = Color(0xFFFF8000);
  static const Color errorRed = Color(0xFFFF0080);
  
  // Neural Network Colors
  static const Color neuralBlue = Color(0xFF001133);
  static const Color deepSpace = Color(0xFF000011);
  static const Color voidBlack = Color(0xFF000000);
  
  // Glass/Hologram Effects
  static const Color hologramGlass = Color(0x20FFFFFF);
  static const Color quantumMist = Color(0x10FFFFFF);
  
  static ThemeData darkTheme(ColorScheme? dynamicColorScheme) {
    final colorScheme = dynamicColorScheme ?? _defaultDarkColorScheme;
    
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      
      // Typography with futuristic fonts
      textTheme: _buildTextTheme(colorScheme),
      primaryTextTheme: _buildTextTheme(colorScheme),
      
      // App Bar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.orbitron(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: primaryCyan,
          letterSpacing: 2,
        ),
        iconTheme: const IconThemeData(
          color: primaryCyan,
          size: 24,
        ),
      ),
      
      // Card Theme
      cardTheme: CardTheme(
        color: hologramGlass,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: primaryCyan.withOpacity(0.3),
            width: 1,
          ),
        ),
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryCyan.withOpacity(0.2),
          foregroundColor: primaryCyan,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: primaryCyan.withOpacity(0.5),
              width: 1,
            ),
          ),
          textStyle: GoogleFonts.orbitron(
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
      ),
      
      // Outlined Button Theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: secondaryBlue,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: BorderSide(
            color: secondaryBlue.withOpacity(0.5),
            width: 1.5,
          ),
          textStyle: GoogleFonts.orbitron(
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryCyan,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: GoogleFonts.jetBrainsMono(
            fontWeight: FontWeight.w500,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      // FloatingActionButton Theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryCyan,
        foregroundColor: voidBlack,
        elevation: 8,
        highlightElevation: 12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: quantumMist,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: primaryCyan.withOpacity(0.3),
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: primaryCyan.withOpacity(0.3),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: primaryCyan,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: errorRed,
            width: 1,
          ),
        ),
        labelStyle: GoogleFonts.jetBrainsMono(
          color: primaryCyan.withOpacity(0.8),
          fontSize: 14,
        ),
        hintStyle: GoogleFonts.jetBrainsMono(
          color: Colors.white.withOpacity(0.5),
          fontSize: 14,
        ),
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: deepSpace.withOpacity(0.9),
        selectedItemColor: primaryCyan,
        unselectedItemColor: Colors.white.withOpacity(0.5),
        selectedLabelStyle: GoogleFonts.jetBrainsMono(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
        unselectedLabelStyle: GoogleFonts.jetBrainsMono(
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      
      // Navigation Bar Theme
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: deepSpace.withOpacity(0.9),
        indicatorColor: primaryCyan.withOpacity(0.3),
        labelTextStyle: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return GoogleFonts.jetBrainsMono(
              color: primaryCyan,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            );
          }
          return GoogleFonts.jetBrainsMono(
            color: Colors.white.withOpacity(0.7),
            fontSize: 12,
            fontWeight: FontWeight.w400,
          );
        }),
        iconTheme: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return const IconThemeData(
              color: primaryCyan,
              size: 24,
            );
          }
          return IconThemeData(
            color: Colors.white.withOpacity(0.7),
            size: 24,
          );
        }),
      ),
      
      // Dialog Theme
      dialogTheme: DialogTheme(
        backgroundColor: deepSpace,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: primaryCyan.withOpacity(0.3),
            width: 1,
          ),
        ),
        titleTextStyle: GoogleFonts.orbitron(
          color: primaryCyan,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        contentTextStyle: GoogleFonts.jetBrainsMono(
          color: Colors.white.withOpacity(0.9),
          fontSize: 14,
        ),
      ),
      
      // SnackBar Theme
      snackBarTheme: SnackBarThemeData(
        backgroundColor: neuralBlue,
        contentTextStyle: GoogleFonts.jetBrainsMono(
          color: Colors.white,
          fontSize: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: primaryCyan.withOpacity(0.5),
            width: 1,
          ),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      
      // Switch Theme
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan;
          }
          return Colors.white.withOpacity(0.5);
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan.withOpacity(0.3);
          }
          return Colors.white.withOpacity(0.1);
        }),
      ),
      
      // Checkbox Theme
      checkboxTheme: CheckboxThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan;
          }
          return Colors.transparent;
        }),
        checkColor: MaterialStateProperty.all(voidBlack),
        side: BorderSide(
          color: primaryCyan.withOpacity(0.7),
          width: 2,
        ),
      ),
      
      // Radio Theme
      radioTheme: RadioThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan;
          }
          return Colors.white.withOpacity(0.5);
        }),
      ),
      
      // Slider Theme
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryCyan,
        inactiveTrackColor: primaryCyan.withOpacity(0.3),
        thumbColor: primaryCyan,
        overlayColor: primaryCyan.withOpacity(0.2),
        valueIndicatorColor: primaryCyan,
        valueIndicatorTextStyle: GoogleFonts.jetBrainsMono(
          color: voidBlack,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      
      // Progress Indicator Theme
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryCyan,
        linearTrackColor: quantumMist,
        circularTrackColor: quantumMist,
      ),
      
      // Divider Theme
      dividerTheme: DividerThemeData(
        color: primaryCyan.withOpacity(0.2),
        thickness: 1,
        space: 1,
      ),
    );
  }
  
  static ColorScheme get _defaultDarkColorScheme => const ColorScheme.dark(
    brightness: Brightness.dark,
    primary: primaryCyan,
    onPrimary: voidBlack,
    secondary: secondaryBlue,
    onSecondary: Colors.white,
    tertiary: accentPurple,
    onTertiary: Colors.white,
    error: errorRed,
    onError: Colors.white,
    surface: deepSpace,
    onSurface: Colors.white,
    background: voidBlack,
    onBackground: Colors.white,
    outline: primaryCyan,
    surfaceVariant: neuralBlue,
    onSurfaceVariant: Colors.white70,
  );
  
  static TextTheme _buildTextTheme(ColorScheme colorScheme) {
    return TextTheme(
      // Display styles - for large, prominent text
      displayLarge: GoogleFonts.orbitron(
        fontSize: 57,
        fontWeight: FontWeight.w900,
        color: primaryCyan,
        letterSpacing: 2,
      ),
      displayMedium: GoogleFonts.orbitron(
        fontSize: 45,
        fontWeight: FontWeight.bold,
        color: primaryCyan,
        letterSpacing: 1.5,
      ),
      displaySmall: GoogleFonts.orbitron(
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: colorScheme.onSurface,
        letterSpacing: 1,
      ),
      
      // Headline styles - for medium-prominence text
      headlineLarge: GoogleFonts.orbitron(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: primaryCyan,
        letterSpacing: 1,
      ),
      headlineMedium: GoogleFonts.orbitron(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
        letterSpacing: 0.5,
      ),
      headlineSmall: GoogleFonts.orbitron(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      
      // Title styles - for card titles, dialog titles
      titleLarge: GoogleFonts.orbitron(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: primaryCyan,
        letterSpacing: 0.5,
      ),
      titleMedium: GoogleFonts.jetBrainsMono(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
        letterSpacing: 0.5,
      ),
      titleSmall: GoogleFonts.jetBrainsMono(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurface,
        letterSpacing: 0.25,
      ),
      
      // Label styles - for buttons, tabs
      labelLarge: GoogleFonts.jetBrainsMono(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
        letterSpacing: 0.5,
      ),
      labelMedium: GoogleFonts.jetBrainsMono(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurface,
        letterSpacing: 0.5,
      ),
      labelSmall: GoogleFonts.jetBrainsMono(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurface.withOpacity(0.8),
        letterSpacing: 0.5,
      ),
      
      // Body styles - for main content text
      bodyLarge: GoogleFonts.jetBrainsMono(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: colorScheme.onSurface,
        letterSpacing: 0.25,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.jetBrainsMono(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: colorScheme.onSurface,
        letterSpacing: 0.25,
        height: 1.4,
      ),
      bodySmall: GoogleFonts.jetBrainsMono(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: colorScheme.onSurface.withOpacity(0.8),
        letterSpacing: 0.25,
        height: 1.3,
      ),
    );
  }
  
  // Utility methods for gradients
  static LinearGradient get neuralGradient => const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      deepSpace,
      neuralBlue,
      voidBlack,
    ],
  );
  
  static LinearGradient get hologramGradient => LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      primaryCyan.withOpacity(0.2),
      secondaryBlue.withOpacity(0.1),
      accentPurple.withOpacity(0.1),
    ],
  );
  
  static LinearGradient get cyberGradient => const LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      primaryCyan,
      secondaryBlue,
      accentPurple,
    ],
  );
}