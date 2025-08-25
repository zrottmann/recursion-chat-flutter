/**
 * Membership Service
 * Handles user membership data using Appwrite
 */

import { databases } from '../lib/appwrite';
import config from '../config/appwriteConfig';

class MembershipService {
  constructor() {
    this.databaseId = config.database.databaseId;
    this.usersCollection = config.database.collections.users;
  }

  /**
   * Get user membership data
   */
  async getMyMembership(userId) {
    console.log('🔍 [Membership] Fetching membership for user:', { 
      userId, 
      databaseId: this.databaseId,
      collection: this.usersCollection 
    });
    
    if (!userId) {
      console.error('❌ [Membership] No userId provided to getMyMembership');
      return {
        type: 'free',
        status: 'active',
        features: this.getMembershipFeatures('free')
      };
    }
    
    try {
      const userDoc = await databases.getDocument(
        this.databaseId,
        this.usersCollection,
        userId
      );

      console.log('✅ [Membership] User document fetched:', {
        docId: userDoc.$id,
        hasMembershipType: !!userDoc.membershipType,
        fields: Object.keys(userDoc)
      });

      // Return membership-like data from user profile
      return {
        id: userDoc.$id,
        type: userDoc.membershipType || 'free',
        status: 'active',
        joinedDate: userDoc.joinedDate || userDoc.createdAt || userDoc.$createdAt,
        totalTrades: userDoc.totalTrades || 0,
        totalReviews: userDoc.totalReviews || 0,
        rating: userDoc.rating || 0,
        isVerified: userDoc.isVerified || false,
        features: this.getMembershipFeatures(userDoc.membershipType || 'free')
      };
    } catch (error) {
      console.error('❌ [Membership] Failed to fetch membership:', {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
        errorType: error.type
      });
      
      // Return default membership if user not found
      return {
        type: 'free',
        status: 'active',
        features: this.getMembershipFeatures('free')
      };
    }
  }

  /**
   * Get features for membership type
   */
  getMembershipFeatures(type) {
    const features = {
      free: {
        maxListings: 10,
        maxPhotosPerListing: 3,
        messagingEnabled: true,
        prioritySupport: false,
        featuredListings: false,
        advancedAnalytics: false
      },
      premium: {
        maxListings: 100,
        maxPhotosPerListing: 10,
        messagingEnabled: true,
        prioritySupport: true,
        featuredListings: true,
        advancedAnalytics: true
      }
    };

    return features[type] || features.free;
  }
}

// Export singleton instance
export default new MembershipService();