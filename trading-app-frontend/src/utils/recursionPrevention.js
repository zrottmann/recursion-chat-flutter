/**
 * Comprehensive Recursion Prevention System
 * Prevents infinite loops in fetch interceptors, console methods, and API calls
 */

(function() {
  'use strict';
  
  // === RECURSION DETECTION SYSTEM ===
  const callStack = new Map();
  const MAX_DEPTH = 10;
  const BLOCKED_PATTERNS = new Set();
  
  // Store original functions before any modifications
  const ORIGINALS = {
    fetch: window.fetch,
    consoleLog: console.log,
    consoleError: console.error,
    consoleWarn: console.warn,
    consoleInfo: console.info
  };
  
  // === FETCH RECURSION PREVENTION ===
  let fetchDepth = 0;
  const pendingFetches = new Map();
  
  window.fetch = function(url, options = {}) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    // CRITICAL: Skip interception for Appwrite API calls to prevent recursion
    if (urlStr.includes('nyc.cloud.appwrite.io') || 
        urlStr.includes('api.appwrite.io') ||
        urlStr.includes('/v1/databases') ||
        urlStr.includes('/v1/storage') ||
        urlStr.includes('/v1/account')) {
      console.log('[RecursionPrevention] Bypassing interception for Appwrite API:', urlStr);
      return ORIGINALS.fetch.apply(window, arguments);
    }
    
    // Check recursion depth
    if (fetchDepth > MAX_DEPTH) {
      console.warn('[RecursionPrevention] Fetch recursion blocked at depth:', fetchDepth, 'URL:', urlStr);
      return Promise.reject(new Error('Fetch recursion prevented'));
    }
    
    // Check for duplicate concurrent requests
    const requestKey = `${options.method || 'GET'}:${urlStr}:${JSON.stringify(options.body || '')}`;
    if (pendingFetches.has(requestKey)) {
      console.log('[RecursionPrevention] Reusing pending fetch for:', urlStr);
      return pendingFetches.get(requestKey);
    }
    
    fetchDepth++;
    
    // Make the actual request
    const fetchPromise = ORIGINALS.fetch.apply(window, arguments)
      .finally(() => {
        fetchDepth--;
        pendingFetches.delete(requestKey);
      });
    
    // Cache the promise for deduplication
    pendingFetches.set(requestKey, fetchPromise);
    
    return fetchPromise;
  };
  
  // === CONSOLE RECURSION PREVENTION ===
  let consoleDepth = 0;
  const MAX_CONSOLE_DEPTH = 5;
  
  const wrapConsole = (original, name) => {
    return function(...args) {
      if (consoleDepth >= MAX_CONSOLE_DEPTH) {
        return; // Stop console recursion
      }
      
      // Check for recursive error messages
      const hasRecursiveContent = args.some(arg => {
        if (typeof arg === 'string') {
          return arg.includes('Maximum call stack') || 
                 arg.includes('RangeError') ||
                 (arg.includes('console.') && consoleDepth > 1);
        }
        return false;
      });
      
      if (hasRecursiveContent && consoleDepth > 1) {
        return; // Skip recursive console calls
      }
      
      consoleDepth++;
      try {
        original.apply(console, args);
      } finally {
        consoleDepth--;
      }
    };
  };
  
  // Apply console wrappers
  console.log = wrapConsole(ORIGINALS.consoleLog, 'log');
  console.error = wrapConsole(ORIGINALS.consoleError, 'error');
  console.warn = wrapConsole(ORIGINALS.consoleWarn, 'warn');
  console.info = wrapConsole(ORIGINALS.consoleInfo, 'info');
  
  // === API ADAPTER RECURSION FIX ===
  // Mark when we're inside an API handler to prevent re-interception
  window.__insideApiHandler = false;
  
  // === EXPORT DEBUGGING INTERFACE ===
  window.__recursionPrevention = {
    getStats: () => ({
      fetchDepth,
      consoleDepth,
      pendingFetches: pendingFetches.size,
      blockedPatterns: BLOCKED_PATTERNS.size
    }),
    reset: () => {
      fetchDepth = 0;
      consoleDepth = 0;
      pendingFetches.clear();
      BLOCKED_PATTERNS.clear();
      window.__insideApiHandler = false;
    },
    getOriginals: () => ORIGINALS,
    isInsideApiHandler: () => window.__insideApiHandler
  };
  
  console.log('[RecursionPrevention] System initialized - protecting against infinite loops');
})();

export default true;