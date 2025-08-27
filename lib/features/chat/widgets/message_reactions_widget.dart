import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/providers/message_reactions_provider.dart';

class MessageReactionsWidget extends ConsumerWidget {
  final String messageId;
  final bool isCurrentUser;

  const MessageReactionsWidget({
    super.key,
    required this.messageId,
    required this.isCurrentUser,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reactionsState = ref.watch(messageReactionsProvider);
    final reactions = reactionsState.getReactionsForMessage(messageId);
    
    if (reactions.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: EdgeInsets.only(
        left: isCurrentUser ? 40 : 40,
        right: isCurrentUser ? 8 : 40,
        bottom: 4,
      ),
      child: Wrap(
        spacing: 6,
        runSpacing: 4,
        alignment: isCurrentUser ? WrapAlignment.end : WrapAlignment.start,
        children: reactions.map((reaction) {
          return _buildReactionChip(context, ref, reaction);
        }).toList(),
      ),
    );
  }

  Widget _buildReactionChip(BuildContext context, WidgetRef ref, MessageReaction reaction) {
    final theme = Theme.of(context);
    final reactionsNotifier = ref.read(messageReactionsProvider.notifier);
    final hasUserReacted = reaction.hasUserReacted;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        if (hasUserReacted) {
          reactionsNotifier.removeReaction(messageId, reaction.emoji);
        } else {
          reactionsNotifier.addReaction(messageId, reaction.emoji);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: hasUserReacted
              ? theme.colorScheme.primary.withOpacity(0.2)
              : theme.colorScheme.surface.withOpacity(0.8),
          border: Border.all(
            color: hasUserReacted
                ? theme.colorScheme.primary.withOpacity(0.5)
                : theme.colorScheme.outline.withOpacity(0.3),
            width: hasUserReacted ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              reaction.emoji,
              style: const TextStyle(fontSize: 14),
            ),
            if (reaction.count > 1) ...[
              const SizedBox(width: 4),
              Text(
                '${reaction.count}',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: hasUserReacted
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ],
          ],
        ),
      ),
    )
        .animate()
        .scale(duration: 200.ms, curve: Curves.elasticOut)
        .fadeIn();
  }
}

class MessageReactionPicker extends ConsumerWidget {
  final String messageId;
  final VoidCallback onClose;

  const MessageReactionPicker({
    super.key,
    required this.messageId,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final reactionsNotifier = ref.read(messageReactionsProvider.notifier);

    return GlassContainer(
      blur: 20,
      color: theme.colorScheme.surface.withOpacity(0.95),
      borderRadius: BorderRadius.circular(25),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: MessageReactionsNotifier.popularReactions.map((emoji) {
            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                reactionsNotifier.addReaction(messageId, emoji);
                onClose();
              },
              child: Container(
                width: 40,
                height: 40,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    emoji,
                    style: const TextStyle(fontSize: 20),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    )
        .animate()
        .scale(duration: 300.ms, curve: Curves.elasticOut)
        .fadeIn();
  }
}

// Widget for adding reactions to messages
class AddReactionButton extends ConsumerWidget {
  final String messageId;

  const AddReactionButton({
    super.key,
    required this.messageId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => _showReactionPicker(context, ref),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.3),
          ),
        ),
        child: Icon(
          Icons.add_reaction_outlined,
          size: 16,
          color: theme.colorScheme.onSurface.withOpacity(0.6),
        ),
      ),
    );
  }

  void _showReactionPicker(BuildContext context, WidgetRef ref) {
    HapticFeedback.lightImpact();
    
    showDialog(
      context: context,
      barrierColor: Colors.transparent,
      builder: (context) => Stack(
        children: [
          Positioned.fill(
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(color: Colors.transparent),
            ),
          ),
          Center(
            child: MessageReactionPicker(
              messageId: messageId,
              onClose: () => Navigator.of(context).pop(),
            ),
          ),
        ],
      ),
    );
  }
}