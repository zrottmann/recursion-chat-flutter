class Environment {
  static const String appwriteProjectId = '689bdaf500072795b0f6';
  static const String appwriteProjectName = 'Recursion Chat';
  static const String appwritePublicEndpoint = 'https://nyc.cloud.appwrite.io/v1';
  
  // Grok AI Configuration
  static const String grokApiEndpoint = 'https://api.x.ai/v1/chat/completions';
  static const String grokApiKey = String.fromEnvironment('GROK_API_KEY', 
    defaultValue: 'YOUR_GROK_API_KEY_HERE'); // Set via environment variable
  static const String grokModel = 'grok-beta';
}