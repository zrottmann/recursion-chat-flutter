import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../main.dart';
import '../../dashboard/presentation/dashboard_home_screen.dart';
import '../widgets/neural_network_background.dart';
import '../widgets/floating_particles.dart';

class AnimatedSplashScreen extends StatefulWidget {
  const AnimatedSplashScreen({super.key});

  @override
  State<AnimatedSplashScreen> createState() => _AnimatedSplashScreenState();
}

class _AnimatedSplashScreenState extends State<AnimatedSplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );

    // Start animations and navigate after completion
    _startSplashSequence();
  }

  Future<void> _startSplashSequence() async {
    await _controller.forward();
    
    // Navigate to dashboard after animation completes
    if (mounted) {
      await Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) =>
              const DashboardHomeScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: animation,
              child: ScaleTransition(
                scale: Tween<double>(begin: 0.8, end: 1.0).animate(
                  CurvedAnimation(parent: animation, curve: Curves.easeOut),
                ),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 800),
        ),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.primary.withOpacity(0.1),
              theme.colorScheme.secondary.withOpacity(0.05),
              theme.colorScheme.tertiary.withOpacity(0.1),
            ],
          ),
        ),
        child: Stack(
          children: [
            // Neural network background
            const NeuralNetworkBackground(),
            
            // Floating particles
            const FloatingParticles(),
            
            // Main content
            SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Animated logo section
                  _buildAnimatedLogo(theme, size),
                  
                  const SizedBox(height: 32),
                  
                  // Animated title and subtitle
                  _buildAnimatedText(theme),
                  
                  const SizedBox(height: 48),
                  
                  // Loading animation
                  _buildLoadingAnimation(theme),
                  
                  const SizedBox(height: 24),
                  
                  // System status messages
                  _buildSystemStatus(theme),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedLogo(ThemeData theme, Size size) {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.secondary,
            theme.colorScheme.tertiary,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.3),
            blurRadius: 30,
            spreadRadius: 5,
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Rotating outer ring
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: theme.colorScheme.onPrimary.withOpacity(0.3),
                width: 2,
              ),
            ),
          )
              .animate(onPlay: (controller) => controller.repeat())
              .rotate(duration: 3000.ms, curve: Curves.linear),
          
          // Inner pulsing core
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: theme.colorScheme.onPrimary.withOpacity(0.9),
            ),
            child: Icon(
              Icons.psychology_rounded,
              size: 32,
              color: theme.colorScheme.primary,
            ),
          )
              .animate(onPlay: (controller) => controller.repeat(reverse: true))
              .scale(
                duration: 1500.ms,
                begin: const Offset(0.8, 0.8),
                end: const Offset(1.1, 1.1),
                curve: Curves.easeInOut,
              ),
          
          // Orbiting dots
          ...List.generate(3, (index) {
            final angle = (index * 120) * 3.14159 / 180;
            return Transform(
              transform: Matrix4.identity()
                ..translate(40 * 1.2 * (index % 2 == 0 ? 1 : -1), 0.0),
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.onPrimary,
                ),
              ),
            )
                .animate(
                    onPlay: (controller) =>
                        controller.repeat(period: Duration(milliseconds: 2000 + (index * 200))))
                .rotate(
                  duration: 2000.ms,
                  curve: Curves.linear,
                );
          }),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 800.ms, curve: Curves.easeOut)
        .scale(
          duration: 1000.ms,
          begin: const Offset(0.5, 0.5),
          curve: Curves.elasticOut,
        );
  }

  Widget _buildAnimatedText(ThemeData theme) {
    return Column(
      children: [
        // Main title
        Text(
          AppInfo.name,
          style: GoogleFonts.orbitron(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: theme.colorScheme.onSurface,
            letterSpacing: 1.2,
          ),
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(delay: 800.ms, duration: 600.ms)
            .slideY(
              delay: 800.ms,
              begin: 0.3,
              duration: 800.ms,
              curve: Curves.easeOut,
            ),
        
        const SizedBox(height: 8),
        
        // Subtitle
        Text(
          AppInfo.description,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: theme.colorScheme.onSurface.withOpacity(0.7),
            letterSpacing: 0.5,
          ),
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(delay: 1200.ms, duration: 600.ms)
            .slideY(
              delay: 1200.ms,
              begin: 0.2,
              duration: 600.ms,
              curve: Curves.easeOut,
            ),
        
        const SizedBox(height: 4),
        
        // Tagline
        Text(
          AppInfo.tagline,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w300,
            color: theme.colorScheme.primary,
            letterSpacing: 0.8,
          ),
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(delay: 1600.ms, duration: 600.ms)
            .slideY(
              delay: 1600.ms,
              begin: 0.1,
              duration: 600.ms,
              curve: Curves.easeOut,
            ),
      ],
    );
  }

  Widget _buildLoadingAnimation(ThemeData theme) {
    return SizedBox(
      width: 200,
      child: Column(
        children: [
          // Progress bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              color: theme.colorScheme.surfaceVariant,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(
                  theme.colorScheme.primary,
                ),
              )
                  .animate()
                  .fadeIn(delay: 2000.ms, duration: 400.ms),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Loading text
          Text(
            'Initializing Agents...',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          )
              .animate()
              .fadeIn(delay: 2200.ms, duration: 400.ms),
        ],
      ),
    );
  }

  Widget _buildSystemStatus(ThemeData theme) {
    final statusMessages = [
      'Neural networks online...',
      'Agent orchestrator ready...',
      'WebSocket connections established...',
      'Dashboard initialized...',
    ];

    return SizedBox(
      height: 60,
      child: Column(
        children: statusMessages.asMap().entries.map((entry) {
          final index = entry.key;
          final message = entry.value;
          final delay = 2400 + (index * 300);

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 1),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  message,
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
              ],
            )
                .animate()
                .fadeIn(delay: Duration(milliseconds: delay), duration: 400.ms)
                .slideX(
                  delay: Duration(milliseconds: delay),
                  begin: -0.2,
                  duration: 400.ms,
                  curve: Curves.easeOut,
                ),
          );
        }).toList(),
      ),
    );
  }
}