import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/theme/archon_theme.dart';
import '../presentation/archon_desktop.dart';
import '../../applications/widgets/app_window.dart';

class Taskbar extends StatefulWidget {
  final List<DesktopApp> apps;
  final Function(DesktopApp) onAppLaunched;
  final List<AppWindow> openWindows;

  const Taskbar({
    super.key,
    required this.apps,
    required this.onAppLaunched,
    required this.openWindows,
  });

  @override
  State<Taskbar> createState() => TaskbarState();
}

class TaskbarState extends State<Taskbar> with TickerProviderStateMixin {
  late AnimationController _taskbarController;
  late AnimationController _hologramController;
  
  final List<AppWindow> _taskbarWindows = [];
  
  @override
  void initState() {
    super.initState();
    _taskbarController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _hologramController = AnimationController(
      duration: const Duration(seconds: 5),
      vsync: this,
    );
    
    _taskbarController.forward();
    _hologramController.repeat();
  }
  
  @override
  void dispose() {
    _taskbarController.dispose();
    _hologramController.dispose();
    super.dispose();
  }

  void addWindow(AppWindow window) {
    setState(() {
      _taskbarWindows.add(window);
    });
  }

  void removeWindow(String windowId) {
    setState(() {
      _taskbarWindows.removeWhere((window) => window.id == windowId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return AnimatedBuilder(
      animation: _taskbarController,
      builder: (context, child) {
        return Container(
          height: 80,
          width: size.width,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                ArchonTheme.deepSpace.withOpacity(0.8),
                ArchonTheme.voidBlack.withOpacity(0.95),
              ],
            ),
            border: const Border(
              top: BorderSide(
                color: ArchonTheme.primaryCyan,
                width: 1,
              ),
            ),
          ),
          child: Stack(
            children: [
              // Holographic effect overlay
              AnimatedBuilder(
                animation: _hologramController,
                builder: (context, child) {
                  return CustomPaint(
                    painter: TaskbarHologramPainter(
                      animation: _hologramController.value,
                    ),
                    size: Size(size.width, 80),
                  );
                },
              ),
              
              // Main taskbar content
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    // ARCHON OS Logo/Menu Button
                    _buildArchonMenuButton(),
                    
                    const SizedBox(width: 20),
                    
                    // Quick Launch Apps
                    _buildQuickLaunchArea(),
                    
                    const SizedBox(width: 20),
                    
                    // Open Windows/Tasks
                    Expanded(child: _buildOpenWindowsArea()),
                    
                    const SizedBox(width: 20),
                    
                    // System Tray
                    _buildSystemTray(),
                    
                    const SizedBox(width: 20),
                    
                    // System Clock and Date
                    _buildSystemClock(),
                  ],
                ),
              ),
            ],
          ),
        )
            .animate()
            .slideY(begin: 1.0, end: 0.0)
            .fadeIn();
      },
    );
  }

  Widget _buildArchonMenuButton() {
    return GestureDetector(
      onTap: _showArchonMenu,
      child: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          gradient: RadialGradient(
            colors: [
              ArchonTheme.primaryCyan.withOpacity(0.3),
              ArchonTheme.primaryCyan.withOpacity(0.1),
              Colors.transparent,
            ],
          ),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: ArchonTheme.primaryCyan.withOpacity(0.5),
            width: 1.5,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer ring
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: ArchonTheme.primaryCyan.withOpacity(0.3),
                  width: 1,
                ),
              ),
            ),
            
            // ARCHON text
            Text(
              'A',
              style: GoogleFonts.orbitron(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: ArchonTheme.primaryCyan,
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 200.ms)
        .scale(delay: 200.ms)
        .then()
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .shimmer(
          duration: 3.seconds,
          color: ArchonTheme.primaryCyan.withOpacity(0.3),
        );
  }

  Widget _buildQuickLaunchArea() {
    final quickLaunchApps = widget.apps.take(4).toList();
    
    return Row(
      children: quickLaunchApps.asMap().entries.map((entry) {
        final index = entry.key;
        final app = entry.value;
        
        return Container(
          margin: const EdgeInsets.only(right: 12),
          child: GestureDetector(
            onTap: () => widget.onAppLaunched(app),
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: app.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: app.color.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Icon(
                app.icon,
                size: 24,
                color: app.color,
              ),
            ),
          ),
        )
            .animate()
            .fadeIn(delay: (300 + index * 100).ms)
            .slideY(begin: 0.5, end: 0);
      }).toList(),
    );
  }

  Widget _buildOpenWindowsArea() {
    if (_taskbarWindows.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _taskbarWindows.length,
        itemBuilder: (context, index) {
          final window = _taskbarWindows[index];
          
          return Container(
            width: 200,
            margin: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => _focusWindow(window),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: ArchonTheme.hologramGlass,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: window.app.color.withOpacity(0.5),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      window.app.icon,
                      size: 20,
                      color: window.app.color,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        window.app.name,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.9),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => removeWindow(window.id),
                      child: Icon(
                        Icons.close_rounded,
                        size: 16,
                        color: Colors.white.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
              .animate()
              .fadeIn(delay: (index * 100).ms)
              .slideX(begin: 0.3, end: 0);
        },
      ),
    );
  }

  Widget _buildSystemTray() {
    return Row(
      children: [
        // Network Status
        _buildTrayIcon(
          Icons.wifi_rounded,
          ArchonTheme.successGreen,
          'Network Active',
        ),
        
        const SizedBox(width: 12),
        
        // Audio
        _buildTrayIcon(
          Icons.volume_up_rounded,
          ArchonTheme.secondaryBlue,
          'Audio System',
        ),
        
        const SizedBox(width: 12),
        
        // System Monitor
        _buildTrayIcon(
          Icons.memory_rounded,
          ArchonTheme.warningOrange,
          'System Monitor',
        ),
        
        const SizedBox(width: 12),
        
        // Notifications
        _buildTrayIcon(
          Icons.notifications_rounded,
          ArchonTheme.accentPurple,
          'Notifications',
        ),
      ],
    );
  }

  Widget _buildTrayIcon(IconData icon, Color color, String tooltip) {
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          size: 18,
          color: color,
        ),
      ),
    )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .shimmer(
          duration: 4.seconds,
          color: color.withOpacity(0.2),
        );
  }

  Widget _buildSystemClock() {
    return StreamBuilder<DateTime>(
      stream: Stream.periodic(const Duration(seconds: 1), (_) => DateTime.now()),
      builder: (context, snapshot) {
        final now = snapshot.data ?? DateTime.now();
        
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: ArchonTheme.primaryCyan,
              ),
            ),
            Text(
              '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 11,
                color: Colors.white.withOpacity(0.7),
              ),
            ),
          ],
        );
      },
    )
        .animate()
        .fadeIn(delay: 1000.ms)
        .slideX(begin: 0.3, end: 0);
  }

  void _showArchonMenu() {
    // Implementation for ARCHON main menu
    // Could show app launcher, system settings, etc.
    showDialog(
      context: context,
      builder: (context) => const ArchonMainMenu(),
    );
  }

  void _focusWindow(AppWindow window) {
    // Implementation to bring window to front
    // Could animate window to foreground
  }
}

// Taskbar hologram effect painter
class TaskbarHologramPainter extends CustomPainter {
  final double animation;

  TaskbarHologramPainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Draw moving energy lines
    for (int i = 0; i < 5; i++) {
      final progress = (animation + (i * 0.2)) % 1.0;
      final x = size.width * progress;
      
      paint.color = ArchonTheme.primaryCyan.withOpacity(0.3 - i * 0.05);
      
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        paint,
      );
    }

    // Draw corner accents
    paint
      ..color = ArchonTheme.primaryCyan.withOpacity(0.5)
      ..strokeWidth = 2;
    
    // Top-left corner
    canvas.drawLine(
      const Offset(0, 0),
      const Offset(20, 0),
      paint,
    );
    canvas.drawLine(
      const Offset(0, 0),
      const Offset(0, 20),
      paint,
    );
    
    // Top-right corner
    canvas.drawLine(
      Offset(size.width - 20, 0),
      Offset(size.width, 0),
      paint,
    );
    canvas.drawLine(
      Offset(size.width, 0),
      Offset(size.width, 20),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant TaskbarHologramPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}

// ARCHON Main Menu Dialog
class ArchonMainMenu extends StatelessWidget {
  const ArchonMainMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: 400,
        height: 500,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              ArchonTheme.deepSpace.withOpacity(0.95),
              ArchonTheme.neuralBlue.withOpacity(0.95),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: ArchonTheme.primaryCyan.withOpacity(0.5),
            width: 2,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Menu Header
            Text(
              'ARCHON CONTROL',
              style: GoogleFonts.orbitron(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: ArchonTheme.primaryCyan,
                letterSpacing: 2,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Menu Items
            Expanded(
              child: ListView(
                children: [
                  _buildMenuItem('System Settings', Icons.settings_rounded),
                  _buildMenuItem('Application Manager', Icons.apps_rounded),
                  _buildMenuItem('Neural Network', Icons.psychology_rounded),
                  _buildMenuItem('Quantum Files', Icons.folder_rounded),
                  _buildMenuItem('System Monitor', Icons.monitor_heart_rounded),
                  _buildMenuItem('Security Center', Icons.security_rounded),
                  const Divider(color: ArchonTheme.primaryCyan),
                  _buildMenuItem('Power Options', Icons.power_settings_new_rounded),
                ],
              ),
            ),
            
            // Menu Footer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Neural Core v3.7.2',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('CLOSE'),
                ),
              ],
            ),
          ],
        ),
      )
          .animate()
          .fadeIn()
          .scale(begin: 0.8, end: 1.0),
    );
  }

  Widget _buildMenuItem(String title, IconData icon) {
    return ListTile(
      leading: Icon(
        icon,
        color: ArchonTheme.primaryCyan,
        size: 24,
      ),
      title: Text(
        title,
        style: GoogleFonts.jetBrainsMono(
          fontSize: 14,
          color: Colors.white,
        ),
      ),
      onTap: () {
        // Handle menu item tap
      },
    );
  }
}