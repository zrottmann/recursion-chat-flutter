import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/lib/services/appwrite_service.dart';

class ChatScreen extends StatefulWidget {
  final String? sellerId;
  final String? sellerName;
  final String? productId;

  const ChatScreen({
    Key? key,
    this.sellerId,
    this.sellerName,
    this.productId,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final AppwriteService _appwrite = AppwriteService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _roomId;

  // Mock messages for demo
  final List<Map<String, dynamic>> _mockMessages = [
    {
      'id': '1',
      'senderId': 'seller123',
      'senderName': 'John Doe',
      'content': 'Hi! Thanks for your interest in my iPhone.',
      'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
      'isMe': false,
    },
    {
      'id': '2',
      'senderId': 'current_user',
      'senderName': 'You',
      'content': 'Hello! Is it still available? Can you tell me more about the battery health?',
      'timestamp': DateTime.now().subtract(const Duration(hours: 2, minutes: -5)),
      'isMe': true,
    },
    {
      'id': '3',
      'senderId': 'seller123',
      'senderName': 'John Doe',
      'content': 'Yes, it\'s still available! Battery health is at 96%. I can send you a screenshot if you\'d like.',
      'timestamp': DateTime.now().subtract(const Duration(hours: 1, minutes: 30)),
      'isMe': false,
    },
    {
      'id': '4',
      'senderId': 'current_user',
      'senderName': 'You',
      'content': 'That would be great! Also, are you flexible on the price?',
      'timestamp': DateTime.now().subtract(const Duration(hours: 1, minutes: 15)),
      'isMe': true,
    },
    {
      'id': '5',
      'senderId': 'seller123',
      'senderName': 'John Doe',
      'content': 'I could do \$850 if you can pick it up today. What do you think?',
      'timestamp': DateTime.now().subtract(const Duration(minutes: 45)),
      'isMe': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadChat();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadChat() async {
    setState(() => _isLoading = true);

    try {
      // For demo, use mock messages
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _messages = List.from(_mockMessages);
        _roomId = 'demo_room_${widget.sellerId}';
      });
      
      _scrollToBottom();
      
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.getOrCreateChatRoom(
      //   sellerId: widget.sellerId!,
      //   productId: widget.productId,
      // );
      // if (result['success'] == true) {
      //   _roomId = result['roomId'];
      //   _messages = List<Map<String, dynamic>>.from(result['messages'] ?? []);
      //   _scrollToBottom();
      // }
    } catch (e) {
      debugPrint('Error loading chat: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.sellerName ?? 'Chat'),
            if (widget.productId != null)
              Text(
                'About: Product #${widget.productId}',
                style: const TextStyle(fontSize: 12),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.call),
            onPressed: _makeCall,
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: _showOptions,
          ),
        ],
      ),
      body: Column(
        children: [
          // Product Info Card (if chatting about specific product)
          if (widget.productId != null)
            _buildProductInfoCard(),

          // Messages
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          return _buildMessageBubble(message);
                        },
                      ),
          ),

          // Quick Actions
          _buildQuickActions(),

          // Message Input
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildProductInfoCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Card(
        child: ListTile(
          leading: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: Colors.grey.shade200,
            ),
            child: const Icon(Icons.phone_iphone),
          ),
          title: const Text('iPhone 13 Pro Max'),
          subtitle: const Text('\$899.99 • Like New'),
          trailing: TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('View Item'),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'Start the conversation!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Send a message to get started',
            style: TextStyle(
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isMe = message['isMe'] ?? false;
    final timestamp = message['timestamp'] as DateTime;
    
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment: isMe 
              ? CrossAxisAlignment.end 
              : CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Padding(
                padding: const EdgeInsets.only(left: 8, bottom: 4),
                child: Text(
                  message['senderName'] ?? 'Unknown',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isMe
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(isMe ? 16 : 4),
                  topRight: Radius.circular(isMe ? 4 : 16),
                  bottomLeft: const Radius.circular(16),
                  bottomRight: const Radius.circular(16),
                ),
              ),
              child: Text(
                message['content'] ?? '',
                style: TextStyle(
                  color: isMe 
                      ? Colors.white 
                      : Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                _formatTimestamp(timestamp),
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey.shade500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    if (widget.productId == null) return const SizedBox();
    
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildQuickActionChip(
            icon: Icons.local_offer,
            label: 'Make Offer',
            onTap: _makeOffer,
          ),
          _buildQuickActionChip(
            icon: Icons.schedule,
            label: 'Schedule Meetup',
            onTap: _scheduleMeetup,
          ),
          _buildQuickActionChip(
            icon: Icons.help_outline,
            label: 'Ask Question',
            onTap: _askQuestion,
          ),
          _buildQuickActionChip(
            icon: Icons.report_outline,
            label: 'Report',
            onTap: _reportUser,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        avatar: Icon(icon, size: 16),
        label: Text(label, style: const TextStyle(fontSize: 12)),
        onPressed: onTap,
        backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              focusNode: _focusNode,
              maxLines: null,
              textInputAction: TextInputAction.send,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.attach_file, size: 20),
                      onPressed: _attachFile,
                    ),
                    IconButton(
                      icon: const Icon(Icons.photo_camera, size: 20),
                      onPressed: _attachPhoto,
                    ),
                  ],
                ),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: IconButton(
              icon: _isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.send, color: Colors.white),
              onPressed: _isSending ? null : _sendMessage,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.month}/${timestamp.day}';
    }
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    HapticFeedback.lightImpact();

    try {
      // Add message to local list immediately for better UX
      final newMessage = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'senderId': 'current_user',
        'senderName': 'You',
        'content': message,
        'timestamp': DateTime.now(),
        'isMe': true,
      };

      setState(() {
        _messages.add(newMessage);
      });

      _messageController.clear();
      _scrollToBottom();

      // TODO: Send to Appwrite
      // await _appwrite.sendMessage(_roomId!, message);

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    } finally {
      setState(() => _isSending = false);
    }
  }

  void _makeCall() {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Call functionality not implemented')),
    );
  }

  void _showOptions() {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.block),
            title: const Text('Block User'),
            onTap: () {
              Navigator.pop(context);
              _blockUser();
            },
          ),
          ListTile(
            leading: const Icon(Icons.report),
            title: const Text('Report User'),
            onTap: () {
              Navigator.pop(context);
              _reportUser();
            },
          ),
          ListTile(
            leading: const Icon(Icons.delete),
            title: const Text('Delete Chat'),
            onTap: () {
              Navigator.pop(context);
              _deleteChat();
            },
          ),
        ],
      ),
    );
  }

  void _makeOffer() {
    HapticFeedback.mediumImpact();
    // Show offer dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Make an Offer'),
        content: const TextField(
          decoration: InputDecoration(
            labelText: 'Your offer',
            prefixText: '\$',
          ),
          keyboardType: TextInputType.number,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Send Offer'),
          ),
        ],
      ),
    );
  }

  void _scheduleMeetup() {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Schedule meetup functionality not implemented')),
    );
  }

  void _askQuestion() {
    HapticFeedback.mediumImpact();
    _messageController.text = 'I have a question about ';
    _focusNode.requestFocus();
  }

  void _attachFile() {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('File attachment not implemented')),
    );
  }

  void _attachPhoto() {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Photo attachment not implemented')),
    );
  }

  void _blockUser() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Block user functionality not implemented')),
    );
  }

  void _reportUser() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Report user functionality not implemented')),
    );
  }

  void _deleteChat() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Delete chat functionality not implemented')),
    );
  }
}