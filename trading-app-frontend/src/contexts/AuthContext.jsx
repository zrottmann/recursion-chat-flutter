/**
 * Enhanced Authentication Context Provider
 * Manages authentication state with robust error handling patterns
 * Inspired by Appwrite Auth Kit best practices
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import appwriteAuth from '../services/appwriteAuth';
import appwriteService from '../services/appwriteService';
import config from '../config/appwriteConfig';
import { handleAppwriteError } from '../lib/appwrite';

// Authentication states for better state management
export const AUTH_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATING: 'authenticating',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
  UNAUTHENTICATED: 'unauthenticated'
};

// Error types for better error handling
export const AUTH_ERROR_TYPES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_EXISTS: 'email_exists',
  NETWORK_ERROR: 'network_error',
  SESSION_EXPIRED: 'session_expired',
  UNKNOWN_ERROR: 'unknown_error'
};

// Create Auth Context with enhanced structure
const AuthContext = createContext({
  // State
  user: null,
  authState: AUTH_STATES.IDLE,
  loading: true,
  error: null,
  isAuthenticated: false,
  
  // Actions
  login: async () => {},
  register: async () => {},
  loginWithSSO: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshSession: async () => {},
  
  // Utilities
  clearError: () => {},
  retry: () => {},
  reset: () => {},
});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced Auth Provider Component with robust error handling
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(AUTH_STATES.IDLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAction, setRetryAction] = useState(null);
  
  // Computed state
  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Enhanced error handling utility
  const handleError = useCallback((error, action = null) => {
    const errorMessage = handleAppwriteError(error);
    let errorType = AUTH_ERROR_TYPES.UNKNOWN_ERROR;
    
    // Classify error types for better handling
    if (typeof errorMessage === 'string') {
      const lowerError = errorMessage.toLowerCase();
      if (lowerError.includes('invalid') || lowerError.includes('credentials')) {
        errorType = AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
      } else if (lowerError.includes('not found') || lowerError.includes('no account')) {
        errorType = AUTH_ERROR_TYPES.USER_NOT_FOUND;
      } else if (lowerError.includes('exists') || lowerError.includes('already')) {
        errorType = AUTH_ERROR_TYPES.EMAIL_EXISTS;
      } else if (lowerError.includes('network') || lowerError.includes('connection')) {
        errorType = AUTH_ERROR_TYPES.NETWORK_ERROR;
      } else if (lowerError.includes('session') || lowerError.includes('401')) {
        errorType = AUTH_ERROR_TYPES.SESSION_EXPIRED;
      }
    }
    
    setError({
      message: errorMessage,
      type: errorType,
      timestamp: new Date().toISOString(),
      action: action
    });
    
    setAuthState(AUTH_STATES.ERROR);
    setRetryAction(action);
    
    console.error('Auth Error:', { errorMessage, errorType, action });
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    setRetryAction(null);
    if (authState === AUTH_STATES.ERROR) {
      setAuthState(isAuthenticated ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.UNAUTHENTICATED);
    }
  }, [authState, isAuthenticated]);

  // Retry last failed action
  const retry = useCallback(async () => {
    if (retryAction) {
      clearError();
      await retryAction();
    }
  }, [retryAction, clearError]);

  // Reset auth state completely
  const reset = useCallback(() => {
    setUser(null);
    setAuthState(AUTH_STATES.IDLE);
    setError(null);
    setRetryAction(null);
    setLoading(false);
  }, []);

  // Initialize authentication with enhanced error handling
  const initializeAuth = async () => {
    try {
      setLoading(true);
      setAuthState(AUTH_STATES.LOADING);
      
      // Check for existing session
      const result = await appwriteAuth.getCurrentUser();
      
      if (result.success && result.user) {
        // Get user profile
        const profileResult = await appwriteAuth.getUserProfile();
        setUser({
          ...result.user,
          profile: profileResult.success ? profileResult.profile : null
        });
        setAuthState(AUTH_STATES.AUTHENTICATED);
      } else {
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      }
      
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced login method
  const login = useCallback(async (email, password) => {
    const action = () => login(email, password);
    
    try {
      setAuthState(AUTH_STATES.AUTHENTICATING);
      clearError();
      
      const result = await appwriteAuth.login(email, password);
      
      if (result.success) {
        setUser({
          ...result.user,
          profile: result.profile
        });
        setAuthState(AUTH_STATES.AUTHENTICATED);
        return { success: true, user: result.user };
      } else {
        handleError(new Error(result.error), action);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      handleError(error, action);
      return { success: false, error: error.message };
    }
  }, [clearError, handleError]);

  // Enhanced registration method
  const register = useCallback(async (email, password, name, additionalData = {}) => {
    const action = () => register(email, password, name, additionalData);
    
    try {
      setAuthState(AUTH_STATES.AUTHENTICATING);
      clearError();
      
      const result = await appwriteAuth.register(email, password, name, additionalData);
      
      if (result.success) {
        // Auto-login after registration
        const loginResult = await appwriteAuth.login(email, password);
        
        if (loginResult.success) {
          setUser({
            ...loginResult.user,
            profile: loginResult.profile
          });
          setAuthState(AUTH_STATES.AUTHENTICATED);
          return { success: true, user: loginResult.user };
        } else {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          return { success: true, message: 'Registration successful! Please log in.' };
        }
      } else {
        handleError(new Error(result.error), action);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      handleError(error, action);
      return { success: false, error: error.message };
    }
  }, [clearError, handleError]);

  // Enhanced logout method
  const logout = useCallback(async () => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      
      await appwriteAuth.logout();
      
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      clearError();
      
      return { success: true };
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      return { success: false, error: error.message };
    }
  }, [clearError]);

  // Context value with all enhanced methods
  const contextValue = {
    // State
    user,
    authState,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    
    // Utilities
    clearError,
    retry,
    reset,
    refreshSession: initializeAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;