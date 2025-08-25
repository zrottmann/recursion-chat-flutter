/**
 * Protected Route Component
 * Restricts access to authenticated users only
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Container } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireVerified = false, fallbackPath = '/login' }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireVerified && user && !user.emailVerification) {
    return (
      <Container className="py-5">
        <div className="alert alert-warning text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Please verify your email address to access this page.
          <br />
          <small className="text-muted">Check your inbox for the verification email.</small>
        </div>
      </Container>
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;