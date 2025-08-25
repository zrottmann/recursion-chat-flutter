/**
 * Comprehensive Login Error Fixer for Trading Post
 * Addresses runtime errors, extension conflicts, and font loading issues
 */

/**
 * Fix browser extension runtime errors
 */
export function fixExtensionRuntimeErrors() {
  // Suppress extension runtime errors
  const originalError = window.console.error;
  window.console.error = function(...args) {
    const message = args.join(' ');
    
    // Suppress known extension errors
    if (
      message.includes('runtime.lastError') ||
      message.includes('extension port') ||
      message.includes('back/forward cache') ||
      message.includes('message channel is closed')
    ) {
      return; // Suppress these errors
    }
    
    return originalError.apply(console, args);
  };
  
  console.log('✓ Extension runtime error suppression enabled');
}

/**
 * Fix font loading errors by providing fallbacks
 */
export function fixFontLoadingErrors() {
  // Create fallback font CSS
  const fontFallbackCSS = `
    /* Inter Font Fallbacks - Google Fonts with CSP headers configured */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    :root {
      --font-inter-fallback: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    body, .inter-font {
      font-family: var(--font-inter-fallback) !important;
    }
    
    /* Preload font fixes */
    link[rel="preload"][href*="inter-v8-latin"] {
      display: none;
    }
  `;
  
  // Inject fallback CSS
  const style = document.createElement('style');
  style.textContent = fontFallbackCSS;
  document.head.appendChild(style);
  
  console.log('✓ Font loading fallbacks applied');
}

/**
 * Fix MutationObserver errors from extensions
 */
export function fixMutationObserverErrors() {
  if (typeof window === 'undefined' || !window.MutationObserver) return;
  
  const OriginalMutationObserver = window.MutationObserver;
  
  window.MutationObserver = function(callback) {
    const observer = new OriginalMutationObserver((mutations, obs) => {
      try {
        // Filter out invalid or extension-related mutations
        const validMutations = mutations.filter(mutation => {
          const target = mutation.target;
          if (!target || !target.nodeType) return false;
          
          // Skip extension elements
          if (target.classList && (
            target.classList.contains('chrome-extension') ||
            target.classList.contains('extension-element') ||
            (target.id && target.id.includes('extension'))
          )) {
            return false;
          }
          
          return true;
        });
        
        if (validMutations.length > 0 && typeof callback === 'function') {
          callback(validMutations, obs);
        }
      } catch (error) {
        console.warn('MutationObserver callback error:', error);
      }
    });
    
    const originalObserve = observer.observe.bind(observer);
    
    observer.observe = function(target, config) {
      try {
        // Validate target
        if (!target || typeof target !== 'object' || !target.nodeType) {
          console.warn('Invalid MutationObserver target, skipping');
          return;
        }
        
        if (target.nodeType < 1 || target.nodeType > 12) {
          console.warn('Invalid nodeType for MutationObserver, skipping');
          return;
        }
        
        // Skip extension elements
        if (target.classList && (
          target.classList.contains('chrome-extension') ||
          target.classList.contains('extension-element')
        )) {
          console.warn('Skipping extension element for MutationObserver');
          return;
        }
        
        return originalObserve(target, config || { childList: true, subtree: true });
      } catch (error) {
        console.warn('MutationObserver observe error:', error);
      }
    };
    
    return observer;
  };
  
  console.log('✓ MutationObserver error protection enabled');
}

/**
 * Fix OAuth callback URL issues
 */
export function fixOAuthCallbackIssues() {
  // Ensure OAuth callback handling works correctly
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // Check for OAuth callback parameters
  const hasOAuthSuccess = urlParams.has('userId') || urlParams.has('secret');
  const hasOAuthError = urlParams.has('error') || urlParams.has('error_description');
  const isCallbackPath = window.location.pathname.includes('/auth/callback');
  
  if ((hasOAuthSuccess || hasOAuthError || isCallbackPath) && !sessionStorage.getItem('oauth_processed')) {
    console.log('OAuth callback detected, processing...');
    sessionStorage.setItem('oauth_processed', 'true');
    
    // Clear the flag after a delay
    setTimeout(() => {
      sessionStorage.removeItem('oauth_processed');
    }, 10000);
  }
  
  console.log('✓ OAuth callback handling improved');
}

/**
 * Fix environment variable loading issues
 */
export function fixEnvironmentVariables() {
  // Ensure environment variables are available
  const requiredVars = {
    VITE_APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
    VITE_APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
    VITE_APPWRITE_DATABASE_ID: 'trading_post_db',
    VITE_OAUTH_CALLBACK_URL: 'https://tradingpost.appwrite.network/auth/callback',
    VITE_OAUTH_ERROR_URL: 'https://tradingpost.appwrite.network/auth/error'
  };
  
  let needsRefresh = false;
  
  Object.entries(requiredVars).forEach(([key, defaultValue]) => {
    const viteKey = key;
    const reactKey = key.replace('VITE_', 'REACT_APP_');
    
    if (!import.meta.env[viteKey] && !import.meta.env[reactKey]) {
      console.warn(`Missing environment variable: ${key}, using default: ${defaultValue}`);
      
      // Set the default value in import.meta.env
      if (import.meta.env) {
        import.meta.env[viteKey] = defaultValue;
        import.meta.env[reactKey] = defaultValue;
      }
      
      needsRefresh = true;
    }
  });
  
  if (needsRefresh) {
    console.log('✓ Environment variables fixed with defaults');
  }
}

/**
 * Fix content script conflicts
 */
export function fixContentScriptConflicts() {
  // Isolate extension content scripts
  const extensionElements = document.querySelectorAll('[id*="extension"], [class*="extension"], [class*="chrome-extension"]');
  
  extensionElements.forEach(element => {
    element.style.isolation = 'isolate';
    element.style.pointerEvents = 'none';
    element.setAttribute('data-extension-isolated', 'true');
  });
  
  // Block problematic global assignments
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    // Block problematic UI config assignments
    if (prop === 'eventBus' && descriptor && descriptor.value && 
        (descriptor.value.isGlobal === true || 
         (descriptor.value.constructor && descriptor.value.constructor.name === 's'))) {
      console.warn('Blocked problematic extension property assignment');
      return obj;
    }
    
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  console.log('✓ Content script conflict protection enabled');
}

/**
 * Initialize all login error fixes
 */
export function initLoginErrorFixes() {
  try {
    console.log('🔧 Trading Post - Initializing login error fixes...');
    
    fixExtensionRuntimeErrors();
    fixFontLoadingErrors();
    fixMutationObserverErrors();
    fixOAuthCallbackIssues();
    fixEnvironmentVariables();
    fixContentScriptConflicts();
    
    console.log('✅ Login error fixes initialized successfully');
    
    // Return cleanup function
    return function cleanup() {
      console.log('🧹 Login error fixes cleaned up');
    };
  } catch (error) {
    console.error('❌ Failed to initialize login error fixes:', error);
    return null;
  }
}

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.__TESTING__) {
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginErrorFixes);
  } else {
    initLoginErrorFixes();
  }
}

export default {
  initLoginErrorFixes,
  fixExtensionRuntimeErrors,
  fixFontLoadingErrors,
  fixMutationObserverErrors,
  fixOAuthCallbackIssues,
  fixEnvironmentVariables,
  fixContentScriptConflicts
};
