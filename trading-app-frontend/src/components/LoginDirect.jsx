import { Container, Card, Alert } from 'react-bootstrap';

const LoginDirect = () => {
  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Direct Login - Disabled</h2>
          
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Security Notice:</strong> Direct login functionality has been disabled for security reasons.
            Please use the regular login form.
          </Alert>
          
          <div className="text-center">
            <a href="/login" className="btn btn-primary">
              Go to Login Page
            </a>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginDirect;