// Auto-deploy test 2025-08-14T20:00:00Z - Fixed OAuth user profile creation and SearchControls error handling
import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store/store';
import { useAuth } from './hooks/useAuth';

// Import extension conflict fixes
import { initExtensionConflictFixes } from './utils/extensionConflictFixer';
import { initConsole } from './utils/consoleFixer';
import './utils/mutationObserverSafe';

// Import database schema fix and debug console
import { initDebugConsole, autoFixIssues, DEBUG } from './utils/fixDatabaseSchema';
// Import listings checker for debugging
import './utils/checkListings';
// Import AI matching tester
import './utils/testAIMatching';
// Import platform activator to fix OAuth errors
import { activatePlatform } from './utils/platformActivator';
// Import API adapter to fix 405 errors
import { initApiAdapter } from './utils/apiAdapter';
// Import system initializer for comprehensive startup
import systemInitializer from './utils/systemInitializer';

// Core components loaded immediately
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Import loading component
import LoadingSpinner from './components/LoadingSpinner';

// Import OAuth Redirect Guard
import OAuthRedirectGuard from './components/OAuthRedirectGuard';

// Lazy load components for code splitting
const LoginSimple = React.lazy(() => import('./components/LoginSimple'));
const LoginDirect = React.lazy(() => import('./components/LoginDirect'));
const AppwriteAuth = React.lazy(() => import('./components/AppwriteAuth'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));
const MyListings = React.lazy(() => import('./components/MyListings'));
const PublicUserProfile = React.lazy(() => import('./pages/UserProfile'));
const ReviewDetail = React.lazy(() => import('./pages/ReviewDetail'));
const ListingForm = React.lazy(() => import('./components/ListingForm'));
const MatchesDashboard = React.lazy(() => import('./components/MatchesDashboard'));
const SearchControls = React.lazy(() => import('./components/SearchControls'));
const Marketplace = React.lazy(() => import('./components/Marketplace'));
const EnhancedMarketplace = React.lazy(() => import('./components/EnhancedMarketplace'));
const Messages = React.lazy(() => import('./components/EnhancedMessages'));
const ListingDetail = React.lazy(() => import('./components/ListingDetail'));
const DesignCustomizer = React.lazy(() => import('./components/DesignCustomizer'));
// TradingViewDashboard removed - not needed for Trading Post
const OAuthCallbackHandler = React.lazy(() => import('./components/OAuthCallbackHandler'));
const OAuthHashRedirect = React.lazy(() => import('./components/OAuthHashRedirect'));
const ForgotPassword = React.lazy(() => import('./components/ForgotPassword'));

// Test data manager for development
import TestDataManager from './components/TestDataManager';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
// Leaflet icon fixes are now handled by MapWrapper component

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  
  // ENHANCED DEBUGGING: Log authentication state changes
  useEffect(() => {
    console.log('🛡️ [PROTECTED-ROUTE] Auth state changed:', {
      isAuthenticated,
      loading,
      hasUser: !!user,
      userEmail: user?.email || 'none',
      userProfile: !!user?.profile,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, loading, user]);
  
  useEffect(() => {
    // Set a timeout to prevent infinite loading states
    const timer = setTimeout(() => {
      if (!isAuthenticated && !user && loading) {
        console.log('⏰ [PROTECTED-ROUTE] Auth timeout reached - stopping loading state');
        setAuthTimeout(true);
      }
    }, 8000); // 8 second timeout for network delays
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, loading]);
  
  // ENHANCED DEBUGGING: Log what action is being taken
  if (loading && !authTimeout && !user) {
    console.log('🔄 [PROTECTED-ROUTE] SHOWING: Loading spinner (auth in progress)');
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{height: '50vh'}}>
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Checking authentication...</p>
        <small className="text-muted">If this takes too long, please refresh the page</small>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated && !loading) {
    console.log('🚫 [PROTECTED-ROUTE] REDIRECTING: Not authenticated - sending to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ [PROTECTED-ROUTE] RENDERING: Protected content (user authenticated)');
  return children;
};

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Log current auth state for debugging
  useEffect(() => {
    console.log('🔍 App auth state:', {
      isAuthenticated,
      loading,
      hasUser: !!user,
      userEmail: user?.email || 'none'
    });
  }, [isAuthenticated, loading, user]);

  // Handle redirects from 404.html
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && window.location.pathname === '/') {
      console.log('🔄 Found redirect path in sessionStorage:', redirectPath);
      sessionStorage.removeItem('redirectPath');
      window.history.replaceState(null, '', redirectPath);
    }
  }, []);

  return (
    <Router>
      <OAuthRedirectGuard>
        <Layout>
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            <Routes>
            <Route path="/login" element={
              isAuthenticated && !loading ? (
                <Navigate to="/" replace />
              ) : (
                <AppwriteAuth mode="login" />
              )
            } />
            <Route path="/signup" element={
              isAuthenticated && !loading ? (
                <Navigate to="/" replace />
              ) : (
                <AppwriteAuth mode="signup" />
              )
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* OAuth callback routes - handle all variations including hash routes */}
            <Route path="/auth/callback" element={<OAuthCallbackHandler />} />
            <Route path="/auth/callback/*" element={<OAuthCallbackHandler />} />
            <Route path="/auth/error" element={<OAuthCallbackHandler />} />
            <Route path="/oauth/callback" element={<OAuthCallbackHandler />} />
            <Route path="/oauth/callback/*" element={<OAuthCallbackHandler />} />
            {/* Special route for auth with hash - redirects to proper callback handler */}
            <Route path="/auth" element={<OAuthHashRedirect />} />
            <Route path="/login-simple" element={<LoginSimple />} />
            <Route path="/login-direct" element={<LoginDirect />} />
            <Route path="/" element={
              <ProtectedRoute>
                {(() => {
                  console.log('🏠 [ROOT-ROUTE] About to render EnhancedMarketplace component');
                  return <EnhancedMarketplace />;
                })()}
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute>
                <SearchControls />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/my-listings" element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            } />
            <Route path="/listings/new" element={
              <ProtectedRoute>
                <ListingForm />
              </ProtectedRoute>
            } />
            <Route path="/listings/:id" element={
              <ProtectedRoute>
                <ListingDetail />
              </ProtectedRoute>
            } />
            {/* Redirect singular form to plural form for consistency */}
            <Route path="/listing/:id" element={
              <ProtectedRoute>
                <ListingDetail />
              </ProtectedRoute>
            } />
            <Route path="/listings/edit/:id" element={
              <ProtectedRoute>
                <ListingForm />
              </ProtectedRoute>
            } />
            <Route path="/matches" element={
              <ProtectedRoute>
                <MatchesDashboard />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/messages/:userId" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <EnhancedMarketplace saved={true} />
              </ProtectedRoute>
            } />
            <Route path="/users/:userId" element={
              <ProtectedRoute>
                <PublicUserProfile />
              </ProtectedRoute>
            } />
            <Route path="/reviews/:reviewId" element={
              <ProtectedRoute>
                <ReviewDetail />
              </ProtectedRoute>
            } />
            <Route path="/design" element={
              <ProtectedRoute>
                <DesignCustomizer />
              </ProtectedRoute>
            } />
            {/* Catch-all route for unmatched routes - redirect to marketplace */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
      </OAuthRedirectGuard>
      <ToastContainer position="top-right" autoClose={3000} />
      <TestDataManager />
    </Router>
  );
};

function App() {
  // Initialize extension conflict fixes and load saved theme
  useEffect(() => {
    let styleEl = null;
    
    try {
      // Initialize all extension conflict protection FIRST
      console.log('🛡️ Initializing Trading Post extension protection...');
      initExtensionConflictFixes();
      initConsole();
      console.log('✅ Trading Post extension protection initialized');
      
      // Initialize debug console and database fixes
      console.log('🔧 Initializing Trading Post debug console and database fixes...');
      initDebugConsole();
      DEBUG.enable(); // Enable debug mode by default
      
      // Initialize API adapter to fix 405 errors
      console.log('🔌 Initializing API adapter to handle legacy API calls...');
      initApiAdapter();
      console.log('✅ API adapter initialized - old API calls will be redirected to Appwrite');
      
      // CRITICAL: Activate platform for OAuth to work
      console.log('🔐 Activating platform for OAuth authentication...');
      activatePlatform().then(result => {
        if (result.success) {
          console.log('✅ Platform activated successfully:', result);
        } else {
          console.error('⚠️ Platform activation issue:', result);
        }
      }).catch(error => {
        console.error('❌ Platform activation error:', error);
      });
      
      // Run auto-fixes after a short delay
      setTimeout(() => {
        autoFixIssues().then(fixes => {
          console.log('✅ Trading Post database fixes applied:', fixes);
        }).catch(error => {
          console.error('❌ Database fix failed:', error);
        });
      }, 2000);
      
      console.log('✅ Trading Post debug system initialized - Press ` to open debug console');
      
      // COMPREHENSIVE SYSTEM INITIALIZATION: Fix all critical issues
      console.log('🚀 Starting comprehensive system initialization...');
      systemInitializer.initializeSystem({ quickDbFix: true })
        .then(result => {
          if (result.success) {
            console.log('🎉 System initialization completed successfully:', result);
          } else {
            console.error('⚠️ System initialization completed with issues:', result);
          }
        })
        .catch(error => {
          console.error('❌ System initialization failed:', error);
        });
      
      // PLATFORM ACTIVATION: Establish connection to activate Appwrite platform
      try {
        import('./lib/appwrite').then(({ account }) => {
          console.log('🔌 Attempting to activate Appwrite platform...');
          account.getSession('current')
            .then(() => {
              console.log('✅ Platform activated with active session!');
            })
            .catch((error) => {
              if (error.code === 401) {
                console.log('✅ Platform connection established! (No active session)');
              } else {
                console.log('⚠️ Platform activation error:', error.message);
              }
            });
        }).catch((error) => {
          console.log('⚠️ Could not load Appwrite config for platform activation:', error.message);
        });
      } catch (error) {
        console.log('⚠️ Platform activation failed:', error.message);
      }
      
      // Load saved color theme with full Bootstrap integration
      const savedColors = localStorage.getItem('customColors');
      if (savedColors) {
        try {
          const colors = JSON.parse(savedColors);
          const root = document.documentElement;
          
          // Apply CSS variables only if colors is a valid object
          if (colors && typeof colors === 'object' && !Array.isArray(colors)) {
            Object.entries(colors).forEach(([key, value]) => {
              root.style.setProperty(`--bs-${key}`, value);
              root.style.setProperty(`--${key}`, value);
            });
          }
          
          // Utility function to darken colors
          const darkenColor = (color, percent) => {
            try {
              const num = parseInt(color.replace('#', ''), 16);
              const amt = Math.round(2.55 * percent);
              const R = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) - amt));
              const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
              const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
              return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
            } catch {
              return color; // Return original color if parsing fails
            }
          };
          
          // Create or update dynamic styles
          styleEl = document.getElementById('custom-theme-styles');
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'custom-theme-styles';
            document.head.appendChild(styleEl);
          }
          
          styleEl.innerHTML = `
            .btn-primary {
              background-color: ${colors.primary} !important;
              border-color: ${colors.primary} !important;
            }
            .btn-primary:hover {
              background-color: ${darkenColor(colors.primary, 10)} !important;
              border-color: ${darkenColor(colors.primary, 10)} !important;
            }
            .btn-secondary {
              background-color: ${colors.secondary} !important;
              border-color: ${colors.secondary} !important;
            }
            .btn-success {
              background-color: ${colors.success} !important;
              border-color: ${colors.success} !important;
            }
            .btn-danger {
              background-color: ${colors.danger} !important;
              border-color: ${colors.danger} !important;
            }
            .btn-warning {
              background-color: ${colors.warning} !important;
              border-color: ${colors.warning} !important;
            }
            .btn-info {
              background-color: ${colors.info} !important;
              border-color: ${colors.info} !important;
            }
            .bg-primary {
              background-color: ${colors.primary} !important;
            }
            .text-primary {
              color: ${colors.primary} !important;
            }
            .border-primary {
              border-color: ${colors.primary} !important;
            }
            .navbar {
              background-color: ${colors.dark} !important;
            }
            .card-header {
              background-color: ${colors.light} !important;
              border-bottom-color: ${colors.secondary} !important;
            }
            a {
              color: ${colors.primary};
            }
            a:hover {
              color: ${darkenColor(colors.primary, 15)};
            }
          `;
          
          console.log('🎨 Loaded and applied saved theme colors with Bootstrap overrides');
        } catch (e) {
          console.error('Error loading saved colors:', e);
        }
      }
    } catch (error) {
      console.error('Failed to initialize extension protection:', error);
    }
    
    // Cleanup function to remove theme styles and CSS variables
    return () => {
      if (styleEl) {
        styleEl.remove();
      }
      // Reset CSS variables
      const root = document.documentElement;
      const savedColors = localStorage.getItem('customColors');
      if (savedColors) {
        try {
          const colors = JSON.parse(savedColors);
          Object.keys(colors).forEach(key => {
            root.style.removeProperty(`--bs-${key}`);
            root.style.removeProperty(`--${key}`);
          });
        } catch (e) {
          console.error('Error cleaning up theme variables:', e);
        }
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
        {/* Debug Panel removed - was causing production errors */}
      </Provider>
    </ErrorBoundary>
  );
}

export default App;// Force rebuild trigger Thu, Aug 14, 2025  6:06:26 PM
// OAuth domain fix trigger Thu, Aug 14, 2025  6:33:15 PM
// Force deployment Sat, Aug 16, 2025  2:24:42 PM
