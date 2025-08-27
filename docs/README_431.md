# Unified SSO Authentication Module

A comprehensive, mobile-optimized single sign-on authentication system for all projects. Provides consistent authentication experience across web and mobile platforms.

## Features

✅ **Unified Interface**: Consistent authentication across all projects  
✅ **Mobile Optimized**: Touch-friendly with safe area support for iOS/Android  
✅ **OAuth Providers**: Google, GitHub, Facebook, Apple, Microsoft, Discord  
✅ **Email Authentication**: Traditional email/password with validation  
✅ **iOS Safari Fixes**: Handles authentication loops and session issues  
✅ **Auto-Configuration**: Detects project and applies appropriate settings  
✅ **Dark Mode**: Automatic dark mode support  
✅ **Accessibility**: WCAG compliant with keyboard navigation  

## Quick Start

### 1. Copy Module to Your Project

```bash
# Copy the entire UnifiedSSO folder to your project
cp -r shared-components/UnifiedSSO src/components/
```

### 2. Install Dependencies

```bash
npm install appwrite
```

### 3. Basic Usage

```jsx
import React from 'react';
import { UnifiedAuth, createUnifiedSSOConfig } from './components/UnifiedSSO';

function App() {
  const ssoConfig = createUnifiedSSOConfig(); // Auto-detects project
  
  const handleAuthSuccess = (user) => {
    console.log('User authenticated:', user);
    // Redirect to dashboard or main app
  };

  const handleAuthError = (error) => {
    console.error('Authentication failed:', error);
  };

  return (
    <UnifiedAuth
      appwriteConfig={ssoConfig}
      onSuccess={handleAuthSuccess}
      onError={handleAuthError}
      title="Welcome to Your App"
      subtitle="Sign in to continue"
    />
  );
}

export default App;
```

## Configuration

### Auto-Detection
The module automatically detects your project based on:
- Hostname (e.g., `recursion-chat.com` → recursion-chat config)
- Package.json name
- Manual override

### Manual Configuration

```jsx
import { createUnifiedSSOConfig } from './components/UnifiedSSO';

// Override auto-detection
const config = createUnifiedSSOConfig('trading-post', {
  enabledProviders: ['google', 'github'], // Custom providers
  features: {
    emailAuth: true,
    ssoAuth: true,
    biometricAuth: false
  }
});
```

### Project-Specific Settings

Each project has pre-configured settings in `config.js`:

```javascript
'your-project': {
  appwriteEndpoint: 'https://nyc.cloud.appwrite.io/v1',
  appwriteProjectId: 'your-project-id',
  databaseId: 'your-database-id',
  oauth: {
    successUrl: window.location.origin + '/auth/success',
    errorUrl: window.location.origin + '/auth/error'
  },
  enabledProviders: ['google', 'github'],
  features: {
    emailAuth: true,
    ssoAuth: true,
    biometricAuth: false
  }
}
```

## Components

### UnifiedAuth (Full Authentication Page)

```jsx
<UnifiedAuth
  appwriteConfig={ssoConfig}
  onSuccess={handleSuccess}
  onError={handleError}
  title="Welcome Back"
  subtitle="Sign in to your account"
  showEmailAuth={true}
  showSSOAuth={true}
  enabledProviders={['google', 'github']}
  className="custom-auth"
/>
```

### UnifiedSSOButton (Individual Provider Button)

```jsx
<UnifiedSSOButton
  provider="google"
  onSuccess={handleSuccess}
  onError={handleError}
  size="large"
  style="default" // default, filled, outline, minimal
  fullWidth={true}
  appwriteConfig={ssoConfig}
/>
```

### UnifiedSSOGroup (Multiple Provider Buttons)

```jsx
<UnifiedSSOGroup
  providers={['google', 'github', 'facebook']}
  onSuccess={handleSuccess}
  onError={handleError}
  orientation="vertical" // vertical or horizontal
  gap="12px"
  appwriteConfig={ssoConfig}
/>
```

## Mobile Optimization

### iOS Safari Fixes
Automatically handles common iOS Safari authentication issues:
- Authentication loops
- LocalStorage restrictions
- Viewport handling with safe areas
- Virtual keyboard optimization

### Touch-Friendly Design
- 48px minimum touch targets
- Optimized for thumbs and fingers
- Safe area insets for notched devices
- Dynamic viewport height support

### Responsive Breakpoints
- `>768px`: Desktop layout with hover effects
- `≤768px`: Mobile-optimized layout
- `≤380px`: Small phone optimization
- `≤600px height`: Keyboard-open optimization

## OAuth Callback Handling

### Setup OAuth Callback Pages

Create these pages in your project's `public` folder:

**public/auth/success.html**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
</head>
<body>
    <script>
        // Notify parent window (for popup OAuth)
        if (window.opener) {
            window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                success: true
            }, '*');
            window.close();
        } else {
            // Redirect for full-page OAuth
            window.location.href = '/#/dashboard';
        }
    </script>
</body>
</html>
```

**public/auth/error.html**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Failed</title>
</head>
<body>
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error') || 'Authentication failed';
        
        if (window.opener) {
            window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: error
            }, '*');
            window.close();
        } else {
            window.location.href = '/#/auth?error=' + encodeURIComponent(error);
        }
    </script>
</body>
</html>
```

### Configure Appwrite OAuth URLs

In your Appwrite console, set these OAuth callback URLs:
- **Success URL**: `https://yourdomain.com/auth/success`
- **Failure URL**: `https://yourdomain.com/auth/error`

## Styling & Customization

### CSS Custom Properties

Override default colors and spacing:

```css
.unified-auth-wrapper {
  --auth-primary-color: #667eea;
  --auth-border-radius: 12px;
  --auth-spacing: 20px;
  --auth-font-family: 'Inter', sans-serif;
}
```

### Custom Themes

```jsx
<UnifiedAuth
  className="dark-theme"
  appwriteConfig={ssoConfig}
  // ... other props
/>
```

```css
.dark-theme .unified-auth-card {
  background: rgba(26, 32, 44, 0.95);
  color: #f7fafc;
}
```

## Error Handling

### Common Error Patterns

```jsx
const handleAuthError = (error) => {
  switch (error.code) {
    case 401:
      setMessage('Invalid credentials. Please try again.');
      break;
    case 429:
      setMessage('Too many attempts. Please wait and try again.');
      break;
    case 'network_error':
      setMessage('Network error. Please check your connection.');
      break;
    default:
      setMessage(error.message || 'Authentication failed');
  }
};
```

### Retry Logic

```jsx
const [retryCount, setRetryCount] = useState(0);

const handleRetryAuth = async () => {
  if (retryCount < 3) {
    setRetryCount(prev => prev + 1);
    // Retry authentication
  } else {
    setMessage('Maximum retries exceeded. Please try again later.');
  }
};
```

## Integration Examples

### React Router Integration

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UnifiedAuth } from './components/UnifiedSSO';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    checkAuthState();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/auth" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={
          <UnifiedAuth 
            onSuccess={(user) => {
              setUser(user);
              navigate('/dashboard');
            }}
          />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard user={user} />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

### Context Provider Integration

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { createUnifiedSSOConfig } from './components/UnifiedSSO';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const ssoConfig = createUnifiedSSOConfig();

  const login = async (email, password) => {
    const result = await ssoConfig.authService.signin(email, password);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await ssoConfig.authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## Testing

### Unit Testing

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedSSOButton } from './UnifiedSSO';

test('renders Google SSO button', () => {
  const mockConfig = {
    authService: {
      signInWithProvider: jest.fn()
    }
  };

  render(
    <UnifiedSSOButton 
      provider="google" 
      appwriteConfig={mockConfig}
    />
  );

  expect(screen.getByText('Continue with Google')).toBeInTheDocument();
});
```

### E2E Testing

```javascript
// Playwright test
test('complete authentication flow', async ({ page }) => {
  await page.goto('/auth');
  
  // Test email authentication
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="signin-btn"]');
  
  // Should redirect to dashboard
  await page.waitForURL('/dashboard');
  expect(page.url()).toContain('/dashboard');
});
```

## Troubleshooting

### Common Issues

**OAuth Redirect Loop**:
```javascript
// Check OAuth callback URLs in Appwrite console
// Ensure they match your domain exactly
```

**iOS Safari Authentication Issues**:
```javascript
// The module automatically handles these, but you can debug:
import { iosSessionManager } from './components/UnifiedSSO/config';
console.log('iOS Safari detected:', iosSessionManager.isIOSSafari);
```

**Import Errors**:
```javascript
// Ensure Appwrite SDK is installed and available
npm install appwrite
```

**CSS Not Loading**:
```javascript
// Import CSS in your main component
import './components/UnifiedSSO/UnifiedSSO.css';
```

### Debug Mode

Enable debug logging:

```javascript
const ssoConfig = createUnifiedSSOConfig('your-project', {
  debug: true
});
```

## Migration Guide

### From Existing Auth Systems

1. **Backup current authentication code**
2. **Install UnifiedSSO module**
3. **Update OAuth callback URLs in Appwrite**
4. **Replace auth components with UnifiedAuth**
5. **Test authentication flows**
6. **Deploy and verify**

### Breaking Changes

- OAuth callback URLs must be updated
- Custom CSS classes may need adjustment
- Authentication event handlers use new signature

## Support & Contributing

### Getting Help
- Check the troubleshooting section above
- Review existing project implementations
- Create an issue with reproduction steps

### Contributing
- Follow existing code style
- Add tests for new features
- Update documentation
- Test across mobile and desktop

## License

This module is part of the unified project architecture and follows the same license as the parent projects.