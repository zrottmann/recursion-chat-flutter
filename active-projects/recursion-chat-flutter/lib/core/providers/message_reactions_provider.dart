import 'package:flutter_riverpod/flutter_riverpod.dart';

// Message reactions model
class MessageReaction {
  final String emoji;
  final List<String> userIds;
  final DateTime timestamp;

  const MessageReaction({
    required this.emoji,
    required this.userIds,
    required this.timestamp,
  });

  MessageReaction copyWith({
    String? emoji,
    List<String>? userIds,
    DateTime? timestamp,
  }) {
    return MessageReaction(
      emoji: emoji ?? this.emoji,
      userIds: userIds ?? this.userIds,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  bool get hasUserReacted => userIds.contains('current_user');
  int get count => userIds.length;
}

// Message reactions state
class MessageReactionsState {
  final Map<String, List<MessageReaction>> reactions; // messageId -> reactions

  const MessageReactionsState({
    this.reactions = const {},
  });

  MessageReactionsState copyWith({
    Map<String, List<MessageReaction>>? reactions,
  }) {
    return MessageReactionsState(
      reactions: reactions ?? this.reactions,
    );
  }

  List<MessageReaction> getReactionsForMessage(String messageId) {
    return reactions[messageId] ?? [];
  }

  bool hasUserReactedWithEmoji(String messageId, String emoji) {
    final messageReactions = reactions[messageId];
    if (messageReactions == null) return false;
    
    final reaction = messageReactions.where((r) => r.emoji == emoji).firstOrNull;
    return reaction?.hasUserReacted ?? false;
  }
}

// Message reactions notifier
class MessageReactionsNotifier extends StateNotifier<MessageReactionsState> {
  MessageReactionsNotifier() : super(const MessageReactionsState()) {
    _initializeSampleReactions();
  }

  void _initializeSampleReactions() {
    // Add some sample reactions for demonstration
    final sampleReactions = <String, List<MessageReaction>>{
      '1': [
        MessageReaction(
          emoji: '👍',
          userIds: ['ai_assistant'],
          timestamp: DateTime.now().subtract(const Duration(minutes: 2)),
        ),
        MessageReaction(
          emoji: '❤️',
          userIds: ['ai_assistant', 'current_user'],
          timestamp: DateTime.now().subtract(const Duration(minutes: 1)),
        ),
      ],
      '3': [
        MessageReaction(
          emoji: '🔥',
          userIds: ['current_user'],
          timestamp: DateTime.now().subtract(const Duration(seconds: 30)),
        ),
      ],
    };
    
    state = state.copyWith(reactions: sampleReactions);
  }

  void addReaction(String messageId, String emoji) {
    const currentUserId = 'current_user';
    final currentReactions = List<MessageReaction>.from(
      state.getReactionsForMessage(messageId),
    );

    // Check if user already reacted with this emoji
    final existingReactionIndex = currentReactions.indexWhere(
      (reaction) => reaction.emoji == emoji,
    );

    if (existingReactionIndex >= 0) {
      // User already reacted with this emoji, toggle it off
      final existingReaction = currentReactions[existingReactionIndex];
      if (existingReaction.hasUserReacted) {
        final updatedUserIds = existingReaction.userIds
            .where((id) => id != currentUserId)
            .toList();
        
        if (updatedUserIds.isEmpty) {
          // Remove reaction entirely if no users left
          currentReactions.removeAt(existingReactionIndex);
        } else {
          // Update reaction with remaining users
          currentReactions[existingReactionIndex] = existingReaction.copyWith(
            userIds: updatedUserIds,
          );
        }
      } else {
        // Add current user to existing reaction
        currentReactions[existingReactionIndex] = existingReaction.copyWith(
          userIds: [...existingReaction.userIds, currentUserId],
        );
      }
    } else {
      // Create new reaction
      currentReactions.add(
        MessageReaction(
          emoji: emoji,
          userIds: [currentUserId],
          timestamp: DateTime.now(),
        ),
      );
    }

    // Update state
    final updatedReactions = Map<String, List<MessageReaction>>.from(state.reactions);
    if (currentReactions.isEmpty) {
      updatedReactions.remove(messageId);
    } else {
      updatedReactions[messageId] = currentReactions;
    }

    state = state.copyWith(reactions: updatedReactions);
  }

  void removeReaction(String messageId, String emoji) {
    const currentUserId = 'current_user';
    final currentReactions = List<MessageReaction>.from(
      state.getReactionsForMessage(messageId),
    );

    final reactionIndex = currentReactions.indexWhere(
      (reaction) => reaction.emoji == emoji,
    );

    if (reactionIndex >= 0) {
      final reaction = currentReactions[reactionIndex];
      final updatedUserIds = reaction.userIds
          .where((id) => id != currentUserId)
          .toList();

      if (updatedUserIds.isEmpty) {
        currentReactions.removeAt(reactionIndex);
      } else {
        currentReactions[reactionIndex] = reaction.copyWith(
          userIds: updatedUserIds,
        );
      }

      final updatedReactions = Map<String, List<MessageReaction>>.from(state.reactions);
      if (currentReactions.isEmpty) {
        updatedReactions.remove(messageId);
      } else {
        updatedReactions[messageId] = currentReactions;
      }

      state = state.copyWith(reactions: updatedReactions);
    }
  }

  // Popular reaction emojis
  static const List<String> popularReactions = [
    '👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏',
  ];
}

// Provider
final messageReactionsProvider = StateNotifierProvider<MessageReactionsNotifier, MessageReactionsState>(
  (ref) => MessageReactionsNotifier(),
);

// Extension for List<T> firstOrNull (if not available)
extension ListExtension<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}