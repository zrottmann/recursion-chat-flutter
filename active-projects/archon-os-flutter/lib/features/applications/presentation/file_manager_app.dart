import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/archon_theme.dart';

class FileManagerApp extends StatelessWidget {
  const FileManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ArchonTheme.voidBlack.withOpacity(0.95),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.folder_rounded,
              size: 64,
              color: ArchonTheme.secondaryBlue.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'Quantum Files',
              style: GoogleFonts.orbitron(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: ArchonTheme.secondaryBlue,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'File management system coming soon...',
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