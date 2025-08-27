import 'package:flutter/material.dart';
import 'dart:math' as math;

class AnimatedGradientBackground extends StatefulWidget {
  final List<Color>? colors;
  final Duration? duration;
  final bool enableMeshEffect;

  const AnimatedGradientBackground({
    super.key,
    this.colors,
    this.duration,
    this.enableMeshEffect = true,
  });

  @override
  State<AnimatedGradientBackground> createState() => _AnimatedGradientBackgroundState();
}

class _AnimatedGradientBackgroundState extends State<AnimatedGradientBackground>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _meshController;
  late List<Color> _gradientColors;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.duration ?? const Duration(seconds: 8),
      vsync: this,
    );
    
    _meshController = AnimationController(
      duration: const Duration(seconds: 15),
      vsync: this,
    );

    _controller.repeat();
    if (widget.enableMeshEffect) {
      _meshController.repeat();
    }

    // Set default colors if none provided
    _gradientColors = widget.colors ?? [];
  }

  @override
  void dispose() {
    _controller.dispose();
    _meshController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Use theme colors if no colors provided
    if (_gradientColors.isEmpty) {
      _gradientColors = [
        theme.colorScheme.primary.withOpacity(0.15),
        theme.colorScheme.secondary.withOpacity(0.10),
        theme.colorScheme.tertiary.withOpacity(0.12),
        theme.colorScheme.surface.withOpacity(0.95),
      ];
    }

    return AnimatedBuilder(
      animation: Listenable.merge([_controller, _meshController]),
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: _gradientColors,
              stops: const [0.0, 0.3, 0.7, 1.0],
            ),
          ),
          child: widget.enableMeshEffect
              ? CustomPaint(
                  painter: MeshGradientPainter(
                    animationValue: _meshController.value,
                    colors: _gradientColors,
                  ),
                  size: Size.infinite,
                )
              : null,
        );
      },
    );
  }
}

class MeshGradientPainter extends CustomPainter {
  final double animationValue;
  final List<Color> colors;
  final Paint _paint = Paint();

  MeshGradientPainter({
    required this.animationValue,
    required this.colors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw moving gradient circles for mesh effect
    final centerX = size.width * 0.5;
    final centerY = size.height * 0.5;
    
    // Multiple animated circles
    final circles = [
      _CircleData(
        center: Offset(
          centerX + math.sin(animationValue * 2 * math.pi) * size.width * 0.3,
          centerY + math.cos(animationValue * 2 * math.pi * 0.7) * size.height * 0.2,
        ),
        radius: size.width * 0.4,
        color: colors[0],
      ),
      _CircleData(
        center: Offset(
          centerX + math.sin(animationValue * 2 * math.pi * 0.8 + 1) * size.width * 0.25,
          centerY + math.cos(animationValue * 2 * math.pi * 0.6 + 2) * size.height * 0.25,
        ),
        radius: size.width * 0.35,
        color: colors.length > 1 ? colors[1] : colors[0],
      ),
      _CircleData(
        center: Offset(
          centerX + math.sin(animationValue * 2 * math.pi * 0.5 + 3) * size.width * 0.2,
          centerY + math.cos(animationValue * 2 * math.pi * 0.9 + 1.5) * size.height * 0.3,
        ),
        radius: size.width * 0.3,
        color: colors.length > 2 ? colors[2] : colors[0],
      ),
    ];

    for (final circle in circles) {
      _paint.shader = RadialGradient(
        colors: [
          circle.color.withOpacity(0.1),
          circle.color.withOpacity(0.05),
          circle.color.withOpacity(0.0),
        ],
        stops: const [0.0, 0.7, 1.0],
      ).createShader(
        Rect.fromCircle(center: circle.center, radius: circle.radius),
      );

      canvas.drawCircle(circle.center, circle.radius, _paint);
    }

    // Additional floating orbs
    final orbs = [
      _OrbData(
        position: Offset(
          size.width * 0.2 + math.sin(animationValue * 2 * math.pi * 0.3) * 50,
          size.height * 0.3 + math.cos(animationValue * 2 * math.pi * 0.4) * 30,
        ),
        size: 60,
        intensity: 0.8 + math.sin(animationValue * 4 * math.pi) * 0.2,
      ),
      _OrbData(
        position: Offset(
          size.width * 0.8 + math.sin(animationValue * 2 * math.pi * 0.6) * 40,
          size.height * 0.7 + math.cos(animationValue * 2 * math.pi * 0.5) * 35,
        ),
        size: 45,
        intensity: 0.7 + math.sin(animationValue * 3 * math.pi + 1) * 0.3,
      ),
      _OrbData(
        position: Offset(
          size.width * 0.15 + math.sin(animationValue * 2 * math.pi * 0.8) * 35,
          size.height * 0.8 + math.cos(animationValue * 2 * math.pi * 0.3) * 25,
        ),
        size: 35,
        intensity: 0.6 + math.sin(animationValue * 5 * math.pi + 2) * 0.4,
      ),
    ];

    for (int i = 0; i < orbs.length; i++) {
      final orb = orbs[i];
      final color = colors[i % colors.length];
      
      _paint.shader = RadialGradient(
        colors: [
          color.withOpacity(orb.intensity * 0.15),
          color.withOpacity(orb.intensity * 0.08),
          color.withOpacity(0.0),
        ],
        stops: const [0.0, 0.6, 1.0],
      ).createShader(
        Rect.fromCircle(center: orb.position, radius: orb.size),
      );

      canvas.drawCircle(orb.position, orb.size, _paint);
    }
  }

  @override
  bool shouldRepaint(covariant MeshGradientPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}

class _CircleData {
  final Offset center;
  final double radius;
  final Color color;

  _CircleData({
    required this.center,
    required this.radius,
    required this.color,
  });
}

class _OrbData {
  final Offset position;
  final double size;
  final double intensity;

  _OrbData({
    required this.position,
    required this.size,
    required this.intensity,
  });
}

/// Animated gradient background specifically for AI/Tech themes
class TechGradientBackground extends AnimatedGradientBackground {
  const TechGradientBackground({super.key})
      : super(
          colors: const [
            Color(0xFF6C5CE7), // Purple
            Color(0xFF00CEC9), // Teal
            Color(0xFF0984E3), // Blue
            Color(0xFF2D3436), // Dark
          ],
          duration: const Duration(seconds: 12),
          enableMeshEffect: true,
        );
}

/// Animated gradient background for neural network themes
class NeuralGradientBackground extends AnimatedGradientBackground {
  const NeuralGradientBackground({super.key})
      : super(
          colors: const [
            Color(0xFF74B9FF), // Light Blue
            Color(0xFF0984E3), // Blue
            Color(0xFF6C5CE7), // Purple
            Color(0xFF81ECEC), // Cyan
          ],
          duration: const Duration(seconds: 10),
          enableMeshEffect: true,
        );
}