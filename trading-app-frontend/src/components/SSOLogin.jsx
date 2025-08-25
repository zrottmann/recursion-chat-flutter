/**
 * SSO Login Component
 * Provides OAuth login buttons for all configured providers
 */

import React, { useState } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { getEnabledProviders } from '../config/appwriteConfig';
import config from '../config/appwriteConfig';
import appwriteService from '../services/appwriteService';
import './SSOLogin.css';

const SSOLogin = ({ onSuccess, onError, redirectUrl }) => {
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState(null);

  const enabledProviders = getEnabledProviders();

  const handleSSOLogin = async (providerId) => {
    console.log(`🚀 [SSO-LOGIN] Starting OAuth login for provider: ${providerId}`);
    console.log(`🔍 [SSO-LOGIN] Current URL: ${window.location.href}`);
    console.log(`🔍 [SSO-LOGIN] Redirect URL from props:`, redirectUrl);
    console.log(`🔍 [SSO-LOGIN] Config callback URL:`, config.oauth.callbackUrl);
    console.log(`🔍 [SSO-LOGIN] Config error URL:`, config.oauth.errorUrl);
    
    try {
      setLoading(true);
      setLoadingProvider(providerId);
      setError(null);

      const successUrl = redirectUrl || config.oauth.callbackUrl;
      const failureUrl = config.oauth.errorUrl;
      
      console.log(`✅ [SSO-LOGIN] Using success URL: ${successUrl}`);
      console.log(`✅ [SSO-LOGIN] Using failure URL: ${failureUrl}`);

      // Create OAuth2 session - this will redirect to provider
      await appwriteService.createOAuth2Session(
        providerId,
        successUrl,
        failureUrl
      );

      console.log(`🔄 [SSO-LOGIN] OAuth redirect initiated - browser should redirect now`);
      // The browser will redirect to the OAuth provider
      // No need to handle success here as user will be redirected
    } catch (err) {
      console.error(`❌ [SSO-LOGIN] OAuth login failed for ${providerId}:`, err);
      console.error(`❌ [SSO-LOGIN] Error details:`, {
        message: err.message,
        code: err.code,
        type: err.type,
        response: err.response
      });
      setError(err.message || `Failed to login with ${providerId}`);
      setLoading(false);
      setLoadingProvider(null);
      
      if (onError) {
        onError(err);
      }
    }
  };

  const getProviderIcon = (provider) => {
    if (provider.id === 'google' && provider.icon.startsWith('http')) {
      return (
        <img 
          src={provider.icon} 
          alt={provider.name}
          className="sso-icon"
          width="20"
          height="20"
        />
      );
    }
    
    return <i className={`${provider.icon} sso-icon`}></i>;
  };

  const getButtonVariant = (provider) => {
    const variantMap = {
      google: 'outline-dark',
      github: 'dark',
      facebook: 'primary',
      microsoft: 'info',
      discord: 'secondary',
      apple: 'dark',
    };
    
    return variantMap[provider.id] || 'outline-secondary';
  };

  if (enabledProviders.length === 0) {
    return (
      <Alert variant="warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        No SSO providers are currently configured. Please contact support.
      </Alert>
    );
  }

  return (
    <div className="sso-login-container">
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError(null)}
          className="mb-3"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      <div className="sso-providers">
        {enabledProviders.map((provider) => (
          <Button
            key={provider.id}
            variant={getButtonVariant(provider)}
            className={`w-100 mb-2 sso-button ${provider.buttonClass}`}
            onClick={() => handleSSOLogin(provider.id)}
            disabled={loading}
            style={{
              '--provider-color': provider.color,
            }}
          >
            {loading && loadingProvider === provider.id ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Connecting...
              </>
            ) : (
              <>
                {getProviderIcon(provider)}
                <span className="ms-2">Continue with {provider.name}</span>
              </>
            )}
          </Button>
        ))}
      </div>

      {enabledProviders.length > 3 && (
        <div className="text-center mt-3">
          <small className="text-muted">
            <i className="fas fa-shield-alt me-1"></i>
            Secure authentication powered by Appwrite
          </small>
        </div>
      )}
    </div>
  );
};

export default SSOLogin;