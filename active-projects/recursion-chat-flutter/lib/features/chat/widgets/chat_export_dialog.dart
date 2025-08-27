import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/services/chat_export_service.dart';

class ChatExportDialog extends StatefulWidget {
  final String chatName;
  final List<dynamic> messages; // Replace with your message type
  final VoidCallback onClose;

  const ChatExportDialog({
    super.key,
    required this.chatName,
    required this.messages,
    required this.onClose,
  });

  @override
  State<ChatExportDialog> createState() => _ChatExportDialogState();
}

class _ChatExportDialogState extends State<ChatExportDialog>
    with TickerProviderStateMixin {
  late AnimationController _dialogController;
  late AnimationController _progressController;
  
  ChatExportService.ExportFormat _selectedFormat = ChatExportService.ExportFormat.pdf;
  bool _isExporting = false;
  double _exportProgress = 0.0;
  String _exportStatus = '';

  @override
  void initState() {
    super.initState();
    _dialogController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _dialogController.forward();
  }

  @override
  void dispose() {
    _dialogController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return AnimatedBuilder(
      animation: _dialogController,
      builder: (context, child) {
        return Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.black.withOpacity(0.5 * _dialogController.value),
          child: Center(
            child: Transform.scale(
              scale: _dialogController.value,
              child: GlassContainer(
                width: size.width * 0.9,
                maxWidth: 400,
                blur: 20,
                color: theme.colorScheme.surface.withOpacity(0.95),
                borderRadius: BorderRadius.circular(24),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      _buildHeader(context, theme),
                      
                      const SizedBox(height: 24),
                      
                      // Export format selection
                      if (!_isExporting) ...[
                        _buildFormatSelection(context, theme),
                        const SizedBox(height: 24),
                      ],
                      
                      // Export progress
                      if (_isExporting) ...[
                        _buildExportProgress(context, theme),
                        const SizedBox(height: 24),
                      ],
                      
                      // Action buttons
                      _buildActionButtons(context, theme),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, ThemeData theme) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.secondary,
              ],
            ),
            borderRadius: BorderRadius.circular(24),
          ),
          child: const Icon(
            Icons.download_rounded,
            color: Colors.white,
            size: 24,
          ),
        )
            .animate()
            .scale(delay: 200.ms)
            .fadeIn(),
        
        const SizedBox(width: 16),
        
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Export Chat',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              )
                  .animate()
                  .fadeIn(delay: 300.ms)
                  .slideX(begin: -0.3, end: 0),
              
              const SizedBox(height: 4),
              
              Text(
                widget.chatName,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                ),
              )
                  .animate()
                  .fadeIn(delay: 400.ms)
                  .slideX(begin: -0.3, end: 0),
            ],
          ),
        ),
        
        if (!_isExporting)
          GestureDetector(
            onTap: widget.onClose,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                Icons.close_rounded,
                size: 18,
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          )
              .animate()
              .fadeIn(delay: 500.ms)
              .scale(),
      ],
    );
  }

  Widget _buildFormatSelection(BuildContext context, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Export Format',
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        )
            .animate()
            .fadeIn(delay: 600.ms)
            .slideY(begin: 0.3, end: 0),
        
        const SizedBox(height: 16),
        
        // PDF Format Option
        _buildFormatOption(
          context,
          theme,
          ChatExportService.ExportFormat.pdf,
          'PDF Document',
          'Professional format with styling',
          Icons.picture_as_pdf_rounded,
          700,
        ),
        
        const SizedBox(height: 12),
        
        // Text Format Option
        _buildFormatOption(
          context,
          theme,
          ChatExportService.ExportFormat.text,
          'Text File',
          'Simple plain text format',
          Icons.text_snippet_rounded,
          800,
        ),
      ],
    );
  }

  Widget _buildFormatOption(
    BuildContext context,
    ThemeData theme,
    ChatExportService.ExportFormat format,
    String title,
    String subtitle,
    IconData icon,
    int animationDelay,
  ) {
    final isSelected = _selectedFormat == format;
    
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedFormat = format;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primaryContainer.withOpacity(0.3)
              : theme.colorScheme.surface.withOpacity(0.3),
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? Border.all(color: theme.colorScheme.primary, width: 2)
              : Border.all(color: theme.colorScheme.outline.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? theme.colorScheme.primary.withOpacity(0.2)
                    : theme.colorScheme.surfaceVariant.withOpacity(0.5),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                icon,
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface.withOpacity(0.7),
                size: 20,
              ),
            ),
            
            const SizedBox(width: 16),
            
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
            
            if (isSelected)
              Icon(
                Icons.check_circle_rounded,
                color: theme.colorScheme.primary,
                size: 20,
              ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: animationDelay.ms)
        .slideX(begin: 0.3, end: 0, curve: Curves.easeOutBack);
  }

  Widget _buildExportProgress(BuildContext context, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
              ),
            )
                .animate()
                .fadeIn()
                .scale(),
            
            const SizedBox(width: 12),
            
            Text(
              _exportStatus,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            )
                .animate()
                .fadeIn(delay: 200.ms),
          ],
        ),
        
        const SizedBox(height: 16),
        
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: _exportProgress,
            backgroundColor: theme.colorScheme.outline.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
            minHeight: 6,
          ),
        )
            .animate()
            .fadeIn(delay: 300.ms)
            .slideX(begin: -0.3, end: 0),
        
        const SizedBox(height: 8),
        
        Text(
          '${(_exportProgress * 100).toInt()}% complete',
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
        )
            .animate()
            .fadeIn(delay: 400.ms),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context, ThemeData theme) {
    return Row(
      children: [
        if (!_isExporting) ...[
          Expanded(
            child: OutlinedButton(
              onPressed: widget.onClose,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                side: BorderSide(color: theme.colorScheme.outline.withOpacity(0.5)),
              ),
              child: Text(
                'Cancel',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: 16),
          
          Expanded(
            child: ElevatedButton(
              onPressed: _startExport,
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: theme.colorScheme.onPrimary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _selectedFormat == ChatExportService.ExportFormat.pdf
                        ? Icons.picture_as_pdf_rounded
                        : Icons.text_snippet_rounded,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Export',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          Expanded(
            child: ElevatedButton(
              onPressed: null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Exporting...',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ],
    )
        .animate()
        .fadeIn(delay: 900.ms)
        .slideY(begin: 0.3, end: 0);
  }

  Future<void> _startExport() async {
    setState(() {
      _isExporting = true;
      _exportStatus = 'Preparing export...';
      _exportProgress = 0.0;
    });

    try {
      // Simulate export progress
      await _updateProgress(0.2, 'Converting messages...');
      await Future.delayed(const Duration(milliseconds: 500));
      
      await _updateProgress(0.5, 'Formatting content...');
      await Future.delayed(const Duration(milliseconds: 500));
      
      await _updateProgress(0.8, 'Generating file...');
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Convert messages to export format
      final exportMessages = ChatExportService.convertMessagesToExportFormat(
        widget.messages,
        'You',
        widget.chatName,
      );

      String filePath;
      
      if (_selectedFormat == ChatExportService.ExportFormat.pdf) {
        filePath = await ChatExportService.exportToPdf(
          chatName: widget.chatName,
          messages: exportMessages,
        );
      } else {
        filePath = await ChatExportService.exportToText(
          chatName: widget.chatName,
          messages: exportMessages,
        );
      }

      await _updateProgress(1.0, 'Export complete!');
      await Future.delayed(const Duration(milliseconds: 500));

      // Show success and offer to share
      _showExportSuccess(filePath);
    } catch (e) {
      _showExportError(e.toString());
    }
  }

  Future<void> _updateProgress(double progress, String status) async {
    setState(() {
      _exportProgress = progress;
      _exportStatus = status;
    });
    _progressController.forward();
    await Future.delayed(const Duration(milliseconds: 100));
  }

  void _showExportSuccess(String filePath) {
    final theme = Theme.of(context);
    final fileName = filePath.split('/').last;
    final fileSize = ChatExportService.getFileSize(filePath);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: theme.colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Colors.green,
                size: 30,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Export Successful!',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              fileName,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: theme.colorScheme.onSurface.withOpacity(0.8),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              fileSize,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close success dialog
              widget.onClose(); // Close export dialog
            },
            child: const Text('Done'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await ChatExportService.shareFile(filePath);
              } catch (e) {
                // Handle share error
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Unable to share file: ${e.toString()}'),
                    backgroundColor: theme.colorScheme.error,
                  ),
                );
              }
            },
            child: const Text('Share'),
          ),
        ],
      ),
    );
  }

  void _showExportError(String error) {
    final theme = Theme.of(context);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: theme.colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text('Export Failed'),
        content: Text('Unable to export chat: $error'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                _isExporting = false;
                _exportProgress = 0.0;
                _exportStatus = '';
              });
            },
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}