/**
 * Appwrite Authentication Service
 * Complete migration from legacy database to Appwrite
 * Handles OAuth, email auth, and user management
 */

import { account, databases, DATABASE_ID, COLLECTIONS, handleAppwriteError, Query, ID } from '../lib/appwrite';
import { OAuthProvider } from 'appwrite';
// Import smart database wrapper to handle schema issues
import { smartDatabases } from '../utils/fixDatabaseSchema';
// Import session conflict resolver
import sessionConflictResolver from '../utils/sessionConflictResolver';

class AppwriteAuthService {
  constructor() {
    this.account = account;
    // Use smart wrapper to handle field mapping issues
    this.databases = smartDatabases;
  }

  // Get current authenticated user
  async getCurrentUser() {
    try {
      const user = await this.account.get();
      return {
        success: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
          avatar: user.prefs?.avatar || null,
          isAuthenticated: true,
          provider: user.prefs?.provider || 'email'
        }
      };
    } catch (error) {
      console.log('getCurrentUser error:', error);
      if (error.code === 401) {
        return { success: false, user: null };
      }
      throw error;
    }
  }

  // Get current session
  async getCurrentSession() {
    try {
      const session = await this.account.getSession('current');
      return { success: true, session };
    } catch (error) {
      if (error.code === 401) {
        return { success: false, session: null };
      }
      throw error;
    }
  }

  // Create OAuth session with Google
  async createGoogleOAuthSession() {
    try {
      const successUrl = `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/auth/error`;
      
      console.log('🔄 Starting Google OAuth with URLs:', { successUrl, failureUrl });
      
      // Redirect to Google OAuth
      this.account.createOAuth2Session(
        OAuthProvider.Google,
        successUrl,
        failureUrl
      );
      
      return { success: true };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback(userId, secret, provider = 'google') {
    try {
      console.log('🔐 Handling OAuth callback with Appwrite session creation');
      
      // Create session from OAuth callback using conflict resolver
      const sessionResult = await sessionConflictResolver.createOAuthSession(userId, secret);
      if (!sessionResult.success) {
        throw new Error('Failed to create OAuth session');
      }
      const session = sessionResult.session;
      console.log('✅ OAuth session created:', session.provider);

      // Get user details
      const user = await this.account.get();
      console.log('✅ User authenticated:', user.email);

      // Create or update user profile
      await this.createOrUpdateUserProfile(user, provider);

      return {
        success: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
          avatar: user.prefs?.avatar || null,
          provider: provider,
          isAuthenticated: true
        },
        session
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Create or update user profile in database
  async createOrUpdateUserProfile(user, provider = 'email') {
    try {
      console.log('👤 Managing user profile in Appwrite database...');
      
      // Check if profile exists
      let existingProfile = null;
      try {
        // For users collection, search by document ID directly
        existingProfile = await this.databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          user.$id
        );
        console.log('📋 Found existing user profile by document ID');
      } catch (error) {
        if (error.code === 404) {
          console.log('🔍 No existing profile found, will create new profile');
        } else {
          console.log('🔍 Profile search failed, will try to create new profile');
        }
      }

      const profileData = {
        // Schema fields: email, username, fullName, profileImage, location, isVerified, createdAt, updatedAt
        email: user.email,
        fullName: user.name || user.email.split('@')[0],
        username: existingProfile?.username || user.email.split('@')[0].toLowerCase(),
        profileImage: user.prefs?.avatar || null,
        location: existingProfile?.location || '',
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: user.emailVerification || false
      };

      if (existingProfile) {
        // Update existing profile
        const updatedProfile = await this.databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          existingProfile.$id,
          profileData
        );
        console.log('✅ Updated user profile');
        return updatedProfile;
      } else {
        // Create new profile with user ID as document ID
        const newProfile = await this.databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          user.$id, // Use user ID as document ID for easier lookups
          profileData
        );
        console.log('✅ Created new user profile');
        return newProfile;
      }
    } catch (error) {
      console.error('⚠️ Error managing user profile:', error);
      // Don't throw - authentication can succeed without profile
      return null;
    }
  }

  // Email and password authentication
  async signInWithEmail(email, password) {
    try {
      const sessionResult = await sessionConflictResolver.createEmailSession(email, password);
      if (!sessionResult.success) {
        throw new Error('Failed to create email session');
      }
      const session = sessionResult.session;
      const user = await this.account.get();
      
      await this.createOrUpdateUserProfile(user, 'email');
      
      return {
        success: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
          avatar: user.prefs?.avatar || null,
          provider: 'email',
          isAuthenticated: true
        },
        session
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email, password, name) {
    try {
      const user = await this.account.create(ID.unique(), email, password, name);
      
      // Create email session using conflict resolver
      const sessionResult = await sessionConflictResolver.createEmailSession(email, password);
      if (!sessionResult.success) {
        throw new Error('Failed to create email session');
      }
      const session = sessionResult.session;
      
      // Create user profile
      await this.createOrUpdateUserProfile(user, 'email');
      
      return {
        success: true,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
          avatar: null,
          provider: 'email',
          isAuthenticated: true
        },
        session
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.account.deleteSession('current');
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Delete all sessions (sign out from all devices)
  async signOutFromAllDevices() {
    try {
      await this.account.deleteSessions();
      console.log('✅ Signed out from all devices');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Get user profile from database
  async getUserProfile(userId = null) {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser.success) {
          return { success: false, error: 'Not authenticated' };
        }
        targetUserId = currentUser.user.id;
      }
      
      // Try to get profile by document ID first (most efficient)
      try {
        const profile = await this.databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          targetUserId
        );
        
        return {
          success: true,
          profile
        };
      } catch (error) {
        if (error.code !== 404) {
          throw error;
        }
        
        // If not found by ID, this means the profile genuinely doesn't exist
        // Users collection uses document $id, not a separate user_id field
        console.warn('Profile not found for user ID:', targetUserId);
        
        return { success: false, error: 'Profile not found' };
      }
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser.success) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const userProfile = await this.getUserProfile();
      if (!userProfile.success) {
        return { success: false, error: 'Profile not found' };
      }
      
      const updatedProfile = await this.databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        userProfile.profile.$id,
        {
          ...profileData,
          updated_at: new Date().toISOString()
        }
      );
      
      return {
        success: true,
        profile: updatedProfile
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Send password recovery email
  async sendPasswordRecovery(email) {
    try {
      const recoveryUrl = `${window.location.origin}/reset-password`;
      await this.account.createRecovery(email, recoveryUrl);
      
      return {
        success: true,
        message: 'Password recovery email sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Complete password recovery
  async completePasswordRecovery(userId, secret, password) {
    try {
      await this.account.updateRecovery(userId, secret, password, password);
      
      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Send email verification
  async sendEmailVerification() {
    try {
      const verificationUrl = `${window.location.origin}/verify-email`;
      await this.account.createVerification(verificationUrl);
      
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Verify email
  async verifyEmail(userId, secret) {
    try {
      await this.account.updateVerification(userId, secret);
      
      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }
}

// Export singleton instance
export default new AppwriteAuthService();