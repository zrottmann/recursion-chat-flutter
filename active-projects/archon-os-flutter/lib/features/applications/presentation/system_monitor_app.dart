import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/archon_theme.dart';

class SystemMonitorApp extends StatelessWidget {
  const SystemMonitorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ArchonTheme.voidBlack.withOpacity(0.95),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.monitor_heart_rounded,
              size: 64,
              color: ArchonTheme.errorRed.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'System Monitor',
              style: GoogleFonts.orbitron(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: ArchonTheme.errorRed,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'System monitoring coming soon...',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 14,
                color: Colors.white.withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}