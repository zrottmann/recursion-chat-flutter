import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import appwriteMessaging from '../services/appwriteMessaging';
import MembershipModal from './MembershipModal';
import './Messages.css';

const Messages = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const conversationsData = await appwriteMessaging.getConversations();
      setConversations(conversationsData);
      
      if (userId) {
        let conv = conversationsData.find(c => 
          c.other_user.id === parseInt(userId)
        );
        
        // If no existing conversation, it may need to be created when first message is sent
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    }
  }, [userId]);

  // Initialize messaging service and fetch conversations
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        await appwriteMessaging.initialize();
        await fetchConversations();
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
        toast.error('Failed to initialize messaging system');
      }
    };

    initializeMessaging();
  }, [fetchConversations]);

  // Real-time subscription and message fetching
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Set up real-time subscription for new messages
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
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      appwriteMessaging.cleanup();
    };
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const messagesData = await appwriteMessaging.getMessages(conversationId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);


  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      let recipientId;
      let itemId = null;

      if (selectedConversation) {
        recipientId = selectedConversation.other_user.id;
        itemId = selectedConversation.item?.id;
      } else if (userId) {
        // Creating new conversation with user from URL
        recipientId = parseInt(userId);
      } else {
        toast.error('No recipient selected');
        return;
      }

      const sentMessage = await appwriteMessaging.sendMessage(
        recipientId,
        newMessage.trim(),
        itemId
      );

      setNewMessage('');
      
      // Refresh conversations list to show new/updated conversation
      await fetchConversations();
      
      // If this was a new conversation, select it
      if (!selectedConversation && userId) {
        const conversations = await appwriteMessaging.getConversations();
        const newConv = conversations.find(c => c.other_user.id === parseInt(userId));
        if (newConv) {
          setSelectedConversation(newConv);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Check if it's a membership limit error (preserve existing functionality)
      if (error.response?.status === 403 && error.response?.data?.detail?.upgrade_required) {
        toast.error(error.response.data.detail.message);
        setShowMembershipModal(true);
      } else {
        toast.error('Failed to send message');
      }
    }
  };

  return (
    <Container fluid className="messages-container">
      <Row className="h-100">
        {/* Conversations List */}
        <Col md={4} className="conversations-list">
          <div className="conversations-header">
            <h5>Messages</h5>
          </div>
          <ListGroup variant="flush">
            {conversations.map(conv => (
              <ListGroup.Item
                key={conv.id}
                active={selectedConversation?.id === conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="conversation-item"
              >
                <div className="d-flex align-items-center">
                  <div className="user-avatar">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex justify-content-between">
                      <h6 
                        className="mb-0 text-primary" 
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          conv.other_user?.id && navigate(`/users/${conv.other_user.id}`);
                        }}
                      >
                        {conv.other_user?.username || 'Unknown User'}
                      </h6>
                      <small className="text-muted">
                        {new Date(conv.last_message_time).toLocaleDateString()}
                      </small>
                    </div>
                    <p className="mb-0 text-muted small">
                      {conv.item && `Re: ${conv.item.title}`}
                    </p>
                    <p className="mb-0 text-truncate">
                      {conv.last_message}
                    </p>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        {/* Chat Area */}
        <Col md={8} className="chat-area">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div>
                  <h6 
                    className="mb-0 text-primary" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectedConversation.other_user?.id && navigate(`/users/${selectedConversation.other_user.id}`)}
                  >
                    {selectedConversation.other_user?.username || 'Unknown User'}
                  </h6>
                  {selectedConversation.item && (
                    <small className="text-muted">
                      About: {selectedConversation.item.title}
                    </small>
                  )}
                  {location.state?.matchContext && (
                    <small className="text-success d-block">
                      <i className="fas fa-exchange-alt"></i> Trade Match: {location.state.matchContext.yourListing.title} ⇄ {location.state.matchContext.theirListing.title}
                    </small>
                  )}
                </div>
              </div>

              <div className="messages-list">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      {msg.content}
                    </div>
                    <small className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </small>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <Form onSubmit={sendMessage} className="message-form">
                <Form.Control
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" variant="primary">
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </Form>
            </>
          ) : (
            <div className="no-conversation">
              <i className="fas fa-comments"></i>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </Col>
      </Row>
      
      {/* Membership Modal */}
      <MembershipModal
        show={showMembershipModal}
        onHide={() => setShowMembershipModal(false)}
        onMembershipUpdate={() => {
          // Refresh user profile to get updated membership status
          window.location.reload();
        }}
      />
    </Container>
  );
};

export default Messages;