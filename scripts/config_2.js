/**
 * Unified SSO Configuration
 * Project-specific configuration for authentication services
 */

// Base authentication service interface
export class BaseAuthService {
  constructor(config) {
    this.config = config;
  }

  // Required methods that all auth services must implement
  async signin(email, password) {
    throw new Error('signin method must be implemented');
  }

  async signup(email, password, name) {
    throw new Error('signup method must be implemented');
  }

  async signInWithProvider(provider) {
    throw new Error('signInWithProvider method must be implemented');
  }

  async getCurrentUser() {
    throw new Error('getCurrentUser method must be implemented');
  }

  async logout() {
    throw new Error('logout method must be implemented');
  }
}

// Project-specific configurations
export const PROJECT_CONFIGS = {
  'recursion-chat': {
    appwriteEndpoint: 'https://nyc.cloud.appwrite.io/v1',
    appwriteProjectId: '689bdaf500072795b0f6',
    databaseId: 'recursion_chat_db',
    oauth: {
      successUrl: window.location.origin + '/auth/success',
      errorUrl: window.location.origin + '/auth/error'
    },
    enabledProviders: ['google', 'github'],
    features: {
      emailAuth: true,
      ssoAuth: true,
      biometricAuth: false
    }
  },

  'trading-post': {
    appwriteEndpoint: 'https://nyc.cloud.appwrite.io/v1', 
    appwriteProjectId: '689bdee000098bd9d55c',
    databaseId: 'trading_post_db',
    oauth: {
      successUrl: window.location.origin + '/auth/callback',
      errorUrl: window.location.origin + '/auth/error'
    },
    enabledProviders: ['google', 'github', 'facebook'],
    features: {
      emailAuth: true,
      ssoAuth: true,
      biometricAuth: true
    }
  },

  'gx-multi-agent': {
    appwriteEndpoint: 'https://nyc.cloud.appwrite.io/v1',
    appwriteProjectId: '68a4e3da0022f3e129d0', // Replace with actual project ID
    databaseId: 'gx_multi_agent_db',
    oauth: {
      successUrl: window.location.origin + '/auth/success',
      errorUrl: window.location.origin + '/auth/failure'
    },
    enabledProviders: ['google', 'github', 'microsoft'],
    features: {
      emailAuth: true,
      ssoAuth: true,
      biometricAuth: false
    }
  },

  'slumlord': {
    appwriteEndpoint: 'https://nyc.cloud.appwrite.io/v1',
    appwriteProjectId: '68a0db634634a6d0392f',
    databaseId: 'slumlord_game_db',
    oauth: {
      successUrl: window.location.origin + '/auth/success',
      errorUrl: window.location.origin + '/auth/error'
    },
    enabledProviders: ['google', 'github', 'discord'],
    features: {
      emailAuth: true,
      ssoAuth: true,
      biometricAuth: false
    }
  },

  'archon': {
    appwriteEndpoint: 'https://nyc.cloud.appwrite.io/v1',
    appwriteProjectId: '68a4e3da0022f3e129d0', // Replace with actual project ID
    databaseId: 'archon_db',
    oauth: {
      successUrl: window.location.origin + '/auth/success',
      errorUrl: window.location.origin + '/auth/error'
    },
    enabledProviders: ['google', 'github', 'apple', 'microsoft'],
    features: {
      emailAuth: true,
      ssoAuth: true,
      biometricAuth: true
    }
  }
};

// Auto-detect project based on URL or package.json
export function detectProject() {
  // Try to detect from hostname
  const hostname = window.location.hostname;
  
  if (hostname.includes('recursion') || hostname.includes('chat')) {
    return 'recursion-chat';
  }
  if (hostname.includes('trading')) {
    return 'trading-post';
  }
  if (hostname.includes('gx') || hostname.includes('multi-agent')) {
    return 'gx-multi-agent';
  }
  if (hostname.includes('slumlord') || hostname.includes('rpg')) {
    return 'slumlord';
  }
  if (hostname.includes('archon')) {
    return 'archon';
  }

  // Try to detect from package.json name (for development)
  try {
    const packageName = process.env.npm_package_name;
    if (packageName) {
      for (const [project, config] of Object.entries(PROJECT_CONFIGS)) {
        if (packageName.includes(project) || packageName.includes(project.replace('-', ''))) {
          return project;
        }
      }
    }
  } catch (e) {
    // Ignore errors in browser environment
  }

  // Default fallback
  return 'recursion-chat';
}

// Get configuration for current project
export function getProjectConfig(projectName = null) {
  const project = projectName || detectProject();
  const config = PROJECT_CONFIGS[project];
  
  if (!config) {
    console.warn(`[UnifiedSSO] Unknown project: ${project}, using recursion-chat config`);
    return PROJECT_CONFIGS['recursion-chat'];
  }

  return config;
}

// Create Appwrite auth service wrapper
export function createAppwriteAuthService(projectConfig) {
  return new (class extends BaseAuthService {
    constructor(config) {
      super(config);
      
      // Dynamically import Appwrite SDK
      this._clientPromise = this._initializeAppwrite();
    }

    async _initializeAppwrite() {
      try {
        // Try to import from different possible locations
        let appwrite;
        try {
          appwrite = await import('appwrite');
        } catch (e1) {
          try {
            appwrite = await import('../services/appwrite');
          } catch (e2) {
            try {
              appwrite = await import('./appwrite-unified-client');
            } catch (e3) {
              throw new Error('Could not import Appwrite SDK. Please ensure it is installed and available.');
            }
          }
        }

        const client = new appwrite.Client()
          .setEndpoint(this.config.appwriteEndpoint)
          .setProject(this.config.appwriteProjectId);

        return {
          client,
          account: new appwrite.Account(client),
          databases: new appwrite.Databases(client)
        };
      } catch (error) {
        console.error('[UnifiedSSO] Failed to initialize Appwrite:', error);
        throw error;
      }
    }

    async signin(email, password) {
      const { account } = await this._clientPromise;
      
      try {
        const session = await account.createEmailSession(email, password);
        const user = await account.get();
        
        return {
          success: true,
          user,
          session,
          message: 'Successfully signed in!'
        };
      } catch (error) {
        throw new Error(error.message || 'Sign in failed');
      }
    }

    async signup(email, password, name) {
      const { account } = await this._clientPromise;
      
      try {
        const user = await account.create('unique()', email, password, name);
        
        return {
          success: true,
          user,
          message: 'Account created successfully! Please verify your email.'
        };
      } catch (error) {
        throw new Error(error.message || 'Sign up failed');
      }
    }

    async signInWithProvider(provider) {
      const { account } = await this._clientPromise;
      
      try {
        await account.createOAuth2Session(
          provider,
          this.config.oauth.successUrl,
          this.config.oauth.errorUrl
        );
        
        // Note: This will redirect, so we won't reach this return
        return { success: true };
      } catch (error) {
        throw new Error(error.message || `${provider} authentication failed`);
      }
    }

    async getCurrentUser() {
      const { account } = await this._clientPromise;
      
      try {
        const user = await account.get();
        return user;
      } catch (error) {
        return null;
      }
    }

    async logout() {
      const { account } = await this._clientPromise;
      
      try {
        await account.deleteSession('current');
        return { success: true };
      } catch (error) {
        throw new Error(error.message || 'Logout failed');
      }
    }

    async handleOAuthCallback() {
      const { account } = await this._clientPromise;
      
      try {
        const user = await account.get();
        const session = await account.getSession('current');
        
        return {
          success: true,
          user,
          session
        };
      } catch (error) {
        throw new Error(error.message || 'OAuth callback failed');
      }
    }
  })(projectConfig);
}

// iOS Safari session manager for mobile optimization
export const iosSessionManager = {
  isIOSSafari: /iPad|iPhone|iPod/.test(navigator.userAgent) && 
               /Safari/.test(navigator.userAgent) && 
               !/CriOS|FxiOS/.test(navigator.userAgent),

  setAuthSuccess(user) {
    try {
      localStorage.setItem('ios_auth_success', JSON.stringify({
        timestamp: Date.now(),
        userId: user.$id || user.id,
        email: user.email
      }));
    } catch (e) {
      console.warn('[UnifiedSSO] Could not save auth success to localStorage');
    }
  },

  hasRecentAuthSuccess() {
    try {
      const authSuccess = localStorage.getItem('ios_auth_success');
      if (!authSuccess) return false;

      const { timestamp } = JSON.parse(authSuccess);
      // Consider auth success valid for 5 minutes
      return (Date.now() - timestamp) < (5 * 60 * 1000);
    } catch (e) {
      return false;
    }
  },

  incrementRedirectCount() {
    try {
      const count = parseInt(localStorage.getItem('ios_redirect_count') || '0') + 1;
      localStorage.setItem('ios_redirect_count', count.toString());
      return count;
    } catch (e) {
      return 1;
    }
  },

  breakAuthLoop() {
    try {
      const count = parseInt(localStorage.getItem('ios_redirect_count') || '0');
      if (count > 3) {
        console.error('[UnifiedSSO] Breaking iOS Safari auth loop after', count, 'redirects');
        localStorage.removeItem('ios_redirect_count');
        localStorage.removeItem('ios_auth_success');
        return true;
      }
    } catch (e) {
      // Ignore
    }
    return false;
  },

  clearAuthData() {
    try {
      localStorage.removeItem('ios_auth_success');
      localStorage.removeItem('ios_redirect_count');
    } catch (e) {
      // Ignore
    }
  }
};

// Main configuration factory
export function createUnifiedSSOConfig(projectName = null, customConfig = {}) {
  const projectConfig = getProjectConfig(projectName);
  const authService = createAppwriteAuthService(projectConfig);

  return {
    authService,
    oauth: projectConfig.oauth,
    enabledProviders: projectConfig.enabledProviders,
    features: projectConfig.features,
    projectConfig,
    iosSessionManager,
    ...customConfig
  };
}

export default {
  BaseAuthService,
  PROJECT_CONFIGS,
  detectProject,
  getProjectConfig,
  createAppwriteAuthService,
  createUnifiedSSOConfig,
  iosSessionManager
};