import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _userName;
  String? _userEmail;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get userName => _userName;
  String? get userEmail => _userEmail;

  AuthService() {
    _loadAuthState();
  }

  Future<void> _loadAuthState() async {
    _isLoading = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    _isAuthenticated = prefs.getBool('isAuthenticated') ?? false;
    _userName = prefs.getString('userName');
    _userEmail = prefs.getString('userEmail');
    
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signIn(String name, String email) async {
    _isLoading = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    
    _isAuthenticated = true;
    _userName = name;
    _userEmail = email;
    
    await prefs.setBool('isAuthenticated', true);
    await prefs.setString('userName', name);
    await prefs.setString('userEmail', email);
    
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    
    _isAuthenticated = false;
    _userName = null;
    _userEmail = null;
    
    await prefs.clear();
    
    _isLoading = false;
    notifyListeners();
  }

  // Mock OAuth sign in
  Future<void> signInWithGoogle() async {
    _isLoading = true;
    notifyListeners();

    // Simulate OAuth process
    await Future.delayed(const Duration(seconds: 1));
    await signIn('Google User', 'user@gmail.com');
  }

  Future<void> signInWithGitHub() async {
    _isLoading = true;
    notifyListeners();

    // Simulate OAuth process
    await Future.delayed(const Duration(seconds: 1));
    await signIn('GitHub User', 'user@github.com');
  }
}