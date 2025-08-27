import 'package:flutter/material.dart';

// Re-export the ChatItem class for cross-screen compatibility
class ChatItem {
  final String id;
  final String name;
  final String lastMessage;
  final DateTime lastMessageTime;
  final bool isOnline;
  final int unreadCount;
  final Color avatarColor;
  final bool isAI;

  ChatItem({
    required this.id,
    required this.name,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.isOnline,
    required this.unreadCount,
    required this.avatarColor,
    required this.isAI,
  });
}