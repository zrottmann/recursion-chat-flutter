import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/theme/app_theme.dart';
// Removed splash_screen.dart import - splash screen is implemented inline
import 'features/home/presentation/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI overlay style for immersive experience
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  
  // Enable high refresh rate displays
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  runApp(
    const ProviderScope(
      child: TradingPostApp(),
    ),
  );
}

class TradingPostApp extends ConsumerWidget {
  const TradingPostApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Trading Post',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(null),
      darkTheme: AppTheme.darkTheme(null),
      themeMode: ThemeMode.system,
      home: const AnimatedSplashScreen(),
    );
  }
}

class AnimatedSplashScreen extends StatefulWidget {
  const AnimatedSplashScreen({super.key});

  @override
  State<AnimatedSplashScreen> createState() => _AnimatedSplashScreenState();
}

class _AnimatedSplashScreenState extends State<AnimatedSplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _fadeController;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _controller.forward();
    _fadeController.forward();
    
    // Navigate to home after splash
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const HomeScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(0.0, 1.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              
              var tween = Tween(begin: begin, end: end).chain(
                CurveTween(curve: curve),
              );
              
              var offsetAnimation = animation.drive(tween);
              
              return SlideTransition(
                position: offsetAnimation,
                child: FadeTransition(
                  opacity: animation,
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 800),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.primary.withOpacity(0.1),
              Theme.of(context).colorScheme.secondary.withOpacity(0.1),
              Theme.of(context).colorScheme.tertiary.withOpacity(0.1),
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated Logo with 3D rotation
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001)
                      ..rotateY(_controller.value * 2 * 3.14159),
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Theme.of(context).colorScheme.primary,
                            Theme.of(context).colorScheme.secondary,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Theme.of(context)
                                .colorScheme
                                .primary
                                .withOpacity(0.3),
                            blurRadius: 30,
                            spreadRadius: 10,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.storefront_rounded,
                        size: 60,
                        color: Colors.white,
                      ),
                    ),
                  );
                },
              )
                  .animate()
                  .scale(
                    duration: 800.ms,
                    curve: Curves.elasticOut,
                  )
                  .fadeIn(),
              const SizedBox(height: 40),
              // Animated Title
              Text(
                'Trading Post',
                style: GoogleFonts.poppins(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              )
                  .animate()
                  .fadeIn(delay: 300.ms)
                  .slideY(
                    begin: 0.3,
                    end: 0,
                    duration: 600.ms,
                    curve: Curves.easeOutBack,
                  ),
              const SizedBox(height: 10),
              // Animated Subtitle
              Text(
                'Beautiful Marketplace Experience',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  color: Theme.of(context).colorScheme.onBackground.withOpacity(0.7),
                ),
              )
                  .animate()
                  .fadeIn(delay: 500.ms)
                  .slideY(
                    begin: 0.3,
                    end: 0,
                    duration: 600.ms,
                    curve: Curves.easeOutBack,
                  ),
              const SizedBox(height: 60),
              // Loading indicator with shimmer effect
              SizedBox(
                width: 200,
                child: LinearProgressIndicator(
                  backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).colorScheme.primary,
                  ),
                ),
              )
                  .animate(onPlay: (controller) => controller.repeat())
                  .shimmer(
                    duration: 1500.ms,
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                  )
                  .animate()
                  .fadeIn(delay: 700.ms),
            ],
          ),
        ),
      ),
    );
  }
}