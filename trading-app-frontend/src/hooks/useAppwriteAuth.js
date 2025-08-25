/**
 * Appwrite Authentication Hook
 * Provides authentication state and methods for React components
 */

import { useState, useEffect, useCallback } from 'react';
import appwriteAuth from '../services/appwriteAuth';

export const useAppwriteAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to initialize from stored session
        const initialized = await appwriteAuth.initializeFromStorage();
        
        if (initialized && mounted) {
          // Get current user
          const userResult = await appwriteAuth.getCurrentUser();
          
          if (userResult.success && userResult.user && mounted) {
            setUser(userResult.user);
            setIsAuthenticated(true);
            
            // Get user profile
            const profileResult = await appwriteAuth.getUserProfile();
            if (profileResult.success && mounted) {
              setProfile(profileResult.profile);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err.message);
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.login(email, password);

      if (result.success) {
        setUser(result.user);
        setProfile(result.profile);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(result.error?.message || 'Login failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (email, password, name) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.register(email, password, name);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error?.message || 'Registration failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.logout();

      if (result.success) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return { success: true };
      } else {
        setError(result.error?.message || 'Logout failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.updateProfile(data);

      if (result.success) {
        setProfile(result.profile);
        return { success: true, profile: result.profile };
      } else {
        setError(result.error?.message || 'Profile update failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update password function
  const updatePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.updatePassword(oldPassword, newPassword);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error?.message || 'Password update failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Request password reset
  const requestPasswordReset = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.requestPasswordReset(email);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error?.message || 'Password reset request failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete password reset
  const completePasswordReset = useCallback(async (userId, secret, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.completePasswordReset(userId, secret, newPassword);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error?.message || 'Password reset failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Request email verification
  const requestEmailVerification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.requestEmailVerification();

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error?.message || 'Email verification request failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Email verification request error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify email
  const verifyEmail = useCallback(async (userId, secret) => {
    try {
      setLoading(true);
      setError(null);

      const result = await appwriteAuth.verifyEmail(userId, secret);

      if (result.success) {
        // Refresh profile to show verified status
        const profileResult = await appwriteAuth.getUserProfile();
        if (profileResult.success) {
          setProfile(profileResult.profile);
        }
        return { success: true };
      } else {
        setError(result.error?.message || 'Email verification failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user sessions
  const getSessions = useCallback(async () => {
    try {
      const result = await appwriteAuth.getSessions();
      return result;
    } catch (err) {
      console.error('Get sessions error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      const result = await appwriteAuth.deleteSession(sessionId);
      
      if (result.success && (sessionId === 'current' || sessionId === user?.$id)) {
        // If current session was deleted, clear state
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
      
      return result;
    } catch (err) {
      console.error('Delete session error:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      
      const userResult = await appwriteAuth.getCurrentUser();
      
      if (userResult.success && userResult.user) {
        setUser(userResult.user);
        setIsAuthenticated(true);
        
        const profileResult = await appwriteAuth.getUserProfile();
        if (profileResult.success) {
          setProfile(profileResult.profile);
        }
        
        return { success: true };
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return { success: false };
      }
    } catch (err) {
      console.error('Refresh user error:', err);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    requestPasswordReset,
    completePasswordReset,
    requestEmailVerification,
    verifyEmail,
    getSessions,
    deleteSession,
    clearError,
    refreshUser,
    
    // Utilities
    userId: user?.$id || null,
    userEmail: user?.email || null,
    userName: user?.name || profile?.name || null,
    isEmailVerified: user?.emailVerification || profile?.email_verified || false
  };
};