import 'package:flutter/material.dart';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/enums.dart';
import 'package:appwrite/models.dart';

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
      ..setEndpoint('https://nyc.cloud.appwrite.io/v1')
      ..setProject('689bdaf500072795b0f6')
      ..setSelfSigned(status: true);
    
    _account = Account(_client);
  }

  Future<void> _checkCurrentSession() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _currentUser = await _account.get();
      
      debugPrint('Found existing session for user: ${_currentUser?.name}');
    } catch (e) {
      debugPrint('No existing session found: $e');
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

      await _account.createOAuth2Session(
        provider: provider,
        success: 'https://chat.recursionsystems.com',
        failure: 'https://chat.recursionsystems.com',
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