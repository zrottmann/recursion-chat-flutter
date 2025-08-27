/**
 * Easy SSO Button Component for Appwrite
 * Simple, beautiful, and functional OAuth buttons
 */

import React, { useState, useEffect } from 'react';
import EasyAppwriteSSO from './easy-appwrite-sso';

// Provider configurations with branding
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
    svg: null, // Will use icon font
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
    svg: null,
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
    svg: null,
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
    svg: null,
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
    svg: null,
    colors: {
      bg: '#5865f2',
      text: '#ffffff',
      border: '#5865f2',
      hover: '#4752c4'
    }
  },
  spotify: {
    name: 'Spotify',
    icon: '🎵',
    svg: null,
    colors: {
      bg: '#1ed760',
      text: '#000000',
      border: '#1ed760',
      hover: '#1db954'
    }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    svg: null,
    colors: {
      bg: '#0077b5',
      text: '#ffffff',
      border: '#0077b5',
      hover: '#006399'
    }
  }
};

const EasySSOButton = ({ 
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
  const [sso, setSSO] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Initialize SSO service
  useEffect(() => {
    const ssoInstance = new EasyAppwriteSSO(appwriteConfig);
    setSSO(ssoInstance);
    setMounted(true);
  }, []);

  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.google;
  
  const handleClick = async () => {
    if (!sso || loading || disabled) return;

    setLoading(true);
    try {
      const user = await sso.signIn(provider);
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(user);
      }
    } catch (error) {
      setLoading(false);
      console.error(`[EasySSOButton] ${provider} auth error:`, error);
      
      if (onError) {
        onError(error);
      }
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
    userSelect: 'none'
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
      className={`${sizeClasses[size]} ${styleClasses[style]} ${className}`}
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

// Multiple provider buttons component
export const EasySSOGroup = ({ 
  providers = ['google', 'github', 'facebook'],
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
    <div style={containerStyles}>
      {providers.map(provider => (
        <EasySSOButton
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

export default EasySSOButton;