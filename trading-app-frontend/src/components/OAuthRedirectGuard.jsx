/**
 * OAuth Redirect Guard Component
 * Catches any OAuth callback URLs with empty or invalid parameters
 * and redirects to the marketplace root
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthRedirectGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're on an OAuth callback URL with empty hash
    const currentPath = location.pathname;
    const currentHash = location.hash;
    const fullUrl = window.location.href;
    
    // List of OAuth callback patterns that should redirect to root
    const shouldRedirect = 
      // Direct hash-only URLs
      (currentPath === '/auth/callback' && currentHash === '#') ||
      (currentPath === '/oauth/callback' && currentHash === '#') ||
      // URLs ending with callback#
      fullUrl.endsWith('/auth/callback#') ||
      fullUrl.endsWith('/oauth/callback#') ||
      // URLs with callback#/ pattern
      fullUrl.includes('/auth/callback#/') ||
      fullUrl.includes('/oauth/callback#/');
    
    if (shouldRedirect) {
      console.log('🔄 OAuth Redirect Guard: Invalid callback URL detected, redirecting to marketplace');
      console.log('📍 Path:', currentPath);
      console.log('📍 Hash:', currentHash);
      console.log('📍 Full URL:', fullUrl);
      
      // Immediate redirect to marketplace
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return children;
};

export default OAuthRedirectGuard;