/**
 * Component to handle graceful degradation for features not yet implemented
 */

import { Card, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

const FeatureNotAvailable = ({ 
  featureName, 
  description, 
  expectedAvailability = "soon",
  fallbackAction = null,
  onRetry = null,
  showRetry = false
}) => {
  
  const handleNotifyWhenAvailable = () => {
    toast.info(`We'll notify you when ${featureName} becomes available!`);
    // In a real app, this would save user preference to be notified
  };

  const handleContactSupport = () => {
    window.open(`mailto:support@tradingpost.com?subject=Feature Request: ${featureName}`, '_blank');
  };

  return (
    <Card className="text-center shadow-sm">
      <Card.Body className="p-5">
        <div className="mb-4">
          <i className="fas fa-tools fa-3x text-warning mb-3"></i>
        </div>
        
        <h4 className="mb-3">{featureName} Coming Soon</h4>
        
        <p className="text-muted mb-4">
          {description || `The ${featureName} feature is currently being developed and will be available ${expectedAvailability}.`}
        </p>

        <div className="mb-4">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            We&apos;re working hard to bring you this feature. Thank you for your patience!
          </small>
        </div>

        <div className="d-flex gap-2 justify-content-center flex-wrap">
          {showRetry && onRetry && (
            <Button 
              variant="primary" 
              onClick={onRetry}
              className="btn-sm"
            >
              <i className="fas fa-redo me-1"></i>
              Try Again
            </Button>
          )}
          
          {fallbackAction && (
            <Button 
              variant="outline-primary" 
              onClick={fallbackAction.action}
              className="btn-sm"
            >
              <i className={`${fallbackAction.icon} me-1`}></i>
              {fallbackAction.label}
            </Button>
          )}
          
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleNotifyWhenAvailable}
          >
            <i className="fas fa-bell me-1"></i>
            Notify Me
          </Button>
          
          <Button 
            variant="outline-info" 
            size="sm"
            onClick={handleContactSupport}
          >
            <i className="fas fa-envelope me-1"></i>
            Contact Support
          </Button>
        </div>

        {/* Development Info (only shown in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-light rounded">
            <small className="text-muted">
              <strong>Dev Info:</strong> This component is shown when an API endpoint returns 404/405 or when a feature is not yet implemented.
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default FeatureNotAvailable;