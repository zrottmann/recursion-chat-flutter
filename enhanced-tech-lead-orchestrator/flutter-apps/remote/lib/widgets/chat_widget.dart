import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../shared/lib/services/appwrite_service.dart';

class ChatWidget extends StatefulWidget {
  const ChatWidget({Key? key}) : super(key: key);

  @override
  State<ChatWidget> createState() => _ChatWidgetState();
}

class _ChatWidgetState extends State<ChatWidget> {
  final AppwriteService _appwrite = AppwriteService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _rooms = [];
  String? _currentRoomId;
  bool _isLoading = false;
  bool _isSending = false;
  
  @override
  void initState() {
    super.initState();
    _loadRooms();
  }
  
  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }
  
  Future<void> _loadRooms() async {
    setState(() => _isLoading = true);
    try {
      final result = await _appwrite.getUserRooms();
      if (result['success'] == true) {
        setState(() {
          _rooms = List<Map<String, dynamic>>.from(result['rooms'] ?? []);
          if (_rooms.isNotEmpty && _currentRoomId == null) {
            _selectRoom(_rooms.first['id']);
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading rooms: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  Future<void> _selectRoom(String roomId) async {
    setState(() {
      _currentRoomId = roomId;
      _isLoading = true;
    });
    
    try {
      final result = await _appwrite.getRoomHistory(roomId);
      if (result['success'] == true) {
        setState(() {
          _messages = List<Map<String, dynamic>>.from(result['messages'] ?? []);
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Error loading messages: $e');
    } finally {
      setState(() => _isLoading = false);
    }
    
    // Subscribe to realtime updates
    _appwrite.subscribeToChatroom(roomId, (message) {
      setState(() {
        _messages.add({
          'id': message.payload['\$id'],
          'userId': message.payload['userId'],
          'userName': message.payload['userName'],
          'content': message.payload['content'],
          'timestamp': message.payload['timestamp'],
          'type': message.payload['type'],
        });
      });
      _scrollToBottom();
    });
  }
  
  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _currentRoomId == null || _isSending) return;
    
    setState(() => _isSending = true);
    HapticFeedback.lightImpact();
    
    try {
      await _appwrite.sendMessage(_currentRoomId!, message);
      _messageController.clear();
      _scrollToBottom();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    } finally {
      setState(() => _isSending = false);
    }
  }
  
  Future<void> _askGrok() async {
    final prompt = _messageController.text.trim();
    if (prompt.isEmpty || _currentRoomId == null || _isSending) return;
    
    setState(() => _isSending = true);
    HapticFeedback.mediumImpact();
    
    try {
      await _appwrite.askGrok(_currentRoomId!, prompt);
      _messageController.clear();
      _scrollToBottom();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to ask Grok: $e')),
      );
    } finally {
      setState(() => _isSending = false);
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
      body: Column(
        children: [
          // Room selector
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).dividerColor,
                ),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.chat_bubble_outline),
                const SizedBox(width: 12),
                Expanded(
                  child: _rooms.isEmpty
                      ? const Text('No rooms available')
                      : DropdownButton<String>(
                          value: _currentRoomId,
                          isExpanded: true,
                          underline: const SizedBox(),
                          items: _rooms.map((room) {
                            return DropdownMenuItem(
                              value: room['id'],
                              child: Text(room['name'] ?? 'Unnamed Room'),
                            );
                          }).toList(),
                          onChanged: (roomId) {
                            if (roomId != null) {
                              _selectRoom(roomId);
                            }
                          },
                        ),
                ),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: _createNewRoom,
                ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadRooms,
                ),
              ],
            ),
          ),
          
          // Messages area
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
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
                              'No messages yet',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Start the conversation!',
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          final isMe = message['userId'] == _appwrite.currentUserId;
                          final isGrok = message['userId'] == 'grok';
                          final isSystem = message['type'] == 'system';
                          
                          if (isSystem) {
                            return Center(
                              child: Container(
                                margin: const EdgeInsets.symmetric(vertical: 8),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  message['content'],
                                  style: TextStyle(
                                    color: Colors.grey.shade700,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            );
                          }
                          
                          return Align(
                            alignment: isMe 
                                ? Alignment.centerRight 
                                : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
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
                                      padding: const EdgeInsets.only(
                                        left: 8,
                                        bottom: 4,
                                      ),
                                      child: Text(
                                        message['userName'] ?? 'Unknown',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: isGrok 
                                              ? Colors.purple
                                              : Colors.grey.shade600,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isMe
                                          ? Theme.of(context).colorScheme.primary
                                          : isGrok
                                              ? Colors.purple.shade100
                                              : Theme.of(context).colorScheme.surfaceVariant,
                                      borderRadius: BorderRadius.only(
                                        topLeft: Radius.circular(isMe ? 16 : 4),
                                        topRight: Radius.circular(isMe ? 4 : 16),
                                        bottomLeft: const Radius.circular(16),
                                        bottomRight: const Radius.circular(16),
                                      ),
                                    ),
                                    child: Text(
                                      message['content'],
                                      style: TextStyle(
                                        color: isMe
                                            ? Colors.white
                                            : Theme.of(context).colorScheme.onSurface,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          
          // Input area
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 8,
              bottom: MediaQuery.of(context).padding.bottom + 8,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).dividerColor,
                ),
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
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.auto_awesome, size: 20),
                        onPressed: _isSending ? null : _askGrok,
                        tooltip: 'Ask Grok AI',
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
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Icon(Icons.send, color: Colors.white),
                    onPressed: _isSending ? null : _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  void _createNewRoom() {
    showDialog(
      context: context,
      builder: (context) {
        final nameController = TextEditingController();
        final descController = TextEditingController();
        
        return AlertDialog(
          title: const Text('Create New Room'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Room Name',
                  hintText: 'Enter room name',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descController,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  hintText: 'Enter room description',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                final name = nameController.text.trim();
                if (name.isNotEmpty) {
                  await _appwrite.createChatroom(
                    name: name,
                    description: descController.text.trim(),
                  );
                  Navigator.pop(context);
                  _loadRooms();
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }
}