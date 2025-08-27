import 'package:flutter/foundation.dart';
import '../../shared/lib/services/appwrite_service.dart';

class AuthProvider extends ChangeNotifier {
  final AppwriteService _appwrite = AppwriteService();
  
  Map<String, dynamic>? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;

  // Getters
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get userId => _user?['\$id'] ?? '';
  String get userName => _user?['name'] ?? 'Anonymous';
  String get userEmail => _user?['email'] ?? '';

  // Set user data and authentication state
  void setUser(Map<String, dynamic>? userData) {
    _user = userData;
    _isAuthenticated = userData != null;
    notifyListeners();
  }

  // Login with email and password
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _setError(null);
    
    try {
      final result = await _appwrite.loginWithEmail(email, password);
      
      if (result['success'] == true) {
        setUser(result['user']);
        return true;
      } else {
        _setError(result['error'] ?? 'Login failed');
        return false;
      }
    } catch (e) {
      _setError('Login failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register with email and password
  Future<bool> register(String name, String email, String password) async {
    _setLoading(true);
    _setError(null);
    
    try {
      final result = await _appwrite.registerWithEmail(name, email, password);
      
      if (result['success'] == true) {
        setUser(result['user']);
        return true;
      } else {
        _setError(result['error'] ?? 'Registration failed');
        return false;
      }
    } catch (e) {
      _setError('Registration failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // SSO Login
  Future<bool> loginWithSSO(String provider) async {
    _setLoading(true);
    _setError(null);
    
    try {
      final result = await _appwrite.initiateSso(provider);
      
      if (result['success'] == true) {
        // SSO login typically involves redirects, so we may need to handle differently
        // For now, we'll assume success and let the auth check handle the session
        return true;
      } else {
        _setError(result['error'] ?? 'SSO login failed');
        return false;
      }
    } catch (e) {
      _setError('SSO login failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Logout
  Future<void> logout() async {
    _setLoading(true);
    
    try {
      await _appwrite.logout();
    } catch (e) {
      debugPrint('Logout error: $e');
    }
    
    // Clear user data regardless of API call result
    _user = null;
    _isAuthenticated = false;
    _setLoading(false);
  }

  // Update user profile
  Future<bool> updateProfile({
    String? name,
    String? email,
  }) async {
    if (!_isAuthenticated || _user == null) return false;
    
    _setLoading(true);
    _setError(null);
    
    try {
      final result = await _appwrite.updateUserProfile(
        name: name,
        email: email,
      );
      
      if (result['success'] == true) {
        setUser(result['user']);
        return true;
      } else {
        _setError(result['error'] ?? 'Profile update failed');
        return false;
      }
    } catch (e) {
      _setError('Profile update failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Change password
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    if (!_isAuthenticated) return false;
    
    _setLoading(true);
    _setError(null);
    
    try {
      final result = await _appwrite.changePassword(currentPassword, newPassword);
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['error'] ?? 'Password change failed');
        return false;
      }
    } catch (e) {
      _setError('Password change failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reset password
  Future<bool> resetPassword(String email) async {
    _setLoading(true);
    _setError(null);
    
    try {
      final result = await _appwrite.resetPassword(email);
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['error'] ?? 'Password reset failed');
        return false;
      }
    } catch (e) {
      _setError('Password reset failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Refresh user session
  Future<void> refreshSession() async {
    try {
      final session = await _appwrite.getCurrentSession();
      if (session['success'] == true) {
        setUser(session['user']);
      } else {
        // Session invalid, logout
        await logout();
      }
    } catch (e) {
      debugPrint('Session refresh error: $e');
      await logout();
    }
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
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
}