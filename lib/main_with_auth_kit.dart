import 'package:flutter/material.dart';
import 'package:appwrite_auth_kit/appwrite_auth_kit.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const RecursionChatApp());
}

class RecursionChatApp extends StatelessWidget {
  const RecursionChatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AppwriteAuthKit(
      client: AppwriteClient(
        endPoint: 'https://nyc.cloud.appwrite.io/v1',
        projectId: '689bdaf500072795b0f6',
      ),
      child: MaterialApp(
        title: 'Recursion Chat',
        theme: ThemeData(
          primarySwatch: Colors.deepPurple,
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF6366F1),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6366F1),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        home: const MainAuthScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class MainAuthScreen extends StatelessWidget {
  const MainAuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authNotifier = context.authNotifier;

    // Check authentication status
    return authNotifier.status == AuthStatus.authenticated
        ? const HomeScreen()
        : const SimpleAuthScreen();
  }
}

class SimpleAuthScreen extends StatelessWidget {
  const SimpleAuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authNotifier = context.authNotifier;

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
                        'Sign in to continue',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      // Loading indicator
                      if (authNotifier.status == AuthStatus.authenticating)
                        const Center(
                          child: CircularProgressIndicator(),
                        ),

                      // OAuth Buttons
                      if (authNotifier.status != AuthStatus.authenticating) ...[
                        // Google Sign-in Button
                        ElevatedButton.icon(
                          onPressed: () async {
                            try {
                              await authNotifier.createOAuth2Session(
                                provider: 'google',
                              );
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Google sign-in failed: $e'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                          icon: const Text('G', 
                            style: TextStyle(
                              fontSize: 18, 
                              fontWeight: FontWeight.bold,
                            )
                          ),
                          label: const Text('Continue with Google'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            backgroundColor: const Color(0xFF4285F4),
                          ),
                        ),
                        const SizedBox(height: 12),
                        
                        // GitHub Sign-in Button
                        ElevatedButton.icon(
                          onPressed: () async {
                            try {
                              await authNotifier.createOAuth2Session(
                                provider: 'github',
                              );
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('GitHub sign-in failed: $e'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                          icon: const Icon(Icons.code, size: 20),
                          label: const Text('Continue with GitHub'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            backgroundColor: const Color(0xFF333333),
                          ),
                        ),
                      ],
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