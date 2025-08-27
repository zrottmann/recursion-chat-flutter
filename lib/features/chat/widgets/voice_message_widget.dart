import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/voice_message_provider.dart';

class VoiceMessageWidget extends ConsumerWidget {
  final String voiceMessageId;
  final bool isCurrentUser;

  const VoiceMessageWidget({
    super.key,
    required this.voiceMessageId,
    required this.isCurrentUser,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceState = ref.watch(voiceMessageProvider);
    final voiceMessage = voiceState.voiceMessages[voiceMessageId];
    
    if (voiceMessage == null) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final voiceNotifier = ref.read(voiceMessageProvider.notifier);
    
    return Container(
      constraints: const BoxConstraints(maxWidth: 250),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentUser 
            ? theme.colorScheme.primary.withOpacity(0.1)
            : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Play/Pause Button
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              if (voiceMessage.isPlaying) {
                voiceNotifier.pauseVoiceMessage(voiceMessageId);
              } else {
                voiceNotifier.playVoiceMessage(voiceMessageId);
              }
            },
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                shape: BoxShape.circle,
              ),
              child: Icon(
                voiceMessage.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Waveform and duration
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Waveform visualization
                _buildWaveform(context, theme, voiceMessage.progress),
                const SizedBox(height: 4),
                // Duration
                Text(
                  _formatDuration(voiceMessage.duration),
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWaveform(BuildContext context, ThemeData theme, double progress) {
    const waveformBars = 20;
    final random = [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6, 0.3, 0.7, 0.5, 0.9, 0.4, 0.6, 0.8, 0.3, 0.7, 0.5, 0.9, 0.4, 0.6];
    
    return SizedBox(
      height: 24,
      child: Row(
        children: List.generate(waveformBars, (index) {
          final barProgress = (index / waveformBars);
          final isActive = barProgress <= progress;
          final height = 4 + (random[index % random.length] * 16);
          
          return Container(
            width: 2,
            height: height,
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color: isActive 
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outline.withOpacity(0.3),
              borderRadius: BorderRadius.circular(1),
            ),
          );
        }),
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}:${seconds.toString().padLeft(2, '0')}';
  }
}

// Voice recording widget
class VoiceRecordingWidget extends ConsumerStatefulWidget {
  final VoidCallback onRecordingComplete;
  final VoidCallback onCancel;

  const VoiceRecordingWidget({
    super.key,
    required this.onRecordingComplete,
    required this.onCancel,
  });

  @override
  ConsumerState<VoiceRecordingWidget> createState() => _VoiceRecordingWidgetState();
}

class _VoiceRecordingWidgetState extends ConsumerState<VoiceRecordingWidget>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _waveController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    
    _waveController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final voiceState = ref.watch(voiceMessageProvider);
    final voiceNotifier = ref.read(voiceMessageProvider.notifier);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          // Cancel Button
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              voiceNotifier.cancelRecording();
              widget.onCancel();
            },
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.close_rounded,
                color: theme.colorScheme.error,
                size: 24,
              ),
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Recording visualization
          Expanded(
            child: Row(
              children: [
                // Pulsing red dot
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (context, child) {
                    return Container(
                      width: 12 + (_pulseController.value * 4),
                      height: 12 + (_pulseController.value * 4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.5),
                            blurRadius: 8 + (_pulseController.value * 8),
                            spreadRadius: 2 + (_pulseController.value * 2),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                
                const SizedBox(width: 12),
                
                // Recording duration
                Text(
                  _formatDuration(voiceState.recordingDuration),
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                
                const SizedBox(width: 16),
                
                // Animated waveform
                Expanded(child: _buildRecordingWaveform(theme)),
              ],
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Send Button
          GestureDetector(
            onTap: () async {
              HapticFeedback.lightImpact();
              final voiceMessage = await voiceNotifier.stopRecording();
              if (voiceMessage != null) {
                widget.onRecordingComplete();
              }
            },
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordingWaveform(ThemeData theme) {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, child) {
        return Row(
          children: List.generate(12, (index) {
            final phase = (_waveController.value + (index * 0.1)) % 1.0;
            final height = 4 + (20 * (0.5 + 0.5 * (phase < 0.5 ? phase * 2 : (1.0 - phase) * 2)));
            
            return Container(
              width: 3,
              height: height,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(1.5),
              ),
            );
          }),
        );
      },
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}:${seconds.toString().padLeft(2, '0')}';
  }
}