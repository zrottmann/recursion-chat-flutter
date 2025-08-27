import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'screens/chat_rooms_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';
import 'providers/chat_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import '../shared/lib/services/appwrite_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI overlay style for mobile
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );
  
  // Initialize Appwrite service
  AppwriteService().initialize();
  
  runApp(const RecursionChatApp());
}

class RecursionChatApp extends StatelessWidget {
  const RecursionChatApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Recursion Chat',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepPurple,
                brightness: Brightness.light,
              ),
              appBarTheme: const AppBarTheme(
                centerTitle: true,
                elevation: 0,
                systemOverlayStyle: SystemUiOverlayStyle.dark,
              ),
              cardTheme: CardTheme(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
              floatingActionButtonTheme: const FloatingActionButtonThemeData(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                ),
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepPurple,
                brightness: Brightness.dark,
              ),
              appBarTheme: const AppBarTheme(
                centerTitle: true,
                elevation: 0,
                systemOverlayStyle: SystemUiOverlayStyle.light,
              ),
              cardTheme: CardTheme(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
              floatingActionButtonTheme: const FloatingActionButtonThemeData(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                ),
              ),
            ),
            themeMode: themeProvider.themeMode,
            home: const AuthCheck(),
            onGenerateRoute: (settings) {
              switch (settings.name) {
                case '/auth':
                  return MaterialPageRoute(
                    builder: (_) => const AuthScreen(),
                  );
                case '/rooms':
                  return MaterialPageRoute(
                    builder: (_) => const ChatRoomsScreen(),
                  );
                case '/chat':
                  final roomId = settings.arguments as String?;
                  return MaterialPageRoute(
                    builder: (_) => ChatScreen(roomId: roomId),
                  );
                case '/profile':
                  return MaterialPageRoute(
                    builder: (_) => const ProfileScreen(),
                  );
                case '/settings':
                  return MaterialPageRoute(
                    builder: (_) => const SettingsScreen(),
                  );
                default:
                  return null;
              }
            },
          );
        },
      ),
      ),
    );
  }
}

class AuthCheck extends StatefulWidget {
  const AuthCheck({Key? key}) : super(key: key);

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }
  
  Future<void> _checkAuth() async {
    // Show splash screen for a minimum duration
    await Future.delayed(const Duration(seconds: 2));
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final isAuth = await AppwriteService().isAuthenticated();
      
      if (isAuth) {
        // Get current user session
        final session = await AppwriteService().getCurrentSession();
        if (session['success'] == true) {
          authProvider.setUser(session['user']);
        }
      }
      
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(
          isAuth ? '/rooms' : '/auth',
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/auth');
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return const SplashScreen();
  }
}