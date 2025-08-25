import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import FirebaseAuth from './FirebaseAuth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * AuthIntegration Component
 * Bridges Firebase Auth with Trading Post's existing authentication system
 */
const AuthIntegration = ({ onClose, redirectTo = '/dashboard' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for auth state changes
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in with Firebase
        console.log('Firebase user detected:', user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // Store tokens in localStorage (already done by FirebaseAuth)
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken) {
        throw new Error('No access token received');
      }

      // Dispatch Redux action to update auth state
      dispatch({
        type: 'auth/loginSuccess',
        payload: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: data.user || data
        }
      });

      // Fetch user profile from backend
      const profileResponse = await fetch('/api/firebase/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        
        // Update user profile in Redux
        dispatch({
          type: 'user/setProfile',
          payload: profile
        });

        // Store user info for quick access
        localStorage.setItem('user_email', profile.firebase?.email || '');
        localStorage.setItem('user_id', profile.local?.id || '');
        localStorage.setItem('user_name', profile.firebase?.display_name || profile.local?.username || '');
      }

      // Close modal if provided
      if (onClose) {
        onClose();
      }

      // Navigate to dashboard or specified route
      navigate(redirectTo);

      // Show success message
      console.log('Successfully authenticated with Firebase!');
      
    } catch (error) {
      console.error('Auth integration error:', error);
      setError(error.message || 'Failed to complete authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (error) => {
    console.error('Firebase auth error:', error);
    setError(error.message || 'Authentication failed');
    
    // Dispatch Redux action for auth failure
    dispatch({
      type: 'auth/loginFailure',
      payload: error.message
    });
  };

  return (
    <div className="auth-integration-wrapper">
      {isLoading && (
        <div className="auth-loading-overlay">
          <div className="spinner"></div>
          <p>Completing authentication...</p>
        </div>
      )}
      
      {error && (
        <div className="auth-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button 
            onClick={() => setError('')} 
            className="error-close"
          >
            ×
          </button>
        </div>
      )}

      <FirebaseAuth 
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />

      {/* Traditional login link */}
      <div className="auth-alternative">
        <p>Having trouble? Try our 
          <button 
            onClick={() => navigate('/traditional-login')}
            className="link-button"
          >
            traditional login
          </button>
        </p>
      </div>
    </div>
  );
};

// Auth Guard HOC for protected routes
export const withAuthGuard = (Component) => {
  const AuthGuardComponent = (props) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Check if we have valid backend token
          const token = localStorage.getItem('access_token');
          if (token) {
            // Verify token with backend
            try {
              const response = await fetch('/api/auth/verify', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                setUser(firebaseUser);
              } else {
                // Token invalid, redirect to login
                navigate('/login');
              }
            } catch (error) {
              console.error('Token verification failed:', error);
              navigate('/login');
            }
          } else {
            // No token, redirect to login
            navigate('/login');
          }
        } else {
          // No Firebase user, redirect to login
          navigate('/login');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [navigate]);

    if (loading) {
      return (
        <div className="auth-guard-loading">
          <div className="spinner"></div>
          <p>Verifying authentication...</p>
        </div>
      );
    }

    if (!user) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} user={user} />;
  };
  
  AuthGuardComponent.displayName = `withAuthGuard(${Component.displayName || Component.name || 'Component'})`;
  return AuthGuardComponent;
};

// Hook for checking auth status
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      const token = localStorage.getItem('access_token');

      if (firebaseUser && token) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setIsAuthenticated(true);
            setUser(firebaseUser);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }

      setIsLoading(false);
    };

    // Set up listener for auth changes
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, () => {
      checkAuth();
    });

    return () => unsubscribe();
  }, []);

  return { isAuthenticated, isLoading, user };
};

// Hook for sign out
export const useSignOut = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signOut = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();

      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');

      // Dispatch Redux action
      dispatch({ type: 'auth/logout' });

      // Navigate to home
      navigate('/');

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  return signOut;
};

export default AuthIntegration;