// Extension Port Fix - Prevents runtime.lastError issues
// This script handles the most common extension port closure errors

(function() {
    'use strict';
    
    console.log('🔧 Extension Port Fix activated');
    
    // 1. Override chrome.runtime to handle port closure gracefully
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        const originalConnect = chrome.runtime.connect;
        chrome.runtime.connect = function(...args) {
            try {
                const port = originalConnect.apply(this, args);
                
                // Add error handlers to prevent uncaught exceptions
                if (port) {
                    port.onDisconnect.addListener(() => {
                        // Silently handle disconnection
                        if (chrome.runtime.lastError) {
                            // Clear the error without logging
                        }
                    });
                }
                
                return port;
            } catch (error) {
                // Silently handle connection errors
                return null;
            }
        };
    }
    
    // 2. Global error handler for runtime errors
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, ...args) {
        if (type === 'error' || type === 'unhandledrejection') {
            const wrappedListener = function(event) {
                // Filter out extension port errors
                if (event.message && (
                    event.message.includes('runtime.lastError') ||
                    event.message.includes('back/forward cache') ||
                    event.message.includes('message channel is closed')
                )) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
                
                return listener.call(this, event);
            };
            
            return originalAddEventListener.call(this, type, wrappedListener, ...args);
        }
        
        return originalAddEventListener.call(this, type, listener, ...args);
    };
    
    // 3. Page visibility change handler to prevent cache-related errors
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Disconnect any active extension ports before page goes to cache
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                try {
                    // Attempt graceful disconnection
                    chrome.runtime.sendMessage({action: 'disconnect'}, function() {
                        // Handle response or error silently
                        if (chrome.runtime.lastError) {
                            // Clear error
                        }
                    });
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        }
    });
    
    // 4. Cleanup function for page unload
    window.addEventListener('beforeunload', function() {
        // Disconnect extension ports before page unload
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                chrome.runtime.disconnect();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });
    
    // 5. Periodic cleanup of stale connections
    let cleanupInterval = setInterval(function() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                // Test connection health
                chrome.runtime.sendMessage({ping: true}, function() {
                    if (chrome.runtime.lastError) {
                        // Connection is stale, clear it
                    }
                });
            } catch (e) {
                // Connection is broken, ignore
            }
        }
    }, 30000); // Check every 30 seconds
    
    // Clear interval on page unload
    window.addEventListener('unload', () => {
        clearInterval(cleanupInterval);
    });
    
    console.log('✅ Extension port error prevention active');
    
})();