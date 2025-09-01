import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/enums.dart';
import 'package:appwrite/models.dart';
import '../config/environment.dart';

class AuthService extends ChangeNotifier {
  late Client _client;
  late Account _account;
  
  User? _currentUser;
  bool _isLoading = true;
  String? _errorMessage;

  // Getters
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthService() {
    _initializeAppwrite();
    _checkCurrentSession();
  }

  void _initializeAppwrite() {
    _client = Client()
      ..setEndpoint(Environment.appwritePublicEndpoint)
      ..setProject(Environment.appwriteProjectId)
      ..setSelfSigned(status: true);
    
    _account = Account(_client);
  }

  Future<void> _checkCurrentSession() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      // Test Appwrite connection first
      debugPrint('Testing Appwrite connection...');
      debugPrint('Endpoint: ${Environment.appwritePublicEndpoint}');
      debugPrint('Project: ${Environment.appwriteProjectId}');
      
      _currentUser = await _account.get();
      
      debugPrint('Found existing session for user: ${_currentUser?.name}');
    } catch (e) {
      debugPrint('Session check failed: $e');
      if (e.toString().contains('401')) {
        debugPrint('No existing session (expected)');
      } else if (e.toString().contains('404')) {
        _errorMessage = 'Appwrite project not found. Check project ID and endpoint.';
      } else if (e.toString().contains('403')) {
        _errorMessage = 'Domain not whitelisted. Check Appwrite platform configuration.';
      } else {
        _errorMessage = 'Connection failed: ${e.toString()}';
      }
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithOAuth(OAuthProvider provider) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      // Platform-specific redirect URLs
      final String successUrl, failureUrl;
      if (kIsWeb) {
        successUrl = 'https://chat.recursionsystems.com';
        failureUrl = 'https://chat.recursionsystems.com';
      } else {
        // Native mobile - use custom scheme
        successUrl = 'recursionChat://success';
        failureUrl = 'recursionChat://failure';
      }
      
      await _account.createOAuth2Session(
        provider: provider,
        success: successUrl,
        failure: failureUrl,
      );

      // After OAuth redirect, check for user session
      _currentUser = await _account.get();
      debugPrint('OAuth sign-in successful for user: ${_currentUser?.name}');
      
    } catch (e) {
      debugPrint('OAuth sign-in error: $e');
      _errorMessage = 'Authentication failed. Please try again.';
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithGoogle() async {
    await signInWithOAuth(OAuthProvider.google);
  }

  Future<void> signInWithGitHub() async {
    await signInWithOAuth(OAuthProvider.github);
  }

  Future<void> signOut() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _account.deleteSession(sessionId: 'current');
      _currentUser = null;
      
      debugPrint('Sign out successful');
      
    } catch (e) {
      debugPrint('Sign out error: $e');
      _errorMessage = 'Sign out failed. Please try again.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshSession() async {
    await _checkCurrentSession();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}