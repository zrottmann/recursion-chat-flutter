import 'package:flutter/material.dart';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/enums.dart';
import 'package:appwrite/models.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'dart:convert';
import '../config/environment.dart';

/// ULTRATHINK OAuth Solution
/// Implements multiple OAuth strategies to maximize success rate
class UltrathinkOAuth {
  final Client client;
  final Account account;
  
  UltrathinkOAuth({required this.client, required this.account});

  /// Main OAuth method with ULTRATHINK multi-strategy approach
  Future<User?> signInWithGoogle() async {
    debugPrint('🧠 ULTRATHINK: Starting Google OAuth with multi-strategy approach');
    
    // Strategy 1: Try native SDK OAuth
    try {
      debugPrint('🧠 ULTRATHINK Strategy 1: Native SDK OAuth');
      await account.createOAuth2Session(provider: OAuthProvider.google);
      final user = await account.get();
      debugPrint('✅ ULTRATHINK Strategy 1 succeeded: ${user.name}');
      return user;
    } catch (e) {
      debugPrint('❌ ULTRATHINK Strategy 1 failed: $e');
    }
    
    // Strategy 2: Web-based OAuth with manual session creation
    try {
      debugPrint('🧠 ULTRATHINK Strategy 2: Web-based OAuth flow');
      return await _webBasedOAuth();
    } catch (e) {
      debugPrint('❌ ULTRATHINK Strategy 2 failed: $e');
    }
    
    // Strategy 3: Magic URL authentication (email-based)
    try {
      debugPrint('🧠 ULTRATHINK Strategy 3: Fallback to Magic URL');
      return await _magicUrlFallback();
    } catch (e) {
      debugPrint('❌ ULTRATHINK Strategy 3 failed: $e');
    }
    
    throw Exception('ULTRATHINK: All OAuth strategies failed');
  }
  
  /// Strategy 2: Web-based OAuth with session polling
  Future<User?> _webBasedOAuth() async {
    // Build OAuth URL that works in browser
    final oauthUrl = _buildBrowserOAuthUrl();
    debugPrint('🧠 ULTRATHINK: Opening OAuth URL in browser: $oauthUrl');
    
    // Open in external browser
    final uri = Uri.parse(oauthUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
        webOnlyWindowName: '_blank',
      );
      
      // Poll for session creation
      debugPrint('🧠 ULTRATHINK: Polling for OAuth session...');
      for (int i = 0; i < 30; i++) {
        await Future.delayed(const Duration(seconds: 2));
        
        try {
          // Check if session was created
          final user = await account.get();
          if (user.email != null) {
            debugPrint('✅ ULTRATHINK: Session found after ${(i + 1) * 2} seconds');
            return user;
          }
        } catch (e) {
          // Session not ready yet, continue polling
          if (i % 5 == 0) {
            debugPrint('🧠 ULTRATHINK: Still polling... (${i * 2}s elapsed)');
          }
        }
      }
    }
    
    throw Exception('ULTRATHINK: Web OAuth timed out after 60 seconds');
  }
  
  /// Build OAuth URL for browser-based flow
  String _buildBrowserOAuthUrl() {
    final baseUrl = Environment.appwritePublicEndpoint;
    final projectId = Environment.appwriteProjectId;
    
    // ULTRATHINK: Use minimal OAuth URL - let Appwrite handle redirects
    // This avoids "invalid success param" errors
    return '$baseUrl/account/sessions/oauth2/google?project=$projectId';
  }
  
  /// Strategy 3: Magic URL as fallback
  Future<User?> _magicUrlFallback() async {
    debugPrint('🧠 ULTRATHINK: Using Magic URL fallback - requires email');
    
    // This would need UI to get user's email
    // For now, return null to indicate manual email login needed
    throw Exception('ULTRATHINK: Magic URL requires email input - use email/password login');
  }
  
  /// ULTRATHINK diagnostic method
  Future<Map<String, dynamic>> diagnoseOAuthIssues() async {
    final diagnosis = <String, dynamic>{};
    
    // Check Appwrite connection
    try {
      await account.get();
      diagnosis['appwrite_connection'] = 'OK (session exists)';
    } catch (e) {
      if (e.toString().contains('401')) {
        diagnosis['appwrite_connection'] = 'OK (no session)';
      } else {
        diagnosis['appwrite_connection'] = 'FAILED: $e';
      }
    }
    
    // Check if browser can be launched
    final testUrl = Uri.parse('https://google.com');
    diagnosis['browser_launch'] = await canLaunchUrl(testUrl) ? 'OK' : 'FAILED';
    
    // Check project configuration
    diagnosis['project_id'] = Environment.appwriteProjectId;
    diagnosis['endpoint'] = Environment.appwritePublicEndpoint;
    
    // Deep link configuration check
    diagnosis['deep_links'] = {
      'appwrite-callback': 'appwrite-callback-${Environment.appwriteProjectId}://oauth',
      'package_scheme': 'com.recursionsystems.chat://oauth',
    };
    
    debugPrint('🧠 ULTRATHINK OAuth Diagnosis:');
    diagnosis.forEach((key, value) {
      debugPrint('  $key: $value');
    });
    
    return diagnosis;
  }
}