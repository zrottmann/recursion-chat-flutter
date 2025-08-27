import 'package:flutter/foundation.dart';
import '../../shared/lib/services/appwrite_service.dart';

class ChatProvider extends ChangeNotifier {
  final AppwriteService _appwrite = AppwriteService();
  
  // Current room state
  String? _currentRoomId;
  Map<String, dynamic>? _currentRoom;
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _rooms = [];
  List<Map<String, dynamic>> _directMessages = [];
  
  // UI state
  bool _isLoading = false;
  bool _isSending = false;
  String? _error;
  
  // Typing indicators
  List<String> _typingUsers = [];
  
  // Getters
  String? get currentRoomId => _currentRoomId;
  Map<String, dynamic>? get currentRoom => _currentRoom;
  List<Map<String, dynamic>> get messages => _messages;
  List<Map<String, dynamic>> get rooms => _rooms;
  List<Map<String, dynamic>> get directMessages => _directMessages;
  bool get isLoading => _isLoading;
  bool get isSending => _isSending;
  String? get error => _error;
  List<String> get typingUsers => _typingUsers;

  // Initialize chat system
  Future<void> initialize() async {
    await loadRooms();
    await loadDirectMessages();
  }

  // Load all chat rooms
  Future<void> loadRooms() async {
    _setLoading(true);
    _setError(null);
    
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.getChatRooms();
      
      // Mock data for demo
      await Future.delayed(const Duration(milliseconds: 500));
      _rooms = [
        {
          'id': 'general',
          'name': 'General Discussion',
          'description': 'Open chat for everyone',
          'memberCount': 156,
          'isPublic': true,
          'lastMessage': 'Hey everyone! How\'s the weather?',
          'lastMessageTime': DateTime.now().subtract(const Duration(minutes: 5)),
          'lastMessageUserId': 'user123',
          'lastMessageUserName': 'John Doe',
          'unreadCount': 3,
          'avatar': '💬',
          'createdBy': 'admin',
          'createdAt': DateTime.now().subtract(const Duration(days: 30)),
        },
        {
          'id': 'tech',
          'name': 'Tech Talk',
          'description': 'Discuss the latest in technology',
          'memberCount': 89,
          'isPublic': true,
          'lastMessage': 'Anyone tried the new Flutter 3.16?',
          'lastMessageTime': DateTime.now().subtract(const Duration(minutes: 15)),
          'lastMessageUserId': 'user456',
          'lastMessageUserName': 'Jane Smith',
          'unreadCount': 0,
          'avatar': '💻',
          'createdBy': 'admin',
          'createdAt': DateTime.now().subtract(const Duration(days: 25)),
        },
        {
          'id': 'random',
          'name': 'Random',
          'description': 'Off-topic discussions',
          'memberCount': 234,
          'isPublic': true,
          'lastMessage': 'Check out this amazing sunset!',
          'lastMessageTime': DateTime.now().subtract(const Duration(hours: 1)),
          'lastMessageUserId': 'user789',
          'lastMessageUserName': 'Mike Wilson',
          'unreadCount': 12,
          'avatar': '🎲',
          'createdBy': 'user123',
          'createdAt': DateTime.now().subtract(const Duration(days: 20)),
        },
      ];
      
      notifyListeners();
    } catch (e) {
      _setError('Failed to load rooms: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Load direct messages
  Future<void> loadDirectMessages() async {
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.getDirectMessages();
      
      // Mock data for demo
      await Future.delayed(const Duration(milliseconds: 300));
      _directMessages = [
        {
          'id': 'dm_1',
          'userId': 'user123',
          'name': 'Sarah Chen',
          'username': '@sarahc',
          'lastMessage': 'Thanks for the help with the project!',
          'lastMessageTime': DateTime.now().subtract(const Duration(minutes: 30)),
          'unreadCount': 0,
          'isOnline': true,
          'avatar': '👩‍💻',
        },
        {
          'id': 'dm_2',
          'userId': 'user456',
          'name': 'Mike Johnson',
          'username': '@mikej',
          'lastMessage': 'Are we still on for the meeting tomorrow?',
          'lastMessageTime': DateTime.now().subtract(const Duration(hours: 4)),
          'unreadCount': 2,
          'isOnline': false,
          'avatar': '👨‍💼',
        },
        {
          'id': 'dm_3',
          'userId': 'user789',
          'name': 'Team Lead',
          'username': '@teamlead',
          'lastMessage': 'Great work on the presentation!',
          'lastMessageTime': DateTime.now().subtract(const Duration(days: 1)),
          'unreadCount': 0,
          'isOnline': true,
          'avatar': '👔',
        },
      ];
      
      notifyListeners();
    } catch (e) {
      _setError('Failed to load direct messages: $e');
    }
  }

  // Join a chat room
  Future<bool> joinRoom(String roomId) async {
    _setLoading(true);
    _setError(null);
    
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.joinChatRoom(roomId);
      
      // Find room in local data
      final room = _rooms.firstWhere(
        (r) => r['id'] == roomId,
        orElse: () => {},
      );
      
      if (room.isNotEmpty) {
        _currentRoomId = roomId;
        _currentRoom = room;
        await loadMessages(roomId);
        return true;
      } else {
        _setError('Room not found');
        return false;
      }
    } catch (e) {
      _setError('Failed to join room: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Load messages for a room
  Future<void> loadMessages(String roomId) async {
    _setLoading(true);
    _setError(null);
    
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.getRoomMessages(roomId);
      
      // Mock messages for demo
      await Future.delayed(const Duration(milliseconds: 500));
      _messages = [
        {
          'id': 'msg_1',
          'content': 'Hello everyone! Welcome to the chat.',
          'userId': 'user123',
          'userName': 'John Doe',
          'userAvatar': '👨‍💻',
          'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
          'isEdited': false,
          'replyTo': null,
          'attachments': [],
          'reactions': {'👍': 3, '❤️': 1},
        },
        {
          'id': 'msg_2',
          'content': 'Thanks for setting this up! Looking forward to great discussions.',
          'userId': 'user456',
          'userName': 'Jane Smith',
          'userAvatar': '👩‍💼',
          'timestamp': DateTime.now().subtract(const Duration(hours: 1, minutes: 45)),
          'isEdited': false,
          'replyTo': 'msg_1',
          'attachments': [],
          'reactions': {'👍': 2},
        },
        {
          'id': 'msg_3',
          'content': 'Has anyone tried the new Flutter update? The performance improvements are amazing!',
          'userId': 'current_user',
          'userName': 'You',
          'userAvatar': '👤',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 30)),
          'isEdited': true,
          'replyTo': null,
          'attachments': [],
          'reactions': {'🚀': 1, '👍': 4},
        },
        {
          'id': 'msg_4',
          'content': 'I agree! The hot reload is so much faster now.',
          'userId': 'user789',
          'userName': 'Mike Wilson',
          'userAvatar': '🧑‍💻',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 15)),
          'isEdited': false,
          'replyTo': 'msg_3',
          'attachments': [],
          'reactions': {'✅': 1},
        },
      ];
      
      // Mark room as read
      _markRoomAsRead(roomId);
      
      notifyListeners();
    } catch (e) {
      _setError('Failed to load messages: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Send a message
  Future<bool> sendMessage(String content, {String? replyToId}) async {
    if (content.trim().isEmpty || _currentRoomId == null) return false;
    
    _setSending(true);
    _setError(null);
    
    try {
      // Create optimistic message
      final newMessage = {
        'id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
        'content': content.trim(),
        'userId': 'current_user',
        'userName': 'You',
        'userAvatar': '👤',
        'timestamp': DateTime.now(),
        'isEdited': false,
        'replyTo': replyToId,
        'attachments': [],
        'reactions': {},
        'isOptimistic': true, // Mark as optimistic update
      };
      
      // Add to local messages immediately
      _messages.add(newMessage);
      notifyListeners();
      
      // TODO: Send to Appwrite
      // final result = await _appwrite.sendMessage(_currentRoomId!, content, replyToId: replyToId);
      
      // Simulate network delay
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Update the optimistic message with real data
      final messageIndex = _messages.indexWhere((m) => m['id'] == newMessage['id']);
      if (messageIndex != -1) {
        _messages[messageIndex] = {
          ..._messages[messageIndex],
          'id': 'msg_${DateTime.now().millisecondsSinceEpoch}', // Real ID from server
          'isOptimistic': false,
        };
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      // Remove optimistic message on error
      _messages.removeWhere((m) => m['id'] == 'temp_${DateTime.now().millisecondsSinceEpoch}');
      _setError('Failed to send message: $e');
      notifyListeners();
      return false;
    } finally {
      _setSending(false);
    }
  }

  // Delete a message
  Future<bool> deleteMessage(String messageId) async {
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.deleteMessage(messageId);
      
      // Remove from local messages
      _messages.removeWhere((m) => m['id'] == messageId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete message: $e');
      return false;
    }
  }

  // Edit a message
  Future<bool> editMessage(String messageId, String newContent) async {
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.editMessage(messageId, newContent);
      
      // Update local message
      final messageIndex = _messages.indexWhere((m) => m['id'] == messageId);
      if (messageIndex != -1) {
        _messages[messageIndex] = {
          ..._messages[messageIndex],
          'content': newContent,
          'isEdited': true,
        };
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to edit message: $e');
      return false;
    }
  }

  // Add reaction to message
  Future<bool> addReaction(String messageId, String emoji) async {
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.addReaction(messageId, emoji);
      
      // Update local message
      final messageIndex = _messages.indexWhere((m) => m['id'] == messageId);
      if (messageIndex != -1) {
        final reactions = Map<String, int>.from(_messages[messageIndex]['reactions'] ?? {});
        reactions[emoji] = (reactions[emoji] ?? 0) + 1;
        
        _messages[messageIndex] = {
          ..._messages[messageIndex],
          'reactions': reactions,
        };
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to add reaction: $e');
      return false;
    }
  }

  // Create new room
  Future<bool> createRoom(String name, String description, bool isPublic) async {
    _setLoading(true);
    _setError(null);
    
    try {
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.createChatRoom(name, description, isPublic);
      
      // Add to local rooms
      final newRoom = {
        'id': 'room_${DateTime.now().millisecondsSinceEpoch}',
        'name': name,
        'description': description,
        'memberCount': 1,
        'isPublic': isPublic,
        'lastMessage': null,
        'lastMessageTime': null,
        'lastMessageUserId': null,
        'lastMessageUserName': null,
        'unreadCount': 0,
        'avatar': '💬',
        'createdBy': 'current_user',
        'createdAt': DateTime.now(),
      };
      
      _rooms.insert(0, newRoom);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create room: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Start typing indicator
  void startTyping() {
    // TODO: Send typing indicator to Appwrite
    // _appwrite.sendTypingIndicator(_currentRoomId!, true);
  }

  // Stop typing indicator
  void stopTyping() {
    // TODO: Stop typing indicator in Appwrite
    // _appwrite.sendTypingIndicator(_currentRoomId!, false);
  }

  // Update typing users
  void updateTypingUsers(List<String> users) {
    _typingUsers = users;
    notifyListeners();
  }

  // Mark room as read
  void _markRoomAsRead(String roomId) {
    final roomIndex = _rooms.indexWhere((r) => r['id'] == roomId);
    if (roomIndex != -1) {
      _rooms[roomIndex] = {
        ..._rooms[roomIndex],
        'unreadCount': 0,
      };
    }
  }

  // Leave current room
  void leaveRoom() {
    _currentRoomId = null;
    _currentRoom = null;
    _messages.clear();
    _typingUsers.clear();
    notifyListeners();
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setSending(bool sending) {
    _isSending = sending;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Search messages
  List<Map<String, dynamic>> searchMessages(String query) {
    if (query.isEmpty) return _messages;
    
    return _messages.where((message) {
      final content = message['content']?.toString().toLowerCase() ?? '';
      final userName = message['userName']?.toString().toLowerCase() ?? '';
      final searchQuery = query.toLowerCase();
      
      return content.contains(searchQuery) || userName.contains(searchQuery);
    }).toList();
  }

  // Search rooms
  List<Map<String, dynamic>> searchRooms(String query) {
    if (query.isEmpty) return _rooms;
    
    return _rooms.where((room) {
      final name = room['name']?.toString().toLowerCase() ?? '';
      final description = room['description']?.toString().toLowerCase() ?? '';
      final searchQuery = query.toLowerCase();
      
      return name.contains(searchQuery) || description.contains(searchQuery);
    }).toList();
  }

  // Get unread message count
  int getTotalUnreadCount() {
    int total = 0;
    for (final room in _rooms) {
      total += (room['unreadCount'] as int? ?? 0);
    }
    for (final dm in _directMessages) {
      total += (dm['unreadCount'] as int? ?? 0);
    }
    return total;
  }
}