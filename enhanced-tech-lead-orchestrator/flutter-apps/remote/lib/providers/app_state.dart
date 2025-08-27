import 'package:flutter/material.dart';

class AppState extends ChangeNotifier {
  bool _isDarkMode = false;
  bool _isOnline = true;
  String? _userId;
  String? _userEmail;
  String? _userName;
  
  // System status
  Map<String, dynamic> _systemStatus = {
    'cpu': 45.0,
    'memory': 62.0,
    'disk': 38.0,
    'network': 23.0,
    'uptime': '15d 3h',
    'temperature': 42.0,
    'load': 0.45,
  };
  
  // Getters
  bool get isDarkMode => _isDarkMode;
  bool get isOnline => _isOnline;
  String? get userId => _userId;
  String? get userEmail => _userEmail;
  String? get userName => _userName;
  Map<String, dynamic> get systemStatus => _systemStatus;
  
  // Theme management
  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }
  
  void setThemeMode(bool isDark) {
    _isDarkMode = isDark;
    notifyListeners();
  }
  
  // Connection status
  void setOnlineStatus(bool online) {
    _isOnline = online;
    notifyListeners();
  }
  
  // User management
  void setUser(String userId, String email, String name) {
    _userId = userId;
    _userEmail = email;
    _userName = name;
    notifyListeners();
  }
  
  void clearUser() {
    _userId = null;
    _userEmail = null;
    _userName = null;
    notifyListeners();
  }
  
  // System status updates
  void updateSystemStatus(Map<String, dynamic> status) {
    _systemStatus = {..._systemStatus, ...status};
    notifyListeners();
  }
  
  void updateCpuUsage(double usage) {
    _systemStatus['cpu'] = usage;
    notifyListeners();
  }
  
  void updateMemoryUsage(double usage) {
    _systemStatus['memory'] = usage;
    notifyListeners();
  }
  
  void updateDiskUsage(double usage) {
    _systemStatus['disk'] = usage;
    notifyListeners();
  }
  
  void updateNetworkUsage(double usage) {
    _systemStatus['network'] = usage;
    notifyListeners();
  }
  
  // Utility methods
  String getStatusColor() {
    final cpu = _systemStatus['cpu'] as double;
    final memory = _systemStatus['memory'] as double;
    
    if (cpu > 80 || memory > 90) return 'critical';
    if (cpu > 60 || memory > 75) return 'warning';
    return 'normal';
  }
  
  bool isSystemHealthy() {
    final cpu = _systemStatus['cpu'] as double;
    final memory = _systemStatus['memory'] as double;
    final disk = _systemStatus['disk'] as double;
    
    return cpu < 80 && memory < 90 && disk < 95;
  }
}