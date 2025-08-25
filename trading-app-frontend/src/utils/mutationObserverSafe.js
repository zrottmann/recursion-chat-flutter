/**
 * Safe MutationObserver utility
 * Fixes "parameter 1 is not of type 'Node'" errors
 */

export class SafeMutationObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.observer = null;
    this.observedNodes = new Set();
  }

  /**
   * Safely observe a DOM node
   * @param {Node|Element|string} target - Node to observe or selector
   * @param {Object} config - MutationObserver config
   */
  observe(target, config = {}) {
    try {
      // Resolve target if it's a string selector
      if (typeof target === 'string') {
        target = document.querySelector(target);
      }

      // Validate target is a valid Node
      if (!this.isValidNode(target)) {
        console.warn('SafeMutationObserver: Invalid target node', target);
        return false;
      }

      // Create observer if not exists
      if (!this.observer) {
        this.observer = new MutationObserver(this.callback);
      }

      // Merge options
      const observerConfig = {
        childList: true,
        subtree: true,
        attributes: false,
        ...this.options,
        ...config
      };

      // Start observing
      this.observer.observe(target, observerConfig);
      this.observedNodes.add(target);

      return true;
    } catch (error) {
      console.error('SafeMutationObserver: Failed to observe', error);
      return false;
    }
  }

  /**
   * Stop observing all nodes
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observedNodes.clear();
    }
  }

  /**
   * Check if target is a valid DOM Node
   * @param {*} target 
   * @returns {boolean}
   */
  isValidNode(target) {
    return (
      target &&
      typeof target === 'object' &&
      target.nodeType &&
      target.nodeType >= 1 && // Element nodes start at 1
      target.nodeType <= 12 && // Document fragment is 11, max is 12
      typeof target.addEventListener === 'function'
    );
  }

  /**
   * Wait for DOM to be ready, then observe
   * @param {string|Node} target 
   * @param {Object} config 
   */
  observeWhenReady(target, config = {}) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.observe(target, config);
      });
    } else {
      this.observe(target, config);
    }
  }

  /**
   * Observe with retry mechanism
   * @param {string|Node} target 
   * @param {Object} config 
   * @param {number} maxRetries 
   */
  observeWithRetry(target, config = {}, maxRetries = 3) {
    let retries = 0;

    const attemptObserve = () => {
      if (this.observe(target, config)) {
        return; // Success
      }

      retries++;
      if (retries < maxRetries) {
        setTimeout(attemptObserve, 100 * retries); // Exponential backoff
      } else {
        console.warn('SafeMutationObserver: Failed to observe after', maxRetries, 'attempts');
      }
    };

    attemptObserve();
  }
}

/**
 * Create a safe mutation observer instance
 * @param {Function} callback 
 * @param {Object} options 
 * @returns {SafeMutationObserver}
 */
export function createSafeObserver(callback, options = {}) {
  return new SafeMutationObserver(callback, options);
}

/**
 * Safely observe DOM changes
 * @param {string|Node} target 
 * @param {Function} callback 
 * @param {Object} config 
 */
export function observeDOM(target, callback, config = {}) {
  const observer = createSafeObserver(callback);
  observer.observeWhenReady(target, config);
  return observer;
}

/**
 * Fix existing MutationObserver usage in content scripts
 */
export function fixContentScriptObservers() {
  // Override MutationObserver globally for content scripts
  if (typeof window !== 'undefined' && window.MutationObserver) {
    const OriginalMutationObserver = window.MutationObserver;
    
    window.MutationObserver = function(callback) {
      const observer = new OriginalMutationObserver(callback);
      const originalObserve = observer.observe.bind(observer);
      
      observer.observe = function(target, config) {
        try {
          // Validate target before observing
          if (!target || typeof target !== 'object' || !target.nodeType) {
            console.warn('MutationObserver: Invalid target, skipping observation');
            return;
          }
          
          return originalObserve(target, config);
        } catch (error) {
          console.warn('MutationObserver: Failed to observe', error);
        }
      };
      
      return observer;
    };
    
    console.log('✓ MutationObserver patched for safer usage');
  }
}

// Auto-fix content script observers on import
if (typeof window !== 'undefined') {
  fixContentScriptObservers();
}