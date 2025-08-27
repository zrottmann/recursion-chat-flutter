import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/theme/archon_theme.dart';

class FloatingWidgets extends StatefulWidget {
  const FloatingWidgets({super.key});

  @override
  State<FloatingWidgets> createState() => _FloatingWidgetsState();
}

class _FloatingWidgetsState extends State<FloatingWidgets>
    with TickerProviderStateMixin {
  late AnimationController _systemStatsController;
  late AnimationController _clockController;
  
  @override
  void initState() {
    super.initState();
    _systemStatsController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    _clockController = AnimationController(
      duration: const Duration(seconds: 60),
      vsync: this,
    );
    
    _systemStatsController.repeat();
    _clockController.repeat();
  }
  
  @override
  void dispose() {
    _systemStatsController.dispose();
    _clockController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Stack(
      children: [
        // System Performance Widget (Top Right)
        Positioned(
          top: 80,
          right: 20,
          child: _buildSystemStatsWidget(),
        ),
        
        // Neural Activity Monitor (Top Left)
        Positioned(
          top: 120,
          left: 20,
          child: _buildNeuralActivityWidget(),
        ),
        
        // Quantum Clock (Bottom Right)
        Positioned(
          bottom: 120,
          right: 20,
          child: _buildQuantumClockWidget(),
        ),
        
        // Connection Status (Bottom Left)
        Positioned(
          bottom: 120,
          left: 20,
          child: _buildConnectionStatusWidget(),
        ),
        
        // Floating Hologram Elements
        ..._buildFloatingHolograms(size),
      ],
    );
  }

  Widget _buildSystemStatsWidget() {
    return GlassContainer(
      width: 200,
      height: 120,
      blur: 15,
      color: ArchonTheme.hologramGlass,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: ArchonTheme.primaryCyan.withOpacity(0.3),
        width: 1,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.memory_rounded,
                  size: 16,
                  color: ArchonTheme.primaryCyan,
                ),
                const SizedBox(width: 8),
                Text(
                  'NEURAL CORE',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: ArchonTheme.primaryCyan,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // CPU Usage
            _buildStatBar('CPU', 78, ArchonTheme.successGreen),
            const SizedBox(height: 6),
            
            // Memory Usage
            _buildStatBar('RAM', 64, ArchonTheme.warningOrange),
            const SizedBox(height: 6),
            
            // Neural Load
            AnimatedBuilder(
              animation: _systemStatsController,
              builder: (context, child) {
                final neuralLoad = 45 + (_systemStatsController.value * 30).round();
                return _buildStatBar('NEURAL', neuralLoad, ArchonTheme.primaryCyan);
              },
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 1500.ms)
        .slideX(begin: 0.5, end: 0)
        .then()
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .shimmer(
          duration: 5.seconds,
          color: ArchonTheme.primaryCyan.withOpacity(0.1),
        );
  }

  Widget _buildStatBar(String label, int value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.jetBrainsMono(
                fontSize: 10,
                color: Colors.white.withOpacity(0.8),
              ),
            ),
            Text(
              '$value%',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Container(
          height: 3,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(2),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: value / 100,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNeuralActivityWidget() {
    return GlassContainer(
      width: 180,
      height: 100,
      blur: 15,
      color: ArchonTheme.hologramGlass,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: ArchonTheme.successGreen.withOpacity(0.3),
        width: 1,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.psychology_rounded,
                  size: 16,
                  color: ArchonTheme.successGreen,
                ),
                const SizedBox(width: 8),
                Text(
                  'NEURAL ACTIVITY',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: ArchonTheme.successGreen,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Neural activity visualization
            Expanded(
              child: AnimatedBuilder(
                animation: _systemStatsController,
                builder: (context, child) {
                  return CustomPaint(
                    painter: NeuralActivityPainter(
                      animation: _systemStatsController.value,
                    ),
                    size: const Size(150, 50),
                  );
                },
              ),
            ),
            
            Text(
              'AI CORES: ACTIVE',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 9,
                color: ArchonTheme.successGreen,
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 1800.ms)
        .slideX(begin: -0.5, end: 0);
  }

  Widget _buildQuantumClockWidget() {
    return StreamBuilder<DateTime>(
      stream: Stream.periodic(const Duration(seconds: 1), (_) => DateTime.now()),
      builder: (context, snapshot) {
        final now = snapshot.data ?? DateTime.now();
        
        return GlassContainer(
          width: 160,
          height: 90,
          blur: 15,
          color: ArchonTheme.hologramGlass,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: ArchonTheme.accentPurple.withOpacity(0.3),
            width: 1,
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'QUANTUM TIME',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: ArchonTheme.accentPurple,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: ArchonTheme.primaryCyan,
                  ),
                ),
                
                Text(
                  '${_getWeekdayName(now.weekday)}, ${now.day}/${now.month}/${now.year}',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 9,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    )
        .animate()
        .fadeIn(delay: 2100.ms)
        .slideX(begin: 0.5, end: 0)
        .then()
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .shimmer(
          duration: 6.seconds,
          color: ArchonTheme.accentPurple.withOpacity(0.1),
        );
  }

  Widget _buildConnectionStatusWidget() {
    return GlassContainer(
      width: 170,
      height: 80,
      blur: 15,
      color: ArchonTheme.hologramGlass,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: ArchonTheme.secondaryBlue.withOpacity(0.3),
        width: 1,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: ArchonTheme.successGreen,
                    shape: BoxShape.circle,
                  ),
                )
                    .animate(onPlay: (controller) => controller.repeat(reverse: true))
                    .scaleXY(
                      begin: 0.8,
                      end: 1.2,
                      duration: 2.seconds,
                    ),
                const SizedBox(width: 8),
                Text(
                  'QUANTUM LINK',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: ArchonTheme.secondaryBlue,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            Text(
              'UPLINK: 847.3 QBPS',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 9,
                color: Colors.white.withOpacity(0.8),
              ),
            ),
            Text(
              'NEURAL NET: SYNCHRONIZED',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 9,
                color: ArchonTheme.successGreen,
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 2400.ms)
        .slideX(begin: -0.5, end: 0);
  }

  List<Widget> _buildFloatingHolograms(Size screenSize) {
    return [
      // Floating holographic rings
      Positioned(
        top: screenSize.height * 0.2,
        left: screenSize.width * 0.1,
        child: _buildHolographicRing(60, ArchonTheme.primaryCyan, 1),
      ),
      
      Positioned(
        top: screenSize.height * 0.6,
        right: screenSize.width * 0.15,
        child: _buildHolographicRing(80, ArchonTheme.accentPurple, 2),
      ),
      
      Positioned(
        top: screenSize.height * 0.4,
        right: screenSize.width * 0.3,
        child: _buildHolographicRing(45, ArchonTheme.secondaryBlue, 0.5),
      ),
    ];
  }

  Widget _buildHolographicRing(double size, Color color, double delay) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Stack(
        children: [
          // Inner ring
          Center(
            child: Container(
              width: size * 0.6,
              height: size * 0.6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: color.withOpacity(0.5),
                  width: 1,
                ),
              ),
            ),
          ),
          // Center dot
          Center(
            child: Container(
              width: 4,
              height: 4,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            )
                .animate(onPlay: (controller) => controller.repeat(reverse: true))
                .scaleXY(
                  begin: 1.0,
                  end: 2.0,
                  duration: 3.seconds,
                ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: (2000 + delay * 1000).ms)
        .scale(begin: 0.5, end: 1.0)
        .then()
        .animate(onPlay: (controller) => controller.repeat())
        .rotate(duration: (10 + delay * 5).seconds);
  }

  String _getWeekdayName(int weekday) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return days[weekday - 1];
  }
}

// Neural activity painter
class NeuralActivityPainter extends CustomPainter {
  final double animation;

  NeuralActivityPainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    // Draw neural wave patterns
    for (int wave = 0; wave < 3; wave++) {
      final path = Path();
      paint.color = [
        ArchonTheme.successGreen,
        ArchonTheme.primaryCyan,
        ArchonTheme.secondaryBlue,
      ][wave].withOpacity(0.7);

      for (int i = 0; i <= size.width.toInt(); i += 2) {
        final x = i.toDouble();
        final frequency = 0.05 + wave * 0.02;
        final amplitude = 8 + wave * 4;
        final phase = animation * 2 * 3.14159;
        
        final y = size.height * 0.5 + 
                  amplitude * _sin(frequency * x + phase + wave * 0.5) +
                  wave * 2;

        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }

      canvas.drawPath(path, paint);
    }

    // Draw neural connection points
    paint.style = PaintingStyle.fill;
    for (int i = 0; i < 5; i++) {
      final x = size.width * (i / 4);
      final y = size.height * 0.5;
      
      paint.color = ArchonTheme.successGreen.withOpacity(0.8);
      canvas.drawCircle(Offset(x, y), 2, paint);
    }
  }

  // Simplified sine function
  double _sin(double x) {
    while (x > 6.28318) x -= 6.28318;
    while (x < 0) x += 6.28318;
    
    if (x < 3.14159) {
      return x * (1 - x * x / 6 + x * x * x * x / 120);
    } else {
      x -= 3.14159;
      return -(x * (1 - x * x / 6 + x * x * x * x / 120));
    }
  }

  @override
  bool shouldRepaint(covariant NeuralActivityPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}