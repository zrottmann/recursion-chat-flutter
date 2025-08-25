# Firebase SSO Setup Guide for Trading Post

## Prerequisites

1. Firebase account (create at https://firebase.google.com)
2. Trading Post app running locally
3. Node.js and Python environments set up

## Firebase Console Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "Trading Post" (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In Firebase Console, select your project
2. Navigate to "Authentication" in the left sidebar
3. Click "Get started"
4. Go to "Sign-in method" tab
5. Enable the following providers:
   - **Email/Password**: Click, enable, and save
   - **Google**: Click, enable, add project public-facing name, select support email, save
   - **Facebook** (optional): 
     - Need Facebook App ID and App Secret from Facebook Developers
     - Add OAuth redirect URI to Facebook app settings
   - **Apple** (optional):
     - Need Apple Developer account
     - Configure Sign In with Apple service

### 3. Get Firebase Configuration

#### Frontend Configuration (Web App)
1. Go to Project Settings (gear icon) → General
2. Scroll to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Register app with nickname "Trading Post Web"
5. Copy the Firebase configuration object:
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

#### Backend Configuration (Service Account)
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in the project root
4. **IMPORTANT**: Add this file to `.gitignore`

## Application Setup

### Backend Setup (Python/FastAPI)

1. Install dependencies:
```bash
cd active-projects/trading-post
venv/Scripts/pip install firebase-admin python-jose[cryptography] python-multipart
```

2. Create `.env` file in backend root:
```bash
cp .env.firebase.example .env
```

3. Update `.env` with your Firebase credentials:
```env
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
JWT_SECRET_KEY=<generate-secure-32-char-key>
```

4. Start the backend with Firebase support:
```bash
venv/Scripts/python -m uvicorn app_with_firebase:app --reload --host 0.0.0.0 --port 3000
```

### Frontend Setup (React)

1. Install dependencies (already done):
```bash
cd trading-app-frontend
npm install
```

2. Create `.env` file in frontend root:
```bash
cp .env.example .env
```

3. Update `.env` with your Firebase web app configuration:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_API_URL=http://localhost:3000
```

4. Start the frontend:
```bash
npm start
```

## Integration in Your App

### Add Firebase Auth Component to Your App

1. Import the FirebaseAuth component in your main App.js or login page:

```javascript
import FirebaseAuth from './components/FirebaseAuth';

function App() {
  const handleAuthSuccess = (data) => {
    console.log('Authentication successful:', data);
    // Handle successful authentication
    // Store tokens, redirect, update UI, etc.
  };

  const handleAuthError = (error) => {
    console.error('Authentication failed:', error);
    // Handle authentication errors
  };

  return (
    <div>
      <FirebaseAuth 
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    </div>
  );
}
```

### Protected Routes Example

```javascript
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return children;
}
```

## Testing the Integration

### 1. Test Email/Password Authentication
1. Click "Sign Up" in the Firebase Auth component
2. Enter email and password
3. Check for verification email
4. Sign in with created credentials

### 2. Test Google SSO
1. Click "Continue with Google"
2. Select Google account
3. Verify successful sign-in

### 3. Test Backend Integration
1. After signing in, check browser console for JWT tokens
2. Check backend logs for authentication attempts
3. Verify user creation in database

### 4. Test Token Refresh
```javascript
// Test API call with Firebase token
fetch('http://localhost:3000/api/firebase/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(res => res.json())
.then(data => console.log('Profile:', data));
```

## Security Considerations

1. **Never commit sensitive files**:
   - `firebase-service-account.json`
   - `.env` files with real credentials

2. **Configure authorized domains**:
   - In Firebase Console → Authentication → Settings
   - Add your production domain to authorized domains

3. **Set up CORS properly**:
   - Configure backend CORS to only allow your frontend domain

4. **Use HTTPS in production**:
   - Firebase requires HTTPS for OAuth redirects
   - Use proper SSL certificates

5. **Rate limiting**:
   - Implement rate limiting on authentication endpoints
   - Firebase has built-in rate limiting for authentication

## Troubleshooting

### Common Issues and Solutions

1. **"Firebase App not initialized"**
   - Ensure Firebase is initialized before using auth
   - Check that environment variables are loaded

2. **"Invalid API key"**
   - Verify API key in Firebase Console matches .env
   - Check for typos or extra spaces

3. **"Redirect URI mismatch"**
   - Add your app URL to OAuth provider settings
   - For Google: automatic with Firebase
   - For Facebook/Apple: manual configuration needed

4. **"CORS error"**
   - Configure backend CORS settings
   - Ensure frontend URL is in allowed origins

5. **"Token verification failed"**
   - Check service account key is valid
   - Ensure backend has correct Firebase credentials

## Production Deployment

1. **Environment Variables**:
   - Set all environment variables in your hosting platform
   - Use secrets management for sensitive values

2. **Domain Configuration**:
   - Update Firebase authorized domains
   - Update OAuth redirect URIs

3. **Security Rules**:
   - Configure Firebase Security Rules if using Firestore/Storage
   - Enable App Check for additional security

4. **Monitoring**:
   - Enable Firebase Analytics
   - Monitor authentication metrics in Firebase Console

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK (Python)](https://firebase.google.com/docs/admin/setup#python)
- [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

## Support

For issues specific to Trading Post integration:
1. Check backend logs: `uvicorn` output
2. Check browser console for frontend errors
3. Review Firebase Console → Authentication → Users for sign-in attempts
4. Enable debug logging in Firebase Auth