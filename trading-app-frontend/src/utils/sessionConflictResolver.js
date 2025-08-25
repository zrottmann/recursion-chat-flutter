/**
 * Session Conflict Resolver
 * Prevents "Creation of a session is prohibited when a session is active" errors
 * Manages authentication state across multiple services
 */

import { account } from '../lib/appwrite';

class SessionConflictResolver {
  constructor() {
    this.pendingAuth = null;
    this.authInProgress = false;
  }

  // Check if there's an active session
  async hasActiveSession() {
    try {
      await account.getSession('current');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Safely clear any existing session before creating new one
  async clearExistingSession() {
    try {
      console.log('🔄 [SESSION-RESOLVER] Checking for existing sessions...');
      
      // Try to get current session
      const session = await account.getSession('current');
      if (session) {
        console.log('🗑️ [SESSION-RESOLVER] Found active session, clearing...', session.$id);
        await account.deleteSession('current');
        console.log('✅ [SESSION-RESOLVER] Previous session cleared successfully');
      }
    } catch (error) {
      // 401 means no session exists, which is what we want
      if (error.code === 401) {
        console.log('✅ [SESSION-RESOLVER] No existing session to clear');
        return;
      }
      console.warn('⚠️ [SESSION-RESOLVER] Error clearing session:', error.message);
    }
  }

  // Safely create OAuth session
  async createOAuthSession(userId, secret) {
    if (this.authInProgress) {
      console.log('⏳ [SESSION-RESOLVER] Auth already in progress, waiting...');
      return this.pendingAuth;
    }

    this.authInProgress = true;
    this.pendingAuth = this._performOAuthSession(userId, secret);

    try {
      const result = await this.pendingAuth;
      return result;
    } finally {
      this.authInProgress = false;
      this.pendingAuth = null;
    }
  }

  async _performOAuthSession(userId, secret) {
    try {
      console.log('🔐 [SESSION-RESOLVER] Creating OAuth session safely...');
      
      // Clear any existing session first
      await this.clearExistingSession();
      
      // Small delay to ensure session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create new OAuth session
      const session = await account.createSession(userId, secret);
      console.log('✅ [SESSION-RESOLVER] OAuth session created successfully:', session.provider);
      
      return { success: true, session };
    } catch (error) {
      console.error('❌ [SESSION-RESOLVER] OAuth session creation failed:', error);
      
      // Handle specific session conflict errors
      if (error.code === 401 && error.message?.includes('session is prohibited')) {
        console.log('🔄 [SESSION-RESOLVER] Session conflict detected, retrying after cleanup...');
        
        // Force clear all sessions and try again
        try {
          await account.deleteSessions();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const retrySession = await account.createSession(userId, secret);
          console.log('✅ [SESSION-RESOLVER] Retry successful:', retrySession.provider);
          return { success: true, session: retrySession };
        } catch (retryError) {
          console.error('❌ [SESSION-RESOLVER] Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  // Safely create email session
  async createEmailSession(email, password) {
    if (this.authInProgress) {
      console.log('⏳ [SESSION-RESOLVER] Auth already in progress, waiting...');
      return this.pendingAuth;
    }

    this.authInProgress = true;
    this.pendingAuth = this._performEmailSession(email, password);

    try {
      const result = await this.pendingAuth;
      return result;
    } finally {
      this.authInProgress = false;
      this.pendingAuth = null;
    }
  }

  async _performEmailSession(email, password) {
    try {
      console.log('📧 [SESSION-RESOLVER] Creating email session safely...');
      
      // Clear any existing session first
      await this.clearExistingSession();
      
      // Small delay to ensure session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create new email session
      const session = await account.createEmailSession(email, password);
      console.log('✅ [SESSION-RESOLVER] Email session created successfully:', session.$id);
      
      return { success: true, session };
    } catch (error) {
      console.error('❌ [SESSION-RESOLVER] Email session creation failed:', error);
      
      // Handle specific session conflict errors
      if (error.code === 401 && error.message?.includes('session is prohibited')) {
        console.log('🔄 [SESSION-RESOLVER] Session conflict detected, retrying after cleanup...');
        
        // Force clear all sessions and try again
        try {
          await account.deleteSessions();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const retrySession = await account.createEmailSession(email, password);
          console.log('✅ [SESSION-RESOLVER] Retry successful:', retrySession.$id);
          return { success: true, session: retrySession };
        } catch (retryError) {
          console.error('❌ [SESSION-RESOLVER] Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  // Safely sign out
  async signOut() {
    try {
      console.log('👋 [SESSION-RESOLVER] Signing out safely...');
      await account.deleteSession('current');
      console.log('✅ [SESSION-RESOLVER] Sign out successful');
      return true;
    } catch (error) {
      if (error.code === 401) {
        console.log('ℹ️ [SESSION-RESOLVER] No session to sign out from');
        return true;
      }
      console.error('❌ [SESSION-RESOLVER] Sign out error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SessionConflictResolver();