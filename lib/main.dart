import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/simple_appwrite_service.dart';
import 'services/enhanced_sso_service.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/oauth_callback_screen.dart';
import 'package:flutter/foundation.dart';
import 'dart:html' as html;

void main() {
  runApp(const RecursionChatApp());
}

class RecursionChatApp extends StatelessWidget {
  const RecursionChatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => SimpleAppwriteService()),
        ChangeNotifierProvider(create: (_) => EnhancedSSOService()),
      ],
      child: MaterialApp(
        title: 'Recursion Chat',
        theme: ThemeData(
          primarySwatch: Colors.deepPurple,
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF6366F1),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6366F1),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => const AuthWrapper(),
          '/auth/success': (context) => const OAuthCallbackScreen(success: true),
          '/auth/failure': (context) => const OAuthCallbackScreen(success: false),
        },
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    // Check current URL path for OAuth callbacks (web only)
    if (kIsWeb) {
      final currentPath = html.window.location.pathname;
      if (currentPath == '/auth/success') {
        return const OAuthCallbackScreen(success: true);
      } else if (currentPath == '/auth/failure') {
        return const OAuthCallbackScreen(success: false);
      }
    }

    return Consumer<AuthService>(
      builder: (context, authService, child) {
        if (authService.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        if (authService.currentUser != null) {
          return const HomeScreen();
        } else {
          return const AuthScreen();
        }
      },
    );
  }
}