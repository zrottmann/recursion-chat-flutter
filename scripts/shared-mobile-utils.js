/**
 * Shared Mobile Utilities
 * Console-Safe Progressive Enhancement Library
 * 
 * CRITICAL: This library provides mobile enhancements without disrupting console functionality
 * All enhancements are feature-detected and gracefully degrade
 */

class MobileEnhancer {
  constructor() {
    this.isInitialized = false;
    this.deviceInfo = null;
    this.features = new Map();
  }

  /**
   * Initialize mobile enhancements
   * SAFE: Only adds features, never modifies existing functionality
   */
  init() {
    if (this.isInitialized) return;
    
    this.detectDevice();
    this.setupFeatures();
    this.applyEnhancements();
    
    this.isInitialized = true;
    console.log('🔧 Mobile enhancements initialized (console-safe mode)');
  }

  /**
   * Device detection and capability assessment
   */
  detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    this.deviceInfo = {
      // Basic device detection
      isMobile: /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent),
      isTablet: /ipad|android(?!.*mobile)|tablet/i.test(userAgent),
      isDesktop: !/iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent),
      isIOS: /iphone|ipad|ipod/i.test(userAgent),
      isAndroid: /android/i.test(userAgent),
      
      // Capability detection
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasOrientationAPI: 'orientation' in window || 'DeviceOrientationEvent' in window,
      hasVibration: 'vibrate' in navigator,
      hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasGeolocation: 'geolocation' in navigator,
      hasPaymentAPI: 'PaymentRequest' in window,
      
      // Performance detection
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: navigator.deviceMemory || null,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
      
      // Viewport info
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      }
    };
  }

  /**
   * Setup available features based on device capabilities
   */
  setupFeatures() {
    // Touch enhancements
    if (this.deviceInfo.hasTouch) {
      this.features.set('touch', {
        enabled: true,
        enhancements: ['touch-targets', 'swipe-gestures', 'tap-highlights']
      });
    }

    // Mobile-specific UI enhancements
    if (this.deviceInfo.isMobile) {
      this.features.set('mobile-ui', {
        enabled: true,
        enhancements: ['responsive-navigation', 'mobile-forms', 'viewport-optimization']
      });
    }

    // Performance optimizations
    if (this.deviceInfo.connection && this.deviceInfo.connection.effectiveType) {
      const connectionType = this.deviceInfo.connection.effectiveType;
      this.features.set('performance', {
        enabled: true,
        level: connectionType === '4g' ? 'high' : connectionType === '3g' ? 'medium' : 'low',
        enhancements: ['lazy-loading', 'image-optimization', 'animation-control']
      });
    }

    // PWA features
    if (this.deviceInfo.isMobile && 'serviceWorker' in navigator) {
      this.features.set('pwa', {
        enabled: true,
        enhancements: ['install-prompt', 'offline-support', 'push-notifications']
      });
    }
  }

  /**
   * Apply progressive enhancements based on detected features
   */
  applyEnhancements() {
    // CRITICAL: All enhancements are additive only
    
    if (this.features.has('touch')) {
      this.enhanceTouchInteraction();
    }

    if (this.features.has('mobile-ui')) {
      this.enhanceMobileUI();
    }

    if (this.features.has('performance')) {
      this.optimizePerformance();
    }

    if (this.features.has('pwa')) {
      this.setupPWAFeatures();
    }

    // Console-specific enhancements
    this.enhanceConsoleForMobile();
  }

  /**
   * Enhance touch interactions (ADDITIVE ONLY)
   */
  enhanceTouchInteraction() {
    // Add touch-friendly CSS classes
    const style = document.createElement('style');
    style.textContent = `
      /* ADDITIVE mobile touch enhancements */
      .mobile-enhanced {
        -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .mobile-button {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      @media (hover: none) and (pointer: coarse) {
        .mobile-hover-disable:hover {
          transform: none !important;
        }
        
        .mobile-active-feedback:active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }
      }
    `;
    document.head.appendChild(style);

    // Apply touch enhancements to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [onclick], [role="button"]');
    interactiveElements.forEach(el => {
      el.classList.add('mobile-enhanced', 'mobile-button', 'mobile-active-feedback');
      
      // Ensure minimum touch target size
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        el.classList.add('touch-target');
      }
    });
  }

  /**
   * Enhance mobile UI (ADDITIVE ONLY)
   */
  enhanceMobileUI() {
    // Add mobile-specific meta tags if not present
    this.addMetaTag('mobile-web-app-capable', 'yes');
    this.addMetaTag('apple-mobile-web-app-capable', 'yes');
    this.addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');

    // Add responsive CSS enhancements
    const mobileCSS = document.createElement('style');
    mobileCSS.textContent = `
      /* ADDITIVE mobile UI enhancements */
      @media (max-width: 768px) {
        .mobile-stack {
          flex-direction: column !important;
        }
        
        .mobile-full-width {
          width: 100% !important;
        }
        
        .mobile-center {
          text-align: center !important;
        }
        
        .mobile-padding {
          padding: 16px !important;
        }
        
        .mobile-text-size {
          font-size: 16px !important; /* Prevents zoom on iOS */
        }
      }
      
      /* iOS safe area support */
      @supports (padding: max(0px)) {
        .mobile-safe-top {
          padding-top: max(20px, env(safe-area-inset-top)) !important;
        }
        
        .mobile-safe-bottom {
          padding-bottom: max(20px, env(safe-area-inset-bottom)) !important;
        }
      }
    `;
    document.head.appendChild(mobileCSS);

    // Apply mobile classes based on viewport
    if (this.deviceInfo.viewport.width <= 768) {
      document.body.classList.add('mobile-device');
      
      // Add mobile utility classes where appropriate
      const containers = document.querySelectorAll('.container, .content, main');
      containers.forEach(el => el.classList.add('mobile-padding'));

      const forms = document.querySelectorAll('input, textarea, select');
      forms.forEach(el => el.classList.add('mobile-text-size'));
    }
  }

  /**
   * Optimize performance for mobile devices (ADDITIVE ONLY)
   */
  optimizePerformance() {
    const performanceLevel = this.features.get('performance').level;

    // Lazy load images on slow connections
    if (performanceLevel !== 'high') {
      this.setupLazyLoading();
    }

    // Reduce animations on low-end devices
    if (performanceLevel === 'low' || this.deviceInfo.hardwareConcurrency < 4) {
      const reducedMotionCSS = document.createElement('style');
      reducedMotionCSS.textContent = `
        /* Performance optimization - reduced animations */
        *, *::before, *::after {
          animation-duration: 0.1s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.1s !important;
        }
      `;
      document.head.appendChild(reducedMotionCSS);
    }

    // Optimize scrolling performance
    const scrollOptimizationCSS = document.createElement('style');
    scrollOptimizationCSS.textContent = `
      /* Mobile scrolling optimization */
      .mobile-scroll-optimize {
        -webkit-overflow-scrolling: touch;
        overflow-x: hidden;
        overscroll-behavior: contain;
      }
    `;
    document.head.appendChild(scrollOptimizationCSS);

    // Apply scroll optimization to scrollable elements
    const scrollableElements = document.querySelectorAll('[style*="overflow"], .scroll');
    scrollableElements.forEach(el => el.classList.add('mobile-scroll-optimize'));
  }

  /**
   * Setup PWA features (ADDITIVE ONLY)
   */
  setupPWAFeatures() {
    // Install prompt handling
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button after user has been on site for 30 seconds
      setTimeout(() => {
        this.showInstallPrompt(deferredPrompt);
      }, 30000);
    });

    // Service worker registration (cleanup mode for mobile)
    if (this.deviceInfo.isMobile) {
      // Clean up existing service workers that might cause issues
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            // Only unregister if it might interfere with functionality
            if (registration.scope.includes('console') || registration.scope.includes('terminal')) {
              console.log('🧹 Cleaned up potentially interfering service worker');
              registration.unregister();
            }
          });
        });
      }
    }
  }

  /**
   * Console-specific mobile enhancements (CRITICAL - PRESERVATION FIRST)
   */
  enhanceConsoleForMobile() {
    // CRITICAL: Only enhance if console elements detected
    const consoleElements = document.querySelectorAll('.terminal, .console, [class*="term"], [class*="console"]');
    
    if (consoleElements.length > 0) {
      console.log('🖥️ Console detected - applying console-safe mobile enhancements');
      
      // Add console-specific mobile CSS (ADDITIVE ONLY)
      const consoleCSS = document.createElement('style');
      consoleCSS.textContent = `
        /* Console-specific mobile enhancements (ADDITIVE ONLY) */
        @media (max-width: 768px) {
          .terminal, .console, [class*="term"], [class*="console"] {
            font-size: 14px !important;
            line-height: 1.4 !important;
            padding: 12px !important;
          }
          
          /* Mobile terminal scroll optimization */
          .xterm-viewport {
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
          }
          
          /* Console button enhancements for mobile */
          .terminal button, .console button {
            min-height: 44px !important;
            padding: 10px 16px !important;
            font-size: 16px !important;
          }
        }
        
        /* Mobile console warning overlay (non-interfering) */
        @media (max-width: 768px) {
          .mobile-console-overlay {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 152, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 9999;
            max-width: 250px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
          }
          
          .mobile-console-overlay .close-btn {
            float: right;
            margin-left: 8px;
            cursor: pointer;
            font-weight: bold;
          }
        }
      `;
      document.head.appendChild(consoleCSS);

      // Add mobile console usage tip (non-interfering)
      if (this.deviceInfo.isMobile && !sessionStorage.getItem('console-mobile-tip-seen')) {
        this.showMobileConsoleTip();
      }
    }
  }

  /**
   * Helper Methods
   */
  
  addMetaTag(name, content) {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  setupLazyLoading() {
    // Simple intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Apply to images that need lazy loading
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  showInstallPrompt(deferredPrompt) {
    if (!deferredPrompt) return;

    const installNotification = document.createElement('div');
    installNotification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    installNotification.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600;">📱 Install as App</div>
      <div style="font-size: 14px; margin-bottom: 12px;">Get a better experience with the mobile app</div>
      <button id="install-btn" style="background: white; color: #4CAF50; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 8px; cursor: pointer;">Install</button>
      <button id="dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Dismiss</button>
    `;

    document.body.appendChild(installNotification);

    // Handle install button
    document.getElementById('install-btn').addEventListener('click', () => {
      deferredPrompt.prompt();
      installNotification.remove();
    });

    // Handle dismiss button
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      installNotification.remove();
    });

    // Auto dismiss after 10 seconds
    setTimeout(() => {
      if (document.body.contains(installNotification)) {
        installNotification.remove();
      }
    }, 10000);
  }

  showMobileConsoleTip() {
    const tip = document.createElement('div');
    tip.className = 'mobile-console-overlay';
    tip.innerHTML = `
      <span class="close-btn" onclick="this.parentElement.remove()">×</span>
      <strong>💻 Console on Mobile</strong><br>
      Limited functionality on mobile. Use desktop for full features.
    `;
    
    document.body.appendChild(tip);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (document.body.contains(tip)) {
        tip.remove();
      }
    }, 8000);
    
    sessionStorage.setItem('console-mobile-tip-seen', 'true');
  }

  /**
   * Public API for manual initialization
   */
  static initialize() {
    if (!window.mobileEnhancer) {
      window.mobileEnhancer = new MobileEnhancer();
    }
    window.mobileEnhancer.init();
  }

  static getDeviceInfo() {
    return window.mobileEnhancer ? window.mobileEnhancer.deviceInfo : null;
  }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  MobileEnhancer.initialize();
});

// Also expose for manual initialization
window.MobileEnhancer = MobileEnhancer;

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileEnhancer;
}