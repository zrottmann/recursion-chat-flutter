import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, ListGroup, Card, Badge, Spinner, Alert, Dropdown, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { 
  Send, MessageCircle, Phone, Video, MoreVertical, 
  Paperclip, Smile, Image, FileText, Search,
  Check, CheckCheck, Circle, Wifi, WifiOff,
  Heart, ThumbsUp, ThumbsDown, Flag, Archive,
  Bot, Lightbulb, Zap, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import appwriteMessaging from '../services/appwriteMessaging';
import xaiChatService from '../services/xaiChatService';
import MembershipModal from './MembershipModal';
import './ChatInterface.css';

const ChatInterface = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  
  // Chat state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Real-time features
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // AI Chat state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Real-time subscriptions
  const subscriptionsRef = useRef([]);

  /**
   * Initialize chat interface
   */
  useEffect(() => {
    if (!currentUser) return;
    
    initializeChat();
    setupRealtimeSubscriptions();
    initializeAIFeatures();
    
    return () => {
      cleanupSubscriptions();
    };
  }, [currentUser]);

  /**
   * Initialize AI features
   */
  const initializeAIFeatures = async () => {
    try {
      setAiEnabled(xaiChatService.isConfigured());
      if (xaiChatService.isConfigured()) {
        console.log('✅ xAI Chat service initialized');
      } else {
        console.log('⚠️ xAI Chat service not configured');
      }
    } catch (error) {
      console.error('Failed to initialize AI features:', error);
      setAiEnabled(false);
    }
  };

  /**
   * Handle URL parameter changes
   */
  useEffect(() => {
    if (userId && conversations.length > 0) {
      const conv = conversations.find(c => c.other_user.id === parseInt(userId));
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [userId, conversations]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Subscribe to messages for selected conversation
   */
  useEffect(() => {
    if (selectedConversation) {
      const unsubscribe = appwriteMessaging.subscribeToMessages(
        selectedConversation.id,
        (eventData) => {
          const { type, message } = eventData;
          if (type === 'new_message') {
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(msg => msg.id === message.id);
              if (!exists) {
                return [...prev, message];
              }
              return prev;
            });
          }
        }
      );

      // Generate AI suggestions for new conversation
      if (aiEnabled) {
        generateAISuggestions();
      }

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [selectedConversation, aiEnabled]);

  /**
   * Cleanup subscriptions on unmount
   */
  useEffect(() => {
    return () => {
      appwriteMessaging.cleanup();
    };
  }, []);

  /**
   * Initialize chat data
   */
  const initializeChat = async () => {
    try {
      setLoading(true);
      await appwriteMessaging.initialize();
      await loadConversations();
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Chat initialization failed:', error);
      setConnectionStatus('error');
      toast.error('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all conversations
   */
  const loadConversations = async () => {
    try {
      const convs = await appwriteMessaging.getConversations();
      
      setConversations(convs);
      
      // Update unread counts
      const unreadMap = new Map();
      convs.forEach(conv => {
        if (conv.unread_count > 0) {
          unreadMap.set(conv.id, conv.unread_count);
        }
      });
      setUnreadCounts(unreadMap);
      
      // Auto-select conversation if specified in URL
      if (userId) {
        const targetConv = convs.find(c => c.other_user.id === parseInt(userId));
        if (targetConv) {
          setSelectedConversation(targetConv);
          await loadMessages(targetConv.id);
        }
      }
      
    } catch (error) {
      console.error('Failed to load conversations:', error);
      throw error;
    }
  };

  /**
   * Load messages for a conversation
   */
  const loadMessages = async (conversationId) => {
    try {
      const messagesData = await appwriteMessaging.getMessages(conversationId);
      setMessages(messagesData);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId);
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  /**
   * Load online users - simplified for now since API endpoint doesn't exist
   */
  const loadOnlineUsers = async () => {
    try {
      // TODO: Implement proper online status tracking through Appwrite
      // For now, assume no specific online status
      console.log('Online status tracking not yet implemented');
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  };

  /**
   * Setup real-time subscriptions
   */
  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return;

    try {
      // Subscribe to conversation updates for the current user
      const conversationsSub = appwriteMessaging.subscribeToConversations(
        (eventData) => {
          const { type, conversation } = eventData;
          if (type === 'conversation_updated') {
            // Update conversations list when conversation is updated
            setConversations(prev => 
              prev.map(conv => 
                conv.id === conversation.$id 
                  ? { ...conv, last_message: conversation.last_message, last_message_time: conversation.$updatedAt }
                  : conv
              )
            );
          }
        }
      );
      
      subscriptionsRef.current = [conversationsSub];
      
      console.log('✅ Real-time subscriptions setup complete');
      
    } catch (error) {
      console.error('Failed to setup real-time subscriptions:', error);
      setConnectionStatus('error');
    }
  };

  /**
   * Handle real-time message events
   */
  const handleRealtimeMessage = useCallback((eventData) => {
    const { type, message } = eventData;
    
    if (type === 'new_message') {
      // Add message to current conversation if it matches
      if (selectedConversation && 
          (message.sender_id === selectedConversation.other_user.id ||
           message.recipient_id === selectedConversation.other_user.id)) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read immediately if conversation is active
        if (message.sender_id === selectedConversation.other_user.id) {
          markMessageAsRead(message.id);
        }
      }
      
      // Update conversation list
      updateConversationWithNewMessage(message);
      
      // Show notification if not in current conversation
      if (!selectedConversation || 
          message.sender_id !== selectedConversation.other_user.id) {
        showMessageNotification(message);
      }
      
      // Play notification sound
      playNotificationSound();
    }
  }, [selectedConversation]);

  /**
   * Handle typing indicators
   */
  const handleTypingIndicator = useCallback((data) => {
    const { senderId, recipientId, isTyping } = data;
    
    if (recipientId === currentUser.id) {
      setTypingUsers(prev => {
        const updated = new Map(prev);
        if (isTyping) {
          updated.set(senderId, Date.now());
        } else {
          updated.delete(senderId);
        }
        return updated;
      });
      
      // Auto-clear typing indicator after 5 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Map(prev);
            const timestamp = updated.get(senderId);
            if (timestamp && Date.now() - timestamp > 4000) {
              updated.delete(senderId);
            }
            return updated;
          });
        }, 5000);
      }
    }
  }, [currentUser]);

  /**
   * Handle read receipts
   */
  const handleReadReceipt = useCallback((data) => {
    const { messageId, recipientId } = data;
    
    // Update message read status in current conversation
    setMessages(prev => prev.map(msg => 
      msg.id === messageId && msg.recipient_id === recipientId
        ? { ...msg, read_at: new Date().toISOString() }
        : msg
    ));
  }, []);

  /**
   * Handle presence updates
   */
  const handlePresenceUpdate = useCallback((eventData) => {
    const { profile } = eventData;
    
    if (profile.is_online !== undefined) {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (profile.is_online) {
          updated.add(profile.user_id);
        } else {
          updated.delete(profile.user_id);
        }
        return updated;
      });
    }
  }, []);

  /**
   * Send a new message
   */
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      
      const sentMessage = await appwriteMessaging.sendMessage(
        selectedConversation.other_user.id,
        newMessage.trim(),
        selectedConversation.item?.id
      );
      
      // Add message to local state immediately
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Update conversation list
      updateConversationWithNewMessage(sentMessage);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      if (error.response?.status === 403 && error.response?.data?.detail?.upgrade_required) {
        toast.error(error.response.data.detail.message);
        setShowMembershipModal(true);
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle typing events
   */
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // TODO: Implement typing indicators through appwriteMessaging
    // For now, just update the input value
  };

  /**
   * Select a conversation
   */
  const selectConversation = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      await loadMessages(conversation.id);
      
      // Update URL
      navigate(`/messages/${conversation.other_user.id}`, { replace: true });
      
      // Clear unread count
      setUnreadCounts(prev => {
        const updated = new Map(prev);
        updated.delete(conversation.id);
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to select conversation:', error);
    }
  };

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = async (conversationId) => {
    try {
      await appwriteMessaging.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  /**
   * Mark single message as read
   */
  const markMessageAsRead = async (messageId) => {
    try {
      // Note: Single message read tracking would need to be implemented in appwriteMessaging
      // For now, we'll rely on conversation-level read tracking
      console.log('Single message read tracking not yet implemented for message:', messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  /**
   * Update conversation with new message
   */
  const updateConversationWithNewMessage = (message) => {
    setConversations(prev => prev.map(conv => {
      const isRelevant = 
        (conv.other_user.id === message.sender_id && message.recipient_id === currentUser.id) ||
        (conv.other_user.id === message.recipient_id && message.sender_id === currentUser.id);
      
      if (isRelevant) {
        return {
          ...conv,
          last_message: message.content,
          last_message_time: message.created_at,
          unread_count: message.sender_id !== currentUser.id ? 
            (conv.unread_count || 0) + 1 : conv.unread_count
        };
      }
      
      return conv;
    }));
  };

  /**
   * Show message notification
   */
  const showMessageNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const sender = conversations.find(c => c.other_user.id === message.sender_id);
      const senderName = sender?.other_user.username || 'Someone';
      
      new Notification(`New message from ${senderName}`, {
        body: message.content.length > 50 ? 
          message.content.substring(0, 50) + '...' : 
          message.content,
        icon: '/favicon.ico',
        tag: `message_${message.id}`
      });
    }
  };

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if sound file doesn't exist
      });
    } catch (error) {
      // Ignore sound errors
    }
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Cleanup subscriptions
   */
  const cleanupSubscriptions = () => {
    subscriptionsRef.current.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    subscriptionsRef.current = [];
  };

  /**
   * Generate AI conversation suggestions
   */
  const generateAISuggestions = async () => {
    if (!aiEnabled || !selectedConversation) return;

    try {
      const context = {
        itemContext: selectedConversation.item,
        userProfile: {
          username: currentUser.username,
          interests: currentUser.interests || []
        }
      };

      const suggestions = await xaiChatService.generateConversationSuggestions(context);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }
  };

  /**
   * Generate AI-powered message response
   */
  const generateAIResponse = async (message) => {
    if (!aiEnabled) {
      toast.info('AI chat features not available');
      return;
    }

    setAiGenerating(true);
    try {
      const context = {
        conversationHistory: messages.slice(-10), // Last 10 messages
        itemContext: selectedConversation.item,
        userPreferences: {
          interests: currentUser.interests || []
        }
      };

      const response = await xaiChatService.generateChatResponse(message, context);
      
      if (response.success) {
        // Add AI response as a suggestion or auto-fill
        setNewMessage(response.message);
        toast.success('AI response generated!');
        
        // Optionally show suggestions from the response
        if (response.suggestions && response.suggestions.length > 0) {
          setAiSuggestions(response.suggestions);
          setShowAiSuggestions(true);
        }
      } else if (response.fallback) {
        setNewMessage(response.fallback);
        toast.warning('AI unavailable, using fallback response');
      } else {
        toast.error('Failed to generate AI response');
      }
    } catch (error) {
      console.error('AI response generation failed:', error);
      toast.error('AI response generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  /**
   * Use an AI suggestion
   */
  const useAISuggestion = (suggestion) => {
    setNewMessage(suggestion);
    setShowAiSuggestions(false);
    messageInputRef.current?.focus();
  };

  /**
   * Toggle AI suggestions panel
   */
  const toggleAISuggestions = () => {
    if (!aiEnabled) {
      toast.info('AI features not configured');
      return;
    }
    setShowAiSuggestions(!showAiSuggestions);
  };

  /**
   * Filter conversations based on search
   */
  const filteredConversations = conversations.filter(conv =>
    conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Check if user is online
   */
  const isUserOnline = (userId) => onlineUsers.has(userId);

  /**
   * Check if user is typing
   */
  const isUserTyping = (userId) => typingUsers.has(userId);

  /**
   * Get message status icon
   */
  const getMessageStatusIcon = (message) => {
    if (message.sender_id !== currentUser.id) return null;
    
    if (message.read_at) {
      return <CheckCheck size={14} className="text-info" />;
    } else if (message.delivered_at) {
      return <Check size={14} className="text-muted" />;
    } else {
      return <Circle size={12} className="text-muted" />;
    }
  };

  /**
   * Format message time
   */
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" />
        <span className="ms-2">Loading chat...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="chat-interface h-100">
      <Row className="h-100">
        {/* Conversations Sidebar */}
        <Col md={4} lg={3} className="conversations-sidebar border-end">
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">Messages</h5>
              <div className="d-flex align-items-center">
                {connectionStatus === 'connected' && <Wifi size={16} className="text-success" />}
                {connectionStatus === 'error' && <WifiOff size={16} className="text-danger" />}
                {connectionStatus === 'connecting' && <Spinner animation="border" size="sm" />}
              </div>
            </div>
            
            <Form.Control
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />
          </div>
          
          <ListGroup variant="flush" className="conversations-list">
            {filteredConversations.map(conv => (
              <ListGroup.Item
                key={conv.id}
                active={selectedConversation?.id === conv.id}
                onClick={() => selectConversation(conv)}
                className="conversation-item border-0"
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center">
                  <div className="position-relative me-3">
                    <div className="user-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      {conv.other_user.username?.charAt(0).toUpperCase()}
                    </div>
                    {isUserOnline(conv.other_user.id) && (
                      <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" style={{ width: '12px', height: '12px' }}></div>
                    )}
                  </div>
                  
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-truncate">
                        {conv.other_user.username}
                      </h6>
                      <small className="text-muted">
                        {formatMessageTime(conv.last_message_time)}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="mb-0 text-muted small text-truncate">
                        {isUserTyping(conv.other_user.id) ? (
                          <span className="text-info">typing...</span>
                        ) : (
                          conv.last_message
                        )}
                      </p>
                      {unreadCounts.has(conv.id) && (
                        <Badge bg="primary" className="ms-2">
                          {unreadCounts.get(conv.id)}
                        </Badge>
                      )}
                    </div>
                    
                    {conv.item && (
                      <small className="text-primary">
                        Re: {conv.item.title}
                      </small>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
          
          {filteredConversations.length === 0 && (
            <div className="text-center p-4 text-muted">
              <MessageCircle size={48} className="mb-3" />
              <p>No conversations found</p>
            </div>
          )}
        </Col>

        {/* Chat Area */}
        <Col md={8} lg={9} className="chat-area d-flex flex-column">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header p-3 border-bottom bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="position-relative me-3">
                      <div className="user-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        {selectedConversation.other_user.username?.charAt(0).toUpperCase()}
                      </div>
                      {isUserOnline(selectedConversation.other_user.id) && (
                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" style={{ width: '12px', height: '12px' }}></div>
                      )}
                    </div>
                    
                    <div>
                      <h6 className="mb-0">
                        {selectedConversation.other_user.username}
                      </h6>
                      <small className="text-muted">
                        {isUserOnline(selectedConversation.other_user.id) ? 'Online' : 'Last seen recently'}
                      </small>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center">
                    {/* AI Features Button */}
                    {aiEnabled && (
                      <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>AI Chat Features</Tooltip>}
                      >
                        <Button
                          variant={showAiSuggestions ? "primary" : "outline-primary"}
                          size="sm"
                          className="me-2"
                          onClick={toggleAISuggestions}
                        >
                          <Bot size={16} />
                        </Button>
                      </OverlayTrigger>
                    )}
                    
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        <MoreVertical size={16} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => navigate(`/users/${selectedConversation.other_user.id}`)}>
                          View Profile
                        </Dropdown.Item>
                        {aiEnabled && (
                          <>
                            <Dropdown.Item onClick={() => generateAISuggestions()}>
                              <Lightbulb size={16} className="me-2" />
                              Get AI Suggestions
                            </Dropdown.Item>
                            <Dropdown.Divider />
                          </>
                        )}
                        <Dropdown.Item onClick={() => setShowReportModal(true)}>
                          <Flag size={16} className="me-2" />
                          Report User
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger">
                          <Archive size={16} className="me-2" />
                          Archive Chat
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                
                {selectedConversation.item && (
                  <Alert variant="info" className="mt-2 mb-0 py-2">
                    <small>
                      Discussion about: <strong>{selectedConversation.item.title}</strong>
                    </small>
                  </Alert>
                )}
              </div>

              {/* AI Suggestions Panel */}
              {showAiSuggestions && aiEnabled && (
                <div className="ai-suggestions-panel p-3 border-bottom bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <Sparkles size={16} className="text-primary me-2" />
                      <small className="text-muted fw-bold">AI Chat Suggestions</small>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-muted"
                      onClick={() => setShowAiSuggestions(false)}
                    >
                      ×
                    </Button>
                  </div>
                  
                  {aiSuggestions.length > 0 ? (
                    <div className="ai-suggestions">
                      {aiSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline-primary"
                          size="sm"
                          className="me-2 mb-2"
                          onClick={() => useAISuggestion(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={generateAISuggestions}
                        disabled={aiGenerating}
                      >
                        {aiGenerating ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Lightbulb size={16} className="me-2" />
                            Generate Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Messages Area */}
              <div className="messages-container flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`message-wrapper mb-3 d-flex ${
                      message.sender_id === currentUser.id ? 'justify-content-end' : 'justify-content-start'
                    }`}
                  >
                    <div
                      className={`message p-2 rounded-3 ${
                        message.sender_id === currentUser.id
                          ? 'bg-primary text-white'
                          : 'bg-light'
                      }`}
                      style={{ maxWidth: '70%' }}
                    >
                      <div className="message-content">
                        {message.content}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className={message.sender_id === currentUser.id ? 'text-white-50' : 'text-muted'}>
                          {formatMessageTime(message.created_at)}
                        </small>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isUserTyping(selectedConversation.other_user.id) && (
                  <div className="typing-indicator mb-3">
                    <div className="bg-light p-2 rounded-3 d-inline-block">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="message-input-container p-3 border-top">
                <Form onSubmit={sendMessage}>
                  <div className="d-flex align-items-center">
                    <div className="input-group">
                      <Form.Control
                        ref={messageInputRef}
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleTyping}
                        disabled={sending}
                      />
                      
                      {/* AI Response Button */}
                      {aiEnabled && messages.length > 0 && (
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Generate AI response to last message</Tooltip>}
                        >
                          <Button
                            variant="outline-secondary"
                            disabled={aiGenerating || sending}
                            onClick={() => {
                              const lastMessage = messages[messages.length - 1];
                              if (lastMessage && lastMessage.sender_id !== currentUser.id) {
                                generateAIResponse(lastMessage.content);
                              }
                            }}
                          >
                            {aiGenerating ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <Zap size={16} />
                            )}
                          </Button>
                        </OverlayTrigger>
                      )}
                      
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!newMessage.trim() || sending}
                      >
                        {sending ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <Send size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
                
                {/* AI Status Indicator */}
                {aiEnabled && (
                  <div className="d-flex align-items-center justify-content-between mt-2">
                    <small className="text-muted d-flex align-items-center">
                      <Bot size={12} className="me-1" />
                      AI features enabled
                    </small>
                    {aiGenerating && (
                      <small className="text-primary">
                        <Spinner animation="border" size="sm" className="me-1" />
                        AI is thinking...
                      </small>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="no-conversation d-flex flex-column justify-content-center align-items-center h-100 text-muted">
              <MessageCircle size={64} className="mb-3" />
              <h5>Select a conversation to start messaging</h5>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          )}
        </Col>
      </Row>
      
      {/* Membership Modal */}
      <MembershipModal
        show={showMembershipModal}
        onHide={() => setShowMembershipModal(false)}
        onMembershipUpdate={() => window.location.reload()}
      />
    </Container>
  );
};

export default ChatInterface;