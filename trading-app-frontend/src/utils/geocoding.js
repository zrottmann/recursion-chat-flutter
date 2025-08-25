// Utility functions for geocoding and location display

// Get API base URL (adjust for your backend)
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';  // Development backend
  }
  return '';  // Production - same domain
};

// Fallback location mappings for well-known coordinates
const COORDINATE_FALLBACKS = {
  // Washington DC area
  '38.907,-77.037': 'Washington, DC',
  '38.906,-77.036': 'Washington, DC', 
  '38.905,-77.035': 'Washington, DC',
  '38.908,-77.038': 'Washington, DC',
  '38.895,-77.037': 'Washington, DC',
  
  // Annapolis, MD area
  '38.978,-76.492': 'Annapolis, MD',
  '38.979,-76.493': 'Annapolis, MD',
  '38.977,-76.491': 'Annapolis, MD',
  '38.980,-76.494': 'Annapolis, MD',
  
  // Baltimore, MD area
  '39.290,-76.612': 'Baltimore, MD',
  '39.291,-76.613': 'Baltimore, MD',
  '39.289,-76.611': 'Baltimore, MD',
  
  // Alexandria, VA area  
  '38.805,-77.047': 'Alexandria, VA',
  '38.804,-77.046': 'Alexandria, VA',
  '38.806,-77.048': 'Alexandria, VA'
};

// Get fallback location for coordinates
const getFallbackLocation = (latitude, longitude) => {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  return COORDINATE_FALLBACKS[key] || null;
};

// Reverse geocoding using backend proxy to avoid CORS and rate limiting
export const getCityFromCoordinates = async (latitude, longitude) => {
  try {
    // First check for fallback location
    const fallback = getFallbackLocation(latitude, longitude);
    if (fallback) {
      console.log(`🎯 Using fallback location for ${latitude},${longitude}: ${fallback}`);
      return fallback;
    }

    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(
      `${apiBaseUrl}/api/reverse-geocode?lat=${latitude}&lon=${longitude}&zoom=10`
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.result && result.result.address) {
      const address = result.result.address;
      
      // Try to get the most appropriate city-level name
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.county || 
                   address.state;
      
      if (city) {
        console.log(`✅ Successfully reverse geocoded ${latitude},${longitude} to: ${city}`);
        return city;
      }
    }
    
    console.warn(`⚠️ No address data returned for ${latitude},${longitude}`);
    // Check fallback one more time before giving up
    return fallback || 'Unknown location';
  } catch (error) {
    console.error('Error getting city from coordinates via backend proxy:', error);
    // Check fallback before returning unknown
    const fallback = getFallbackLocation(latitude, longitude);
    return fallback || 'Unknown location';
  }
};

// Cache for city names to avoid repeated API calls
const cityCache = new Map();
const geocodingCache = new Map();

// Enhanced caching with TTL (1 hour)
const CACHE_TTL = 3600000; // 1 hour in milliseconds

const isValidCacheEntry = (entry) => {
  return entry && (Date.now() - entry.timestamp) < CACHE_TTL;
};

export const getCachedCityFromCoordinates = async (latitude, longitude) => {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  
  // Check cache with TTL, but ignore cached "Unknown location" results
  if (cityCache.has(key)) {
    const entry = cityCache.get(key);
    if (isValidCacheEntry(entry) && entry.value !== 'Unknown location') {
      console.log(`🎯 Using cached city result for ${latitude},${longitude}: ${entry.value}`);
      return entry.value;
    } else {
      cityCache.delete(key); // Remove expired or "Unknown location" entry
    }
  }
  
  const city = await getCityFromCoordinates(latitude, longitude);
  
  // Only cache successful results (not "Unknown location")
  if (city && city !== 'Unknown location') {
    cityCache.set(key, { value: city, timestamp: Date.now() });
  }
  
  return city;
};

// Forward geocoding using backend proxy
export const getCoordinatesFromAddress = async (address) => {
  try {
    // Check cache first
    const cacheKey = `forward:${address.toLowerCase().trim()}`;
    if (geocodingCache.has(cacheKey)) {
      const entry = geocodingCache.get(cacheKey);
      if (isValidCacheEntry(entry)) {
        console.log(`🎯 Using cached geocoding result for: ${address}`);
        return entry.value;
      } else {
        geocodingCache.delete(cacheKey); // Remove expired entry
      }
    }

    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(
      `${apiBaseUrl}/api/geocode?q=${encodeURIComponent(address)}&limit=1&countrycodes=us`
    );
    
    if (!response.ok) {
      throw new Error(`Forward geocoding failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.results && result.results.length > 0) {
      const location = result.results[0];
      const coordinates = {
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        display_name: location.display_name
      };
      
      // Cache the result
      geocodingCache.set(cacheKey, { value: coordinates, timestamp: Date.now() });
      
      console.log(`✅ Successfully geocoded "${address}" to: ${coordinates.lat},${coordinates.lon}`);
      return coordinates;
    }
    
    console.warn(`⚠️ No coordinates found for address: ${address}`);
    return null;
  } catch (error) {
    console.error('Error geocoding address via backend proxy:', error);
    return null;
  }
};

// Specialized zip code geocoding
export const getCoordinatesFromZipCode = async (zipCode) => {
  try {
    // Check cache first
    const cacheKey = `zipcode:${zipCode}`;
    if (geocodingCache.has(cacheKey)) {
      const entry = geocodingCache.get(cacheKey);
      if (isValidCacheEntry(entry)) {
        console.log(`🎯 Using cached zipcode result for: ${zipCode}`);
        return entry.value;
      } else {
        geocodingCache.delete(cacheKey); // Remove expired entry
      }
    }

    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/geocode/zipcode/${zipCode}`);
    
    if (!response.ok) {
      throw new Error(`Zipcode geocoding failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.coordinates) {
      const coordinates = {
        lat: result.coordinates.lat,
        lon: result.coordinates.lon,
        address: result.address,
        zipcode: result.zipcode
      };
      
      // Cache the result
      geocodingCache.set(cacheKey, { value: coordinates, timestamp: Date.now() });
      
      console.log(`✅ Successfully geocoded zipcode ${zipCode}`);
      return coordinates;
    } else if (result.fallback) {
      console.warn(`⚠️ Using fallback coordinates for zipcode: ${zipCode}`);
      return {
        lat: result.fallback.lat,
        lon: result.fallback.lon,
        address: 'Unknown location',
        zipcode: zipCode,
        fallback: true
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding zipcode via backend proxy:', error);
    // Return fallback NYC coordinates
    return {
      lat: 40.7128,
      lon: -74.0060,
      address: 'New York, NY (fallback)',
      zipcode: zipCode,
      fallback: true
    };
  }
};

// Format location display with city and distance
export const formatLocationDisplay = (distance, city) => {
  const distanceText = distance ? `${(distance * 0.621371).toFixed(1)}mi` : '';
  
  if (city && city !== 'Unknown location') {
    return distanceText ? `${city} • ${distanceText}` : city;
  }
  
  return distanceText || 'Location unknown';
};

// Get user-friendly location text
export const getLocationText = async (listing) => {
  if (!listing.user || !listing.user.latitude || !listing.user.longitude) {
    return 'Location unknown';
  }
  
  const city = await getCachedCityFromCoordinates(
    listing.user.latitude, 
    listing.user.longitude
  );
  
  return formatLocationDisplay(listing.distance, city);
};

// Clear any cached "Unknown location" entries on startup
export const clearBadGeocodingCache = () => {
  let clearedCount = 0;
  for (const [key, entry] of cityCache.entries()) {
    if (entry.value === 'Unknown location') {
      cityCache.delete(key);
      clearedCount++;
    }
  }
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} cached "Unknown location" entries`);
  }
};

// Automatically clear bad cache entries when this module loads
clearBadGeocodingCache();