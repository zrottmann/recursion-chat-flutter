/**
 * Robust Grok API Function with Fallback Support
 * Uses built-in fetch, detailed logging, and graceful degradation
 */

// Helper function to parse commands from AI response
function parseCommandsFromResponse(responseText) {
  const commands = [];
  const lines = responseText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('```bash') || line.includes('```sh') || line.includes('```')) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes('```')) break;
        const cmd = lines[j].trim();
        if (cmd && !cmd.startsWith('#') && !cmd.startsWith('//')) {
          commands.push({
            type: 'shell',
            command: cmd,
            description: 'AI suggested command'
          });
        }
      }
    }
  }
  
  return commands;
}

// Fallback responses for common requests
function getFallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('list') && (lowerPrompt.includes('file') || lowerPrompt.includes('directory'))) {
    return {
      explanation: "To list files in the current directory, you can use:\n\n```bash\nls\n```\n\nFor more details including hidden files:\n\n```bash\nls -la\n```",
      commands: [{ type: 'shell', command: 'ls', description: 'List files' }]
    };
  }
  
  if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('test')) {
    return {
      explanation: "Hello! I'm Grok, your AI assistant. I can help you with:\n\n• Writing code and scripts\n• Debugging issues\n• System commands\n• Development workflows\n• Project architecture\n\nWhat would you like help with today?",
      commands: []
    };
  }
  
  if (lowerPrompt.includes('create') && lowerPrompt.includes('react')) {
    return {
      explanation: "To create a new React application:\n\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```",
      commands: [
        { type: 'shell', command: 'npx create-react-app my-app', description: 'Create React app' },
        { type: 'shell', command: 'cd my-app', description: 'Enter directory' },
        { type: 'shell', command: 'npm start', description: 'Start dev server' }
      ]
    };
  }
  
  return {
    explanation: `I understand you want to: "${prompt}"\n\nI can help with:\n• Code generation and debugging\n• Command-line operations\n• Project setup and configuration\n• API development\n• Database design\n\nPlease provide more specific details about what you'd like to accomplish.`,
    commands: []
  };
}

module.exports = async ({ req, res, log, error }) => {
  const startTime = Date.now();
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    log('Handling OPTIONS request');
    return res.send('', 200, headers);
  }
  
  try {
    // Log request details for debugging
    log(`📋 Request method: ${req.method}`);
    log(`📋 Request body: ${JSON.stringify(req.body).substring(0, 200)}`);
    
    const { prompt, context = {} } = req.body || {};
    
    if (!prompt) {
      log('❌ No prompt provided');
      return res.json({
        success: false,
        error: 'Prompt is required',
        debug: { method: req.method, hasBody: !!req.body }
      }, 400, headers);
    }
    
    log(`🚀 Processing prompt: ${prompt.substring(0, 100)}...`);
    
    // Get API key with multiple fallback options
    const apiKey = req.variables?.XAI_API_KEY || 
                   process.env.XAI_API_KEY || 
                   req.env?.XAI_API_KEY ||
                   'xai-vnlMQtZqGhI1A5xWMnFOK1Y8G1JelWNePb7OTXjTALHs3vCOUzKgWcmXxfGwJKoIW4MFUXY0eaW1NN3A';
    
    log(`🔑 API Key configured: ${apiKey ? 'Yes' : 'No'} (length: ${apiKey?.length})`);
    
    // Try to call XAI API
    let xaiResponse = null;
    let xaiError = null;
    
    try {
      log('🤖 Attempting to call XAI Grok API...');
      
      // Check which fetch is available
      let fetchFunction;
      if (typeof fetch !== 'undefined') {
        log('Using built-in fetch');
        fetchFunction = fetch;
      } else {
        log('Attempting to load node-fetch');
        try {
          const nodeFetch = require('node-fetch');
          fetchFunction = nodeFetch;
          log('node-fetch loaded successfully');
        } catch (fetchError) {
          log(`node-fetch not available: ${fetchError.message}`);
          throw new Error('No fetch implementation available');
        }
      }
      
      // Create timeout with AbortController if available
      let signal = undefined;
      let timeoutId = undefined;
      
      if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        log('Timeout protection enabled (20s)');
      } else {
        log('AbortController not available, no timeout protection');
      }
      
      const apiUrl = 'https://api.x.ai/v1/chat/completions';
      log(`📡 Calling API: ${apiUrl}`);
      
      const response = await fetchFunction(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: signal,
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Provide clear, practical responses. When suggesting commands, use code blocks with ```bash or ```sh.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-beta',
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      log(`📡 API Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`❌ XAI API error: ${response.status} - ${errorText.substring(0, 200)}`);
        xaiError = `API returned ${response.status}: ${errorText.substring(0, 100)}`;
      } else {
        const data = await response.json();
        log('✅ XAI response received successfully');
        xaiResponse = data.choices?.[0]?.message?.content;
      }
      
    } catch (apiError) {
      xaiError = apiError.message;
      log(`❌ API call failed: ${apiError.message}`);
      
      if (apiError.name === 'AbortError') {
        xaiError = 'Request timeout after 20 seconds';
      }
    }
    
    // Prepare response
    let finalResponse;
    
    if (xaiResponse) {
      // Success - use XAI response
      log('Using XAI API response');
      const commands = parseCommandsFromResponse(xaiResponse);
      
      finalResponse = {
        success: true,
        explanation: xaiResponse,
        commands: commands,
        model: 'grok-beta',
        source: 'xai-api',
        executionTime: Date.now() - startTime
      };
      
    } else {
      // Fallback to helpful static response
      log('Using fallback response due to API failure');
      const fallback = getFallbackResponse(prompt);
      
      finalResponse = {
        success: true,
        explanation: fallback.explanation,
        commands: fallback.commands,
        model: 'fallback',
        source: 'static',
        apiError: xaiError,
        executionTime: Date.now() - startTime,
        debug: {
          apiAttempted: true,
          apiError: xaiError,
          hasApiKey: !!apiKey,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    log(`✅ Response prepared in ${Date.now() - startTime}ms (source: ${finalResponse.source})`);
    return res.json(finalResponse, 200, headers);
    
  } catch (handlerError) {
    // Final catch-all error handler
    const errorMsg = `Handler error: ${handlerError.message}`;
    error(errorMsg);
    log(`❌ ${errorMsg}`);
    log(`Stack: ${handlerError.stack}`);
    
    // Return a helpful error response
    return res.json({
      success: false,
      error: 'Function error',
      message: handlerError.message,
      explanation: "An error occurred processing your request. However, I can still help you! Please try rephrasing your question or ask about specific topics like:\n\n• Creating web applications\n• Writing scripts and automation\n• Debugging code issues\n• Setting up development environments",
      commands: [],
      executionTime: Date.now() - startTime,
      debug: {
        error: handlerError.message,
        timestamp: new Date().toISOString()
      }
    }, 500, headers);
  }
};