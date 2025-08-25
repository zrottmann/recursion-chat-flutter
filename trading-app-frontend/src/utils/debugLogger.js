/**
 * Simple Debug Logger
 * Minimal replacement for @claude-apps/debug-logger
 * Build: 2025-08-16 - Force fresh deployment
 */

class SimpleDebugLogger {
  constructor(namespace = 'app') {
    this.namespace = namespace;
    this.enabled = this.checkEnabled();
  }

  checkEnabled() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('DEBUG') === 'true' ||
             window.location.search.includes('debug=true') ||
             window.location.hostname === 'localhost';
    }
    return process.env.NODE_ENV === 'development';
  }

  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    return [`[${timestamp}] [${this.namespace}] [${level.toUpperCase()}]`, ...args];
  }

  log(level, ...args) {
    if (!this.enabled) return;
    
    const formatted = this.formatMessage(level, ...args);
    console[level === 'trace' ? 'log' : level](...formatted);
  }

  trace(...args) { this.log('trace', ...args); }
  debug(...args) { this.log('debug', ...args); }
  info(...args) { this.log('info', ...args); }
  warn(...args) { this.log('warn', ...args); }
  error(...args) { this.log('error', ...args); }
  success(...args) { this.log('info', ...args); }

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
}

function createDebugger(namespace = 'app') {
  return new SimpleDebugLogger(namespace);
}

export default createDebugger;