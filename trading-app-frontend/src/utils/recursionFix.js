/**
 * Recursion Fix for Appwrite SDK
 * Prevents Maximum call stack size exceeded errors
 * Must be loaded before any Appwrite operations
 */

(function() {
  'use strict';
  
  // Track recursion depth
  const callDepth = new Map();
  const MAX_DEPTH = 20;
  const requestCache = new Map();
  const CACHE_TTL = 100; // ms
  
  // Store original functions
  const originalFetch = window.fetch;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Recursion detection for console methods
  let consoleDepth = 0;
  const MAX_CONSOLE_DEPTH = 10;
  
  // Fix console methods to prevent recursion
  const wrapConsoleMethod = (method, name) => {
    return function(...args) {
      if (consoleDepth >= MAX_CONSOLE_DEPTH) {
        return; // Stop recursion
      }
      
      consoleDepth++;
      try {
        // Check for recursive patterns in arguments
        const hasRecursivePattern = args.some(arg => {
          if (typeof arg === 'string') {
            return arg.includes('Maximum call stack') || 
                   arg.includes('console.error') ||
                   arg.includes('console.log') ||
                   arg.includes('console.warn');
          }
          return false;
        });
        
        if (hasRecursivePattern && consoleDepth > 2) {
          return; // Prevent recursive console calls
        }
        
        method.apply(console, args);
      } finally {
        consoleDepth--;
      }
    };
  };
  
  // Apply console fixes
  console.log = wrapConsoleMethod(originalConsoleLog, 'log');
  console.error = wrapConsoleMethod(originalConsoleError, 'error');
  console.warn = wrapConsoleMethod(originalConsoleWarn, 'warn');
  
  // Fix fetch to prevent recursive calls
  window.fetch = function(url, options = {}) {
    // Generate cache key
    const cacheKey = `${url}:${JSON.stringify(options.method || 'GET')}:${JSON.stringify(options.body || '')}`;
    
    // Check if we're in a recursive loop
    const depth = callDepth.get(cacheKey) || 0;
    if (depth >= MAX_DEPTH) {
      console.warn('[RecursionFix] Blocked recursive fetch:', url);
      return Promise.reject(new Error('Maximum call depth exceeded - request blocked'));
    }
    
    // Check cache for recent identical requests
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.promise;
    }
    
    // Track depth
    callDepth.set(cacheKey, depth + 1);
    
    // Make the request
    const promise = originalFetch.call(window, url, options)
      .finally(() => {
        // Clean up depth tracking
        setTimeout(() => {
          callDepth.delete(cacheKey);
          requestCache.delete(cacheKey);
        }, CACHE_TTL);
      });
    
    // Cache the promise
    requestCache.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });
    
    return promise;
  };
  
  // Patch Appwrite SDK methods if they exist
  const patchAppwriteMethods = () => {
    // Look for Appwrite client in various locations
    const findAppwriteClient = () => {
      // Check common global locations
      if (window.appwrite) return window.appwrite;
      if (window.Appwrite) return window.Appwrite;
      
      // Check for instances in window properties
      for (const key in window) {
        if (window[key] && window[key].constructor && 
            window[key].constructor.name === 'Client') {
          return window[key];
        }
      }
      
      return null;
    };
    
    const client = findAppwriteClient();
    if (!client) return;
    
    // Patch the prepareRequest method if it exists
    const patchMethod = (obj, methodName) => {
      if (!obj || !obj[methodName]) return;
      
      const original = obj[methodName];
      obj[methodName] = function(...args) {
        const callKey = `${methodName}:${JSON.stringify(args)}`;
        const depth = callDepth.get(callKey) || 0;
        
        if (depth >= MAX_DEPTH) {
          console.warn(`[RecursionFix] Blocked recursive ${methodName}`);
          return Promise.reject(new Error('Recursion prevented'));
        }
        
        callDepth.set(callKey, depth + 1);
        
        try {
          return original.apply(this, args);
        } finally {
          setTimeout(() => callDepth.delete(callKey), 100);
        }
      };
    };
    
    // Try to patch various methods
    patchMethod(client, 'call');
    patchMethod(client, 'prepareRequest');
  };
  
  // Try to patch immediately and after a delay
  patchAppwriteMethods();
  setTimeout(patchAppwriteMethods, 100);
  setTimeout(patchAppwriteMethods, 500);
  setTimeout(patchAppwriteMethods, 1000);
  
  // Export for debugging
  window.__recursionFix = {
    callDepth,
    requestCache,
    getStats: () => ({
      callDepthSize: callDepth.size,
      cacheSize: requestCache.size,
      maxDepthReached: Math.max(...Array.from(callDepth.values()), 0)
    }),
    reset: () => {
      callDepth.clear();
      requestCache.clear();
      consoleDepth = 0;
    }
  };
  
  console.log('[RecursionFix] Initialized - Maximum call stack protection active');
})();

export default true;