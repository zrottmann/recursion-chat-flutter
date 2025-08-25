import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Dropdown, Badge, ListGroup, Button, Card, 
  Modal, Form, Alert, Spinner, Toast, ToastContainer 
} from 'react-bootstrap';
import { 
  Bell, BellOff, MessageSquare, Heart, Star, 
  Package, AlertCircle, Settings, Check, X,
  Volume2, VolumeX, Smartphone, Mail, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import appwriteRealtime from '../services/appwriteRealtime';
import notificationService, { NOTIFICATION_TYPES } from '../services/notificationService';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const { currentUser } = useSelector(state => state.user);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    push: true,
    email: false,
    categories: {
      messages: true,
      matches: true,
      trades: true,
      reviews: true,
      system: true
    },
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Real-time subscription
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  /**
   * Initialize notification center
   */
  useEffect(() => {
    if (!currentUser) return;
    
    initializeNotifications();
    requestNotificationPermission();
    setupRealtimeSubscriptions();
    
    return () => {
      cleanupSubscriptions();
    };
  }, [currentUser]);

  /**
   * Initialize notifications and settings
   */
  const initializeNotifications = async () => {
    try {
      setLoading(true);
      
      // Load existing notifications
      await loadNotifications();
      
      // Load notification settings
      await loadNotificationSettings();
      
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load notifications from API using enhanced notification service
   */
  const loadNotifications = async () => {
    try {
      if (!currentUser?.id && !currentUser?.$id) {
        console.log('No user ID available for loading notifications');
        return;
      }

      const userId = currentUser.id || currentUser.$id;
      const notifs = await notificationService.getNotifications(userId);
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read && !n.is_read).length);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to API if Appwrite fails
      try {
        const response = await api.get('/notifications');
        const notifs = response.data;
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
  };

  /**
   * Load notification settings using enhanced notification service
   */
  const loadNotificationSettings = async () => {
    try {
      if (!currentUser?.id && !currentUser?.$id) {
        return;
      }

      const userId = currentUser.id || currentUser.$id;
      const settings = await notificationService.getNotificationSettings(userId);
      setNotificationSettings(prevSettings => ({
        ...prevSettings,
        ...settings
      }));
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      // Keep default settings on error
    }
  };

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success('Browser notifications enabled!');
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    }
  };

  /**
   * Setup real-time subscriptions for notifications
   */
  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return;

    try {
      const subscription = appwriteRealtime.subscribeToUserNotifications(
        currentUser.id,
        {
          // New match notifications
          new_match: (eventData) => {
            handleRealtimeNotification({
              type: 'match',
              title: 'New Match Found!',
              message: `Found a potential trade match for your item`,
              data: eventData.match,
              priority: 'high'
            });
          },
          
          // Match accepted
          match_accepted: (eventData) => {
            handleRealtimeNotification({
              type: 'match',
              title: 'Match Accepted!',
              message: `Someone accepted your trade proposal`,
              data: eventData.match,
              priority: 'high'
            });
          },
          
          // New message
          onMessage: (eventData) => {
            if (eventData.type === 'new_message') {
              handleRealtimeNotification({
                type: 'message',
                title: 'New Message',
                message: `${eventData.message.sender_name}: ${eventData.message.content}`,
                data: eventData.message,
                priority: 'medium'
              });
            }
          },
          
          // Trade updates
          onTrade: (eventData) => {
            const tradeMessages = {
              new_trade: 'New trade proposal received',
              trade_updated: 'Trade proposal updated',
              trade_accepted: 'Trade proposal accepted!',
              trade_completed: 'Trade completed successfully!',
              trade_cancelled: 'Trade was cancelled'
            };
            
            handleRealtimeNotification({
              type: 'trade',
              title: 'Trade Update',
              message: tradeMessages[eventData.type] || 'Trade status changed',
              data: eventData.trade,
              priority: eventData.type === 'trade_accepted' ? 'high' : 'medium'
            });
          }
        }
      );
      
      setRealtimeSubscription(subscription);
      
    } catch (error) {
      console.error('Failed to setup real-time subscriptions:', error);
    }
  };

  /**
   * Handle real-time notification
   */
  const handleRealtimeNotification = useCallback((notification) => {
    // Check if notifications are enabled for this category
    if (!notificationSettings?.enabled || 
        !notificationSettings?.categories?.[notification.type]) {
      return;
    }
    
    // Check quiet hours
    if (isInQuietHours()) {
      return;
    }
    
    // Add to local notifications
    const newNotification = {
      id: `realtime_${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false,
      created_at: new Date().toISOString(),
      priority: notification.priority || 'medium'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification
    showBrowserNotification(notification);
    
    // Show toast notification
    showToastNotification(notification);
    
    // Play sound
    if (notificationSettings?.sound) {
      playNotificationSound(notification.type, notification.priority);
    }
    
    // Store in API
    storeNotification(newNotification);
    
  }, [notificationSettings]);

  /**
   * Show browser notification
   */
  const showBrowserNotification = (notification) => {
    if ('Notification' in window && 
        Notification.permission === 'granted' && 
        notificationSettings?.push) {
      
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification_${notification.type}`,
        badge: '/favicon.ico',
        timestamp: Date.now(),
        requireInteraction: notification.priority === 'high',
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/dismiss.png'
          }
        ]
      });
      
      browserNotification.onclick = () => {
        handleNotificationClick(notification);
        browserNotification.close();
      };
      
      // Auto-close after 5 seconds for non-high priority
      if (notification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  };

  /**
   * Show toast notification
   */
  const showToastNotification = (notification) => {
    const toastId = `toast_${Date.now()}`;
    
    const newToast = {
      id: toastId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      show: true,
      autohide: notification.priority !== 'high',
      delay: notification.priority === 'high' ? 10000 : 5000
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Remove toast after delay
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, newToast.delay);
  };

  /**
   * Play notification sound using enhanced notification service
   */
  const playNotificationSound = (type = 'default', priority = 'medium') => {
    try {
      // Use enhanced notification service for Web Audio API sounds
      notificationService.playNotificationSound(type);
      
      // Fallback to audio files for specific priorities
      if (priority === 'high') {
        try {
          const audio = new Audio('/sounds/high-priority.mp3');
          audio.volume = 0.3; // Lower volume since we have both sounds
          audio.play().catch(() => {
            // Ignore if sound file doesn't exist
          });
        } catch (error) {
          // Ignore sound errors
        }
      }
    } catch (error) {
      // Ignore sound errors
    }
  };

  /**
   * Check if current time is in quiet hours
   */
  const isInQuietHours = () => {
    if (!notificationSettings?.quiet_hours?.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = (notificationSettings?.quiet_hours?.start || '22:00').split(':').map(Number);
    const [endHour, endMin] = (notificationSettings?.quiet_hours?.end || '08:00').split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  /**
   * Store notification using enhanced notification service
   */
  const storeNotification = async (notification) => {
    try {
      if (!currentUser?.id && !currentUser?.$id) {
        return;
      }

      const userId = currentUser.id || currentUser.$id;
      await notificationService.createEnhancedNotification(
        userId,
        notification.title,
        notification.message,
        notification.type,
        notification.data || {}
      );
    } catch (error) {
      console.error('Failed to store notification via enhanced service:', error);
      // Fallback to API
      try {
        await api.post('/notifications', {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority
        });
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
  };

  /**
   * Handle notification click
   */
  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.data?.sender_id) {
          window.open(`/messages/${notification.data.sender_id}`, '_blank');
        }
        break;
      case 'match':
        window.open('/matches', '_blank');
        break;
      case 'trade':
        if (notification.data?.id) {
          window.open(`/trades/${notification.data.id}`, '_blank');
        }
        break;
      default:
        window.open('/', '_blank');
    }
    
    // Mark as read
    markAsRead(notification.id || notification.$id);
  };

  /**
   * Mark notification as read using enhanced notification service
   */
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId || n.$id === notificationId) ? 
          { ...n, read: true, is_read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Fallback to API
      try {
        await api.patch(`/notifications/${notificationId}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
  };

  /**
   * Mark all notifications as read using enhanced notification service
   */
  const markAllAsRead = async () => {
    try {
      if (!currentUser?.id && !currentUser?.$id) {
        return;
      }

      const userId = currentUser.id || currentUser.$id;
      await notificationService.markAllAsRead(userId);
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, is_read: true }))
      );
      
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Fallback to API
      try {
        await api.patch('/notifications/read-all');
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
  };

  /**
   * Delete notification using enhanced notification service
   */
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId || n.$id === notificationId);
        const filtered = prev.filter(n => n.id !== notificationId && n.$id !== notificationId);
        
        if (notification && !notification.read && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        return filtered;
      });
      
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Fallback to API
      try {
        await api.delete(`/notifications/${notificationId}`);
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const filtered = prev.filter(n => n.id !== notificationId);
          
          if (notification && !notification.read) {
            setUnreadCount(count => Math.max(0, count - 1));
          }
          
          return filtered;
        });
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
  };

  /**
   * Update notification settings using enhanced notification service
   */
  const updateNotificationSettings = async (newSettings) => {
    try {
      if (!currentUser?.id && !currentUser?.$id) {
        return;
      }

      const userId = currentUser.id || currentUser.$id;
      await notificationService.updateNotificationSettings(userId, newSettings);
      setNotificationSettings(newSettings);
      
      // Update sound setting in notification service
      notificationService.setSoundEnabled(newSettings.sound);
      
      toast.success('Notification settings updated!');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to update settings');
    }
  };

  /**
   * Clear old notifications using enhanced notification service
   */
  const clearOldNotifications = async () => {
    try {
      if (!currentUser?.id && !currentUser?.$id) {
        return;
      }

      const userId = currentUser.id || currentUser.$id;
      await notificationService.deleteOldNotifications(userId);
      await loadNotifications();
      toast.success('Old notifications cleared');
    } catch (error) {
      console.error('Failed to clear old notifications:', error);
      // Fallback to API
      try {
        await api.delete('/notifications/old');
        await loadNotifications();
        toast.success('Old notifications cleared');
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
    }
  };

  /**
   * Cleanup subscriptions
   */
  const cleanupSubscriptions = () => {
    if (realtimeSubscription) {
      appwriteRealtime.unsubscribe(realtimeSubscription);
    }
  };

  /**
   * Get notification icon
   */
  const getNotificationIcon = (type) => {
    const icons = {
      message: MessageSquare,
      match: Heart,
      trade: Package,
      review: Star,
      system: AlertCircle
    };
    
    const IconComponent = icons[type] || Bell;
    return <IconComponent size={16} />;
  };

  /**
   * Format notification time
   */
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell */}
      <Dropdown 
        show={showDropdown} 
        onToggle={setShowDropdown}
        align="end"
      >
        <Dropdown.Toggle 
          variant="outline-secondary" 
          className="position-relative border-0"
          id="notification-dropdown"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              className="position-absolute top-0 start-100 translate-middle rounded-pill"
              style={{ fontSize: '0.7rem' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className="notification-dropdown"
          style={{ width: '380px', maxHeight: '500px', overflowY: 'auto' }}
        >
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0">Notifications</h6>
            <div>
              <Button
                variant="link"
                size="sm"
                className="p-0 me-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings size={16} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <Bell size={32} className="mb-2" />
              <p className="mb-0">No notifications yet</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.slice(0, 10).map(notification => (
                <ListGroup.Item
                  key={notification.id || notification.$id}
                  className={`notification-item ${!notification.read && !notification.is_read ? 'unread' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex align-items-start">
                    <div className="notification-icon me-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-1 text-truncate">
                          {notification.title}
                        </h6>
                        <div className="d-flex align-items-center">
                          <small className="text-muted me-2">
                            {formatNotificationTime(notification.created_at || notification.createdAt)}
                          </small>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id || notification.$id);
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="mb-0 text-muted small">
                        {notification.message}
                      </p>
                      {!notification.read && !notification.is_read && (
                        <div className="notification-unread-indicator"></div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

          {notifications.length > 10 && (
            <div className="text-center p-2 border-top">
              <Button variant="link" size="sm">
                View all notifications
              </Button>
            </div>
          )}
        </Dropdown.Menu>
      </Dropdown>

      {/* Notification Settings Modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Notification Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">General Settings</h6>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="notifications-enabled"
                label="Enable notifications"
                checked={notificationSettings?.enabled || false}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
                className="mb-3"
              />
              
              <Form.Check
                type="switch"
                id="notification-sound"
                label="Sound notifications"
                checked={notificationSettings?.sound || false}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  sound: e.target.checked
                }))}
                disabled={!notificationSettings?.enabled}
                className="mb-3"
              />
              
              <Form.Check
                type="switch"
                id="push-notifications"
                label="Browser push notifications"
                checked={notificationSettings?.push || false}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  push: e.target.checked
                }))}
                disabled={!notificationSettings?.enabled}
                className="mb-3"
              />
              
              <Form.Check
                type="switch"
                id="email-notifications"
                label="Email notifications"
                checked={notificationSettings?.email || false}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  email: e.target.checked
                }))}
                disabled={!notificationSettings?.enabled}
              />
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Notification Categories</h6>
            </Card.Header>
            <Card.Body>
              {notificationSettings?.categories && typeof notificationSettings.categories === 'object' && 
               Object.entries(notificationSettings.categories).map(([category, enabled]) => (
                <Form.Check
                  key={category}
                  type="switch"
                  id={`category-${category}`}
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                  checked={enabled}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    categories: {
                      ...prev.categories,
                      [category]: e.target.checked
                    }
                  }))}
                  disabled={!notificationSettings?.enabled}
                  className="mb-2"
                />
              ))}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h6 className="mb-0">Quiet Hours</h6>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="quiet-hours"
                label="Enable quiet hours"
                checked={notificationSettings?.quiet_hours?.enabled || false}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  quiet_hours: {
                    ...(prev?.quiet_hours || {}),
                    enabled: e.target.checked
                  }
                }))}
                className="mb-3"
              />
              
              {notificationSettings?.quiet_hours?.enabled && (
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label>Start time</Form.Label>
                      <Form.Control
                        type="time"
                        value={notificationSettings?.quiet_hours?.start || '22:00'}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          quiet_hours: {
                            ...(prev?.quiet_hours || {}),
                            start: e.target.value
                          }
                        }))}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label>End time</Form.Label>
                      <Form.Control
                        type="time"
                        value={notificationSettings?.quiet_hours?.end || '08:00'}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          quiet_hours: {
                            ...(prev?.quiet_hours || {}),
                            end: e.target.value
                          }
                        }))}
                      />
                    </Form.Group>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              updateNotificationSettings(notificationSettings);
              setShowSettings(false);
            }}
          >
            Save Settings
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            show={toast.show}
            autohide={toast.autohide}
            delay={toast.delay}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <Toast.Header>
              <div className="me-2">
                {getNotificationIcon(toast.type)}
              </div>
              <strong className="me-auto">{toast.title}</strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
};

export default NotificationCenter;