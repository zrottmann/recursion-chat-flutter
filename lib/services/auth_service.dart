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

      debugPrint('Starting OAuth with provider: $provider');
      debugPrint('Platform: ${kIsWeb ? "Web" : "Mobile"}');
      debugPrint('Appwrite endpoint: ${Environment.appwritePublicEndpoint}');
      debugPrint('Appwrite project: ${Environment.appwriteProjectId}');

      // Modern Appwrite OAuth - works on both web and mobile
      if (kIsWeb) {
        debugPrint('Using web OAuth flow');
        // Web platform
        await _account.createOAuth2Session(
          provider: provider,
          success: 'https://chat.recursionsystems.com',
          failure: 'https://chat.recursionsystems.com',
        );
      } else {
        debugPrint('Using ULTRATHINK mobile OAuth flow');
        
        // ULTRATHINK: Try multiple redirect strategies in order of likelihood to work
        final strategies = [
          // Strategy 1: Standard Appwrite mobile callback
          {
            'name': 'Appwrite Standard',
            'success': 'appwrite-callback-${Environment.appwriteProjectId}://oauth',
            'failure': 'appwrite-callback-${Environment.appwriteProjectId}://oauth'
          },
          // Strategy 2: Package-based scheme
          {
            'name': 'Package Scheme',
            'success': 'com.recursionsystems.chat://oauth',
            'failure': 'com.recursionsystems.chat://oauth'
          },
          // Strategy 3: Custom app scheme
          {
            'name': 'Custom Scheme',
            'success': 'recursionchatsample://oauth',
            'failure': 'recursionchatsample://oauth'
          },
          // Strategy 4: Simple format
          {
            'name': 'Simple Format',
            'success': 'com.recursionsystems.chat://success',
            'failure': 'com.recursionsystems.chat://failure'
          },
        ];

        Exception? lastException;
        
        for (int i = 0; i < strategies.length; i++) {
          final strategy = strategies[i];
          try {
            debugPrint('Trying strategy ${i + 1}: ${strategy['name']}');
            debugPrint('Success URL: ${strategy['success']}');
            debugPrint('Failure URL: ${strategy['failure']}');
            
            await _account.createOAuth2Session(
              provider: provider,
              success: strategy['success']!,
              failure: strategy['failure']!,
            );
            
            debugPrint('Strategy ${strategy['name']} succeeded!');
            break; // Success! Exit the loop
            
          } catch (e) {
            debugPrint('Strategy ${strategy['name']} failed: $e');
            lastException = e as Exception;
            
            // If this isn't the last strategy, continue to next one
            if (i < strategies.length - 1) {
              debugPrint('Trying next strategy...');
              continue;
            } else {
              // This was the last strategy, re-throw the exception
              throw lastException;
            }
          }
        }
      }

      debugPrint('OAuth session created, checking user session...');
      
      // After OAuth, check for user session
      _currentUser = await _account.get();
      debugPrint('OAuth sign-in successful for user: ${_currentUser?.name}');
      
    } catch (e, stackTrace) {
      debugPrint('OAuth sign-in error: $e');
      debugPrint('Stack trace: $stackTrace');
      
      // More specific error handling
      String errorMessage = 'OAuth authentication failed.';
      if (e.toString().contains('network')) {
        errorMessage = 'Network error during OAuth. Check your connection.';
      } else if (e.toString().contains('cancelled')) {
        errorMessage = 'OAuth cancelled by user.';
      } else if (e.toString().contains('Invalid')) {
        errorMessage = 'OAuth configuration error. Please try email/password.';
      } else {
        errorMessage = 'OAuth failed: ${e.toString().length > 100 ? e.toString().substring(0, 100) + "..." : e.toString()}';
      }
      
      _errorMessage = errorMessage;
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Email/Password authentication for native apps
  Future<void> signInWithEmail(String email, String password) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _account.createEmailPasswordSession(
        email: email,
        password: password,
      );

      _currentUser = await _account.get();
      debugPrint('Email sign-in successful for user: ${_currentUser?.name}');
      
    } catch (e) {
      debugPrint('Email sign-in error: $e');
      _errorMessage = 'Login failed. Please check your credentials.';
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signUpWithEmail(String email, String password, String name) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _account.create(
        userId: ID.unique(),
        email: email,
        password: password,
        name: name,
      );

      // Automatically sign in after registration
      await signInWithEmail(email, password);
      
    } catch (e) {
      debugPrint('Email sign-up error: $e');
      _errorMessage = 'Registration failed. Please try again.';
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