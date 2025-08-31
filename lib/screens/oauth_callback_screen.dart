import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/enhanced_sso_service.dart';

class OAuthCallbackScreen extends StatefulWidget {
  final bool success;
  
  const OAuthCallbackScreen({
    super.key,
    required this.success,
  });

  @override
  State<OAuthCallbackScreen> createState() => _OAuthCallbackScreenState();
}

class _OAuthCallbackScreenState extends State<OAuthCallbackScreen> {
  @override
  void initState() {
    super.initState();
    _handleCallback();
  }

  Future<void> _handleCallback() async {
    await Future.delayed(const Duration(seconds: 2)); // Show status briefly
    
    if (widget.success) {
      // OAuth was successful, check for current session
      final ssoService = context.read<EnhancedSSOService>();
      final result = await ssoService.getCurrentSession();
      
      if (result != null && result.success) {
        // Update auth service with SSO user
        final authService = context.read<AuthService>();
        // Note: You might need to add a method to AuthService to handle SSO users
        debugPrint('OAuth callback: User authenticated successfully');
        
        // Navigate to home
        if (mounted) {
          Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
        }
      } else {
        // Failed to get session, go back to auth
        _goBackToAuth();
      }
    } else {
      // OAuth failed
      _goBackToAuth();
    }
  }
  
  void _goBackToAuth() {
    if (mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: Center(
          child: Card(
            elevation: 8,
            margin: const EdgeInsets.all(24.0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Status Icon
                  Icon(
                    widget.success ? Icons.check_circle : Icons.error,
                    size: 64,
                    color: widget.success ? Colors.green : Colors.red,
                  ),
                  const SizedBox(height: 16),
                  
                  // Status Text
                  Text(
                    widget.success ? 'Authentication Successful!' : 'Authentication Failed',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: widget.success ? Colors.green[700] : Colors.red[700],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  
                  Text(
                    widget.success 
                      ? 'Redirecting to your dashboard...'
                      : 'Redirecting back to login...',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  
                  // Loading Indicator
                  const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}