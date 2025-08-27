/**
 * Easy Appwrite SSO - Simplified Single Sign-On for Appwrite
 * Zero-config OAuth authentication that just works
 * 
 * Features:
 * - Auto-detects Appwrite configuration
 * - Handles OAuth flow transparently
 * - Works with popup and redirect methods
 * - Mobile-friendly
 * - TypeScript support
 */

import { Client, Account, OAuthProvider } from 'appwrite';

class EasyAppwriteSSO {
  constructor(config = {}) {
    // Auto-detect config from environment or use provided values
    this.config = {
      endpoint: config.endpoint || import.meta.env?.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
      projectId: config.projectId || import.meta.env?.VITE_APPWRITE_PROJECT_ID,
      // Auto-detect current origin for OAuth redirects
      redirectUrl: config.redirectUrl || `${window.location.origin}/auth/callback`,
      errorUrl: config.errorUrl || `${window.location.origin}/auth/error`,
      // Enable silent mode by default (no page redirects)
      silent: config.silent !== undefined ? config.silent : true,
      // Auto-close popup after success
      autoClose: config.autoClose !== undefined ? config.autoClose : true,
      // Timeout for popup monitoring
      timeout: config.timeout || 120000, // 2 minutes
      ...config
    };

    // Initialize Appwrite client
    this.client = new Client()
      .setEndpoint(this.config.endpoint)
      .setProject(this.config.projectId);
    
    this.account = new Account(this.client);
    
    // Bind methods
    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);
    this.getUser = this.getUser.bind(this);
    this.onAuthChange = this.onAuthChange.bind(this);
  }

  /**
   * Sign in with OAuth provider
   * @param {string} provider - OAuth provider name (google, github, facebook, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise} User object or error
   */
  async signIn(provider = 'google', options = {}) {
    try {
      // Map common provider names to Appwrite OAuthProvider enum
      const providerMap = {
        'google': OAuthProvider.Google,
        'github': OAuthProvider.Github,
        'facebook': OAuthProvider.Facebook,
        'apple': OAuthProvider.Apple,
        'microsoft': OAuthProvider.Microsoft,
        'amazon': OAuthProvider.Amazon,
        'linkedin': OAuthProvider.Linkedin,
        'gitlab': OAuthProvider.Gitlab,
        'bitbucket': OAuthProvider.Bitbucket,
        'discord': OAuthProvider.Discord,
        'twitch': OAuthProvider.Twitch,
        'spotify': OAuthProvider.Spotify,
        'slack': OAuthProvider.Slack,
        'zoom': OAuthProvider.Zoom,
        'yahoo': OAuthProvider.Yahoo,
        'box': OAuthProvider.Box,
        'dropbox': OAuthProvider.Dropbox,
        'salesforce': OAuthProvider.Salesforce
      };

      const oauthProvider = providerMap[provider.toLowerCase()];
      if (!oauthProvider) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Use silent mode if enabled (popup-based flow)
      if (this.config.silent && !this.isMobile()) {
        return await this.silentSignIn(oauthProvider, options);
      }

      // Standard redirect flow
      const successUrl = options.successUrl || this.config.redirectUrl;
      const failureUrl = options.failureUrl || this.config.errorUrl;
      
      // Store current location for redirect after auth
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('appwrite_sso_redirect', window.location.href);
      }

      // This will redirect the page
      await this.account.createOAuth2Session(
        oauthProvider,
        successUrl,
        failureUrl,
        options.scopes || []
      );

      // This line won't execute due to redirect
      return { success: true };
    } catch (error) {
      console.error(`[EasySSO] Sign in error:`, error);
      throw this.formatError(error);
    }
  }

  /**
   * Silent sign in using popup window
   */
  async silentSignIn(provider, options = {}) {
    return new Promise((resolve, reject) => {
      const authUrl = this.getOAuthUrl(provider, options);
      
      // Open popup window
      const popup = window.open(
        authUrl,
        'appwrite-oauth',
        'width=500,height=600,top=100,left=100'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups and try again.'));
        return;
      }

      // Monitor popup for completion
      const checkInterval = setInterval(async () => {
        try {
          // Check if popup is closed
          if (popup.closed) {
            clearInterval(checkInterval);
            
            // Check if we now have a session
            try {
              const user = await this.getUser();
              if (user) {
                resolve(user);
              } else {
                reject(new Error('Authentication cancelled'));
              }
            } catch (error) {
              reject(new Error('Authentication failed'));
            }
          }

          // Check for success message from popup
          if (popup.location && popup.location.href) {
            const url = popup.location.href;
            if (url.includes('/auth/callback') || url.includes('success')) {
              clearInterval(checkInterval);
              
              if (this.config.autoClose) {
                popup.close();
              }
              
              // Get authenticated user
              const user = await this.getUser();
              resolve(user);
            } else if (url.includes('/auth/error') || url.includes('failure')) {
              clearInterval(checkInterval);
              popup.close();
              reject(new Error('Authentication failed'));
            }
          }
        } catch (e) {
          // Cross-origin error is expected, ignore it
        }
      }, 500);

      // Timeout after specified duration
      setTimeout(() => {
        clearInterval(checkInterval);
        if (popup && !popup.closed) {
          popup.close();
        }
        reject(new Error('Authentication timeout'));
      }, this.config.timeout);
    });
  }

  /**
   * Generate OAuth URL for manual handling
   */
  getOAuthUrl(provider, options = {}) {
    const successUrl = options.successUrl || this.config.redirectUrl;
    const failureUrl = options.failureUrl || this.config.errorUrl;
    
    const params = new URLSearchParams({
      project: this.config.projectId,
      success: successUrl,
      failure: failureUrl,
      scopes: (options.scopes || []).join(',')
    });

    return `${this.config.endpoint}/account/sessions/oauth2/${provider.toLowerCase()}?${params}`;
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await this.account.deleteSession('current');
      
      // Clear any stored redirect
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('appwrite_sso_redirect');
      }
      
      return { success: true };
    } catch (error) {
      console.error('[EasySSO] Sign out error:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getUser() {
    try {
      const user = await this.account.get();
      return {
        id: user.$id,
        email: user.email,
        name: user.name,
        avatar: user.prefs?.avatar,
        verified: user.emailVerification,
        provider: user.prefs?.provider || 'unknown',
        createdAt: user.$createdAt,
        updatedAt: user.$updatedAt
      };
    } catch (error) {
      if (error.code === 401) {
        return null; // Not authenticated
      }
      throw this.formatError(error);
    }
  }

  /**
   * Check authentication status
   */
  async isAuthenticated() {
    const user = await this.getUser();
    return user !== null;
  }

  /**
   * Handle OAuth callback (for redirect flow)
   */
  async handleCallback() {
    try {
      // Check if we have a valid session
      const user = await this.getUser();
      
      if (user) {
        // Restore original location if available
        if (typeof sessionStorage !== 'undefined') {
          const redirect = sessionStorage.getItem('appwrite_sso_redirect');
          if (redirect) {
            sessionStorage.removeItem('appwrite_sso_redirect');
            window.location.href = redirect;
            return;
          }
        }
        
        // Default redirect to home
        window.location.href = '/';
      } else {
        throw new Error('No valid session after OAuth callback');
      }
    } catch (error) {
      console.error('[EasySSO] Callback error:', error);
      window.location.href = '/login?error=auth_failed';
    }
  }

  /**
   * Listen for authentication state changes
   */
  onAuthChange(callback) {
    // Poll for auth changes (Appwrite doesn't have built-in auth state listener)
    let lastUser = null;
    
    const checkAuth = async () => {
      try {
        const user = await this.getUser();
        const userJson = JSON.stringify(user);
        const lastUserJson = JSON.stringify(lastUser);
        
        if (userJson !== lastUserJson) {
          lastUser = user;
          callback(user);
        }
      } catch (error) {
        if (lastUser !== null) {
          lastUser = null;
          callback(null);
        }
      }
    };

    // Initial check
    checkAuth();
    
    // Poll every 5 seconds
    const interval = setInterval(checkAuth, 5000);
    
    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Check if running on mobile device
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Format error for consistent error handling
   */
  formatError(error) {
    return {
      message: error.message || 'An error occurred',
      code: error.code || 'unknown',
      type: error.type || 'unknown'
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EasyAppwriteSSO;
} else {
  window.EasyAppwriteSSO = EasyAppwriteSSO;
}

export default EasyAppwriteSSO;