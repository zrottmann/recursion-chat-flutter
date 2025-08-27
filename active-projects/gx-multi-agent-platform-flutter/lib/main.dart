import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dynamic_color/dynamic_color.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/theme/app_theme.dart';
import 'features/splash/presentation/animated_splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize local storage
  await Hive.initFlutter();
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  
  runApp(const ProviderScope(child: GXMultiAgentApp()));
}

class GXMultiAgentApp extends ConsumerWidget {
  const GXMultiAgentApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DynamicColorBuilder(
      builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
        return MaterialApp(
          title: 'GX Multi-Agent Platform',
          debugShowCheckedModeBanner: false,
          
          // Theme configuration with dynamic colors
          theme: AppTheme.lightTheme(lightDynamic),
          darkTheme: AppTheme.darkTheme(darkDynamic),
          themeMode: ThemeMode.system,
          
          // Splash screen as home
          home: const AnimatedSplashScreen(),
          
          // Global Material 3 configuration
          builder: (context, child) {
            return MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.noScaling, // Prevent text scaling issues
              ),
              child: child!,
            );
          },
        );
      },
    );
  }
}

/// Application information and metadata
class AppInfo {
  static const String name = 'GX Multi-Agent Platform';
  static const String version = '1.0.0';
  static const String description = 'AI-Powered Development Orchestration';
  static const String tagline = 'Orchestrate. Create. Deploy.';
  
  // Brand colors for the multi-agent platform
  static const Color primaryBrand = Color(0xFF6C5CE7);    // Purple
  static const Color secondaryBrand = Color(0xFF00CEC9);  // Teal  
  static const Color accentBrand = Color(0xFFE17055);     // Orange
  static const Color successBrand = Color(0xFF00B894);    // Green
  static const Color warningBrand = Color(0xFFE84393);    // Pink
  static const Color errorBrand = Color(0xFFD63031);      // Red
}

/// Global text styles using Orbitron for headers and system font for content
class AppTextStyles {
  static TextStyle get displayLarge => GoogleFonts.orbitron(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
  );
  
  static TextStyle get displayMedium => GoogleFonts.orbitron(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.25,
  );
  
  static TextStyle get headlineLarge => GoogleFonts.orbitron(
    fontSize: 24,
    fontWeight: FontWeight.w600,
  );
  
  static TextStyle get headlineMedium => GoogleFonts.orbitron(
    fontSize: 20,
    fontWeight: FontWeight.w500,
  );
  
  // Content text uses system font for readability
  static TextStyle get bodyLarge => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );
  
  static TextStyle get bodyMedium => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );
  
  static TextStyle get labelLarge => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.25,
  );
  
  // Monospace for code and data
  static TextStyle get codeMedium => GoogleFonts.jetBrainsMono(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.3,
  );
  
  static TextStyle get codeSmall => GoogleFonts.jetBrainsMono(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.2,
  );
}