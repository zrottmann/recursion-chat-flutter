/**
 * Trading Post Service Worker
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'trading-post-v1.0.0';
const STATIC_CACHE = 'trading-post-static-v1.0.0';
const DYNAMIC_CACHE = 'trading-post-dynamic-v1.0.0';
const IMAGE_CACHE = 'trading-post-images-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
  '/favicon.ico',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/items$/,
  /\/api\/users\/\d+\/profile$/,
  /\/api\/categories$/,
  /\/api\/locations$/
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/images\//,
  /\/uploads\//
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/messages/,
  /\/api\/notifications/,
  /\/api\/realtime/,
  /\/api\/auth/
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Route requests to appropriate handlers
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-listings') {
    event.waitUntil(syncListings());
  } else if (event.tag === 'sync-user-actions') {
    event.waitUntil(syncUserActions());
  }
});

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const options = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.title = data.title || 'Trading Post';
    options.body = data.body || 'You have a new notification';
    options.data = { ...options.data, ...data };
  } else {
    options.title = 'Trading Post';
    options.body = 'You have a new notification';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Handle static assets (cache-first strategy)
 */
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version and update in background
      fetchAndCache(request, STATIC_CACHE);
      return cachedResponse;
    }
    
    // Not in cache, fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

/**
 * Handle API requests
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Network-first for real-time data
  if (isNetworkFirstPattern(request)) {
    return handleNetworkFirst(request, DYNAMIC_CACHE);
  }
  
  // Cache-first for less critical data
  return handleCacheFirst(request, DYNAMIC_CACHE);
}

/**
 * Handle image requests (cache-first with long TTL)
 */
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      // Cache images for longer periods
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('Image fetch failed:', error);
    // Return placeholder image for offline
    return fetch('/images/placeholder.jpg').catch(() => 
      new Response('Image not available offline', { status: 503 })
    );
  }
}

/**
 * Handle navigation requests
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);
    return response;
    
  } catch (error) {
    console.error('Navigation failed:', error);
    
    // Return cached version or offline page
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return cache.match('/offline.html') || 
           new Response('Offline', { status: 503 });
  }
}

/**
 * Handle generic requests
 */
async function handleGenericRequest(request) {
  return handleNetworkFirst(request, DYNAMIC_CACHE);
}

/**
 * Network-first strategy
 */
async function handleNetworkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.error('Network request failed:', error);
    
    // Try cache as fallback
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'This data is not available offline',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first strategy
 */
async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version and update in background
      fetchAndCache(request, cacheName);
      return cachedResponse;
    }
    
    // Not in cache, fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('Cache-first request failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Data unavailable',
        message: 'This data is not available offline',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Fetch and cache in background
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.error('Background fetch failed:', error);
  }
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !validCaches.includes(cacheName))
      .map(cacheName => {
        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

/**
 * Sync offline messages
 */
async function syncMessages() {
  console.log('📨 Service Worker: Syncing offline messages');
  
  try {
    // Get offline messages from IndexedDB
    const offlineMessages = await getOfflineData('messages');
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineData('messages', message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
    
  } catch (error) {
    console.error('Message sync failed:', error);
  }
}

/**
 * Sync offline listings
 */
async function syncListings() {
  console.log('📦 Service Worker: Syncing offline listings');
  
  try {
    const offlineListings = await getOfflineData('listings');
    
    for (const listing of offlineListings) {
      try {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(listing)
        });
        
        if (response.ok) {
          await removeOfflineData('listings', listing.id);
        }
      } catch (error) {
        console.error('Failed to sync listing:', error);
      }
    }
    
  } catch (error) {
    console.error('Listing sync failed:', error);
  }
}

/**
 * Sync user actions (likes, saves, etc.)
 */
async function syncUserActions() {
  console.log('👤 Service Worker: Syncing user actions');
  
  try {
    const offlineActions = await getOfflineData('user-actions');
    
    for (const action of offlineActions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.data)
        });
        
        if (response.ok) {
          await removeOfflineData('user-actions', action.id);
        }
      } catch (error) {
        console.error('Failed to sync user action:', error);
      }
    }
    
  } catch (error) {
    console.error('User action sync failed:', error);
  }
}

/**
 * Helper functions for IndexedDB operations
 */
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TradingPostOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TradingPostOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

/**
 * Request type detection
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/static/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.ico');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isNetworkFirstPattern(request) {
  const url = new URL(request.url);
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Cache management utilities
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'CACHE_STATS':
        getCacheStats().then(stats => {
          event.ports[0].postMessage(stats);
        });
        break;
        
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
        
      case 'UPDATE_CACHE':
        updateCache(event.data.urls).then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(name => caches.delete(name)));
}

async function updateCache(urls) {
  const cache = await caches.open(STATIC_CACHE);
  return cache.addAll(urls);
}

console.log('🚀 Service Worker: Initialized successfully');