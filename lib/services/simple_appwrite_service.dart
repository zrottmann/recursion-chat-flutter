import 'package:flutter/foundation.dart';
import 'package:appwrite/appwrite.dart';
import '../models/user_model.dart';

/// Simplified Appwrite Service compatible with v12.0.3
class SimpleSimpleAppwriteService extends ChangeNotifier {
  static const String endpoint = 'https://nyc.cloud.appwrite.io/v1';
  static const String projectId = '689bdaf500072795b0f6';
  static const String databaseId = '689bdaf500072795b0f6';
  static const String usersCollectionId = 'users';
  static const String roomsCollectionId = 'rooms';
  static const String messagesCollectionId = 'messages';

  late Client _client;
  late Account _account;
  late Databases _databases;
  late Realtime _realtime;

  bool _isConnected = false;
  String _connectionStatus = 'disconnected';
  
  bool get isConnected => _isConnected;
  String get connectionStatus => _connectionStatus;

  SimpleSimpleAppwriteService() {
    _initializeAppwrite();
  }

  void _initializeAppwrite() {
    _client = Client()
        .setEndpoint(endpoint)
        .setProject(projectId);

    _account = Account(_client);
    _databases = Databases(_client);
    _realtime = Realtime(_client);

    _updateConnectionStatus('initialized');
  }

  void _updateConnectionStatus(String status) {
    _connectionStatus = status;
    _isConnected = status == 'connected';
    notifyListeners();
  }

  /// Simple email/password sign in (fallback)
  Future<Map<String, dynamic>> signIn(String email, String password) async {
    try {
      _updateConnectionStatus('authenticating');

      // For now, return a mock success since we're focusing on SSO
      _updateConnectionStatus('connected');

      return {
        'success': true,
        'user': {
          'id': 'email_${email.split('@')[0]}',
          'email': email,
          'username': email.split('@')[0],
          'name': email.split('@')[0],
        },
        'token': 'email_session_token',
      };
    } catch (e) {
      _updateConnectionStatus('error');
      debugPrint('Sign in error: $e');
      return {
        'success': false,
        'error': 'Sign in failed',
      };
    }
  }

  /// Simple email/password sign up (fallback)
  Future<Map<String, dynamic>> signUp(String email, String password, String username) async {
    try {
      _updateConnectionStatus('authenticating');

      // For now, return a mock success
      _updateConnectionStatus('connected');

      return {
        'success': true,
        'user': {
          'id': 'email_${username}',
          'email': email,
          'username': username,
          'name': username,
        },
        'token': 'email_session_token',
      };
    } catch (e) {
      _updateConnectionStatus('error');
      debugPrint('Sign up error: $e');
      return {
        'success': false,
        'error': 'Sign up failed',
      };
    }
  }

  /// OAuth sign in (delegated to SSO service)
  Future<Map<String, dynamic>> signInWithOAuth(String provider) async {
    return {
      'success': false,
      'error': 'Use enhanced SSO service for OAuth',
    };
  }

  /// Sign out
  Future<void> signOut(String sessionId) async {
    try {
      debugPrint('Signing out from Appwrite');
    } catch (e) {
      debugPrint('Sign out error: $e');
    } finally {
      _updateConnectionStatus('disconnected');
    }
  }

  /// Validate session
  Future<bool> validateSession(String sessionId) async {
    try {
      return sessionId.isNotEmpty;
    } catch (e) {
      debugPrint('Session validation error: $e');
      return false;
    }
  }

  /// Refresh token
  Future<Map<String, dynamic>> refreshToken(String currentToken) async {
    return {
      'success': true,
      'token': currentToken,
    };
  }

  /// Get chat rooms (mock data for now)
  Future<List<ChatRoom>> getRooms() async {
    try {
      // Return mock rooms
      return [
        ChatRoom(
          id: 'general',
          name: 'General',
          description: 'General chat room',
          memberCount: 5,
        ),
        ChatRoom(
          id: 'tech',
          name: 'Tech Talk',
          description: 'Technology discussions',
          memberCount: 3,
        ),
      ];
    } catch (e) {
      debugPrint('Get rooms error: $e');
      throw Exception('Failed to load rooms');
    }
  }

  /// Get messages for a room (mock data)
  Future<List<ChatMessage>> getRoomMessages(String roomId) async {
    try {
      // Return mock messages
      return [
        ChatMessage(
          id: 'msg1',
          content: 'Welcome to Recursion Chat!',
          userId: 'system',
          username: 'System',
          timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
          isSystem: true,
        ),
      ];
    } catch (e) {
      debugPrint('Get messages error: $e');
      throw Exception('Failed to load messages');
    }
  }

  /// Send a message (mock implementation)
  Future<ChatMessage> sendMessage({
    required String roomId,
    required String content,
    required String userId,
    required String username,
  }) async {
    try {
      final message = ChatMessage(
        id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
        content: content,
        userId: userId,
        username: username,
        timestamp: DateTime.now(),
        roomId: roomId,
      );

      return message;
    } catch (e) {
      debugPrint('Send message error: $e');
      throw Exception('Failed to send message');
    }
  }

  @override
  void dispose() {
    super.dispose();
  }
}