import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import './AuthIntegration.css';

const forgotPasswordSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
}).required();

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      // Send password reset request
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send reset email');
      }

      setMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto auth-card glass-effect" style={{ maxWidth: '450px' }}>
        <Card.Body>
          <h2 className="text-center mb-4 gradient-text">
            Reset Your Password
          </h2>
          
          <p className="text-center text-muted mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => setError('')}
              className="mb-3"
            >
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {message && (
            <Alert 
              variant="success" 
              className="mb-3"
            >
              <i className="fas fa-check-circle me-2"></i>
              {message}
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

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3 btn-animated"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending reset email...
                </>
              ) : (
                <>
                  <i className="fas fa-envelope me-2"></i>
                  Send Reset Email
                </>
              )}
            </Button>
          </Form>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/login')}
              className="text-decoration-none"
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Login
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;