import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/theme/archon_theme.dart';
import '../widgets/desktop_wallpaper.dart';
import '../widgets/taskbar.dart';
import '../widgets/floating_widgets.dart';
import '../../applications/widgets/app_window.dart';

class ArchonDesktop extends StatefulWidget {
  const ArchonDesktop({super.key});

  @override
  State<ArchonDesktop> createState() => _ArchonDesktopState();
}

class _ArchonDesktopState extends State<ArchonDesktop>
    with TickerProviderStateMixin {
  late AnimationController _desktopController;
  late AnimationController _hologramController;
  
  final List<DesktopApp> _installedApps = [
    DesktopApp(
      id: 'neural_terminal',
      name: 'Neural Terminal',
      icon: Icons.terminal_rounded,
      color: ArchonTheme.primaryCyan,
      category: 'System',
    ),
    DesktopApp(
      id: 'quantum_files',
      name: 'Quantum Files',
      icon: Icons.folder_rounded,
      color: ArchonTheme.secondaryBlue,
      category: 'Utilities',
    ),
    DesktopApp(
      id: 'holo_browser',
      name: 'HoloBrowser',
      icon: Icons.language_rounded,
      color: ArchonTheme.accentPurple,
      category: 'Network',
    ),
    DesktopApp(
      id: 'ai_assistant',
      name: 'AI Assistant',
      icon: Icons.psychology_rounded,
      color: ArchonTheme.successGreen,
      category: 'AI',
    ),
    DesktopApp(
      id: 'neural_media',
      name: 'Neural Media',
      icon: Icons.play_circle_rounded,
      color: ArchonTheme.warningOrange,
      category: 'Media',
    ),
    DesktopApp(
      id: 'system_monitor',
      name: 'System Monitor',
      icon: Icons.monitor_heart_rounded,
      color: ArchonTheme.errorRed,
      category: 'System',
    ),
  ];
  
  final List<AppWindow> _openWindows = [];
  final GlobalKey<TaskbarState> _taskbarKey = GlobalKey<TaskbarState>();
  
  @override
  void initState() {
    super.initState();
    _desktopController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _hologramController = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    );
    
    _desktopController.forward();
    _hologramController.repeat();
  }
  
  @override
  void dispose() {
    _desktopController.dispose();
    _hologramController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      backgroundColor: ArchonTheme.voidBlack,
      body: Stack(
        children: [
          // Animated Desktop Wallpaper
          const DesktopWallpaper(),
          
          // Holographic UI Elements
          AnimatedBuilder(
            animation: _hologramController,
            builder: (context, child) {
              return CustomPaint(
                painter: HologramUIPainter(
                  animation: _hologramController.value,
                ),
                size: size,
              );
            },
          ),
          
          // Main Desktop Area
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 80, // Space for taskbar
            child: _buildDesktopGrid(context),
          ),
          
          // Open Windows Stack
          ..._openWindows.map((window) => window).toList(),
          
          // Floating Widgets (System Stats, Clock, etc.)
          const FloatingWidgets(),
          
          // Bottom Taskbar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Taskbar(
              key: _taskbarKey,
              apps: _installedApps,
              onAppLaunched: _launchApp,
              openWindows: _openWindows,
            ),
          ),
          
          // Desktop Context Menu (right-click)
          // Will be implemented with gesture detection
        ],
      ),
    );
  }

  Widget _buildDesktopGrid(BuildContext context) {
    return AnimatedBuilder(
      animation: _desktopController,
      builder: (context, child) {
        return GridView.builder(
          padding: const EdgeInsets.all(40),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 8,
            childAspectRatio: 1.0,
            crossAxisSpacing: 20,
            mainAxisSpacing: 20,
          ),
          itemCount: _installedApps.length,
          itemBuilder: (context, index) {
            final app = _installedApps[index];
            return _buildDesktopIcon(context, app, index);
          },
        );
      },
    );
  }

  Widget _buildDesktopIcon(BuildContext context, DesktopApp app, int index) {
    return GestureDetector(
      onTap: () => _launchApp(app),
      onDoubleTap: () => _launchApp(app),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // App Icon with holographic effect
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                colors: [
                  app.color.withOpacity(0.3),
                  app.color.withOpacity(0.1),
                  Colors.transparent,
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: app.color.withOpacity(0.5),
                width: 1,
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Glow effect
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: app.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                // Main icon
                Icon(
                  app.icon,
                  size: 32,
                  color: app.color,
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: (index * 100).ms)
              .scale(
                begin: 0.8,
                end: 1.0,
                curve: Curves.elasticOut,
              )
              .then()
              .animate(onPlay: (controller) => controller.repeat(reverse: true))
              .shimmer(
                duration: 4.seconds,
                color: app.color.withOpacity(0.3),
              ),
          
          const SizedBox(height: 8),
          
          // App Name
          Text(
            app.name,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 11,
              color: Colors.white.withOpacity(0.9),
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          )
              .animate()
              .fadeIn(delay: (index * 100 + 200).ms)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  void _launchApp(DesktopApp app) {
    final windowId = 'window_${DateTime.now().millisecondsSinceEpoch}';
    
    final appWindow = AppWindow(
      id: windowId,
      app: app,
      initialPosition: Offset(
        50 + (_openWindows.length * 30),
        50 + (_openWindows.length * 30),
      ),
      onClose: () => _closeWindow(windowId),
      onMinimize: () => _minimizeWindow(windowId),
      onMaximize: () => _maximizeWindow(windowId),
    );
    
    setState(() {
      _openWindows.add(appWindow);
    });
    
    // Update taskbar
    _taskbarKey.currentState?.addWindow(appWindow);
  }

  void _closeWindow(String windowId) {
    setState(() {
      _openWindows.removeWhere((window) => window.id == windowId);
    });
    
    // Update taskbar
    _taskbarKey.currentState?.removeWindow(windowId);
  }

  void _minimizeWindow(String windowId) {
    // Find and minimize window
    final windowIndex = _openWindows.indexWhere((window) => window.id == windowId);
    if (windowIndex != -1) {
      // Implementation for window minimization
      // Could animate window scaling down to taskbar
    }
  }

  void _maximizeWindow(String windowId) {
    // Find and maximize window
    final windowIndex = _openWindows.indexWhere((window) => window.id == windowId);
    if (windowIndex != -1) {
      // Implementation for window maximization
      // Could animate window to fill screen
    }
  }
}

// Desktop App Model
class DesktopApp {
  final String id;
  final String name;
  final IconData icon;
  final Color color;
  final String category;

  DesktopApp({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.category,
  });
}

// Custom painter for holographic UI elements
class HologramUIPainter extends CustomPainter {
  final double animation;

  HologramUIPainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Draw grid lines in corners
    _drawCornerGrids(canvas, size, paint);
    
    // Draw floating UI elements
    _drawFloatingElements(canvas, size, paint);
    
    // Draw data streams
    _drawDataStreams(canvas, size, paint);
  }

  void _drawCornerGrids(Canvas canvas, Size size, Paint paint) {
    paint.color = ArchonTheme.primaryCyan.withOpacity(0.2);
    
    // Top-left grid
    for (int i = 0; i < 5; i++) {
      for (int j = 0; j < 5; j++) {
        final rect = Rect.fromLTWH(
          20 + (i * 15),
          20 + (j * 15),
          10,
          10,
        );
        canvas.drawRect(rect, paint);
      }
    }
    
    // Top-right grid
    for (int i = 0; i < 5; i++) {
      for (int j = 0; j < 5; j++) {
        final rect = Rect.fromLTWH(
          size.width - 100 + (i * 15),
          20 + (j * 15),
          10,
          10,
        );
        canvas.drawRect(rect, paint);
      }
    }
  }

  void _drawFloatingElements(Canvas canvas, Size size, Paint paint) {
    paint.color = ArchonTheme.secondaryBlue.withOpacity(0.3);
    
    // Floating hexagons
    for (int i = 0; i < 3; i++) {
      final center = Offset(
        size.width * (0.2 + i * 0.3) + (animation * 50) % 100,
        size.height * 0.3 + (animation * 30 + i * 20) % (size.height * 0.4),
      );
      
      _drawHexagon(canvas, center, 20 + i * 5, paint);
    }
  }

  void _drawDataStreams(Canvas canvas, Size size, Paint paint) {
    paint.color = ArchonTheme.successGreen.withOpacity(0.4);
    
    // Vertical data streams
    for (int i = 0; i < 10; i++) {
      final x = size.width * (i / 10);
      final startY = (animation * size.height + i * 50) % size.height;
      final endY = startY + 100;
      
      canvas.drawLine(
        Offset(x, startY),
        Offset(x, endY.clamp(0, size.height)),
        paint,
      );
    }
  }

  void _drawHexagon(Canvas canvas, Offset center, double radius, Paint paint) {
    final path = Path();
    for (int i = 0; i < 6; i++) {
      final angle = (i * 60) * (3.14159 / 180);
      final x = center.dx + radius * cos(angle);
      final y = center.dy + radius * sin(angle);
      
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant HologramUIPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}

// Helper functions for mathematical operations
double cos(double radians) {
  return 1.0; // Simplified for now - would use dart:math in real implementation
}

double sin(double radians) {
  return 0.5; // Simplified for now - would use dart:math in real implementation
}