import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/grok_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _messageController = TextEditingController();
  bool _isGrokTyping = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;
    
    final authService = context.read<AuthService>();
    final grokService = context.read<GrokService>();
    final userMessage = _messageController.text.trim();
    
    // Add user message
    final message = ChatMessage(
      text: userMessage,
      sender: authService.currentUser?.name ?? 'You',
      timestamp: DateTime.now(),
      isMe: true,
    );
    
    setState(() {
      _messages.insert(0, message);
    });
    
    _messageController.clear();
    
    // Show typing indicator
    setState(() {
      _isGrokTyping = true;
    });
    
    // Get Grok AI response
    final grokResponse = await grokService.sendMessage(userMessage);
    
    // Hide typing indicator
    setState(() {
      _isGrokTyping = false;
    });
    
    if (mounted) {
      if (grokResponse != null) {
        final response = ChatMessage(
          text: grokResponse,
          sender: "Grok AI",
          timestamp: DateTime.now(),
          isMe: false,
          isGrok: true,
        );
        setState(() {
          _messages.insert(0, response);
        });
      } else {
        // Show error message
        final errorMessage = grokService.getErrorMessage();
        if (errorMessage.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
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
                    (authService.currentUser?.name?.isNotEmpty == true)
                        ? authService.currentUser!.name![0].toUpperCase()
                        : (authService.currentUser?.email?.isNotEmpty == true)
                            ? authService.currentUser!.email![0].toUpperCase()
                            : 'U',
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
                        Text(authService.currentUser?.name ?? authService.currentUser?.email ?? 'User'),
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
              color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
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
                        'Powered by Grok AI & Appwrite',
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
            child: Stack(
              children: [
                _messages.isEmpty
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
                              'Start a conversation with Grok AI!',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Ask anything - I\'m here to help.',
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
                        itemCount: _messages.length + (_isGrokTyping ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (_isGrokTyping && index == 0) {
                            return _buildTypingIndicator();
                          }
                          final messageIndex = _isGrokTyping ? index - 1 : index;
                          final message = _messages[messageIndex];
                          return _buildMessageBubble(message);
                        },
                      ),
              ],
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

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF9333EA).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: const Color(0xFF9333EA).withValues(alpha: 0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.auto_awesome,
              size: 14,
              color: Color(0xFF9333EA),
            ),
            const SizedBox(width: 8),
            const Text(
              'Grok AI',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: Color(0xFF9333EA),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 40,
              child: Row(
                children: List.generate(3, (index) {
                  return AnimatedContainer(
                    duration: Duration(milliseconds: 300 + (index * 100)),
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    height: 8,
                    width: 8,
                    decoration: BoxDecoration(
                      color: const Color(0xFF9333EA).withValues(
                        alpha: index == DateTime.now().second % 3 ? 0.8 : 0.3,
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
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
              : message.isGrok 
                  ? const Color(0xFF9333EA).withValues(alpha: 0.1)
                  : Colors.grey[200],
          borderRadius: BorderRadius.circular(18),
          border: message.isGrok 
              ? Border.all(color: const Color(0xFF9333EA).withValues(alpha: 0.3), width: 1)
              : null,
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!message.isMe)
              Row(
                children: [
                  if (message.isGrok) ...[
                    const Icon(
                      Icons.auto_awesome,
                      size: 14,
                      color: Color(0xFF9333EA),
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    message.sender,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: message.isGrok ? const Color(0xFF9333EA) : Colors.grey[700],
                    ),
                  ),
                ],
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
                    ? Colors.white.withValues(alpha: 0.7)
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
  final bool isGrok;

  ChatMessage({
    required this.text,
    required this.sender,
    required this.timestamp,
    required this.isMe,
    this.isGrok = false,
  });
}