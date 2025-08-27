// MutationObserver Fix - Prevents "parameter 1 is not of type 'Node'" errors
(function() {
    'use strict';
    
    console.log('🔧 MutationObserver Fix activated');
    
    // 1. Store original MutationObserver
    const OriginalMutationObserver = window.MutationObserver;
    
    // 2. Create enhanced MutationObserver with error protection
    function EnhancedMutationObserver(callback) {
        const observer = new OriginalMutationObserver(function(mutations, obs) {
            try {
                // Validate mutations before passing to callback
                const validMutations = mutations.filter(mutation => {
                    return mutation && 
                           mutation.target && 
                           mutation.target.nodeType !== undefined;
                });
                
                if (validMutations.length > 0) {
                    callback.call(this, validMutations, obs);
                }
            } catch (error) {
                console.warn('🚫 MutationObserver callback error caught:', error.message);
            }
        });
        
        // Override observe method with validation
        const originalObserve = observer.observe;
        observer.observe = function(target, options) {
            // Comprehensive target validation
            if (!target) {
                console.warn('🚫 MutationObserver: target is null/undefined');
                return;
            }
            
            if (typeof target !== 'object') {
                console.warn('🚫 MutationObserver: target is not an object');
                return;
            }
            
            if (!target.nodeType) {
                console.warn('🚫 MutationObserver: target is not a Node (missing nodeType)');
                return;
            }
            
            // Valid node types: 1=ELEMENT_NODE, 3=TEXT_NODE, 9=DOCUMENT_NODE, 11=DOCUMENT_FRAGMENT_NODE
            const validNodeTypes = [1, 3, 9, 11];
            if (!validNodeTypes.includes(target.nodeType)) {
                console.warn(`🚫 MutationObserver: invalid nodeType ${target.nodeType}`);
                return;
            }
            
            // Validate options
            if (!options || typeof options !== 'object') {
                console.warn('🚫 MutationObserver: options must be an object');
                options = { childList: true }; // Default safe options
            }
            
            // Ensure at least one observation type is specified
            if (!options.childList && !options.attributes && !options.characterData) {
                options.childList = true;
            }
            
            try {
                return originalObserve.call(this, target, options);
            } catch (error) {
                console.warn('🚫 MutationObserver observe failed:', error.message);
                return;
            }
        };
        
        // Override disconnect method with error handling
        const originalDisconnect = observer.disconnect;
        observer.disconnect = function() {
            try {
                return originalDisconnect.call(this);
            } catch (error) {
                console.warn('🚫 MutationObserver disconnect failed:', error.message);
            }
        };
        
        // Override takeRecords method with error handling
        const originalTakeRecords = observer.takeRecords;
        observer.takeRecords = function() {
            try {
                const records = originalTakeRecords.call(this);
                // Filter out invalid records
                return records.filter(record => 
                    record && record.target && record.target.nodeType
                );
            } catch (error) {
                console.warn('🚫 MutationObserver takeRecords failed:', error.message);
                return [];
            }
        };
        
        return observer;
    }
    
    // 3. Preserve static methods and properties
    EnhancedMutationObserver.prototype = OriginalMutationObserver.prototype;
    Object.setPrototypeOf(EnhancedMutationObserver, OriginalMutationObserver);
    
    // 4. Replace global MutationObserver
    window.MutationObserver = EnhancedMutationObserver;
    
    // 5. Fix existing MutationObserver instances
    function fixExistingObservers() {
        // Find and fix observers that might be attached to problematic content scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src && (
                script.src.includes('web-client-content-script') ||
                script.src.includes('extension') ||
                script.src.includes('inject')
            )) {
                // Try to re-execute the script with our fixed MutationObserver
                try {
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    newScript.async = true;
                    
                    // Remove old script and add new one
                    script.remove();
                    document.head.appendChild(newScript);
                    
                    console.log(`🔄 Reloaded script with fixed MutationObserver: ${script.src}`);
                } catch (error) {
                    console.warn(`🚫 Could not reload script: ${script.src}`, error.message);
                }
            }
        });
    }
    
    // 6. Add global error handler for MutationObserver errors
    const originalError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        // Suppress specific MutationObserver errors
        if (message && (
            message.includes('parameter 1 is not of type \'Node\'') ||
            message.includes('MutationObserver') ||
            message.includes('observe')
        )) {
            console.warn('🚫 Suppressed MutationObserver error:', message);
            return true; // Prevent default error handling
        }
        
        // Call original error handler for other errors
        if (originalError) {
            return originalError.call(this, message, source, lineno, colno, error);
        }
        
        return false;
    };
    
    // 7. Add promise rejection handler for async errors
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            event.reason.message.includes('MutationObserver')) {
            console.warn('🚫 Suppressed MutationObserver promise rejection:', event.reason.message);
            event.preventDefault();
        }
    });
    
    // 8. Monitor DOM for problematic iframe elements
    function monitorProblematicElements() {
        const frameObserver = new EnhancedMutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IFRAME') {
                        // Add load handler to iframe to prevent observer errors
                        node.addEventListener('load', function() {
                            try {
                                // Ensure iframe content doesn't cause observer errors
                                if (this.contentDocument) {
                                    this.contentDocument.addEventListener('error', function(e) {
                                        if (e.message && e.message.includes('MutationObserver')) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }
                                    });
                                }
                            } catch (e) {
                                // Cross-origin iframe, ignore
                            }
                        });
                    }
                });
            });
        });
        
        frameObserver.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
    // 9. Initialize fixes
    function initializeMutationObserverFix() {
        fixExistingObservers();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', monitorProblematicElements);
        } else {
            monitorProblematicElements();
        }
        
        console.log('✅ MutationObserver protection enabled');
    }
    
    // Run initialization
    initializeMutationObserverFix();
    
    // Export for manual use
    window.mutationObserverFix = {
        EnhancedMutationObserver,
        fixExistingObservers,
        monitorProblematicElements,
        initializeMutationObserverFix
    };
    
})();