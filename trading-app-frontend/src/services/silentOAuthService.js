/**
 * Silent OAuth Service - Handles OAuth without visible redirects
 * Uses popup window approach to keep user on current page
 */

import { Client, Account } from 'appwrite';
import config from '../config/appwriteConfig';

class SilentOAuthService {
  constructor() {
    this.client = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId);
    
    this.account = new Account(this.client);
  }

  /**
   * Create OAuth session using popup window (silent to user)
   */
  async createOAuthSession(provider = 'google') {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔐 [SILENT-OAUTH] Starting silent ${provider} OAuth...`);
        
        // Create OAuth URL for popup
        const successUrl = `${window.location.origin}/auth/success`;
        const failureUrl = `${window.location.origin}/auth/error`;
        
        console.log(`🔐 [SILENT-OAUTH] Success URL: ${successUrl}`);
        console.log(`🔐 [SILENT-OAUTH] Failure URL: ${failureUrl}`);
        
        // Open popup for OAuth
        const popup = window.open(
          '', 
          'oauth_popup',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        // Set up message listener for popup communication
        const messageListener = (event) => {
          if (event.origin !== window.location.origin) {
            return; // Ignore messages from other origins
          }
          
          console.log(`🔐 [SILENT-OAUTH] Received message from popup:`, event.data);
          
          if (event.data.type === 'oauth_success') {
            cleanup();
            console.log(`✅ [SILENT-OAUTH] OAuth successful via postMessage!`);
            
            // Get current user to verify session
            this.getCurrentUser().then(user => {
              resolve({
                success: true,
                user: user,
                message: 'Authentication successful'
              });
            }).catch(err => {
              console.error(`❌ [SILENT-OAUTH] Failed to get user after OAuth:`, err);
              reject(new Error('Authentication succeeded but failed to get user data'));
            });
            
          } else if (event.data.type === 'oauth_error') {
            cleanup();
            console.error(`❌ [SILENT-OAUTH] OAuth failed via postMessage:`, event.data);
            reject(new Error(event.data.error_description || 'OAuth authentication failed'));
          }
        };
        
        window.addEventListener('message', messageListener);
        
        const cleanup = () => {
          window.removeEventListener('message', messageListener);
          if (checkClosed) clearInterval(checkClosed);
          if (timeout) clearTimeout(timeout);
          if (!popup.closed) popup.close();
        };
        
        let checkClosed, timeout;

        // Create OAuth session and redirect popup
        this.account.createOAuth2Session(
          provider,
          successUrl,
          failureUrl
        ).then(() => {
          console.log(`🔐 [SILENT-OAUTH] OAuth URL created, redirecting popup...`);
          
          // Monitor popup for manual close
          checkClosed = setInterval(() => {
            if (popup.closed) {
              cleanup();
              console.log(`🔐 [SILENT-OAUTH] Popup closed by user`);
              reject(new Error('OAuth cancelled by user'));
            }
          }, 1000);

          // Timeout after 5 minutes
          timeout = setTimeout(() => {
            cleanup();
            reject(new Error('OAuth timeout - please try again'));
          }, 300000);

        }).catch(error => {
          console.error(`❌ [SILENT-OAUTH] Failed to create OAuth session:`, error);
          cleanup();
          reject(error);
        });

      } catch (error) {
        console.error(`❌ [SILENT-OAUTH] Silent OAuth failed:`, error);
        reject(error);
      }
    });
  }

  /**
   * Alternative: Use iframe approach (more seamless but may be blocked)
   */
  async createSilentOAuthWithIframe(provider = 'google') {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔐 [IFRAME-OAUTH] Starting iframe ${provider} OAuth...`);
        
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        
        const successUrl = `${window.location.origin}/auth/silent-success`;
        const failureUrl = `${window.location.origin}/auth/silent-error`;
        
        // Create OAuth session and load in iframe
        this.account.createOAuth2Session(
          provider,
          successUrl,
          failureUrl
        ).then(() => {
          console.log(`🔐 [IFRAME-OAUTH] OAuth session created, loading iframe...`);
          
          // Monitor iframe for completion
          iframe.onload = () => {
            try {
              const iframeUrl = iframe.contentWindow?.location?.href;
              if (iframeUrl && (iframeUrl.includes('silent-success') || iframeUrl.includes('silent-error'))) {
                document.body.removeChild(iframe);
                
                if (iframeUrl.includes('silent-success')) {
                  console.log(`✅ [IFRAME-OAUTH] OAuth successful!`);
                  this.getCurrentUser().then(user => {
                    resolve({
                      success: true,
                      user: user,
                      message: 'Silent authentication successful'
                    });
                  }).catch(err => {
                    reject(new Error('Authentication succeeded but failed to get user data'));
                  });
                } else {
                  console.error(`❌ [IFRAME-OAUTH] OAuth failed`);
                  reject(new Error('OAuth authentication failed'));
                }
              }
            } catch (e) {
              // Cross-origin issues expected
              console.log(`🔐 [IFRAME-OAUTH] Cross-origin restriction (normal)`);
            }
          };

          // Add iframe to DOM
          document.body.appendChild(iframe);
          
          // Timeout
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            reject(new Error('Silent OAuth timeout'));
          }, 30000);

        }).catch(error => {
          reject(error);
        });

      } catch (error) {
        console.error(`❌ [IFRAME-OAUTH] Iframe OAuth failed:`, error);
        reject(error);
      }
    });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    try {
      const user = await this.account.get();
      console.log(`✅ [SILENT-OAUTH] Current user:`, user.email);
      return user;
    } catch (error) {
      console.error(`❌ [SILENT-OAUTH] No authenticated user:`, error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated() {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      await this.account.deleteSession('current');
      console.log(`✅ [SILENT-OAUTH] User logged out`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [SILENT-OAUTH] Logout failed:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const silentOAuthService = new SilentOAuthService();

export default silentOAuthService;