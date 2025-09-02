import 'package:flutter/material.dart';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/enums.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/environment.dart';

class CustomOAuthService {
  final Client client;
  final Account account;
  
  CustomOAuthService({required this.client, required this.account});

  Future<void> signInWithProvider(OAuthProvider provider) async {
    try {
      debugPrint('Starting custom OAuth with URL launcher for $provider');
      
      // Build OAuth URL
      final oauthUrl = _buildOAuthUrl(provider);
      debugPrint('OAuth URL: $oauthUrl');
      
      // Launch the OAuth URL in browser
      final uri = Uri.parse(oauthUrl);
      
      if (await canLaunchUrl(uri)) {
        // Launch with external browser for better OAuth handling
        await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
          webOnlyWindowName: '_self',
        );
        
        debugPrint('OAuth URL launched in browser');
        
        // Wait a bit for the OAuth flow to complete
        await Future.delayed(const Duration(seconds: 2));
        
        // The app should be resumed via deep link after OAuth
        // Check if session was created
        try {
          final user = await account.get();
          debugPrint('OAuth successful, user: ${user.name}');
        } catch (e) {
          debugPrint('Session check after OAuth failed: $e');
          // Session might not be ready yet, that's okay
        }
        
      } else {
        throw Exception('Could not launch OAuth URL');
      }
      
    } catch (e) {
      debugPrint('Custom OAuth error: $e');
      rethrow;
    }
  }
  
  String _buildOAuthUrl(OAuthProvider provider) {
    final baseUrl = Environment.appwritePublicEndpoint;
    final projectId = Environment.appwriteProjectId;
    final providerName = provider.name;
    
    // Build OAuth URL that will create a session
    // The key is to ensure the OAuth completes and creates a session cookie
    return '$baseUrl/account/sessions/oauth2/$providerName?project=$projectId';
  }
}