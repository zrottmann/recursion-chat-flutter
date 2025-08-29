/* Build: 2025-08-15 - Fixed errors and OAuth redirect */
import './utils/recursionFix'; // MUST be first - prevents stack overflow
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './utils/mutationObserverSafe';
import './utils/consoleFixer';
import './utils/loginErrorFixer'; // Comprehensive login error fixes
import './utils/fixDatabaseSchema'; // Initialize smart database wrapper
import databaseTester from './utils/testDatabaseFixes'; // Database fix testing
import errorLoggingService from './services/errorLoggingService';
import createDebugger from './utils/debugLogger.js';

// Initialize debug logger
const debug = createDebugger('trading-post:main');
window.tradingPostDebug = debug; // Make available globally for debugging

// Log app initialization
debug.info('Trading Post App initializing', {
  env: import.meta.env.MODE,
  version: '1.0.0',
  timestamp: new Date().toISOString()
});

// Make error logging service globally available
window.errorLoggingService = errorLoggingService;

// Log debug status
if (localStorage.getItem('DEBUG') === 'true') {
  debug.success('Debug mode enabled');
  debug.info('Debug level:', localStorage.getItem('DEBUG_LEVEL') || 'info');
}

// Run database fix validation tests in development
if (import.meta.env.DEV) {
  setTimeout(async () => {
    try {
      debug.info('🔧 Running database fix validation...');
      const testResults = await databaseTester.runTests();
      const summary = databaseTester.getSummary();
      
      if (summary.success) {
        debug.success(`✅ Database fixes validated (${summary.passed}/${summary.total} tests passed)`);
      } else {
        debug.warn(`⚠️ Database fixes need attention (${summary.failed} failures, ${summary.warnings} warnings)`);
      }
    } catch (error) {
      debug.error('Database validation failed:', error);
    }
  }, 3000); // Run after app initialization
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);