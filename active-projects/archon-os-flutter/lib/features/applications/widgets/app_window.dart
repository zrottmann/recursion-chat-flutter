import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/theme/archon_theme.dart';
import '../../desktop/presentation/archon_desktop.dart';
import '../presentation/terminal_app.dart';
import '../presentation/file_manager_app.dart';
import '../presentation/browser_app.dart';
import '../presentation/ai_assistant_app.dart';
import '../presentation/media_player_app.dart';
import '../presentation/system_monitor_app.dart';

class AppWindow extends StatefulWidget {
  final String id;
  final DesktopApp app;
  final Offset initialPosition;
  final VoidCallback onClose;
  final VoidCallback onMinimize;
  final VoidCallback onMaximize;

  const AppWindow({
    super.key,
    required this.id,
    required this.app,
    required this.initialPosition,
    required this.onClose,
    required this.onMinimize,
    required this.onMaximize,
  });

  @override
  State<AppWindow> createState() => _AppWindowState();
}

class _AppWindowState extends State<AppWindow> with TickerProviderStateMixin {
  late AnimationController _windowController;
  late AnimationController _hologramController;
  
  Offset _position = Offset.zero;
  Size _size = const Size(600, 400);
  bool _isMaximized = false;
  bool _isMinimized = false;
  bool _isDragging = false;
  
  @override
  void initState() {
    super.initState();
    _position = widget.initialPosition;
    
    _windowController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _hologramController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );
    
    _windowController.forward();
    _hologramController.repeat();
  }
  
  @override
  void dispose() {
    _windowController.dispose();
    _hologramController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    
    // Constrain position to screen bounds
    _position = Offset(
      _position.dx.clamp(0, screenSize.width - _size.width),
      _position.dy.clamp(0, screenSize.height - _size.height - 80), // Account for taskbar
    );

    if (_isMinimized) return const SizedBox.shrink();

    return AnimatedBuilder(
      animation: _windowController,
      builder: (context, child) {
        return Positioned(
          left: _isMaximized ? 0 : _position.dx,
          top: _isMaximized ? 0 : _position.dy,
          width: _isMaximized ? screenSize.width : _size.width,
          height: _isMaximized ? screenSize.height - 80 : _size.height,
          child: GestureDetector(
            onPanStart: _onPanStart,
            onPanUpdate: _onPanUpdate,
            onPanEnd: _onPanEnd,
            child: Stack(
              children: [
                // Window Shadow and Glow
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: widget.app.color.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                        offset: const Offset(0, 10),
                      ),
                      BoxShadow(
                        color: ArchonTheme.voidBlack.withOpacity(0.8),
                        blurRadius: 40,
                        spreadRadius: 10,
                        offset: const Offset(0, 20),
                      ),
                    ],
                  ),
                ),
                
                // Main Window Container
                GlassContainer(
                  width: double.infinity,
                  height: double.infinity,
                  blur: 20,
                  color: ArchonTheme.deepSpace.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: widget.app.color.withOpacity(0.5),
                    width: 2,
                  ),
                  child: Column(
                    children: [
                      // Window Title Bar
                      _buildTitleBar(),
                      
                      // Window Content
                      Expanded(
                        child: _buildWindowContent(),
                      ),
                    ],
                  ),
                ),
                
                // Holographic Border Effects
                AnimatedBuilder(
                  animation: _hologramController,
                  builder: (context, child) {
                    return CustomPaint(
                      painter: WindowHologramPainter(
                        animation: _hologramController.value,
                        color: widget.app.color,
                      ),
                      size: _isMaximized 
                          ? Size(screenSize.width, screenSize.height - 80)
                          : _size,
                    );
                  },
                ),
              ],
            ),
          ),
        )
            .animate()
            .fadeIn(duration: 400.ms)
            .scale(
              begin: 0.8,
              end: 1.0,
              curve: Curves.elasticOut,
              duration: 800.ms,
            );
      },
    );
  }

  Widget _buildTitleBar() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            widget.app.color.withOpacity(0.2),
            widget.app.color.withOpacity(0.1),
          ],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        border: const Border(
          bottom: BorderSide(
            color: ArchonTheme.primaryCyan,
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          // App Icon
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: widget.app.color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: widget.app.color.withOpacity(0.5),
                width: 1,
              ),
            ),
            child: Icon(
              widget.app.icon,
              size: 18,
              color: widget.app.color,
            ),
          ),
          
          const SizedBox(width: 12),
          
          // App Title
          Expanded(
            child: Text(
              widget.app.name,
              style: GoogleFonts.orbitron(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          
          // Window Controls
          Row(
            children: [
              _buildWindowControl(
                Icons.minimize_rounded,
                ArchonTheme.warningOrange,
                widget.onMinimize,
              ),
              const SizedBox(width: 8),
              _buildWindowControl(
                _isMaximized ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                ArchonTheme.successGreen,
                _toggleMaximize,
              ),
              const SizedBox(width: 8),
              _buildWindowControl(
                Icons.close_rounded,
                ArchonTheme.errorRed,
                widget.onClose,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWindowControl(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          size: 16,
          color: color,
        ),
      ),
    )
        .animate()
        .shimmer(
          duration: 3.seconds,
          color: color.withOpacity(0.2),
        );
  }

  Widget _buildWindowContent() {
    // Route to appropriate app content based on app ID
    switch (widget.app.id) {
      case 'neural_terminal':
        return const TerminalApp();
      case 'quantum_files':
        return const FileManagerApp();
      case 'holo_browser':
        return const BrowserApp();
      case 'ai_assistant':
        return const AIAssistantApp();
      case 'neural_media':
        return const MediaPlayerApp();
      case 'system_monitor':
        return const SystemMonitorApp();
      default:
        return _buildDefaultContent();
    }
  }

  Widget _buildDefaultContent() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            widget.app.icon,
            size: 64,
            color: widget.app.color.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            widget.app.name,
            style: GoogleFonts.orbitron(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: widget.app.color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Application loading...',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 14,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: 200,
            child: LinearProgressIndicator(
              color: widget.app.color,
              backgroundColor: widget.app.color.withOpacity(0.2),
            ),
          ),
        ],
      ),
    );
  }

  void _onPanStart(DragStartDetails details) {
    if (_isMaximized) return;
    
    setState(() {
      _isDragging = true;
    });
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (_isMaximized || !_isDragging) return;
    
    setState(() {
      _position = Offset(
        _position.dx + details.delta.dx,
        _position.dy + details.delta.dy,
      );
    });
  }

  void _onPanEnd(DragEndDetails details) {
    setState(() {
      _isDragging = false;
    });
  }

  void _toggleMaximize() {
    setState(() {
      _isMaximized = !_isMaximized;
    });
  }
}

// Window hologram effect painter
class WindowHologramPainter extends CustomPainter {
  final double animation;
  final Color color;

  WindowHologramPainter({
    required this.animation,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Draw corner accents
    paint.color = color.withOpacity(0.6);
    final cornerSize = 20.0;
    
    // Top-left corner
    canvas.drawLine(
      const Offset(0, 0),
      Offset(cornerSize, 0),
      paint,
    );
    canvas.drawLine(
      const Offset(0, 0),
      Offset(0, cornerSize),
      paint,
    );
    
    // Top-right corner
    canvas.drawLine(
      Offset(size.width - cornerSize, 0),
      Offset(size.width, 0),
      paint,
    );
    canvas.drawLine(
      Offset(size.width, 0),
      Offset(size.width, cornerSize),
      paint,
    );
    
    // Bottom-left corner
    canvas.drawLine(
      Offset(0, size.height - cornerSize),
      Offset(0, size.height),
      paint,
    );
    canvas.drawLine(
      Offset(0, size.height),
      Offset(cornerSize, size.height),
      paint,
    );
    
    // Bottom-right corner
    canvas.drawLine(
      Offset(size.width - cornerSize, size.height),
      Offset(size.width, size.height),
      paint,
    );
    canvas.drawLine(
      Offset(size.width, size.height - cornerSize),
      Offset(size.width, size.height),
      paint,
    );

    // Draw scanning line
    final scanY = animation * size.height;
    paint
      ..color = color.withOpacity(0.3)
      ..strokeWidth = 2;
    
    canvas.drawLine(
      Offset(0, scanY),
      Offset(size.width, scanY),
      paint,
    );

    // Draw data streams on edges
    paint
      ..color = color.withOpacity(0.2)
      ..strokeWidth = 1;
    
    for (int i = 0; i < 10; i++) {
      final progress = (animation + (i * 0.1)) % 1.0;
      final y = size.height * progress;
      
      // Left edge
      canvas.drawLine(
        Offset(0, y),
        Offset(5, y),
        paint,
      );
      
      // Right edge
      canvas.drawLine(
        Offset(size.width - 5, y),
        Offset(size.width, y),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant WindowHologramPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}