import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/marketplace_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/listing_screen.dart';
import 'screens/chat_screen.dart';
import 'providers/marketplace_provider.dart';
import '../shared/lib/services/appwrite_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppwriteService().initialize();
  runApp(const TradingPostApp());
}

class TradingPostApp extends StatelessWidget {
  const TradingPostApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => MarketplaceProvider()),
      ],
      child: MaterialApp(
        title: 'Trading Post',
        theme: ThemeData(
          primarySwatch: Colors.green,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.green,
            brightness: Brightness.light,
          ),
        ),
        darkTheme: ThemeData(
          primarySwatch: Colors.green,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.green,
            brightness: Brightness.dark,
          ),
        ),
        home: const AuthCheckScreen(),
        routes: {
          '/marketplace': (context) => const MarketplaceScreen(),
          '/auth': (context) => const AuthScreen(),
          '/listing': (context) => const ListingScreen(),
          '/chat': (context) => const ChatScreen(),
        },
      ),
    );
  }
}

class AuthCheckScreen extends StatefulWidget {
  const AuthCheckScreen({Key? key}) : super(key: key);

  @override
  State<AuthCheckScreen> createState() => _AuthCheckScreenState();
}

class _AuthCheckScreenState extends State<AuthCheckScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }
  
  Future<void> _checkAuth() async {
    final isAuth = await AppwriteService().isAuthenticated();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed(
        isAuth ? '/marketplace' : '/auth',
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}