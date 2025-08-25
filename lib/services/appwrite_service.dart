import 'package:flutter/foundation.dart';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/models.dart';
import '../models/user_model.dart';

class AppwriteService extends ChangeNotifier {
  static const String endpoint = 'https://cloud.appwrite.io/v1';
  static const String projectId = '67432fe4001a2ab30fb8'; // Your project ID
  static const String databaseId = '67432fe4001a2ab30fb8'; // Your database ID
  static const String usersCollectionId = 'users';
  static const String roomsCollectionId = 'rooms';
  static const String messagesCollectionId = 'messages';

  late Client _client;
  late Account _account;
  late Databases _databases;
  late Realtime _realtime;

  // Connection status
  bool _isConnected = false;
  String _connectionStatus = 'disconnected';
  
  bool get isConnected => _isConnected;
  String get connectionStatus => _connectionStatus;

  AppwriteService() {
    _initializeAppwrite();
  }

  void _initializeAppwrite() {
    _client = Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setSelfSigned(status: true); // Only for development

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

  /// Sign in with email and password
  Future<Map<String, dynamic>> signIn(String email, String password) async {
    try {
      _updateConnectionStatus('authenticating');

      final session = await _account.createEmailSession(
        email: email,
        password: password,
      );

      final user = await _account.get();
      
      _updateConnectionStatus('connected');

      return {
        'success': true,
        'user': _mapAppwriteUser(user),
        'token': session.\$id,
        'session': session,
      };
    } on AppwriteException catch (e) {
      _updateConnectionStatus('error');
      debugPrint('Appwrite sign in error: ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'Sign in failed',
      };
    } catch (e) {
      _updateConnectionStatus('error');
      debugPrint('Sign in error: $e');
      return {
        'success': false,
        'error': 'An unexpected error occurred',
      };
    }
  }

  /// Sign up with email, password, and username
  Future<Map<String, dynamic>> signUp(
    String email,
    String password,
    String username,
  ) async {
    try {
      _updateConnectionStatus('authenticating');

      // Create account
      final user = await _account.create(
        userId: ID.unique(),
        email: email,
        password: password,
        name: username,
      );

      // Create session
      final session = await _account.createEmailSession(
        email: email,
        password: password,
      );

      // Create user document in database
      await _createUserDocument(user, username);

      _updateConnectionStatus('connected');

      return {
        'success': true,
        'user': _mapAppwriteUser(user),
        'token': session.\$id,
        'session': session,
      };
    } on AppwriteException catch (e) {
      _updateConnectionStatus('error');
      debugPrint('Appwrite sign up error: ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'Sign up failed',
      };
    } catch (e) {
      _updateConnectionStatus('error');
      debugPrint('Sign up error: $e');
      return {
        'success': false,
        'error': 'An unexpected error occurred',
      };
    }
  }

  /// OAuth sign in
  Future<Map<String, dynamic>> signInWithOAuth(String provider) async {
    try {
      _updateConnectionStatus('authenticating');

      // Note: In a real Flutter app, you'd use the OAuth2 flow
      // This is a simplified version for demonstration
      await _account.createOAuth2Session(
        provider: provider,
        success: 'https://recursion-chat-app.appwrite.network/auth/success',
        failure: 'https://recursion-chat-app.appwrite.network/auth/error',
      );

      final user = await _account.get();
      
      _updateConnectionStatus('connected');

      return {
        'success': true,
        'user': _mapAppwriteUser(user),
        'token': 'oauth_session',
      };
    } on AppwriteException catch (e) {
      _updateConnectionStatus('error');
      debugPrint('OAuth error: ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'OAuth sign in failed',
      };
    } catch (e) {
      _updateConnectionStatus('error');
      debugPrint('OAuth error: $e');
      return {
        'success': false,
        'error': 'OAuth sign in failed',
      };
    }
  }

  /// Sign out
  Future<void> signOut(String sessionId) async {
    try {
      await _account.deleteSession(sessionId: sessionId);
    } catch (e) {
      debugPrint('Sign out error: $e');
    } finally {
      _updateConnectionStatus('disconnected');
    }
  }

  /// Validate session
  Future<bool> validateSession(String sessionId) async {
    try {
      await _account.get();
      return true;
    } catch (e) {
      debugPrint('Session validation error: $e');
      return false;
    }
  }

  /// Refresh token
  Future<Map<String, dynamic>> refreshToken(String currentToken) async {
    try {
      // In Appwrite, sessions are managed automatically
      // This is mainly for compatibility with the auth service
      final user = await _account.get();
      return {
        'success': true,
        'token': currentToken,
        'user': _mapAppwriteUser(user),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Token refresh failed',
      };
    }
  }

  /// Get chat rooms
  Future<List<ChatRoom>> getRooms() async {
    try {
      final response = await _databases.listDocuments(
        databaseId: databaseId,
        collectionId: roomsCollectionId,
        queries: [
          Query.orderAsc('\$createdAt'),
        ],
      );

      return response.documents
          .map((doc) => ChatRoom.fromJson(doc.data))
          .toList();
    } on AppwriteException catch (e) {
      debugPrint('Get rooms error: ${e.message}');
      throw Exception('Failed to load rooms: ${e.message}');
    } catch (e) {
      debugPrint('Get rooms error: $e');
      throw Exception('Failed to load rooms');
    }
  }

  /// Get messages for a room
  Future<List<ChatMessage>> getRoomMessages(String roomId) async {
    try {
      final response = await _databases.listDocuments(
        databaseId: databaseId,
        collectionId: messagesCollectionId,
        queries: [
          Query.equal('room_id', roomId),
          Query.orderAsc('\$createdAt'),
          Query.limit(100), // Limit to last 100 messages
        ],
      );

      return response.documents
          .map((doc) => ChatMessage.fromJson(doc.data))
          .toList();
    } on AppwriteException catch (e) {
      debugPrint('Get messages error: ${e.message}');
      throw Exception('Failed to load messages: ${e.message}');
    } catch (e) {
      debugPrint('Get messages error: $e');
      throw Exception('Failed to load messages');
    }
  }

  /// Send a message
  Future<ChatMessage> sendMessage({
    required String roomId,
    required String content,
    required String userId,
    required String username,
  }) async {
    try {
      final messageData = {
        'content': content,
        'user_id': userId,
        'username': username,
        'room_id': roomId,
        'is_ai': false,
        'timestamp': DateTime.now().toIso8601String(),
      };

      final response = await _databases.createDocument(
        databaseId: databaseId,
        collectionId: messagesCollectionId,
        documentId: ID.unique(),
        data: messageData,
      );

      return ChatMessage.fromJson(response.data);
    } on AppwriteException catch (e) {
      debugPrint('Send message error: ${e.message}');
      throw Exception('Failed to send message: ${e.message}');
    } catch (e) {
      debugPrint('Send message error: $e');
      throw Exception('Failed to send message');
    }
  }

  /// Subscribe to real-time updates for a room
  RealtimeSubscription subscribeToRoom(String roomId, Function(ChatMessage) onMessage) {
    return _realtime.subscribe([
      'databases.$databaseId.collections.$messagesCollectionId.documents'
    ]).stream.listen((response) {
      if (response.events.contains('databases.*.collections.*.documents.*.create')) {
        final messageData = response.payload;
        if (messageData['room_id'] == roomId) {
          final message = ChatMessage.fromJson(messageData);
          onMessage(message);
        }
      }
    });
  }

  /// Create user document in database
  Future<void> _createUserDocument(User user, String username) async {
    try {
      await _databases.createDocument(
        databaseId: databaseId,
        collectionId: usersCollectionId,
        documentId: user.\$id,
        data: {
          'user_id': user.\$id,
          'email': user.email,
          'username': username,
          'name': user.name,
          'created_at': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      debugPrint('Create user document error: $e');
      // Don't throw error - user creation succeeded even if document failed
    }
  }

  /// Map Appwrite user to UserModel
  Map<String, dynamic> _mapAppwriteUser(User user) {
    return {
      '\$id': user.\$id,
      'email': user.email,
      'name': user.name,
      'username': user.name ?? user.email.split('@')[0],
      '\$createdAt': user.\$createdAt,
      '\$updatedAt': user.\$updatedAt,
    };
  }

  @override
  void dispose() {
    // Clean up resources
    super.dispose();
  }
}