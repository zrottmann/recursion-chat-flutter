import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dynamic_color/dynamic_color.dart';
import 'core/theme/chat_theme.dart';
import 'core/providers/theme_provider.dart';
import 'features/splash/presentation/animated_splash_screen.dart';
import 'features/chat/presentation/chat_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI overlay style for immersive chat experience
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  
  // Enable edge-to-edge experience
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  
  // Set preferred orientations for mobile chat experience
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  runApp(
    const ProviderScope(
      child: RecursionChatApp(),
    ),
  );
}

class RecursionChatApp extends ConsumerWidget {
  const RecursionChatApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    
    return DynamicColorBuilder(
      builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
        return MaterialApp(
          title: 'Recursion Chat',
          debugShowCheckedModeBanner: false,
          theme: ChatTheme.lightTheme(lightDynamic),
          darkTheme: ChatTheme.darkTheme(darkDynamic),
          themeMode: themeMode,
          home: const AnimatedChatSplashScreen(),
        );
      },
    );
  }
}

class AnimatedChatSplashScreen extends StatefulWidget {
  const AnimatedChatSplashScreen({super.key});

  @override
  State<AnimatedChatSplashScreen> createState() => _AnimatedChatSplashScreenState();
}

class _AnimatedChatSplashScreenState extends State<AnimatedChatSplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _backgroundController;
  late AnimationController _particleController;

  @override
  void initState() {
    super.initState();
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 2500),
      vsync: this,
    );
    _backgroundController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    _particleController = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    );
    
    _startAnimations();
    _navigateToChat();
  }

  void _startAnimations() {
    _logoController.forward();
    _backgroundController.forward();
    _particleController.repeat();
  }

  void _navigateToChat() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const ChatHomeScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(0.0, 1.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              
              var tween = Tween(begin: begin, end: end).chain(
                CurveTween(curve: curve),
              );
              
              return SlideTransition(
                position: animation.drive(tween),
                child: FadeTransition(
                  opacity: animation,
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 1200),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _backgroundController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.primary.withOpacity(0.2),
              theme.colorScheme.secondary.withOpacity(0.2),
              theme.colorScheme.tertiary.withOpacity(0.2),
            ],
          ),
        ),
        child: Stack(
          children: [
            // Animated background particles
            AnimatedBuilder(
              animation: _particleController,
              builder: (context, child) {
                return CustomPaint(
                  painter: ParticlesPainter(
                    animation: _particleController.value,
                    color: theme.colorScheme.primary.withOpacity(0.1),
                  ),
                  size: size,
                );
              },
            ),
            
            // Main content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Animated logo with 3D rotation and pulsing effect
                  AnimatedBuilder(
                    animation: _logoController,
                    builder: (context, child) {
                      return Transform(
                        alignment: Alignment.center,
                        transform: Matrix4.identity()
                          ..setEntry(3, 2, 0.001)
                          ..rotateY(_logoController.value * 2 * 3.14159)
                          ..rotateX(_logoController.value * 0.5),
                        child: Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            gradient: RadialGradient(
                              colors: [
                                theme.colorScheme.primary,
                                theme.colorScheme.secondary,
                                theme.colorScheme.tertiary,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(35),
                            boxShadow: [
                              BoxShadow(
                                color: theme.colorScheme.primary.withOpacity(0.4),
                                blurRadius: 40,
                                spreadRadius: 15,
                              ),
                              BoxShadow(
                                color: theme.colorScheme.secondary.withOpacity(0.3),
                                blurRadius: 60,
                                spreadRadius: 25,
                              ),
                            ],
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Chat bubbles background pattern
                              ...List.generate(3, (index) {
                                return Positioned(
                                  top: 20 + index * 15,
                                  left: 25 + index * 20,
                                  child: Container(
                                    width: 12 + index * 4,
                                    height: 12 + index * 4,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.3),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                );
                              }),
                              // Main chat icon
                              const Icon(
                                Icons.chat_rounded,
                                size: 70,
                                color: Colors.white,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  )
                      .animate()
                      .scale(
                        duration: 1000.ms,
                        curve: Curves.elasticOut,
                      )
                      .fadeIn(duration: 800.ms)
                      .then()
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .scale(
                        begin: 1.0,
                        end: 1.05,
                        duration: 2.seconds,
                      ),
                  
                  const SizedBox(height: 50),
                  
                  // App title with typewriter effect
                  Text(
                    'Recursion Chat',
                    style: GoogleFonts.poppins(
                      fontSize: 42,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 500.ms)
                      .slideY(
                        begin: 0.3,
                        end: 0,
                        duration: 800.ms,
                        curve: Curves.easeOutBack,
                      ),
                  
                  const SizedBox(height: 15),
                  
                  // Subtitle with gradient text
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [
                        theme.colorScheme.secondary,
                        theme.colorScheme.tertiary,
                      ],
                    ).createShader(bounds),
                    child: Text(
                      'AI-Powered Conversations',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 800.ms)
                      .slideY(
                        begin: 0.3,
                        end: 0,
                        duration: 600.ms,
                        curve: Curves.easeOutBack,
                      ),
                  
                  const SizedBox(height: 80),
                  
                  // Loading indicator with floating bubbles
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (index) {
                      return Container(
                        width: 12,
                        height: 12,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          shape: BoxShape.circle,
                        ),
                      )
                          .animate(onPlay: (controller) => controller.repeat())
                          .scaleXY(
                            begin: 0.5,
                            end: 1.2,
                            duration: 800.ms,
                            delay: (index * 200).ms,
                          )
                          .then()
                          .scaleXY(
                            begin: 1.2,
                            end: 0.5,
                            duration: 800.ms,
                          );
                    }),
                  )
                      .animate()
                      .fadeIn(delay: 1200.ms),
                  
                  const SizedBox(height: 20),
                  
                  // Loading text
                  Text(
                    'Connecting to AI...',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: theme.colorScheme.onBackground.withOpacity(0.7),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 1500.ms)
                      .then()
                      .animate(onPlay: (controller) => controller.repeat())
                      .shimmer(
                        duration: 2.seconds,
                        color: theme.colorScheme.primary.withOpacity(0.3),
                      ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Custom painter for animated background particles
class ParticlesPainter extends CustomPainter {
  final double animation;
  final Color color;

  ParticlesPainter({
    required this.animation,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    // Create floating particles
    for (int i = 0; i < 15; i++) {
      final offset = Offset(
        (size.width * (i / 15)) + (animation * 50) % size.width,
        (size.height * (i % 3 / 3)) + (animation * 30 + i * 20) % size.height,
      );
      
      final radius = 2.0 + (animation * 2) + (i % 3);
      canvas.drawCircle(offset, radius, paint);
    }
    
    // Create chat bubble shapes
    for (int i = 0; i < 8; i++) {
      final bubbleOffset = Offset(
        size.width * (0.1 + (i * 0.15) + animation * 0.1) % 1.0,
        size.height * (0.2 + (i % 3 * 0.3) + animation * 0.05) % 1.0,
      );
      
      final bubbleSize = 15.0 + i * 3;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCircle(center: bubbleOffset, radius: bubbleSize),
          const Radius.circular(8),
        ),
        paint..color = color.withOpacity(0.05),
      );
    }
  }

  @override
  bool shouldRepaint(covariant ParticlesPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}