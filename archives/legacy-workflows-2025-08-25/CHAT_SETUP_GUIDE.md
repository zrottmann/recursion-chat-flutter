# Claude Code UI - Real-Time Chat Setup Guide

## Overview

The Claude Code UI now includes a comprehensive real-time chat system that integrates with Appwrite for backend services and provides AI-powered assistance for development tasks.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Chat   │◄──►│   Appwrite      │◄──►│  Claude Code    │
│   Frontend      │    │   Functions     │    │   Bridge        │
│  (claude-chat.  │    │                 │    │                 │
│    html)        │    │ • chatroom-     │    │ • Command       │
│                 │    │   function      │    │   Execution     │
│ • Real-time UI  │    │ • claude-code-  │    │ • File Ops      │
│ • WebSocket     │    │   bridge        │    │ • Git Ops       │
│ • Mobile Ready  │    │ • Realtime      │    │ • AI Assistant  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Deploy to super.appwrite.network

The chat interface automatically deploys when you push changes:

```bash
git add claude-chat.html appwrite-functions/claude-code-bridge/
git commit -m "feat: Real-time chat interface with Claude Code integration"
git push
```

### 2. Configure Appwrite Project

Set up the required collections and functions:

**Collections:**
- `messages` - Chat messages
- `chatrooms` - Chat rooms
- `activities` - User activity logs

**Functions:**
- `chatroom-function` - Message handling and Grok AI
- `claude-code-bridge` - Command execution and file operations

### 3. Environment Variables

Configure these in Appwrite Functions:

```bash
# Appwrite Configuration
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
DB_ID=your_database_id

# AI Configuration (Grok)
AI_API_ENDPOINT=https://api.x.ai/v1/chat/completions
AI_API_KEY=your_grok_api_key
AI_MODEL=grok-beta

# Claude Code Remote (Optional)
CLAUDE_CODE_ENDPOINT=http://localhost:3000
CLAUDE_CODE_API_KEY=your_claude_code_key
TMUX_SESSION=claude-code
WORKING_DIRECTORY=/workspace

# Security
ALLOW_DIRECT_EXECUTION=false  # Only true in development
NODE_ENV=production
```

## Features

### ✅ Real-Time Messaging
- WebSocket connections via Appwrite Realtime
- Live typing indicators
- Message persistence
- Connection status monitoring

### ✅ AI Assistant Integration
- Grok API integration for intelligent responses
- Context-aware conversations
- Command interpretation and suggestions
- Natural language processing

### ✅ Development Command Bridge
- Safe command execution with sanitization
- File operations (list, read, write)
- Git operations (status, commit, push)
- Build and test automation
- Project deployment

### ✅ Mobile-Optimized UI
- Responsive design for all screen sizes
- Touch-friendly interface
- iOS Safari optimizations
- Progressive Web App ready

### ✅ Security Features
- Command sanitization and validation
- User authentication via Appwrite
- Rate limiting and access controls
- Audit logging for all operations

## Configuration Details

### Appwrite Database Schema

**Messages Collection:**
```json
{
  "roomId": "string",
  "userId": "string", 
  "userName": "string",
  "content": "string",
  "type": "text|system|ai",
  "timestamp": "datetime",
  "attachments": "string[]",
  "reactions": "object[]"
}
```

**Chatrooms Collection:**
```json
{
  "name": "string",
  "description": "string", 
  "createdBy": "string",
  "participants": "string[]",
  "isPrivate": "boolean",
  "maxParticipants": "integer",
  "grokEnabled": "boolean",
  "createdAt": "datetime",
  "lastActivity": "datetime"
}
```

### Function Deployment

Deploy the functions to Appwrite:

```bash
# Deploy chatroom function
cd appwrite-functions/chatroom-function
appwrite functions createDeployment --functionId=chatroom-function

# Deploy claude-code-bridge function  
cd appwrite-functions/claude-code-bridge
appwrite functions createDeployment --functionId=claude-code-bridge
```

### Frontend Configuration

Update the Appwrite configuration in `claude-chat.html`:

```javascript
const APPWRITE_CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: 'your_project_id', // Update this
    databaseId: 'claude_chat_db',
    chatCollectionId: 'messages',
    roomsCollectionId: 'chatrooms',
    functionId: 'chatroom-function'
};
```

## Testing & Development

### Local Development

1. Run Appwrite locally or use cloud instance
2. Set up test collections and functions
3. Configure environment variables
4. Enable `ALLOW_DIRECT_EXECUTION=true` for testing

### Security Testing

The system includes built-in security measures:
- Command sanitization prevents injection attacks
- File path validation prevents directory traversal
- Rate limiting prevents abuse
- Audit logging tracks all operations

### Performance Optimization

- WebSocket connections for real-time features
- Message pagination for large chat histories  
- Lazy loading for file operations
- Caching for frequently accessed data

## Troubleshooting

### Connection Issues
- Verify Appwrite project ID and API keys
- Check network connectivity to Appwrite endpoint
- Validate SSL certificates for HTTPS connections

### Function Errors
- Review function logs in Appwrite console
- Verify environment variables are set
- Check function permissions and quotas

### Chat Not Loading
- Ensure Appwrite SDK loads correctly
- Verify real-time subscriptions are active
- Check browser console for JavaScript errors

## Next Steps

1. **Phase 2**: Enhanced Claude Code Remote integration
2. **Phase 3**: Advanced file sharing and collaboration
3. **Phase 4**: Multi-room support and user management
4. **Phase 5**: Voice/video integration and screen sharing

## Support

For issues and feature requests:
- Check function logs in Appwrite console
- Review browser developer tools
- Test with simulated commands first
- Verify all environment variables are configured

The Claude Code UI chat system is designed to be production-ready while maintaining flexibility for development workflows.