/**
 * Shared Debug Logger Library
 * Universal debugging utility for all Claude projects
 * 
 * @author Claude Assistant
 * @version 1.0.0
 */

class DebugLogger {
  constructor(namespace = 'app') {
    this.namespace = namespace;
    this.enabled = this.checkEnabled();
    this.level = this.getLevel();
    this.colors = {
      debug: '#7f8c8d',
      info: '#3498db',
      warn: '#f39c12',
      error: '#e74c3c',
      success: '#27ae60',
      trace: '#9b59b6'
    };
    this.history = [];
    this.maxHistory = 1000;
    this.remoteLogging = false;
    this.remoteEndpoint = null;
  }

  /**
   * Check if debugging is enabled
   */
  checkEnabled() {
    // Check multiple sources for debug configuration
    if (typeof window !== 'undefined') {
      // Browser environment
      return localStorage.getItem('DEBUG') === 'true' ||
             localStorage.getItem(`DEBUG:${this.namespace}`) === 'true' ||
             window.DEBUG === true ||
             window.location.search.includes('debug=true');
    } else if (typeof process !== 'undefined') {
      // Node.js environment
      return process.env.DEBUG === 'true' ||
             process.env.DEBUG === '*' ||
             process.env.DEBUG?.includes(this.namespace);
    }
    return false;
  }

  /**
   * Get debug level
   */
  getLevel() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('DEBUG_LEVEL') || 'info';
    } else if (typeof process !== 'undefined') {
      return process.env.DEBUG_LEVEL || 'info';
    }
    return 'info';
  }

  /**
   * Set debug enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`DEBUG:${this.namespace}`, enabled.toString());
    }
  }

  /**
   * Format message with timestamp and namespace
   */
  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.namespace}] [${level.toUpperCase()}]`;
    return { prefix, args };
  }

  /**
   * Add to history
   */
  addToHistory(level, ...args) {
    const entry = {
      timestamp: new Date().toISOString(),
      namespace: this.namespace,
      level,
      message: args,
      stack: new Error().stack
    };
    
    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    // Send to remote if configured
    if (this.remoteLogging && this.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Send log to remote endpoint
   */
  async sendToRemote(entry) {
    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }

  /**
   * Core logging method
   */
  log(level, ...args) {
    const levels = ['trace', 'debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    // Check if should log based on level
    if (!this.enabled || messageLevelIndex < currentLevelIndex) {
      return;
    }

    const { prefix, args: formattedArgs } = this.formatMessage(level, ...args);
    this.addToHistory(level, ...formattedArgs);

    // Console output with styling
    if (typeof window !== 'undefined') {
      const color = this.colors[level] || '#333';
      console[level === 'trace' ? 'log' : level](
        `%c${prefix}`,
        `color: ${color}; font-weight: bold;`,
        ...formattedArgs
      );
    } else {
      console[level === 'trace' ? 'log' : level](prefix, ...formattedArgs);
    }
  }

  // Convenience methods
  trace(...args) { this.log('trace', ...args); }
  debug(...args) { this.log('debug', ...args); }
  info(...args) { this.log('info', ...args); }
  warn(...args) { this.log('warn', ...args); }
  error(...args) { this.log('error', ...args); }
  
  success(...args) {
    const { prefix, args: formattedArgs } = this.formatMessage('success', ...args);
    this.addToHistory('success', ...formattedArgs);
    
    if (this.enabled) {
      if (typeof window !== 'undefined') {
        console.log(
          `%c${prefix}`,
          `color: ${this.colors.success}; font-weight: bold;`,
          ...formattedArgs
        );
      } else {
        console.log(prefix, ...formattedArgs);
      }
    }
  }

  /**
   * Group logging
   */
  group(label) {
    if (this.enabled) {
      console.group(`[${this.namespace}] ${label}`);
    }
  }

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  /**
   * Table logging
   */
  table(data, columns) {
    if (this.enabled) {
      console.table(data, columns);
    }
  }

  /**
   * Timing utilities
   */
  time(label) {
    if (this.enabled) {
      console.time(`[${this.namespace}] ${label}`);
    }
  }

  timeEnd(label) {
    if (this.enabled) {
      console.timeEnd(`[${this.namespace}] ${label}`);
    }
  }

  /**
   * Performance monitoring
   */
  measure(name, fn) {
    if (!this.enabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Async performance monitoring
   */
  async measureAsync(name, fn) {
    if (!this.enabled) {
      return await fn();
    }

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Assert with logging
   */
  assert(condition, ...args) {
    if (!condition) {
      this.error('Assertion failed:', ...args);
      if (this.enabled) {
        console.assert(condition, ...args);
      }
    }
  }

  /**
   * Get debug history
   */
  getHistory(filter = {}) {
    let filtered = this.history;
    
    if (filter.level) {
      filtered = filtered.filter(entry => entry.level === filter.level);
    }
    
    if (filter.since) {
      const sinceDate = new Date(filter.since);
      filtered = filtered.filter(entry => new Date(entry.timestamp) > sinceDate);
    }
    
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }
    
    return filtered;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Export history
   */
  exportHistory(format = 'json') {
    const history = this.getHistory();
    
    if (format === 'json') {
      return JSON.stringify(history, null, 2);
    } else if (format === 'csv') {
      const headers = 'timestamp,namespace,level,message\n';
      const rows = history.map(entry => 
        `"${entry.timestamp}","${entry.namespace}","${entry.level}","${JSON.stringify(entry.message)}"`
      ).join('\n');
      return headers + rows;
    }
    
    return history;
  }

  /**
   * Create child logger with sub-namespace
   */
  child(subNamespace) {
    return new DebugLogger(`${this.namespace}:${subNamespace}`);
  }

  /**
   * Configure remote logging
   */
  configureRemote(endpoint) {
    this.remoteEndpoint = endpoint;
    this.remoteLogging = !!endpoint;
  }
}

/**
 * Factory function to create logger instances
 */
function createDebugger(namespace = 'app') {
  return new DebugLogger(namespace);
}

/**
 * Global debug instance for quick access
 */
const globalDebug = new DebugLogger('global');

// ES6 export (primary for Vite/modern bundlers)
export { DebugLogger, createDebugger, globalDebug };
export default createDebugger;

// Browser global fallback
if (typeof window !== 'undefined') {
  window.DebugLogger = DebugLogger;
  window.createDebugger = createDebugger;
  window.debug = globalDebug;
}