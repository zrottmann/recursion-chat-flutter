import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/archon_theme.dart';

class DesktopWallpaper extends StatefulWidget {
  const DesktopWallpaper({super.key});

  @override
  State<DesktopWallpaper> createState() => _DesktopWallpaperState();
}

class _DesktopWallpaperState extends State<DesktopWallpaper>
    with TickerProviderStateMixin {
  late AnimationController _particleController;
  late AnimationController _waveController;
  
  @override
  void initState() {
    super.initState();
    _particleController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    );
    _waveController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    
    _particleController.repeat();
    _waveController.repeat();
  }
  
  @override
  void dispose() {
    _particleController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return SizedBox(
      width: size.width,
      height: size.height,
      child: Stack(
        children: [
          // Base neural network gradient
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(-0.3, -0.5),
                radius: 1.2,
                colors: [
                  ArchonTheme.neuralBlue.withOpacity(0.8),
                  ArchonTheme.deepSpace.withOpacity(0.9),
                  ArchonTheme.voidBlack,
                ],
              ),
            ),
          ),
          
          // Animated particles
          AnimatedBuilder(
            animation: _particleController,
            builder: (context, child) {
              return CustomPaint(
                painter: ParticleWallpaperPainter(
                  animation: _particleController.value,
                ),
                size: size,
              );
            },
          ),
          
          // Animated neural waves
          AnimatedBuilder(
            animation: _waveController,
            builder: (context, child) {
              return CustomPaint(
                painter: NeuralWavesPainter(
                  animation: _waveController.value,
                ),
                size: size,
              );
            },
          ),
          
          // Grid overlay
          CustomPaint(
            painter: GridOverlayPainter(),
            size: size,
          ),
          
          // Corner UI elements
          _buildCornerElements(context),
        ],
      ),
    );
  }

  Widget _buildCornerElements(BuildContext context) {
    return Stack(
      children: [
        // Top-left system info
        Positioned(
          top: 20,
          left: 20,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: ArchonTheme.hologramGlass,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: ArchonTheme.primaryCyan.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.memory_rounded,
                  size: 16,
                  color: ArchonTheme.primaryCyan,
                ),
                const SizedBox(width: 8),
                Text(
                  'NEURAL CORE v3.7.2',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white,
                    fontFamily: 'JetBrainsMono',
                  ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: 1000.ms)
              .slideX(begin: -0.5, end: 0),
        ),
        
        // Top-right network status
        Positioned(
          top: 20,
          right: 20,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: ArchonTheme.hologramGlass,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: ArchonTheme.successGreen.withOpacity(0.5),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: ArchonTheme.successGreen,
                    shape: BoxShape.circle,
                  ),
                )
                    .animate(onPlay: (controller) => controller.repeat())
                    .scaleXY(
                      begin: 0.8,
                      end: 1.2,
                      duration: 2.seconds,
                    ),
                const SizedBox(width: 8),
                const Text(
                  'QUANTUM LINK ACTIVE',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white,
                    fontFamily: 'JetBrainsMono',
                  ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: 1200.ms)
              .slideX(begin: 0.5, end: 0),
        ),
      ],
    );
  }
}

// Particle wallpaper painter
class ParticleWallpaperPainter extends CustomPainter {
  final double animation;

  ParticleWallpaperPainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.fill;

    // Draw floating particles
    for (int i = 0; i < 50; i++) {
      final progress = (animation + (i * 0.02)) % 1.0;
      final x = (size.width * (i * 0.123)) % size.width;
      final y = size.height * progress;
      
      // Particle color based on position
      Color particleColor = ArchonTheme.primaryCyan;
      if (i % 3 == 1) particleColor = ArchonTheme.secondaryBlue;
      if (i % 3 == 2) particleColor = ArchonTheme.accentPurple;
      
      paint.color = particleColor.withOpacity(0.6);
      
      // Draw particle
      canvas.drawCircle(
        Offset(x, y),
        1.5 + (i % 3) * 0.5,
        paint,
      );
      
      // Draw particle trail
      paint.color = particleColor.withOpacity(0.2);
      canvas.drawCircle(
        Offset(x, y - 20),
        1.0,
        paint,
      );
    }

    // Draw connection lines between nearby particles
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    for (int i = 0; i < 25; i++) {
      final progress1 = (animation + (i * 0.02)) % 1.0;
      final x1 = (size.width * (i * 0.123)) % size.width;
      final y1 = size.height * progress1;
      
      final progress2 = (animation + ((i + 1) * 0.02)) % 1.0;
      final x2 = (size.width * ((i + 1) * 0.123)) % size.width;
      final y2 = size.height * progress2;
      
      final distance = (Offset(x1, y1) - Offset(x2, y2)).distance;
      
      if (distance < 100) {
        paint.color = ArchonTheme.primaryCyan.withOpacity(0.1);
        canvas.drawLine(
          Offset(x1, y1),
          Offset(x2, y2),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant ParticleWallpaperPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}

// Neural waves painter
class NeuralWavesPainter extends CustomPainter {
  final double animation;

  NeuralWavesPainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    // Draw multiple wave layers
    for (int layer = 0; layer < 3; layer++) {
      final path = Path();
      paint.color = [
        ArchonTheme.primaryCyan,
        ArchonTheme.secondaryBlue,
        ArchonTheme.accentPurple,
      ][layer].withOpacity(0.3 - layer * 0.1);

      // Create wave path
      for (int i = 0; i <= size.width.toInt(); i += 5) {
        final x = i.toDouble();
        final frequency = 0.02 + layer * 0.01;
        final amplitude = 50 + layer * 20;
        final phase = animation * 2 * 3.14159;
        
        final y = size.height * 0.7 + 
                  amplitude * _sin(frequency * x + phase) +
                  layer * 30;

        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }

      canvas.drawPath(path, paint);
    }
  }

  // Simplified sin function
  double _sin(double x) {
    // Approximate sine using Taylor series (simplified)
    return x - (x * x * x) / 6 + (x * x * x * x * x) / 120;
  }

  @override
  bool shouldRepaint(covariant NeuralWavesPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}

// Grid overlay painter
class GridOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = ArchonTheme.primaryCyan.withOpacity(0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    // Draw grid lines
    const gridSize = 50.0;
    
    // Vertical lines
    for (double x = 0; x <= size.width; x += gridSize) {
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        paint,
      );
    }
    
    // Horizontal lines
    for (double y = 0; y <= size.height; y += gridSize) {
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}