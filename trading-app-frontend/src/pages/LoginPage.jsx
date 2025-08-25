/**
 * Login Page Component
 * Complete authentication page with SSO and email/password options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, InputGroup, Tab, Tabs } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import SSOLogin from '../components/SSOLogin';
import OAuthRedirectInfo from '../components/OAuthRedirectInfo';
import config from '../config/appwriteConfig';
import './LoginPage.css';

// Validation schemas
const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
}).required();

const signupSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(config.security.passwordMinLength, `Password must be at least ${config.security.passwordMinLength} characters`)
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  acceptTerms: yup.boolean()
    .required('You must accept the terms and conditions')
    .oneOf([true], 'You must accept the terms and conditions'),
}).required();

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, loginWithSSO, isAuthenticated, loading: authLoading, error: authError, clearError } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear error when switching tabs
  useEffect(() => {
    clearError();
  }, [activeTab, clearError]);

  const schema = activeTab === 'login' ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmitLogin = async (data) => {
    setIsSubmitting(true);
    const result = await login(data.email, data.password);
    
    if (result.success) {
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', data.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      navigate(from, { replace: true });
    }
    setIsSubmitting(false);
  };

  const onSubmitSignup = async (data) => {
    setIsSubmitting(true);
    const result = await signup(data.email, data.password, data.name);
    
    if (result.success) {
      navigate(from, { replace: true });
    }
    setIsSubmitting(false);
  };

  const handleSSOSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleSSOError = (error) => {
    console.error('SSO Error:', error);
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail && activeTab === 'login') {
      reset({ email: rememberedEmail });
      setRememberMe(true);
    }
  }, [activeTab, reset]);

  return (
    <Container className="login-page py-5">
      <div className="login-container">
        <Card className="shadow-lg border-0">
          <Card.Body className="p-5">
            {/* Logo and Title */}
            <div className="text-center mb-4">
              <img 
                src="/logo.png" 
                alt={config.ui.appName}
                title={`${config.ui.appName} Logo`}
                className="mb-3"
                style={{ height: '60px' }}
              />
              <h2 className="fw-bold">{config.ui.appName}</h2>
              <p className="text-muted">Your trusted marketplace for trading</p>
            </div>

            {/* Error Alert */}
            {authError && (
              <Alert 
                variant="danger" 
                dismissible 
                onClose={clearError}
                className="mb-3"
              >
                <i className="fas fa-exclamation-triangle me-2"></i>
                {authError}
              </Alert>
            )}

            {/* Success Message for New Signups */}
            {location.state?.message && (
              <Alert variant="success" className="mb-3">
                <i className="fas fa-check-circle me-2"></i>
                {location.state.message}
              </Alert>
            )}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
              fill
            >
              <Tab eventKey="login" title="Login">
                {/* SSO Login Options */}
                {config.features.enableSSO && (
                  <>
                    <SSOLogin 
                      onSuccess={handleSSOSuccess}
                      onError={handleSSOError}
                      redirectUrl={`${window.location.origin}/auth/callback`}
                    />
                    
                    <OAuthRedirectInfo />
                    
                    <div className="divider-section my-4">
                      <hr className="divider-line" />
                      <span className="divider-text">OR</span>
                      <hr className="divider-line" />
                    </div>
                  </>
                )}

                {/* Email/Password Login Form */}
                <Form onSubmit={handleSubmit(onSubmitLogin)}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-envelope"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        {...register('email')}
                        isInvalid={!!errors.email}
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email?.message}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-lock"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        {...register('password')}
                        isInvalid={!!errors.password}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} aria-hidden="true"></i>
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.password?.message}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-flex justify-content-between mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Remember me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <Link to="/forgot-password" className="text-decoration-none">
                      Forgot password?
                    </Link>
                  </div>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3"
                    disabled={isSubmitting || authLoading}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Login
                      </>
                    )}
                  </Button>
                </Form>
              </Tab>

              <Tab eventKey="signup" title="Sign Up">
                {/* SSO Signup Options */}
                {config.features.enableSSO && (
                  <>
                    <SSOLogin 
                      onSuccess={handleSSOSuccess}
                      onError={handleSSOError}
                      redirectUrl={`${window.location.origin}/auth/callback`}
                    />
                    
                    <OAuthRedirectInfo />
                    
                    <div className="divider-section my-4">
                      <hr className="divider-line" />
                      <span className="divider-text">OR</span>
                      <hr className="divider-line" />
                    </div>
                  </>
                )}

                {/* Email/Password Signup Form */}
                <Form onSubmit={handleSubmit(onSubmitSignup)}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-user"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        {...register('name')}
                        isInvalid={!!errors.name}
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name?.message}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-envelope"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        {...register('email')}
                        isInvalid={!!errors.email}
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email?.message}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-lock"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        {...register('password')}
                        isInvalid={!!errors.password}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} aria-hidden="true"></i>
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.password?.message}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Password must contain uppercase, lowercase, number and special character
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-lock"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="password"
                        {...register('confirmPassword')}
                        isInvalid={!!errors.confirmPassword}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword?.message}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      {...register('acceptTerms')}
                      isInvalid={!!errors.acceptTerms}
                      label={
                        <span>
                          I accept the{' '}
                          <Link to="/terms" target="_blank">Terms and Conditions</Link>
                          {' '}and{' '}
                          <Link to="/privacy" target="_blank">Privacy Policy</Link>
                        </span>
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.acceptTerms?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3"
                    disabled={isSubmitting || authLoading}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Sign Up
                      </>
                    )}
                  </Button>
                </Form>
              </Tab>
            </Tabs>

            {/* Additional Options */}
            <div className="text-center mt-3">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Your data is protected with enterprise-grade security
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-4">
          <Link to="/" className="text-muted text-decoration-none me-3">
            <i className="fas fa-home me-1"></i>
            Home
          </Link>
          <Link to="/help" className="text-muted text-decoration-none me-3">
            <i className="fas fa-question-circle me-1"></i>
            Help
          </Link>
          <Link to="/contact" className="text-muted text-decoration-none">
            <i className="fas fa-envelope me-1"></i>
            Contact
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default LoginPage;