import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/archon_theme.dart';

class AIAssistantApp extends StatelessWidget {
  const AIAssistantApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ArchonTheme.voidBlack.withOpacity(0.95),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.psychology_rounded,
              size: 64,
              color: ArchonTheme.successGreen.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'AI Assistant',
              style: GoogleFonts.orbitron(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: ArchonTheme.successGreen,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Neural AI assistant coming soon...',
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