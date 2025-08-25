import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { setUser } from '../store/slices/userSlice';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get the authorization code from URL parameters
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received from Google');
      }

      console.log('Processing OAuth callback with code:', code);

      // Exchange code for tokens with our backend
      const response = await axios.post(`${API_URL}/api/auth/google/callback`, {
        code: code,
        redirect_uri: `${window.location.origin}/oauth/callback`
      });

      const { access_token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', access_token);
      
      // Update Redux store
      dispatch(setUser(user));

      // Show success message
      toast.success(`Welcome ${user.username}! Successfully signed in with Google.`);

      // Redirect to home page
      navigate('/', { replace: true });

    } catch (error) {
      console.error('OAuth callback error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to complete Google sign in';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <Card className="mx-auto" style={{ maxWidth: '400px' }}>
          <Card.Body className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5>Completing Google Sign In...</h5>
            <p className="text-muted">Please wait while we process your authentication.</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Card className="mx-auto" style={{ maxWidth: '400px' }}>
          <Card.Body className="text-center">
            <Alert variant="danger">
              <Alert.Heading>Authentication Failed</Alert.Heading>
              <p>{error}</p>
              <hr />
              <p className="mb-0">
                You will be redirected to the login page in a few seconds.
              </p>
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return null;
};

export default OAuthCallback;