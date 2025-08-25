import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import './FirebaseAuth.css';

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

const FirebaseAuth = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get ID token and send to backend
        try {
          const idToken = await firebaseUser.getIdToken();
          await handleBackendAuth(idToken, firebaseUser.providerData[0]?.providerId || 'firebase');
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Send Firebase token to backend for verification and JWT creation
  const handleBackendAuth = async (idToken, provider) => {
    try {
      const response = await fetch('/api/auth/firebase/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: idToken,
          provider: provider
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store JWT tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        
        // Call success callback
        if (onSuccess) {
          onSuccess({
            ...data,
            user: user
          });
        }
        
        setMessage('Successfully signed in!');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Authentication failed');
      }
    } catch (error) {
      console.error('Backend auth error:', error);
      setError(error.message);
      if (onError) {
        onError(error);
      }
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await handleBackendAuth(idToken, 'google');
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Facebook
  const signInWithFacebook = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const idToken = await result.user.getIdToken();
      await handleBackendAuth(idToken, 'facebook');
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const idToken = await result.user.getIdToken();
      await handleBackendAuth(idToken, 'apple');
    } catch (error) {
      console.error('Apple sign-in error:', error);
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (isSignUp) {
        // Create new account
        result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send verification email
        await sendEmailVerification(result.user);
        setMessage('Verification email sent! Please check your inbox.');
        
        // Update display name if provided
        if (displayName) {
          await result.user.updateProfile({ displayName });
        }
      } else {
        // Sign in existing user
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const idToken = await result.user.getIdToken();
      await handleBackendAuth(idToken, 'email');
    } catch (error) {
      console.error('Email sign-in error:', error);
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      
      // Clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      setMessage('Signed out successfully');
      if (onSuccess) {
        onSuccess({ signedOut: true });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="firebase-auth-container">
      {user ? (
        <div className="user-profile">
          <h3>Welcome, {user.displayName || user.email}!</h3>
          {user.photoURL && (
            <img src={user.photoURL} alt="Profile" className="profile-photo" />
          )}
          <p>Email: {user.email}</p>
          <p>Provider: {user.providerData[0]?.providerId || 'Email'}</p>
          {!user.emailVerified && (
            <p className="warning">Email not verified</p>
          )}
          <button onClick={handleSignOut} className="btn-signout">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="auth-forms">
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          
          {/* SSO Buttons */}
          <div className="sso-buttons">
            <button 
              onClick={signInWithGoogle} 
              disabled={loading}
              className="btn-sso btn-google"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Continue with Google
            </button>
            
            <button 
              onClick={signInWithFacebook} 
              disabled={loading}
              className="btn-sso btn-facebook"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" alt="Facebook" />
              Continue with Facebook
            </button>
            
            <button 
              onClick={signInWithApple} 
              disabled={loading}
              className="btn-sso btn-apple"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/apple.png" alt="Apple" />
              Continue with Apple
            </button>
          </div>
          
          <div className="divider">
            <span>OR</span>
          </div>
          
          {/* Email/Password Form */}
          <form onSubmit={signInWithEmail} className="email-form">
            {isSignUp && (
              <input
                type="text"
                placeholder="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
              />
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
            />
            
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          
          <div className="auth-options">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="btn-link"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don&apos;t have an account? Sign Up"}
            </button>
            
            {!isSignUp && (
              <button 
                onClick={resetPassword}
                className="btn-link"
              >
                Forgot Password?
              </button>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
        </div>
      )}
    </div>
  );
};

export default FirebaseAuth;