import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class EmailLoginScreen extends StatefulWidget {
  const EmailLoginScreen({super.key});

  @override
  State<EmailLoginScreen> createState() => _EmailLoginScreenState();
}

class _EmailLoginScreenState extends State<EmailLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  
  bool _isLoginMode = true;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _toggleMode() {
    setState(() {
      _isLoginMode = !_isLoginMode;
    });
  }

  void _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    final authService = context.read<AuthService>();
    
    if (_isLoginMode) {
      await authService.signInWithEmail(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else {
      await authService.signUpWithEmail(
        _emailController.text.trim(),
        _passwordController.text,
        _nameController.text.trim(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 8,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header
                      Icon(
                        Icons.chat_bubble,
                        size: 64,
                        color: Theme.of(context).primaryColor,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Recursion Chat',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).primaryColor,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isLoginMode ? 'Sign in to continue' : 'Create your account',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      Consumer<AuthService>(
                        builder: (context, authService, child) {
                          return Form(
                            key: _formKey,
                            child: Column(
                              children: [
                                // Error message
                                if (authService.errorMessage != null) ...[
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.red[50],
                                      border: Border.all(color: Colors.red[300]!),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(Icons.error_outline, color: Colors.red[700], size: 20),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            authService.errorMessage!,
                                            style: TextStyle(
                                              color: Colors.red[700],
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          onPressed: authService.clearError,
                                          icon: const Icon(Icons.close, size: 18),
                                          color: Colors.red[700],
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],

                                // Name field (only for signup)
                                if (!_isLoginMode) ...[
                                  TextFormField(
                                    controller: _nameController,
                                    decoration: const InputDecoration(
                                      labelText: 'Full Name',
                                      prefixIcon: Icon(Icons.person),
                                      border: OutlineInputBorder(),
                                    ),
                                    validator: (value) {
                                      if (!_isLoginMode && (value == null || value.trim().isEmpty)) {
                                        return 'Please enter your name';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),
                                ],

                                // Email field
                                TextFormField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    labelText: 'Email',
                                    prefixIcon: Icon(Icons.email),
                                    border: OutlineInputBorder(),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Please enter your email';
                                    }
                                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                                      return 'Please enter a valid email';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Password field
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  decoration: InputDecoration(
                                    labelText: 'Password',
                                    prefixIcon: const Icon(Icons.lock),
                                    suffixIcon: IconButton(
                                      icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                                      onPressed: () {
                                        setState(() {
                                          _obscurePassword = !_obscurePassword;
                                        });
                                      },
                                    ),
                                    border: const OutlineInputBorder(),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Please enter your password';
                                    }
                                    if (!_isLoginMode && value.length < 8) {
                                      return 'Password must be at least 8 characters';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 24),

                                // Submit button
                                ElevatedButton(
                                  onPressed: authService.isLoading ? null : _submitForm,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                  ),
                                  child: authService.isLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                          ),
                                        )
                                      : Text(_isLoginMode ? 'Sign In' : 'Sign Up'),
                                ),
                                const SizedBox(height: 16),

                                // Toggle mode button
                                TextButton(
                                  onPressed: authService.isLoading ? null : _toggleMode,
                                  child: Text(
                                    _isLoginMode
                                        ? "Don't have an account? Sign up"
                                        : "Already have an account? Sign in",
                                  ),
                                ),
                                
                                // Google OAuth with Appwrite
                                const SizedBox(height: 16),
                                const Divider(),
                                const SizedBox(height: 16),
                                Text(
                                  'Or continue with',
                                  style: TextStyle(color: Colors.grey[600]),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 12),
                                
                                ElevatedButton.icon(
                                  onPressed: authService.isLoading ? null : () async {
                                    await authService.signInWithGoogle();
                                  },
                                  icon: const Text('G', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                  label: const Text('Continue with Google'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF4285F4),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    minimumSize: const Size(double.infinity, 48),
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                Text(
                                  'Powered by Appwrite',
                                  style: TextStyle(
                                    color: Colors.grey[500],
                                    fontSize: 12,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}