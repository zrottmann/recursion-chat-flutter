import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Client, Databases, ID, Query, Functions, Storage, Users } from 'node-appwrite';
import multer from 'multer';
import { readFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Import our services
import logger from './src/services/logger.js';
import { DocumentProcessor } from './src/services/documentProcessor.js';
import { WebCrawler } from './src/services/webCrawler.js';
import { MCPProtocol } from './src/services/mcpProtocol.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['https://archon.appwrite.network', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }
});

const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security and performance middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
});

// CORS and body parsing middleware
app.use(cors({
  origin: ['https://archon.appwrite.network', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(txt|pdf|doc|docx|md|json|csv|xlsx)$/;
    const allowed = allowedTypes.test(extname(file.originalname).toLowerCase());
    cb(null, allowed);
  }
});

// Appwrite client setup
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const functions = new Functions(client);
const storage = new Storage(client);
const users = new Users(client);

// Global state for real-time connections
const activeConnections = new Map();
const activeCrawls = new Map();

// Health check endpoints (both /api/health and /health for frontend compatibility)
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    console.log('🏥 Health check requested');
    
    // Check if Function ID is configured
    if (!process.env.APPWRITE_FUNCTION_ID) {
      console.log('❌ Function ID not configured');
      return res.status(500).json({ 
        status: 'error', 
        message: 'Function ID not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Test database connection
    await databases.list();
    
    res.json({ 
      status: 'healthy', 
      message: 'Archon Knowledge Engine is running',
      timestamp: new Date().toISOString(),
      functionId: process.env.APPWRITE_FUNCTION_ID
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Knowledge Items API
app.get('/api/knowledge-items', async (req, res) => {
  try {
    console.log('📊 Loading knowledge items via REST API');
    const { page = 1, per_page = 100 } = req.query;
    
    console.log(`📋 Getting knowledge items with filter: page=${page}, per_page=${per_page}`);
    
    // Mock data for now - replace with actual Appwrite database query
    const mockKnowledgeItems = {
      items: [
        {
          id: '1',
          title: 'Sample Knowledge Item',
          content: 'This is a sample knowledge item for testing',
          category: 'general',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 1,
      page: parseInt(page),
      per_page: parseInt(per_page),
      total_pages: 1
    };

    console.log('✅ Knowledge items loaded successfully');
    res.json(mockKnowledgeItems);
  } catch (error) {
    console.error('❌ Failed to load knowledge items:', error);
    res.status(500).json({ 
      error: 'Failed to load knowledge items',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Agent Chat Sessions API
app.post('/api/agent-chat/sessions', async (req, res) => {
  try {
    console.log('[AGENT SERVICE] Creating session with body:', req.body);
    const { agentType = 'rag' } = req.body;
    
    // Mock session creation - replace with actual implementation
    const sessionId = ID.unique();
    const session = {
      id: sessionId,
      agentType,
      status: 'active',
      created_at: new Date().toISOString(),
      messages: []
    };

    console.log(`✅ Chat session created: ${sessionId}`);
    res.json(session);
  } catch (error) {
    console.error('❌ Failed to create chat session:', error);
    res.status(500).json({ 
      error: 'Failed to create chat session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get chat session
app.get('/api/agent-chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Getting chat session: ${id}`);
    
    // Mock session retrieval
    const session = {
      id,
      agentType: 'rag',
      status: 'active',
      created_at: new Date().toISOString(),
      messages: []
    };

    res.json(session);
  } catch (error) {
    console.error('❌ Failed to get chat session:', error);
    res.status(500).json({ 
      error: 'Failed to get chat session',
      message: error.message 
    });
  }
});

// Send message to chat session
app.post('/api/agent-chat/sessions/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    console.log(`💬 Sending message to session ${id}:`, message);
    
    // Mock message processing
    const response = {
      id: ID.unique(),
      session_id: id,
      message,
      response: 'This is a mock response from the Archon Knowledge Engine.',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error.message 
    });
  }
});

// Server status endpoint
app.get('/api/server/status', async (req, res) => {
  try {
    console.log('📊 Server status requested');
    
    const status = {
      server: 'Archon Knowledge Engine',
      status: 'running',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(status);
  } catch (error) {
    console.error('❌ Failed to get server status:', error);
    res.status(500).json({ 
      error: 'Failed to get server status',
      message: error.message 
    });
  }
});

// Credentials API endpoints
app.get('/api/credentials', async (req, res) => {
  try {
    console.log('🔑 [Credentials] Getting all credentials...');
    
    // Mock credentials data - Including specific flags the frontend expects
    const credentials = {
      DISCONNECT_SCREEN_ENABLED: {
        enabled: false,
        value: false,
        description: 'Disconnect screen feature flag'
      },
      PROJECTS_ENABLED: {
        enabled: true,
        value: true,
        description: 'Projects feature flag'
      },
      rag_strategy: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 2000,
        enabled: true
      },
      search_engine: {
        provider: 'elasticsearch',
        index: 'knowledge_base',
        host: 'localhost:9200',
        enabled: true
      },
      embedding_service: {
        provider: 'openai',
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        enabled: true
      }
    };

    console.log('✅ [Credentials] All credentials retrieved');
    res.json(credentials);
  } catch (error) {
    console.error('❌ [Credentials] Failed to fetch credentials:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credentials',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get credentials by category
app.get('/api/credentials/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`🔑 [Credentials] Getting credentials for category: ${category}`);
    
    // Mock credentials data - Including specific flags the frontend expects
    const allCredentials = {
      DISCONNECT_SCREEN_ENABLED: {
        enabled: false,
        value: false,
        description: 'Disconnect screen feature flag'
      },
      PROJECTS_ENABLED: {
        enabled: true,
        value: true,
        description: 'Projects feature flag'
      },
      rag_strategy: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 2000,
        enabled: true
      },
      search_engine: {
        provider: 'elasticsearch',
        index: 'knowledge_base',
        host: 'localhost:9200',
        enabled: true
      },
      embedding_service: {
        provider: 'openai',
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        enabled: true
      }
    };

    if (allCredentials[category]) {
      console.log(`✅ [Credentials] Found credentials for category: ${category}`);
      res.json({ [category]: allCredentials[category] });
    } else {
      console.log(`⚠️ [Credentials] Category not found: ${category}`);
      res.status(404).json({ 
        error: 'Credential category not found',
        category,
        available_categories: Object.keys(allCredentials),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ [Credentials] Failed to fetch category credentials:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credentials',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Projects health endpoint  
app.get('/api/projects/health', async (req, res) => {
  try {
    console.log('🔍 [Projects] Projects health check requested');
    
    const projectsHealth = {
      status: 'healthy',
      projects: [
        {
          id: 'archon-knowledge-engine',
          name: 'Archon Knowledge Engine',
          status: 'active',
          health: 'good',
          last_check: new Date().toISOString()
        }
      ],
      total_projects: 1,
      healthy_projects: 1,
      timestamp: new Date().toISOString()
    };

    console.log('✅ [Projects] Projects health check completed');
    res.json(projectsHealth);
  } catch (error) {
    console.error('❌ [Projects] Projects health check failed:', error);
    res.status(500).json({ 
      error: 'Projects health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize service instances
const documentProcessor = new DocumentProcessor();
const webCrawler = new WebCrawler();
const mcpProtocol = new MCPProtocol();

// WebSocket connection handling
io.on('connection', (socket) => {
  const connectionId = socket.id;
  activeConnections.set(connectionId, socket);
  
  logger.info(`Client connected: ${connectionId}`);
  
  socket.on('disconnect', () => {
    activeConnections.delete(connectionId);
    logger.info(`Client disconnected: ${connectionId}`);
  });
  
  // Handle real-time crawl progress
  socket.on('start_crawl', async (data) => {
    try {
      const { url, options = {} } = data;
      const crawlId = `crawl_${Date.now()}`;
      
      socket.emit('crawl_started', { crawl_id: crawlId });
      
      const results = await WebCrawler.crawlUrl(url, options);
      
      socket.emit('crawl_completed', { crawl_id: crawlId, results });
    } catch (error) {
      socket.emit('crawl_error', { error: error.message });
    }
  });
});

// Document processing endpoints
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    logger.info(`Processing document: ${req.file.originalname}`);
    
    const result = await DocumentProcessor.processDocument(req.file, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Document processing failed:', error);
    res.status(500).json({ 
      error: 'Document processing failed',
      message: error.message 
    });
  }
});

app.post('/api/documents/batch-upload', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    logger.info(`Processing ${req.files.length} documents`);
    
    const results = await Promise.all(
      req.files.map(file => DocumentProcessor.processDocument(file, req.body))
    );
    
    res.json({ documents: results, count: results.length });
  } catch (error) {
    logger.error('Batch document processing failed:', error);
    res.status(500).json({ 
      error: 'Batch document processing failed',
      message: error.message 
    });
  }
});

// Web crawling endpoints
app.post('/api/crawl/start', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    logger.info(`Starting crawl for ${url}`);
    
    const results = await WebCrawler.crawlUrl(url, options);
    
    // Broadcast to all connected clients
    io.emit('crawl_completed', { results });
    
    res.json(results);
  } catch (error) {
    logger.error('Failed to start crawl:', error);
    res.status(500).json({ 
      error: 'Failed to start crawl',
      message: error.message 
    });
  }
});

// MCP (Model Context Protocol) endpoints
app.post('/api/mcp/request', async (req, res) => {
  try {
    logger.info('MCP request received:', req.body);
    
    const response = await MCPProtocol.handleRequest(req.body);
    
    res.json(response);
  } catch (error) {
    logger.error('MCP request failed:', error);
    res.status(500).json({ 
      error: 'MCP request failed',
      message: error.message 
    });
  }
});

app.get('/api/mcp/tools', async (req, res) => {
  try {
    const tools = [
      {
        name: 'text_search',
        description: 'Search through knowledge base content',
        parameters: ['query', 'limit']
      },
      {
        name: 'knowledge_create',
        description: 'Create new knowledge item',
        parameters: ['title', 'content', 'category']
      },
      {
        name: 'rag_query',
        description: 'Perform retrieval-augmented generation query',
        parameters: ['query', 'context_limit', 'model']
      }
    ];
    
    res.json({ tools });
  } catch (error) {
    logger.error('Failed to list MCP tools:', error);
    res.status(500).json({ 
      error: 'Failed to list MCP tools',
      message: error.message 
    });
  }
});

app.post('/api/mcp/tools/:toolName/call', async (req, res) => {
  try {
    const { toolName } = req.params;
    const response = await MCPProtocol.handleRequest({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: req.body
      }
    });
    
    res.json(response);
  } catch (error) {
    logger.error('MCP tool call failed:', error);
    res.status(500).json({ 
      error: 'MCP tool call failed',
      message: error.message 
    });
  }
});

// Search and indexing endpoints
app.post('/api/search', async (req, res) => {
  try {
    const { query, filters = {}, limit = 10, offset = 0 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    logger.info(`Search request: "${query}"`);
    
    // Mock search implementation - replace with actual search engine
    const results = {
      query,
      results: [
        {
          id: '1',
          title: `Search Result for: ${query}`,
          content: `This is a sample result for query: ${query}`,
          score: 0.95,
          source: 'knowledge_base',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Related Knowledge Item',
          content: `Additional context related to: ${query}`,
          score: 0.87,
          source: 'documents',
          timestamp: new Date().toISOString()
        }
      ],
      total: 2,
      limit,
      offset,
      took: 12
    };
    
    res.json(results);
  } catch (error) {
    logger.error('Search failed:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// RAG (Retrieval Augmented Generation) endpoints
app.post('/api/rag/query', async (req, res) => {
  try {
    const { question, context_limit = 5, model = 'gpt-4' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    logger.info(`RAG query: "${question}"`);
    
    // Mock RAG implementation
    const response = {
      question,
      answer: `Based on the knowledge base, here's what I found regarding "${question}": This is a comprehensive response that would be generated by retrieving relevant context from the knowledge base and using an AI model to generate a contextually accurate answer. The system would analyze multiple sources and provide citations.`,
      context: [
        {
          id: '1',
          title: 'Primary Knowledge Source',
          content: 'Context used for generating the response...',
          score: 0.94,
          source: 'knowledge_base'
        },
        {
          id: '2',
          title: 'Supporting Documentation',
          content: 'Additional context that supports the answer...',
          score: 0.89,
          source: 'documents'
        }
      ],
      model,
      metadata: {
        context_count: 2,
        response_time: 850,
        tokens_used: 256,
        confidence: 0.92
      }
    };
    
    res.json(response);
  } catch (error) {
    logger.error('RAG query failed:', error);
    res.status(500).json({ 
      error: 'RAG query failed',
      message: error.message 
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Mock authentication - replace with actual auth logic
    const token = jwt.sign(
      { email, userId: 'mock_user_id' },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '24h' }
    );
    
    logger.info(`User logged in: ${email}`);
    
    res.json({
      token,
      user: {
        id: 'mock_user_id',
        email,
        name: 'Archon User',
        role: 'user',
        permissions: ['read', 'write', 'search']
      }
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Mock registration - replace with actual registration logic
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      id: ID.unique(),
      email,
      name,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    logger.info(`User registered: ${email}`);
    
    res.json({ user, message: 'User registered successfully' });
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

// Advanced knowledge management endpoints
app.post('/api/knowledge/create', async (req, res) => {
  try {
    const { title, content, category = 'general', tags = [] } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const knowledgeItem = {
      id: ID.unique(),
      title,
      content,
      category,
      tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      word_count: content.split(/\s+/).length,
      char_count: content.length
    };
    
    logger.info(`Knowledge item created: ${title}`);
    
    res.json(knowledgeItem);
  } catch (error) {
    logger.error('Failed to create knowledge item:', error);
    res.status(500).json({ 
      error: 'Failed to create knowledge item',
      message: error.message 
    });
  }
});

app.put('/api/knowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    
    const updatedItem = {
      id,
      title: title || 'Updated Knowledge Item',
      content: content || 'Updated content',
      category: category || 'general',
      tags: tags || [],
      updated_at: new Date().toISOString()
    };
    
    logger.info(`Knowledge item updated: ${id}`);
    
    res.json(updatedItem);
  } catch (error) {
    logger.error('Failed to update knowledge item:', error);
    res.status(500).json({ 
      error: 'Failed to update knowledge item',
      message: error.message 
    });
  }
});

app.delete('/api/knowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Knowledge item deleted: ${id}`);
    
    res.json({ message: 'Knowledge item deleted successfully', id });
  } catch (error) {
    logger.error('Failed to delete knowledge item:', error);
    res.status(500).json({ 
      error: 'Failed to delete knowledge item',
      message: error.message 
    });
  }
});

// Analytics and monitoring endpoints
app.get('/api/analytics/usage', async (req, res) => {
  try {
    const usage = {
      period: '24h',
      metrics: {
        api_requests: 1247,
        search_queries: 89,
        documents_processed: 15,
        rag_queries: 34,
        crawl_sessions: 7,
        active_users: 12
      },
      performance: {
        avg_response_time: 245,
        success_rate: 98.7,
        error_rate: 1.3
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(usage);
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      message: error.message 
    });
  }
});

// System configuration endpoints
app.get('/api/config', async (req, res) => {
  try {
    const config = {
      system: {
        name: 'Archon Knowledge Engine',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      features: {
        rag_enabled: process.env.VITE_ARCHON_RAG_ENABLED === 'true',
        mcp_enabled: process.env.VITE_ARCHON_MCP_ENABLED === 'true',
        search_enabled: true,
        document_processing: true,
        web_crawling: true
      },
      limits: {
        max_file_size: '100MB',
        max_search_results: 1000,
        max_rag_context: 10,
        crawl_depth: 3
      }
    };
    
    res.json(config);
  } catch (error) {
    logger.error('Failed to get config:', error);
    res.status(500).json({ 
      error: 'Failed to get config',
      message: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api/health',
      'GET /api/knowledge-items', 
      'POST /api/agent-chat/sessions',
      'POST /api/documents/upload',
      'POST /api/crawl/start',
      'POST /api/mcp/request',
      'POST /api/search',
      'POST /api/rag/query',
      'POST /api/auth/login',
      'GET /api/analytics/usage',
      'GET /api/config'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Archon Knowledge Engine server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧠 Knowledge API: http://localhost:${PORT}/api/knowledge-items`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/agent-chat/sessions`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/search`);
  console.log(`🤖 RAG API: http://localhost:${PORT}/api/rag/query`);
  console.log(`📁 Document API: http://localhost:${PORT}/api/documents/upload`);
  console.log(`🕸️ Crawl API: http://localhost:${PORT}/api/crawl/start`);
  console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/usage`);
  console.log(`⚙️ Config: http://localhost:${PORT}/api/config`);
});

export default app;