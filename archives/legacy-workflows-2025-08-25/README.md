# Archon Knowledge Engine Backend

A Node.js backend API for the Archon Knowledge Engine, providing endpoints for knowledge management and AI chat capabilities.

## Features

- **Knowledge Items API**: CRUD operations for managing knowledge base items
- **Agent Chat Sessions**: RESTful API for creating and managing chat sessions
- **Health Monitoring**: Built-in health checks and status monitoring
- **Appwrite Integration**: Full integration with Appwrite backend services

## API Endpoints

### Health & Status
- `GET /api/health` - Health check endpoint
- `GET /api/server/status` - Server status information

### Knowledge Management
- `GET /api/knowledge-items` - List knowledge items with pagination
- `POST /api/knowledge-items` - Create new knowledge item (TODO)
- `GET /api/knowledge-items/:id` - Get specific knowledge item (TODO)

### Chat Sessions
- `POST /api/agent-chat/sessions` - Create new chat session
- `GET /api/agent-chat/sessions/:id` - Get chat session details
- `POST /api/agent-chat/sessions/:id/messages` - Send message to session

## Environment Variables

```env
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=archon_knowledge_db
APPWRITE_COLLECTION_KNOWLEDGE_ITEMS=knowledge_items
APPWRITE_COLLECTION_CHAT_SESSIONS=chat_sessions
APPWRITE_FUNCTION_ID=health_check_function
PORT=8080
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`

3. Start development server:
```bash
npm run dev
```

## Deployment

This backend is configured for deployment on DigitalOcean App Platform:

```bash
# Deploy using doctl
doctl apps create --spec app-spec.yaml
```

## Appwrite Functions

The project includes two Appwrite Functions:

1. **Health Check Function** (`health-check`) - Provides health monitoring
2. **Knowledge Processor Function** (`knowledge-processor`) - Handles knowledge operations

Deploy functions using the Appwrite CLI:
```bash
appwrite deploy function
```

## Current Status

- ✅ Basic API structure implemented
- ✅ Health check endpoint working
- ✅ Mock knowledge items endpoint
- ✅ Chat sessions API framework
- ⏳ Appwrite database integration (needs project ID)
- ⏳ Function deployment configuration
- ⏳ Production deployment setup

## Next Steps

1. Create Appwrite project and get project ID
2. Deploy Appwrite Functions
3. Configure database collections
4. Deploy backend API
5. Update frontend to use correct API endpoints# Auto-deploy test Mon, Aug 18, 2025  9:48:30 AM
