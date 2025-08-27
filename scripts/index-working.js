/**
 * Working Grok API Function - Simple XAI Integration
 * No timeout issues, no undefined functions
 */

// Helper function to parse commands from AI response
function parseCommandsFromResponse(responseText) {
  const commands = [];
  const lines = responseText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('```bash') || line.includes('```sh') || line.includes('```')) {
      // Look for code block content
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

module.exports = async ({ req, res, log, error }) => {
  const startTime = Date.now();
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (req.method === 'OPTIONS') {
    return res.send('', 200, headers);
  }
  
  try {
    const { prompt, context = {} } = req.body || {};
    
    if (!prompt) {
      return res.json({
        success: false,
        error: 'Prompt is required'
      }, 400, headers);
    }
    
    log(`🚀 Processing: ${prompt.substring(0, 100)}...`);
    
    // Get API key - fallback to hardcoded for testing
    const apiKey = req.variables?.XAI_API_KEY || 'xai-vnlMQtZqGhI1A5xWMnFOK1Y8G1JelWNePb7OTXjTALHs3vCOUzKgWcmXxfGwJKoIW4MFUXY0eaW1NN3A';
    
    if (!apiKey) {
      return res.json({
        success: false,
        error: 'XAI API key not configured'
      }, 500, headers);
    }
    
    // Call XAI API with timeout
    const fetch = require('node-fetch');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    try {
      log('🤖 Calling XAI Grok API...');
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
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
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        error(`XAI API error: ${response.status} - ${errorText}`);
        
        return res.json({
          success: false,
          error: `XAI API error: ${response.status}`,
          details: errorText,
          executionTime: Date.now() - startTime
        }, 500, headers);
      }
      
      const data = await response.json();
      log('✅ XAI response received');
      
      const aiResponse = data.choices?.[0]?.message?.content || 'No response from AI';
      const commands = parseCommandsFromResponse(aiResponse);
      
      const result = {
        success: true,
        explanation: aiResponse,
        commands: commands,
        model: 'grok-beta',
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      log(`✅ Completed in ${Date.now() - startTime}ms`);
      return res.json(result, 200, headers);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        error('Request timeout after 25 seconds');
        return res.json({
          success: false,
          error: 'Request timeout',
          executionTime: Date.now() - startTime
        }, 408, headers);
      }
      
      error(`Fetch error: ${fetchError.message}`);
      return res.json({
        success: false,
        error: 'Network error',
        message: fetchError.message,
        executionTime: Date.now() - startTime
      }, 500, headers);
    }
    
  } catch (handlerError) {
    error(`Handler error: ${handlerError.message}`);
    
    return res.json({
      success: false,
      error: 'Internal server error',
      message: handlerError.message,
      executionTime: Date.now() - startTime
    }, 500, headers);
  }
};