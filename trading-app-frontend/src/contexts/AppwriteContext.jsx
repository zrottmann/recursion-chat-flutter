/**
 * Appwrite Context Provider
 * Provides global Appwrite state and services to the entire app
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useAppwriteAuth } from '../hooks/useAppwriteAuth';
import { useAppwriteRealtime } from '../hooks/useAppwriteRealtime';
import appwriteDatabase from '../services/appwriteDatabase';
import appwriteStorage from '../services/appwriteStorage';
import { toast } from 'react-toastify';

// Create contexts
const AppwriteContext = createContext();
const AppwriteDispatchContext = createContext();

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LISTINGS: 'SET_LISTINGS',
  ADD_LISTING: 'ADD_LISTING',
  UPDATE_LISTING: 'UPDATE_LISTING',
  REMOVE_LISTING: 'REMOVE_LISTING',
  SET_TRADES: 'SET_TRADES',
  ADD_TRADE: 'ADD_TRADE',
  UPDATE_TRADE: 'UPDATE_TRADE',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  INCREMENT_UNREAD: 'INCREMENT_UNREAD',
  RESET_UNREAD: 'RESET_UNREAD',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION'
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  listings: [],
  trades: [],
  messages: [],
  conversations: [],
  unreadCount: 0,
  onlineUsers: new Set(),
  notifications: []
};

// Reducer function
const appwriteReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ACTIONS.SET_LISTINGS:
      return { ...state, listings: action.payload };
    
    case ACTIONS.ADD_LISTING:
      return { ...state, listings: [action.payload, ...state.listings] };
    
    case ACTIONS.UPDATE_LISTING:
      return {
        ...state,
        listings: state.listings.map(listing =>
          listing.$id === action.payload.$id ? action.payload : listing
        )
      };
    
    case ACTIONS.REMOVE_LISTING:
      return {
        ...state,
        listings: state.listings.filter(listing => listing.$id !== action.payload)
      };
    
    case ACTIONS.SET_TRADES:
      return { ...state, trades: action.payload };
    
    case ACTIONS.ADD_TRADE:
      return { ...state, trades: [action.payload, ...state.trades] };
    
    case ACTIONS.UPDATE_TRADE:
      return {
        ...state,
        trades: state.trades.map(trade =>
          trade.$id === action.payload.$id ? action.payload : trade
        )
      };
    
    case ACTIONS.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case ACTIONS.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    
    case ACTIONS.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload };
    
    case ACTIONS.INCREMENT_UNREAD:
      return { ...state, unreadCount: state.unreadCount + 1 };
    
    case ACTIONS.RESET_UNREAD:
      return { ...state, unreadCount: 0 };
    
    case ACTIONS.SET_ONLINE_USERS:
      return { ...state, onlineUsers: new Set(action.payload) };
    
    case ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications] };
    
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// Provider component
export const AppwriteProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appwriteReducer, initialState);
  const auth = useAppwriteAuth();
  const realtime = useAppwriteRealtime(auth.userId);

  // Setup real-time subscriptions when user is authenticated
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.userId) return;

    console.log('🔔 Setting up Appwrite real-time subscriptions');

    // Setup comprehensive real-time
    const subscriptions = realtime.setupRealtime({
      onMessage: (eventData) => {
        const { message } = eventData;
        dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message });
        dispatch({ type: ACTIONS.INCREMENT_UNREAD });
        
        // Show toast notification
        toast.info(`New message from ${message.sender_name || 'User'}`, {
          autoClose: 3000,
          position: "top-right"
        });
      },
      
      onTrade: (eventData) => {
        const { type, trade } = eventData;
        
        if (type === 'new_trade') {
          dispatch({ type: ACTIONS.ADD_TRADE, payload: trade });
          toast.success('New trade match found!', {
            autoClose: 5000,
            position: "top-right"
          });
        } else if (type === 'trade_updated') {
          dispatch({ type: ACTIONS.UPDATE_TRADE, payload: trade });
          toast.info(`Trade status updated: ${trade.status}`, {
            autoClose: 3000,
            position: "top-right"
          });
        }
      },
      
      onMarketplace: (eventData) => {
        const { type, listing } = eventData;
        
        if (type === 'new_listing') {
          dispatch({ type: ACTIONS.ADD_LISTING, payload: listing });
        } else if (type === 'listing_updated') {
          dispatch({ type: ACTIONS.UPDATE_LISTING, payload: listing });
        } else if (type === 'listing_deleted') {
          dispatch({ type: ACTIONS.REMOVE_LISTING, payload: listing.$id });
        }
      },
      
      onProfile: (eventData) => {
        // Handle profile updates if needed
        console.log('Profile updated:', eventData);
      }
    });

    return () => {
      console.log('🔔 Cleaning up Appwrite real-time subscriptions');
      realtime.cleanupUserRealtime?.(auth.userId);
    };
  }, [auth.isAuthenticated, auth.userId, realtime]);

  // Action creators
  const actions = {
    // Listing actions
    loadListings: useCallback(async (filters = {}) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: ACTIONS.CLEAR_ERROR });
        
        const result = await appwriteDatabase.searchListings(filters);
        
        if (result.success) {
          dispatch({ type: ACTIONS.SET_LISTINGS, payload: result.listings });
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, []),

    createListing: useCallback(async (listingData) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: ACTIONS.CLEAR_ERROR });
        
        const data = {
          ...listingData,
          user_id: auth.userId
        };
        
        const result = await appwriteDatabase.createListing(data);
        
        if (result.success) {
          dispatch({ type: ACTIONS.ADD_LISTING, payload: result.listing });
          toast.success('Listing created successfully!');
          return { success: true, listing: result.listing };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
          toast.error(result.error?.message || 'Failed to create listing');
          return { success: false, error: result.error };
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, [auth.userId]),

    updateListing: useCallback(async (listingId, updateData) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const result = await appwriteDatabase.updateListing(listingId, updateData);
        
        if (result.success) {
          dispatch({ type: ACTIONS.UPDATE_LISTING, payload: result.listing });
          toast.success('Listing updated successfully!');
          return { success: true, listing: result.listing };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
          toast.error(result.error?.message || 'Failed to update listing');
          return { success: false, error: result.error };
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, []),

    deleteListing: useCallback(async (listingId) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const result = await appwriteDatabase.deleteListing(listingId);
        
        if (result.success) {
          dispatch({ type: ACTIONS.REMOVE_LISTING, payload: listingId });
          toast.success('Listing deleted successfully!');
          return { success: true };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
          toast.error(result.error?.message || 'Failed to delete listing');
          return { success: false, error: result.error };
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, []),

    // Trade actions
    loadTrades: useCallback(async (status = null) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: ACTIONS.CLEAR_ERROR });
        
        const result = await appwriteDatabase.getUserTrades(auth.userId, status);
        
        if (result.success) {
          dispatch({ type: ACTIONS.SET_TRADES, payload: result.trades });
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, [auth.userId]),

    createTrade: useCallback(async (tradeData) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const data = {
          ...tradeData,
          user1_id: auth.userId
        };
        
        const result = await appwriteDatabase.createTrade(data);
        
        if (result.success) {
          dispatch({ type: ACTIONS.ADD_TRADE, payload: result.trade });
          toast.success('Trade created successfully!');
          return { success: true, trade: result.trade };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
          toast.error(result.error?.message || 'Failed to create trade');
          return { success: false, error: result.error };
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, [auth.userId]),

    updateTrade: useCallback(async (tradeId, updateData) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const result = await appwriteDatabase.updateTrade(tradeId, updateData);
        
        if (result.success) {
          dispatch({ type: ACTIONS.UPDATE_TRADE, payload: result.trade });
          toast.success('Trade updated successfully!');
          return { success: true, trade: result.trade };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
          toast.error(result.error?.message || 'Failed to update trade');
          return { success: false, error: result.error };
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, []),

    // Message actions
    loadConversation: useCallback(async (otherUserId, tradeId = null) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const result = await appwriteDatabase.getConversation(auth.userId, otherUserId, tradeId);
        
        if (result.success) {
          dispatch({ type: ACTIONS.SET_MESSAGES, payload: result.messages });
          // Mark messages as read
          await appwriteDatabase.markMessagesAsRead(auth.userId, otherUserId);
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: result.error?.message });
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, [auth.userId]),

    sendMessage: useCallback(async (messageData) => {
      try {
        const data = {
          ...messageData,
          sender_id: auth.userId
        };
        
        const result = await appwriteDatabase.createMessage(data);
        
        if (result.success) {
          dispatch({ type: ACTIONS.ADD_MESSAGE, payload: result.message });
          return { success: true, message: result.message };
        } else {
          toast.error(result.error?.message || 'Failed to send message');
          return { success: false, error: result.error };
        }
      } catch (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }
    }, [auth.userId]),

    // File upload actions
    uploadItemImage: useCallback(async (file, listingId = null) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const result = await appwriteStorage.uploadItemImage(file, auth.userId, listingId);
        
        if (result.success) {
          toast.success('Image uploaded successfully!');
          return result;
        } else {
          toast.error(result.error?.message || 'Failed to upload image');
          return result;
        }
      } catch (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, [auth.userId]),

    uploadProfileImage: useCallback(async (file) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        const result = await appwriteStorage.uploadProfileImage(file, auth.userId);
        
        if (result.success) {
          toast.success('Profile image uploaded successfully!');
          
          // Update user profile with new image URL
          await auth.updateProfile({
            profile_image_url: result.url
          });
          
          return result;
        } else {
          toast.error(result.error?.message || 'Failed to upload profile image');
          return result;
        }
      } catch (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }, [auth.userId, auth.updateProfile]),

    // Utility actions
    clearError: useCallback(() => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    }, []),

    addNotification: useCallback((notification) => {
      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
    }, []),

    removeNotification: useCallback((notificationId) => {
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
    }, [])
  };

  // Combined state and actions
  const value = {
    // State
    ...state,
    auth,
    realtime,
    
    // Actions
    ...actions
  };

  return (
    <AppwriteContext.Provider value={value}>
      <AppwriteDispatchContext.Provider value={dispatch}>
        {children}
      </AppwriteDispatchContext.Provider>
    </AppwriteContext.Provider>
  );
};

// Custom hooks for using the context
export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) {
    throw new Error('useAppwrite must be used within an AppwriteProvider');
  }
  return context;
};

export const useAppwriteDispatch = () => {
  const context = useContext(AppwriteDispatchContext);
  if (!context) {
    throw new Error('useAppwriteDispatch must be used within an AppwriteProvider');
  }
  return context;
};

// Higher-order component for providing Appwrite context
export const withAppwrite = (Component) => {
  return function WrappedComponent(props) {
    return (
      <AppwriteProvider>
        <Component {...props} />
      </AppwriteProvider>
    );
  };
};