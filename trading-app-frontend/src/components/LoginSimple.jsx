import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';
import { fetchUserProfile } from '../store/slices/userSlice';

const LoginSimple = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Extract username from email
    const username = email.split('@')[0];
    
    // Debug logging (secure - no password exposure)
    const debug = {
      email,
      username,
      passwordLength: password.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔐 LOGIN ATTEMPT - SIMPLE FORM');
    console.log('📧 Email:', email);
    console.log('👤 Username:', username);
    console.log('📏 Password length:', password.length);
    
    setDebugInfo(debug);
    
    try {
      // Create form data manually
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      console.log('📋 Form data string:', formData.toString());
      
      // Direct API call
      const response = await fetch(`${api.defaults.baseURL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ LOGIN SUCCESS');
        console.log('🎫 Token received: [REDACTED]');
        
        // Store token
        localStorage.setItem('token', data.access_token);
        
        // Fetch user profile
        await dispatch(fetchUserProfile());
        
        // Navigate to home
        navigate('/');
      } else {
        console.error('❌ LOGIN FAILED:', data);
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      console.error('❌ LOGIN ERROR:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    console.log('🔤 Password input changed: [REDACTED] length:', value.length);
    setPassword(value);
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Login (Simple Form)</h2>
          
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="off"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="off"
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </Button>
              </div>
              {showPassword && (
                <small className="text-muted">
                  Password visibility enabled
                </small>
              )}
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
          
          {debugInfo && (
            <div className="mt-3 p-2 bg-light border rounded">
              <small>
                <strong>Debug Info:</strong><br/>
                Email: {debugInfo.email}<br/>
                Username: {debugInfo.username}<br/>
                Password: [REDACTED]<br/>
                Length: {debugInfo.passwordLength}<br/>
              </small>
            </div>
          )}
          
          <hr className="my-3" />
          
          <div className="text-center">
            <small className="text-muted">
              Use your registered credentials to log in
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginSimple;