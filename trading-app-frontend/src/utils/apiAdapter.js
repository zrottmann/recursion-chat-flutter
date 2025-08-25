/**
 * API Adapter
 * Redirects old API calls to Appwrite services
 * Fixes 405 Method Not Allowed errors by handling API calls locally
 */

import appwriteAuthService from '../services/appwriteAuthService';
import appwriteDatabase from '../services/appwriteDatabase';
import matchingService from '../services/matchingService';
import itemsService from '../services/itemsService';
import { DEBUG } from './fixDatabaseSchema';

// Override fetch to intercept API calls
const originalFetch = window.fetch;

// Map of API endpoints to Appwrite service methods
const apiHandlers = {
  // Auth endpoints
  '/api/auth/verify': async (options) => {
    try {
      const result = await appwriteAuthService.getCurrentUser();
      return {
        ok: true,
        status: result.success ? 200 : 401,
        data: result.user
      };
    } catch (error) {
      return { ok: false, status: 401, data: { error: error.message } };
    }
  },
  
  '/api/auth/google/verify': async (options) => {
    try {
      const body = JSON.parse(options.body);
      const result = await appwriteAuthService.handleOAuthCallback(
        body.userId || body.token,
        body.secret || body.token,
        'google'
      );
      return {
        ok: true,
        status: result.success ? 200 : 401,
        data: result
      };
    } catch (error) {
      return { ok: false, status: 401, data: { error: error.message } };
    }
  },
  
  '/api/auth/google/callback': async (options) => {
    return apiHandlers['/api/auth/google/verify'](options);
  },
  
  '/api/auth/firebase/signin': async (options) => {
    try {
      const body = JSON.parse(options.body);
      const result = await appwriteAuthService.signInWithEmail(
        body.email,
        body.password
      );
      return {
        ok: true,
        status: result.success ? 200 : 401,
        data: result
      };
    } catch (error) {
      return { ok: false, status: 401, data: { error: error.message } };
    }
  },
  
  // Profile endpoints
  '/api/firebase/profile': async (options) => {
    try {
      const result = await appwriteAuthService.getUserProfile();
      return {
        ok: true,
        status: result.success ? 200 : 404,
        data: result.profile
      };
    } catch (error) {
      return { ok: false, status: 404, data: { error: error.message } };
    }
  },
  
  // Search endpoints
  '/api/search': async (options) => {
    try {
      const url = new URL(options.url || options.path, window.location.origin);
      const params = Object.fromEntries(url.searchParams);
      
      const result = await appwriteDatabase.searchListings({
        query: params.q || params.query,
        category: params.category,
        location: params.location,
        limit: parseInt(params.limit) || 50,
        offset: parseInt(params.offset) || 0
      });
      
      return {
        ok: true,
        status: 200,
        data: {
          items: result.listings,
          total: result.total
        }
      };
    } catch (error) {
      return { ok: false, status: 500, data: { error: error.message } };
    }
  },
  
  // Listings search endpoint
  '/api/listings/search': async (options) => {
    try {
      const body = options.body ? JSON.parse(options.body) : {};
      
      const result = await appwriteDatabase.searchListings({
        query: body.query || body.q,
        category: body.category,
        location: body.location,
        condition: body.condition,
        minPrice: body.minPrice,
        maxPrice: body.maxPrice,
        radius: body.radius || 50,
        listingType: body.listingType,
        sortBy: body.sortBy || 'newest',
        saved: body.saved,
        latitude: body.latitude,
        longitude: body.longitude,
        limit: body.limit || 50,
        offset: body.offset || 0
      });
      
      // Return array of listings directly for the component
      return {
        ok: true,
        status: 200,
        data: result.listings || []
      };
    } catch (error) {
      console.error('Error in /api/listings/search handler:', error);
      return { ok: false, status: 500, data: [] };
    }
  },
  
  // Photo-to-trade endpoints
  '/api/photo-to-trade/start': async (options) => {
    try {
      const body = JSON.parse(options.body);
      // Create a new item with AI analysis
      const result = await itemsService.createItem({
        title: 'Photo Item',
        description: 'Analyzing...',
        images: body.images || [],
        category: 'other',
        condition: 'good',
        is_available: false // Draft until analyzed
      });
      
      return {
        ok: true,
        status: 200,
        data: {
          session_id: result.item?.$id,
          status: 'processing'
        }
      };
    } catch (error) {
      return { ok: false, status: 500, data: { error: error.message } };
    }
  },
  
  '/api/photo-to-trade/status': async (options) => {
    try {
      const url = new URL(options.url || options.path, window.location.origin);
      const sessionId = url.pathname.split('/').pop();
      
      const result = await itemsService.getItem(sessionId);
      
      return {
        ok: true,
        status: 200,
        data: {
          status: result.item?.ai_status || 'completed',
          progress: 100
        }
      };
    } catch (error) {
      return { ok: false, status: 404, data: { error: error.message } };
    }
  },
  
  '/api/photo-to-trade/results': async (options) => {
    try {
      const url = new URL(options.url || options.path, window.location.origin);
      const sessionId = url.pathname.split('/').pop();
      
      const itemResult = await itemsService.getItem(sessionId);
      const matchResult = await matchingService.generateMatches(sessionId);
      
      return {
        ok: true,
        status: 200,
        data: {
          item: itemResult.item,
          matches: matchResult.matches || []
        }
      };
    } catch (error) {
      return { ok: false, status: 404, data: { error: error.message } };
    }
  },
  
  // Geocoding endpoints
  '/api/geocode/zipcode': async (options) => {
    try {
      const url = new URL(options.url || options.path, window.location.origin);
      const zipCode = url.pathname.split('/').pop();
      
      // Mock geocoding response for now
      return {
        ok: true,
        status: 200,
        data: {
          latitude: 39.2904,
          longitude: -76.6122,
          city: 'Baltimore',
          state: 'MD',
          country: 'US'
        }
      };
    } catch (error) {
      return { ok: false, status: 404, data: { error: error.message } };
    }
  },
  
  // Individual item endpoint  
  '/items/': async (options) => {
    try {
      const url = new URL(options.url || options.path, window.location.origin);
      const pathParts = url.pathname.split('/');
      const itemId = pathParts[pathParts.length - 1];
      
      console.log('🔍 Fetching individual item:', itemId);
      
      const result = await itemsService.getItem(itemId);
      
      if (result.success && result.item) {
        const item = result.item;
        
        // Try to get owner/user data
        let owner = null;
        try {
          // Try to get user ID from item
          const userId = item.user_id || item.userId || item.owner_id || item.ownerId;
          console.log('🔍 Trying to get user data for userId:', userId);
          
          if (userId) {
            // Use appwriteDatabase to get user info
            const userResult = await appwriteDatabase.getUserById(userId);
            if (userResult.success && userResult.user) {
              owner = {
                id: userResult.user.$id || userResult.user.id,
                username: userResult.user.username || userResult.user.name || userResult.user.email?.split('@')[0] || 'Unknown User',
                email: userResult.user.email,
                created_at: userResult.user.$createdAt || userResult.user.created_at,
                latitude: userResult.user.latitude,
                longitude: userResult.user.longitude
              };
              console.log('✅ Found owner data:', owner);
            }
          }
        } catch (userError) {
          console.warn('⚠️ Could not fetch owner data:', userError);
        }
        
        // Return item with owner data
        const itemWithOwner = {
          ...item,
          owner: owner
        };
        
        console.log('✅ Returning item with owner:', itemWithOwner);
        
        return {
          ok: true,
          status: 200,
          data: itemWithOwner
        };
      } else {
        return {
          ok: false,
          status: 404,
          data: { error: 'Item not found' }
        };
      }
    } catch (error) {
      console.error('❌ Error fetching item:', error);
      return { ok: false, status: 500, data: { error: error.message } };
    }
  },

  // Listings save/unsave endpoints
  '/api/listings/save': async (options) => {
    try {
      const url = new URL(options.url || options.path, window.location.origin);
      const pathParts = url.pathname.split('/');
      const listingId = pathParts[pathParts.indexOf('listings') + 1];
      
      if (options.method === 'DELETE') {
        // Unsave item
        const result = await appwriteDatabase.unsaveItem(listingId);
        return {
          ok: true,
          status: 200,
          data: { success: true, message: 'Item unsaved' }
        };
      } else {
        // Save item
        const result = await appwriteDatabase.saveItem(listingId);
        return {
          ok: true,
          status: 200,
          data: { success: true, message: 'Item saved' }
        };
      }
    } catch (error) {
      return { ok: false, status: 500, data: { error: error.message } };
    }
  }
};

// Helper function to check if URL matches an endpoint pattern
function matchesEndpoint(url, endpoint) {
  try {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    
    // Handle exact matches first
    if (pathname === endpoint) return true;
    
    // Handle parameterized endpoints like /items/{id}
    if (endpoint === '/items/' && pathname.startsWith('/items/') && pathname.split('/').length === 3) {
      return true;
    }
    
    // Handle other includes-based matches for backwards compatibility
    return pathname.includes(endpoint);
  } catch (error) {
    // Fallback to simple includes if URL parsing fails
    return url.includes(endpoint);
  }
}

// Intercept fetch calls
window.fetch = async function(...args) {
  const [url, options = {}] = args;
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Check if this is an API call we should handle
  for (const [endpoint, handler] of Object.entries(apiHandlers)) {
    if (matchesEndpoint(urlString, endpoint)) {
      DEBUG.log('info', `📡 Intercepting API call: ${endpoint}`, options);
      
      try {
        const result = await handler({
          url: urlString,
          path: urlString,
          ...options
        });
        
        // Create a mock Response object
        const response = new Response(JSON.stringify(result.data), {
          status: result.status,
          statusText: result.ok ? 'OK' : 'Error',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        DEBUG.log('success', `✅ API call handled: ${endpoint}`, result);
        return response;
        
      } catch (error) {
        DEBUG.log('error', `❌ API handler error for ${endpoint}:`, error);
        console.error(`❌ API handler error for ${endpoint}:`, error);
        
        // Return error response
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
  }
  
  // Not an API call we handle, use original fetch
  return originalFetch.apply(this, args);
};

// TEMPORARILY DISABLED: XHR interception causing loading issues
// Also intercept XMLHttpRequest for axios
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// XMLHttpRequest.prototype.open = function(method, url, ...args) {
//   this._interceptUrl = url;
//   this._interceptMethod = method;
//   return originalXHROpen.apply(this, [method, url, ...args]);
// };

XMLHttpRequest.prototype.send = function(data) {
  // DISABLED: Skip XHR interception for now
  return originalXHRSend.apply(this, [data]);
};

// Initialize on load
export function initApiAdapter() {
  console.log('🔌 API Adapter initialized - redirecting old API calls to Appwrite services');
  DEBUG.log('info', 'API Adapter active - monitoring API calls');
  
  // Log current endpoints being intercepted for debugging
  console.log('🔍 API Adapter endpoints:', Object.keys(apiHandlers));
}

// Export for testing
export { apiHandlers };