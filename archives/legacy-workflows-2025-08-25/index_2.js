const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Initialize Appwrite SDK
const client = new sdk.Client();
const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Claude Code Remote Configuration
const CLAUDE_CONFIG = {
  endpoint: process.env.CLAUDE_CODE_ENDPOINT || 'http://localhost:3000',
  apiKey: process.env.CLAUDE_CODE_API_KEY,
  tmuxSession: process.env.TMUX_SESSION || 'claude-code',
  workingDirectory: process.env.WORKING_DIRECTORY || '/workspace'
};

// AI Configuration (Grok/OpenAI)
const AI_CONFIG = {
  endpoint: process.env.AI_API_ENDPOINT || 'https://api.x.ai/v1/chat/completions',
  key: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || 'grok-beta'
};

module.exports = async function (req, res) {
  const { action, command, userId, sessionId, options = {} } = req.payload || {};

  try {
    switch (action) {
      case 'executeCommand':
        return handleExecuteCommand(command, userId, sessionId, options, res);
      
      case 'getStatus':
        return handleGetStatus(userId, res);
      
      case 'listFiles':
        return handleListFiles(options.path, userId, res);
      
      case 'readFile':
        return handleReadFile(options.filePath, userId, res);
      
      case 'writeFile':
        return handleWriteFile(options.filePath, options.content, userId, res);
      
      case 'gitOperation':
        return handleGitOperation(options.operation, options.params, userId, res);
      
      case 'runTests':
        return handleRunTests(options.testType, userId, res);
      
      case 'buildProject':
        return handleBuildProject(options.target, userId, res);
      
      case 'deployApp':
        return handleDeployApp(options.environment, userId, res);
      
      case 'aiAssistant':
        return handleAIAssistant(options.prompt, options.context, userId, res);
      
      case 'getHistory':
        return handleGetHistory(userId, sessionId, res);
      
      case 'uploadFile':
        return handleUploadFile(options.fileId, options.targetPath, userId, res);
      
      default:
        return res.json({
          success: false,
          error: 'Invalid action specified',
          availableActions: [
            'executeCommand', 'getStatus', 'listFiles', 'readFile', 'writeFile',
            'gitOperation', 'runTests', 'buildProject', 'deployApp', 'aiAssistant',
            'getHistory', 'uploadFile'
          ]
        }, 400);
    }
  } catch (error) {
    console.error('Claude Code Bridge Error:', error);
    return res.json({
      success: false,
      error: error.message,
      type: 'BRIDGE_ERROR'
    }, 500);
  }
};

async function handleExecuteCommand(command, userId, sessionId, options, res) {
  try {
    // Log command execution
    await logActivity(userId, sessionId, 'command', command);
    
    // Sanitize and validate command
    const sanitizedCommand = sanitizeCommand(command);
    if (!sanitizedCommand) {
      return res.json({
        success: false,
        error: 'Command contains unsafe characters or operations',
        type: 'SECURITY_ERROR'
      }, 400);
    }
    
    // Execute command based on available method
    let result;
    if (CLAUDE_CONFIG.endpoint && CLAUDE_CONFIG.apiKey) {
      // Use Claude Code Remote API
      result = await executeViaRemoteAPI(sanitizedCommand, options);
    } else if (process.env.ALLOW_DIRECT_EXECUTION === 'true') {
      // Direct execution (development only)
      result = await executeDirectly(sanitizedCommand, options);
    } else {
      // Simulation mode
      result = await simulateCommand(sanitizedCommand, options);
    }
    
    return res.json({
      success: true,
      result: result,
      command: sanitizedCommand,
      executedAt: new Date().toISOString(),
      method: getExecutionMethod()
    });
    
  } catch (error) {
    return res.json({
      success: false,
      error: `Command execution failed: ${error.message}`,
      type: 'EXECUTION_ERROR'
    }, 500);
  }
}

async function executeViaRemoteAPI(command, options) {
  try {
    const response = await fetch(`${CLAUDE_CONFIG.endpoint}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_CONFIG.apiKey}`,
        'X-Session': CLAUDE_CONFIG.tmuxSession
      },
      body: JSON.stringify({
        command: command,
        workingDirectory: options.workingDirectory || CLAUDE_CONFIG.workingDirectory,
        timeout: options.timeout || 30000,
        captureOutput: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Remote API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to execute via remote API: ${error.message}`);
  }
}

async function executeDirectly(command, options) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Direct execution not allowed in production');
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: options.workingDirectory || CLAUDE_CONFIG.workingDirectory,
      timeout: options.timeout || 30000,
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    
    return {
      output: stdout,
      error: stderr,
      success: !stderr || stderr.trim() === '',
      executionTime: Date.now()
    };
  } catch (error) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
      success: false,
      code: error.code
    };
  }
}

async function simulateCommand(command, options) {
  // Simulate command execution for demo/development
  const responses = {
    'ls': 'src/\npackage.json\nREADME.md\n.git/',
    'pwd': '/workspace/project',
    'git status': 'On branch main\nnothing to commit, working tree clean',
    'npm test': '✓ All tests passed (12/12)',
    'npm run build': '✓ Build completed successfully',
    'git log --oneline -5': 'abc123f Add new feature\ndef456a Fix bug in auth\n789ghij Update dependencies',
    'whoami': 'claude-user',
    'date': new Date().toLocaleString()
  };
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
  
  const output = responses[command] || 
    responses[command.split(' ')[0]] || 
    `Simulated output for: ${command}\n✓ Command executed successfully`;
  
  return {
    output: output,
    error: '',
    success: true,
    simulated: true,
    executedAt: new Date().toISOString()
  };
}

function sanitizeCommand(command) {
  if (!command || typeof command !== 'string') {
    return null;
  }
  
  // Remove potentially dangerous characters and commands
  const dangerousPatterns = [
    /[;&|`$(){}[\]]/g,  // Shell metacharacters
    /\brm\s+-rf\b/gi,   // Dangerous rm commands
    /\bsudo\b/gi,       // Sudo commands
    /\bchmod\s+777\b/gi, // Dangerous permissions
    />/g,               // Redirections
    /</g                // Input redirections
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return null;
    }
  }
  
  // Allow only specific safe commands
  const allowedCommands = [
    'ls', 'pwd', 'whoami', 'date', 'cat', 'head', 'tail',
    'git', 'npm', 'node', 'python', 'pip', 'yarn',
    'cd', 'mkdir', 'touch', 'mv', 'cp',
    'grep', 'find', 'wc', 'sort', 'uniq',
    'ps', 'top', 'df', 'du', 'free'
  ];
  
  const commandParts = command.trim().split(' ');
  const baseCommand = commandParts[0];
  
  if (!allowedCommands.includes(baseCommand)) {
    return null;
  }
  
  return command.trim();
}

function getExecutionMethod() {
  if (CLAUDE_CONFIG.endpoint && CLAUDE_CONFIG.apiKey) {
    return 'remote_api';
  } else if (process.env.ALLOW_DIRECT_EXECUTION === 'true') {
    return 'direct';
  } else {
    return 'simulation';
  }
}

async function handleGetStatus(userId, res) {
  try {
    const status = {
      claudeCodeBridge: 'active',
      connection: getExecutionMethod(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      features: {
        remoteExecution: !!CLAUDE_CONFIG.endpoint,
        directExecution: process.env.ALLOW_DIRECT_EXECUTION === 'true',
        aiAssistant: !!AI_CONFIG.key,
        fileOperations: true,
        gitIntegration: true,
        buildSystem: true
      }
    };
    
    // Test connectivity if remote endpoint is configured
    if (CLAUDE_CONFIG.endpoint) {
      try {
        const healthResponse = await fetch(`${CLAUDE_CONFIG.endpoint}/health`, {
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${CLAUDE_CONFIG.apiKey}`
          }
        });
        status.remoteHealth = healthResponse.ok ? 'healthy' : 'unhealthy';
      } catch (error) {
        status.remoteHealth = 'unreachable';
        status.remoteError = error.message;
      }
    }
    
    return res.json({
      success: true,
      status: status
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Status check failed: ${error.message}`
    }, 500);
  }
}

async function handleListFiles(path, userId, res) {
  try {
    const targetPath = path || '.';
    const command = `ls -la "${targetPath}"`;
    
    const result = await (CLAUDE_CONFIG.endpoint ? 
      executeViaRemoteAPI(command, {}) : 
      simulateCommand(command, {}));
    
    return res.json({
      success: true,
      path: targetPath,
      listing: result.output,
      files: parseFileList(result.output)
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `File listing failed: ${error.message}`
    }, 500);
  }
}

async function handleAIAssistant(prompt, context, userId, res) {
  try {
    if (!AI_CONFIG.key) {
      return res.json({
        success: false,
        error: 'AI assistant not configured'
      }, 400);
    }
    
    const messages = [
      {
        role: 'system',
        content: 'You are Claude Code UI Assistant, helping developers with coding tasks, file operations, git commands, testing, and deployment. Provide clear, actionable responses.'
      }
    ];
    
    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${context}`
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });
    
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    return res.json({
      success: true,
      response: aiResponse,
      model: AI_CONFIG.model,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.json({
      success: false,
      error: `AI assistant failed: ${error.message}`
    }, 500);
  }
}

async function handleGitOperation(operation, params, userId, res) {
  const gitCommands = {
    'status': 'git status',
    'add': `git add ${params.files || '.'}`,
    'commit': `git commit -m "${params.message || 'Auto commit'}"`,
    'push': 'git push',
    'pull': 'git pull',
    'branch': 'git branch',
    'log': `git log --oneline -${params.limit || 10}`
  };
  
  const command = gitCommands[operation];
  if (!command) {
    return res.json({
      success: false,
      error: `Unknown git operation: ${operation}`,
      availableOperations: Object.keys(gitCommands)
    }, 400);
  }
  
  try {
    const result = await (CLAUDE_CONFIG.endpoint ? 
      executeViaRemoteAPI(command, {}) : 
      simulateCommand(command, {}));
    
    return res.json({
      success: true,
      operation: operation,
      result: result
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Git operation failed: ${error.message}`
    }, 500);
  }
}

function parseFileList(output) {
  if (!output) return [];
  
  return output.split('\n')
    .filter(line => line.trim() && !line.startsWith('total'))
    .map(line => {
      const parts = line.split(/\s+/);
      if (parts.length >= 9) {
        return {
          permissions: parts[0],
          size: parts[4],
          date: `${parts[5]} ${parts[6]} ${parts[7]}`,
          name: parts.slice(8).join(' ')
        };
      }
      return { name: line.trim() };
    });
}

async function logActivity(userId, sessionId, type, data) {
  try {
    await databases.createDocument(
      process.env.DB_ID,
      'activities',
      sdk.ID.unique(),
      {
        userId: userId,
        sessionId: sessionId,
        type: type,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Additional handlers for runTests, buildProject, deployApp would go here
// Following the same pattern as above functions