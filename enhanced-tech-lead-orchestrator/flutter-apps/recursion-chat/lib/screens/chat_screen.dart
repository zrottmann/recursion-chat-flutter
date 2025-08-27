import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../providers/auth_provider.dart';

class ChatScreen extends StatefulWidget {
  final String? roomId;

  const ChatScreen({Key? key, this.roomId}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  
  late AnimationController _animationController;
  String? _replyToMessageId;
  Map<String, dynamic>? _replyToMessage;
  bool _showScrollToBottom = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _initializeChat();
    _setupScrollListener();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _initializeChat() async {
    if (widget.roomId != null) {
      final chatProvider = Provider.of<ChatProvider>(context, listen: false);
      await chatProvider.joinRoom(widget.roomId!);
      _scrollToBottom();
    }
  }

  void _setupScrollListener() {
    _scrollController.addListener(() {
      final showButton = _scrollController.offset > 100;
      if (showButton != _showScrollToBottom) {
        setState(() {
          _showScrollToBottom = showButton;
        });
      }
    });
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
    final colorScheme = Theme.of(context).colorScheme;
    
    return Consumer2<ChatProvider, AuthProvider>(
      builder: (context, chatProvider, authProvider, child) {
        final room = chatProvider.currentRoom;
        
        return Scaffold(
          backgroundColor: colorScheme.surface,
          appBar: AppBar(
            backgroundColor: colorScheme.surface,
            elevation: 0,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  room?['name'] ?? 'Chat',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                if (chatProvider.typingUsers.isNotEmpty)
                  Text(
                    '${chatProvider.typingUsers.join(', ')} typing...',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.primary,
                    ),
                  )
                else if (room?['memberCount'] != null)
                  Text(
                    '${room!['memberCount']} members',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
              ],
            ),
            actions: [
              IconButton(
                onPressed: _showRoomInfo,
                icon: const Icon(Icons.info_outline),
                tooltip: 'Room Info',
              ),
              PopupMenuButton<String>(
                onSelected: (value) {
                  switch (value) {
                    case 'search':
                      _showSearchDialog();
                      break;
                    case 'members':
                      _showMembersList();
                      break;
                    case 'settings':
                      _showRoomSettings();
                      break;
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'search',
                    child: ListTile(
                      leading: Icon(Icons.search),
                      title: Text('Search Messages'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'members',
                    child: ListTile(
                      leading: Icon(Icons.people),
                      title: Text('Members'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'settings',
                    child: ListTile(
                      leading: Icon(Icons.settings),
                      title: Text('Room Settings'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
            ],
          ),
          body: Column(
            children: [
              // Reply preview
              if (_replyToMessage != null) _buildReplyPreview(),
              
              // Messages
              Expanded(
                child: chatProvider.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : chatProvider.messages.isEmpty
                        ? _buildEmptyState()
                        : Stack(
                            children: [
                              ListView.builder(
                                controller: _scrollController,
                                padding: const EdgeInsets.all(16),
                                itemCount: chatProvider.messages.length,
                                itemBuilder: (context, index) {
                                  final message = chatProvider.messages[index];
                                  final isMe = message['userId'] == 'current_user';
                                  final showAvatar = index == chatProvider.messages.length - 1 ||
                                      chatProvider.messages[index + 1]['userId'] != message['userId'];
                                  
                                  return _buildMessageBubble(
                                    message,
                                    isMe,
                                    showAvatar,
                                    chatProvider,
                                  );
                                },
                              ),
                              
                              // Scroll to bottom button
                              if (_showScrollToBottom)
                                Positioned(
                                  bottom: 16,
                                  right: 16,
                                  child: FloatingActionButton.small(
                                    onPressed: _scrollToBottom,
                                    backgroundColor: colorScheme.primary,
                                    child: const Icon(Icons.keyboard_arrow_down),
                                  ),
                                ),
                            ],
                          ),
              ),
              
              // Message input
              _buildMessageInput(chatProvider),
            ],
          ),
        );
      },
    );
  }

  Widget _buildReplyPreview() {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant.withOpacity(0.3),
        border: Border(
          bottom: BorderSide(color: colorScheme.dividerColor),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: colorScheme.primary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Replying to ${_replyToMessage!['userName']}',
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _replyToMessage!['content'],
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurface.withOpacity(0.7),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              setState(() {
                _replyToMessageId = null;
                _replyToMessage = null;
              });
            },
            icon: const Icon(Icons.close, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: colorScheme.onSurface.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start the conversation!',
            style: TextStyle(
              fontSize: 16,
              color: colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(
    Map<String, dynamic> message,
    bool isMe,
    bool showAvatar,
    ChatProvider chatProvider,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final isOptimistic = message['isOptimistic'] == true;
    final replyToId = message['replyTo'];
    
    // Find replied message
    Map<String, dynamic>? repliedMessage;
    if (replyToId != null) {
      try {
        repliedMessage = chatProvider.messages.firstWhere(
          (m) => m['id'] == replyToId,
        );
      } catch (e) {
        // Message not found
      }
    }
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Avatar (for other users)
          if (!isMe && showAvatar)
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  message['userAvatar'] ?? '👤',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
            )
          else if (!isMe)
            const SizedBox(width: 40),
          
          // Message bubble
          Expanded(
            child: Align(
              alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
              child: GestureDetector(
                onLongPress: () => _showMessageOptions(message, chatProvider),
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  child: Column(
                    crossAxisAlignment: isMe 
                        ? CrossAxisAlignment.end 
                        : CrossAxisAlignment.start,
                    children: [
                      // User name (for other users)
                      if (!isMe && showAvatar)
                        Padding(
                          padding: const EdgeInsets.only(left: 12, bottom: 4),
                          child: Text(
                            message['userName'] ?? 'Unknown',
                            style: TextStyle(
                              fontSize: 12,
                              color: colorScheme.onSurface.withOpacity(0.6),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      
                      // Reply indicator
                      if (repliedMessage != null)
                        Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          child: _buildReplyIndicator(repliedMessage, isMe, colorScheme),
                        ),
                      
                      // Message content
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isMe
                              ? colorScheme.primary
                              : colorScheme.surfaceVariant,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(isMe ? 16 : 4),
                            topRight: Radius.circular(isMe ? 4 : 16),
                            bottomLeft: const Radius.circular(16),
                            bottomRight: const Radius.circular(16),
                          ),
                          boxShadow: [
                            if (isOptimistic)
                              BoxShadow(
                                color: colorScheme.onSurface.withOpacity(0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              message['content'] ?? '',
                              style: TextStyle(
                                color: isMe 
                                    ? colorScheme.onPrimary
                                    : colorScheme.onSurface,
                                fontSize: 16,
                              ),
                            ),
                            
                            // Reactions
                            if (message['reactions'] != null && 
                                (message['reactions'] as Map).isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(top: 6),
                                child: _buildReactions(message['reactions'], colorScheme),
                              ),
                          ],
                        ),
                      ),
                      
                      // Message info
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isOptimistic)
                              Icon(
                                Icons.schedule,
                                size: 12,
                                color: colorScheme.onSurface.withOpacity(0.5),
                              ),
                            if (isOptimistic) const SizedBox(width: 4),
                            Text(
                              _formatTime(message['timestamp']),
                              style: TextStyle(
                                fontSize: 10,
                                color: colorScheme.onSurface.withOpacity(0.5),
                              ),
                            ),
                            if (message['isEdited'] == true) ...[
                              const SizedBox(width: 4),
                              Text(
                                '(edited)',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: colorScheme.onSurface.withOpacity(0.5),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReplyIndicator(
    Map<String, dynamic> repliedMessage,
    bool isMe,
    ColorScheme colorScheme,
  ) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: (isMe ? colorScheme.onPrimary : colorScheme.onSurface).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: (isMe ? colorScheme.onPrimary : colorScheme.onSurface).withOpacity(0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 2,
            height: 24,
            decoration: BoxDecoration(
              color: colorScheme.primary,
              borderRadius: BorderRadius.circular(1),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  repliedMessage['userName'] ?? 'Unknown',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.primary,
                  ),
                ),
                Text(
                  repliedMessage['content'] ?? '',
                  style: TextStyle(
                    fontSize: 12,
                    color: (isMe ? colorScheme.onPrimary : colorScheme.onSurface)
                        .withOpacity(0.7),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReactions(Map reactions, ColorScheme colorScheme) {
    return Wrap(
      spacing: 4,
      children: reactions.entries.map((entry) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                entry.key,
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(width: 2),
              Text(
                entry.value.toString(),
                style: TextStyle(
                  fontSize: 10,
                  color: colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMessageInput(ChatProvider chatProvider) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        border: Border(
          top: BorderSide(color: colorScheme.dividerColor),
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
                      onPressed: _showAttachmentOptions,
                    ),
                    IconButton(
                      icon: const Icon(Icons.emoji_emotions, size: 20),
                      onPressed: _showEmojiPicker,
                    ),
                  ],
                ),
              ),
              onChanged: (text) {
                // Handle typing indicators
                if (text.isNotEmpty) {
                  chatProvider.startTyping();
                } else {
                  chatProvider.stopTyping();
                }
              },
              onSubmitted: (_) => _sendMessage(chatProvider),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
              color: colorScheme.primary,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: chatProvider.isSending
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          colorScheme.onPrimary,
                        ),
                      ),
                    )
                  : Icon(
                      Icons.send,
                      color: colorScheme.onPrimary,
                    ),
              onPressed: chatProvider.isSending ? null : () => _sendMessage(chatProvider),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }

  void _sendMessage(ChatProvider chatProvider) async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    HapticFeedback.lightImpact();
    
    final success = await chatProvider.sendMessage(
      content,
      replyToId: _replyToMessageId,
    );
    
    if (success) {
      _messageController.clear();
      setState(() {
        _replyToMessageId = null;
        _replyToMessage = null;
      });
      _scrollToBottom();
    }
  }

  void _showMessageOptions(Map<String, dynamic> message, ChatProvider chatProvider) {
    final isMe = message['userId'] == 'current_user';
    
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.reply),
              title: const Text('Reply'),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  _replyToMessageId = message['id'];
                  _replyToMessage = message;
                });
                _focusNode.requestFocus();
              },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_emotions),
              title: const Text('Add Reaction'),
              onTap: () {
                Navigator.pop(context);
                _showReactionPicker(message['id'], chatProvider);
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy Message'),
              onTap: () {
                Navigator.pop(context);
                Clipboard.setData(ClipboardData(text: message['content']));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Message copied!')),
                );
              },
            ),
            if (isMe) ...[
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Edit Message'),
                onTap: () {
                  Navigator.pop(context);
                  _editMessage(message, chatProvider);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Delete Message', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(context);
                  _deleteMessage(message['id'], chatProvider);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showReactionPicker(String messageId, ChatProvider chatProvider) {
    final emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🚀'];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Reaction'),
        content: Wrap(
          spacing: 16,
          children: emojis.map((emoji) {
            return GestureDetector(
              onTap: () {
                Navigator.pop(context);
                chatProvider.addReaction(messageId, emoji);
              },
              child: Text(
                emoji,
                style: const TextStyle(fontSize: 32),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  void _editMessage(Map<String, dynamic> message, ChatProvider chatProvider) {
    final controller = TextEditingController(text: message['content']);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Message'),
        content: TextField(
          controller: controller,
          maxLines: null,
          decoration: const InputDecoration(
            hintText: 'Edit your message...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              chatProvider.editMessage(message['id'], controller.text.trim());
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _deleteMessage(String messageId, ChatProvider chatProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Message'),
        content: const Text('Are you sure you want to delete this message?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            onPressed: () {
              Navigator.pop(context);
              chatProvider.deleteMessage(messageId);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo),
              title: const Text('Photo'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Photo attachment not implemented')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.videocam),
              title: const Text('Video'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Video attachment not implemented')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.insert_drive_file),
              title: const Text('File'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('File attachment not implemented')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEmojiPicker() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Emoji picker not implemented')),
    );
  }

  void _showRoomInfo() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Room info not implemented')),
    );
  }

  void _showSearchDialog() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Message search not implemented')),
    );
  }

  void _showMembersList() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Members list not implemented')),
    );
  }

  void _showRoomSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Room settings not implemented')),
    );
  }
}