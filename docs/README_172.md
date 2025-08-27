# Grok API Function for Appwrite

## Overview
Robust Grok API function with XAI integration and fallback support for Appwrite Functions.

## Features
- ✅ Real XAI/Grok API integration
- ✅ Fallback responses when API unavailable
- ✅ Detailed debug logging
- ✅ Command parsing from AI responses
- ✅ 20-second timeout protection
- ✅ Built-in fetch with node-fetch fallback

## Environment Variables
```
XAI_API_KEY=your_xai_api_key_here
```

## Deployment

### Appwrite Function Setup
1. Create new function in Appwrite Console
2. Runtime: Node.js 18.0
3. Entry point: `index.js`
4. Build commands: `npm install`
5. Set XAI_API_KEY environment variable

### Testing
```bash
curl -X POST https://your-appwrite-endpoint/v1/functions/grok-api/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: your-project-id" \
  -d '{"prompt": "Hello Grok!"}'
```

## Response Format
```json
{
  "success": true,
  "explanation": "AI response text",
  "commands": [
    {
      "type": "shell",
      "command": "ls -la",
      "description": "List files"
    }
  ],
  "model": "grok-beta",
  "source": "xai-api",
  "executionTime": 1234
}
```

## Fallback Mode
When XAI API is unavailable, the function returns helpful static responses for common queries:
- File listing commands
- React app creation
- General help and guidance

## Error Handling
- Graceful degradation to fallback responses
- Detailed error messages with debug info
- Always returns valid JSON response

## License
MIT