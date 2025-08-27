import 'package:flutter/material.dart';
import '../../shared/lib/services/appwrite_service.dart';
import 'home_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final AppwriteService _appwrite = AppwriteService();
  bool _isLoading = false;
  
  Future<void> _signInWithProvider(String provider) async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final result = await _appwrite.initiateSso(provider);
      
      if (result['success'] == true) {
        // In a real app, this would open a webview or browser
        // For now, we'll simulate the callback
        final callbackResult = await _appwrite.handleSsoCallback(
          provider,
          'simulation_code',
        );
        
        if (callbackResult['success'] == true && mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomeScreen()),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Authentication failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;
    
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: isTablet ? 400 : double.infinity,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(
                    Icons.settings_remote,
                    size: isTablet ? 100 : 80,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Welcome to Remote',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to control your systems',
                    style: Theme.of(context).textTheme.bodyLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),
                  _SsoButton(
                    provider: 'google',
                    text: 'Continue with Google',
                    icon: Icons.g_mobiledata,
                    color: Colors.red,
                    onPressed: _isLoading ? null : () => _signInWithProvider('google'),
                  ),
                  const SizedBox(height: 12),
                  _SsoButton(
                    provider: 'github',
                    text: 'Continue with GitHub',
                    icon: Icons.code,
                    color: Colors.black87,
                    onPressed: _isLoading ? null : () => _signInWithProvider('github'),
                  ),
                  const SizedBox(height: 12),
                  _SsoButton(
                    provider: 'microsoft',
                    text: 'Continue with Microsoft',
                    icon: Icons.window,
                    color: Colors.blue,
                    onPressed: _isLoading ? null : () => _signInWithProvider('microsoft'),
                  ),
                  if (_isLoading) ...[
                    const SizedBox(height: 32),
                    const Center(child: CircularProgressIndicator()),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SsoButton extends StatelessWidget {
  final String provider;
  final String text;
  final IconData icon;
  final Color color;
  final VoidCallback? onPressed;
  
  const _SsoButton({
    Key? key,
    required this.provider,
    required this.text,
    required this.icon,
    required this.color,
    this.onPressed,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, color: Colors.white),
      label: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}