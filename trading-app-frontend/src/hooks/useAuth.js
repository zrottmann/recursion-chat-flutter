import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';
import { setUser, setError, clearError } from '../store/slices/userSlice';
import appwriteAuthService from '../services/appwriteAuthService';

// Global flag to prevent multiple initialization attempts across components
let globalInitializationAttempted = false;

export const useAuth = () => {
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated, loading, error } = useSelector(state => state.user);
  const initializationAttempted = useRef(false);
  const initializationInProgress = useRef(false);
  
  // Initialize authentication state from stored session
  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple concurrent initialization attempts
      if (initializationAttempted.current || 
          globalInitializationAttempted || 
          initializationInProgress.current) {
        return;
      }
      
      // Mark initialization as attempted and in progress
      initializationAttempted.current = true;
      globalInitializationAttempted = true;
      initializationInProgress.current = true;
      
      try {
        console.log('🔍 Initializing authentication state...');
        
        // Try to get current user from Appwrite
        const result = await appwriteAuthService.getCurrentUser();
        
        if (result.success && result.user) {
          console.log('✅ Found authenticated user:', result.user.email);
          
          // Get user profile from database
          let profile = null;
          try {
            const profileResult = await appwriteAuthService.getUserProfile();
            if (profileResult.success) {
              profile = profileResult.profile;
              console.log('✅ User profile loaded:', profile.$id);
            }
          } catch (profileError) {
            console.warn('Could not load user profile:', profileError);
          }
          
          dispatch(setUser({
            ...result.user,
            profile,
            isAuthenticated: true
          }));
          dispatch(clearError());
        } else {
          console.log('🔄 No authenticated user found');
          // Clear any stale authentication state
          dispatch(setUser(null));
        }
      } catch (error) {
        // Generate unique error ID for debugging
        const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.error('❌ Auth initialization failed:', {
          errorId,
          message: error.message,
          code: error.code,
          stack: error.stack,
          originalError: error
        });
        
        // Clear any stale data on error
        dispatch(setUser(null));
        
        // Only show error if it's not just "no session"
        if (error.code !== 401 && error.code !== 404) {
          console.error(`❌ Auth error ID: ${errorId} - Full error details logged above`);
          dispatch(setError(`Authentication initialization failed - Error ID: ${errorId}`));
        }
      } finally {
        initializationInProgress.current = false;
      }
    };
    
    // Only initialize if we don't already have a user and not already initialized
    if (!currentUser && !loading && !globalInitializationAttempted) {
      initializeAuth();
    }
  }, [dispatch, currentUser, loading]);
  
  return {
    user: currentUser,
    isAuthenticated: !!currentUser && isAuthenticated,
    loading,
    error,
    isLoggedIn: !!currentUser && isAuthenticated,
    
    // Helper methods
    logout: async () => {
      try {
        await appwriteAuthService.signOut();
        dispatch(setUser(null));
        dispatch(clearError());
        // Reset global initialization flag to allow re-initialization after logout
        globalInitializationAttempted = false;
        initializationAttempted.current = false;
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
    
    clearError: () => {
      dispatch(clearError());
    }
  };
};