/**
 * Auto-Configuration for Easy Appwrite SSO
 * Detects environment settings and provides optimal configuration
 */

// Auto-detect environment type
const isVite = typeof import.meta !== 'undefined' && import.meta.env;
const isNextJS = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const isBrowser = typeof window !== 'undefined';

// Environment variable detection with fallbacks
const getConfig = () => {
  let endpoint, projectId, databaseId;

  if (isNextJS) {
    // Next.js environment variables
    endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  } else if (isVite) {
    // Vite environment variables
    endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js or legacy React environment variables
    endpoint = process.env.REACT_APP_APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
    projectId = process.env.REACT_APP_APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
    databaseId = process.env.REACT_APP_APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  }

  // Fallback defaults
  return {
    endpoint: endpoint || 'https://nyc.cloud.appwrite.io/v1',
    projectId: projectId || null,
    databaseId: databaseId || null,
    
    // OAuth configuration with auto-detection
    oauth: {
      callbackUrl: isBrowser ? `${window.location.origin}/auth/callback` : '/auth/callback',
      errorUrl: isBrowser ? `${window.location.origin}/auth/error` : '/auth/error',
      silent: true, // Use popup mode by default
      autoClose: true, // Auto-close popup after success
      timeout: 120000 // 2 minutes
    },

    // Provider-specific settings
    providers: {
      google: {
        enabled: true,
        scopes: ['openid', 'email', 'profile']
      },
      github: {
        enabled: true,
        scopes: ['user:email']
      },
      microsoft: {
        enabled: false,
        scopes: ['openid', 'email', 'profile']
      },
      facebook: {
        enabled: false,
        scopes: ['email', 'public_profile']
      },
      apple: {
        enabled: false,
        scopes: ['email', 'name']
      },
      discord: {
        enabled: false,
        scopes: ['identify', 'email']
      },
      linkedin: {
        enabled: false,
        scopes: ['r_liteprofile', 'r_emailaddress']
      }
    }
  };
};

// Export configuration
const appwriteSSOConfig = getConfig();

// Debug logging in development
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  console.log('[Easy Appwrite SSO] Auto-configuration:', {
    framework: isNextJS ? 'Next.js' : isVite ? 'Vite' : 'Other',
    endpoint: appwriteSSOConfig.endpoint,
    projectId: appwriteSSOConfig.projectId ? '✓ Configured' : '✗ Missing',
    oauth: appwriteSSOConfig.oauth
  });
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = appwriteSSOConfig;
} else if (typeof window !== 'undefined') {
  window.appwriteSSOConfig = appwriteSSOConfig;
}

export default appwriteSSOConfig;