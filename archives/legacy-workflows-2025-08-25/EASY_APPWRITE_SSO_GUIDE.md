# Easy Appwrite SSO - Complete Guide

## Quick Start (2 Minutes)

### 1. Install Dependencies
```bash
npm install appwrite
```

### 2. Set Environment Variables
```env
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

### 3. Add SSO to Your App
```jsx
import EasyAppwriteSSO from './easy-appwrite-sso';
import EasySSOButton from './EasySSOButton';

function LoginPage() {
  const handleSuccess = (user) => {
    console.log('Logged in:', user);
    // Redirect to dashboard
  };

  const handleError = (error) => {
    console.error('Login failed:', error);
  };

  return (
    <div>
      <h1>Sign In</h1>
      <EasySSOButton 
        provider="google"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
```

That's it! Your SSO is ready.

## Features

### ✅ Zero Configuration
- Auto-detects Appwrite settings from environment
- Works out of the box with sensible defaults
- No complex setup required

### ✅ Silent Authentication
- Uses popup windows to avoid page redirects
- Users stay on the same page during auth
- Smooth, modern user experience

### ✅ Mobile Friendly
- Automatically switches to redirect flow on mobile
- Handles mobile browser limitations gracefully
- Works on all devices

### ✅ Beautiful UI Components
- Pre-styled buttons for all providers
- Customizable styles and sizes
- Loading states and error handling

### ✅ Auto-Configuration
- Detects which providers are enabled
- Only shows available login options
- No manual provider management

## Complete Examples

### Basic Implementation
```jsx
import React, { useState, useEffect } from 'react';
import EasyAppwriteSSO from './easy-appwrite-sso';
import EasySSOButton, { EasySSOGroup } from './EasySSOButton';

function App() {
  const [user, setUser] = useState(null);
  const [sso, setSSO] = useState(null);

  useEffect(() => {
    // Initialize SSO
    const ssoInstance = new EasyAppwriteSSO();
    setSSO(ssoInstance);

    // Check if user is already logged in
    ssoInstance.getUser().then(setUser);

    // Listen for auth changes
    const unsubscribe = ssoInstance.onAuthChange(setUser);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await sso.signOut();
    setUser(null);
  };

  if (user) {
    return (
      <div>
        <h1>Welcome, {user.name}!</h1>
        <p>Email: {user.email}</p>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Sign In</h1>
      
      {/* Single provider button */}
      <EasySSOButton 
        provider="google"
        onSuccess={setUser}
        size="large"
        fullWidth
      />

      {/* Or multiple providers */}
      <EasySSOGroup
        providers={['google', 'github', 'microsoft']}
        onSuccess={setUser}
        orientation="vertical"
      />
    </div>
  );
}
```

### Advanced Configuration
```jsx
import EasyAppwriteSSO from './easy-appwrite-sso';

// Custom configuration
const sso = new EasyAppwriteSSO({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  silent: true,              // Use popup mode
  autoClose: true,           // Close popup after success
  timeout: 120000,           // 2 minute timeout
  redirectUrl: '/auth/callback',
  errorUrl: '/auth/error'
});

// Sign in with specific scopes
await sso.signIn('github', {
  scopes: ['user:email', 'repo']
});
```

### Auto-Detect Available Providers
```jsx
import AppwriteSSOConfig, { useAppwriteSSOConfig } from './appwrite-sso-config';

function SmartLoginPage() {
  const { config, loading, error } = useAppwriteSSOConfig();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Sign In</h1>
      <EasySSOGroup
        providers={config.providers} // Only shows enabled providers
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

### Custom Styled Buttons
```jsx
<EasySSOButton 
  provider="google"
  style="filled"        // filled, outline, minimal, default
  size="large"          // small, medium, large
  text="Login with Google"
  className="my-custom-class"
  fullWidth
/>
```

### Handle OAuth Callbacks
```jsx
// In your /auth/callback page
import EasyAppwriteSSO from './easy-appwrite-sso';

function AuthCallback() {
  useEffect(() => {
    const sso = new EasyAppwriteSSO();
    sso.handleCallback(); // Automatically handles the OAuth response
  }, []);

  return <div>Completing sign in...</div>;
}
```

## Setup in Appwrite Console

### 1. Enable OAuth Providers
1. Go to Appwrite Console → Auth → Settings
2. Enable desired OAuth providers (Google, GitHub, etc.)
3. Add OAuth credentials from each provider

### 2. Add Platform
1. Go to Project Settings → Platforms
2. Add a Web Platform
3. Enter your domain (e.g., `localhost:3000` for development)

### 3. OAuth Provider Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://[YOUR-APPWRITE-ENDPOINT]/account/sessions/oauth2/callback/google`
4. Copy Client ID and Secret to Appwrite

#### GitHub OAuth
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create New OAuth App
3. Set callback URL: `https://[YOUR-APPWRITE-ENDPOINT]/account/sessions/oauth2/callback/github`
4. Copy Client ID and Secret to Appwrite

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com)
2. Register an application
3. Add redirect URI: `https://[YOUR-APPWRITE-ENDPOINT]/account/sessions/oauth2/callback/microsoft`
4. Copy Application ID and Secret to Appwrite

## API Reference

### EasyAppwriteSSO Class

```javascript
const sso = new EasyAppwriteSSO(config);
```

#### Methods
- `signIn(provider, options)` - Sign in with OAuth provider
- `signOut()` - Sign out current user
- `getUser()` - Get current authenticated user
- `isAuthenticated()` - Check if user is logged in
- `handleCallback()` - Handle OAuth redirect callback
- `onAuthChange(callback)` - Listen for auth state changes

### EasySSOButton Component

```jsx
<EasySSOButton
  provider="google"        // OAuth provider name
  onSuccess={callback}     // Success callback with user object
  onError={callback}       // Error callback
  text="Custom Text"       // Button text
  style="filled"          // Button style
  size="medium"           // Button size
  fullWidth={false}       // Full width button
  disabled={false}        // Disable button
  className=""            // Custom CSS class
  appwriteConfig={{}}     // Custom Appwrite config
/>
```

### EasySSOGroup Component

```jsx
<EasySSOGroup
  providers={['google', 'github']}  // Array of providers
  onSuccess={callback}               // Success callback
  onError={callback}                 // Error callback
  orientation="vertical"             // Layout orientation
  gap="12px"                        // Space between buttons
  // Plus all EasySSOButton props
/>
```

## Troubleshooting

### Common Issues

#### "Popup blocked" Error
- Users need to allow popups for your domain
- Falls back to redirect mode automatically

#### "Platform not registered" Error
- Add your domain to Appwrite Console → Platforms
- Include both `http://localhost:3000` and production domain

#### OAuth Not Working
- Verify OAuth credentials in Appwrite Console
- Check redirect URIs match exactly
- Ensure providers are enabled

#### Mobile Authentication Issues
- The library automatically uses redirect flow on mobile
- Ensure your redirect URLs are properly configured

## Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data
2. **Error Handling**: Implement proper error handling and user feedback
3. **Loading States**: Show loading indicators during authentication
4. **Session Management**: Check for existing sessions on app load
5. **Mobile Testing**: Test on actual mobile devices, not just browser DevTools

## Migration from Complex Setup

If you're migrating from a complex SSO setup:

1. Replace your auth service with `EasyAppwriteSSO`
2. Replace custom OAuth buttons with `EasySSOButton`
3. Remove unnecessary configuration code
4. Delete redundant auth utilities

Before (200+ lines):
```jsx
// Complex setup with multiple files
import AuthService from './services/auth';
import OAuthHandler from './utils/oauth';
import SessionManager from './utils/session';
// ... lots of configuration
```

After (10 lines):
```jsx
import EasyAppwriteSSO from './easy-appwrite-sso';
import EasySSOButton from './EasySSOButton';

// That's it!
```

## Support

- [Appwrite Documentation](https://appwrite.io/docs)
- [OAuth Provider Setup Guides](https://appwrite.io/docs/authentication)
- [Community Discord](https://appwrite.io/discord)

## License

MIT - Use freely in your projects!