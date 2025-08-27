/**
 * Unified SSO Authentication Module
 * Combines the best patterns from all projects for consistent authentication
 * Mobile-optimized with comprehensive OAuth provider support
 */

import React, { useState, useEffect } from 'react';
import './UnifiedSSO.css';

// OAuth Provider Configurations
const PROVIDER_CONFIG = {
  google: {
    name: 'Google',
    icon: '🔍',
    svg: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
    colors: {
      bg: '#ffffff',
      text: '#3c4043',
      border: '#dadce0',
      hover: '#f8f9fa'
    }
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    colors: {
      bg: '#24292e',
      text: '#ffffff',
      border: '#24292e',
      hover: '#1a1e22'
    }
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    colors: {
      bg: '#1877f2',
      text: '#ffffff',
      border: '#1877f2',
      hover: '#166fe5'
    }
  },
  apple: {
    name: 'Apple',
    icon: '🍎',
    colors: {
      bg: '#000000',
      text: '#ffffff',
      border: '#000000',
      hover: '#1a1a1a'
    }
  },
  microsoft: {
    name: 'Microsoft',
    icon: '🪟',
    colors: {
      bg: '#2f2f2f',
      text: '#ffffff',
      border: '#2f2f2f',
      hover: '#1f1f1f'
    }
  },
  discord: {
    name: 'Discord',
    icon: '💬',
    colors: {
      bg: '#5865f2',
      text: '#ffffff',
      border: '#5865f2',
      hover: '#4752c4'
    }
  }
};

// Unified SSO Button Component
export const UnifiedSSOButton = ({ 
  provider = 'google',
  onSuccess,
  onError,
  text,
  style = 'default',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  className = '',
  appwriteConfig = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.google;
  
  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      // Use the provided authentication service
      if (appwriteConfig.authService) {
        const user = await appwriteConfig.authService.signInWithProvider(provider);
        setLoading(false);
        if (onSuccess) onSuccess(user);
      } else {
        throw new Error('Authentication service not configured');
      }
    } catch (error) {
      setLoading(false);
      console.error(`[UnifiedSSO] ${provider} auth error:`, error);
      if (onError) onError(error);
    }
  };

  // Button size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2.5 text-base',
    large: 'px-6 py-3 text-lg'
  };

  // Button styles
  const styleClasses = {
    default: `bg-white border-2`,
    filled: '',
    outline: 'bg-transparent border-2',
    minimal: 'bg-transparent border-0'
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    minHeight: '48px' // Touch-friendly mobile target
  };

  const buttonStyles = {
    ...baseStyles,
    backgroundColor: style === 'filled' ? config.colors.bg : 
                     style === 'default' ? '#ffffff' : 
                     'transparent',
    color: style === 'filled' ? config.colors.text : 
           style === 'default' || style === 'outline' ? config.colors.bg : 
           config.colors.bg,
    borderColor: style === 'minimal' ? 'transparent' : config.colors.border
  };

  const buttonText = text || `Continue with ${config.name}`;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || !mounted}
      className={`unified-sso-button ${sizeClasses[size]} ${styleClasses[style]} ${className}`}
      style={buttonStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          if (style === 'filled') {
            e.currentTarget.style.backgroundColor = config.colors.hover;
          } else if (style === 'default') {
            e.currentTarget.style.backgroundColor = config.colors.hover;
            e.currentTarget.style.color = '#ffffff';
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        if (style === 'filled') {
          e.currentTarget.style.backgroundColor = config.colors.bg;
        } else if (style === 'default') {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.color = config.colors.bg;
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTopColor: 'currentColor',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite'
            }}
          />
          Connecting...
        </span>
      ) : (
        <>
          {config.svg ? (
            <img 
              src={config.svg} 
              alt={config.name}
              style={{ width: '20px', height: '20px' }}
            />
          ) : (
            <span style={{ fontSize: '20px' }}>{config.icon}</span>
          )}
          <span>{buttonText}</span>
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

// Unified Authentication Component
export const UnifiedAuth = ({
  appwriteConfig,
  onSuccess,
  onError,
  showEmailAuth = true,
  showSSOAuth = true,
  enabledProviders = ['google', 'github'],
  title = 'Welcome',
  subtitle = 'Sign in to your account',
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isSignUp) {
        const result = await appwriteConfig.authService.signup(email, password, email.split('@')[0]);
        setMessage({
          type: 'success',
          text: result.message || 'Account created! Please check your email for verification.'
        });
      } else {
        const result = await appwriteConfig.authService.signin(email, password);
        setMessage({
          type: 'success',
          text: 'Successfully signed in! Redirecting...'
        });
        setTimeout(() => {
          if (onSuccess) onSuccess(result.user);
        }, 1000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Authentication failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSSOSuccess = async (user) => {
    setMessage({
      type: 'success',
      text: `Welcome, ${user.name || user.email}!`
    });
    setTimeout(() => {
      if (onSuccess) onSuccess(user);
    }, 1000);
  };

  const handleSSOError = (error) => {
    setMessage({
      type: 'error',
      text: error.message || 'Authentication failed. Please try again.'
    });
  };

  return (
    <div className={`unified-auth-wrapper ${className}`}>
      <div className="unified-auth-background">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
      </div>
      
      <div className="unified-auth-container">
        <div className="unified-auth-card">
          <div className="unified-auth-header">
            <h1 className="unified-auth-title">{title}</h1>
            <p className="unified-auth-subtitle">{subtitle}</p>
          </div>
          
          {message.text && (
            <div className={`unified-auth-message ${message.type}`}>
              <span className="message-icon">
                {message.type === 'success' ? '✓' : 
                 message.type === 'error' ? '!' : 
                 message.type === 'info' ? 'ℹ' : ''}
              </span>
              {message.text}
            </div>
          )}

          {showEmailAuth && (
            <>
              <form onSubmit={handleEmailAuth} className="unified-auth-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input with-toggle"
                      placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength="8"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="form-hint">Must be at least 8 characters</p>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner"></span>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>

              <div className="unified-auth-footer">
                <p className="auth-switch-text">
                  {isSignUp 
                    ? 'Already have an account?' 
                    : 'Don\'t have an account?'
                  }
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setMessage({ type: '', text: '' });
                    }}
                    disabled={loading}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </>
          )}

          {showEmailAuth && showSSOAuth && (
            <div className="unified-auth-divider">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>
          )}

          {showSSOAuth && (
            <div className="unified-social-auth">
              {enabledProviders.map(provider => (
                <UnifiedSSOButton
                  key={provider}
                  provider={provider}
                  onSuccess={handleSSOSuccess}
                  onError={handleSSOError}
                  size="large"
                  fullWidth={true}
                  style="default"
                  className="sso-button-spacing"
                  appwriteConfig={appwriteConfig}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="unified-auth-overlay">
          <div className="unified-auth-loading-modal">
            <div className="spinner-large"></div>
            <p>Processing authentication...</p>
            <p className="loading-hint">Please wait while we sign you in</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Multiple provider buttons group component
export const UnifiedSSOGroup = ({ 
  providers = ['google', 'github'],
  onSuccess,
  onError,
  orientation = 'vertical',
  gap = '12px',
  ...buttonProps
}) => {
  const containerStyles = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: gap,
    width: '100%'
  };

  return (
    <div style={containerStyles} className="unified-sso-group">
      {providers.map(provider => (
        <UnifiedSSOButton
          key={provider}
          provider={provider}
          onSuccess={onSuccess}
          onError={onError}
          fullWidth={orientation === 'vertical'}
          {...buttonProps}
        />
      ))}
    </div>
  );
};

export default { UnifiedAuth, UnifiedSSOButton, UnifiedSSOGroup };