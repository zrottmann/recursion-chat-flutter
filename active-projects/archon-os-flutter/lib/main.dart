import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dynamic_color/dynamic_color.dart';
import 'core/theme/archon_theme.dart';
import 'features/desktop/presentation/archon_desktop.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI overlay style for immersive OS experience
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Enable edge-to-edge experience
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  
  runApp(
    const ProviderScope(
      child: ArchonOSApp(),
    ),
  );
}

class ArchonOSApp extends ConsumerWidget {
  const ArchonOSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DynamicColorBuilder(
      builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
        return MaterialApp(
          title: 'ARCHON OS',
          debugShowCheckedModeBanner: false,
          theme: ArchonTheme.darkTheme(darkDynamic),
          darkTheme: ArchonTheme.darkTheme(darkDynamic),
          themeMode: ThemeMode.dark, // Force dark theme for OS feel
          home: const ArchonBootScreen(),
        );
      },
    );
  }
}

class ArchonBootScreen extends StatefulWidget {
  const ArchonBootScreen({super.key});

  @override
  State<ArchonBootScreen> createState() => _ArchonBootScreenState();
}

class _ArchonBootScreenState extends State<ArchonBootScreen>
    with TickerProviderStateMixin {
  late AnimationController _bootController;
  late AnimationController _logoController;
  late AnimationController _scanlineController;
  
  final List<String> _bootMessages = [
    'Initializing ARCHON OS...',
    'Loading quantum processors...',
    'Establishing neural networks...',
    'Synchronizing holographic matrix...',
    'Activating AI consciousness...',
    'Calibrating dimensional interface...',
    'Loading user environment...',
    'ARCHON OS Ready.',
  ];
  
  int _currentMessageIndex = 0;
  
  @override
  void initState() {
    super.initState();
    _bootController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _scanlineController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    
    _startBootSequence();
  }
  
  void _startBootSequence() {
    _logoController.forward();
    _scanlineController.repeat();
    
    // Show boot messages progressively
    _showNextMessage();
    
    // Navigate to desktop after boot sequence
    Future.delayed(const Duration(seconds: 8), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const ArchonDesktop(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: animation,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 1.1, end: 1.0).animate(
                    CurvedAnimation(parent: animation, curve: Curves.easeOut),
                  ),
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 2000),
          ),
        );
      }
    });
  }
  
  void _showNextMessage() {
    if (_currentMessageIndex < _bootMessages.length) {
      Future.delayed(Duration(milliseconds: 800 + (_currentMessageIndex * 200)), () {
        if (mounted) {
          setState(() {
            _currentMessageIndex++;
          });
          _showNextMessage();
        }
      });
    }
  }
  
  @override
  void dispose() {
    _bootController.dispose();
    _logoController.dispose();
    _scanlineController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      body: Stack(
        children: [
          // Animated background with matrix-like effect
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 1.0,
                colors: [
                  Color(0xFF001122),
                  Color(0xFF000000),
                ],
              ),
            ),
          ),
          
          // Animated scanlines
          AnimatedBuilder(
            animation: _scanlineController,
            builder: (context, child) {
              return CustomPaint(
                painter: ScanlinePainter(
                  animation: _scanlineController.value,
                ),
                size: size,
              );
            },
          ),
          
          // Main boot content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // ARCHON OS Logo with holographic effect
                AnimatedBuilder(
                  animation: _logoController,
                  builder: (context, child) {
                    return Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001)
                        ..rotateY(_logoController.value * 0.1),
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          gradient: RadialGradient(
                            colors: [
                              const Color(0xFF00FFFF).withOpacity(0.8),
                              const Color(0xFF0080FF).withOpacity(0.6),
                              const Color(0xFF4000FF).withOpacity(0.4),
                              Colors.transparent,
                            ],
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Outer glow ring
                            Container(
                              width: 180,
                              height: 180,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF00FFFF).withOpacity(0.6),
                                  width: 2,
                                ),
                              ),
                            ),
                            
                            // Inner glow ring
                            Container(
                              width: 140,
                              height: 140,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF0080FF).withOpacity(0.8),
                                  width: 1.5,
                                ),
                              ),
                            ),
                            
                            // Core logo
                            Text(
                              'ARCHON',
                              style: GoogleFonts.orbitron(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF00FFFF),
                                letterSpacing: 4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                )
                    .animate()
                    .fadeIn(duration: 1000.ms)
                    .scale(
                      begin: 0.5,
                      end: 1.0,
                      curve: Curves.elasticOut,
                      duration: 1500.ms,
                    )
                    .then()
                    .animate(onPlay: (controller) => controller.repeat(reverse: true))
                    .shimmer(
                      duration: 3.seconds,
                      color: const Color(0xFF00FFFF).withOpacity(0.5),
                    ),
                
                const SizedBox(height: 80),
                
                // Version info
                Text(
                  'NEURAL INTERFACE v3.7.2',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 14,
                    color: const Color(0xFF00FF80).withOpacity(0.8),
                    letterSpacing: 2,
                  ),
                )
                    .animate()
                    .fadeIn(delay: 1000.ms)
                    .slideY(begin: 0.3, end: 0),
                
                const SizedBox(height: 60),
                
                // Boot messages terminal
                Container(
                  width: size.width * 0.7,
                  height: 200,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF000000).withOpacity(0.8),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFF00FFFF).withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Terminal header
                      Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: const BoxDecoration(
                              color: Color(0xFF00FF00),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'SYSTEM INITIALIZATION',
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 12,
                              color: const Color(0xFF00FF80),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Boot messages
                      Expanded(
                        child: ListView.builder(
                          itemCount: _currentMessageIndex,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                children: [
                                  Text(
                                    '> ',
                                    style: GoogleFonts.jetBrainsMono(
                                      fontSize: 12,
                                      color: const Color(0xFF00FFFF),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      _bootMessages[index],
                                      style: GoogleFonts.jetBrainsMono(
                                        fontSize: 12,
                                        color: index == _bootMessages.length - 1
                                            ? const Color(0xFF00FF80)
                                            : const Color(0xFF80FF80).withOpacity(0.8),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(duration: 300.ms)
                                .slideX(begin: -0.3, end: 0);
                          },
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: 1500.ms)
                    .slideY(begin: 0.5, end: 0),
                
                const SizedBox(height: 40),
                
                // Loading indicator
                if (_currentMessageIndex < _bootMessages.length)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (index) {
                      return Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: const BoxDecoration(
                          color: Color(0xFF00FFFF),
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
                      .fadeIn(delay: 2000.ms),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for animated scanlines effect
class ScanlinePainter extends CustomPainter {
  final double animation;

  ScanlinePainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00FFFF).withOpacity(0.1)
      ..strokeWidth = 1;

    // Create horizontal scanlines
    for (int i = 0; i < 50; i++) {
      final y = (i * (size.height / 50)) + (animation * size.height) % (size.height / 25);
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        paint,
      );
    }
    
    // Create vertical scanning beam
    final beamX = animation * size.width;
    final beamPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          const Color(0xFF00FFFF).withOpacity(0.3),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(beamX - 50, 0, 100, size.height));
    
    canvas.drawRect(
      Rect.fromLTWH(beamX - 50, 0, 100, size.height),
      beamPaint,
    );
  }

  @override
  bool shouldRepaint(covariant ScanlinePainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}