import 'package:flutter/material.dart';

class AnimatedGradientBackground extends StatefulWidget {
  const AnimatedGradientBackground({super.key});

  @override
  State<AnimatedGradientBackground> createState() => _AnimatedGradientBackgroundState();
}

class _AnimatedGradientBackgroundState extends State<AnimatedGradientBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    );
    
    _animation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.linear,
    ));
    
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(
                -1.0 + _animation.value * 2,
                -1.0 + _animation.value,
              ),
              end: Alignment(
                1.0 - _animation.value * 2,
                1.0 - _animation.value,
              ),
              colors: isDark
                  ? [
                      theme.colorScheme.surface,
                      theme.colorScheme.surface.withBlue(
                        theme.colorScheme.surface.blue + 10,
                      ),
                      theme.colorScheme.surface.withRed(
                        theme.colorScheme.surface.red + 10,
                      ),
                      theme.colorScheme.surface,
                    ]
                  : [
                      theme.colorScheme.primary.withOpacity(0.05),
                      theme.colorScheme.secondary.withOpacity(0.05),
                      theme.colorScheme.tertiary.withOpacity(0.05),
                      theme.colorScheme.surface,
                    ],
              stops: const [0.0, 0.3, 0.7, 1.0],
            ),
          ),
          child: CustomPaint(
            painter: _MeshGradientPainter(
              animation: _animation.value,
              colors: [
                theme.colorScheme.primary.withOpacity(0.03),
                theme.colorScheme.secondary.withOpacity(0.03),
                theme.colorScheme.tertiary.withOpacity(0.03),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MeshGradientPainter extends CustomPainter {
  final double animation;
  final List<Color> colors;

  _MeshGradientPainter({
    required this.animation,
    required this.colors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.fill
      ..strokeWidth = 2.0;

    // Create animated mesh gradient effect
    for (int i = 0; i < 3; i++) {
      final offset = Offset(
        size.width * (0.2 + i * 0.3 + animation * 0.1),
        size.height * (0.3 + i * 0.2 + animation * 0.15),
      );
      
      final radius = size.width * (0.3 + animation * 0.1);
      
      paint.shader = RadialGradient(
        colors: [
          colors[i].withOpacity(0.1),
          colors[i].withOpacity(0.0),
        ],
      ).createShader(
        Rect.fromCircle(center: offset, radius: radius),
      );
      
      canvas.drawCircle(offset, radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MeshGradientPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}