import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;
    
    final authService = context.read<AuthService>();
    final message = ChatMessage(
      text: _messageController.text.trim(),
      sender: authService.userName ?? 'You',
      timestamp: DateTime.now(),
      isMe: true,
    );
    
    setState(() {
      _messages.insert(0, message);
    });
    
    _messageController.clear();
    
    // Simulate a response after a delay
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        final response = ChatMessage(
          text: "Thanks for your message! This is a Flutter demo chat.",
          sender: "Chat Bot",
          timestamp: DateTime.now(),
          isMe: false,
        );
        setState(() {
          _messages.insert(0, response);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recursion Chat'),
        actions: [
          Consumer<AuthService>(
            builder: (context, authService, child) {
              return PopupMenuButton<String>(
                icon: CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Text(
                    authService.userName?.isNotEmpty == true
                        ? authService.userName![0].toUpperCase()
                        : (authService.userEmail?.isNotEmpty == true
                            ? authService.userEmail![0].toUpperCase()
                            : 'U'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                onSelected: (value) async {
                  if (value == 'signout') {
                    await _signOut();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    child: Row(
                      children: [
                        const Icon(Icons.person, size: 20),
                        const SizedBox(width: 12),
                        Text(authService.userName ?? authService.userEmail ?? 'User'),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: 'signout',
                    child: Row(
                      children: [
                        Icon(Icons.logout, size: 20),
                        SizedBox(width: 12),
                        Text('Sign Out'),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Welcome Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              border: Border(
                bottom: BorderSide(color: Colors.grey[300]!),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.flutter_dash,
                  color: Theme.of(context).primaryColor,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome to Recursion Chat!',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Built with Flutter Framework',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Chat Messages
          Expanded(
            child: _messages.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 64,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Start a conversation!',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Type a message below to begin chatting.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return _buildMessageBubble(message);
                    },
                  ),
          ),
          
          // Message Input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                top: BorderSide(color: Colors.grey[300]!),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton(
                  onPressed: _sendMessage,
                  mini: true,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Align(
      alignment: message.isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: message.isMe
              ? Theme.of(context).primaryColor
              : Colors.grey[200],
          borderRadius: BorderRadius.circular(18),
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!message.isMe)
              Text(
                message.sender,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Colors.grey[700],
                ),
              ),
            if (!message.isMe) const SizedBox(height: 4),
            Text(
              message.text,
              style: TextStyle(
                color: message.isMe ? Colors.white : Colors.black87,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${message.timestamp.hour.toString().padLeft(2, '0')}:${message.timestamp.minute.toString().padLeft(2, '0')}',
              style: TextStyle(
                color: message.isMe
                    ? Colors.white.withOpacity(0.7)
                    : Colors.grey[500],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _signOut() async {
    final shouldSignOut = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (shouldSignOut == true && mounted) {
      final authService = context.read<AuthService>();
      await authService.signOut();
    }
  }
}

class ChatMessage {
  final String text;
  final String sender;
  final DateTime timestamp;
  final bool isMe;

  ChatMessage({
    required this.text,
    required this.sender,
    required this.timestamp,
    required this.isMe,
  });
}