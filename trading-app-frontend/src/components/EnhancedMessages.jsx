import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Send, MessageCircle, Users, ArrowLeft, Search, Plus, Settings, Trash2 } from 'lucide-react';
import { account, databases, client, ID, Query } from '../lib/appwrite';
import { smartDatabases } from '../utils/fixDatabaseSchema';
import './Messages.css';

const DATABASE_ID = 'trading_post_db';
const COLLECTIONS = {
  messages: 'messages',
  users: 'users'
};

/**
 * Enhanced Messages Component with Real-Time Chat
 * Based on Recursion Chat implementation patterns
 */
const EnhancedMessages = () => {
  const { userId: targetUserId } = useParams();
  const navigate = useNavigate();
  
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showConversationList, setShowConversationList] = useState(true);
  
  // Real-time subscriptions
  const [subscriptions, setSubscriptions] = useState([]);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Debug key listener (backtick key)
  useEffect(() => {
    const handleDebugKey = (e) => {
      if (e.key === '`') {
        console.log('🔧 [MESSAGES-DEBUG] ========== STATE DUMP ==========');
        console.log('Current User:', currentUser);
        console.log('Conversations:', conversations);
        console.log('Selected Conversation:', selectedConversation);
        console.log('Messages Count:', messages.length);
        console.log('Last 3 Messages:', messages.slice(-3));
        console.log('Subscriptions Active:', subscriptions.length);
        console.log('Target User ID:', targetUserId);
        console.log('🔧 ==========================================');
      }
    };
    
    document.addEventListener('keydown', handleDebugKey);
    return () => document.removeEventListener('keydown', handleDebugKey);
  }, [currentUser, conversations, selectedConversation, messages, subscriptions, targetUserId]);
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Initialize user and fetch conversations
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const user = await account.get();
        setCurrentUser(user);
        console.log('✅ User authenticated:', user.email);
        
        // Fetch or create conversations
        await fetchConversations(user.$id);
        
        // If we have a target user ID from params, select/create that conversation
        if (targetUserId) {
          await selectOrCreateConversation(targetUserId, user.$id);
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, [targetUserId]);
  
  // Fetch all conversations
  const fetchConversations = async (userId) => {
    try {
      // Try to get conversations where user is participant
      const queries = [
        Query.orderDesc('$updatedAt'),
        Query.limit(50)
      ];
      
      // First try: Get direct messages as conversations
      const response = await smartDatabases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.messages,
        queries
      );
      
      // Group messages by conversation participants
      const conversationMap = new Map();
      
      for (const msg of response.documents) {
        // Determine the other user
        const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        if (!otherUserId || otherUserId === userId) continue;
        
        const convKey = [userId, otherUserId].sort().join('-');
        
        if (!conversationMap.has(convKey)) {
          // Get other user details
          let otherUser = { id: otherUserId, name: 'Unknown User', email: '' };
          try {
            const userDoc = await smartDatabases.getDocument(
              DATABASE_ID,
              COLLECTIONS.users,
              otherUserId
            );
            otherUser = {
              id: userDoc.$id,
              name: userDoc.name || userDoc.username || userDoc.email?.split('@')[0] || 'User',
              email: userDoc.email || '',
              avatar: userDoc.avatar || null
            };
          } catch (err) {
            console.warn('Could not load user:', otherUserId);
          }
          
          conversationMap.set(convKey, {
            id: convKey,
            other_user: otherUser,
            last_message: msg.content,
            last_message_time: msg.$createdAt,
            unread_count: 0
          });
        } else {
          // Update last message if this is newer
          const conv = conversationMap.get(convKey);
          if (new Date(msg.$createdAt) > new Date(conv.last_message_time)) {
            conv.last_message = msg.content;
            conv.last_message_time = msg.$createdAt;
          }
        }
      }
      
      const convArray = Array.from(conversationMap.values());
      setConversations(convArray);
      console.log('✅ Loaded', convArray.length, 'conversations');
      
      return convArray;
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error);
      setConversations([]);
      return [];
    }
  };
  
  // Select or create conversation with a user
  const selectOrCreateConversation = async (otherUserId, currentUserId) => {
    try {
      const convKey = [currentUserId, otherUserId].sort().join('-');
      
      // Check if conversation exists
      let conversation = conversations.find(c => c.id === convKey);
      
      if (!conversation) {
        // Get other user details
        let otherUser = { id: otherUserId, name: 'Unknown User', email: '' };
        try {
          const userDoc = await smartDatabases.getDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            otherUserId
          );
          otherUser = {
            id: userDoc.$id,
            name: userDoc.name || userDoc.username || userDoc.email?.split('@')[0] || 'User',
            email: userDoc.email || '',
            avatar: userDoc.avatar || null
          };
        } catch (err) {
          console.warn('Could not load user:', otherUserId);
        }
        
        // Create new conversation object
        conversation = {
          id: convKey,
          other_user: otherUser,
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };
        
        setConversations(prev => [conversation, ...prev]);
      }
      
      setSelectedConversation(conversation);
      
      // Load messages for this conversation
      await fetchMessages(currentUserId, otherUserId);
      
      // Setup real-time subscription
      setupRealtimeSubscription(currentUserId, otherUserId);
      
      // Hide conversation list on mobile when conversation selected
      if (isMobile) {
        setShowConversationList(false);
      }
      
    } catch (error) {
      console.error('❌ Failed to select/create conversation:', error);
    }
  };
  
  // Fetch messages between two users
  const fetchMessages = async (userId1, userId2) => {
    try {
      // Get messages where either user is sender/recipient
      const queries = [
        Query.orderAsc('$createdAt'),
        Query.limit(100)
      ];
      
      const response = await smartDatabases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.messages,
        queries
      );
      
      // Filter messages between these two users
      const filteredMessages = response.documents.filter(msg => {
        return (msg.sender_id === userId1 && msg.recipient_id === userId2) ||
               (msg.sender_id === userId2 && msg.recipient_id === userId1);
      });
      
      const formattedMessages = filteredMessages.map(msg => ({
        id: msg.$id,
        content: msg.content || msg.message || '',
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        created_at: msg.$createdAt,
        is_mine: msg.sender_id === userId1
      }));
      
      setMessages(formattedMessages);
      console.log('✅ Loaded', formattedMessages.length, 'messages');
      
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      setMessages([]);
    }
  };
  
  // Setup real-time subscription for messages
  const setupRealtimeSubscription = (userId1, userId2) => {
    try {
      // Unsubscribe from previous subscriptions
      subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      
      // Subscribe to messages collection
      const channels = [
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.messages}.documents`
      ];
      
      const unsubscribe = client.subscribe(channels, (response) => {
        console.log('📨 Real-time event:', response);
        
        if (response.events?.includes('databases.*.collections.*.documents.*.create')) {
          const message = response.payload;
          
          // Check if message is part of this conversation
          if ((message.sender_id === userId1 && message.recipient_id === userId2) ||
              (message.sender_id === userId2 && message.recipient_id === userId1)) {
            
            const formattedMessage = {
              id: message.$id,
              content: message.content || message.message || '',
              sender_id: message.sender_id,
              recipient_id: message.recipient_id,
              created_at: message.$createdAt,
              is_mine: message.sender_id === userId1
            };
            
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === formattedMessage.id)) {
                return prev;
              }
              return [...prev, formattedMessage];
            });
            
            console.log('✅ New message received in real-time');
          }
        }
      });
      
      setSubscriptions([unsubscribe]);
      console.log('✅ Real-time subscription active');
      
    } catch (error) {
      console.error('❌ Failed to setup real-time subscription:', error);
    }
  };
  
  // Send a message
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    try {
      setSending(true);
      
      const messageData = {
        content: newMessage.trim(),
        message: newMessage.trim(), // Fallback field
        sender_id: currentUser.$id,
        recipient_id: selectedConversation.other_user.id,
        conversation_id: selectedConversation.id,
        created_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        is_read: false
      };
      
      // Create message document
      const response = await smartDatabases.createDocument(
        DATABASE_ID,
        COLLECTIONS.messages,
        ID.unique(),
        messageData
      );
      
      console.log('✅ Message sent:', response.$id);
      
      // Clear input
      setNewMessage('');
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            last_message: newMessage.trim(),
            last_message_time: new Date().toISOString()
          };
        }
        return conv;
      }));
      
      // Focus back on input
      messageInputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    
    if (conversation && currentUser) {
      fetchMessages(currentUser.$id, conversation.other_user.id);
      setupRealtimeSubscription(currentUser.$id, conversation.other_user.id);
      
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  };
  
  // Handle back button on mobile
  const handleMobileBack = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };
  
  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [subscriptions]);
  
  // Loading state
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading messages...</span>
        </Spinner>
      </Container>
    );
  }
  
  // Not authenticated
  if (!currentUser) {
    return (
      <Container className="text-center py-5">
        <Alert variant="warning">
          Please log in to view messages
        </Alert>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </Container>
    );
  }
  
  return (
    <Container fluid className="messages-container" style={{ height: 'calc(100vh - 60px)' }}>
      <Row className="h-100">
        {/* Conversations List */}
        <Col 
          md={4} 
          className={`conversations-list border-end ${isMobile && !showConversationList ? 'd-none' : ''}`}
        >
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <MessageCircle className="me-2" size={20} />
                Messages
              </h5>
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => setShowNewConversation(true)}
              >
                <Plus size={16} />
              </Button>
            </div>
            
            {/* Search */}
            <Form.Control
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
          </div>
          
          <ListGroup variant="flush" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 120px)' }}>
            {conversations
              .filter(conv => 
                conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(conv => (
                <ListGroup.Item
                  key={conv.id}
                  active={selectedConversation?.id === conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  style={{ cursor: 'pointer' }}
                  className="conversation-item"
                >
                  <div className="d-flex align-items-start">
                    <div className="user-avatar me-3">
                      {conv.other_user.avatar ? (
                        <img 
                          src={conv.other_user.avatar} 
                          alt={conv.other_user.name}
                          style={{ width: 40, height: 40, borderRadius: '50%' }}
                        />
                      ) : (
                        <div 
                          className="bg-secondary text-white d-flex align-items-center justify-content-center"
                          style={{ width: 40, height: 40, borderRadius: '50%' }}
                        >
                          {conv.other_user.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-1">{conv.other_user.name}</h6>
                        <small className="text-muted">
                          {new Date(conv.last_message_time).toLocaleDateString()}
                        </small>
                      </div>
                      <p className="mb-0 text-muted small text-truncate">
                        {conv.last_message || 'No messages yet'}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge bg="primary" pill>{conv.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))
            }
            
            {conversations.length === 0 && (
              <div className="text-center text-muted py-5">
                <MessageCircle size={48} className="mb-3" />
                <p>No conversations yet</p>
                <p className="small">Start a conversation by messaging a user</p>
              </div>
            )}
          </ListGroup>
        </Col>
        
        {/* Messages Area */}
        <Col 
          md={8} 
          className={`messages-area d-flex flex-column ${isMobile && showConversationList ? 'd-none' : ''}`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-bottom bg-white">
                <div className="d-flex align-items-center">
                  {isMobile && (
                    <Button 
                      variant="link" 
                      onClick={handleMobileBack}
                      className="p-0 me-3"
                    >
                      <ArrowLeft size={24} />
                    </Button>
                  )}
                  <div className="flex-grow-1">
                    <h6 className="mb-0">{selectedConversation.other_user.name}</h6>
                    <small className="text-muted">{selectedConversation.other_user.email}</small>
                  </div>
                  <Button variant="link" size="sm">
                    <Settings size={20} />
                  </Button>
                </div>
              </div>
              
              {/* Messages List */}
              <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`mb-3 d-flex ${msg.is_mine ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`p-2 px-3 rounded-3 ${
                        msg.is_mine 
                          ? 'bg-primary text-white' 
                          : 'bg-white border'
                      }`}
                      style={{ maxWidth: '70%', wordBreak: 'break-word' }}
                    >
                      <p className="mb-1">{msg.content}</p>
                      <small className={msg.is_mine ? 'text-white-50' : 'text-muted'}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
                
                {messages.length === 0 && (
                  <div className="text-center text-muted py-5">
                    <MessageCircle size={48} className="mb-3" />
                    <p>No messages yet</p>
                    <p className="small">Send a message to start the conversation</p>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <Form onSubmit={sendMessage} className="p-3 border-top bg-white">
                <div className="d-flex gap-2">
                  <Form.Control
                    ref={messageInputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sending}
                    variant="primary"
                  >
                    {sending ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </Form>
            </>
          ) : (
            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-muted">
              <MessageCircle size={64} className="mb-3" />
              <h5>Select a conversation</h5>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default EnhancedMessages;