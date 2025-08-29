/**
 * Runtime Recursion Fix
 * This file is loaded directly in index.html before any other scripts
 */
(function() {
  const MAX_DEPTH = 15;
  const callTracking = new Map();
  const blockedPatterns = new Set();
  
  // Original functions
  const originalFetch = window.fetch;
  const origConsoleError = console.error;
  const origConsoleWarn = console.warn;
  const origConsoleLog = console.log;
  
  // Track console recursion
  let consoleCallDepth = 0;
  
  // Wrap console methods
  const safeConsole = (original, name) => {
    return function(...args) {
      if (consoleCallDepth > 5) {
        return; // Stop console recursion
      }
      consoleCallDepth++;
      try {
        // Filter out recursive error messages
        const filtered = args.filter(arg => {
          if (typeof arg === 'string') {
            return !arg.includes('Maximum call stack') || consoleCallDepth === 1;
          }
          return true;
        });
        if (filtered.length > 0) {
          original.apply(console, filtered);
        }
      } catch (e) {
        // Silently fail
      } finally {
        consoleCallDepth--;
      }
    };
  };
  
  console.error = safeConsole(origConsoleError, 'error');
  console.warn = safeConsole(origConsoleWarn, 'warn');
  console.log = safeConsole(origConsoleLog, 'log');
  
  // Intercept fetch to prevent loops
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init && init.method) || 'GET';
    const key = `${method}:${url}`;
    
    // Check recursion depth
    const currentDepth = callTracking.get(key) || 0;
    if (currentDepth >= MAX_DEPTH) {
      blockedPatterns.add(key);
      const error = new Error('Fetch recursion blocked');
      error.recursionBlocked = true;
      return Promise.reject(error);
    }
    
    // Check if this pattern was blocked before
    if (blockedPatterns.has(key)) {
      const error = new Error('Previously blocked recursive pattern');
      error.recursionBlocked = true;
      return Promise.reject(error);
    }
    
    // Track the call
    callTracking.set(key, currentDepth + 1);
    
    // Make the actual request
    return originalFetch.apply(window, arguments)
      .finally(() => {
        // Decrease depth after request completes
        const depth = callTracking.get(key) || 1;
        if (depth <= 1) {
          callTracking.delete(key);
        } else {
          callTracking.set(key, depth - 1);
        }
      });
  };
  
  // Monitor for Appwrite SDK and patch it
  let patchAttempts = 0;
  const patchAppwrite = () => {
    patchAttempts++;
    
    // Try to find and patch Se class methods
    try {
      // Look for minified Appwrite methods in global scope
      for (const key in window) {
        const obj = window[key];
        if (obj && typeof obj === 'object') {
          // Look for prepareRequest or call methods
          if (obj.prepareRequest && obj.call) {
            // Found likely Appwrite client
            const origCall = obj.call;
            const origPrepare = obj.prepareRequest;
            
            obj.call = function(...args) {
              const depth = callTracking.get('appwrite-call') || 0;
              if (depth > 10) {
                return Promise.reject(new Error('Appwrite call recursion blocked'));
              }
              callTracking.set('appwrite-call', depth + 1);
              return origCall.apply(this, args)
                .finally(() => {
                  callTracking.set('appwrite-call', Math.max(0, depth));
                });
            };
            
            obj.prepareRequest = function(...args) {
              const depth = callTracking.get('appwrite-prepare') || 0;
              if (depth > 10) {
                throw new Error('Appwrite prepareRequest recursion blocked');
              }
              callTracking.set('appwrite-prepare', depth + 1);
              try {
                return origPrepare.apply(this, args);
              } finally {
                callTracking.set('appwrite-prepare', Math.max(0, depth));
              }
            };
            
            console.log('[RecursionFix] Patched Appwrite client methods');
            return true;
          }
        }
      }
    } catch (e) {
      // Silently fail
    }
    
    // Retry a few times
    if (patchAttempts < 10) {
      setTimeout(patchAppwrite, 500);
    }
  };
  
  // Start patching attempts
  setTimeout(patchAppwrite, 100);
  
  // Export debugging interface
  window.__recursionBlocker = {
    stats: () => ({
      trackedCalls: callTracking.size,
      blockedPatterns: blockedPatterns.size,
      patterns: Array.from(blockedPatterns)
    }),
    reset: () => {
      callTracking.clear();
      blockedPatterns.clear();
      consoleCallDepth = 0;
    }
  };
})();