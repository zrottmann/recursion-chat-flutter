import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/archon_theme.dart';

class BrowserApp extends StatelessWidget {
  const BrowserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ArchonTheme.voidBlack.withOpacity(0.95),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.language_rounded,
              size: 64,
              color: ArchonTheme.accentPurple.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'HoloBrowser',
              style: GoogleFonts.orbitron(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: ArchonTheme.accentPurple,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Holographic web browser coming soon...',
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