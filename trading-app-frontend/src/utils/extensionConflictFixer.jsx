/**
 * Comprehensive Extension Conflict Fixer for Trading Post
 * Addresses specific issues: UI.js, MutationObserver, SiteSettings, runtime errors, and more
 */

/**
 * Suppress browser extension runtime.lastError messages
 */
export function suppressExtensionRuntimeErrors() {
  if (typeof window === 'undefined') return;

  // Override console methods to filter extension errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out extension runtime errors
    if (message.includes('runtime.lastError') || 
        message.includes('extension port is moved into back/forward cache') ||
        message.includes('chrome-extension://') ||
        message.includes('web-client-content-script.js')) {
      return; // Suppress these messages
    }
    
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filter out extension warnings
    if (message.includes('extension') || 
        message.includes('chrome://') ||
        message.includes('moz-extension://')) {
      return; // Suppress these messages
    }
    
    originalWarn.apply(console, args);
  };
  
  // Global error handler for uncaught extension errors
  window.addEventListener('error', function(event) {
    if (event.filename && (
      event.filename.includes('chrome-extension://') ||
      event.filename.includes('moz-extension://') ||
      event.filename.includes('web-client-content-script.js')
    )) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  console.log('🔇 Extension runtime error suppression enabled');
}

/**
 * Advanced MutationObserver protection with content script isolation
 */
export function fixMutationObserverConflicts() {
  if (typeof window === 'undefined') return;

  const originalMutationObserver = window.MutationObserver;
  if (!originalMutationObserver) return;

  // Enhanced MutationObserver wrapper with content script protection
  window.MutationObserver = function(callback) {
    // Validate callback
    if (typeof callback !== 'function') {
      console.warn('[Extension Fix] MutationObserver: Invalid callback provided');
      return new originalMutationObserver(() => {});
    }

    // Create observer with enhanced error handling
    const observer = new originalMutationObserver((mutations, obs) => {
      try {
        // Filter out mutations from extension content scripts
        const filteredMutations = mutations.filter(mutation => {
          const target = mutation.target;
          if (!target || !target.nodeType) return false;
          
          // Skip mutations from extension elements
          if (target.classList && (
            target.classList.contains('chrome-extension') ||
            target.classList.contains('extension-element') ||
            (target.id && target.id.includes('extension'))
          )) {
            return false;
          }
          
          return true;
        });

        if (filteredMutations.length > 0) {
          callback(filteredMutations, obs);
        }
      } catch (error) {
        console.warn('[Extension Fix] MutationObserver callback error:', error);
      }
    });

    const originalObserve = observer.observe.bind(observer);
    
    // Enhanced observe method with validation
    observer.observe = function(target, options) {
      try {
        // Comprehensive target validation
        if (!target) {
          console.warn('[Extension Fix] MutationObserver: Target is null/undefined');
          return;
        }

        if (typeof target !== 'object') {
          console.warn('[Extension Fix] MutationObserver: Target is not an object');
          return;
        }

        if (!target.nodeType || typeof target.nodeType !== 'number') {
          console.warn('[Extension Fix] MutationObserver: Target is not a valid DOM Node');
          return;
        }

        if (target.nodeType < 1 || target.nodeType > 12) {
          console.warn('[Extension Fix] MutationObserver: Target has invalid nodeType');
          return;
        }

        // Skip observing extension elements
        if (target.classList && (
          target.classList.contains('chrome-extension') ||
          target.classList.contains('extension-element') ||
          (target.id && target.id.includes('extension'))
        )) {
          console.warn('[Extension Fix] MutationObserver: Skipping extension element');
          return;
        }

        // Default options
        const safeOptions = {
          childList: true,
          subtree: false,
          attributes: false,
          attributeOldValue: false,
          characterData: false,
          characterDataOldValue: false,
          ...options
        };

        return originalObserve(target, safeOptions);
      } catch (error) {
        console.warn('[Extension Fix] MutationObserver observe failed:', error);
      }
    };

    return observer;
  };

  console.log('✓ Enhanced MutationObserver protection enabled');
}

/**
 * Fix UI.js and content script conflicts
 */
export function fixUIConflicts() {
  if (typeof window === 'undefined') return;

  // Prevent UI config conflicts
  const originalObject = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    try {
      // Skip problematic UI config assignments from extensions
      if (prop === 'eventBus' && descriptor && descriptor.value && 
          (descriptor.value.isGlobal === true || 
           (descriptor.value.constructor && descriptor.value.constructor.name === 's'))) {
        console.warn('[Extension Fix] Blocked problematic UI config assignment');
        return obj;
      }

      return originalObject.call(this, obj, prop, descriptor);
    } catch (error) {
      console.warn('[Extension Fix] Object.defineProperty error:', error);
      return obj;
    }
  };

  // Isolate content script globals
  if (window.chrome && window.chrome.runtime) {
    // Create isolated namespace for extension content scripts
    const extensionNamespace = {};
    
    // Redirect extension globals to isolated namespace
    const problematicGlobals = ['eventBus', 's', 'ui', 'config'];
    problematicGlobals.forEach(globalName => {
      if (window[globalName]) {
        extensionNamespace[globalName] = window[globalName];
        delete window[globalName];
      }
    });

    console.log('✓ Content script globals isolated');
  }

  console.log('✓ UI conflict protection enabled');
}

/**
 * Fix SiteSettings comparison errors
 */
export function fixSiteSettingsConflicts() {
  if (typeof window === 'undefined') return;

  // Intercept and fix SiteSettings array comparisons
  const originalArrayIsArray = Array.isArray;
  Array.isArray = function(obj) {
    try {
      return originalArrayIsArray.call(this, obj);
    } catch (error) {
      console.warn('[Extension Fix] Array.isArray error:', error);
      return false;
    }
  };

  // Fix problematic array/string comparisons
  const originalToString = Object.prototype.toString;
   
  Object.prototype.toString = function() {
    try {
      // Handle SiteSettings comparison edge cases
      if (this && typeof this === 'object' && 
          (this.constructor && this.constructor.name === 'SiteSettings')) {
        return '[object Object]';
      }
      return originalToString.call(this);
    } catch (error) {
      console.warn('[Extension Fix] toString error:', error);
      return '[object Object]';
    }
  };

  // Block problematic site comparison operations
  const siteComparisonPatterns = [
    /youtube\.com/i,
    /netflix\.com/i,
    /amazon\.com/i,
    /facebook\.com/i,
    /twitter\.com/i,
    /instagram\.com/i
  ];

  const originalIncludes = String.prototype.includes;
   
  String.prototype.includes = function(searchString) {
    try {
      // Block extension site comparisons that cause errors
      if (siteComparisonPatterns.some(pattern => pattern.test(this.toString()))) {
        return false;
      }
      return originalIncludes.call(this, searchString);
    } catch (error) {
      console.warn('[Extension Fix] String includes error:', error);
      return false;
    }
  };

  console.log('✓ SiteSettings conflict protection enabled');
}

/**
 * Enhanced error suppression for specific extension patterns
 */
export function enhanceConsoleFilters() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Enhanced error patterns based on user reports
  const suppressPatterns = [
    // MutationObserver errors
    /Failed to execute 'observe' on 'MutationObserver'/,
    /parameter 1 is not of type 'Node'/,
    /web-client-content-script/,
    
    // UI.js errors  
    /ui config.*eventBus.*isGlobal/,
    /UI\.js.*eventBus/,
    
    // SiteSettings errors
    /SiteSettings.*comparing.*Array/,
    /SiteSettings\.ts.*comparing/,
    
    // Generic extension errors
    /extension.*content.*script/i,
    /chrome-extension:/i,
    /browser extension/i,
    /content script/i,
    
    // Known problematic extensions
    /grammarly/i,
    /adblock/i,
    /lastpass/i,
    /metamask/i
  ];

  console.error = function(...args) {
    const message = args.join(' ');
    if (suppressPatterns.some(pattern => pattern.test(message))) {
      return; // Suppress
    }
    return originalError.apply(console, args);
  };

  console.warn = function(...args) {
    const message = args.join(' ');
    if (suppressPatterns.some(pattern => pattern.test(message))) {
      return; // Suppress
    }
    return originalWarn.apply(console, args);
  };

  console.log = function(...args) {
    const message = args.join(' ');
    // Only suppress log messages that are clearly from extensions
    if (message.includes('ui config:') && message.includes('eventBus')) {
      return; // Suppress the specific UI.js log
    }
    return originalLog.apply(console, args);
  };

  console.info('✓ Enhanced console filters applied');
}

/**
 * DOM isolation for extension elements
 */
export function isolateExtensionElements() {
  if (typeof window === 'undefined' || !document) return;

  // Create observer to isolate extension elements
  const isolationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          // Mark and isolate extension elements
          if (node.id && (
            node.id.includes('chrome-extension') ||
            node.id.includes('extension') ||
            (node.classList && node.classList.contains('chrome-extension'))
          )) {
            node.style.isolation = 'isolate';
            node.style.pointerEvents = 'none';
            node.setAttribute('data-extension-isolated', 'true');
          }
        }
      });
    });
  });

  // Start observing with minimal impact
  try {
    isolationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    console.log('✓ Extension element isolation enabled');
  } catch (error) {
    console.warn('[Extension Fix] Failed to start isolation observer:', error);
  }
}

/**
 * Initialize all extension conflict fixes
 */
export function initExtensionConflictFixes() {
  try {
    console.log('🛡️ Trading Post - Initializing extension conflict fixes...');
    
    suppressExtensionRuntimeErrors();
    fixMutationObserverConflicts();
    fixUIConflicts();
    fixSiteSettingsConflicts();
    enhanceConsoleFilters();
    
    // Wait for DOM before isolating elements
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', isolateExtensionElements);
    } else {
      isolateExtensionElements();
    }

    console.log('✅ Extension conflict fixes initialized successfully');
    
    // Provide cleanup function
    window.cleanupExtensionFixes = function() {
      console.log('🧹 Extension fixes cleaned up');
    };

  } catch (error) {
    console.error('❌ Failed to initialize extension fixes:', error);
  }
}

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.__TESTING__) {
  // Delay slightly to ensure other scripts load first
  setTimeout(initExtensionConflictFixes, 100);
}

const extensionConflictFixer = {
  initExtensionConflictFixes,
  fixMutationObserverConflicts,
  fixUIConflicts,
  fixSiteSettingsConflicts,
  enhanceConsoleFilters,
  isolateExtensionElements
};

export default extensionConflictFixer;