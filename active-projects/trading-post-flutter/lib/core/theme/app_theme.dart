import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand colors
  static const Color primaryBrandColor = Color(0xFF6750A4);
  static const Color secondaryBrandColor = Color(0xFF625B71);
  static const Color tertiaryBrandColor = Color(0xFF7D5260);
  
  // Glassmorphism colors
  static const Color glassWhite = Color(0x0FFFFFFF);
  static const Color glassBlack = Color(0x0F000000);
  
  // Material 3 Light Theme with beautiful customizations
  static ThemeData lightTheme(ColorScheme? dynamicColorScheme) {
    final ColorScheme colorScheme = dynamicColorScheme?.harmonized() ??
        ColorScheme.fromSeed(
          seedColor: primaryBrandColor,
          brightness: Brightness.light,
        );
    
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // Typography with Google Fonts
      textTheme: GoogleFonts.poppinsTextTheme().apply(
        bodyColor: colorScheme.onBackground,
        displayColor: colorScheme.onBackground,
      ),
      
      // AppBar Theme with glassmorphism
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 3,
        backgroundColor: colorScheme.surface.withOpacity(0.9),
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
      ),
      
      // Card Theme with glassmorphism and shadows
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        color: colorScheme.surface.withOpacity(0.95),
        shadowColor: colorScheme.shadow.withOpacity(0.1),
      ),
      
      // Elevated Button Theme with gradients
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // Floating Action Button Theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        extendedTextStyle: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface.withOpacity(0.1),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.outline.withOpacity(0.2),
            width: 1,
          ),
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
        labelStyle: GoogleFonts.poppins(
          color: colorScheme.onSurfaceVariant,
        ),
        hintStyle: GoogleFonts.poppins(
          color: colorScheme.onSurfaceVariant.withOpacity(0.5),
        ),
      ),
      
      // Chip Theme
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        backgroundColor: colorScheme.surface.withOpacity(0.1),
        selectedColor: colorScheme.primaryContainer,
        labelStyle: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        elevation: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: colorScheme.surface.withOpacity(0.95),
        selectedItemColor: colorScheme.primary,
        unselectedItemColor: colorScheme.onSurfaceVariant,
        selectedLabelStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
      
      // Navigation Bar Theme (Material 3)
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.95),
        indicatorColor: colorScheme.primaryContainer,
        labelTextStyle: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: colorScheme.onPrimaryContainer,
            );
          }
          return GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: colorScheme.onSurfaceVariant,
          );
        }),
      ),
      
      // Dialog Theme
      dialogTheme: DialogTheme(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.98),
      ),
      
      // Bottom Sheet Theme
      bottomSheetTheme: BottomSheetThemeData(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(28),
          ),
        ),
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.98),
        dragHandleColor: colorScheme.onSurfaceVariant.withOpacity(0.4),
        dragHandleSize: const Size(48, 5),
      ),
      
      // Snackbar Theme
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        backgroundColor: colorScheme.inverseSurface,
        contentTextStyle: GoogleFonts.poppins(
          color: colorScheme.onInverseSurface,
        ),
      ),
      
      // List Tile Theme
      listTileTheme: ListTileThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      
      // Divider Theme
      dividerTheme: DividerThemeData(
        thickness: 1,
        space: 1,
        color: colorScheme.outline.withOpacity(0.1),
      ),
    );
  }
  
  // Material 3 Dark Theme with beautiful customizations
  static ThemeData darkTheme(ColorScheme? dynamicColorScheme) {
    final ColorScheme colorScheme = dynamicColorScheme?.harmonized() ??
        ColorScheme.fromSeed(
          seedColor: primaryBrandColor,
          brightness: Brightness.dark,
        );
    
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // Typography with Google Fonts
      textTheme: GoogleFonts.poppinsTextTheme().apply(
        bodyColor: colorScheme.onBackground,
        displayColor: colorScheme.onBackground,
      ),
      
      // AppBar Theme with glassmorphism
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 3,
        backgroundColor: colorScheme.surface.withOpacity(0.9),
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
      ),
      
      // Card Theme with glassmorphism and shadows
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        color: colorScheme.surface.withOpacity(0.95),
        shadowColor: colorScheme.shadow.withOpacity(0.3),
      ),
      
      // Elevated Button Theme with gradients
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface.withOpacity(0.1),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.outline.withOpacity(0.2),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: colorScheme.primary,
            width: 2,
          ),
        ),
        labelStyle: GoogleFonts.poppins(
          color: colorScheme.onSurfaceVariant,
        ),
        hintStyle: GoogleFonts.poppins(
          color: colorScheme.onSurfaceVariant.withOpacity(0.5),
        ),
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        elevation: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: colorScheme.surface.withOpacity(0.95),
        selectedItemColor: colorScheme.primary,
        unselectedItemColor: colorScheme.onSurfaceVariant,
        selectedLabelStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
      
      // Dialog Theme
      dialogTheme: DialogTheme(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.98),
      ),
      
      // Bottom Sheet Theme
      bottomSheetTheme: BottomSheetThemeData(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(28),
          ),
        ),
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.98),
        dragHandleColor: colorScheme.onSurfaceVariant.withOpacity(0.4),
        dragHandleSize: const Size(48, 5),
      ),
      
      // Snackbar Theme
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        backgroundColor: colorScheme.inverseSurface,
        contentTextStyle: GoogleFonts.poppins(
          color: colorScheme.onInverseSurface,
        ),
      ),
    );
  }
}

// Extension for color harmonization
extension ColorSchemeHarmonization on ColorScheme {
  ColorScheme harmonized() {
    return this;
  }
}