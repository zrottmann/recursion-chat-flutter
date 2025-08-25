/**
 * Advanced Caching Service
 * Provides Redis-style caching for API responses with intelligent cache management
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.config = {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxSize: 500, // Maximum number of cache entries
      compressionThreshold: 1024, // Compress data larger than 1KB
      persistentCache: true, // Use localStorage for persistence
      enableLRU: true, // Least Recently Used eviction
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0
    };
    
    this.listeners = new Set();
    this.cleanupInterval = null;
    
    this.initializeCache();
  }

  /**
   * Initialize cache with persistent storage
   */
  async initializeCache() {
    try {
      // Load persistent cache if enabled
      if (this.config.persistentCache) {
        await this.loadPersistentCache();
      }
      
      // Start cleanup interval
      this.startCleanupInterval();
      
      console.log('📦 Cache service initialized');
      
    } catch (error) {
      console.error('Cache initialization failed:', error);
    }
  }

  /**
   * Get value from cache
   */
  get(key, options = {}) {
    try {
      const { 
        refresh = false, 
        updateAccess = true 
      } = options;
      
      if (refresh) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }
      
      const item = this.cache.get(key);
      const meta = this.metadata.get(key);
      
      if (!item || !meta) {
        this.stats.misses++;
        return null;
      }
      
      // Check expiration
      if (Date.now() > meta.expiresAt) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }
      
      // Update access time for LRU
      if (updateAccess) {
        meta.lastAccessed = Date.now();
        meta.accessCount++;
      }
      
      this.stats.hits++;
      this.notifyListeners('cache_hit', { key, size: meta.size });
      
      // Decompress if needed
      if (meta.compressed) {
        return this.decompress(item);
      }
      
      return item;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, options = {}) {
    try {
      const {
        ttl = this.config.defaultTTL,
        tags = [],
        priority = 'normal',
        compress = null
      } = options;
      
      // Check if we need to make space
      if (this.cache.size >= this.config.maxSize) {
        this.evictLRU();
      }
      
      const serialized = this.serialize(value);
      const size = this.calculateSize(serialized);
      const shouldCompress = compress !== false && 
        (compress === true || size > this.config.compressionThreshold);
      
      const item = shouldCompress ? this.compress(serialized) : serialized;
      const metadata = {
        key,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        expiresAt: Date.now() + ttl,
        size: this.calculateSize(item),
        originalSize: size,
        compressed: shouldCompress,
        tags: Array.from(new Set(tags)),
        priority: priority,
        accessCount: 1,
        ttl: ttl
      };
      
      this.cache.set(key, item);
      this.metadata.set(key, metadata);
      
      this.stats.sets++;
      this.updateMemoryUsage();
      this.notifyListeners('cache_set', { key, size: metadata.size, ttl });
      
      // Persist if enabled
      if (this.config.persistentCache) {
        this.persistKey(key);
      }
      
      return true;
      
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    try {
      const existed = this.cache.has(key);
      
      if (existed) {
        this.cache.delete(key);
        this.metadata.delete(key);
        this.stats.deletes++;
        this.updateMemoryUsage();
        this.notifyListeners('cache_delete', { key });
        
        // Remove from persistent storage
        if (this.config.persistentCache) {
          this.removePersistentKey(key);
        }
      }
      
      return existed;
      
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    const meta = this.metadata.get(key);
    if (!meta) return false;
    
    // Check expiration
    if (Date.now() > meta.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(options = {}) {
    try {
      const { tags = null } = options;
      
      if (tags) {
        // Clear entries with specific tags
        for (const [key, meta] of this.metadata) {
          if (meta.tags.some(tag => tags.includes(tag))) {
            this.delete(key);
          }
        }
      } else {
        // Clear all entries
        const count = this.cache.size;
        this.cache.clear();
        this.metadata.clear();
        this.updateMemoryUsage();
        this.notifyListeners('cache_clear', { count });
        
        // Clear persistent storage
        if (this.config.persistentCache) {
          this.clearPersistentCache();
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, meta] of this.metadata) {
      if (meta.lastAccessed < oldestTime) {
        oldestTime = meta.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      this.notifyListeners('cache_eviction', { key: oldestKey, reason: 'lru' });
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, meta] of this.metadata) {
      if (now > meta.expiresAt) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => this.delete(key));
    
    if (expired.length > 0) {
      this.notifyListeners('cache_cleanup', { expired: expired.length });
    }
    
    return expired.length;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsageMB: Math.round(this.stats.memoryUsage / 1024 / 1024 * 100) / 100,
      entries: this.cache.size,
      maxSize: this.config.maxSize,
      fillRate: this.cache.size / this.config.maxSize
    };
  }

  /**
   * Get all cache keys with metadata
   */
  getKeys(options = {}) {
    const { 
      tags = null, 
      pattern = null, 
      includeExpired = false 
    } = options;
    
    const keys = [];
    const now = Date.now();
    
    for (const [key, meta] of this.metadata) {
      // Skip expired entries
      if (!includeExpired && now > meta.expiresAt) {
        continue;
      }
      
      // Filter by tags
      if (tags && !meta.tags.some(tag => tags.includes(tag))) {
        continue;
      }
      
      // Filter by pattern
      if (pattern && !key.match(pattern)) {
        continue;
      }
      
      keys.push({
        key,
        metadata: { ...meta }
      });
    }
    
    return keys;
  }

  /**
   * Update TTL for existing entry
   */
  updateTTL(key, newTTL) {
    const meta = this.metadata.get(key);
    if (!meta) return false;
    
    meta.expiresAt = Date.now() + newTTL;
    meta.ttl = newTTL;
    
    this.notifyListeners('cache_ttl_update', { key, ttl: newTTL });
    return true;
  }

  /**
   * Get or set value with callback
   */
  async getOrSet(key, callback, options = {}) {
    try {
      // Try to get from cache first
      let value = this.get(key);
      
      if (value !== null) {
        return value;
      }
      
      // Value not in cache, call callback to get it
      value = await callback();
      
      if (value !== null && value !== undefined) {
        this.set(key, value, options);
      }
      
      return value;
      
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      throw error;
    }
  }

  /**
   * Serialize value for storage
   */
  serialize(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('Serialization error:', error);
      return String(value);
    }
  }

  /**
   * Deserialize value from storage
   */
  deserialize(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  /**
   * Compress data (simple LZ-string-like compression)
   */
  compress(data) {
    // Simple compression using built-in methods
    if (typeof data === 'string') {
      // Use a simple compression for demo
      return btoa(encodeURIComponent(data));
    }
    return data;
  }

  /**
   * Decompress data
   */
  decompress(data) {
    try {
      if (typeof data === 'string') {
        return decodeURIComponent(atob(data));
      }
      return data;
    } catch (error) {
      console.error('Decompression error:', error);
      return data;
    }
  }

  /**
   * Calculate data size in bytes
   */
  calculateSize(data) {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  /**
   * Update memory usage statistics
   */
  updateMemoryUsage() {
    let totalSize = 0;
    for (const meta of this.metadata.values()) {
      totalSize += meta.size;
    }
    this.stats.memoryUsage = totalSize;
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Load persistent cache from localStorage
   */
  async loadPersistentCache() {
    try {
      const keys = JSON.parse(localStorage.getItem('cache_keys') || '[]');
      
      for (const key of keys) {
        try {
          const itemData = localStorage.getItem(`cache_${key}`);
          const metaData = localStorage.getItem(`cache_meta_${key}`);
          
          if (itemData && metaData) {
            const meta = JSON.parse(metaData);
            
            // Check if not expired
            if (Date.now() < meta.expiresAt) {
              this.cache.set(key, itemData);
              this.metadata.set(key, meta);
            } else {
              // Remove expired entries
              this.removePersistentKey(key);
            }
          }
        } catch (error) {
          console.error(`Failed to load cache key ${key}:`, error);
        }
      }
      
      this.updateMemoryUsage();
      
    } catch (error) {
      console.error('Failed to load persistent cache:', error);
    }
  }

  /**
   * Persist cache key to localStorage
   */
  persistKey(key) {
    try {
      const item = this.cache.get(key);
      const meta = this.metadata.get(key);
      
      if (item && meta) {
        localStorage.setItem(`cache_${key}`, item);
        localStorage.setItem(`cache_meta_${key}`, JSON.stringify(meta));
        
        // Update keys list
        const keys = JSON.parse(localStorage.getItem('cache_keys') || '[]');
        if (!keys.includes(key)) {
          keys.push(key);
          localStorage.setItem('cache_keys', JSON.stringify(keys));
        }
      }
    } catch (error) {
      console.error('Failed to persist cache key:', error);
    }
  }

  /**
   * Remove persistent cache key
   */
  removePersistentKey(key) {
    try {
      localStorage.removeItem(`cache_${key}`);
      localStorage.removeItem(`cache_meta_${key}`);
      
      // Update keys list
      const keys = JSON.parse(localStorage.getItem('cache_keys') || '[]');
      const filtered = keys.filter(k => k !== key);
      localStorage.setItem('cache_keys', JSON.stringify(filtered));
      
    } catch (error) {
      console.error('Failed to remove persistent cache key:', error);
    }
  }

  /**
   * Clear persistent cache
   */
  clearPersistentCache() {
    try {
      const keys = JSON.parse(localStorage.getItem('cache_keys') || '[]');
      
      for (const key of keys) {
        localStorage.removeItem(`cache_${key}`);
        localStorage.removeItem(`cache_meta_${key}`);
      }
      
      localStorage.removeItem('cache_keys');
      
    } catch (error) {
      console.error('Failed to clear persistent cache:', error);
    }
  }

  /**
   * Subscribe to cache events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of cache events
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Cache listener error:', error);
      }
    });
  }

  /**
   * Export cache data
   */
  export() {
    const data = {};
    const metadata = {};
    
    for (const [key, value] of this.cache) {
      data[key] = value;
      metadata[key] = this.metadata.get(key);
    }
    
    return {
      data,
      metadata,
      stats: this.stats,
      config: this.config,
      timestamp: Date.now()
    };
  }

  /**
   * Import cache data
   */
  import(exportData) {
    try {
      this.clear();
      
      for (const [key, value] of Object.entries(exportData.data)) {
        const meta = exportData.metadata[key];
        if (meta && Date.now() < meta.expiresAt) {
          this.cache.set(key, value);
          this.metadata.set(key, meta);
        }
      }
      
      this.updateMemoryUsage();
      this.notifyListeners('cache_import', { 
        imported: Object.keys(exportData.data).length 
      });
      
      return true;
      
    } catch (error) {
      console.error('Cache import error:', error);
      return false;
    }
  }

  /**
   * Destroy cache service
   */
  destroy() {
    this.stopCleanupInterval();
    this.clear();
    this.listeners.clear();
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  cacheService.destroy();
});

export default cacheService;