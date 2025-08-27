import 'package:appwrite/appwrite.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppwriteService {
  static final AppwriteService _instance = AppwriteService._internal();
  factory AppwriteService() => _instance;
  AppwriteService._internal();

  late Client client;
  late Account account;
  late Databases databases;
  late Functions functions;
  late Realtime realtime;
  late Storage storage;
  
  // Configuration
  static const String endpoint = 'https://nyc.cloud.appwrite.io/v1';
  static const String projectId = '68a4e3da0022f3e129d0'; // Console project
  static const String databaseId = 'main_db';
  
  // Function IDs
  static const String ssoFunctionId = 'sso-function';
  static const String chatroomFunctionId = 'chatroom-function';
  
  // Current user
  String? currentUserId;
  String? currentUserEmail;
  String? currentUserName;
  String? sessionToken;
  
  void initialize() {
    client = Client()
      .setEndpoint(endpoint)
      .setProject(projectId);
    
    if (!kIsWeb) {
      client.setSelfSigned(status: true); // For development
    }
    
    account = Account(client);
    databases = Databases(client);
    functions = Functions(client);
    realtime = Realtime(client);
    storage = Storage(client);
  }
  
  // SSO Methods
  Future<Map<String, dynamic>> initiateSso(String provider) async {
    try {
      final execution = await functions.createExecution(
        functionId: ssoFunctionId,
        body: '''
        {
          "action": "initiate",
          "provider": "$provider"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        final response = execution.responseBody;
        return Map<String, dynamic>.from(response as Map);
      } else {
        throw Exception('SSO initiation failed');
      }
    } catch (e) {
      debugPrint('SSO Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> handleSsoCallback(String provider, String code) async {
    try {
      final execution = await functions.createExecution(
        functionId: ssoFunctionId,
        body: '''
        {
          "action": "callback",
          "provider": "$provider",
          "code": "$code"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        final response = Map<String, dynamic>.from(execution.responseBody as Map);
        
        // Store session data
        if (response['success'] == true) {
          currentUserId = response['user']['id'];
          currentUserEmail = response['user']['email'];
          currentUserName = response['user']['name'];
          sessionToken = response['token'];
          
          // Save to local storage
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('userId', currentUserId!);
          await prefs.setString('userEmail', currentUserEmail!);
          await prefs.setString('userName', currentUserName ?? '');
          await prefs.setString('sessionToken', sessionToken!);
        }
        
        return response;
      } else {
        throw Exception('SSO callback failed');
      }
    } catch (e) {
      debugPrint('SSO Callback Error: $e');
      rethrow;
    }
  }
  
  Future<bool> refreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refreshToken');
      final userId = prefs.getString('userId');
      
      if (refreshToken == null || userId == null) {
        return false;
      }
      
      final execution = await functions.createExecution(
        functionId: ssoFunctionId,
        body: '''
        {
          "action": "refresh",
          "refreshToken": "$refreshToken",
          "userId": "$userId"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        final response = Map<String, dynamic>.from(execution.responseBody as Map);
        if (response['success'] == true) {
          sessionToken = response['token'];
          await prefs.setString('sessionToken', sessionToken!);
          return true;
        }
      }
      
      return false;
    } catch (e) {
      debugPrint('Token Refresh Error: $e');
      return false;
    }
  }
  
  Future<void> logout() async {
    try {
      if (currentUserId != null) {
        await functions.createExecution(
          functionId: ssoFunctionId,
          body: '''
          {
            "action": "logout",
            "userId": "$currentUserId"
          }
          ''',
        );
      }
      
      // Clear local data
      currentUserId = null;
      currentUserEmail = null;
      currentUserName = null;
      sessionToken = null;
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    } catch (e) {
      debugPrint('Logout Error: $e');
    }
  }
  
  // Chatroom Methods
  Future<Map<String, dynamic>> createChatroom({
    required String name,
    String? description,
    bool isPrivate = false,
    int maxParticipants = 100,
    bool grokEnabled = true,
  }) async {
    try {
      final execution = await functions.createExecution(
        functionId: chatroomFunctionId,
        body: '''
        {
          "action": "createRoom",
          "userId": "$currentUserId",
          "metadata": {
            "name": "$name",
            "description": "${description ?? ''}",
            "isPrivate": $isPrivate,
            "maxParticipants": $maxParticipants,
            "grokEnabled": $grokEnabled
          }
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        return Map<String, dynamic>.from(execution.responseBody as Map);
      } else {
        throw Exception('Failed to create chatroom');
      }
    } catch (e) {
      debugPrint('Create Chatroom Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> joinChatroom(String roomId) async {
    try {
      final execution = await functions.createExecution(
        functionId: chatroomFunctionId,
        body: '''
        {
          "action": "joinRoom",
          "roomId": "$roomId",
          "userId": "$currentUserId"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        return Map<String, dynamic>.from(execution.responseBody as Map);
      } else {
        throw Exception('Failed to join chatroom');
      }
    } catch (e) {
      debugPrint('Join Chatroom Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> sendMessage(String roomId, String content, {
    String? type,
    List<String>? attachments,
    String? replyTo,
  }) async {
    try {
      final execution = await functions.createExecution(
        functionId: chatroomFunctionId,
        body: '''
        {
          "action": "sendMessage",
          "roomId": "$roomId",
          "userId": "$currentUserId",
          "message": {
            "content": "$content",
            "userName": "$currentUserName",
            "type": "${type ?? 'text'}",
            "attachments": ${attachments ?? []},
            "replyTo": ${replyTo != null ? '"$replyTo"' : 'null'}
          }
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        return Map<String, dynamic>.from(execution.responseBody as Map);
      } else {
        throw Exception('Failed to send message');
      }
    } catch (e) {
      debugPrint('Send Message Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> askGrok(String roomId, String prompt) async {
    try {
      final execution = await functions.createExecution(
        functionId: chatroomFunctionId,
        body: '''
        {
          "action": "askGrok",
          "roomId": "$roomId",
          "userId": "$currentUserId",
          "prompt": "$prompt"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        return Map<String, dynamic>.from(execution.responseBody as Map);
      } else {
        throw Exception('Failed to query Grok');
      }
    } catch (e) {
      debugPrint('Grok Query Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> getRoomHistory(String roomId) async {
    try {
      final execution = await functions.createExecution(
        functionId: chatroomFunctionId,
        body: '''
        {
          "action": "getRoomHistory",
          "roomId": "$roomId",
          "userId": "$currentUserId"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        return Map<String, dynamic>.from(execution.responseBody as Map);
      } else {
        throw Exception('Failed to get room history');
      }
    } catch (e) {
      debugPrint('Get Room History Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> getUserRooms() async {
    try {
      final execution = await functions.createExecution(
        functionId: chatroomFunctionId,
        body: '''
        {
          "action": "getRooms",
          "userId": "$currentUserId"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        return Map<String, dynamic>.from(execution.responseBody as Map);
      } else {
        throw Exception('Failed to get user rooms');
      }
    } catch (e) {
      debugPrint('Get User Rooms Error: $e');
      rethrow;
    }
  }
  
  // Realtime subscriptions
  RealtimeSubscription subscribeToChatroom(String roomId, Function(RealtimeMessage) callback) {
    return realtime.subscribe([
      'databases.$databaseId.collections.messages.documents',
      'databases.$databaseId.collections.chatrooms.documents.$roomId',
    ])..stream.listen((message) {
      if (message.payload['roomId'] == roomId) {
        callback(message);
      }
    });
  }
  
  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('sessionToken');
      
      if (token == null) return false;
      
      // Verify token with server
      final execution = await functions.createExecution(
        functionId: ssoFunctionId,
        body: '''
        {
          "action": "verify",
          "token": "$token"
        }
        ''',
      );
      
      if (execution.responseStatusCode == 200) {
        final response = Map<String, dynamic>.from(execution.responseBody as Map);
        if (response['valid'] == true) {
          // Restore user data
          currentUserId = response['user']['id'];
          currentUserEmail = response['user']['email'];
          currentUserName = response['user']['name'];
          sessionToken = token;
          return true;
        }
      }
      
      return false;
    } catch (e) {
      debugPrint('Auth Check Error: $e');
      return false;
    }
  }
}