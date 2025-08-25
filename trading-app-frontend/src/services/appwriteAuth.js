/**
 * Appwrite Authentication Service
 * Handles user authentication, registration, and session management
 */

import { account, databases, DATABASE_ID, COLLECTIONS, handleAppwriteError, ID } from '../lib/appwrite';
import createDebugger from '../utils/debugLogger.js';

const debug = createDebugger('trading-post:auth');

class AppwriteAuthService {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
  }

  // User Registration with additional data
  async register(email, password, name, additionalData = {}) {
    debug.info('Registering new user', { email, name, hasAdditionalData: !!additionalData });
    try {
      
      // Create user account
      const user = await account.create(ID.unique(), email, password, name);
      debug.success('User account created', { userId: user.$id });
      
      // Create user profile in database with additional data
      const profileData = {
        name: name,
        email: email,
        username: additionalData.username || email.split('@')[0], // Use provided username or generate from email
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: false,
        is_active: true,
        opt_in_ai: true,
        preferences: {},
        ratings: {
          average: 0,
          count: 0
        }
      };

      // Add additional fields if provided
      if (additionalData.zipcode) {
        profileData.zipcode = additionalData.zipcode;
      }
      if (additionalData.optInLocation !== undefined) {
        profileData.opt_in_location = additionalData.optInLocation;
      }
      if (additionalData.latitude) {
        profileData.latitude = additionalData.latitude;
      }
      if (additionalData.longitude) {
        profileData.longitude = additionalData.longitude;
      }

      const profile = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        user.$id,
        profileData
      );
      
      debug.success('User profile created in database', { userId: user.$id });
      
      return {
        user,
        profile,
        success: true
      };
      
    } catch (error) {
      debug.error('Registration failed', { email, error: error.message, code: error.code });
      const errorMessage = handleAppwriteError(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // User Login
  async login(email, password) {
    debug.info('User login attempt', { email });
    try {
      
      // Create email session
      const session = await account.createEmailPasswordSession(email, password);
      debug.success('Session created', { sessionId: session.$id });
      
      // Get user details
      const user = await account.get();
      debug.debug('User details retrieved', { userId: user.$id });
      
      // Get user profile from database
      let profile;
      try {
        profile = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          user.$id
        );
      } catch (profileError) {
        // Profile doesn't exist, create it
        debug.warn('Profile missing for authenticated user, creating', { userId: user.$id });
        profile = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          user.$id,
          {
            name: user.name || '',
            email: user.email,
            username: user.email?.split('@')[0] || '',
            created_at: user.$createdAt,
            updated_at: new Date().toISOString(),
            email_verified: user.emailVerification,
            is_active: true,
            opt_in_ai: true,
            preferences: user.prefs || {},
            ratings: {
              average: 0,
              count: 0
            }
          }
        );
      }
      
      // Store current user and session
      this.currentUser = user;
      this.currentSession = session;
      
      // Store in localStorage for persistence
      localStorage.setItem('appwrite_user', JSON.stringify(user));
      localStorage.setItem('appwrite_session', JSON.stringify(session));
      
      debug.success('Login successful', { userId: user.$id });
      
      return {
        user,
        profile,
        session,
        success: true
      };
      
    } catch (error) {
      debug.error('Login failed', { email, error: error.message, code: error.code });
      const errorMessage = handleAppwriteError(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // User Logout
  async logout() {
    debug.info('Logging out user');
    try {
      
      // Delete current session
      await account.deleteSession('current');
      
      // Clear stored data
      this.currentUser = null;
      this.currentSession = null;
      localStorage.removeItem('appwrite_user');
      localStorage.removeItem('appwrite_session');
      
      debug.success('Logout successful');
      
      return { success: true };
      
    } catch (error) {
      debug.error('Logout failed', { error: error.message });
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Get Current User
  async getCurrentUser() {
    try {
      // Try to get from cache first
      if (this.currentUser) {
        return {
          user: this.currentUser,
          success: true
        };
      }
      
      // Check localStorage
      const storedUser = localStorage.getItem('appwrite_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
      
      // Get fresh user data from Appwrite
      const user = await account.get();
      this.currentUser = user;
      
      // Update localStorage
      localStorage.setItem('appwrite_user', JSON.stringify(user));
      
      return {
        user,
        success: true
      };
      
    } catch (error) {
      // Clear invalid stored data
      this.currentUser = null;
      localStorage.removeItem('appwrite_user');
      localStorage.removeItem('appwrite_session');
      
      if (error.code === 401) {
        return {
          user: null,
          success: true
        };
      }
      
      debug.error('Get current user failed', { error: error.message, code: error.code });
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Get User Profile
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.$id;
      
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }
      
      try {
        const profile = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          targetUserId
        );
        
        return {
          profile,
          success: true
        };
      } catch (profileError) {
        // Profile doesn't exist - check if this is for current user and create it
        if (profileError.code === 404 && targetUserId === this.currentUser?.$id) {
          debug.info('Creating missing profile for OAuth user', { userId: targetUserId });
          
          // Get fresh user data from Appwrite account
          const currentUser = await account.get();
          
          // Create profile for OAuth user
          const newProfile = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            targetUserId,
            {
              name: currentUser.name || 'User',
              email: currentUser.email || '',
              username: currentUser.email?.split('@')[0] || `user_${targetUserId.slice(-8)}`,
              created_at: currentUser.$createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_verified: currentUser.emailVerification || false,
              is_active: true,
              opt_in_ai: true,
              preferences: currentUser.prefs || {},
              ratings: {
                average: 0,
                count: 0
              },
              // Set default location for OAuth users if available from prefs
              latitude: currentUser.prefs?.latitude || null,
              longitude: currentUser.prefs?.longitude || null
            }
          );
          
          debug.success('Created missing profile for OAuth user', { userId: targetUserId });
          
          return {
            profile: newProfile,
            success: true
          };
        } else if (profileError.code === 404) {
          // Profile doesn't exist for another user - return a default structure
          debug.warn('Profile not found, returning default structure', { userId: targetUserId });
          
          return {
            profile: {
              $id: targetUserId,
              name: 'Unknown User',
              email: '',
              username: `user_${targetUserId.slice(-8)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_verified: false,
              is_active: true,
              opt_in_ai: false,
              preferences: {},
              ratings: {
                average: 0,
                count: 0
              },
              latitude: null,
              longitude: null
            },
            success: true,
            isDefault: true
          };
        } else {
          // Other error, re-throw
          throw profileError;
        }
      }
      
    } catch (error) {
      debug.error('Get user profile failed', { userId, error: error.message });
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Update User Profile
  async updateProfile(data) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      debug.info('Updating user profile', { userId: this.currentUser.$id, fields: Object.keys(data) });
      
      // Update profile in database
      const updatedProfile = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        this.currentUser.$id,
        {
          ...data,
          updated_at: new Date().toISOString()
        }
      );
      
      debug.success('Profile updated successfully', { userId: this.currentUser.$id });
      
      return {
        profile: updatedProfile,
        success: true
      };
      
    } catch (error) {
      debug.error('Update profile failed', { error: error.message });
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Update Password
  async updatePassword(oldPassword, newPassword) {
    try {
      console.log('🔐 Updating password...');
      
      await account.updatePassword(newPassword, oldPassword);
      
      console.log('✅ Password updated successfully');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Update password failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Update Email
  async updateEmail(newEmail, password) {
    try {
      console.log('📧 Updating email...');
      
      await account.updateEmail(newEmail, password);
      
      console.log('✅ Email updated successfully');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Update email failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Request Password Reset
  async requestPasswordReset(email) {
    try {
      console.log('🔐 Requesting password reset for:', email);
      
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      );
      
      console.log('✅ Password reset email sent');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Complete Password Reset
  async completePasswordReset(userId, secret, newPassword) {
    try {
      console.log('🔐 Completing password reset...');
      
      await account.updateRecovery(userId, secret, newPassword);
      
      console.log('✅ Password reset completed');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Password reset completion failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Verify Email
  async verifyEmail(userId, secret) {
    try {
      console.log('📧 Verifying email...');
      
      await account.updateVerification(userId, secret);
      
      // Update profile to mark email as verified
      if (this.currentUser && this.currentUser.$id === userId) {
        await this.updateProfile({ email_verified: true });
      }
      
      console.log('✅ Email verified successfully');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Request Email Verification
  async requestEmailVerification() {
    try {
      console.log('📧 Requesting email verification...');
      
      await account.createVerification(`${window.location.origin}/verify-email`);
      
      console.log('✅ Verification email sent');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Email verification request failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Get Sessions
  async getSessions() {
    try {
      const sessions = await account.listSessions();
      
      return {
        sessions: sessions.sessions,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get sessions failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Delete Session
  async deleteSession(sessionId) {
    try {
      await account.deleteSession(sessionId);
      
      // If deleting current session, clear local data
      if (sessionId === 'current' || sessionId === this.currentSession?.$id) {
        this.currentUser = null;
        this.currentSession = null;
        localStorage.removeItem('appwrite_user');
        localStorage.removeItem('appwrite_session');
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Delete session failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Check Authentication Status
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get User ID
  getUserId() {
    return this.currentUser?.$id || null;
  }

  // Initialize from stored session
  async initializeFromStorage() {
    try {
      const storedUser = localStorage.getItem('appwrite_user');
      const storedSession = localStorage.getItem('appwrite_session');
      
      if (storedUser && storedSession) {
        this.currentUser = JSON.parse(storedUser);
        this.currentSession = JSON.parse(storedSession);
        
        // Verify session is still valid
        const result = await this.getCurrentUser();
        return result.success;
      }
      
      return false;
      
    } catch (error) {
      debug.error('Initialize from storage failed', { error: error.message });
      // Clear invalid stored data
      this.currentUser = null;
      this.currentSession = null;
      localStorage.removeItem('appwrite_user');
      localStorage.removeItem('appwrite_session');
      return false;
    }
  }
}

// Create and export singleton instance
const appwriteAuth = new AppwriteAuthService();

export default appwriteAuth;