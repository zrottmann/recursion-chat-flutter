import 'package:flutter/material.dart';
import 'dart:math' as math;

class FloatingParticles extends StatefulWidget {
  const FloatingParticles({super.key});

  @override
  State<FloatingParticles> createState() => _FloatingParticlesState();
}

class _FloatingParticlesState extends State<FloatingParticles>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<Particle> _particles;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    );
    _controller.repeat();
    _initializeParticles();
  }

  void _initializeParticles() {
    final random = math.Random();
    _particles = [];

    // Create floating particles with different types
    for (int i = 0; i < 15; i++) {
      _particles.add(Particle(
        position: Offset(
          random.nextDouble(),
          random.nextDouble(),
        ),
        velocity: Offset(
          (random.nextDouble() - 0.5) * 0.3,
          (random.nextDouble() - 0.5) * 0.3,
        ),
        size: 2.0 + random.nextDouble() * 4.0,
        opacity: 0.3 + random.nextDouble() * 0.4,
        rotationSpeed: (random.nextDouble() - 0.5) * 2.0,
        pulseSpeed: 0.5 + random.nextDouble() * 1.5,
        particleType: ParticleType.values[random.nextInt(ParticleType.values.length)],
      ));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: FloatingParticlesPainter(
            particles: _particles,
            animationValue: _controller.value,
            colorScheme: Theme.of(context).colorScheme,
          ),
          size: Size.infinite,
        );
      },
    );
  }
}

enum ParticleType {
  circle,
  diamond,
  triangle,
  hexagon,
}

class Particle {
  final Offset position;
  final Offset velocity;
  final double size;
  final double opacity;
  final double rotationSpeed;
  final double pulseSpeed;
  final ParticleType particleType;

  Particle({
    required this.position,
    required this.velocity,
    required this.size,
    required this.opacity,
    required this.rotationSpeed,
    required this.pulseSpeed,
    required this.particleType,
  });
}

class FloatingParticlesPainter extends CustomPainter {
  final List<Particle> particles;
  final double animationValue;
  final ColorScheme colorScheme;

  FloatingParticlesPainter({
    required this.particles,
    required this.animationValue,
    required this.colorScheme,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (int i = 0; i < particles.length; i++) {
      final particle = particles[i];
      _drawParticle(canvas, size, particle, i);
    }
  }

  void _drawParticle(Canvas canvas, Size size, Particle particle, int index) {
    // Calculate particle position with movement
    final timeOffset = animationValue * 2 * math.pi;
    final movePhase = timeOffset + index * 0.3;
    
    final currentPos = Offset(
      (particle.position.dx + math.sin(movePhase * 0.5) * 0.1 + particle.velocity.dx * animationValue) % 1.0,
      (particle.position.dy + math.cos(movePhase * 0.3) * 0.08 + particle.velocity.dy * animationValue) % 1.0,
    );

    final screenPos = Offset(
      currentPos.dx * size.width,
      currentPos.dy * size.height,
    );

    // Pulsing animation
    final pulsePhase = timeOffset * particle.pulseSpeed;
    final pulseFactor = (math.sin(pulsePhase) + 1) / 2;
    final currentSize = particle.size * (0.7 + pulseFactor * 0.3);
    final currentOpacity = particle.opacity * (0.6 + pulseFactor * 0.4);

    // Rotation
    final rotation = timeOffset * particle.rotationSpeed;

    canvas.save();
    canvas.translate(screenPos.dx, screenPos.dy);
    canvas.rotate(rotation);

    // Draw glow effect
    final glowPaint = Paint()
      ..color = _getParticleColor(particle, index).withOpacity(currentOpacity * 0.3)
      ..style = PaintingStyle.fill
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8.0);

    _drawParticleShape(canvas, particle.particleType, currentSize * 2, glowPaint);

    // Draw main particle
    final mainPaint = Paint()
      ..color = _getParticleColor(particle, index).withOpacity(currentOpacity)
      ..style = PaintingStyle.fill;

    _drawParticleShape(canvas, particle.particleType, currentSize, mainPaint);

    // Draw inner highlight
    final highlightPaint = Paint()
      ..color = colorScheme.onPrimary.withOpacity(currentOpacity * 0.5)
      ..style = PaintingStyle.fill;

    _drawParticleShape(canvas, particle.particleType, currentSize * 0.5, highlightPaint);

    canvas.restore();
  }

  void _drawParticleShape(Canvas canvas, ParticleType type, double size, Paint paint) {
    switch (type) {
      case ParticleType.circle:
        canvas.drawCircle(Offset.zero, size / 2, paint);
        break;
      
      case ParticleType.diamond:
        final path = Path();
        path.moveTo(0, -size / 2);
        path.lineTo(size / 2, 0);
        path.lineTo(0, size / 2);
        path.lineTo(-size / 2, 0);
        path.close();
        canvas.drawPath(path, paint);
        break;
      
      case ParticleType.triangle:
        final path = Path();
        path.moveTo(0, -size / 2);
        path.lineTo(size / 2, size / 2);
        path.lineTo(-size / 2, size / 2);
        path.close();
        canvas.drawPath(path, paint);
        break;
      
      case ParticleType.hexagon:
        final path = Path();
        for (int i = 0; i < 6; i++) {
          final angle = (i * 60) * math.pi / 180;
          final x = math.cos(angle) * size / 2;
          final y = math.sin(angle) * size / 2;
          if (i == 0) {
            path.moveTo(x, y);
          } else {
            path.lineTo(x, y);
          }
        }
        path.close();
        canvas.drawPath(path, paint);
        break;
    }
  }

  Color _getParticleColor(Particle particle, int index) {
    final colors = [
      colorScheme.primary,
      colorScheme.secondary,
      colorScheme.tertiary,
      colorScheme.primary.withOpacity(0.8),
      colorScheme.secondary.withOpacity(0.8),
    ];
    return colors[index % colors.length];
  }

  @override
  bool shouldRepaint(covariant FloatingParticlesPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}