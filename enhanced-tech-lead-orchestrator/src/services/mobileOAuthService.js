/**
 * Mobile-Safe OAuth Service for Enhanced Tech Lead Orchestrator
 * Fixes "undefined is not an object (evaluating 't.createOAuth2Session')" error
 * Provides independent Appwrite client initialization for mobile browsers
 */

import { Client, Account, OAuthProvider } from 'appwrite';

export class MobileOAuthService {
  constructor() {
    this.endpoint = 'https://nyc.cloud.appwrite.io/v1';
    this.projectId = '68a4e3da0022f3e129d0';
    this.account = null;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize mobile-safe Appwrite client
   * Creates independent Client and Account instances to avoid minification issues
   */
  initializeMobileSafeAccount() {
    try {
      // Create independent Client instance for mobile
      this.client = new Client()
        .setEndpoint(this.endpoint)
        .setProject(this.projectId);

      // Create independent Account instance
      this.account = new Account(this.client);
      this.initialized = true;
      
      console.log('✅ Mobile-safe OAuth account initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize mobile-safe account:', error);
      return false;
    }
  }

  /**
   * Safe Google OAuth initiation with validation
   * @param {string} successUrl - OAuth success redirect URL
   * @param {string} failureUrl - OAuth failure redirect URL
   * @returns {Promise<string>} OAuth URL for redirection
   */
  async initiateGoogleOAuth(successUrl, failureUrl) {
    try {
      // Ensure account is properly initialized
      if (!this.account || typeof this.account.createOAuth2Session !== 'function') {
        console.log('🔄 Re-initializing account due to undefined createOAuth2Session');
        this.initializeMobileSafeAccount();
      }

      // Double-check initialization
      if (!this.account) {
        throw new Error('Failed to initialize Appwrite Account');
      }

      // Validate createOAuth2Session method exists
      if (typeof this.account.createOAuth2Session !== 'function') {
        throw new Error('createOAuth2Session method not available');
      }

      console.log('🚀 Initiating Google OAuth with mobile-safe client');
      
      // Create OAuth2 session with Google
      const oauthUrl = await this.account.createOAuth2Session(
        OAuthProvider.Google,
        successUrl,
        failureUrl,
        ['email', 'profile']
      );

      console.log('✅ Google OAuth URL generated successfully');
      return oauthUrl;

    } catch (error) {
      console.error('❌ Google OAuth initiation failed:', error);
      
      // Fallback: Try re-initialization once more
      if (!this.initialized) {
        console.log('🔄 Attempting emergency re-initialization...');
        if (this.initializeMobileSafeAccount()) {
          try {
            const oauthUrl = await this.account.createOAuth2Session(
              OAuthProvider.Google,
              successUrl,
              failureUrl,
              ['email', 'profile']
            );
            return oauthUrl;
          } catch (retryError) {
            console.error('❌ Retry also failed:', retryError);
          }
        }
      }
      
      throw error;
    }
  }

  /**
   * Initialize GitHub OAuth (for future use)
   */
  async initiateGitHubOAuth(successUrl, failureUrl) {
    try {
      if (!this.account || typeof this.account.createOAuth2Session !== 'function') {
        this.initializeMobileSafeAccount();
      }

      const oauthUrl = await this.account.createOAuth2Session(
        OAuthProvider.Github,
        successUrl,
        failureUrl,
        ['user:email', 'read:user']
      );

      return oauthUrl;
    } catch (error) {
      console.error('❌ GitHub OAuth initiation failed:', error);
      throw error;
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      if (!this.account) {
        this.initializeMobileSafeAccount();
      }

      return await this.account.getSession('current');
    } catch (error) {
      console.log('No active session:', error.message);
      return null;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    try {
      if (!this.account) {
        this.initializeMobileSafeAccount();
      }

      return await this.account.get();
    } catch (error) {
      console.log('No authenticated user:', error.message);
      return null;
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      if (!this.account) {
        this.initializeMobileSafeAccount();
      }

      await this.account.deleteSessions();
      console.log('✅ User logged out successfully');
      return true;
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const session = await this.getCurrentSession();
      return session !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const mobileOAuthService = new MobileOAuthService();

// Auto-initialize on import
mobileOAuthService.initializeMobileSafeAccount();