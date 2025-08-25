import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/userSlice';
import { toast } from 'react-toastify';
// jwt-decode import removed as it's not used
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Google Client ID - should be in environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleLoginButton = ({ onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(GOOGLE_CLIENT_ID);

  useEffect(() => {
    // Fetch Google OAuth config from backend if not in env
    if (!googleClientId) {
      fetchGoogleConfig();
    }
  }, [googleClientId]);

  const fetchGoogleConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/google/config`);
      if (response?.data?.enabled && response?.data?.client_id) {
        setGoogleClientId(response.data.client_id);
      }
    } catch (error) {
      console.log('Google OAuth not configured on server');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      // Send the credential to our backend
      const response = await axios.post(`${API_URL}/api/auth/google/verify`, {
        credential: credentialResponse.credential
      });

      const { access_token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', access_token);
      
      // Update Redux store
      dispatch(setUser(user));

      // Show success message
      toast.success('Successfully signed in with Google!');

      // Call parent success handler if provided
      if (onSuccess) {
        onSuccess(user);
      } else {
        // Navigate to home or dashboard
        navigate('/');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.response?.data?.detail || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign in was unsuccessful');
  };

  // Custom button using useGoogleLogin hook for more control (not used in production)
  // const CustomGoogleButton = () => {
    const login = useGoogleLogin({
      onSuccess: async (codeResponse) => {
        setLoading(true);
        try {
          // Exchange authorization code for tokens
          const response = await axios.post(`${API_URL}/api/auth/google/callback`, {
            code: codeResponse.code,
            redirect_uri: `${window.location.origin}/oauth/callback`
          });

          const { access_token, user } = response.data;

          // Store token in localStorage
          localStorage.setItem('token', access_token);
          
          // Update Redux store
          dispatch(setUser(user));

          // Show success message
          toast.success('Successfully signed in with Google!');

          // Navigate or call success handler
          if (onSuccess) {
            onSuccess(user);
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Google login error:', error);
          toast.error(error.response?.data?.detail || 'Failed to sign in with Google');
        } finally {
          setLoading(false);
        }
      },
      onError: handleGoogleError,
      flow: 'auth-code',
      redirect_uri: `${window.location.origin}/oauth/callback`
    });

    return (
      <button
        onClick={() => login()}
        disabled={loading || !googleClientId}
        className="btn btn-light w-100 d-flex align-items-center justify-content-center"
        style={{
          border: '1px solid #dadce0',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '4px',
          transition: 'background-color 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {loading ? (
          <span>Signing in...</span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '8px' }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </button>
    );
  };

  if (!googleClientId) {
    return null; // Don't show button if Google OAuth is not configured
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="google-login-container">
        {/* Option 1: Use Google's default button */}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="outline"
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
        />
        
        {/* Option 2: Use custom button (uncomment to use) */}
        {/* <CustomGoogleButton /> */}
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;