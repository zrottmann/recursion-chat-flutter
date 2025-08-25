/**
 * OAuth Hash Redirect Component
 * Handles OAuth callbacks that arrive with hash fragments
 * Redirects to proper OAuth callback handler
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthHashRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔄 [OAuthHashRedirect] Checking for OAuth callback in hash...');
    
    const currentUrl = window.location.href;
    const hash = window.location.hash;
    
    console.log('📍 [OAuthHashRedirect] Current URL:', currentUrl);
    console.log('📍 [OAuthHashRedirect] Hash:', hash);
    
    // Check if this is an OAuth callback with hash
    if (hash && (hash.includes('callback') || hash === '#' || hash === '#/')) {
      console.log('✅ [OAuthHashRedirect] OAuth callback detected, redirecting to handler...');
      
      // Extract any parameters from the hash
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const params = Object.fromEntries(hashParams.entries());
      
      console.log('📋 [OAuthHashRedirect] Hash params:', params);
      
      // Redirect to the OAuth callback handler
      // Pass any parameters as query string
      const queryString = new URLSearchParams(params).toString();
      const redirectPath = queryString ? `/auth/callback?${queryString}` : '/auth/callback';
      
      console.log('🚀 [OAuthHashRedirect] Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    } else {
      console.log('ℹ️ [OAuthHashRedirect] No OAuth callback in hash, redirecting to login...');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

export default OAuthHashRedirect;