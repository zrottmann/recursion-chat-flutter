import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/user_model.dart';
import 'appwrite_service.dart';

class AuthService extends ChangeNotifier {
  UserModel? _currentUser;
  bool _isLoading = true;
  String? _token;
  final AppwriteService _appwriteService = AppwriteService();

  // Getters
  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null && _token != null;
  String? get token => _token;

  AuthService() {
    _initializeAuth();
  }

  /// Initialize authentication from stored credentials
  Future<void> _initializeAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user_data');
      final storedToken = prefs.getString('auth_token');

      if (userJson != null && storedToken != null) {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
        _token = storedToken;
        
        // Validate stored session in background
        _validateStoredSession();
      }
    } catch (e) {
      debugPrint('Auth initialization error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Validate stored session without blocking UI
  Future<void> _validateStoredSession() async {
    try {
      final isValid = await _appwriteService.validateSession(_token!);
      if (!isValid) {
        await signOut();
      }
    } catch (e) {
      debugPrint('Session validation error: $e');
    }
  }

  /// Sign in with email and password
  Future<bool> signIn(String email, String password) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await _appwriteService.signIn(email, password);
      
      if (result['success']) {
        _currentUser = UserModel.fromJson(result['user']);
        _token = result['token'];
        
        // Store credentials
        await _storeCredentials();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('Sign in error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Sign up with email and password
  Future<bool> signUp(String email, String password, String username) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await _appwriteService.signUp(email, password, username);
      
      if (result['success']) {
        _currentUser = UserModel.fromJson(result['user']);
        _token = result['token'];
        
        // Store credentials
        await _storeCredentials();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('Sign up error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// OAuth sign in (Google, GitHub, etc.)
  Future<bool> signInWithOAuth(String provider) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await _appwriteService.signInWithOAuth(provider);
      
      if (result['success']) {
        _currentUser = UserModel.fromJson(result['user']);
        _token = result['token'];
        
        // Store credentials
        await _storeCredentials();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('OAuth sign in error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Sign out and clear stored credentials
  Future<void> signOut() async {
    try {
      // Sign out from Appwrite
      if (_token != null) {
        await _appwriteService.signOut(_token!);
      }
    } catch (e) {
      debugPrint('Appwrite sign out error: $e');
    } finally {
      // Clear local state regardless of Appwrite success
      _currentUser = null;
      _token = null;
      
      // Clear stored credentials
      await _clearCredentials();
      
      notifyListeners();
    }
  }

  /// Store user credentials securely
  Future<void> _storeCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', jsonEncode(_currentUser!.toJson()));
      await prefs.setString('auth_token', _token!);
    } catch (e) {
      debugPrint('Error storing credentials: $e');
    }
  }

  /// Clear stored credentials
  Future<void> _clearCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data');
      await prefs.remove('auth_token');
    } catch (e) {
      debugPrint('Error clearing credentials: $e');
    }
  }

  /// Refresh authentication token
  Future<bool> refreshToken() async {
    try {
      if (_token == null) return false;
      
      final result = await _appwriteService.refreshToken(_token!);
      
      if (result['success']) {
        _token = result['token'];
        await _storeCredentials();
        notifyListeners();
        return true;
      }
      
      return false;
    } catch (e) {
      debugPrint('Token refresh error: $e');
      return false;
    }
  }
}