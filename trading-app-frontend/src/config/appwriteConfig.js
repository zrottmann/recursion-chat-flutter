/**
 * Appwrite Configuration & OAuth Providers
 * Centralized configuration for Appwrite services and OAuth providers
 */

// Environment Configuration
const config = {
  // Appwrite Core Configuration
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
    apiKey: import.meta.env.VITE_APPWRITE_API_KEY || '',
  },

  // Database Configuration
  database: {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'trading_post_db',
    collections: {
      users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
      items: import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION_ID || 'items',
      wants: import.meta.env.VITE_APPWRITE_WANTS_COLLECTION_ID || 'wants',
      trades: import.meta.env.VITE_APPWRITE_TRADES_COLLECTION_ID || 'trades',
      messages: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
      reviews: import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID || 'reviews',
      notifications: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications',
      matches: import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID || 'matches',
      savedItems: import.meta.env.VITE_APPWRITE_SAVED_ITEMS_COLLECTION_ID || 'saved_items',
    }
  },

  // Storage Configuration
  storage: {
    buckets: {
      itemImages: import.meta.env.VITE_APPWRITE_ITEM_IMAGES_BUCKET_ID || 'item_images',
      profileImages: import.meta.env.VITE_APPWRITE_PROFILE_IMAGES_BUCKET_ID || 'profile_images',
      chatAttachments: import.meta.env.VITE_APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID || 'chat_attachments',
    }
  },

  // OAuth Providers Configuration
  oauth: {
    providers: [
      {
        id: 'google',
        name: 'Google',
        icon: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
        enabled: true,
        scopes: ['openid', 'profile', 'email'],
        color: '#4285F4',
        buttonClass: 'btn-google',
      },
      {
        id: 'github',
        name: 'GitHub',
        icon: 'fab fa-github',
        enabled: false, // GitHub OAuth not enabled in Appwrite Console
        scopes: ['user:email'],
        color: '#333333',
        buttonClass: 'btn-github',
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: 'fab fa-facebook',
        enabled: false, // Facebook OAuth not enabled in Appwrite Console
        scopes: ['email', 'public_profile'],
        color: '#1877F2',
        buttonClass: 'btn-facebook',
      },
      {
        id: 'microsoft',
        name: 'Microsoft',
        icon: 'fab fa-microsoft',
        enabled: import.meta.env.VITE_ENABLE_MICROSOFT_AUTH === 'true',
        scopes: ['openid', 'profile', 'email'],
        color: '#00BCF2',
        buttonClass: 'btn-microsoft',
      },
      {
        id: 'discord',
        name: 'Discord',
        icon: 'fab fa-discord',
        enabled: import.meta.env.VITE_ENABLE_DISCORD_AUTH === 'true',
        scopes: ['identify', 'email'],
        color: '#5865F2',
        buttonClass: 'btn-discord',
      },
      {
        id: 'apple',
        name: 'Apple',
        icon: 'fab fa-apple',
        enabled: import.meta.env.VITE_ENABLE_APPLE_AUTH === 'true',
        scopes: ['email', 'name'],
        color: '#000000',
        buttonClass: 'btn-apple',
      },
    ],
    // OAuth URLs - Users should NEVER see these URLs (handled by silent OAuth popup)
    callbackUrl: import.meta.env.VITE_OAUTH_CALLBACK_URL || 'https://tradingpost.appwrite.network/auth/success',
    errorUrl: import.meta.env.VITE_OAUTH_ERROR_URL || 'https://tradingpost.appwrite.network/auth/error',
  },

  // Session Configuration
  session: {
    cookieName: 'trading_post_session',
    cookieDomain: import.meta.env.VITE_COOKIE_DOMAIN || undefined,
    cookiePath: '/',
    cookieSecure: process.env.NODE_ENV === 'production',
    cookieSameSite: 'lax',
    sessionTimeout: 60 * 60 * 24 * 7, // 7 days in seconds
    refreshThreshold: 60 * 60, // Refresh token when less than 1 hour remaining
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Feature Flags
  features: {
    enableSSO: true,
    enableEmailAuth: true,
    enablePhoneAuth: import.meta.env.VITE_ENABLE_PHONE_AUTH === 'true',
    enableMagicLink: import.meta.env.VITE_ENABLE_MAGIC_LINK === 'true',
    enableAnonymousAuth: import.meta.env.VITE_ENABLE_ANONYMOUS_AUTH === 'true',
    enableBiometric: import.meta.env.VITE_ENABLE_BIOMETRIC === 'true',
    enableMFA: import.meta.env.VITE_ENABLE_MFA === 'true',
    enablePasswordless: import.meta.env.VITE_ENABLE_PASSWORDLESS === 'true',
  },

  // Security Configuration
  security: {
    enableCSRF: true,
    enableRateLimiting: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    enableCaptcha: import.meta.env.VITE_ENABLE_CAPTCHA === 'true',
    captchaSiteKey: import.meta.env.VITE_CAPTCHA_SITE_KEY || '',
  },

  // UI Configuration
  ui: {
    theme: 'light',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    successColor: '#28a745',
    dangerColor: '#dc3545',
    warningColor: '#ffc107',
    infoColor: '#17a2b8',
    logoUrl: '/logo.png',
    appName: 'Trading Post',
    companyName: 'Trading Post Inc.',
  },

  // Analytics Configuration
  analytics: {
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    googleAnalyticsId: import.meta.env.VITE_GA_ID || '',
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN || '',
  },

  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate required configuration
const validateConfig = () => {
  const errors = [];
  
  if (!config.appwrite.projectId) {
    errors.push('REACT_APP_APPWRITE_PROJECT_ID is required');
  }
  
  if (!config.appwrite.endpoint) {
    errors.push('REACT_APP_APPWRITE_ENDPOINT is required');
  }
  
  if (config.features.enableSSO && !config.oauth.providers.some(p => p.enabled)) {
    errors.push('At least one OAuth provider must be enabled for SSO');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    if (config.isProduction) {
      throw new Error('Invalid configuration: ' + errors.join(', '));
    }
  }
  
  return errors.length === 0;
};

// Helper function to get enabled OAuth providers
export const getEnabledProviders = () => {
  return config.oauth.providers.filter(provider => provider.enabled);
};

// Helper function to get provider by ID
export const getProviderById = (providerId) => {
  return config.oauth.providers.find(provider => provider.id === providerId);
};

// Helper function to build OAuth redirect URL
export const buildOAuthRedirectUrl = (provider, successUrl, failureUrl) => {
  const success = successUrl || config.oauth.callbackUrl;
  const failure = failureUrl || config.oauth.errorUrl;
  
  // Use custom domain (requires platform registration in Appwrite Console)
  const baseUrl = 'https://tradingpost.appwrite.network';
  const successUrlComplete = success.startsWith('http') ? success : `${baseUrl}${success.startsWith('/') ? success : '/' + success}`;
  const failureUrlComplete = failure.startsWith('http') ? failure : `${baseUrl}${failure.startsWith('/') ? failure : '/' + failure}`;
  
  return {
    success: `${successUrlComplete}?provider=${provider}`,
    failure: `${failureUrlComplete}?provider=${provider}`,
  };
};

// Validate configuration on load
if (config.isDevelopment) {
  validateConfig();
}

export default config;