/**
 * Add Fake Listings to Trading Post
 * Utility to populate the marketplace with sample data
 */

import itemsService from '../services/itemsService';
import { account } from '../lib/appwrite';

// Stock photo URLs for different categories
const STOCK_PHOTOS = {
  electronics: [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop'
  ],
  clothing: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556905055-8f358a7b6b87?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop'
  ],
  books: [
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop'
  ],
  tools: [
    'https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609205807490-972ccfee9c06?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=400&h=300&fit=crop'
  ],
  automotive: [
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
  ],
  other: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1525904097878-94fb15835963?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609205765107-c6f1c7afc6d0?w=400&h=300&fit=crop'
  ]
};

// Sample listings data
const FAKE_LISTINGS = [
  // Electronics
  {
    title: 'iPhone 13 Pro - Excellent Condition',
    description: 'Barely used iPhone 13 Pro, 256GB, Sierra Blue. Comes with original box, charger, and case. Battery health at 95%. No scratches or damage.',
    category: 'electronics',
    condition: 'like_new',
    price: 850,
    estimated_value: 850,
    trade_preferences: 'Looking for MacBook Air, gaming laptop, or high-end camera',
    city: 'San Francisco',
    state: 'CA',
    zipcode: '94102'
  },
  {
    title: 'Gaming PC - RTX 3080 Custom Build',
    description: 'High-end gaming PC with RTX 3080, Intel i9-12900K, 32GB RAM, 2TB NVMe SSD. Runs all games at max settings. RGB lighting throughout.',
    category: 'electronics',
    condition: 'good',
    price: 2200,
    estimated_value: 2200,
    trade_preferences: 'Would trade for motorcycle, professional camera equipment, or music gear',
    city: 'Austin',
    state: 'TX',
    zipcode: '78701'
  },
  {
    title: 'Sony A7III Camera Body',
    description: 'Professional mirrorless camera, low shutter count (15k), includes extra batteries and memory cards. Perfect for photography enthusiasts.',
    category: 'electronics',
    condition: 'good',
    price: 1400,
    estimated_value: 1400,
    trade_preferences: 'Interested in lenses, lighting equipment, or other camera gear',
    city: 'Los Angeles',
    state: 'CA',
    zipcode: '90001'
  },
  
  // Furniture
  {
    title: 'Mid-Century Modern Sofa',
    description: 'Beautiful velvet green sofa in MCM style. 3-seater, excellent condition, pet-free and smoke-free home. Very comfortable!',
    category: 'furniture',
    condition: 'like_new',
    price: 800,
    estimated_value: 800,
    trade_preferences: 'Looking for dining set or bedroom furniture',
    city: 'Seattle',
    state: 'WA',
    zipcode: '98101'
  },
  {
    title: 'Standing Desk - Adjustable Height',
    description: 'Electric standing desk, 60" x 30", bamboo top. Memory presets for different heights. Great for home office.',
    category: 'furniture',
    condition: 'good',
    price: 400,
    estimated_value: 400,
    trade_preferences: 'Office chair, monitor, or other office equipment',
    city: 'Denver',
    state: 'CO',
    zipcode: '80202'
  },
  
  // Clothing
  {
    title: 'Designer Leather Jacket - Size M',
    description: 'Genuine leather motorcycle jacket, barely worn. Premium quality, timeless style. Retail $600.',
    category: 'clothing',
    condition: 'like_new',
    price: 250,
    estimated_value: 250,
    trade_preferences: 'Other designer clothing or accessories',
    city: 'New York',
    state: 'NY',
    zipcode: '10001'
  },
  {
    title: 'Vintage Band T-Shirt Collection',
    description: '10 authentic vintage band tees from the 80s and 90s. Various sizes M-L. Collectors items!',
    category: 'clothing',
    condition: 'good',
    price: 200,
    estimated_value: 200,
    trade_preferences: 'Vinyl records, music memorabilia, or other vintage items',
    city: 'Portland',
    state: 'OR',
    zipcode: '97201'
  },
  
  // Books
  {
    title: 'Complete Harry Potter First Edition Set',
    description: 'All 7 books, US first editions, hardcover with dust jackets. Good condition, great for collectors.',
    category: 'books',
    condition: 'good',
    price: 500,
    estimated_value: 500,
    trade_preferences: 'Other rare books, collectibles, or electronics',
    city: 'Boston',
    state: 'MA',
    zipcode: '02101'
  },
  {
    title: 'Programming Books Collection',
    description: '20+ programming books including Clean Code, Design Patterns, SICP, and more. Great for developers.',
    category: 'books',
    condition: 'good',
    price: 150,
    estimated_value: 150,
    trade_preferences: 'Tech gadgets, online courses, or other educational materials',
    city: 'San Jose',
    state: 'CA',
    zipcode: '95101'
  },
  
  // Sports
  {
    title: 'Mountain Bike - Trek X-Caliber',
    description: '29er mountain bike, aluminum frame, 21-speed, disc brakes. Recently serviced, ready to ride!',
    category: 'sports',
    condition: 'good',
    price: 600,
    estimated_value: 600,
    trade_preferences: 'Road bike, camping gear, or fitness equipment',
    city: 'Boulder',
    state: 'CO',
    zipcode: '80301'
  },
  {
    title: 'Home Gym Equipment Set',
    description: 'Adjustable dumbbells (5-50 lbs), bench, pull-up bar, resistance bands. Everything you need for home workouts.',
    category: 'sports',
    condition: 'good',
    price: 400,
    estimated_value: 400,
    trade_preferences: 'Bike, kayak, or other outdoor gear',
    city: 'Phoenix',
    state: 'AZ',
    zipcode: '85001'
  },
  
  // Tools
  {
    title: 'DeWalt 20V Power Tool Set',
    description: 'Drill, impact driver, circular saw, reciprocating saw, 2 batteries and charger. Professional grade.',
    category: 'tools',
    condition: 'good',
    price: 350,
    estimated_value: 350,
    trade_preferences: 'Other tools, welding equipment, or automotive tools',
    city: 'Houston',
    state: 'TX',
    zipcode: '77001'
  },
  {
    title: 'Woodworking Router Table',
    description: 'Professional router table with fence, dust collection, and various bits. Great for serious woodworkers.',
    category: 'tools',
    condition: 'good',
    price: 250,
    estimated_value: 250,
    trade_preferences: 'Other woodworking tools or materials',
    city: 'Nashville',
    state: 'TN',
    zipcode: '37201'
  },
  
  // Automotive
  {
    title: '20" Alloy Wheels - Set of 4',
    description: 'Universal 5-lug pattern, chrome finish, includes TPMS sensors. Tires have 70% tread remaining.',
    category: 'automotive',
    condition: 'good',
    price: 800,
    estimated_value: 800,
    trade_preferences: 'Car audio, performance parts, or tools',
    city: 'Miami',
    state: 'FL',
    zipcode: '33101'
  },
  {
    title: 'Motorcycle Helmet - Shoei RF-1400',
    description: 'Top-rated helmet, size Large, matte black. DOT and Snell certified. Like new condition.',
    category: 'automotive',
    condition: 'like_new',
    price: 400,
    estimated_value: 400,
    trade_preferences: 'Motorcycle gear, parts, or accessories',
    city: 'Las Vegas',
    state: 'NV',
    zipcode: '89101'
  },
  
  // Other
  {
    title: 'Vinyl Record Collection - 100+ Albums',
    description: 'Classic rock, jazz, and soul from 60s-80s. Including Beatles, Pink Floyd, Miles Davis. All in good condition.',
    category: 'other',
    condition: 'good',
    price: 500,
    estimated_value: 500,
    trade_preferences: 'Audio equipment, musical instruments, or other collectibles',
    city: 'Chicago',
    state: 'IL',
    zipcode: '60601'
  },
  {
    title: 'Espresso Machine - Breville Barista Express',
    description: 'Professional home espresso machine with built-in grinder. Makes cafe-quality coffee. Includes accessories.',
    category: 'other',
    condition: 'good',
    price: 400,
    estimated_value: 400,
    trade_preferences: 'Kitchen appliances, coffee equipment, or electronics',
    city: 'Philadelphia',
    state: 'PA',
    zipcode: '19101'
  },
  {
    title: 'Nintendo Switch OLED + Games',
    description: 'Latest OLED model with 5 games including Zelda BOTW, Mario Odyssey, and more. Pro controller included.',
    category: 'electronics',
    condition: 'like_new',
    price: 350,
    estimated_value: 350,
    trade_preferences: 'PS5 games, Xbox, or other gaming consoles',
    city: 'Atlanta',
    state: 'GA',
    zipcode: '30301'
  },
  {
    title: 'Fender Stratocaster Electric Guitar',
    description: 'American-made Strat in sunburst finish. Plays beautifully, recently set up by professional. Includes hard case.',
    category: 'other',
    condition: 'good',
    price: 1200,
    estimated_value: 1200,
    trade_preferences: 'Other guitars, amps, music equipment, or recording gear',
    city: 'Memphis',
    state: 'TN',
    zipcode: '38101'
  },
  {
    title: 'Smart Home Bundle - Echo, Hue, Nest',
    description: 'Complete smart home setup: Echo Show, 6 Philips Hue bulbs with hub, Nest thermostat. Everything works perfectly.',
    category: 'electronics',
    condition: 'good',
    price: 300,
    estimated_value: 300,
    trade_preferences: 'Other smart home devices, tablets, or electronics',
    city: 'Dallas',
    state: 'TX',
    zipcode: '75201'
  }
];

/**
 * Add fake listings to the database
 */
export async function addFakeListings() {
  console.log('🚀 Starting to add fake listings...');
  
  try {
    // Check if user is authenticated
    const user = await account.get();
    console.log('✅ Authenticated as:', user.email);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const listing of FAKE_LISTINGS) {
      try {
        // Get random images for the category
        const categoryImages = STOCK_PHOTOS[listing.category] || STOCK_PHOTOS.other;
        const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];
        
        // Add random location coordinates (approximate based on city)
        const coordinates = getApproximateCoordinates(listing.city);
        
        // Create the listing with enhanced data
        const listingData = {
          ...listing,
          images: [randomImage],
          primary_image_url: randomImage,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          listing_type: 'item',
          is_available: true,
          ai_tags: generateTags(listing),
          ai_analysis: {
            confidence: 0.85 + Math.random() * 0.15,
            suggested_price: listing.price,
            market_demand: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
          }
        };
        
        const result = await itemsService.createItem(listingData);
        
        if (result.success) {
          console.log(`✅ Created listing: ${listing.title}`);
          successCount++;
        } else {
          console.error(`❌ Failed to create listing: ${listing.title}`, result.error);
          failCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error creating listing: ${listing.title}`, error);
        failCount++;
      }
    }
    
    console.log(`
📊 Fake Listings Addition Complete!
✅ Successfully created: ${successCount} listings
❌ Failed: ${failCount} listings
    `);
    
    return {
      success: true,
      created: successCount,
      failed: failCount
    };
    
  } catch (error) {
    console.error('❌ Failed to add fake listings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get approximate coordinates for a city
 */
function getApproximateCoordinates(city) {
  const cityCoordinates = {
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'Austin': { lat: 30.2672, lng: -97.7431 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Seattle': { lat: 47.6062, lng: -122.3321 },
    'Denver': { lat: 39.7392, lng: -104.9903 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Portland': { lat: 45.5152, lng: -122.6784 },
    'Boston': { lat: 42.3601, lng: -71.0589 },
    'San Jose': { lat: 37.3382, lng: -121.8863 },
    'Boulder': { lat: 40.0150, lng: -105.2705 },
    'Phoenix': { lat: 33.4484, lng: -112.0740 },
    'Houston': { lat: 29.7604, lng: -95.3698 },
    'Nashville': { lat: 36.1627, lng: -86.7816 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Las Vegas': { lat: 36.1699, lng: -115.1398 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Philadelphia': { lat: 39.9526, lng: -75.1652 },
    'Atlanta': { lat: 33.7490, lng: -84.3880 },
    'Memphis': { lat: 35.1495, lng: -90.0490 },
    'Dallas': { lat: 32.7767, lng: -96.7970 }
  };
  
  return cityCoordinates[city] || { lat: 39.8283, lng: -98.5795 }; // Default to center of USA
}

/**
 * Generate relevant tags for a listing
 */
function generateTags(listing) {
  const baseTags = [listing.category, listing.condition];
  
  // Add tags based on title and description
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  const potentialTags = [];
  
  if (text.includes('vintage')) potentialTags.push('vintage');
  if (text.includes('professional')) potentialTags.push('professional');
  if (text.includes('gaming')) potentialTags.push('gaming');
  if (text.includes('collector')) potentialTags.push('collectible');
  if (text.includes('rare')) potentialTags.push('rare');
  if (text.includes('new') || text.includes('unused')) potentialTags.push('mint');
  if (text.includes('set') || text.includes('bundle')) potentialTags.push('bundle');
  
  return [...baseTags, ...potentialTags].filter(Boolean);
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.addFakeListings = addFakeListings;
  console.log('💡 Fake listings function available: window.addFakeListings()');
}

// Export for use in console or components
export default addFakeListings;