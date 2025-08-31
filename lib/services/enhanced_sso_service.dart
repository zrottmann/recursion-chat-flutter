import 'package:flutter/foundation.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/models.dart';
import 'package:appwrite/enums.dart';
import '../models/user_model.dart';

/// Enhanced SSO Service for Flutter Recursion Chat
/// Provides Google, Apple, and GitHub OAuth authentication
/// Compatible with Appwrite 12.0.3
class EnhancedSSOService extends ChangeNotifier {
  // Appwrite configuration - matching React app
  static const String endpoint = 'https://nyc.cloud.appwrite.io/v1';
  static const String projectId = '689bdaf500072795b0f6';
  static const String databaseId = '689bdaf500072795b0f6';

  late Client _client;
  late Account _account;
  late Databases _databases;

  // Session management
  UserModel? _currentUser;
  bool _isInitialized = false;

  // Getters
  bool get isInitialized => _isInitialized;
  UserModel? get currentUser => _currentUser;
  
  List<SSOProvider> get enabledProviders => [
    SSOProvider(id: 'google', name: 'Google', icon: '🔍', color: '#4285F4'),
    SSOProvider(id: 'apple', name: 'Apple', icon: '🍎', color: '#000000'),
    SSOProvider(id: 'github', name: 'GitHub', icon: '🐙', color: '#333333'),
  ];

  EnhancedSSOService() {
    _initializeAppwrite();
  }

  void _initializeAppwrite() {
    _client = Client()
        .setEndpoint(endpoint)
        .setProject(projectId);

    _account = Account(_client);
    _databases = Databases(_client);
    
    _isInitialized = true;
    notifyListeners();
  }


  /// Sign in with Google using Appwrite OAuth
  Future<SSOResult> signInWithGoogle() async {
    try {
      debugPrint('[SSO] Starting Appwrite Google OAuth sign-in');
      
      // Use Appwrite's OAuth which is already configured
      final session = await _account.createOAuth2Session(
        provider: OAuthProvider.google,
        success: '${Uri.base.origin}/auth/success',
        failure: '${Uri.base.origin}/auth/failure',
      );
      
      debugPrint('[SSO] Appwrite OAuth session created');
      
      // Get current account details
      final accountDetails = await _account.get();
      
      // Create UserModel from Appwrite account info
      final user = UserModel(
        id: accountDetails.$id,
        email: accountDetails.email,
        username: accountDetails.name.isNotEmpty ? accountDetails.name : accountDetails.email.split('@')[0],
        name: accountDetails.name.isNotEmpty ? accountDetails.name : accountDetails.email,
        avatar: '',
      );

      _currentUser = user;
      await _syncUserToDatabase(user, 'google');
      
      debugPrint('[SSO] Appwrite Google OAuth completed successfully');
      notifyListeners();
      
      return SSOResult.success(user, 'google');
      
    } catch (e) {
      debugPrint('[SSO] Appwrite Google OAuth error: $e');
      return SSOResult.error('Google sign-in failed: ${e.toString()}');
    }
  }

  /// Sign in with Apple ID
  Future<SSOResult> signInWithApple() async {
    try {
      debugPrint('[SSO] Starting Apple ID sign-in');
      
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      if (credential.userIdentifier == null) {
        return SSOResult.error('Apple sign-in failed');
      }

      final user = UserModel(
        id: 'apple_${credential.userIdentifier}',
        email: credential.email ?? 'apple_user@privaterelay.appleid.com',
        username: credential.givenName ?? 'Apple User',
        name: '${credential.givenName ?? 'Apple'} ${credential.familyName ?? 'User'}',
        avatar: '',
      );

      _currentUser = user;
      await _syncUserToDatabase(user, 'apple');
      
      debugPrint('[SSO] Apple ID sign-in completed successfully');
      notifyListeners();
      
      return SSOResult.success(user, 'apple');
      
    } catch (e) {
      debugPrint('[SSO] Apple sign-in error: $e');
      return SSOResult.error('Apple sign-in failed: $e');
    }
  }

  /// Sign in with GitHub using Appwrite OAuth
  Future<SSOResult> signInWithGitHub() async {
    try {
      debugPrint('[SSO] Starting Appwrite GitHub OAuth sign-in');
      
      // Use Appwrite's OAuth which is already configured
      final session = await _account.createOAuth2Session(
        provider: OAuthProvider.github,
        success: '${Uri.base.origin}/auth/success',
        failure: '${Uri.base.origin}/auth/failure',
      );
      
      debugPrint('[SSO] Appwrite GitHub OAuth session created');
      
      // Get current account details
      final accountDetails = await _account.get();
      
      // Create UserModel from Appwrite account info
      final user = UserModel(
        id: accountDetails.$id,
        email: accountDetails.email,
        username: accountDetails.name.isNotEmpty ? accountDetails.name : accountDetails.email.split('@')[0],
        name: accountDetails.name.isNotEmpty ? accountDetails.name : accountDetails.email,
        avatar: '',
      );

      _currentUser = user;
      await _syncUserToDatabase(user, 'github');
      
      debugPrint('[SSO] Appwrite GitHub OAuth completed successfully');
      notifyListeners();
      
      return SSOResult.success(user, 'github');
      
    } catch (e) {
      debugPrint('[SSO] Appwrite GitHub OAuth error: $e');
      return SSOResult.error('GitHub sign-in failed: ${e.toString()}');
    }
  }

  /// Generic OAuth sign-in method
  Future<SSOResult> signInWithProvider(String provider) async {
    switch (provider.toLowerCase()) {
      case 'google':
        return await signInWithGoogle();
      case 'apple':
        return await signInWithApple();
      case 'github':
        return await signInWithGitHub();
      default:
        return SSOResult.error('Unsupported OAuth provider: $provider');
    }
  }

  /// Sync user data to Appwrite database
  Future<void> _syncUserToDatabase(UserModel user, String provider) async {
    try {
      debugPrint('[SSO] Syncing user to database');

      final userData = {
        'email': user.email,
        'username': user.username,
        'name': user.name,
        'provider': provider,
        'providerId': user.id,
        'avatar': user.avatar ?? '',
        'lastLogin': DateTime.now().toIso8601String(),
        'status': 'online',
      };

      // Try to create user document
      try {
        await _databases.createDocument(
          databaseId: databaseId,
          collectionId: 'users',
          documentId: user.id,
          data: userData,
        );
        debugPrint('[SSO] User document created');
      } catch (e) {
        debugPrint('[SSO] Failed to sync user to database: $e');
        // Continue anyway - don't block authentication
      }
    } catch (e) {
      debugPrint('[SSO] Database sync error: $e');
      // Don't throw - allow authentication to continue
    }
  }

  /// Sign out from all SSO providers
  Future<void> signOut() async {
    try {
      debugPrint('[SSO] Signing out from Appwrite');

      // Sign out from Appwrite account
      try {
        await _account.deleteSession(sessionId: 'current');
      } catch (e) {
        debugPrint('[SSO] Appwrite sign-out error: $e');
      }

      // Clear local state
      _currentUser = null;
      
      debugPrint('[SSO] Sign-out completed');
      notifyListeners();
      
    } catch (e) {
      debugPrint('[SSO] Sign-out error: $e');
    }
  }

  /// Get current session status
  Future<SSOResult?> getCurrentSession() async {
    if (_currentUser != null) {
      return SSOResult.success(_currentUser!, 'session');
    }
    return null;
  }
}

/// SSO Provider configuration
class SSOProvider {
  final String id;
  final String name;
  final String icon;
  final String color;
  final bool enabled;

  SSOProvider({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    this.enabled = true,
  });
}

/// SSO Result wrapper
class SSOResult {
  final bool success;
  final UserModel? user;
  final String? provider;
  final String? error;

  SSOResult._({
    required this.success,
    this.user,
    this.provider,
    this.error,
  });

  factory SSOResult.success(UserModel user, String provider) {
    return SSOResult._(
      success: true,
      user: user,
      provider: provider,
    );
  }

  factory SSOResult.error(String error) {
    return SSOResult._(
      success: false,
      error: error,
    );
  }
}