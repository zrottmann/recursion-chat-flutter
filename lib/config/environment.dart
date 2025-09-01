class Environment {
  static const String appwriteProjectId = '689bdaf500072795b0f6';
  static const String appwriteProjectName = 'Recursion Chat';
  static const String appwritePublicEndpoint = 'https://nyc.cloud.appwrite.io/v1';
  
  // Grok AI Configuration
  static const String grokApiEndpoint = 'https://api.x.ai/v1/chat/completions';
  static const String grokApiKey = String.fromEnvironment('GROK_API_KEY', 
    defaultValue: 'YOUR_GROK_API_KEY_HERE'); // Set via environment variable
  static const String grokModel = 'grok-3';
  
  // ULTRATHINK: Appwrite Platform Configuration Guide
  // 
  // WEB PLATFORM:
  // - Name: "Recursion Chat Web"
  // - Hostname: chat.recursionsystems.com
  // - No redirect URLs needed for modern OAuth
  //
  // ANDROID PLATFORM:
  // - Name: "Recursion Chat Android" 
  // - Package Name: com.recursionsystems.chat
  // - No redirect URLs needed - deep links handled via AndroidManifest.xml
  // 
  // FLUTTER WEB PLATFORM (if needed):
  // - Name: "Recursion Chat Flutter Web"
  // - Hostname: localhost:*
  //
  // OAuth Providers to enable in Appwrite Console:
  // - Google OAuth2 (configure with Google Cloud Console)
  // - GitHub OAuth2 (configure with GitHub Developer Settings)
}