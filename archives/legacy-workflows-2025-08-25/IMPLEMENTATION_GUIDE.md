# AI Orchestrator Implementation Guide

## Quick Start Implementation

### Step 1: Environment Setup
```bash
# Clone and setup
cd console
npm install

# Create .env.local file
GROK_API_KEY=xai-[your-key]
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68a4e3da0022f3e129d0
APPWRITE_API_KEY=[standard-key]
APPWRITE_DEV_KEY=[dev-key-for-db-setup]
GITHUB_TOKEN=ghp_[your-token]
```

### Step 2: Core API Routes

#### `/app/api/orchestrator/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Functions, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const functions = new Functions(client);

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Create task in database
  const task = await databases.createDocument(
    'ai_orchestrator',
    'tasks',
    ID.unique(),
    {
      userId: body.userId,
      projectName: body.project.name,
      requirements: JSON.stringify(body.project.requirements),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  );
  
  // Send to Grok for analysis
  const grokAnalysis = await analyzeWithGrok(body.project);
  
  // Delegate to Claude agents
  const assignments = await delegateToClaudeAgents(grokAnalysis);
  
  return NextResponse.json({ 
    taskId: task.$id,
    assignments 
  });
}

async function analyzeWithGrok(project: any) {
  const response = await fetch('https://api.x.ai/v1/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-beta',
      prompt: `As a lead developer, analyze this project and create a development plan:
        Name: ${project.name}
        Description: ${project.description}
        Requirements: ${project.requirements.join(', ')}
        
        Break this down into specific development tasks that can be assigned to junior developers.
        Return as JSON with structure: { tasks: [{ id, title, type, description, priority }] }`,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  return response.json();
}

async function delegateToClaudeAgents(analysis: any) {
  // This would integrate with Claude Code API
  // For now, return mock assignments
  return analysis.tasks.map((task: any) => ({
    taskId: task.id,
    agentId: `claude-${Math.random().toString(36).substr(2, 9)}`,
    specialization: task.type,
    estimatedTime: Math.floor(Math.random() * 60) + 10
  }));
}
```

### Step 3: WebSocket Progress Monitoring

#### `/app/api/progress/route.ts`
```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';

let io: Server;

export function initWebSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe-task', (taskId: string) => {
      socket.join(`task-${taskId}`);
      sendProgressUpdate(taskId, socket.id, {
        type: 'status',
        message: 'Connected to task progress'
      });
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export function sendProgressUpdate(taskId: string, socketId: string, update: any) {
  io.to(`task-${taskId}`).emit('progress', update);
}
```

### Step 4: Frontend Components

#### `/app/components/TaskInput.tsx`
```typescript
'use client';

import { useState } from 'react';

export default function TaskInput() {
  const [project, setProject] = useState({
    name: '',
    description: '',
    type: 'web',
    requirements: ['']
  });
  
  const submitTask = async () => {
    const response = await fetch('/api/orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project })
    });
    
    const { taskId } = await response.json();
    
    // Connect to WebSocket for progress
    const socket = new WebSocket(`ws://localhost:3000/api/progress`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ 
        type: 'subscribe-task', 
        taskId 
      }));
    };
    
    socket.onmessage = (event) => {
      const update = JSON.parse(event.data);
      console.log('Progress:', update);
      // Update UI with progress
    };
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
      
      <input
        type="text"
        placeholder="Project Name"
        className="w-full p-2 border rounded mb-4"
        value={project.name}
        onChange={(e) => setProject({...project, name: e.target.value})}
      />
      
      <textarea
        placeholder="Project Description"
        className="w-full p-2 border rounded mb-4 h-32"
        value={project.description}
        onChange={(e) => setProject({...project, description: e.target.value})}
      />
      
      <div className="mb-4">
        <label className="block mb-2">Project Type:</label>
        <select 
          className="w-full p-2 border rounded"
          value={project.type}
          onChange={(e) => setProject({...project, type: e.target.value})}
        >
          <option value="web">Web Application</option>
          <option value="mobile">Mobile App</option>
          <option value="api">API Service</option>
          <option value="fullstack">Full Stack</option>
        </select>
      </div>
      
      <button
        onClick={submitTask}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Start AI Development
      </button>
    </div>
  );
}
```

### Step 5: GitHub Integration

#### `/app/services/github.ts`
```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function createRepository(name: string, description: string) {
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: false,
    auto_init: true
  });
  
  return data;
}

export async function commitFiles(repo: string, files: any[]) {
  const owner = 'zrottmann'; // or get from auth
  
  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(file => 
      octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      })
    )
  );
  
  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: files.map((file, i) => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobs[i].data.sha
    }))
  });
  
  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'AI-generated code',
    tree: tree.sha,
    parents: []
  });
  
  // Update reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: commit.sha
  });
  
  return commit;
}
```

### Step 6: Appwrite Deployment

#### `/app/services/appwrite-deploy.ts`
```typescript
import { Client, Storage, Functions, Databases, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_DEV_KEY!); // Dev key for infra setup

export async function setupDatabase(schema: any) {
  const databases = new Databases(client);
  
  // Create database
  const db = await databases.create(
    ID.unique(),
    schema.name
  );
  
  // Create collections
  for (const collection of schema.collections) {
    await databases.createCollection(
      db.$id,
      ID.unique(),
      collection.name,
      collection.permissions || [],
      collection.documentSecurity || false
    );
    
    // Add attributes
    for (const attr of collection.attributes) {
      await databases.createStringAttribute(
        db.$id,
        collection.$id,
        attr.key,
        attr.size,
        attr.required,
        attr.default,
        attr.array
      );
    }
  }
  
  return db;
}

export async function deployFunction(code: string, name: string) {
  const functions = new Functions(client);
  
  // Create function
  const func = await functions.create(
    ID.unique(),
    name,
    'node-18.0',
    ['any'],
    [],
    '',
    15,
    ''
  );
  
  // Deploy code
  const deployment = await functions.createDeployment(
    func.$id,
    Buffer.from(code),
    true,
    'index.js',
    ''
  );
  
  return deployment;
}

export async function deploySite(siteId: string, files: any[]) {
  // Create tar.gz of files
  const tar = require('tar');
  const fs = require('fs');
  
  await tar.c({
    gzip: true,
    file: 'site.tar.gz'
  }, files.map(f => f.path));
  
  // Deploy to Appwrite Sites
  const formData = new FormData();
  formData.append('code', fs.createReadStream('site.tar.gz'));
  
  const response = await fetch(
    `${process.env.APPWRITE_ENDPOINT}/sites/${siteId}/deployments`,
    {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID!,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY!
      },
      body: formData
    }
  );
  
  return response.json();
}
```

### Step 7: Main Orchestration Flow

#### `/app/services/orchestrator.ts`
```typescript
export class AIOrchestrator {
  private taskQueue: Map<string, Task> = new Map();
  
  async processTask(taskId: string) {
    const task = this.taskQueue.get(taskId);
    if (!task) return;
    
    try {
      // 1. Grok analyzes requirements
      this.updateProgress(taskId, 'Analyzing requirements with Grok...');
      const analysis = await this.grokAnalysis(task);
      
      // 2. Delegate to Claude agents
      this.updateProgress(taskId, 'Delegating to Claude Code agents...');
      const codeArtifacts = await this.claudeExecution(analysis);
      
      // 3. Grok reviews code
      this.updateProgress(taskId, 'Reviewing generated code...');
      const review = await this.grokReview(codeArtifacts);
      
      // 4. Create GitHub repository
      this.updateProgress(taskId, 'Creating GitHub repository...');
      const repo = await this.createGitHubRepo(task);
      
      // 5. Commit code
      this.updateProgress(taskId, 'Committing code to GitHub...');
      await this.commitToGitHub(repo, codeArtifacts);
      
      // 6. Setup Appwrite infrastructure
      this.updateProgress(taskId, 'Setting up Appwrite infrastructure...');
      await this.setupAppwrite(task);
      
      // 7. Deploy application
      this.updateProgress(taskId, 'Deploying application...');
      const deployment = await this.deployApp(task, codeArtifacts);
      
      // 8. Complete task
      this.updateProgress(taskId, 'Task completed!', {
        repo: repo.html_url,
        deployment: deployment.url
      });
      
    } catch (error) {
      this.handleError(taskId, error);
    }
  }
  
  private updateProgress(taskId: string, message: string, data?: any) {
    // Send WebSocket update
    sendProgressUpdate(taskId, '', {
      type: 'progress',
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Deployment Instructions

### 1. Deploy to Appwrite Sites
```bash
# Build the application
npm run build

# Deploy using the existing script
node deploy-super-fixed.js
```

### 2. Configure GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Appwrite
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run deploy:super
```

### 3. Setup Appwrite Functions
```javascript
// functions/orchestrator/index.js
module.exports = async (req, res) => {
  const { taskId, action } = req.payload;
  
  switch (action) {
    case 'process':
      await orchestrator.processTask(taskId);
      break;
    case 'status':
      const status = await getTaskStatus(taskId);
      res.json(status);
      break;
  }
};
```

## Testing

### Test Grok Integration
```bash
curl -X POST http://localhost:3000/api/test/grok \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a React component for a todo list"}'
```

### Test Full Flow
```bash
curl -X POST http://localhost:3000/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "name": "test-app",
      "description": "A simple todo app",
      "type": "web",
      "requirements": ["User authentication", "CRUD operations", "Responsive design"]
    }
  }'
```

## Production Checklist

- [ ] Secure all API keys in environment variables
- [ ] Enable HTTPS for all endpoints
- [ ] Implement rate limiting
- [ ] Add comprehensive error handling
- [ ] Setup monitoring and logging
- [ ] Configure backup strategies
- [ ] Implement user authentication
- [ ] Add input validation
- [ ] Setup CI/CD pipeline
- [ ] Document API endpoints

## Next Steps

1. **Immediate**: Setup environment variables and test basic API connectivity
2. **Day 1**: Implement core orchestration logic and Grok integration
3. **Day 2**: Add Claude Code agent pool management
4. **Day 3**: Complete GitHub integration and automated commits
5. **Day 4**: Implement Appwrite deployment automation
6. **Day 5**: Add UI components and WebSocket monitoring
7. **Week 2**: Testing, optimization, and production deployment