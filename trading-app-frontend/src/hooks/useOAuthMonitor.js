/**
 * OAuth Session Monitor Hook
 * Polls for session changes after OAuth redirect
 * Works around the "Powered by Appwrite" page limitation
 */

import { useState, useEffect, useRef } from 'react';
import appwriteService from '../services/appwriteService';

const useOAuthMonitor = (onSuccess, onError) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionDetected, setSessionDetected] = useState(false);
  const intervalRef = useRef(null);
  const attemptCount = useRef(0);

  // Start monitoring when OAuth is initiated
  const startMonitoring = () => {
    console.log('🔍 Starting OAuth session monitoring...');
    setIsMonitoring(true);
    attemptCount.current = 0;
    let corsErrorCount = 0;
    
    // Store current session state
    const initialSession = localStorage.getItem('appwrite_session');
    
    // Poll for session changes
    intervalRef.current = setInterval(async () => {
      attemptCount.current++;
      
      try {
        // Check for new session
        const session = await appwriteService.getCurrentSession();
        
        if (session) {
          console.log('✅ OAuth session detected!', session);
          
          // Get user details
          const user = await appwriteService.getCurrentUser();
          
          if (user) {
            console.log('✅ User authenticated:', user.email);
            
            // Stop monitoring
            stopMonitoring();
            setSessionDetected(true);
            
            // Call success callback
            if (onSuccess) {
              onSuccess(user);
            }
            
            // Check if we should close any popup windows
            checkAndClosePopup();
          }
        }
        
        // Reset CORS error count on successful request
        corsErrorCount = 0;
      } catch (error) {
        // Check if it's a CORS error
        if (error.message && error.message.includes('Failed to fetch')) {
          corsErrorCount++;
          console.log(`⚠️ CORS error detected (${corsErrorCount}/3)`);
          
          // Stop after 3 CORS errors to prevent infinite loop
          if (corsErrorCount >= 3) {
            console.log('❌ Stopping monitor due to CORS errors. Platform not registered.');
            stopMonitoring();
            
            if (onError) {
              onError('Platform registration issue detected. Please open a new tab and navigate to https://tradingpost.appwrite.network after OAuth.');
            }
            return;
          }
        } else {
          // No session yet, keep polling
          console.log(`⏳ Polling attempt ${attemptCount.current}: No session yet`);
        }
      }
      
      // Stop after 30 attempts (1 minute) - reduced from 60
      if (attemptCount.current >= 30) {
        console.log('⏰ OAuth monitoring timeout');
        stopMonitoring();
        
        if (onError) {
          onError('OAuth authentication timeout. Please try again.');
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  // Stop monitoring
  const stopMonitoring = () => {
    console.log('🛑 Stopping OAuth session monitoring');
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Check if we're in a popup and close it
  const checkAndClosePopup = () => {
    // If this is the popup window, close it
    if (window.opener && !window.opener.closed) {
      console.log('📪 Closing OAuth popup window');
      window.close();
    }
    
    // If we opened a popup, try to focus back on main window
    if (window.name === 'oauth-popup') {
      window.close();
    }
  };

  // Handle OAuth redirect (for same-window flow)
  const handleOAuthRedirect = async () => {
    // Check if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthReturn = urlParams.has('code') || 
                         urlParams.has('error') || 
                         window.location.pathname === '/auth/callback' ||
                         window.location.pathname === '/auth/success';
    
    if (isOAuthReturn) {
      console.log('🔄 OAuth redirect detected, checking session...');
      
      try {
        const session = await appwriteService.getCurrentSession();
        if (session) {
          const user = await appwriteService.getCurrentUser();
          if (user && onSuccess) {
            onSuccess(user);
            setSessionDetected(true);
            
            // Clean up URL
            window.history.replaceState({}, document.title, '/');
          }
        }
      } catch (error) {
        console.error('❌ OAuth redirect check failed:', error);
      }
    }
  };

  // Check for OAuth redirect on mount
  useEffect(() => {
    handleOAuthRedirect();
    
    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, []);

  // Enhanced OAuth initiation
  const initiateOAuth = async (provider) => {
    try {
      console.log(`🚀 Initiating ${provider} OAuth with monitoring...`);
      
      // Start monitoring before OAuth redirect
      startMonitoring();
      
      // Store timestamp for session comparison
      localStorage.setItem('oauth_initiated', Date.now().toString());
      
      // Create OAuth session (will redirect)
      await appwriteService.createOAuth2Session(provider);
      
    } catch (error) {
      console.error('❌ OAuth initiation failed:', error);
      stopMonitoring();
      
      if (onError) {
        onError(error.message || 'OAuth authentication failed');
      }
    }
  };

  return {
    initiateOAuth,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    sessionDetected,
  };
};

export default useOAuthMonitor;