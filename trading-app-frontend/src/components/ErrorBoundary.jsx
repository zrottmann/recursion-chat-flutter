import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to show the error UI
    return { 
      hasError: true,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error locally
    if (window.errorLoggingService) {
      try {
        window.errorLoggingService.logError(error, {
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId
        });
      } catch (e) {
        // Prevent error logging from causing more errors
      }
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <Container className="py-5">
          <Card className="mx-auto" style={{ maxWidth: '600px' }}>
            <Card.Body>
              <div className="text-center mb-4">
                <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
                <h2 className="mt-3 text-danger">Something went wrong</h2>
                <p className="text-muted">
                  We encountered an unexpected error. Our team has been notified.
                </p>
              </div>

              {errorId && (
                <Alert variant="info" className="text-center">
                  <small>Error ID: {errorId}</small>
                </Alert>
              )}

              <div className="d-flex gap-2 justify-content-center mb-4">
                <Button variant="primary" onClick={this.handleRetry}>
                  <i className="fas fa-redo me-2"></i>
                  Try Again
                </Button>
                <Button variant="outline-secondary" onClick={this.handleReload}>
                  <i className="fas fa-refresh me-2"></i>
                  Reload Page
                </Button>
              </div>

              {isDevelopment && error && (
                <Alert variant="danger" className="text-start">
                  <Alert.Heading>Development Error Details</Alert.Heading>
                  <hr />
                  <strong>Error:</strong>
                  <pre className="mt-2 mb-3" style={{ fontSize: '0.85rem' }}>
                    {error.toString()}
                  </pre>
                  
                  <strong>Stack Trace:</strong>
                  <pre className="mt-2 mb-3" style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                    {error.stack}
                  </pre>

                  {errorInfo && (
                    <>
                      <strong>Component Stack:</strong>
                      <pre className="mt-2" style={{ fontSize: '0.75rem', maxHeight: '150px', overflow: 'auto' }}>
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;