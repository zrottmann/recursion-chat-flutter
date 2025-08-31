import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

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
                        'Built with Flutter Framework',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      // Login Buttons
                      Consumer<AuthService>(
                        builder: (context, authService, child) {
                          if (authService.isLoading) {
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          return Column(
                            children: [
                              // Google Sign-in Button
                              ElevatedButton.icon(
                                onPressed: () async {
                                  await authService.signInWithGoogle();
                                },
                                icon: const Icon(Icons.login, size: 20),
                                label: const Text('Sign in with Google'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  backgroundColor: const Color(0xFF4285F4),
                                  foregroundColor: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 12),
                              
                              // GitHub Sign-in Button
                              ElevatedButton.icon(
                                onPressed: () async {
                                  await authService.signInWithGitHub();
                                },
                                icon: const Icon(Icons.code, size: 20),
                                label: const Text('Sign in with GitHub'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  backgroundColor: const Color(0xFF333333),
                                  foregroundColor: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 24),
                              
                              // Quick Demo Button
                              OutlinedButton.icon(
                                onPressed: () async {
                                  await authService.signIn('Demo User', 'demo@recursionsystems.com');
                                },
                                icon: const Icon(Icons.demo_outlined, size: 20),
                                label: const Text('Quick Demo'),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                ),
                              ),
                            ],
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