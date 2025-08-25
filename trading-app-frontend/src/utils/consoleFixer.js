/**
 * Console error suppression and cleanup utility
 * Helps reduce noise from browser extensions and third-party scripts
 */

// Global debug console state
let debugConsoleVisible = false;
let debugConsoleElement = null;
const debugLogBuffer = [];
const MAX_DEBUG_LOGS = 500; // Keep last 500 log entries

/**
 * Suppress repetitive console messages
 */
export function suppressRepetitiveMessages() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  const messageCache = new Map();
  const SUPPRESS_THRESHOLD = 3; // Suppress after 3 identical messages
  const CACHE_CLEANUP_INTERVAL = 30000; // Clean cache every 30 seconds

  function createSuppressor(originalMethod, level) {
    return function(...args) {
      const message = args.join(' ');
      const key = `${level}:${message}`;
      
      // Store in debug buffer for ` key console viewer
      storeDebugLog(level, args);
      
      // Check if this message has been seen before
      const cachedInfo = messageCache.get(key);
      const now = Date.now();
      
      if (cachedInfo) {
        cachedInfo.count++;
        cachedInfo.lastSeen = now;
        
        if (cachedInfo.count === SUPPRESS_THRESHOLD) {
          originalMethod.call(console, `[SUPPRESSED] Message repeated ${cachedInfo.count} times:`, message);
          return;
        } else if (cachedInfo.count > SUPPRESS_THRESHOLD) {
          return; // Suppress
        }
      } else {
        messageCache.set(key, { count: 1, firstSeen: now, lastSeen: now });
      }
      
      // Call original method
      originalMethod.apply(console, args);
    };
  }

  // Override console methods
  console.log = createSuppressor(originalConsole.log, 'log');
  console.warn = createSuppressor(originalConsole.warn, 'warn');
  console.error = createSuppressor(originalConsole.error, 'error');
  console.info = createSuppressor(originalConsole.info, 'info');

  // Periodic cache cleanup
  setInterval(() => {
    const now = Date.now();
    const CACHE_TTL = 60000; // 1 minute
    
    for (const [key, info] of messageCache.entries()) {
      if (now - info.lastSeen > CACHE_TTL) {
        messageCache.delete(key);
      }
    }
  }, CACHE_CLEANUP_INTERVAL);

  console.info('✓ Console message suppression enabled');
}

/**
 * Store debug log entries for ` key console viewer
 */
function storeDebugLog(level, args) {
  const timestamp = new Date().toLocaleTimeString();
  const message = args.join(' ');
  
  const logEntry = {
    timestamp,
    level,
    message,
    args: args.slice() // Copy args array
  };
  
  debugLogBuffer.push(logEntry);
  
  // Keep buffer size manageable
  if (debugLogBuffer.length > MAX_DEBUG_LOGS) {
    debugLogBuffer.shift(); // Remove oldest entry
  }
  
  // Update debug console if it's visible
  if (debugConsoleVisible && debugConsoleElement) {
    updateDebugConsoleDisplay();
  }
}

/**
 * Add specific filters for known problematic messages
 */
export function addConsoleFilters() {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out specific error patterns
    const ignoredPatterns = [
      /Failed to execute 'observe' on 'MutationObserver'/,
      /web-client-content-script/,
      /SiteSettings.*comparing Array/,
      /extension.*content.*script/i,
      /AppwriteException.*Invalid query.*Attribute not found in schema.*user_id/,
      /Failed to fetch matches.*AppwriteException.*Invalid query.*user_id/,
      /Invalid query.*Attribute not found.*user_id/,
      /❌ Failed to fetch matches.*AppwriteException/,
      /Service temporarily unavailable for.*trading-history/
    ];
    
    if (ignoredPatterns.some(pattern => pattern.test(message))) {
      return; // Suppress
    }
    
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filter out specific warning patterns
    const ignoredPatterns = [
      /SiteSettings.*comparing/,
      /extension.*warning/i,
      /🔧 \[API\] Service temporarily unavailable for.*trading-history/,
      /providing fallback/,
      /Matches collection not available.*using fallback/,
      /⚠️.*Collection.*does not exist.*using fallbacks/
    ];
    
    if (ignoredPatterns.some(pattern => pattern.test(message))) {
      return; // Suppress
    }
    
    originalWarn.apply(console, args);
  };

  console.info('✓ Console filters applied');
}

/**
 * Create and show debug console overlay
 */
function createDebugConsole() {
  if (debugConsoleElement) return;
  
  debugConsoleElement = document.createElement('div');
  debugConsoleElement.id = 'trading-post-debug-console';
  debugConsoleElement.innerHTML = `
    <div style="
      position: fixed;
      top: 10%;
      left: 10%;
      width: 80%;
      height: 70%;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #333;
      border-radius: 8px;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    ">
      <div style="
        background: #1a1a1a;
        padding: 10px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <strong>🚀 Trading Post Debug Console</strong>
          <span id="debug-log-count" style="margin-left: 20px; color: #888;">(0 logs)</span>
        </div>
        <div>
          <button id="debug-clear-btn" style="
            background: #e74c3c;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 5px;
          ">Clear</button>
          <button id="debug-export-btn" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 5px;
          ">Export</button>
          <button id="debug-close-btn" style="
            background: #95a5a6;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
          ">Close (\`)</button>
        </div>
      </div>
      <div style="
        padding: 10px;
        color: #bbb;
        border-bottom: 1px solid #333;
        background: #2a2a2a;
      ">
        <strong>Filters:</strong>
        <label style="margin: 0 15px 0 10px;">
          <input type="checkbox" id="filter-log" checked> LOG
        </label>
        <label style="margin: 0 15px;">
          <input type="checkbox" id="filter-info" checked> INFO
        </label>
        <label style="margin: 0 15px;">
          <input type="checkbox" id="filter-warn" checked> WARN
        </label>
        <label style="margin: 0 15px;">
          <input type="checkbox" id="filter-error" checked> ERROR
        </label>
        <span style="margin-left: 20px;">
          Auto-scroll: <input type="checkbox" id="auto-scroll" checked>
        </span>
      </div>
      <div id="debug-log-container" style="
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        background: #1e1e1e;
      ">
        <div id="debug-log-content"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(debugConsoleElement);
  
  // Add event listeners
  document.getElementById('debug-close-btn').addEventListener('click', hideDebugConsole);
  document.getElementById('debug-clear-btn').addEventListener('click', clearDebugLogs);
  document.getElementById('debug-export-btn').addEventListener('click', exportDebugLogs);
  
  // Add filter change listeners
  ['log', 'info', 'warn', 'error'].forEach(level => {
    document.getElementById(`filter-${level}`).addEventListener('change', updateDebugConsoleDisplay);
  });
  
  debugConsoleVisible = true;
  updateDebugConsoleDisplay();
  
  console.info('🔍 Debug console opened - Press ` to close');
}

/**
 * Hide debug console
 */
function hideDebugConsole() {
  if (debugConsoleElement) {
    debugConsoleElement.remove();
    debugConsoleElement = null;
  }
  debugConsoleVisible = false;
  console.info('🔍 Debug console closed');
}

/**
 * Toggle debug console visibility
 */
function toggleDebugConsole() {
  // Prevent rapid toggling
  if (window.__debugToggling) return;
  window.__debugToggling = true;
  
  if (debugConsoleVisible) {
    hideDebugConsole();
  } else {
    createDebugConsole();
  }
  
  // Reset toggle flag after a short delay
  setTimeout(() => {
    window.__debugToggling = false;
  }, 100);
}

/**
 * Update debug console display with current logs
 */
function updateDebugConsoleDisplay() {
  if (!debugConsoleElement) return;
  
  const logContent = document.getElementById('debug-log-content');
  const logCount = document.getElementById('debug-log-count');
  
  if (!logContent || !logCount) return;
  
  // Get active filters
  const activeFilters = {
    log: document.getElementById('filter-log')?.checked ?? true,
    info: document.getElementById('filter-info')?.checked ?? true,
    warn: document.getElementById('filter-warn')?.checked ?? true,
    error: document.getElementById('filter-error')?.checked ?? true
  };
  
  // Filter and display logs
  const filteredLogs = debugLogBuffer.filter(log => activeFilters[log.level]);
  
  logContent.innerHTML = filteredLogs.map(log => {
    const levelColors = {
      log: '#fff',
      info: '#3498db',
      warn: '#f39c12',
      error: '#e74c3c'
    };
    
    return `
      <div style="
        margin: 3px 0;
        padding: 3px 6px;
        border-left: 3px solid ${levelColors[log.level]};
        background: rgba(255, 255, 255, 0.02);
      ">
        <span style="color: #888; font-size: 10px;">[${log.timestamp}]</span>
        <span style="color: ${levelColors[log.level]}; font-weight: bold; margin: 0 8px;">${log.level.toUpperCase()}</span>
        <span>${escapeHtml(log.message)}</span>
      </div>
    `;
  }).join('');
  
  // Update count
  logCount.textContent = `(${filteredLogs.length}/${debugLogBuffer.length} logs)`;
  
  // Auto-scroll if enabled
  const autoScroll = document.getElementById('auto-scroll');
  if (autoScroll?.checked) {
    const container = document.getElementById('debug-log-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

/**
 * Clear debug logs
 */
function clearDebugLogs() {
  debugLogBuffer.length = 0;
  updateDebugConsoleDisplay();
  console.info('🧹 Debug logs cleared');
}

/**
 * Export debug logs to downloadable file
 */
function exportDebugLogs() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `trading-post-debug-logs-${timestamp}.txt`;
  
  const logData = debugLogBuffer.map(log => 
    `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
  ).join('\n');
  
  const blob = new Blob([logData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.info(`📁 Debug logs exported to ${filename}`);
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Set up keyboard event listener for ` key
 */
function setupDebugKeyboardListener() {
  // Use capture phase to prevent conflicts
  document.addEventListener('keydown', (event) => {
    // Check for backtick key (`)
    if (event.code === 'Backquote' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      // Prevent default action (like opening browser console)
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation(); // Stop other listeners
      
      // Only toggle if we're not typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
      
      if (!isTyping) {
        // Add a small delay to prevent race conditions
        setTimeout(() => {
          toggleDebugConsole();
        }, 10);
      }
    }
  }, true); // Use capture phase
  
  console.info('⌨️ Debug console keyboard listener active - Press ` (backtick) to open/close');
}

/**
 * Initialize console improvements
 */
export function initConsole() {
  // Prevent duplicate initialization
  if (window.__consoleInitialized) {
    console.info('✓ Console already initialized');
    return;
  }
  window.__consoleInitialized = true;
  
  try {
    suppressRepetitiveMessages();
    addConsoleFilters();
    setupDebugKeyboardListener();
    
    // Add a clean console command
    window.clearAppConsole = function() {
      console.clear();
      debugLogBuffer.length = 0; // Also clear debug buffer
      console.info('🧹 Console cleared - Trading Post app running');
    };
    
    // Make debug console functions globally accessible
    window.tradingPostDebug = {
      toggle: toggleDebugConsole,
      show: createDebugConsole,
      hide: hideDebugConsole,
      clear: clearDebugLogs,
      export: exportDebugLogs,
      getLogs: () => [...debugLogBuffer]
    };
    
    console.info('🚀 Trading Post - Console utilities loaded (Press ` for debug console)');
  } catch (error) {
    // Fail silently to avoid breaking the app
    console.error('Failed to initialize console utilities:', error);
  }
}

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.__TESTING__) {
  initConsole();
}