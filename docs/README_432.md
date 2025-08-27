# Debug Logger - Shared Library

A powerful, universal debug logging library for all Claude applications.

## Installation

### For Trading Post or other apps:

```bash
# From your app directory
npm install ../../shared-libs/debug-logger
```

Or add to package.json:
```json
"dependencies": {
  "@claude-apps/debug-logger": "file:../../shared-libs/debug-logger"
}
```

## Quick Start

```javascript
import createDebugger from '@claude-apps/debug-logger';

// Create a debugger for your module
const debug = createDebugger('trading-post:auth');

// Use it
debug.info('User logged in', { userId: user.id });
debug.error('Authentication failed', error);
debug.success('OAuth connection established');
```

## Features

- 🎯 **Namespace-based filtering** - Enable/disable specific modules
- 🎨 **Colored console output** - Different colors for different log levels
- 📊 **Performance monitoring** - Measure function execution time
- 📝 **History tracking** - Keep last 1000 logs in memory
- 🌐 **Remote logging** - Send logs to external service
- 🔍 **Multiple log levels** - trace, debug, info, warn, error
- ⚡ **Zero dependencies** - Lightweight and fast
- 🌍 **Universal** - Works in browser and Node.js

## Enabling Debug Mode

### Browser
```javascript
// Enable all debugging
localStorage.setItem('DEBUG', 'true');

// Enable specific namespace
localStorage.setItem('DEBUG:trading-post', 'true');

// Set log level
localStorage.setItem('DEBUG_LEVEL', 'debug'); // trace, debug, info, warn, error

// Or via URL
// https://tradingpost.appwrite.network/?debug=true
```

### Node.js
```bash
DEBUG=true npm start
DEBUG=trading-post:* npm start
DEBUG_LEVEL=trace npm start
```

## API Reference

### Basic Logging
```javascript
const debug = createDebugger('my-app');

debug.trace('Detailed trace info');
debug.debug('Debug information');
debug.info('General information');
debug.warn('Warning message');
debug.error('Error occurred', error);
debug.success('Operation successful');
```

### Performance Monitoring
```javascript
// Synchronous
const result = debug.measure('database-query', () => {
  return db.query('SELECT * FROM users');
});

// Asynchronous
const data = await debug.measureAsync('api-call', async () => {
  return await fetch('/api/data');
});

// Manual timing
debug.time('operation');
// ... do something
debug.timeEnd('operation');
```

### Grouping & Tables
```javascript
debug.group('User Operations');
debug.info('Creating user');
debug.info('Sending email');
debug.groupEnd();

debug.table([
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
]);
```

### History & Export
```javascript
// Get history
const logs = debug.getHistory({
  level: 'error',
  since: '2025-01-15T00:00:00',
  limit: 100
});

// Export history
const json = debug.exportHistory('json');
const csv = debug.exportHistory('csv');

// Clear history
debug.clearHistory();
```

### Child Loggers
```javascript
const mainDebug = createDebugger('trading-post');
const authDebug = mainDebug.child('auth');
const apiDebug = mainDebug.child('api');

authDebug.info('Login attempt'); // [trading-post:auth] Login attempt
apiDebug.info('API call');       // [trading-post:api] API call
```

### Remote Logging
```javascript
// Configure remote endpoint
debug.configureRemote('https://logs.example.com/collect');

// All logs will now be sent to remote endpoint
debug.error('This will be logged remotely too');
```

## Integration Examples

### React Component
```javascript
import createDebugger from '@claude-apps/debug-logger';

const debug = createDebugger('trading-post:marketplace');

function Marketplace() {
  useEffect(() => {
    debug.info('Marketplace component mounted');
    
    debug.measureAsync('load-items', async () => {
      const items = await loadItems();
      debug.success(`Loaded ${items.length} items`);
      return items;
    });
    
    return () => {
      debug.info('Marketplace component unmounted');
    };
  }, []);
}
```

### Express Middleware
```javascript
const debug = createDebugger('api:middleware');

app.use((req, res, next) => {
  debug.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body
  });
  
  debug.time(`request-${req.id}`);
  
  res.on('finish', () => {
    debug.timeEnd(`request-${req.id}`);
    debug.info(`Response: ${res.statusCode}`);
  });
  
  next();
});
```

### Appwrite Service
```javascript
const debug = createDebugger('trading-post:appwrite');

class AppwriteService {
  async login(email, password) {
    debug.info('Login attempt', { email });
    
    try {
      const session = await debug.measureAsync('appwrite-login', () => 
        account.createEmailSession(email, password)
      );
      
      debug.success('Login successful', { userId: session.userId });
      return session;
    } catch (error) {
      debug.error('Login failed', error);
      throw error;
    }
  }
}
```

## Debug Panel (Browser)

Access debug tools in browser console:

```javascript
// Enable/disable debugging
window.debug.setEnabled(true);

// View recent logs
window.debug.getHistory({ limit: 50 });

// Export logs
copy(window.debug.exportHistory('json'));

// Clear logs
window.debug.clearHistory();
```

## Production Considerations

- Debug logging is automatically disabled in production unless explicitly enabled
- History is kept in memory (max 1000 entries) - clear periodically if needed
- Remote logging is opt-in and should use HTTPS endpoints
- Sensitive data should be filtered before logging

## License

MIT