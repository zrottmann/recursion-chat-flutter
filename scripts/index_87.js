const sdk = require('node-appwrite');

/**
 * MOBILE-SAFE Super Site Function - ZERO External Dependencies
 * Fixes critical mobile white screen issue caused by CDN failures
 * Bulletproof version with inline CSS and progressive enhancement
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    // Log incoming request for debugging
    log(`🚀 Mobile-Safe Super Site Function Called: ${req.method} ${req.path || '/'}`);
    log(`User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);
    
    const currentPath = req.path || '/';
    const timestamp = new Date().toISOString();
    
    log(`Processing route: ${currentPath} at ${timestamp}`);
    
    // BULLETPROOF HTML - NO EXTERNAL DEPENDENCIES
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#667eea">
    <title>Console Appwrite Grok - Mobile Safe</title>
    <style>
        /* INLINE CRITICAL CSS - NO EXTERNAL DEPENDENCIES */
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
            min-height: 100vh;
            padding: 15px;
            line-height: 1.6;
            color: #fff;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding-top: 20px;
        }
        
        .main-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        h1 {
            font-size: 2.5em;
            font-weight: 700;
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        .status-success {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 25px;
            text-align: center;
            font-weight: 600;
            font-size: 1.2em;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .feature-icon {
            font-size: 3em;
            margin-bottom: 10px;
            display: block;
        }
        
        .feature-title {
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 1.1em;
        }
        
        .feature-desc {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .api-section {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
        }
        
        .api-title {
            color: #60a5fa;
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .api-endpoint {
            background: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 0.9em;
            word-break: break-all;
        }
        
        .api-body {
            background: rgba(75, 85, 99, 0.3);
            color: #d1d5db;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.85em;
        }
        
        .status-info {
            background: rgba(251, 191, 36, 0.2);
            color: #f59e0b;
            padding: 15px;
            border-radius: 12px;
            margin-top: 25px;
            font-size: 0.9em;
        }
        
        .status-time {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .status-details {
            opacity: 0.8;
            font-size: 0.85em;
        }
        
        @keyframes glow {
            0% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
            100% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.6), 0 0 40px rgba(102, 126, 234, 0.4); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .pulse { animation: pulse 2s ease-in-out infinite; }
        
        /* MOBILE RESPONSIVE - CRITICAL */
        @media (max-width: 768px) {
            body { padding: 10px; }
            .container { padding-top: 10px; }
            .main-card { padding: 20px; border-radius: 15px; }
            h1 { font-size: 2em; margin-bottom: 20px; }
            .feature-grid { grid-template-columns: 1fr; gap: 15px; }
            .feature-card { padding: 15px; }
            .feature-icon { font-size: 2.5em; }
            .api-section { padding: 20px; font-size: 0.9em; }
            .status-success { padding: 15px; font-size: 1.1em; }
        }
        
        @media (max-width: 480px) {
            body { padding: 8px; }
            .main-card { padding: 15px; }
            h1 { font-size: 1.8em; }
            .feature-icon { font-size: 2em; }
            .api-section { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-card">
            <h1>🚀 Console Appwrite Grok</h1>
            
            <div class="status-success pulse">
                ✅ Mobile-Safe Deployment Active!
            </div>
            
            <div class="feature-grid">
                <div class="feature-card">
                    <span class="feature-icon">⚡</span>
                    <div class="feature-title">Ultra Fast</div>
                    <div class="feature-desc">Zero CDN dependencies</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🧠</span>
                    <div class="feature-title">Grok AI</div>
                    <div class="feature-desc">Powered by xAI</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">📱</span>
                    <div class="feature-title">Mobile First</div>
                    <div class="feature-desc">Bulletproof design</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🔒</span>
                    <div class="feature-title">Secure API</div>
                    <div class="feature-desc">Enterprise ready</div>
                </div>
            </div>
            
            <div class="api-section">
                <div class="api-title">🔗 API Endpoint</div>
                <div class="api-endpoint">
                    POST https://nyc.cloud.appwrite.io/v1/functions/grok-api/executions
                </div>
                <div class="api-body">
                    {"async": false, "body": "{\\"prompt\\": \\"Your question here\\"}"}
                </div>
            </div>
            
            <div class="status-info">
                <div class="status-time">⚡ Function Status: ACTIVE</div>
                <div class="status-details">
                    Loaded: ${new Date().toLocaleString()}<br>
                    Route: ${currentPath} | Method: ${req.method}<br>
                    Mobile-Safe: v2.0 | Zero Dependencies
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // SAFE JAVASCRIPT - NO EXTERNAL CALLS ON LOAD
        console.log('🚀 Mobile-Safe Console Appwrite Grok loaded successfully!');
        console.log('Current path:', '${currentPath}');
        console.log('Load time:', Date.now());
        console.log('User agent:', navigator.userAgent);
        console.log('Screen size:', window.innerWidth + 'x' + window.innerHeight);
        
        // Progressive enhancement - test API after page loads
        window.addEventListener('load', function() {
            console.log('✅ Page fully loaded, testing API connection...');
            
            // Non-critical API test (won't break page if it fails)
            setTimeout(function() {
                try {
                    fetch('https://nyc.cloud.appwrite.io/v1/functions/grok-api/executions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Appwrite-Project': '68a4e3da0022f3e129d0'
                        },
                        body: JSON.stringify({
                            async: true,
                            body: JSON.stringify({ 
                                prompt: 'Mobile health check from super.appwrite.network - ' + new Date().toISOString()
                            })
                        })
                    })
                    .then(function(response) {
                        if (response.ok) {
                            console.log('✅ API connection successful');
                            // Update status if elements exist
                            var statusElements = document.querySelectorAll('.status-success');
                            if (statusElements.length > 0) {
                                statusElements[0].innerHTML = '✅ Mobile-Safe + API Connected!';
                            }
                        } else {
                            console.log('⚠️ API responded with status:', response.status);
                        }
                        return response.json();
                    })
                    .then(function(data) {
                        console.log('📡 API Response:', data);
                    })
                    .catch(function(err) {
                        console.log('⚠️ API connection failed (non-critical):', err.message);
                        // Page still works fine without API
                    });
                } catch (err) {
                    console.log('⚠️ API test error (non-critical):', err.message);
                }
            }, 2000); // Wait 2 seconds to ensure page is stable
        });
    </script>
</body>
</html>`;

    // OPTIMAL MOBILE HEADERS
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60', // Short cache for testing
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Appwrite-Project',
      'Vary': 'Accept-Encoding, User-Agent' // Mobile-specific caching
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      log('🔄 CORS Preflight request handled');
      return res.send('', 200, headers);
    }

    // Log successful response
    log(`✅ Serving MOBILE-SAFE HTML content for route: ${currentPath}`);
    log(`Content length: ${htmlContent.length} bytes`);
    log(`Zero external dependencies - bulletproof mobile rendering`);
    
    return res.send(htmlContent, 200, headers);

  } catch (err) {
    error(`❌ Mobile-Safe Super Site Function Error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    // ULTRA-SIMPLE ERROR PAGE - GUARANTEED TO WORK
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Console Appwrite Grok - Error</title>
    <style>
        body { 
            font-family: -apple-system, system-ui, sans-serif;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
            color: white;
            text-align: center;
        }
        .error-box {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { margin-bottom: 20px; }
        .error-code { font-family: monospace; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="error-box">
        <h1>🚀 Console Appwrite Grok</h1>
        <p>⚠️ Function Error</p>
        <div class="error-code">${err.message}</div>
        <p>This mobile-safe error page proves the function is running</p>
        <small>Time: ${new Date().toLocaleString()}</small>
    </div>
</body>
</html>`;
    
    return res.send(errorHtml, 500, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
  }
};