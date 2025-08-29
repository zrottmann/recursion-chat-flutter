/**
 * User Profile Service
 * Handles automatic profile creation and management
 */

import { databases, ID, Query } from '../lib/appwrite';
import config from '../config/appwriteConfig';
import createDebugger from '../utils/debugLogger.js';
// Import smart database wrapper to handle schema issues
import { smartDatabases } from '../utils/fixDatabaseSchema';

const debug = createDebugger('trading-post:userProfile');

class UserProfileService {
  constructor() {
    this.databaseId = config.database.databaseId;
    this.collectionId = config.database.collections.users;
    // Use smart wrapper to handle field mapping issues
    this.db = smartDatabases;
  }

  /**
   * Get or create user profile
   * Automatically creates profile if it doesn't exist
   */
  async getOrCreateProfile(user) {
    if (!user || !user.$id) {
      console.error('❌ [UserProfile] getOrCreateProfile called without valid user object', user);
      debug.error('getOrCreateProfile called without valid user object');
      throw new Error('User object is required');
    }

    console.log('🔎 [UserProfile] Getting or creating profile for:', { 
      userId: user.$id, 
      email: user.email,
      databaseId: this.databaseId,
      collectionId: this.collectionId 
    });
    
    debug.info('Getting or creating profile', { userId: user.$id, email: user.email });
    
    try {
      // Try to get existing profile
      console.log('📥 [UserProfile] Attempting to fetch existing profile...');
      const profile = await this.db.getDocument(
        this.databaseId,
        this.collectionId,
        user.$id
      );
      
      console.log('✅ [UserProfile] Profile found:', { 
        profileId: profile.$id,
        hasUsername: !!profile.username,
        hasEmail: !!profile.email,
        fields: Object.keys(profile)
      });
      
      debug.success('User profile found', { profileId: profile.$id });
      return profile;
    } catch (error) {
      console.log('⚠️ [UserProfile] Profile fetch error:', {
        code: error.code,
        message: error.message,
        type: error.type
      });
      
      if (error.code === 404) {
        // Profile doesn't exist, create it
        console.log('🆕 [UserProfile] Profile not found (404), creating new profile');
        debug.info('Profile not found, creating new profile', { email: user.email });
        return await this.createProfile(user);
      }
      
      console.error('❌ [UserProfile] Unexpected error getting profile:', error);
      throw error;
    }
  }

  /**
   * Create user profile
   */
  async createProfile(user) {
    if (!user || !user.$id) {
      console.error('❌ [UserProfile] createProfile called without valid user object', user);
      debug.error('createProfile called without valid user object');
      throw new Error('User object is required');
    }

    console.log('📝 [UserProfile] Starting profile creation for user:', { 
      userId: user.$id, 
      email: user.email,
      hasName: !!user.name,
      userKeys: Object.keys(user)
    });
    
    debug.info('Creating user profile', { userId: user.$id, email: user.email });
    
    try {
      // Generate a unique username if not provided
      const baseUsername = user.name 
        ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') 
        : user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Ensure username is at least 3 characters
      const username = baseUsername.length >= 3 ? baseUsername : `${baseUsername}${Date.now().toString().slice(-3)}`;

      // Build profile data with only fields that exist in the schema
      // Start with minimal required fields
      const profileData = {
        email: user.email,
        username: username,
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(), // Keep both for compatibility
        updated_at: new Date().toISOString(),
        updatedAt: new Date().toISOString() // Keep both for compatibility
      };

      // Add optional fields only if they likely exist in schema
      // Try to detect schema by attempting with different field sets
      const optionalFields = {
        bio: '',
        location: '',
        avatar: user.prefs?.avatar || '',
        rating: 0,
        totalReviews: 0,
        totalTrades: 0,
        joinedDate: new Date().toISOString(),
        isVerified: false
      };

      // Log what we're attempting to create
      console.log('🔍 [UserProfile] Attempting to create profile with data:', {
        requiredFields: Object.keys(profileData),
        optionalFields: Object.keys(optionalFields),
        fullData: { ...profileData, ...optionalFields }
      });

      // First try with all fields
      let attemptData = { ...profileData, ...optionalFields };
      
      // Add preferences as nested object if supported
      try {
        attemptData.preferences = {
          notifications: true,
          newsletter: false,
          publicProfile: true
        };
      } catch (e) {
        console.warn('⚠️ [UserProfile] Preferences field might not be supported');
      }

      // Check if username already exists and make it unique if needed
      const uniqueUsername = await this.ensureUniqueUsername(username);
      attemptData.username = uniqueUsername;

      console.log('📤 [UserProfile] Sending profile data to Appwrite:', attemptData);

      const profile = await this.db.createDocument(
        this.databaseId,
        this.collectionId,
        user.$id, // Use user ID as document ID for easy lookup
        attemptData
      );

      console.log('✅ [UserProfile] Profile created successfully:', { 
        profileId: profile.$id, 
        username: uniqueUsername,
        createdFields: Object.keys(profile) 
      });
      
      debug.success('User profile created', { profileId: profile.$id, username: uniqueUsername });
      return profile;
    } catch (error) {
      console.error('❌ [UserProfile] Profile creation failed:', {
        userId: user.$id,
        errorCode: error.code,
        errorMessage: error.message,
        errorType: error.type,
        fullError: error
      });

      // If we get schema error, try with minimal fields
      if (error.message && error.message.includes('Unknown attribute')) {
        console.log('🔄 [UserProfile] Retrying with minimal fields due to schema mismatch');
        
        try {
          // Extract the unknown attribute from error message
          const unknownAttr = error.message.match(/Unknown attribute: "([^"]+)"/)?.[1];
          console.log('⚠️ [UserProfile] Removing unknown attribute:', unknownAttr);
          
          // Generate username again for retry
          const baseUsername = user.name 
            ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') 
            : user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const retryUsername = baseUsername.length >= 3 ? baseUsername : `${baseUsername}${Date.now().toString().slice(-3)}`;
          
          // Retry with only essential fields
          const minimalData = {
            email: user.email,
            username: await this.ensureUniqueUsername(retryUsername),
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(), // Keep both for compatibility
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString() // Keep both for compatibility
          };
          
          console.log('🔄 [UserProfile] Retrying with minimal data:', minimalData);
          
          const profile = await this.db.createDocument(
            this.databaseId,
            this.collectionId,
            user.$id,
            minimalData
          );
          
          console.log('✅ [UserProfile] Profile created with minimal fields:', profile.$id);
          return profile;
        } catch (retryError) {
          console.error('❌ [UserProfile] Minimal profile creation also failed:', retryError);
          debug.error('Failed to create minimal user profile', { 
            userId: user.$id, 
            error: retryError.message, 
            code: retryError.code 
          });
        }
      }

      // If profile already exists (race condition), try to get it
      if (error.code === 409) {
        console.log('⚠️ [UserProfile] Profile already exists, fetching existing');
        debug.warn('Profile already exists (race condition), fetching existing', { userId: user.$id });
        return await this.getProfile(user.$id);
      }
      
      debug.error('Failed to create user profile', { userId: user.$id, error: error.message, code: error.code });
      throw error;
    }
  }

  /**
   * Ensure username is unique by checking existing usernames
   */
  async ensureUniqueUsername(baseUsername) {
    try {
      // First, try the base username
      const existingUser = await this.getUserByUsername(baseUsername);
      if (!existingUser) {
        return baseUsername;
      }

      // If username exists, add numbers until we find a unique one
      let counter = 1;
      let uniqueUsername;
      do {
        uniqueUsername = `${baseUsername}${counter}`;
        const existingUser = await this.getUserByUsername(uniqueUsername);
        if (!existingUser) {
          return uniqueUsername;
        }
        counter++;
      } while (counter < 100); // Prevent infinite loop

      // If we can't find a unique username after 100 tries, add timestamp
      return `${baseUsername}${Date.now().toString().slice(-6)}`;
    } catch (error) {
      debug.error('Error ensuring unique username', { baseUsername, error: error.message });
      // Fallback to timestamp-based username
      const fallbackUsername = `${baseUsername}${Date.now().toString().slice(-6)}`;
      debug.warn('Using fallback username', { fallbackUsername });
      return fallbackUsername;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    try {
      const response = await this.db.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('username', [username]),
          Query.limit(1)
        ]
      );

      return response.documents[0] || null;
    } catch (error) {
      debug.error('Failed to get user by username', { username, error: error.message });
      return null;
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId) {
    debug.debug('Fetching user profile', { userId });
    try {
      const profile = await this.db.getDocument(
        this.databaseId,
        this.collectionId,
        userId
      );
      return profile;
    } catch (error) {
      if (error.code === 404) {
        debug.debug('Profile not found', { userId });
        return null;
      }
      debug.error('Error fetching profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    debug.info('Updating user profile', { userId, updateFields: Object.keys(updates) });
    try {
      // Always update the updatedAt timestamp
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const profile = await this.db.updateDocument(
        this.databaseId,
        this.collectionId,
        userId,
        updatesWithTimestamp
      );
      debug.success('User profile updated', { profileId: profile.$id });
      return profile;
    } catch (error) {
      debug.error('Failed to update user profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm, limit = 20) {
    try {
      const queries = [
        Query.limit(limit),
        Query.orderDesc('$createdAt')
      ];

      if (searchTerm) {
        queries.push(Query.search('name', searchTerm));
      }

      const response = await this.db.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return response.documents;
    } catch (error) {
      debug.error('Failed to search users', { searchTerm, error: error.message });
      return [];
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const response = await this.db.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('email', [email]),
          Query.limit(1)
        ]
      );

      return response.documents[0] || null;
    } catch (error) {
      debug.error('Failed to get user by email', { email, error: error.message });
      return null;
    }
  }
}

export default new UserProfileService();