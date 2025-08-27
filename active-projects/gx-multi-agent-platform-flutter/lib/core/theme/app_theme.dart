import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../main.dart';

class AppTheme {
  // Private constructor to prevent instantiation
  AppTheme._();

  // Brand colors for sophisticated AI platform
  static const Color _primaryBrandColor = AppInfo.primaryBrand;
  static const Color _secondaryBrandColor = AppInfo.secondaryBrand;
  static const Color _accentBrandColor = AppInfo.accentBrand;

  /// Light theme with sophisticated AI platform design
  static ThemeData lightTheme(ColorScheme? dynamicColorScheme) {
    final ColorScheme colorScheme = dynamicColorScheme?.harmonized() ??
        ColorScheme.fromSeed(
          seedColor: _primaryBrandColor,
          brightness: Brightness.light,
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // Typography using Orbitron for headers
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: AppTextStyles.displayLarge.copyWith(color: colorScheme.onSurface),
        displayMedium: AppTextStyles.displayMedium.copyWith(color: colorScheme.onSurface),
        headlineLarge: AppTextStyles.headlineLarge.copyWith(color: colorScheme.onSurface),
        headlineMedium: AppTextStyles.headlineMedium.copyWith(color: colorScheme.onSurface),
        bodyLarge: AppTextStyles.bodyLarge.copyWith(color: colorScheme.onSurface),
        bodyMedium: AppTextStyles.bodyMedium.copyWith(color: colorScheme.onSurface),
        labelLarge: AppTextStyles.labelLarge.copyWith(color: colorScheme.onSurface),
      ),
      
      // App Bar theme
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTextStyles.headlineMedium.copyWith(
          color: colorScheme.onSurface,
        ),
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
      ),
      
      // Card theme with glassmorphism
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        color: colorScheme.surface.withOpacity(0.9),
        shadowColor: colorScheme.shadow.withOpacity(0.1),
      ),
      
      // Elevated button theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: AppTextStyles.labelLarge,
        ),
      ),
      
      // Filled button theme
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: AppTextStyles.labelLarge,
        ),
      ),
      
      // Text button theme  
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: AppTextStyles.labelLarge,
        ),
      ),
      
      // Icon button theme
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          padding: const EdgeInsets.all(8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      
      // Input decoration theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface.withOpacity(0.7),
        contentPadding: const EdgeInsets.all(16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.primary,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.error,
            width: 1,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.error,
            width: 2,
          ),
        ),
        hintStyle: AppTextStyles.bodyMedium.copyWith(
          color: colorScheme.onSurface.withOpacity(0.6),
        ),
      ),
      
      // Bottom navigation bar theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: colorScheme.surface,
        selectedItemColor: colorScheme.primary,
        unselectedItemColor: colorScheme.onSurface.withOpacity(0.6),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: AppTextStyles.labelLarge.copyWith(fontSize: 12),
        unselectedLabelStyle: AppTextStyles.labelLarge.copyWith(fontSize: 12),
      ),
      
      // Tab bar theme
      tabBarTheme: TabBarTheme(
        labelColor: colorScheme.primary,
        unselectedLabelColor: colorScheme.onSurface.withOpacity(0.6),
        indicatorColor: colorScheme.primary,
        labelStyle: AppTextStyles.labelLarge,
        unselectedLabelStyle: AppTextStyles.labelLarge,
      ),
      
      // Chip theme
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surface,
        labelStyle: AppTextStyles.bodyMedium,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      // Floating action button theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        elevation: 6,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      // Progress indicator theme
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colorScheme.primary,
        linearTrackColor: colorScheme.surfaceVariant,
        circularTrackColor: colorScheme.surfaceVariant,
      ),
      
      // Divider theme
      dividerTheme: DividerThemeData(
        color: colorScheme.outline.withOpacity(0.2),
        thickness: 1,
        space: 1,
      ),
    );
  }

  /// Dark theme with sophisticated AI platform design  
  static ThemeData darkTheme(ColorScheme? dynamicColorScheme) {
    final ColorScheme colorScheme = dynamicColorScheme?.harmonized() ??
        ColorScheme.fromSeed(
          seedColor: _primaryBrandColor,
          brightness: Brightness.dark,
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // Typography using Orbitron for headers
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: AppTextStyles.displayLarge.copyWith(color: colorScheme.onSurface),
        displayMedium: AppTextStyles.displayMedium.copyWith(color: colorScheme.onSurface),
        headlineLarge: AppTextStyles.headlineLarge.copyWith(color: colorScheme.onSurface),
        headlineMedium: AppTextStyles.headlineMedium.copyWith(color: colorScheme.onSurface),
        bodyLarge: AppTextStyles.bodyLarge.copyWith(color: colorScheme.onSurface),
        bodyMedium: AppTextStyles.bodyMedium.copyWith(color: colorScheme.onSurface),
        labelLarge: AppTextStyles.labelLarge.copyWith(color: colorScheme.onSurface),
      ),
      
      // App Bar theme
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTextStyles.headlineMedium.copyWith(
          color: colorScheme.onSurface,
        ),
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
        ),
      ),
      
      // Card theme with glassmorphism
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        color: colorScheme.surface.withOpacity(0.85),
        shadowColor: colorScheme.shadow.withOpacity(0.3),
      ),
      
      // Elevated button theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: AppTextStyles.labelLarge,
        ),
      ),
      
      // Filled button theme
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: AppTextStyles.labelLarge,
        ),
      ),
      
      // Text button theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: AppTextStyles.labelLarge,
        ),
      ),
      
      // Icon button theme
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          padding: const EdgeInsets.all(8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      
      // Input decoration theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface.withOpacity(0.7),
        contentPadding: const EdgeInsets.all(16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.primary,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.error,
            width: 1,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.error,
            width: 2,
          ),
        ),
        hintStyle: AppTextStyles.bodyMedium.copyWith(
          color: colorScheme.onSurface.withOpacity(0.6),
        ),
      ),
      
      // Bottom navigation bar theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: colorScheme.surface,
        selectedItemColor: colorScheme.primary,
        unselectedItemColor: colorScheme.onSurface.withOpacity(0.6),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: AppTextStyles.labelLarge.copyWith(fontSize: 12),
        unselectedLabelStyle: AppTextStyles.labelLarge.copyWith(fontSize: 12),
      ),
      
      // Tab bar theme
      tabBarTheme: TabBarTheme(
        labelColor: colorScheme.primary,
        unselectedLabelColor: colorScheme.onSurface.withOpacity(0.6),
        indicatorColor: colorScheme.primary,
        labelStyle: AppTextStyles.labelLarge,
        unselectedLabelStyle: AppTextStyles.labelLarge,
      ),
      
      // Chip theme
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surface,
        labelStyle: AppTextStyles.bodyMedium,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      // Floating action button theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        elevation: 6,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      // Progress indicator theme
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colorScheme.primary,
        linearTrackColor: colorScheme.surfaceVariant,
        circularTrackColor: colorScheme.surfaceVariant,
      ),
      
      // Divider theme
      dividerTheme: DividerThemeData(
        color: colorScheme.outline.withOpacity(0.3),
        thickness: 1,
        space: 1,
      ),
    );
  }
}

/// Color extensions for custom colors not in Material 3
extension AppColorScheme on ColorScheme {
  Color get successColor => brightness == Brightness.light 
      ? AppInfo.successBrand 
      : AppInfo.successBrand.withOpacity(0.8);
  
  Color get warningColor => brightness == Brightness.light 
      ? AppInfo.warningBrand 
      : AppInfo.warningBrand.withOpacity(0.8);
      
  Color get accentColor => brightness == Brightness.light 
      ? AppInfo.accentBrand 
      : AppInfo.accentBrand.withOpacity(0.8);
      
  Color get secondaryBrandColor => brightness == Brightness.light 
      ? AppInfo.secondaryBrand 
      : AppInfo.secondaryBrand.withOpacity(0.8);
}