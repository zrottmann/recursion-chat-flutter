# Easy Appwrite SSO - Integration Examples

This document provides implementation examples for Easy Appwrite SSO across all projects.

## Recursion Chat (React/Vite)

### Implementation Location
`active-projects/recursion-chat/client/src/components/AuthFixed.jsx`

### Code Example
```javascript
import EasySSOButton from '../lib/EasySSOButton';

const handleSSOSuccess = async (user) => {
  console.log('[AuthFixed] ✅ Easy SSO authentication successful:', user);
  setMessage({
    type: 'success',
    text: `Welcome, ${user.name || user.email}!`
  });
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

const handleSSOError = (error) => {
  console.error('[AuthFixed] ❌ Easy SSO authentication failed:', error);
  setMessage({
    type: 'error',
    text: error.message || 'Authentication failed. Please try again.'
  });
};

// In JSX
<div className="social-auth">
  <EasySSOButton
    provider="google"
    onSuccess={handleSSOSuccess}
    onError={handleSSOError}
    size="large"
    fullWidth={true}
    className="sso-button-spacing"
  />
</div>
```

### Styling
```css
/* Auth.css */
.sso-button-spacing {
  margin-bottom: 12px;
}
.social-auth .sso-button-spacing:last-child {
  margin-bottom: 0;
}
```

## Trading Post (React/Vite + Redux)

### Implementation Location
`active-projects/trading-post/trading-app-frontend/src/components/AppwriteAuth.jsx`

### Code Example
```javascript
import EasySSOButton from '../lib/EasySSOButton';
import { setUser, setError } from '../store/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const dispatch = useDispatch();
const navigate = useNavigate();

// Multiple OAuth providers
{['google', 'github', 'microsoft'].map((provider) => (
  <EasySSOButton
    key={provider}
    provider={provider}
    onSuccess={(user) => {
      console.log(`${provider} SSO successful:`, user);
      dispatch(setUser(user));
      navigate('/dashboard');
    }}
    onError={(error) => {
      dispatch(setError(error.message || `${provider} authentication failed`));
    }}
    size="large"
    fullWidth={true}
  />
))}
```

### Redux Integration
- Automatically dispatches `setUser` action on successful authentication
- Dispatches `setError` action on authentication failure
- Navigates to dashboard after successful login

## Archon OS (React/Vite + Redux)

### Implementation Location
`active-projects/archon/frontend/src/components/auth/LoginScreen.jsx`

### Code Example
```javascript
import EasySSOButton from '../../lib/EasySSOButton';
import { setUser } from '../../store/systemSlice';
import { useDispatch } from 'react-redux';

const handleSSOSuccess = async (user) => {
  console.log('[Archon] SSO authentication successful:', user);
  dispatch(setUser({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isAuthenticated: true
  }));
};

const handleSSOError = (error) => {
  console.error('[Archon] SSO authentication failed:', error);
  setError(error.message || 'Authentication failed. Please try again.');
};

// In JSX (only shown for login, not register mode)
{!isRegisterMode && (
  <div className="sso-section mt-6 space-y-3">
    <div className="divider flex items-center">
      <div className="flex-1 border-t border-app-border"></div>
      <span className="px-3 text-sm text-archon-text-secondary">Or continue with</span>
      <div className="flex-1 border-t border-app-border"></div>
    </div>
    
    <div className="space-y-2">
      {['google', 'github', 'microsoft', 'linkedin'].map((provider) => (
        <EasySSOButton
          key={provider}
          provider={provider}
          onSuccess={handleSSOSuccess}
          onError={handleSSOError}
          size="large"
          fullWidth={true}
          style="default"
        />
      ))}
    </div>
  </div>
)}
```

### Features
- Futuristic UI with backdrop blur effects
- Multiple OAuth providers (Google, GitHub, Microsoft, LinkedIn)
- Conditional display (only for login, not registration)
- Integration with Archon's design system

## Claude Code Remote (Next.js)

### Implementation Location
`active-projects/Claude-Code-Remote/pages/login.js`

### Code Example
```javascript
import EasySSOButton from '../lib/EasySSOButton';
import { account } from '../lib/appwrite';
import { useRouter } from 'next/router';

const handleSSOSuccess = async (user) => {
  console.log('[Claude Code Remote] SSO authentication successful:', user);
  setUser(user);
  router.push('/dashboard');
};

const handleSSOError = (error) => {
  console.error('[Claude Code Remote] SSO authentication failed:', error);
  alert(`Authentication failed: ${error.message || 'Please try again.'}`);
};

// Developer-focused OAuth providers
<div className="space-y-3">
  {['google', 'github', 'microsoft', 'discord'].map((provider) => (
    <EasySSOButton
      key={provider}
      provider={provider}
      onSuccess={handleSSOSuccess}
      onError={handleSSOError}
      text={`Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
      size="large"
      fullWidth={true}
      style="default"
    />
  ))}
</div>
```

### Dashboard Integration
`active-projects/Claude-Code-Remote/pages/dashboard.js`

```javascript
// Authentication check
const checkAuth = async () => {
  try {
    const currentUser = await account.get();
    setUser(currentUser);
  } catch (error) {
    router.push('/login');
    return;
  }
  setLoading(false);
};

// Sign out functionality  
const handleSignOut = async () => {
  try {
    await account.deleteSession('current');
    router.push('/');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};
```

## Common Patterns

### Environment Variable Configuration
All projects use auto-detection from:

**Vite/React Projects:**
```javascript
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
```

**Next.js Projects:**
```javascript
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1  
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

### Success Handler Pattern
```javascript
const handleSSOSuccess = async (user) => {
  console.log('SSO Success:', user);
  // 1. Update application state
  // 2. Navigate to dashboard/home
  // 3. Show success message (optional)
};
```

### Error Handler Pattern
```javascript
const handleSSOError = (error) => {
  console.error('SSO Error:', error);
  // 1. Log error for debugging
  // 2. Show user-friendly error message
  // 3. Update error state
};
```

### Provider Customization
```javascript
// Standard providers
['google', 'github', 'microsoft', 'discord', 'linkedin']

// Project-specific selection
// Recursion Chat: google
// Trading Post: google, github, microsoft  
// Archon: google, github, microsoft, linkedin
// Claude Code Remote: google, github, microsoft, discord
```

## Testing Checklist

- [ ] OAuth popup opens correctly
- [ ] User data is received on success
- [ ] Error handling works for failures
- [ ] State management updates properly
- [ ] Navigation works after authentication
- [ ] Sign out functionality works
- [ ] Environment variables are detected
- [ ] UI styling matches project theme