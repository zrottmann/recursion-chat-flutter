/**
 * Debug Panel Component
 * Interactive debug panel for development
 */

import React, { useState, useEffect } from 'react';
import { X, Bug, Download, Trash2, Filter, RefreshCw } from 'lucide-react';
import createDebugger from '../utils/debugLogger.js';
import './DebugPanel.css';

const debug = createDebugger('trading-post:debug-panel');

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugLevel, setDebugLevel] = useState('info');
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Check initial debug state
    const enabled = localStorage.getItem('DEBUG') === 'true';
    const level = localStorage.getItem('DEBUG_LEVEL') || 'info';
    setDebugEnabled(enabled);
    setDebugLevel(level);

    // Setup keyboard shortcut (Ctrl+Shift+D)
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (isOpen && autoRefresh) {
      const interval = setInterval(() => {
        refreshLogs();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh, filter]);

  const refreshLogs = () => {
    if (window.tradingPostDebug) {
      const history = window.tradingPostDebug.getHistory({ limit: 100 });
      const filtered = filter === 'all' 
        ? history 
        : history.filter(log => log.level === filter);
      setLogs(filtered);
    }
  };

  const toggleDebug = () => {
    const newState = !debugEnabled;
    localStorage.setItem('DEBUG', newState.toString());
    setDebugEnabled(newState);
    
    if (window.tradingPostDebug) {
      window.tradingPostDebug.setEnabled(newState);
    }
    
    debug.info(`Debug mode ${newState ? 'enabled' : 'disabled'}`);
  };

  const changeDebugLevel = (level) => {
    localStorage.setItem('DEBUG_LEVEL', level);
    setDebugLevel(level);
    debug.info(`Debug level changed to ${level}`);
  };

  const clearLogs = () => {
    if (window.tradingPostDebug) {
      window.tradingPostDebug.clearHistory();
      setLogs([]);
      debug.info('Logs cleared');
    }
  };

  const exportLogs = () => {
    if (window.tradingPostDebug) {
      const data = window.tradingPostDebug.exportHistory('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      debug.info('Logs exported');
    }
  };

  const getLogColor = (level) => {
    const colors = {
      trace: '#9b59b6',
      debug: '#7f8c8d',
      info: '#3498db',
      warn: '#f39c12',
      error: '#e74c3c',
      success: '#27ae60'
    };
    return colors[level] || '#333';
  };

  if (!isOpen) {
    return (
      <button
        className="debug-panel-toggle"
        onClick={() => setIsOpen(true)}
        title="Open Debug Panel (Ctrl+Shift+D)"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <h3>
          <Bug size={20} />
          Debug Panel
        </h3>
        <button onClick={() => setIsOpen(false)} className="close-btn">
          <X size={20} />
        </button>
      </div>

      <div className="debug-panel-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={debugEnabled}
              onChange={toggleDebug}
            />
            Enable Debug
          </label>
        </div>

        <div className="control-group">
          <label>Level:</label>
          <select value={debugLevel} onChange={(e) => changeDebugLevel(e.target.value)}>
            <option value="trace">Trace</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="control-group">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="trace">Trace</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>

        <div className="control-actions">
          <button onClick={refreshLogs} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={clearLogs} title="Clear">
            <Trash2 size={16} />
          </button>
          <button onClick={exportLogs} title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="debug-panel-logs">
        {logs.length === 0 ? (
          <div className="no-logs">No logs to display</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry" style={{ borderLeftColor: getLogColor(log.level) }}>
              <div className="log-header">
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="log-namespace">{log.namespace}</span>
                <span className="log-level" style={{ color: getLogColor(log.level) }}>
                  {log.level.toUpperCase()}
                </span>
              </div>
              <div className="log-message">
                {log.message.map((msg, i) => (
                  <span key={i}>
                    {typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg}
                    {i < log.message.length - 1 && ' '}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="debug-panel-footer">
        <div className="stats">
          {logs.length} logs | Debug: {debugEnabled ? 'ON' : 'OFF'} | Level: {debugLevel}
        </div>
        <div className="hint">
          Press Ctrl+Shift+D to toggle
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;