import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { signup } from '../store/slices/userSlice';
import GoogleLoginButton from './GoogleLogin';

const schema = yup.object({
  email: yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
  zipcode: yup.string()
    .required('Zip code is required')
    .matches(/^\d{5}(-\d{4})?$/, 'Enter a valid US zip code (e.g., 12345 or 12345-6789)'),
  optInLocation: yup.boolean()
}).required();

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.user);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      optInLocation: true
    }
  });

  const onSubmit = async (data) => {
    try {
      // Remove confirmPassword before sending to API and auto-generate username
      const { confirmPassword, ...signupData } = data;
      
      // Auto-generate username from email (part before @)
      const username = signupData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      signupData.username = username;
      
      await dispatch(signup(signupData)).unwrap();
      setSignupSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Sign Up</h2>
          
          {error && (
            <Alert variant="danger" dismissible>
              {error}
            </Alert>
          )}
          
          {signupSuccess && (
            <Alert variant="success">
              Account created successfully! Redirecting to login...
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                {...register('email')}
                isInvalid={!!errors.email}
                placeholder="Enter your email"
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                {...register('password')}
                isInvalid={!!errors.password}
                placeholder="Create a strong password"
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Must contain uppercase, lowercase, number, and special character
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                {...register('confirmPassword')}
                isInvalid={!!errors.confirmPassword}
                placeholder="Confirm your password"
              />
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Zip Code (USA only)</Form.Label>
              <Form.Control
                type="text"
                {...register('zipcode')}
                isInvalid={!!errors.zipcode}
                placeholder="12345"
                maxLength="10"
              />
              <Form.Control.Feedback type="invalid">
                {errors.zipcode?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Your location helps us find nearby traders
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                {...register('optInLocation')}
                label="Allow other users to see my approximate location"
              />
              <Form.Text className="text-muted">
                We only share your city/state, never your exact address
              </Form.Text>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading || signupSuccess}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
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
              Already have an account? <Link to="/login">Login here</Link>
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Signup;