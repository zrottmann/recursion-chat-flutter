// Claude Code Remote Chat Function
module.exports = async ({ req, res, log, error }) => {
  try {
    const method = req.method;
    const path = req.path || '/';
    const body = req.body || {};
    
    log(`Chat Request: ${method} ${path}`);
    
    // API Routes
    if (path === '/api/chat' && method === 'POST') {
      const { message, sessionId } = body;
      log(`Chat message: ${message}`);
      
      // Simulate Claude Code response
      const responses = [
        `I'll help you with "${message}". Let me process this command...`,
        `Executing: ${message}\n\nProcessing your request now.`,
        `Command completed successfully! Here's what I found for "${message}".`,
        `I've analyzed your request: "${message}". Would you like me to explain the results?`,
        `Task completed: ${message}\n\nAnything else you'd like me to help with?`
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      return res.json({
        success: true,
        response: response,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'demo-session'
      });
    }
    
    if (path === '/api/status') {
      return res.json({
        status: 'online',
        service: 'Claude Code Remote Chat',
        features: ['Real-time chat', 'Mobile optimized', 'Command injection ready'],
        timestamp: new Date().toISOString()
      });
    }
    
    // Main mobile chat interface
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Claude Code Remote Chat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            height: 100vh;
            overflow: hidden;
        }
        
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 100%;
        }
        
        .chat-header {
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            background: #4CAF50;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .chat-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #4CAF50;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: linear-gradient(180deg, #0a0a0a 0%, #151515 100%);
        }
        
        .message {
            margin-bottom: 20px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message.user {
            flex-direction: row-reverse;
        }
        
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
            flex-shrink: 0;
        }
        
        .user .message-avatar {
            background: linear-gradient(135deg, #4CAF50, #45a049);
        }
        
        .assistant .message-avatar {
            background: linear-gradient(135deg, #2196F3, #1976D2);
        }
        
        .message-content {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            position: relative;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .user .message-content {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border-bottom-right-radius: 4px;
        }
        
        .assistant .message-content {
            background: #1a1a1a;
            border: 1px solid #333;
            border-bottom-left-radius: 4px;
        }
        
        .message-time {
            font-size: 0.75em;
            opacity: 0.7;
            margin-top: 4px;
        }
        
        .chat-input {
            background: #1a1a1a;
            border-top: 1px solid #333;
            padding: 20px;
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }
        
        .input-container {
            flex: 1;
            position: relative;
        }
        
        .message-input {
            width: 100%;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 25px;
            padding: 12px 20px;
            color: #fff;
            font-size: 16px;
            resize: none;
            max-height: 120px;
            min-height: 44px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .message-input:focus {
            border-color: #4CAF50;
        }
        
        .send-button {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .send-button:hover {
            transform: scale(1.05);
        }
        
        .send-button:disabled {
            background: #333;
            cursor: not-allowed;
            transform: none;
        }
        
        .typing-indicator {
            display: none;
            padding: 10px 20px;
            color: #888;
            font-style: italic;
        }
        
        .typing-dots {
            display: inline-block;
            animation: typing 1.5s infinite;
        }
        
        .typing-dots:after {
            content: '...';
            animation: dots 1.5s infinite;
        }
        
        @keyframes typing {
            0%, 60%, 100% { opacity: 0; }
            30% { opacity: 1; }
        }
        
        @keyframes dots {
            0%, 20% { content: ''; }
            40% { content: '.'; }
            60% { content: '..'; }
            80%, 100% { content: '...'; }
        }
        
        .quick-actions {
            display: flex;
            gap: 8px;
            padding: 0 20px 10px;
            overflow-x: auto;
        }
        
        .quick-action {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 15px;
            padding: 8px 15px;
            color: #ccc;
            cursor: pointer;
            white-space: nowrap;
            font-size: 0.85em;
            transition: all 0.2s;
        }
        
        .quick-action:hover {
            background: #3a3a3a;
            border-color: #4CAF50;
            color: #4CAF50;
        }
        
        .welcome-message {
            text-align: center;
            padding: 40px 20px;
            color: #888;
        }
        
        .welcome-title {
            font-size: 1.5em;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            .chat-header {
                padding: 12px 15px;
            }
            
            .chat-title {
                font-size: 1.1em;
            }
            
            .message-content {
                max-width: 85%;
                font-size: 0.95em;
            }
            
            .chat-input {
                padding: 15px;
            }
            
            .message-input {
                font-size: 16px; /* Prevent zoom on iOS */
            }
        }
        
        @media (max-width: 480px) {
            .message-content {
                max-width: 90%;
            }
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <div>
                <div class="chat-title">🤖 Claude Code Remote</div>
                <div class="status-indicator">
                    <div class="status-dot"></div>
                    <span style="font-size: 0.85em; color: #888;">Connected</span>
                </div>
            </div>
            <div style="font-size: 0.8em; color: #666;">
                💬 Mobile Chat
            </div>
        </div>
        
        <div class="chat-messages" id="chatMessages">
            <div class="welcome-message">
                <div class="welcome-title">👋 Welcome to Claude Code Remote</div>
                <p>Send commands to control Claude Code remotely from your mobile device.</p>
                <p style="margin-top: 10px; font-size: 0.9em;">Try asking me to help with coding tasks, file operations, or project management!</p>
            </div>
        </div>
        
        <div class="quick-actions">
            <div class="quick-action" onclick="sendQuickMessage('help')">❓ Help</div>
            <div class="quick-action" onclick="sendQuickMessage('status')">📊 Status</div>
            <div class="quick-action" onclick="sendQuickMessage('list files')">📁 List Files</div>
            <div class="quick-action" onclick="sendQuickMessage('git status')">🔄 Git Status</div>
            <div class="quick-action" onclick="sendQuickMessage('run tests')">🧪 Run Tests</div>
        </div>
        
        <div class="typing-indicator" id="typingIndicator">
            Claude is thinking<span class="typing-dots"></span>
        </div>
        
        <div class="chat-input">
            <div class="input-container">
                <textarea 
                    class="message-input" 
                    id="messageInput" 
                    placeholder="Type your command or question..."
                    rows="1"></textarea>
            </div>
            <button class="send-button" id="sendButton" onclick="sendMessage()">
                ➤
            </button>
        </div>
    </div>

    <script>
        let sessionId = 'session-' + Date.now();
        
        // Auto-resize textarea
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Send on Enter (but allow Shift+Enter for new lines)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        function addMessage(content, type = 'user', time = new Date()) {
            const messagesContainer = document.getElementById('chatMessages');
            const welcomeMessage = messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) welcomeMessage.remove();
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            const avatar = type === 'user' ? '👤' : '🤖';
            const timeStr = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageDiv.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div>
                    <div class="message-content">${content}</div>
                    <div class="message-time">${timeStr}</div>
                </div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function showTyping() {
            document.getElementById('typingIndicator').style.display = 'block';
            const messagesContainer = document.getElementById('chatMessages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function hideTyping() {
            document.getElementById('typingIndicator').style.display = 'none';
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            
            // Clear input and disable button
            input.value = '';
            input.style.height = 'auto';
            sendButton.disabled = true;
            
            // Show typing indicator
            showTyping();
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        sessionId: sessionId
                    })
                });
                
                const data = await response.json();
                
                // Simulate thinking delay
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                
                hideTyping();
                
                if (data.success) {
                    addMessage(data.response, 'assistant');
                } else {
                    addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
                }
            } catch (error) {
                hideTyping();
                addMessage('Connection error. Please check your internet and try again.', 'assistant');
            }
            
            sendButton.disabled = false;
            input.focus();
        }
        
        function sendQuickMessage(message) {
            document.getElementById('messageInput').value = message;
            sendMessage();
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('messageInput').focus();
        });
    </script>
</body>
</html>`;

    return res.send(html, 200, { 'Content-Type': 'text/html' });
    
  } catch (err) {
    error('Chat function error: ' + err.message);
    return res.json({ 
      error: 'Internal server error',
      message: err.message,
      service: 'Claude Code Remote Chat'
    }, 500);
  }
};