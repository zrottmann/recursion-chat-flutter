import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'dart:ui' as ui;

class NeuralNetworkBackground extends StatefulWidget {
  const NeuralNetworkBackground({super.key});

  @override
  State<NeuralNetworkBackground> createState() => _NeuralNetworkBackgroundState();
}

class _NeuralNetworkBackgroundState extends State<NeuralNetworkBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<NetworkNode> _nodes;
  late List<NetworkConnection> _connections;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    );
    _controller.repeat();
    _initializeNetwork();
  }

  void _initializeNetwork() {
    final random = math.Random();
    _nodes = [];
    _connections = [];

    // Create network nodes
    for (int i = 0; i < 25; i++) {
      _nodes.add(NetworkNode(
        position: Offset(
          random.nextDouble(),
          random.nextDouble(),
        ),
        pulseOffset: random.nextDouble() * 2 * math.pi,
        intensity: 0.3 + random.nextDouble() * 0.7,
      ));
    }

    // Create connections between nearby nodes
    for (int i = 0; i < _nodes.length; i++) {
      for (int j = i + 1; j < _nodes.length; j++) {
        final distance = (_nodes[i].position - _nodes[j].position).distance;
        if (distance < 0.3 && random.nextBool()) {
          _connections.add(NetworkConnection(
            startIndex: i,
            endIndex: j,
            strength: math.max(0.1, 0.8 - distance * 2),
            pulseOffset: random.nextDouble() * 2 * math.pi,
          ));
        }
      }
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
          painter: NeuralNetworkPainter(
            nodes: _nodes,
            connections: _connections,
            animationValue: _controller.value,
            colorScheme: Theme.of(context).colorScheme,
          ),
          size: Size.infinite,
        );
      },
    );
  }
}

class NetworkNode {
  final Offset position; // Normalized position (0-1)
  final double pulseOffset;
  final double intensity;

  NetworkNode({
    required this.position,
    required this.pulseOffset,
    required this.intensity,
  });
}

class NetworkConnection {
  final int startIndex;
  final int endIndex;
  final double strength;
  final double pulseOffset;

  NetworkConnection({
    required this.startIndex,
    required this.endIndex,
    required this.strength,
    required this.pulseOffset,
  });
}

class NeuralNetworkPainter extends CustomPainter {
  final List<NetworkNode> nodes;
  final List<NetworkConnection> connections;
  final double animationValue;
  final ColorScheme colorScheme;

  NeuralNetworkPainter({
    required this.nodes,
    required this.connections,
    required this.animationValue,
    required this.colorScheme,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw connections first (behind nodes)
    _drawConnections(canvas, size);
    
    // Draw nodes on top
    _drawNodes(canvas, size);
  }

  void _drawConnections(Canvas canvas, Size size) {
    final paint = Paint()
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    for (final connection in connections) {
      final startNode = nodes[connection.startIndex];
      final endNode = nodes[connection.endIndex];

      final start = Offset(
        startNode.position.dx * size.width,
        startNode.position.dy * size.height,
      );
      final end = Offset(
        endNode.position.dx * size.width,
        endNode.position.dy * size.height,
      );

      // Animated pulse along the connection
      final pulsePhase = (animationValue * 2 * math.pi + connection.pulseOffset) % (2 * math.pi);
      final pulseIntensity = (math.sin(pulsePhase) + 1) / 2;
      
      // Create gradient effect along the line
      final gradientColors = [
        colorScheme.primary.withOpacity(connection.strength * 0.1),
        colorScheme.primary.withOpacity(connection.strength * pulseIntensity * 0.4),
        colorScheme.secondary.withOpacity(connection.strength * pulseIntensity * 0.3),
        colorScheme.primary.withOpacity(connection.strength * 0.1),
      ];

      final gradientStops = [0.0, 0.3, 0.7, 1.0];

      paint.shader = ui.Gradient.linear(
        start,
        end,
        gradientColors,
        gradientStops,
      );
      
      paint.strokeWidth = 1.0 + pulseIntensity * 1.5;

      canvas.drawLine(start, end, paint);

      // Draw data packet animation
      if (pulseIntensity > 0.7) {
        final packetProgress = (pulsePhase / (2 * math.pi));
        final packetPosition = Offset.lerp(start, end, packetProgress);
        
        if (packetPosition != null) {
          final packetPaint = Paint()
            ..color = colorScheme.tertiary.withOpacity(0.8)
            ..style = PaintingStyle.fill;

          canvas.drawCircle(packetPosition, 3.0, packetPaint);

          // Glow effect for packet
          final glowPaint = Paint()
            ..color = colorScheme.tertiary.withOpacity(0.3)
            ..style = PaintingStyle.fill
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8.0);

          canvas.drawCircle(packetPosition, 6.0, glowPaint);
        }
      }
    }
  }

  void _drawNodes(Canvas canvas, Size size) {
    for (int i = 0; i < nodes.length; i++) {
      final node = nodes[i];
      final position = Offset(
        node.position.dx * size.width,
        node.position.dy * size.height,
      );

      // Pulsing animation for each node
      final pulsePhase = (animationValue * 2 * math.pi + node.pulseOffset) % (2 * math.pi);
      final pulseIntensity = (math.sin(pulsePhase) + 1) / 2;
      final scaledIntensity = node.intensity * pulseIntensity;

      // Outer glow
      final glowPaint = Paint()
        ..color = colorScheme.primary.withOpacity(scaledIntensity * 0.3)
        ..style = PaintingStyle.fill
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 15.0);

      canvas.drawCircle(position, 12.0 + scaledIntensity * 8, glowPaint);

      // Main node circle
      final nodePaint = Paint()
        ..style = PaintingStyle.fill;

      // Gradient for node
      nodePaint.shader = ui.Gradient.radial(
        position,
        8.0,
        [
          colorScheme.primary.withOpacity(0.9),
          colorScheme.secondary.withOpacity(0.7),
          colorScheme.tertiary.withOpacity(0.5),
        ],
        [0.0, 0.5, 1.0],
      );

      canvas.drawCircle(position, 4.0 + scaledIntensity * 2, nodePaint);

      // Inner core
      final corePaint = Paint()
        ..color = colorScheme.onPrimary.withOpacity(0.9)
        ..style = PaintingStyle.fill;

      canvas.drawCircle(position, 2.0 + scaledIntensity, corePaint);

      // Activity ring for highly active nodes
      if (scaledIntensity > 0.7) {
        final ringPaint = Paint()
          ..color = colorScheme.tertiary.withOpacity(0.6)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5;

        canvas.drawCircle(position, 8.0 + scaledIntensity * 3, ringPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant NeuralNetworkPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}