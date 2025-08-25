import React, { useState, useEffect } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import appwriteService from '../services/appwriteService';

const OAuthProStatus = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [platformStatus, setPlatformStatus] = useState('unknown');
  const [showDetails, setShowDetails] = useState(false);

  const checkPlatformStatus = async () => {
    setIsChecking(true);
    
    try {
      // Test if we can make API calls without CORS errors
      const session = await appwriteService.getCurrentSession();
      
      if (session) {
        setPlatformStatus('active-with-session');
      } else {
        setPlatformStatus('active-no-session');
      }
    } catch (error) {
      if (error.message && error.message.includes('Failed to fetch')) {
        setPlatformStatus('cors-blocked');
      } else if (error.code === 401) {
        // 401 is actually good - means platform is active but no session
        setPlatformStatus('active-no-session');
      } else {
        setPlatformStatus('error');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check platform status on mount
    checkPlatformStatus();
  }, []);

  const getStatusDisplay = () => {
    switch (platformStatus) {
      case 'active-with-session':
        return {
          variant: 'success',
          icon: '✅',
          title: 'Platform Active - PRO Working!',
          message: 'OAuth is fully functional. You are logged in.',
          showWorkaround: false
        };
      
      case 'active-no-session':
        return {
          variant: 'success',
          icon: '✅',
          title: 'Platform Active - PRO Working!',
          message: 'OAuth platform is properly registered. You can now log in normally.',
          showWorkaround: false
        };
      
      case 'cors-blocked':
        return {
          variant: 'warning',
          icon: '⚠️',
          title: 'Platform Registration Issue',
          message: 'CORS is still blocking requests. Platform may need re-registration with PRO account.',
          showWorkaround: true
        };
      
      case 'error':
        return {
          variant: 'danger',
          icon: '❌',
          title: 'Platform Error',
          message: 'Unable to verify platform status.',
          showWorkaround: true
        };
      
      default:
        return {
          variant: 'info',
          icon: '🔍',
          title: 'Checking Platform...',
          message: 'Verifying PRO platform status...',
          showWorkaround: false
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <Alert variant={status.variant} className="mt-3">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <Alert.Heading>
            {status.icon} {status.title}
          </Alert.Heading>
          <p className="mb-0">{status.message}</p>
        </div>
        
        <div>
          {isChecking ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={checkPlatformStatus}
            >
              Recheck
            </Button>
          )}
        </div>
      </div>
      
      {status.showWorkaround && (
        <>
          <hr />
          <Button 
            variant="link" 
            className="p-0"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} PRO Setup Instructions
          </Button>
          
          {showDetails && (
            <div className="mt-3">
              <h6>PRO Account Platform Setup:</h6>
              <ol>
                <li>Go to Appwrite Console → Settings → Platforms</li>
                <li>Remove all existing platforms</li>
                <li>Add new Web platform: <code>tradingpost.appwrite.network</code></li>
                <li>Add wildcard platform: <code>*.appwrite.network</code> (PRO feature)</li>
                <li>Refresh this page to test</li>
              </ol>
              
              <p className="mb-0 small text-muted">
                With PRO, platform registration should be stable and support custom domains.
              </p>
            </div>
          )}
        </>
      )}
    </Alert>
  );
};

export default OAuthProStatus;