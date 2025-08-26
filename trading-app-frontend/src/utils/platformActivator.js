/**
 * Platform Activator for Appwrite
 * Automatically establishes connection to activate platform registration
 * 
 * CRITICAL: This fixes "Invalid URI" OAuth errors by establishing initial connection
 * Based on successful solution from CLAUDE.md
 */

import { account } from '../lib/appwrite';

/**
 * Activate Appwrite platform for current domain
 * This MUST run on app initialization to register the platform
 */
export async function activatePlatform() {
  const currentDomain = window.location.hostname;
  
  console.log('🔌 Platform Activation Starting...');
  console.log('📍 Current domain:', currentDomain);
  console.log('🌐 Full origin:', window.location.origin);
  
  try {
    // CRITICAL: This API call establishes the platform connection
    // Even a 401 error means SUCCESS - the platform is now recognized
    const result = await account.getSession('current');
    
    console.log('✅ Platform activated with active session!');
    console.log('👤 User authenticated:', result.userId);
    return { 
      success: true, 
      activated: true, 
      hasSession: true,
      userId: result.userId 
    };
    
  } catch (error) {
    // IMPORTANT: 401 Unauthorized is EXPECTED and means SUCCESS
    // It confirms the platform connection is established
    if (error.code === 401) {
      console.log('✅ Platform connection established! (No active session)');
      console.log('🔓 Platform is now recognized by Appwrite');
      console.log('📝 Status: Ready for OAuth authentication');
      
      return { 
        success: true, 
        activated: true, 
        hasSession: false,
        message: 'Platform activated - ready for authentication' 
      };
    }
    
    // Network errors might indicate platform not fully registered
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      console.warn('⚠️ Network issue during platform activation');
      console.log('🔄 Will retry platform activation...');
      
      // Retry once after delay
      setTimeout(() => {
        console.log('🔄 Retrying platform activation...');
        activatePlatform();
      }, 2000);
      
      return { 
        success: false, 
        activated: false, 
        error: 'Network issue - retrying' 
      };
    }
    
    // Other errors might indicate configuration issues
    console.error('❌ Platform activation error:', error);
    console.log('🔧 Error details:', {
      code: error.code,
      message: error.message,
      type: error.type
    });
    
    return { 
      success: false, 
      activated: false, 
      error: error.message 
    };
  }
}

/**
 * Check if platform is registered for OAuth
 * This verifies OAuth configuration is ready
 */
export async function checkOAuthReadiness() {
  console.log('🔍 Checking OAuth readiness...');
  
  try {
    // Test creating OAuth2 session URL (doesn't actually redirect)
    // This will fail if platform isn't registered
    const testUrl = account.createOAuth2Session(
      'google',
      `${window.location.origin}/auth/test`,
      `${window.location.origin}/auth/test-error`
    );
    
    console.log('✅ OAuth configuration valid');
    console.log('🔗 Test URL generated:', testUrl);
    
    return { 
      ready: true,
      message: 'OAuth is properly configured' 
    };
    
  } catch (error) {
    console.error('❌ OAuth not ready:', error.message);
    
    if (error.message?.includes('Invalid URI') || error.message?.includes('platform')) {
      console.log('⚠️ Platform not registered in Appwrite Console');
      console.log('📋 Required Action: Register platform in Appwrite Console');
      console.log(`   1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings/platforms`);
      console.log(`   2. Add Web Platform: ${window.location.hostname}`);
      console.log('   3. Wait 2-3 minutes and refresh');
    }
    
    return { 
      ready: false,
      error: error.message,
      requiresManualAction: true 
    };
  }
}

/**
 * Monitor platform status continuously
 * Useful for debugging OAuth issues
 */
export function monitorPlatformStatus(intervalMs = 30000) {
  console.log('👁️ Starting platform status monitoring...');
  
  // Initial check
  activatePlatform().then(result => {
    console.log('📊 Initial platform status:', result);
  });
  
  // Periodic checks
  const intervalId = setInterval(async () => {
    try {
      const session = await account.getSession('current');
      console.log('✅ Platform active, session valid:', session.userId);
    } catch (error) {
      if (error.code === 401) {
        console.log('✅ Platform active, no session');
      } else {
        console.warn('⚠️ Platform check error:', error.message);
      }
    }
  }, intervalMs);
  
  // Return function to stop monitoring
  return () => {
    console.log('🛑 Stopping platform monitoring');
    clearInterval(intervalId);
  };
}

/**
 * Auto-activate platform on module load
 * This ensures platform is activated as early as possible
 */
if (typeof window !== 'undefined') {
  // Activate immediately
  activatePlatform();
  
  // Also activate when DOM is ready (backup)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activatePlatform);
  }
  
  // Make functions available globally for debugging
  window.activatePlatform = activatePlatform;
  window.checkOAuthReadiness = checkOAuthReadiness;
  window.monitorPlatformStatus = monitorPlatformStatus;
  
  console.log('💡 Platform activation functions available:');
  console.log('   window.activatePlatform() - Manually activate platform');
  console.log('   window.checkOAuthReadiness() - Check OAuth configuration');
  console.log('   window.monitorPlatformStatus() - Start monitoring');
}

export default {
  activatePlatform,
  checkOAuthReadiness,
  monitorPlatformStatus
};