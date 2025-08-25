/**
 * Integration Service
 * Orchestrates all enhanced services and features
 */

import cacheService from './cacheService';
import imageOptimizationService from './imageOptimizationService';
import aiConfigService from './aiConfigService';
import aiVisionService from './aiVisionService';
import appwriteRealtime from './appwriteRealtime';

class IntegrationService {
  constructor() {
    this.initialized = false;
    this.services = {
      cache: cacheService,
      imageOptimization: imageOptimizationService,
      aiConfig: aiConfigService,
      aiVision: aiVisionService,
      realtime: appwriteRealtime
    };
  }

  /**
   * Initialize all services
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🚀 Trading Post: Initializing enhanced services...');

      // Register service worker
      await this.registerServiceWorker();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      // Setup error handling
      this.setupGlobalErrorHandling();

      // Initialize AI configuration
      await aiConfigService.validateConfiguration();

      this.initialized = true;
      console.log('✅ Trading Post: All enhanced services initialized successfully');

      // Log initial status
      this.logServiceStatus();

    } catch (error) {
      console.error('❌ Trading Post: Service initialization failed:', error);
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker: New version installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🆕 Service Worker: New version available');
            this.notifyServiceWorkerUpdate();
          }
        });
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor performance metrics
    if ('PerformanceObserver' in window) {
      try {
        // Monitor Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.logPerformanceMetric(entry);
          }
        });

        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }

    // Cache performance monitoring
    setInterval(() => {
      const cacheStats = cacheService.getStats();
      console.log('📊 Cache Performance:', {
        hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
        entries: cacheStats.entries,
        memoryUsage: `${cacheStats.memoryUsageMB}MB`
      });
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Setup global error handling
   */
  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Don't prevent default for development
      if (process.env.NODE_ENV === 'production') {
        event.preventDefault();
      }
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated by service worker');
        break;
      case 'OFFLINE_ACTION_QUEUED':
        console.log('📴 Action queued for when online:', data);
        break;
      case 'BACKGROUND_SYNC_COMPLETE':
        console.log('🔄 Background sync completed:', data);
        break;
    }
  }

  /**
   * Notify about service worker updates
   */
  notifyServiceWorkerUpdate() {
    // Could show a toast or modal to user
    console.log('New version available. Please refresh to update.');
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(entry) {
    if (entry.entryType === 'navigation') {
      console.log('🚀 Navigation Performance:', {
        domContentLoaded: `${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`,
        loadComplete: `${entry.loadEventEnd - entry.loadEventStart}ms`,
        totalTime: `${entry.loadEventEnd - entry.fetchStart}ms`
      });
    } else if (entry.entryType === 'paint') {
      console.log(`🎨 ${entry.name}: ${entry.startTime}ms`);
    }
  }

  /**
   * Log service status
   */
  logServiceStatus() {
    console.group('🔧 Trading Post Service Status');
    
    // Cache Service
    const cacheStats = cacheService.getStats();
    console.log('📦 Cache Service:', {
      status: 'Active',
      entries: cacheStats.entries,
      hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`
    });

    // Image Optimization
    const imageStats = imageOptimizationService.getStats();
    console.log('🖼️ Image Optimization:', {
      status: 'Active',
      webpSupported: imageStats.webpSupported,
      imagesLoaded: imageStats.imagesLoaded
    });

    // AI Configuration
    const aiStatus = aiConfigService.getConfigSummary();
    console.log('🤖 AI Services:', {
      status: aiStatus.ready ? 'Ready' : 'Limited',
      configured: aiStatus.openai.configured,
      usage: aiStatus.usage
    });

    // Real-time Services
    const realtimeHealth = appwriteRealtime.healthCheck();
    console.log('📡 Real-time Services:', {
      status: realtimeHealth.status,
      subscriptions: realtimeHealth.activeSubscriptions
    });

    console.groupEnd();
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      initialized: this.initialized,
      services: {
        cache: {
          status: 'active',
          stats: cacheService.getStats()
        },
        imageOptimization: {
          status: 'active',
          stats: imageOptimizationService.getStats()
        },
        ai: {
          status: aiConfigService.isAPIReady() ? 'ready' : 'limited',
          config: aiConfigService.getConfigSummary()
        },
        realtime: {
          status: 'active',
          health: appwriteRealtime.healthCheck()
        }
      },
      performance: this.getPerformanceMetrics()
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (!navigation) return null;

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  }

  /**
   * Update service worker cache
   */
  async updateServiceWorkerCache(urls) {
    if (!navigator.serviceWorker.controller) return;

    try {
      const messageChannel = new MessageChannel();
      
      const response = await new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_CACHE',
          urls: urls
        }, [messageChannel.port2]);
      });

      console.log('🔄 Service worker cache updated:', response);
    } catch (error) {
      console.error('Failed to update service worker cache:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    try {
      // Clear application cache
      cacheService.clear();

      // Clear service worker caches
      if (navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE'
        }, [messageChannel.port2]);
      }

      console.log('🧹 All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Cleanup all services
   */
  cleanup() {
    try {
      // Cleanup services
      imageOptimizationService.destroy();
      appwriteRealtime.unsubscribeAll();
      cacheService.clear();

      this.initialized = false;
      console.log('🧹 All services cleaned up');
    } catch (error) {
      console.error('Service cleanup error:', error);
    }
  }
}

// Export singleton instance
const integrationService = new IntegrationService();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  integrationService.cleanup();
});

export default integrationService;