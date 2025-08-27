/**
 * Mobile OAuth Enhancements for Easy Appwrite SSO
 * Quality Engineer Recommendations: Enhanced mobile browser compatibility
 */

/**
 * Enhanced Mobile Detection with Edge Case Handling
 */
export class MobileOAuthEnhancer {
  constructor(originalSSO) {
    this.originalSSO = originalSSO;
    this.mobileDetection = this.initializeMobileDetection();
    this.popupSupport = null; // Cached popup support test result
  }

  /**
   * Comprehensive mobile detection including edge cases
   */
  initializeMobileDetection() {
    const userAgent = navigator.userAgent;
    const viewport = window.innerWidth;
    const touchSupport = 'ontouchstart' in window;
    
    // Extended mobile detection patterns
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;
    const tabletRegex = /iPad|Android(?=.*Mobile)|Tablet|PlayBook|Silk/i;
    
    // iOS Safari specific detection (often missed by standard detection)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isSafariMobile = isIOS && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
    
    // Samsung Internet detection
    const isSamsungInternet = /SamsungBrowser/.test(userAgent);
    
    // Chrome on iOS detection
    const isChromeIOS = /CriOS/.test(userAgent);
    
    return {
      isMobile: mobileRegex.test(userAgent) || viewport < 768,
      isTablet: tabletRegex.test(userAgent),
      isIOS,
      isSafariMobile,
      isSamsungInternet,
      isChromeIOS,
      hasTouch: touchSupport,
      viewport,
      userAgent,
      // Special mobile browser characteristics
      requiresRedirectFlow: isSafariMobile || isSamsungInternet,
      popupReliability: this.assessPopupReliability(userAgent)
    };
  }

  /**
   * Assess popup reliability based on browser and mobile characteristics
   */
  assessPopupReliability(userAgent) {
    // Browsers with known popup issues on mobile
    if (/Safari/.test(userAgent) && /iPhone|iPad/.test(userAgent)) return 'low';
    if (/SamsungBrowser/.test(userAgent)) return 'medium';
    if (/Chrome/.test(userAgent) && /Android/.test(userAgent)) return 'high';
    if (/Firefox/.test(userAgent)) return 'medium';
    
    return 'unknown';
  }

  /**
   * Test popup support with timeout and fallback
   */
  async testPopupSupport() {
    if (this.popupSupport !== null) return this.popupSupport;
    
    return new Promise((resolve) => {
      try {
        // Attempt to open test popup
        const testPopup = window.open('', 'popup_test', 'width=1,height=1,top=0,left=0');
        
        if (!testPopup) {
          this.popupSupport = false;
          resolve(false);
          return;
        }
        
        // Test if popup is actually functional
        setTimeout(() => {
          try {
            if (testPopup.closed !== false) {
              // Popup was blocked or closed immediately
              this.popupSupport = false;
            } else {
              this.popupSupport = true;
              testPopup.close();
            }
          } catch (e) {
            // Cross-origin or other error - likely blocked
            this.popupSupport = false;
          }
          resolve(this.popupSupport);
        }, 100);
        
      } catch (error) {
        this.popupSupport = false;
        resolve(false);
      }
    });
  }

  /**
   * Enhanced OAuth sign-in with mobile-specific logic
   */
  async enhancedSignIn(provider = 'google', options = {}) {
    const mobile = this.mobileDetection;
    const popupSupported = await this.testPopupSupport();
    
    console.log(`[MobileOAuth] Device: ${mobile.isMobile ? 'Mobile' : 'Desktop'}, Popups: ${popupSupported}`);
    
    // Decision tree for OAuth method
    const oauthMethod = this.selectOAuthMethod(mobile, popupSupported, options);
    
    try {
      switch (oauthMethod) {
        case 'enhanced_popup':
          return await this.enhancedPopupFlow(provider, options);
        case 'mobile_redirect':
          return await this.mobileRedirectFlow(provider, options);
        case 'fallback_redirect':
          return await this.fallbackRedirectFlow(provider, options);
        default:
          return await this.originalSSO.signIn(provider, options);
      }
    } catch (error) {
      console.error(`[MobileOAuth] ${oauthMethod} failed:`, error);
      
      // Automatic fallback to redirect method
      if (oauthMethod !== 'fallback_redirect') {
        console.log('[MobileOAuth] Attempting fallback redirect...');
        return await this.fallbackRedirectFlow(provider, options);
      }
      
      throw error;
    }
  }

  /**
   * Select optimal OAuth method based on device and browser capabilities
   */
  selectOAuthMethod(mobile, popupSupported, options) {
    // Force redirect if explicitly requested
    if (options.forceRedirect) return 'mobile_redirect';
    
    // Use redirect flow for known problematic browsers
    if (mobile.requiresRedirectFlow) return 'mobile_redirect';
    
    // Use redirect flow if popups are blocked
    if (!popupSupported) return 'mobile_redirect';
    
    // Use enhanced popup for mobile with good popup support
    if (mobile.isMobile && mobile.popupReliability === 'high') return 'enhanced_popup';
    
    // Use redirect for mobile with poor popup reliability
    if (mobile.isMobile && mobile.popupReliability === 'low') return 'mobile_redirect';
    
    // Default to enhanced popup for desktop and capable mobile browsers
    return 'enhanced_popup';
  }

  /**
   * Enhanced popup flow with mobile optimizations
   */
  async enhancedPopupFlow(provider, options) {
    const mobile = this.mobileDetection;
    
    // Mobile-optimized popup dimensions
    const popupConfig = mobile.isMobile ? {
      width: Math.min(400, mobile.viewport * 0.9),
      height: Math.min(600, window.innerHeight * 0.8),
      left: (window.screen.width - 400) / 2,
      top: (window.screen.height - 600) / 4
    } : {
      width: 500,
      height: 600,
      left: (window.screen.width - 500) / 2,
      top: (window.screen.height - 600) / 4
    };
    
    const popupFeatures = `width=${popupConfig.width},height=${popupConfig.height},top=${popupConfig.top},left=${popupConfig.left},scrollbars=yes,resizable=yes`;
    
    return new Promise((resolve, reject) => {
      const authUrl = this.originalSSO.getOAuthUrl(provider, options);
      const popup = window.open(authUrl, 'oauth_popup', popupFeatures);
      
      if (!popup) {
        reject(new Error('Popup blocked - falling back to redirect'));
        return;
      }
      
      // Enhanced popup monitoring with mobile considerations
      const checkInterval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkInterval);
            
            // Wait a moment for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check for successful authentication
            try {
              const user = await this.originalSSO.getUser();
              if (user) {
                resolve(user);
              } else {
                reject(new Error('Authentication cancelled or failed'));
              }
            } catch (error) {
              reject(new Error('Authentication verification failed'));
            }
          }
          
          // Check popup URL for success/failure indicators
          try {
            if (popup.location && popup.location.href) {
              const url = popup.location.href;
              if (url.includes('success') || url.includes('callback')) {
                clearInterval(checkInterval);
                popup.close();
                
                // Get authenticated user
                const user = await this.originalSSO.getUser();
                resolve(user);
              } else if (url.includes('error') || url.includes('failure')) {
                clearInterval(checkInterval);
                popup.close();
                reject(new Error('OAuth authentication failed'));
              }
            }
          } catch (e) {
            // Cross-origin error is expected and normal
          }
          
        } catch (error) {
          clearInterval(checkInterval);
          popup.close();
          reject(error);
        }
      }, mobile.isMobile ? 1000 : 500); // Slower polling on mobile
      
      // Extended timeout for mobile networks
      const timeout = mobile.isMobile ? 180000 : 120000;
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('OAuth popup timeout'));
      }, timeout);
    });
  }

  /**
   * Mobile-optimized redirect flow
   */
  async mobileRedirectFlow(provider, options) {
    // Store current page for return navigation
    const returnUrl = window.location.href;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('oauth_return_url', returnUrl);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_timestamp', Date.now().toString());
    }
    
    // Enhanced success/failure URLs with mobile detection
    const baseUrl = window.location.origin;
    const successUrl = options.successUrl || `${baseUrl}/auth/mobile-callback?status=success`;
    const failureUrl = options.failureUrl || `${baseUrl}/auth/mobile-callback?status=error`;
    
    console.log('[MobileOAuth] Initiating redirect flow...');
    
    // Use original SSO redirect method
    return await this.originalSSO.account.createOAuth2Session(
      this.originalSSO.getOAuthProvider(provider),
      successUrl,
      failureUrl,
      options.scopes || []
    );
  }

  /**
   * Fallback redirect flow for maximum compatibility
   */
  async fallbackRedirectFlow(provider, options) {
    console.log('[MobileOAuth] Using fallback redirect flow');
    
    // Simplified redirect with minimal dependencies
    const config = this.originalSSO.config;
    const successUrl = `${window.location.origin}/auth/callback`;
    const failureUrl = `${window.location.origin}/auth/error`;
    
    // Direct redirect to OAuth URL
    window.location.href = `${config.endpoint}/account/sessions/oauth2/${provider.toLowerCase()}?project=${config.projectId}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`;
    
    // This will redirect, so return a promise that won't resolve
    return new Promise(() => {});
  }

  /**
   * Handle OAuth callback with mobile considerations
   */
  async handleMobileCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('[MobileOAuth] Callback error:', error);
      
      // Restore previous page
      const returnUrl = sessionStorage.getItem('oauth_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('oauth_return_url');
        window.location.href = returnUrl + '?auth_error=' + encodeURIComponent(error);
      }
      return;
    }
    
    if (status === 'success') {
      // Verify authentication
      try {
        const user = await this.originalSSO.getUser();
        if (user) {
          console.log('[MobileOAuth] Mobile authentication successful:', user);
          
          // Notify parent page if this is in an iframe/popup context
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'oauth_success',
              user: user
            }, '*');
          } else {
            // Restore previous page
            const returnUrl = sessionStorage.getItem('oauth_return_url');
            if (returnUrl) {
              sessionStorage.removeItem('oauth_return_url');
              window.location.href = returnUrl + '?auth_success=true';
            } else {
              window.location.href = '/';
            }
          }
        }
      } catch (error) {
        console.error('[MobileOAuth] User verification failed:', error);
        window.location.href = '/?auth_error=verification_failed';
      }
    }
  }

  /**
   * Utility method to get OAuth provider with error handling
   */
  getOAuthProvider(provider) {
    return this.originalSSO.getOAuthProvider?.(provider) || provider;
  }
}

/**
 * Mobile-specific CSS for OAuth buttons
 */
export const getMobileOAuthStyles = () => `
  /* Mobile OAuth Button Styles */
  .oauth-button {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
    font-size: 16px;
    border-radius: 8px;
    border: 2px solid #ddd;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    max-width: 320px;
  }
  
  .oauth-button:hover {
    background: #f8f9fa;
    border-color: #007bff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .oauth-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }
  
  .oauth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Mobile-specific adjustments */
  @media (max-width: 768px) {
    .oauth-button {
      min-height: 48px;
      font-size: 18px;
      padding: 14px 20px;
    }
    
    .oauth-button-group {
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    
    .oauth-button-group .oauth-button {
      width: 100%;
      max-width: none;
    }
  }
  
  /* Touch-specific optimizations */
  @media (hover: none) and (pointer: coarse) {
    .oauth-button:hover {
      background: white;
      transform: none;
    }
    
    .oauth-button:active {
      background: #f0f0f0;
      transform: scale(0.98);
    }
  }
  
  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .oauth-button {
      border-width: 1px;
    }
  }
`;

/**
 * Usage example with React integration
 */
export const MobileOptimizedSSOButton = ({ provider, onSuccess, onError, ...props }) => {
  const [ssoEnhancer, setSSOEnhancer] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    // Initialize SSO enhancer
    const originalSSO = new EasyAppwriteSSO();
    const enhancer = new MobileOAuthEnhancer(originalSSO);
    setSSOEnhancer(enhancer);
    
    // Add mobile styles
    const styleEl = document.createElement('style');
    styleEl.textContent = getMobileOAuthStyles();
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  const handleSignIn = async () => {
    if (!ssoEnhancer || loading) return;
    
    setLoading(true);
    try {
      const user = await ssoEnhancer.enhancedSignIn(provider);
      setLoading(false);
      onSuccess?.(user);
    } catch (error) {
      setLoading(false);
      console.error('[MobileSSO] Sign-in failed:', error);
      onError?.(error);
    }
  };
  
  return (
    <button 
      className="oauth-button"
      onClick={handleSignIn}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="spinner" />
          Connecting...
        </>
      ) : (
        <>
          <span className="provider-icon">{getProviderIcon(provider)}</span>
          Continue with {provider}
        </>
      )}
    </button>
  );
};

// Helper function for provider icons
const getProviderIcon = (provider) => {
  const icons = {
    google: '🔍',
    github: '🐙', 
    microsoft: '🪟',
    facebook: '📘',
    apple: '🍎'
  };
  return icons[provider.toLowerCase()] || '🔐';
};

export default MobileOAuthEnhancer;