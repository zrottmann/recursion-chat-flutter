/**
 * Appwrite Service Layer
 * Comprehensive service for Appwrite authentication and SSO
 */

import { Client, Account, Databases, Storage, Teams, Functions, ID, Query } from 'appwrite';
import config, { getEnabledProviders, buildOAuthRedirectUrl } from '../config/appwriteConfig';
import createDebugger from '../utils/debugLogger.js';

const debug = createDebugger('trading-post:appwrite');

class AppwriteService {
  constructor() {
    this.client = new Client();
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.teams = new Teams(this.client);
    this.functions = new Functions(this.client);
    
    // Initialize client
    this.client
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId);
    
    // Session management
    this.currentUser = null;
    this.sessionToken = null;
    this.refreshTimer = null;
    
    // Initialize session from storage
    this.initializeSession();
  }

  /**
   * Initialize session from local storage
   */
  async initializeSession() {
    debug.info('Initializing session from storage');
    try {
      const storedSession = localStorage.getItem('appwrite_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        debug.debug('Found stored session', { hasToken: !!sessionData.token });
        if (this.isSessionValid(sessionData)) {
          this.sessionToken = sessionData.token;
          this.currentUser = await this.getCurrentUser();
          this.startSessionRefreshTimer();
          debug.success('Session initialized', { userId: this.currentUser?.$id });
        } else {
          debug.warn('Stored session invalid, clearing');
          this.clearSession();
        }
      } else {
        debug.debug('No stored session found');
      }
    } catch (error) {
      debug.error('Failed to initialize session:', error);
      this.clearSession();
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(sessionData) {
    if (!sessionData || !sessionData.expiry) return false;
    return new Date(sessionData.expiry) > new Date();
  }

  /**
   * Start session refresh timer
   */
  startSessionRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Check session every minute
    this.refreshTimer = setInterval(async () => {
      try {
        const session = await this.account.getSession('current');
        if (session) {
          const timeUntilExpiry = new Date(session.expire) - new Date();
          if (timeUntilExpiry < config.session.refreshThreshold * 1000) {
            await this.refreshSession();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        this.clearSession();
      }
    }, 60000); // Check every minute
  }

  /**
   * Refresh current session
   */
  async refreshSession() {
    try {
      const session = await this.account.updateSession('current');
      this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      throw error;
    }
  }

  /**
   * Save session to local storage
   */
  saveSession(session) {
    const sessionData = {
      token: session.$id,
      userId: session.userId,
      expiry: session.expire,
      provider: session.provider,
    };
    localStorage.setItem('appwrite_session', JSON.stringify(sessionData));
    this.sessionToken = session.$id;
  }

  /**
   * Clear session from storage
   */
  clearSession() {
    localStorage.removeItem('appwrite_session');
    localStorage.removeItem('appwrite_user');
    this.currentUser = null;
    this.sessionToken = null;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Create account with email and password
   */
  async createAccount(email, password, name) {
    try {
      // Create account
      const account = await this.account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      // Auto-login after registration
      const session = await this.createEmailSession(email, password);
      
      // Create user profile in database
      await this.createUserProfile(account);
      
      return { account, session };
    } catch (error) {
      console.error('Account creation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create user profile in database
   */
  async createUserProfile(user) {
    try {
      const profile = await this.databases.createDocument(
        config.database.databaseId,
        config.database.collections.users,
        user.$id,
        {
          userId: user.$id,
          email: user.email,
          name: user.name,
          avatar: user.prefs?.avatar || '',
          bio: '',
          location: '',
          joinedAt: new Date().toISOString(),
          rating: 0,
          totalTrades: 0,
          verifiedSeller: false,
          preferences: {
            notifications: true,
            newsletter: true,
            publicProfile: true,
          },
        }
      );
      return profile;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      // Don't throw - profile can be created later
    }
  }

  /**
   * Login with email and password
   */
  async createEmailSession(email, password) {
    console.log('📧 [EMAIL-SESSION] Creating email session for:', email);
    
    try {
      // Check for existing session first
      console.log('🔍 [EMAIL-SESSION] Checking for existing session...');
      try {
        const currentSession = await this.account.getSession('current');
        if (currentSession) {
          console.log('⚠️ [EMAIL-SESSION] Active session detected:', currentSession.$id);
          console.log('⚠️ [EMAIL-SESSION] Session user:', currentSession.userId);
          console.log('🗑️ [EMAIL-SESSION] Deleting active session...');
          await this.account.deleteSession('current');
          console.log('✅ [EMAIL-SESSION] Previous session deleted');
        }
      } catch (e) {
        console.log('✅ [EMAIL-SESSION] No active session found, proceeding');
      }
      
      console.log('🔐 [EMAIL-SESSION] Creating new email session...');
      const session = await this.account.createEmailSession(email, password);
      console.log('✅ [EMAIL-SESSION] Session created:', session.$id);
      
      this.saveSession(session);
      console.log('💾 [EMAIL-SESSION] Session saved to localStorage');
      
      this.currentUser = await this.getCurrentUser();
      console.log('👤 [EMAIL-SESSION] Current user loaded:', this.currentUser?.$id);
      
      this.startSessionRefreshTimer();
      console.log('⏰ [EMAIL-SESSION] Session refresh timer started');
      
      return session;
    } catch (error) {
      console.error('❌ [EMAIL-SESSION] Email login failed:', error);
      console.error('❌ [EMAIL-SESSION] Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      });
      throw this.handleError(error);
    }
  }

  /**
   * Create OAuth2 session
   */
  async createOAuth2Session(provider, successUrl, failureUrl) {
    console.log('🔐 [OAUTH-SERVICE] createOAuth2Session called');
    console.log('🔐 [OAUTH-SERVICE] Provider:', provider);
    console.log('🔐 [OAUTH-SERVICE] Success URL param:', successUrl);
    console.log('🔐 [OAUTH-SERVICE] Failure URL param:', failureUrl);
    console.log('🔐 [OAUTH-SERVICE] Window origin:', window.location.origin);
    
    try {
      // Check for active session first
      console.log('🔍 [OAUTH-SERVICE] Checking for existing session...');
      try {
        const currentSession = await this.account.getSession('current');
        if (currentSession) {
          console.log('⚠️ [OAUTH-SERVICE] Active session found:', currentSession.$id);
          console.log('🗑️ [OAUTH-SERVICE] Deleting active session before OAuth...');
          await this.account.deleteSession('current');
          console.log('✅ [OAUTH-SERVICE] Active session deleted');
        }
      } catch (e) {
        console.log('✅ [OAUTH-SERVICE] No active session found, proceeding with OAuth');
      }
      
      // Use root URL for callback to avoid blank page issues
      const success = successUrl || `${window.location.origin}/`;
      const failure = failureUrl || `${window.location.origin}/auth/error`;
      
      console.log('🎯 [OAUTH-SERVICE] Final OAuth URLs:');
      console.log('   Success:', success);
      console.log('   Failure:', failure);
      console.log('   Provider:', provider);
      
      console.log('🚀 [OAUTH-SERVICE] Calling Appwrite createOAuth2Session...');
      
      // Create OAuth2 session with proper redirect URLs
      await this.account.createOAuth2Session(
        provider,
        success,
        failure
      );
      
      console.log('✅ [OAUTH-SERVICE] OAuth2 session creation initiated - redirecting to provider...');
      // User will be redirected to OAuth provider, then back to our app
    } catch (error) {
      console.error(`❌ [OAUTH-SERVICE] OAuth2 session creation failed for ${provider}:`, error);
      console.error('❌ [OAUTH-SERVICE] Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      throw this.handleError(error);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(userId = null, secret = null, provider = null) {
    try {
      console.log('🔐 Handling OAuth callback:', { userId: !!userId, secret: !!secret, provider });
      
      // After OAuth redirect, session should already exist
      // Just get the current session and user
      const session = await this.getCurrentSession();
      if (!session) {
        throw new Error('No active session found after OAuth callback');
      }
      
      this.saveSession(session);
      
      // Get user details
      this.currentUser = await this.getCurrentUser();
      if (!this.currentUser) {
        throw new Error('Failed to get user details after OAuth');
      }
      
      console.log('✅ OAuth user retrieved:', { id: this.currentUser.$id, email: this.currentUser.email });
      
      // Check if user profile exists, create if not
      await this.ensureUserProfile();
      
      this.startSessionRefreshTimer();
      
      return {
        success: true,
        session,
        user: this.currentUser,
      };
    } catch (error) {
      console.error('❌ OAuth callback handling failed:', error);
      this.clearSession(); // Clear any partial session
      return {
        success: false,
        error: this.handleError(error).message || 'OAuth authentication failed'
      };
    }
  }

  /**
   * Ensure user profile exists in database
   */
  async ensureUserProfile() {
    if (!this.currentUser) return;
    
    try {
      // Import userProfileService dynamically to avoid circular dependencies
      const { default: userProfileService } = await import('./userProfileService');
      
      // Use getOrCreateProfile to handle both cases
      const profile = await userProfileService.getOrCreateProfile(this.currentUser);
      console.log('✅ User profile ensured:', profile.$id);
      return profile;
    } catch (error) {
      console.error('Failed to ensure user profile:', error);
      // Don't throw - profile can be created later
    }
  }

  /**
   * Create magic URL session (passwordless login)
   */
  async createMagicURLSession(email, url) {
    try {
      const token = await this.account.createMagicURLSession(
        ID.unique(),
        email,
        url || `${window.location.origin}/auth/magic-link`
      );
      return token;
    } catch (error) {
      console.error('Magic URL creation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update magic URL session
   */
  async updateMagicURLSession(userId, secret) {
    try {
      const session = await this.account.updateMagicURLSession(userId, secret);
      this.saveSession(session);
      this.currentUser = await this.getCurrentUser();
      await this.ensureUserProfile();
      this.startSessionRefreshTimer();
      return session;
    } catch (error) {
      console.error('Magic URL session update failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create phone session
   */
  async createPhoneSession(phone) {
    try {
      const token = await this.account.createPhoneSession(ID.unique(), phone);
      return token;
    } catch (error) {
      console.error('Phone session creation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update phone session
   */
  async updatePhoneSession(userId, secret) {
    try {
      const session = await this.account.updatePhoneSession(userId, secret);
      this.saveSession(session);
      this.currentUser = await this.getCurrentUser();
      await this.ensureUserProfile();
      this.startSessionRefreshTimer();
      return session;
    } catch (error) {
      console.error('Phone session update failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create anonymous session
   */
  async createAnonymousSession() {
    try {
      const session = await this.account.createAnonymousSession();
      this.saveSession(session);
      this.currentUser = await this.getCurrentUser();
      this.startSessionRefreshTimer();
      return session;
    } catch (error) {
      console.error('Anonymous session creation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const user = await this.account.get();
      if (user) {
        localStorage.setItem('appwrite_user', JSON.stringify(user));
        this.currentUser = user;
      }
      return user;
    } catch (error) {
      if (error.code === 401 || error.code === 404) {
        // No authenticated user
        this.clearSession();
        return null;
      }
      console.error('Error getting current user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    try {
      const session = await this.account.getSession('current');
      return session;
    } catch (error) {
      if (error.code === 401 || error.code === 404) {
        // No active session
        return null;
      }
      console.error('Error getting current session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * List all sessions
   */
  async listSessions() {
    try {
      const sessions = await this.account.listSessions();
      return sessions.sessions;
    } catch (error) {
      console.error('Failed to list sessions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Logout current session
   */
  async logout() {
    try {
      await this.account.deleteSession('current');
      this.clearSession();
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      this.clearSession(); // Clear local session anyway
      return true;
    }
  }

  /**
   * Logout from all sessions
   */
  async logoutAll() {
    try {
      await this.account.deleteSessions();
      this.clearSession();
      return true;
    } catch (error) {
      console.error('Logout all failed:', error);
      this.clearSession();
      return true;
    }
  }

  /**
   * Delete specific session
   */
  async deleteSession(sessionId) {
    try {
      await this.account.deleteSession(sessionId);
      if (sessionId === this.sessionToken) {
        this.clearSession();
      }
      return true;
    } catch (error) {
      console.error('Session deletion failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(prefs) {
    try {
      const user = await this.account.updatePrefs(prefs);
      this.currentUser = user;
      localStorage.setItem('appwrite_user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user name
   */
  async updateName(name) {
    try {
      const user = await this.account.updateName(name);
      this.currentUser = user;
      localStorage.setItem('appwrite_user', JSON.stringify(user));
      
      // Update profile in database
      await this.databases.updateDocument(
        config.database.databaseId,
        config.database.collections.users,
        user.$id,
        { name }
      );
      
      return user;
    } catch (error) {
      console.error('Failed to update name:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user email
   */
  async updateEmail(email, password) {
    try {
      const user = await this.account.updateEmail(email, password);
      this.currentUser = user;
      localStorage.setItem('appwrite_user', JSON.stringify(user));
      
      // Update profile in database
      await this.databases.updateDocument(
        config.database.databaseId,
        config.database.collections.users,
        user.$id,
        { email }
      );
      
      return user;
    } catch (error) {
      console.error('Failed to update email:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user password
   */
  async updatePassword(password, oldPassword) {
    try {
      const user = await this.account.updatePassword(password, oldPassword);
      return user;
    } catch (error) {
      console.error('Failed to update password:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create email verification
   */
  async createVerification(url) {
    try {
      const token = await this.account.createVerification(
        url || `${window.location.origin}/auth/verify`
      );
      return token;
    } catch (error) {
      console.error('Failed to create verification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update email verification
   */
  async updateVerification(userId, secret) {
    try {
      const token = await this.account.updateVerification(userId, secret);
      this.currentUser = await this.getCurrentUser();
      return token;
    } catch (error) {
      console.error('Failed to update verification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create password recovery
   */
  async createRecovery(email, url) {
    try {
      const token = await this.account.createRecovery(
        email,
        url || `${window.location.origin}/auth/reset-password`
      );
      return token;
    } catch (error) {
      console.error('Failed to create recovery:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update password recovery
   */
  async updateRecovery(userId, secret, password, passwordAgain) {
    try {
      const token = await this.account.updateRecovery(
        userId,
        secret,
        password,
        passwordAgain
      );
      return token;
    } catch (error) {
      console.error('Failed to update recovery:', error);
      throw this.handleError(error);
    }
  }

  /**
   * List user identities (OAuth providers)
   */
  async listIdentities() {
    try {
      const identities = await this.account.listIdentities();
      return identities.identities;
    } catch (error) {
      console.error('Failed to list identities:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete identity (unlink OAuth provider)
   */
  async deleteIdentity(identityId) {
    try {
      await this.account.deleteIdentity(identityId);
      return true;
    } catch (error) {
      console.error('Failed to delete identity:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences() {
    try {
      const prefs = await this.account.getPrefs();
      return prefs;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      throw this.handleError(error);
    }
  }

  /**
   * List user logs
   */
  async listLogs(queries = []) {
    try {
      const logs = await this.account.listLogs(queries);
      return logs.logs;
    } catch (error) {
      console.error('Failed to list logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create JWT token
   */
  async createJWT() {
    try {
      const jwt = await this.account.createJWT();
      return jwt.jwt;
    } catch (error) {
      console.error('Failed to create JWT:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle Appwrite errors
   */
  handleError(error) {
    const errorMap = {
      400: 'Bad request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You don\'t have permission for this action.',
      404: 'Resource not found.',
      409: 'A user with this email already exists.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      503: 'Service unavailable. Please try again later.',
    };
    
    const message = errorMap[error.code] || error.message || 'An unexpected error occurred';
    
    return new Error(message);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * Get auth state
   */
  getAuthState() {
    return {
      isAuthenticated: this.isLoggedIn(),
      user: this.currentUser,
      session: this.sessionToken,
    };
  }
}

// Create singleton instance
const appwriteService = new AppwriteService();

// Export service instance
export default appwriteService;

// Export specific functions for convenience
export const {
  createAccount,
  createEmailSession,
  createOAuth2Session,
  handleOAuthCallback,
  createMagicURLSession,
  updateMagicURLSession,
  createPhoneSession,
  updatePhoneSession,
  createAnonymousSession,
  getCurrentUser,
  getCurrentSession,
  listSessions,
  logout,
  logoutAll,
  deleteSession,
  updatePreferences,
  updateName,
  updateEmail,
  updatePassword,
  createVerification,
  updateVerification,
  createRecovery,
  updateRecovery,
  listIdentities,
  deleteIdentity,
  getPreferences,
  listLogs,
  createJWT,
  isLoggedIn,
  getAuthState,
} = appwriteService;