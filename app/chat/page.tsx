'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Welcome to Super Console! I\'m your AI assistant powered by xAI Grok. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + '-loading',
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
      loading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Direct xAI API call - based on working recursion chat implementation
      const XAI_API_KEY = 'xai-pzXhXnX2YteViTp9omT0PE06hv1xn2PDhwQcUMtIfKJmrPRgkXoljhbhSswDbWW3t5NvXZxJDhVQwrAQ';
      const XAI_BASE_URL = 'https://api.x.ai/v1';

      console.log('🤖 [SuperConsole] Calling xAI API directly:', input.substring(0, 50) + '...');

      const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-0709',
          messages: [
            {
              role: 'system',
              content: 'You are Grok, a helpful AI assistant integrated into Super Console. Provide concise, accurate, and helpful responses. Be friendly and conversational while maintaining a professional tone suitable for a development platform.'
            },
            {
              role: 'user',
              content: input.trim()
            }
          ],
          stream: false,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [SuperConsole] xAI API response received successfully');
      
      // Remove loading message and add response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.loading);
        
        let responseContent = 'I encountered an issue processing your request. Please try again.';
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
          responseContent = data.choices[0].message.content.trim();
        } else {
          console.error('❌ [SuperConsole] Unexpected xAI API response format:', data);
          responseContent = 'The AI service returned an unexpected response format. Please try again.';
        }

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        };
        
        return [...filtered, assistantMessage];
      });
    } catch (error) {
      console.error('❌ [SuperConsole] xAI API call failed:', error);
      // Remove loading message and show error
      setMessages(prev => {
        const filtered = prev.filter(m => !m.loading);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ I\'m having trouble connecting to the AI service right now. This could be due to network issues or API limitations. Please try again in a moment.',
          timestamp: new Date(),
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-lg p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🤖</div>
              <div>
                <h1 className="text-xl font-bold text-white">Super Console</h1>
                <p className="text-xs text-white/60">Powered by xAI</p>
              </div>
            </div>
            <div className="text-green-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.loading
                    ? 'bg-gray-700 text-gray-300 animate-pulse'
                    : 'bg-white/10 text-white backdrop-blur-lg'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-black/30 backdrop-blur-lg p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Super Console anything..."
              className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 resize-none backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
          <div className="text-xs text-white/40 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}