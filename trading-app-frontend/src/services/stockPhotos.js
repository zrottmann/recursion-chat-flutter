/**
 * Stock Photos Service
 * Provides fallback stock images for listings to enhance visual appeal
 */

// Curated stock photo URLs organized by category
const stockPhotos = {
  // Electronics
  electronics: [
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop&q=80', // Phone
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&q=80', // Laptop
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop&q=80', // Headphones
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop&q=80', // Gaming setup
    'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&h=300&fit=crop&q=80', // Tablet
  ],
  
  // Furniture
  furniture: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&q=80', // Chair
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&q=80', // Sofa
    'https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop&q=80', // Desk
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&q=80', // Dining table
    'https://images.unsplash.com/photo-1571898862241-a757c4bddb5d?w=400&h=300&fit=crop&q=80', // Bedroom
  ],
  
  // Clothing
  clothing: [
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop&q=80', // Clothes rack
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=300&fit=crop&q=80', // Fashion
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80', // Clothes store
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&q=80', // Wardrobe
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop&q=80', // Shoes
  ],
  
  // Books
  books: [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80', // Books
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80', // Library
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&q=80', // Bookshelf
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80', // Stack of books
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop&q=80', // Open book
  ],
  
  // Sports & Outdoors
  sports: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80', // Gym equipment
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80', // Sports gear
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=300&fit=crop&q=80', // Bike
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=300&fit=crop&q=80', // Outdoor gear
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80', // Exercise
  ],
  
  // Default fallback images
  default: [
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80', // General items
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=400&h=300&fit=crop&q=80', // Shopping
    'https://images.unsplash.com/photo-1522204538344-922f76ecc041?w=400&h=300&fit=crop&q=80', // Marketplace
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80', // Products
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=400&h=300&fit=crop&q=80', // Commerce
  ]
};

/**
 * Determines the category of a listing based on title and description
 */
const categorizeItem = (title, description = '', category = '') => {
  const text = `${title} ${description} ${category}`.toLowerCase();
  
  const keywords = {
    electronics: ['phone', 'laptop', 'computer', 'headphones', 'tablet', 'ipad', 'iphone', 'android', 'gaming', 'console', 'tv', 'monitor', 'camera', 'speaker', 'bluetooth', 'wifi', 'electronic', 'device', 'tech', 'smart'],
    furniture: ['chair', 'table', 'desk', 'sofa', 'couch', 'bed', 'dresser', 'cabinet', 'bookshelf', 'lamp', 'furniture', 'dining', 'living room', 'bedroom', 'office', 'storage'],
    clothing: ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat', 'sweater', 'jeans', 'clothing', 'fashion', 'apparel', 'wear', 'boots', 'sneakers', 'suit', 'blouse'],
    books: ['book', 'novel', 'textbook', 'magazine', 'journal', 'literature', 'reading', 'study', 'education', 'academic', 'fiction', 'non-fiction'],
    sports: ['bike', 'bicycle', 'gym', 'exercise', 'fitness', 'sports', 'basketball', 'football', 'soccer', 'tennis', 'golf', 'running', 'workout', 'weights', 'outdoor']
  };
  
  for (const [cat, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => text.includes(keyword))) {
      return cat;
    }
  }
  
  return 'default';
};

/**
 * Gets a stock photo URL for a listing
 */
export const getStockPhotoForListing = (listing) => {
  try {
    // If listing already has photos, return null (use existing photos)
    if (listing.photos && listing.photos.length > 0) {
      return null;
    }
    
    // Determine category
    const category = categorizeItem(
      listing.title || '', 
      listing.description || '', 
      listing.category || ''
    );
    
    // Get available photos for category
    const categoryPhotos = stockPhotos[category] || stockPhotos.default;
    
    // Use listing ID to consistently select the same photo for the same item
    const listingId = listing.$id || listing.id;
    const photoIndex = listingId 
      ? Math.abs(typeof listingId === 'string' ? listingId.length : listingId) % categoryPhotos.length 
      : Math.floor(Math.random() * categoryPhotos.length);
    
    return categoryPhotos[photoIndex];
  } catch (error) {
    console.error('Error getting stock photo:', error);
    return stockPhotos.default[0];
  }
};

/**
 * Gets multiple stock photos for variety
 */
export const getStockPhotos = (category = 'default', count = 3) => {
  const categoryPhotos = stockPhotos[category] || stockPhotos.default;
  const shuffled = [...categoryPhotos].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, categoryPhotos.length));
};

/**
 * Preloads stock photos for better performance
 */
export const preloadStockPhotos = () => {
  try {
    const allPhotos = Object.values(stockPhotos).flat();
    allPhotos.forEach(url => {
      const img = new Image();
      img.src = url;
    });
    console.log('📸 Stock photos preloaded for better performance');
  } catch (error) {
    console.error('Error preloading stock photos:', error);
  }
};

const stockPhotoService = {
  getStockPhotoForListing,
  getStockPhotos,
  preloadStockPhotos,
  categorizeItem
};

export default stockPhotoService;