import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { login, clearError } from '../store/slices/userSlice';
import GoogleLoginButton from './GoogleLogin';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
}).required();

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.user);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Don't auto-clear errors - let user dismiss manually or on new submission
  // This makes errors persist so users can actually read them

  const onSubmit = async (data) => {
    try {
      // Clear any existing errors before new attempt
      if (error) {
        dispatch(clearError());
      }
      
      console.log('🔐 LOGIN FORM SUBMISSION');
      console.log('📧 Email:', data.email);
      console.log('🔑 Password provided:', !!data.password);
      console.log('🔑 Password length:', data.password?.length || 0);
      console.log('⏰ Submission time:', new Date().toISOString());
      
      await dispatch(login(data)).unwrap();
      console.log('✅ LOGIN SUCCESS - Navigating to home');
      navigate('/');
    } catch (error) {
      console.error('❌ LOGIN FAILED');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      // The error will be displayed via Redux state and will persist
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto card-animated glass-effect" style={{ maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4 gradient-text">Login</h2>
          
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => dispatch(clearError())}
              className="mb-3"
            >
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3 form-animated">
              <Form.Control
                type="email"
                {...register('email')}
                isInvalid={!!errors.email}
                placeholder="Enter your email"
              />
              <Form.Label>Email</Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 form-animated">
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  isInvalid={!!errors.password}
                  placeholder="Enter your password"
                />
                <Button 
                  variant="outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </Button>
              </InputGroup>
              <Form.Label>Password</Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100 btn-animated btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-animated me-2"></span>
                  <span className="loading-dots">Logging in</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2 icon-animated"></i>
                  Login
                </>
              )}
            </Button>
          </Form>

          {/* Google OAuth Divider */}
          <div className="d-flex align-items-center my-4">
            <hr className="flex-grow-1" />
            <span className="px-3 text-muted small">OR</span>
            <hr className="flex-grow-1" />
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton onSuccess={(user) => navigate('/')} />

          <div className="text-center mt-3">
            <small className="text-muted">
              Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;