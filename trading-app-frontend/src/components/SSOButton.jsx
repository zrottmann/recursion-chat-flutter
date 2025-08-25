import React, { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import appwriteAuthService from '../services/appwriteAuthService';
import silentOAuthService from '../services/silentOAuthService';
import appwriteConfig from '../config/appwriteConfig';
import './SSOButton.css';

const SSOButton = ({ provider, onSuccess, onError, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  // Check if provider is enabled in config
  const enabledProviders = appwriteConfig?.oauth?.providers?.filter(p => p?.enabled) || [];
  const isProviderEnabled = enabledProviders.some(p => p?.id === provider);
  
  console.log(`🔍 Provider ${provider} enabled:`, isProviderEnabled);
  console.log('📋 All enabled providers:', enabledProviders.map(p => p.id));

  // Don't render button if provider is not enabled
  if (!isProviderEnabled) {
    console.log(`⚠️ Provider ${provider} is disabled in config - not rendering button`);
    return null;
  }

  const providerConfig = {
    google: {
      name: 'Google',
      icon: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
      color: '#4285F4',
      bgColor: '#ffffff',
      borderColor: '#dadce0'
    },
    github: {
      name: 'GitHub',
      icon: null, // Using FontAwesome icon
      color: '#24292e',
      bgColor: '#ffffff',
      borderColor: '#24292e'
    },
    facebook: {
      name: 'Facebook',
      icon: null, // Using FontAwesome icon
      color: '#1877f2',
      bgColor: '#1877f2',
      borderColor: '#1877f2'
    }
  };

  const uiConfig = providerConfig[provider];

  const handleSSOLogin = async () => {
    try {
      setLoading(true);
      
      console.log(`🚀 [SSO-BUTTON] Starting silent ${provider} OAuth login...`);
      console.log('🌐 [SSO-BUTTON] Current window location:', window.location.href);
      console.log('🔐 [SSO-BUTTON] Using invisible OAuth flow - no callback URLs will be visible to user');
      
      // Only support Google OAuth for now
      if (provider === 'google') {
        // Use silent OAuth service to prevent visible redirects
        const result = await silentOAuthService.createOAuthSession('google');
        
        if (result.success) {
          console.log('✅ [SSO-BUTTON] Silent OAuth successful!', result.user);
          setLoading(false);
          
          if (onSuccess) {
            onSuccess({
              user: result.user,
              provider: provider,
              method: 'silent_oauth'
            });
          }
        } else {
          throw new Error(result.error || 'Silent OAuth failed');
        }
      } else {
        throw new Error(`Provider ${provider} not yet implemented for silent OAuth`);
      }
      
    } catch (error) {
      console.error(`❌ [SSO-BUTTON] ${provider} OAuth error:`, error);
      setLoading(false);
      
      // Provide more specific error messages
      let errorMessage = `Failed to authenticate with ${uiConfig.name}.`;
      if (error.message) {
        if (error.message.includes('blocked')) {
          errorMessage += ' Pop-ups may be blocked. Please allow pop-ups and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage += ' Authentication timed out. Please try again.';
        } else if (error.message.includes('cancelled')) {
          errorMessage += ' Authentication was cancelled.';
        } else if (error.message.includes('network')) {
          errorMessage += ' Network error. Please check your connection.';
        } else {
          errorMessage += ' Please try again.';
        }
      }
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const renderIcon = () => {
    if (uiConfig.icon) {
      return <img src={uiConfig.icon} alt={uiConfig.name} className="sso-icon" />;
    }
    
    // FontAwesome icons
    const iconClass = {
      github: 'fab fa-github',
      facebook: 'fab fa-facebook-f'
    }[provider];
    
    return <i className={`${iconClass} sso-icon`}></i>;
  };

  return (
    <Button
      variant="outline-dark"
      className="sso-button"
      onClick={handleSSOLogin}
      disabled={disabled || loading}
      style={{
        backgroundColor: uiConfig.bgColor,
        borderColor: uiConfig.borderColor,
        color: uiConfig.color,
        borderWidth: '2px',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      {loading ? (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          style={{ color: uiConfig.color }}
        />
      ) : (
        renderIcon()
      )}
      <span>
        {loading ? `Connecting to ${uiConfig.name}...` : `Continue with ${uiConfig.name}`}
      </span>
    </Button>
  );
};

export default SSOButton;