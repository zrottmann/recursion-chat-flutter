const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export default async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.body);
    const { sessionId, command, commandId } = payload;
    
    log(`Executing command: ${command} for session: ${sessionId}`);
    
    // Call Claude API
    const claudeResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: command
          }
        ],
        stream: false
      })
    });
    
    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }
    
    const claudeData = await claudeResponse.json();
    const output = claudeData.content[0].text;
    
    // Extract tools used (simplified for now)
    const toolsUsed = extractToolsFromResponse(output);
    
    // Return response
    return res.json({
      success: true,
      output: output,
      toolsUsed: toolsUsed,
      executionTime: Date.now() - new Date().getTime()
    });
    
  } catch (err) {
    error(`Error executing command: ${err.message}`);
    return res.json({
      success: false,
      error: err.message,
      output: null
    }, 500);
  }
};

function extractToolsFromResponse(response) {
  const tools = [];
  
  // Simple pattern matching for tool detection
  const toolPatterns = [
    { pattern: /bash|shell|terminal/i, tool: 'bash' },
    { pattern: /read|file|open/i, tool: 'read' },
    { pattern: /write|save|create/i, tool: 'write' },
    { pattern: /search|grep|find/i, tool: 'search' },
    { pattern: /web|fetch|http/i, tool: 'web' }
  ];
  
  toolPatterns.forEach(({ pattern, tool }) => {
    if (pattern.test(response)) {
      tools.push(tool);
    }
  });
  
  return tools;
}