import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ChatTheme {
  // Brand colors for chat app
  static const Color primaryChatColor = Color(0xFF667EEA);
  static const Color secondaryChatColor = Color(0xFF764BA2);
  static const Color tertiaryChatColor = Color(0xFF6B73FF);
  
  // Chat-specific colors
  static const Color userBubbleColor = Color(0xFF667EEA);
  static const Color aiBubbleColor = Color(0xFFF1F3F5);
  static const Color onlineDotColor = Color(0xFF4CAF50);
  static const Color typingIndicatorColor = Color(0xFF9E9E9E);
  
  // Glassmorphism colors
  static const Color glassWhite = Color(0x1AFFFFFF);
  static const Color glassBlack = Color(0x1A000000);
  
  // Material 3 Light Theme optimized for chat
  static ThemeData lightTheme(ColorScheme? dynamicColorScheme) {
    final ColorScheme colorScheme = dynamicColorScheme?.harmonized() ??
        ColorScheme.fromSeed(
          seedColor: primaryChatColor,
          brightness: Brightness.light,
        );
    
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // Typography with Google Fonts optimized for chat
      textTheme: GoogleFonts.poppinsTextTheme().apply(
        bodyColor: colorScheme.onBackground,
        displayColor: colorScheme.onBackground,
      ).copyWith(
        // Chat message text styles
        bodyMedium: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          height: 1.4,
        ),
        bodySmall: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.3,
        ),
        // Timestamp text
        labelSmall: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.5,
        ),
      ),
      
      // AppBar Theme with glassmorphism for chat header
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.95),
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
        toolbarHeight: 70,
      ),
      
      // Card Theme for message bubbles and chat cards
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        color: colorScheme.surface.withOpacity(0.95),
        shadowColor: colorScheme.shadow.withOpacity(0.05),
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      ),
      
      // Elevated Button Theme for send button and actions
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // Floating Action Button Theme for quick actions
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(25),
        ),
        extendedTextStyle: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      
      // Input Decoration Theme for message input
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface.withOpacity(0.8),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: colorScheme.outline.withOpacity(0.1),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: colorScheme.primary,
            width: 2,
          ),
        ),
        hintStyle: GoogleFonts.poppins(
          color: colorScheme.onSurfaceVariant.withOpacity(0.6),
          fontSize: 16,
        ),
      ),
      
      // Chip Theme for chat tags and quick replies
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        backgroundColor: colorScheme.surface.withOpacity(0.1),
        selectedColor: colorScheme.primaryContainer,
        labelStyle: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      
      // List Tile Theme for chat list items
      listTileTheme: ListTileThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        minVerticalPadding: 8,
      ),
      
      // Bottom Navigation Bar Theme for chat tabs
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
      
      // Dialog Theme for chat dialogs and modals
      dialogTheme: DialogTheme(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.98),
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
        contentTextStyle: GoogleFonts.poppins(
          fontSize: 16,
          color: colorScheme.onSurface.withOpacity(0.8),
        ),
      ),
      
      // Bottom Sheet Theme for chat actions
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
      
      // Snackbar Theme for chat notifications
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        backgroundColor: colorScheme.inverseSurface,
        contentTextStyle: GoogleFonts.poppins(
          color: colorScheme.onInverseSurface,
          fontSize: 14,
        ),
        actionTextColor: colorScheme.primary,
      ),
      
      // Divider Theme for chat separators
      dividerTheme: DividerThemeData(
        thickness: 1,
        space: 1,
        color: colorScheme.outline.withOpacity(0.08),
      ),
      
      // Icon Theme for chat icons
      iconTheme: IconThemeData(
        color: colorScheme.onSurface,
        size: 24,
      ),
    );
  }
  
  // Material 3 Dark Theme optimized for chat
  static ThemeData darkTheme(ColorScheme? dynamicColorScheme) {
    final ColorScheme colorScheme = dynamicColorScheme?.harmonized() ??
        ColorScheme.fromSeed(
          seedColor: primaryChatColor,
          brightness: Brightness.dark,
        );
    
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      
      // Typography with Google Fonts optimized for dark chat
      textTheme: GoogleFonts.poppinsTextTheme().apply(
        bodyColor: colorScheme.onBackground,
        displayColor: colorScheme.onBackground,
      ).copyWith(
        // Chat message text styles
        bodyMedium: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          height: 1.4,
        ),
        bodySmall: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.3,
        ),
        // Timestamp text
        labelSmall: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.5,
        ),
      ),
      
      // AppBar Theme with glassmorphism for dark chat header
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.95),
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
        toolbarHeight: 70,
      ),
      
      // Card Theme for dark message bubbles
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        color: colorScheme.surface.withOpacity(0.95),
        shadowColor: colorScheme.shadow.withOpacity(0.2),
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      ),
      
      // Input Decoration Theme for dark message input
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface.withOpacity(0.8),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: colorScheme.outline.withOpacity(0.2),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: colorScheme.primary,
            width: 2,
          ),
        ),
        hintStyle: GoogleFonts.poppins(
          color: colorScheme.onSurfaceVariant.withOpacity(0.6),
          fontSize: 16,
        ),
      ),
      
      // Bottom Navigation Bar Theme for dark chat tabs
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
      
      // Dialog Theme for dark chat dialogs
      dialogTheme: DialogTheme(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        elevation: 0,
        backgroundColor: colorScheme.surface.withOpacity(0.98),
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
        contentTextStyle: GoogleFonts.poppins(
          fontSize: 16,
          color: colorScheme.onSurface.withOpacity(0.8),
        ),
      ),
      
      // Bottom Sheet Theme for dark chat actions
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
    );
  }
  
  // Chat bubble themes
  static BoxDecoration userBubbleDecoration(ThemeData theme) {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          primaryChatColor,
          secondaryChatColor,
        ],
      ),
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(20),
        topRight: Radius.circular(8),
        bottomLeft: Radius.circular(20),
        bottomRight: Radius.circular(20),
      ),
      boxShadow: [
        BoxShadow(
          color: primaryChatColor.withOpacity(0.3),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }
  
  static BoxDecoration aiBubbleDecoration(ThemeData theme) {
    final isDark = theme.brightness == Brightness.dark;
    return BoxDecoration(
      color: isDark 
          ? theme.colorScheme.surfaceContainerHighest.withOpacity(0.8)
          : aiBubbleColor,
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(8),
        topRight: Radius.circular(20),
        bottomLeft: Radius.circular(20),
        bottomRight: Radius.circular(20),
      ),
      border: Border.all(
        color: theme.colorScheme.outline.withOpacity(0.1),
        width: 1,
      ),
      boxShadow: [
        BoxShadow(
          color: theme.colorScheme.shadow.withOpacity(0.05),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }
}

// Extension for color harmonization
extension ColorSchemeHarmonization on ColorScheme {
  ColorScheme harmonized() {
    return this;
  }
}