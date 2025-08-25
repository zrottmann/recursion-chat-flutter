import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/appwrite_service.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'models/user_model.dart';

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
        ChangeNotifierProvider(create: (_) => AppwriteService()),
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
        home: const AuthWrapper(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
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