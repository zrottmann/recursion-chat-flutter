/**
 * Marketplace Fallback Service
 * Provides simple direct Appwrite access without interceptors
 * Used as fallback when API adapter has issues
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

class MarketplaceFallbackService {
  /**
   * Get listings directly from Appwrite without any wrappers
   */
  async getListings(limit = 50) {
    try {
      console.log('[MarketplaceFallback] Fetching listings directly from Appwrite...');
      
      // Direct Appwrite call - no wrappers, no interceptors
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        [
          Query.equal('status', 'active'),
          Query.limit(limit),
          Query.orderDesc('$createdAt')
        ]
      );
      
      if (response && response.documents) {
        console.log(`[MarketplaceFallback] Found ${response.documents.length} listings`);
        
        // Simple normalization
        const listings = response.documents.map(doc => ({
          id: doc.$id,
          title: doc.title || 'Untitled',
          description: doc.description || '',
          price: doc.price || doc.estimated_value || 0,
          category: doc.category || 'other',
          condition: doc.condition || 'good',
          images: this.parseImages(doc.images),
          primary_image_url: doc.primary_image_url || this.getFirstImage(doc.images),
          location: {
            city: doc.city || '',
            state: doc.state || '',
            zipcode: doc.zipcode || ''
          },
          created_at: doc.$createdAt,
          user_id: doc.user_id || doc.userId || doc.owner_id,
          status: doc.status || 'active'
        }));
        
        return {
          success: true,
          listings,
          total: response.total
        };
      }
      
      return {
        success: true,
        listings: [],
        total: 0
      };
      
    } catch (error) {
      console.error('[MarketplaceFallback] Error fetching listings:', error);
      
      // Return empty array instead of throwing
      return {
        success: false,
        listings: [],
        total: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Parse images field (might be JSON string or array)
   */
  parseImages(images) {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [images]; // Single image URL
      }
    }
    return [];
  }
  
  /**
   * Get first image from images array/string
   */
  getFirstImage(images) {
    const imageArray = this.parseImages(images);
    return imageArray.length > 0 ? imageArray[0] : null;
  }
  
  /**
   * Search listings with basic filters
   */
  async searchListings(params = {}) {
    try {
      console.log('[MarketplaceFallback] Searching listings with params:', params);
      
      const queries = [
        Query.equal('status', 'active'),
        Query.limit(params.limit || 50)
      ];
      
      // Add filters if provided
      if (params.category && params.category !== 'all') {
        queries.push(Query.equal('category', params.category));
      }
      
      if (params.condition) {
        queries.push(Query.equal('condition', params.condition));
      }
      
      if (params.minPrice) {
        queries.push(Query.greaterThanEqual('price', params.minPrice));
      }
      
      if (params.maxPrice) {
        queries.push(Query.lessThanEqual('price', params.maxPrice));
      }
      
      // Sort
      if (params.sortBy === 'price_low') {
        queries.push(Query.orderAsc('price'));
      } else if (params.sortBy === 'price_high') {
        queries.push(Query.orderDesc('price'));
      } else {
        queries.push(Query.orderDesc('$createdAt'));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );
      
      // Use same normalization as getListings
      const listings = response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title || 'Untitled',
        description: doc.description || '',
        price: doc.price || doc.estimated_value || 0,
        category: doc.category || 'other',
        condition: doc.condition || 'good',
        images: this.parseImages(doc.images),
        primary_image_url: doc.primary_image_url || this.getFirstImage(doc.images),
        location: {
          city: doc.city || '',
          state: doc.state || '',
          zipcode: doc.zipcode || ''
        },
        created_at: doc.$createdAt,
        user_id: doc.user_id || doc.userId || doc.owner_id,
        status: doc.status || 'active'
      }));
      
      return {
        success: true,
        listings,
        total: response.total
      };
      
    } catch (error) {
      console.error('[MarketplaceFallback] Search error:', error);
      return {
        success: false,
        listings: [],
        total: 0,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const marketplaceFallback = new MarketplaceFallbackService();
export default marketplaceFallback;