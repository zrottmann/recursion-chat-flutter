/**
 * Appwrite OAuth Callback Handler Component
 * Handles OAuth callbacks using Appwrite's OAuth system
 * Migrated from legacy database to Appwrite APIs
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Card, Spinner, Button, Alert } from 'react-bootstrap';
import { account, databases, DATABASE_ID, COLLECTIONS, handleAppwriteError, Query } from '../lib/appwrite';
import { setUser, setError, clearError } from '../store/slices/userSlice';
import { toast } from 'react-toastify';
import sessionConflictResolver from '../utils/sessionConflictResolver';

const OAuthCallbackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Completing authentication...');
  const [countdown, setCountdown] = useState(3);

  // Get redirect URLs from environment
  const SUCCESS_REDIRECT = import.meta.env.VITE_OAUTH_SUCCESS_REDIRECT || '/';
  const ERROR_REDIRECT = import.meta.env.VITE_OAUTH_ERROR_REDIRECT || '/login';

  useEffect(() => {
    const handleAppwriteOAuth = async () => {
      try {
        console.log('🔄 [OAUTH-CALLBACK-HANDLER] Component mounted');
        console.log('🔄 [OAUTH-CALLBACK-HANDLER] Starting Appwrite OAuth callback handling...');
        
        // Check if this is an OAuth callback URL
        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;
        
        console.log('🔍 [OAUTH-CALLBACK-HANDLER] Full callback details:', {
          path: currentPath,
          url: currentUrl,
          hash: window.location.hash,
          search: window.location.search,
          searchParams: Object.fromEntries(searchParams.entries()),
          origin: window.location.origin,
          hostname: window.location.hostname
        });

        // Check for sessionStorage OAuth callback data first (from our redirect pages)
        const sessionCallbackPath = sessionStorage.getItem('oauth_callback_path');
        const sessionCallbackSearch = sessionStorage.getItem('oauth_callback_search');
        const sessionCallbackHash = sessionStorage.getItem('oauth_callback_hash');
        
        console.log('📦 [OAUTH-CALLBACK-HANDLER] SessionStorage data:', {
          path: sessionCallbackPath,
          search: sessionCallbackSearch,
          hash: sessionCallbackHash
        });
        
        if (sessionCallbackPath) {
          console.log('📦 Found OAuth callback data in sessionStorage:', {
            path: sessionCallbackPath,
            search: sessionCallbackSearch,
            hash: sessionCallbackHash
          });
          
          // Clean up sessionStorage
          sessionStorage.removeItem('oauth_callback_path');
          sessionStorage.removeItem('oauth_callback_search');
          sessionStorage.removeItem('oauth_callback_hash');
        }

        // Get OAuth parameters from URL first
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');
        const provider = searchParams.get('provider') || 'google';
        
        // Handle empty hash redirects - redirect directly to marketplace
        // This handles cases like /auth/callback# or /auth/callback#/
        const hashValue = window.location.hash;
        const isEmptyCallback = (hashValue === '#' || 
                                hashValue === '#/' || 
                                currentUrl.endsWith('/auth/callback#') ||
                                currentUrl.includes('/auth/callback#/') ||
                                currentUrl.includes('/auth/callback#')) &&
                               !userId && !secret;
        
        if (isEmptyCallback) {
          console.log('🔄 OAuth callback with empty/invalid hash - redirecting to marketplace immediately');
          console.log('📍 Current URL:', currentUrl);
          console.log('📍 Hash value:', hashValue);
          console.log('📍 No OAuth params found (userId/secret)');
          
          // Check if user is already authenticated
          try {
            const currentUser = await account.get();
            if (currentUser) {
              console.log('✅ User already authenticated:', currentUser.email);
              
              // Update Redux store with authenticated user
              dispatch(clearError());
              dispatch(setUser({
                id: currentUser.$id,
                email: currentUser.email,
                name: currentUser.name,
                avatar: currentUser.prefs?.avatar || null,
                isAuthenticated: true,
                lastLogin: new Date().toISOString()
              }));
              
              setStatus('success');
              setMessage('You are already logged in! Redirecting to marketplace...');
              
              // Show toast notification
              toast.success(`Welcome back ${currentUser.name || currentUser.email}!`);
            } else {
              console.log('ℹ️ No active session, redirecting to marketplace');
              setStatus('success');
              setMessage('Redirecting to marketplace...');
            }
          } catch (error) {
            console.log('ℹ️ No session found, redirecting to marketplace');
            setStatus('success');
            setMessage('Redirecting to marketplace...');
          }
          
          // Immediate redirect without delay for better UX
          setTimeout(() => {
            navigate(SUCCESS_REDIRECT, { replace: true });
          }, 100); // Small delay to ensure state updates
          return;
        }

        // Check if we're not in an OAuth callback URL
        if (!currentPath.includes('/auth/callback') && !currentPath.includes('/oauth/callback')) {
          console.log('🔄 Not an OAuth callback URL, redirecting to marketplace');
          navigate(SUCCESS_REDIRECT, { replace: true });
          return;
        }

        // OAuth parameters already retrieved above
        console.log('📋 OAuth parameters:', { 
          hasUserId: !!userId, 
          hasSecret: !!secret, 
          provider 
        });

        // If no OAuth parameters found, try to get current session
        if (!userId || !secret) {
          console.log('🔍 No OAuth parameters found, checking for existing session...');
          
          try {
            const currentUser = await account.get();
            if (currentUser) {
              console.log('✅ Found existing authenticated user:', currentUser.email);
              await handleSuccessfulAuthentication(currentUser, provider);
              return;
            }
          } catch (error) {
            console.log('🔄 No existing session, redirecting to marketplace');
            navigate(SUCCESS_REDIRECT, { replace: true });
            return;
          }
        }

        // Create OAuth session with Appwrite using conflict resolver
        console.log('🔐 Creating OAuth session with Appwrite...');
        setMessage(`Completing ${provider} authentication...`);

        // Use session conflict resolver to prevent session conflicts
        const sessionResult = await sessionConflictResolver.createOAuthSession(userId, secret);
        if (!sessionResult.success) {
          throw new Error('Failed to create OAuth session');
        }
        const session = sessionResult.session;
        console.log('✅ OAuth session created:', session);

        // Get the authenticated user
        const user = await account.get();
        console.log('✅ User authenticated:', user.email);

        // Handle successful authentication
        await handleSuccessfulAuthentication(user, provider);

      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        handleAuthenticationError(error);
      }
    };

    const handleSuccessfulAuthentication = async (user, provider = 'google') => {
      try {
        setStatus('success');
        setMessage('Authentication successful! Setting up your account...');

        // Create or update user profile in Appwrite database
        await createOrUpdateUserProfile(user);

        // Update Redux store
        dispatch(clearError());
        dispatch(setUser({
          id: user.$id,
          email: user.email,
          name: user.name,
          avatar: user.prefs?.avatar || null,
          provider: provider,
          isAuthenticated: true,
          lastLogin: new Date().toISOString()
        }));

        // Show success message
        toast.success(`Welcome ${user.name || user.email}! Successfully signed in with ${provider}.`);

        // Start countdown and redirect
        setMessage('Redirecting to marketplace...');
        startCountdown(() => {
          console.log('🏪 Redirecting to marketplace after successful OAuth');
          navigate(SUCCESS_REDIRECT, { replace: true });
        });

      } catch (error) {
        console.error('❌ Error handling successful authentication:', error);
        handleAuthenticationError(error);
      }
    };

    const createOrUpdateUserProfile = async (user) => {
      try {
        console.log('👤 Creating/updating user profile in Appwrite database...');
        
        // Try to get existing user profile by document ID
        let userProfile = null;
        try {
          // For users collection, use document ID directly
          userProfile = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            user.$id
          );
          console.log('📋 Found existing user profile by document ID');
        } catch (error) {
          if (error.code === 404) {
            console.log('🆕 No existing profile found, will create new one');
          } else {
            console.log('🔍 Profile lookup failed:', error.message);
          }
        }

        const profileData = {
          user_id: user.$id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          avatar_url: user.prefs?.avatar || null,
          phone: user.phone || null,
          created_at: userProfile?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_active: true,
          oauth_provider: 'google',
          preferences: userProfile?.preferences || {
            notifications: true,
            email_updates: true,
            theme: 'light'
          }
        };

        if (userProfile) {
          // Update existing profile
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            userProfile.$id,
            profileData
          );
          console.log('✅ Updated existing user profile');
        } else {
          // Create new profile with user ID as document ID
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            user.$id, // Use user ID as document ID for easier lookups
            profileData
          );
          console.log('✅ Created new user profile');
        }

      } catch (error) {
        console.error('⚠️ Error managing user profile:', error);
        // Don't throw error - authentication can still succeed without profile creation
      }
    };

    const handleAuthenticationError = (error) => {
      setStatus('error');
      
      const errorInfo = handleAppwriteError(error);
      let errorMessage = 'Authentication failed';

      if (errorInfo.code === 'cors_error') {
        errorMessage = 'Connection blocked by security policy. Please contact support.';
      } else if (error.code === 401) {
        errorMessage = 'Authentication was cancelled or expired. Please try again.';
      } else if (error.code === 400) {
        errorMessage = 'Invalid authentication request. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage(errorMessage);
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    };

    const startCountdown = (callback) => {
      let timer = 3;
      setCountdown(timer);
      
      const interval = setInterval(() => {
        timer -= 1;
        setCountdown(timer);
        
        if (timer <= 0) {
          clearInterval(interval);
          callback();
        }
      }, 1000);
    };

    // Start the OAuth handling process
    handleAppwriteOAuth();
    
  }, [searchParams, dispatch, navigate, SUCCESS_REDIRECT]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  const handleGoHome = () => {
    navigate(SUCCESS_REDIRECT, { replace: true });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center mb-4">
            <Spinner animation="border" variant="primary" size="lg" />
          </div>
        );
      case 'success':
        return (
          <div className="text-center mb-4">
            <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
          </div>
        );
      case 'error':
        return (
          <div className="text-center mb-4">
            <i className="fas fa-times-circle text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: '400px', width: '100%' }} className="shadow">
        <Card.Body className="p-5">
          {getStatusIcon()}
          
          <h4 className="text-center mb-3">
            {status === 'processing' && (
              <>
                <i className="fab fa-google me-2" style={{ color: '#4285f4' }}></i>
                Authenticating...
              </>
            )}
            {status === 'success' && (
              <>
                <i className="fas fa-check me-2 text-success"></i>
                Welcome to Trading Post!
              </>
            )}
            {status === 'error' && (
              <>
                <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                Authentication Failed
              </>
            )}
          </h4>
          
          <p className="text-center text-muted mb-4">
            {message}
          </p>

          {status === 'success' && countdown > 0 && (
            <div className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <Spinner animation="grow" variant="success" size="sm" className="me-2" />
                <span className="badge bg-success">{countdown}</span>
              </div>
              <Button 
                variant="primary" 
                onClick={handleGoHome}
                className="btn-animated"
              >
                <i className="fas fa-shopping-bag me-2"></i>
                Go to Marketplace Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={handleRetry}
                className="btn-animated"
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={handleGoHome}
              >
                <i className="fas fa-home me-2"></i>
                Go to Marketplace
              </Button>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Secure authentication powered by Appwrite
              </small>
            </div>
          )}
        </Card.Body>

        {status === 'processing' && (
          <Card.Footer className="text-center bg-light">
            <small className="text-muted">
              <i className="fab fa-google me-1"></i>
              Connecting with Google
            </small>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
};

export default OAuthCallbackHandler;