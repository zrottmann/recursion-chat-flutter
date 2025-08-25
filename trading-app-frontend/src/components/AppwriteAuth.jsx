import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Form, Button, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { clearError, setUser, setError } from '../store/slices/userSlice';
import appwriteAuth from '../services/appwriteAuth';
import appwriteService from '../services/appwriteService';
// import { account } from '../lib/appwrite';
import config from '../config/appwriteConfig';
import SSOButton from './SSOButton';
import { fixOAuthCallbackIssues } from '../utils/loginErrorFixer';
import { useAuth } from '../hooks/useAuth';
import './AuthIntegration.css';

const loginSchema = yup.object({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
}).required();

const signupSchema = yup.object({
  name: yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .max(100, 'Email cannot exceed 100 characters'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
}).required();

const AppwriteAuth = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.user);
  const { isAuthenticated: authHookAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState(mode);
  const [ssoLoading, setSsoLoading] = useState(false);

  const schema = authMode === 'login' ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Redirect authenticated users away from login/signup pages
  useEffect(() => {
    if (authHookAuthenticated && !loading && !ssoLoading) {
      console.log('🔐 User already authenticated, redirecting from login page...');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authHookAuthenticated, loading, ssoLoading, navigate, location]);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setSsoLoading(true);
        dispatch(clearError());
        
        console.log('\ud83d\udd10 Processing OAuth callback...');
        
        // Try AppwriteService first for OAuth callback handling
        let result;
        try {
          result = await appwriteService.handleOAuthCallback();
        } catch (serviceError) {
          console.log('AppwriteService failed, trying appwriteAuth fallback...', serviceError);
          // Fallback to existing appwriteAuth method
          result = await appwriteAuth.getCurrentUser();
          if (result.success && result.user) {
            const profileResult = await appwriteAuth.getUserProfile();
            result = {
              success: true,
              user: {
                ...result.user,
                profile: profileResult.success ? profileResult.profile : null
              }
            };
          }
        }
        
        if (result && result.success !== false && result.user) {
          console.log('\u2705 OAuth callback successful');
          
          dispatch(setUser({
            ...result.user,
            profile: result.user.profile
          }));
          
          // Redirect to intended page or home
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else {
          console.error('\u274c OAuth callback failed:', result);
          dispatch(setError(result?.error || 'OAuth authentication failed. Please try again.'));
        }
      } catch (error) {
        console.error('\u274c OAuth callback error:', error);
        let errorMessage = 'Authentication failed. Please try again.';
        if (error.message) {
          if (error.message.includes('401') || error.message.includes('unauthorized')) {
            errorMessage = 'Authentication was cancelled or expired. Please try logging in again.';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error during authentication. Please try again.';
          }
        }
        dispatch(setError(errorMessage));
      } finally {
        setSsoLoading(false);
      }
    };

    // Check if this is an OAuth callback (check for success/error parameters)
    const urlParams = new URLSearchParams(location.search);
    const hasOAuthParams = urlParams.has('userId') || urlParams.has('secret') || 
                          location.pathname.includes('/auth/callback') ||
                          location.pathname.includes('/oauth/callback');

    if (hasOAuthParams && !sessionStorage.getItem('oauth_callback_processed')) {
      console.log('\ud83d\udd0d Detected OAuth callback parameters, processing...');
      sessionStorage.setItem('oauth_callback_processed', 'true');
      handleOAuthCallback();
      
      // Clear the flag after processing
      setTimeout(() => {
        sessionStorage.removeItem('oauth_callback_processed');
      }, 5000);
    }
  }, [location, dispatch, navigate]);

  const handleSSOLogin = async (provider) => {
    try {
      setSsoLoading(true);
      dispatch(clearError());
      
      console.log(`\ud83d\ude80 Starting ${provider} OAuth flow...`);
      
      // Apply OAuth callback fixes
      fixOAuthCallbackIssues();
      
      // Use AppwriteService OAuth2 with improved error handling
      const successUrl = config.oauth.callbackUrl || `${window.location.origin}/auth/callback`;
      const failureUrl = config.oauth.errorUrl || `${window.location.origin}/auth/error`;
      
      console.log(`Initiating ${provider} OAuth with:`, { successUrl, failureUrl });
      
      // Create OAuth2 session using AppwriteService
      await appwriteService.createOAuth2Session(
        provider,
        successUrl,
        failureUrl
      );
      
      // The browser will redirect to OAuth provider
      // OAuth callback handler will complete the flow
      console.log(`\u2705 ${provider} OAuth redirect initiated`);
      
    } catch (error) {
      console.error(`\u274c ${provider} SSO error:`, error);
      
      // More detailed error handling
      let errorMessage = `Failed to login with ${provider}.`;
      if (error.message) {
        if (error.message.includes('blocked') || error.message.includes('popup')) {
          errorMessage += ' Pop-ups may be blocked. Please allow pop-ups and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += ' Network connection issue. Please check your internet connection.';
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
          errorMessage += ' Authentication provider configuration issue.';
        } else {
          errorMessage += ' Please try again or contact support if the issue persists.';
        }
      }
      
      dispatch(setError(errorMessage));
      setSsoLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      dispatch(clearError());
      
      if (authMode === 'login') {
        // Login with Appwrite
        const result = await appwriteAuth.login(data.email, data.password);
        
        if (!result.success) {
          const errorMessage = typeof result.error === 'string' ? result.error : (result.error?.message || 'Login failed');
          throw new Error(errorMessage);
        }
        
        dispatch(setUser({
          ...result.user,
          profile: result.profile
        }));
        
        // Show success message briefly before redirect
        dispatch(setError(null));
        
        // Navigate to intended page or home
        const from = location.state?.from?.pathname || '/';
        console.log('\u2705 Login successful, redirecting to:', from);
        
        // Small delay to show success state
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
        
      } else {
        // Sign up with Appwrite
        const result = await appwriteAuth.register(data.email, data.password, data.name);
        
        if (!result.success) {
          const errorMessage = typeof result.error === 'string' ? result.error : (result.error?.message || 'Registration failed');
          throw new Error(errorMessage);
        }
        
        // Show success message for registration
        dispatch(setError(null));
        console.log('\u2705 Registration successful for:', data.email);
        
        // After successful registration, automatically log in
        const loginResult = await appwriteAuth.login(data.email, data.password);
        
        if (!loginResult.success) {
          // Don't throw - just show message and switch to login mode
          dispatch(setError('Registration successful! Please log in with your credentials.'));
          setAuthMode('login');
          reset();
          return;
        }
        
        dispatch(setUser({
          ...loginResult.user,
          profile: loginResult.profile
        }));
        
        console.log('\u2705 Auto-login after registration successful');
        
        // Navigate to home with small delay
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error) {
      console.error('\u274c Auth error:', error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email. Please check your email or sign up.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('User with this email already exists') || error.message.includes('409')) {
          if (authMode === 'signup') {
            errorMessage = 'An account with this email already exists. Please log in instead.';
            // Auto-switch to login mode
            setTimeout(() => {
              setAuthMode('login');
              reset();
            }, 2000);
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      dispatch(setError(errorMessage));
    }
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    reset();
    dispatch(clearError());
  };

  // Show loading while checking authentication status
  if (authHookAuthenticated && !ssoLoading) {
    return (
      <Container className="py-5">
        <Card className="mx-auto" style={{ maxWidth: '400px' }}>
          <Card.Body className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Redirecting to marketplace...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (ssoLoading) {
    return (
      <Container className="py-5">
        <Card className="mx-auto" style={{ maxWidth: '400px' }}>
          <Card.Body className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Completing authentication...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="mx-auto auth-card glass-effect" style={{ maxWidth: '450px' }}>
        <Card.Body>
          <h2 className="text-center mb-4 gradient-text">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          {/* SSO Integration Ready */}
          
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => dispatch(clearError())}
              className="mb-3 alert-animated"
              style={{
                borderLeft: '4px solid #dc3545',
                backgroundColor: '#f8d7da',
                borderColor: '#f5c6cb',
                borderRadius: '8px'
              }}
            >
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                <div>
                  <strong>Authentication Error</strong><br/>
                  <span>{error}</span>
                </div>
              </div>
            </Alert>
          )}


          {/* SSO Buttons */}
          <div className="sso-section mb-4">
            <Row className="g-2">
              <Col xs={12}>
                <SSOButton
                  provider="google"
                  onSuccess={() => {
                    console.log('Google SSO successful');
                    // Handle success
                  }}
                  onError={(error) => {
                    console.error('Google SSO error:', error);
                    dispatch(setError(error));
                  }}
                  disabled={loading || ssoLoading}
                />
              </Col>
              <Col xs={12}>
                <SSOButton
                  provider="github"
                  onSuccess={() => {
                    console.log('GitHub SSO successful');
                    // Handle success
                  }}
                  onError={(error) => {
                    console.error('GitHub SSO error:', error);
                    dispatch(setError(error));
                  }}
                  disabled={loading || ssoLoading}
                />
              </Col>
              <Col xs={12}>
                <SSOButton
                  provider="facebook"
                  onSuccess={() => {
                    console.log('Facebook SSO successful');
                    // Handle success
                  }}
                  onError={(error) => {
                    console.error('Facebook SSO error:', error);
                    dispatch(setError(error));
                  }}
                  disabled={loading || ssoLoading}
                />
              </Col>
            </Row>
          </div>

          <div className="divider-section mb-4">
            <hr className="divider-line" />
            <span className="divider-text">OR</span>
            <hr className="divider-line" />
          </div>

          {/* Email/Password Form */}
          <Form onSubmit={handleSubmit(onSubmit)}>
            {authMode === 'signup' && (
              <Form.Group className="mb-3 form-animated">
                <Form.Control
                  type="text"
                  {...register('name')}
                  isInvalid={!!errors.name}
                  isValid={!errors.name && register('name').value}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                <Form.Label>Full Name</Form.Label>
                <Form.Control.Feedback type="invalid">
                  {errors.name?.message}
                </Form.Control.Feedback>
                <Form.Control.Feedback type="valid">
                  Looks good!
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Form.Group className="mb-3 form-animated">
              <Form.Control
                type="email"
                {...register('email')}
                isInvalid={!!errors.email}
                isValid={!errors.email && register('email').value}
                placeholder="Enter your email address"
                maxLength={100}
                autoComplete={authMode === 'login' ? 'email' : 'email'}
              />
              <Form.Label>Email Address</Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
              <Form.Control.Feedback type="valid">
                Valid email address!
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 form-animated">
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  isInvalid={!!errors.password}
                  isValid={!errors.password && register('password').value && authMode === 'signup'}
                  placeholder="Enter your password"
                  maxLength={128}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                  style={{
                    borderTopRightRadius: '0.375rem',
                    borderBottomRightRadius: '0.375rem'
                  }}
                >
                  <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </Button>
              </InputGroup>
              <Form.Label>Password</Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
              {authMode === 'signup' && (
                <Form.Control.Feedback type="valid">
                  Strong password!
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {authMode === 'signup' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Text className="text-muted small">
                    <i className="fas fa-info-circle me-1"></i>
                    Password must contain at least 8 characters with uppercase, lowercase, and number
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3 form-animated">
                  <Form.Control
                    type="password"
                    {...register('confirmPassword')}
                    isInvalid={!!errors.confirmPassword}
                    isValid={!errors.confirmPassword && register('confirmPassword').value}
                    placeholder="Confirm your password"
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword?.message}
                  </Form.Control.Feedback>
                  <Form.Control.Feedback type="valid">
                    Passwords match!
                  </Form.Control.Feedback>
                </Form.Group>
              </>
            )}

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3 btn-animated"
              disabled={loading || ssoLoading}
              style={{
                minHeight: '48px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                boxShadow: loading || ssoLoading ? 'none' : '0 2px 4px rgba(0,123,255,0.25)'
              }}
            >
              {loading || ssoLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {authMode === 'login' ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  <i className={`fas fa-${authMode === 'login' ? 'sign-in-alt' : 'user-plus'} me-2`}></i>
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </>
              )}
            </Button>
          </Form>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={toggleMode}
              className="text-decoration-none"
            >
              {authMode === 'login' 
                ? "Don&apos;t have an account? Sign up" 
                : "Already have an account? Login"}
            </Button>
          </div>

          {authMode === 'login' && (
            <div className="text-center mt-2">
              <Button 
                variant="link" 
                onClick={() => navigate('/forgot-password')}
                className="text-decoration-none text-muted small"
              >
                Forgot your password?
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AppwriteAuth;