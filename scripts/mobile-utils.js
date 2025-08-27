/**
 * Mobile-Responsive Utilities
 * JavaScript utilities for mobile optimization across all projects
 */

// Device detection utilities
export const deviceUtils = {
  // Detect if running on iOS
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  
  // Detect if running on Android
  isAndroid: () => /Android/.test(navigator.userAgent),
  
  // Detect if running on mobile (either iOS or Android)
  isMobile: () => deviceUtils.isIOS() || deviceUtils.isAndroid(),
  
  // Detect if running in iOS Safari (not Chrome/Firefox on iOS)
  isIOSSafari: () => {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
  },
  
  // Detect if running in a WebView (like Capacitor app)
  isWebView: () => {
    return window.navigator.standalone === true || // iOS PWA
           window.matchMedia('(display-mode: standalone)').matches || // Android PWA
           document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1; // Capacitor
  },
  
  // Get device pixel ratio
  getPixelRatio: () => window.devicePixelRatio || 1,
  
  // Detect if device supports touch
  supportsTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  
  // Get screen dimensions
  getScreenInfo: () => ({
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    pixelRatio: deviceUtils.getPixelRatio()
  }),
  
  // Detect device orientation
  getOrientation: () => {
    if (screen.orientation) {
      return screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape';
    }
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }
};

// Viewport utilities
export const viewportUtils = {
  // Get viewport dimensions (handles iOS Safari dynamic viewport)
  getViewport: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    // Use visualViewport for more accurate mobile measurements
    visualWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth,
    visualHeight: window.visualViewport ? window.visualViewport.height : window.innerHeight
  }),
  
  // Check if virtual keyboard is open (iOS Safari)
  isVirtualKeyboardOpen: () => {
    if (!window.visualViewport) return false;
    return window.visualViewport.height < window.innerHeight * 0.75;
  },
  
  // Set viewport height CSS custom property
  updateViewportHeight: () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Also set dynamic viewport height
    if (window.visualViewport) {
      const dvh = window.visualViewport.height * 0.01;
      document.documentElement.style.setProperty('--dvh', `${dvh}px`);
    }
  },
  
  // Initialize viewport height tracking
  initViewportTracking: () => {
    viewportUtils.updateViewportHeight();
    
    // Update on resize
    window.addEventListener('resize', viewportUtils.updateViewportHeight);
    
    // Update on visual viewport change (virtual keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', viewportUtils.updateViewportHeight);
    }
    
    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(viewportUtils.updateViewportHeight, 100);
    });
  }
};

// Touch utilities
export const touchUtils = {
  // Prevent default touch behaviors
  preventTouchDefaults: (element) => {
    element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  },
  
  // Enable smooth scrolling for iOS
  enableSmoothScrolling: (element) => {
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overflowScrolling = 'touch';
  },
  
  // Disable touch callouts and selection
  disableTouchCallouts: (element) => {
    element.style.webkitTouchCallout = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.userSelect = 'none';
  },
  
  // Add touch feedback to buttons
  addTouchFeedback: (element, options = {}) => {
    const { scaleDown = 0.95, duration = 150 } = options;
    
    const touchStart = () => {
      element.style.transform = `scale(${scaleDown})`;
      element.style.transition = `transform ${duration}ms ease`;
    };
    
    const touchEnd = () => {
      element.style.transform = 'scale(1)';
    };
    
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchend', touchEnd, { passive: true });
    element.addEventListener('touchcancel', touchEnd, { passive: true });
  },
  
  // Handle swipe gestures
  addSwipeHandler: (element, callbacks = {}) => {
    let startX, startY, startTime;
    
    const touchStart = (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };
    
    const touchEnd = (e) => {
      if (!startX || !startY) return;
      
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      // Only consider swipes that are fast enough and far enough
      if (deltaTime > 300 || Math.abs(deltaX) < 50) return;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && callbacks.swipeRight) {
          callbacks.swipeRight(e);
        } else if (deltaX < 0 && callbacks.swipeLeft) {
          callbacks.swipeLeft(e);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && callbacks.swipeDown) {
          callbacks.swipeDown(e);
        } else if (deltaY < 0 && callbacks.swipeUp) {
          callbacks.swipeUp(e);
        }
      }
      
      startX = startY = null;
    };
    
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchend', touchEnd, { passive: true });
  }
};

// Safe area utilities
export const safeAreaUtils = {
  // Get safe area insets
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
    };
  },
  
  // Apply safe area padding to element
  applySafeArea: (element, sides = ['top', 'right', 'bottom', 'left']) => {
    const padding = sides.map(side => `env(safe-area-inset-${side})`).join(' ');
    element.style.padding = padding;
  },
  
  // Check if device has notch or safe areas
  hasNotch: () => {
    const insets = safeAreaUtils.getSafeAreaInsets();
    return insets.top > 0 || insets.bottom > 0;
  }
};

// Performance utilities
export const performanceUtils = {
  // Debounce function for resize events
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle function for scroll events
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Request animation frame with fallback
  requestAnimFrame: (() => {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           ((callback) => window.setTimeout(callback, 1000 / 60));
  })(),
  
  // Optimize images for mobile
  optimizeImage: (img, maxWidth = 800) => {
    if (img.naturalWidth > maxWidth) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const ratio = maxWidth / img.naturalWidth;
      canvas.width = maxWidth;
      canvas.height = img.naturalHeight * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return img.src;
  }
};

// Form utilities for mobile
export const formUtils = {
  // Prevent iOS zoom on input focus
  preventInputZoom: () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (parseInt(getComputedStyle(input).fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  },
  
  // Handle virtual keyboard
  handleVirtualKeyboard: (callback) => {
    if (!window.visualViewport) return;
    
    let initialHeight = window.visualViewport.height;
    
    const handleResize = () => {
      const currentHeight = window.visualViewport.height;
      const isKeyboardOpen = currentHeight < initialHeight * 0.75;
      
      if (callback) {
        callback({
          isOpen: isKeyboardOpen,
          height: initialHeight - currentHeight
        });
      }
    };
    
    window.visualViewport.addEventListener('resize', handleResize);
    
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  },
  
  // Scroll input into view when focused
  scrollInputIntoView: (input, offset = 100) => {
    setTimeout(() => {
      const rect = input.getBoundingClientRect();
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      
      if (rect.bottom > viewportHeight - offset) {
        const scrollTop = window.pageYOffset + rect.top - (viewportHeight - rect.height - offset);
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }, 300); // Wait for virtual keyboard animation
  }
};

// Storage utilities with mobile considerations
export const storageUtils = {
  // Check if localStorage is available (can be blocked on iOS Safari private mode)
  isLocalStorageAvailable: () => {
    try {
      localStorage.setItem('_test', 'test');
      localStorage.removeItem('_test');
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Safe localStorage with fallback
  safeLocalStorage: {
    setItem: (key, value) => {
      try {
        if (storageUtils.isLocalStorageAvailable()) {
          localStorage.setItem(key, value);
          return true;
        } else {
          // Fallback to sessionStorage or memory
          sessionStorage.setItem(key, value);
          return true;
        }
      } catch (e) {
        console.warn('Storage not available:', e);
        return false;
      }
    },
    
    getItem: (key) => {
      try {
        return localStorage.getItem(key) || sessionStorage.getItem(key);
      } catch (e) {
        console.warn('Storage not available:', e);
        return null;
      }
    },
    
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn('Storage not available:', e);
      }
    }
  }
};

// Network utilities for mobile
export const networkUtils = {
  // Get connection info
  getConnectionInfo: () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return null;
    
    return {
      effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // ms
      saveData: connection.saveData // boolean
    };
  },
  
  // Check if on slow connection
  isSlowConnection: () => {
    const connection = networkUtils.getConnectionInfo();
    if (!connection) return false;
    
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.saveData;
  },
  
  // Preload critical resources
  preloadResources: (resources) => {
    if (networkUtils.isSlowConnection()) return; // Skip on slow connections
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as || 'fetch';
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      document.head.appendChild(link);
    });
  }
};

// Initialize mobile optimizations
export const initializeMobile = (options = {}) => {
  const {
    trackViewport = true,
    preventInputZoom = true,
    enableTouchFeedback = true,
    optimizePerformance = true
  } = options;
  
  // Add mobile class to body
  document.body.classList.add('mobile-optimized');
  
  // Add device-specific classes
  if (deviceUtils.isIOS()) document.body.classList.add('ios');
  if (deviceUtils.isAndroid()) document.body.classList.add('android');
  if (deviceUtils.isIOSSafari()) document.body.classList.add('ios-safari');
  if (deviceUtils.isWebView()) document.body.classList.add('webview');
  
  // Initialize viewport tracking
  if (trackViewport) {
    viewportUtils.initViewportTracking();
  }
  
  // Prevent input zoom on iOS
  if (preventInputZoom && deviceUtils.isIOS()) {
    formUtils.preventInputZoom();
  }
  
  // Add touch feedback to buttons
  if (enableTouchFeedback && deviceUtils.supportsTouch()) {
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('button, .btn, [role="button"]');
      buttons.forEach(button => {
        if (!button.classList.contains('no-touch-feedback')) {
          touchUtils.addTouchFeedback(button);
        }
      });
    });
  }
  
  // Performance optimizations
  if (optimizePerformance) {
    // Disable animations on slow connections
    if (networkUtils.isSlowConnection()) {
      document.body.classList.add('reduce-animations');
    }
    
    // Add passive event listeners
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }
  
  console.log('[MobileUtils] Mobile optimizations initialized', {
    device: deviceUtils.isMobile() ? (deviceUtils.isIOS() ? 'iOS' : 'Android') : 'Desktop',
    viewport: viewportUtils.getViewport(),
    connection: networkUtils.getConnectionInfo()
  });
};

export default {
  deviceUtils,
  viewportUtils,
  touchUtils,
  safeAreaUtils,
  performanceUtils,
  formUtils,
  storageUtils,
  networkUtils,
  initializeMobile
};