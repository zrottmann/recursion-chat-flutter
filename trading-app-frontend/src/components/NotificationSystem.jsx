import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toast, ToastContainer, Alert, Badge, Dropdown, Button, ListGroup, Modal } from 'react-bootstrap';
import { Bell, Check, X, MessageCircle, DollarSign, Star, Gift, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { client, databases, account, Query, ID } from '../lib/appwrite';
import { useAuth } from '../hooks/useAuth';
import './NotificationSystem.css';

const DATABASE_ID = 'trading_post_db';
const COLLECTIONS = {
  notifications: 'notifications',
  users: 'users'
};

const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  TRADE_REQUEST: 'trade_request',
  TRADE_ACCEPTED: 'trade_accepted',
  TRADE_COMPLETED: 'trade_completed',
  PAYMENT_RECEIVED: 'payment_received',
  ITEM_SOLD: 'item_sold',
  ITEM_SAVED: 'item_saved',
  PROFILE_VIEW: 'profile_view',
  REVIEW_RECEIVED: 'review_received',
  SYSTEM_ALERT: 'system_alert',
  MEMBERSHIP_UPGRADE: 'membership_upgrade'
};

/**
 * Individual Notification Component
 */
const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return <MessageCircle size={16} className="text-primary" />;
      case NOTIFICATION_TYPES.TRADE_REQUEST:
      case NOTIFICATION_TYPES.TRADE_ACCEPTED:
      case NOTIFICATION_TYPES.TRADE_COMPLETED:
        return <DollarSign size={16} className="text-success" />;
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
      case NOTIFICATION_TYPES.ITEM_SOLD:
        return <Gift size={16} className="text-warning" />;
      case NOTIFICATION_TYPES.REVIEW_RECEIVED:
        return <Star size={16} className="text-info" />;
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        return <AlertTriangle size={16} className="text-danger" />;
      case NOTIFICATION_TYPES.MEMBERSHIP_UPGRADE:
        return <Star size={16} className="text-success" />;
      default:
        return <Info size={16} className="text-muted" />;
    }
  };

  const getNotificationVariant = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        return 'danger';
      case NOTIFICATION_TYPES.TRADE_COMPLETED:
      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        return 'success';
      case NOTIFICATION_TYPES.MESSAGE:
      case NOTIFICATION_TYPES.TRADE_REQUEST:
        return 'info';
      default:
        return 'light';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <ListGroup.Item 
      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
      style={{ borderLeft: !notification.is_read ? '4px solid #007bff' : 'none' }}
    >
      <div className="d-flex align-items-start">
        <div className="notification-icon me-3 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="mb-1 notification-title">
                {notification.title}
                {!notification.is_read && (
                  <Badge bg="primary" className="ms-2" style={{ fontSize: '0.6rem' }}>
                    New
                  </Badge>
                )}
              </h6>
              <p className="mb-1 text-muted small notification-content">
                {notification.content}
              </p>
              <small className="text-muted">
                {formatTimeAgo(notification.created_at)}
              </small>
            </div>
            
            <div className="notification-actions d-flex gap-1">
              {!notification.is_read && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-1"
                  onClick={() => onMarkRead(notification.id)}
                  title="Mark as read"
                >
                  <Check size={14} />
                </Button>
              )}
              <Button
                variant="link"
                size="sm"
                className="p-1 text-danger"
                onClick={() => onDelete(notification.id)}
                title="Delete"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ListGroup.Item>
  );
};

/**
 * In-App Toast Notifications
 */
const ToastNotification = ({ notification, show, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 5000); // Auto-hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  return (
    <Toast show={show} onClose={onHide} className="notification-toast">
      <Toast.Header>
        <div className="d-flex align-items-center">
          <Bell size={16} className="me-2 text-primary" />
          <strong className="me-auto">{notification?.title}</strong>
        </div>
      </Toast.Header>
      <Toast.Body>
        {notification?.content}
      </Toast.Body>
    </Toast>
  );
};

/**
 * Main Notification System Component
 */
const NotificationSystem = () => {
  const { user } = useAuth();
  
  // State management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  // Real-time subscription
  const [subscription, setSubscription] = useState(null);
  const audioRef = useRef(null);
  
  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.notifications,
        [
          Query.equal('user_id', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );

      const formattedNotifications = response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        content: doc.content,
        type: doc.type,
        is_read: doc.is_read || false,
        created_at: doc.$createdAt,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
      }));

      setNotifications(formattedNotifications);
      
      // Count unread notifications
      const unread = formattedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || subscription) return;

    try {
      const channels = [
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.notifications}.documents`
      ];

      const unsubscribe = client.subscribe(channels, (response) => {
        console.log('📨 Notification real-time event:', response);

        if (response.events?.includes('databases.*.collections.*.documents.*.create')) {
          const notification = response.payload;
          
          // Check if notification is for current user
          if (notification.user_id === user.$id) {
            const formattedNotification = {
              id: notification.$id,
              title: notification.title,
              content: notification.content,
              type: notification.type,
              is_read: false,
              created_at: notification.$createdAt,
              metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
            };

            // Add to notifications list
            setNotifications(prev => [formattedNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show real-time toast
            setRealtimeToast(formattedNotification);
            setShowToast(true);

            // Play notification sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }

            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification(formattedNotification.title, {
                body: formattedNotification.content,
                icon: '/favicon.ico',
                tag: formattedNotification.id
              });
            }

            console.log('✅ Real-time notification received and displayed');
          }
        }
      });

      setSubscription(unsubscribe);
      console.log('✅ Notification real-time subscription active');

    } catch (error) {
      console.error('❌ Failed to setup notification subscription:', error);
    }
  }, [user, subscription]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!');
      }
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.notifications,
        notificationId,
        { is_read: true }
      );

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.notifications,
        notificationId
      );

      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Update all unread notifications
      await Promise.all(
        unreadNotifications.map(notification =>
          databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.notifications,
            notification.id,
            { is_read: true }
          )
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Initialize component
  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
      requestNotificationPermission();
    }

    return () => {
      if (subscription && typeof subscription === 'function') {
        subscription();
      }
    };
  }, [user, fetchNotifications, setupRealtimeSubscription]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription && typeof subscription === 'function') {
        subscription();
      }
    };
  }, [subscription]);

  if (!user) return null;

  return (
    <>
      {/* Notification Bell Button */}
      <Dropdown show={showDropdown} onToggle={setShowDropdown}>
        <Dropdown.Toggle
          as={Button}
          variant="link"
          className="notification-toggle position-relative p-2"
          style={{ border: 'none', background: 'none' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.6rem' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu align="end" style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
          <Dropdown.Header className="d-flex justify-content-between align-items-center">
            <span>Notifications</span>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="link" size="sm" onClick={() => setShowModal(true)}>
                View all
              </Button>
            </div>
          </Dropdown.Header>
          
          <Dropdown.Divider />
          
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <Bell size={32} className="mb-2" />
              <p className="mb-0">No notifications yet</p>
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.slice(0, 5).map(notification => (
                <div key={notification.id} className="px-3 py-2 border-bottom">
                  <NotificationItem
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                </div>
              ))}
            </div>
          )}
        </Dropdown.Menu>
      </Dropdown>

      {/* Full Notifications Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Bell size={48} className="mb-3" />
              <h5>No notifications</h5>
              <p>You're all caught up!</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          {unreadCount > 0 && (
            <Button variant="primary" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Real-time Toast Notifications */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <ToastNotification
          notification={realtimeToast}
          show={showToast}
          onHide={() => setShowToast(false)}
        />
      </div>
    </>
  );
};

/**
 * Utility function to create notifications
 */
export const createNotification = async (userId, title, content, type = NOTIFICATION_TYPES.INFO, metadata = {}) => {
  try {
    const notificationData = {
      userId: userId,
      user_id: userId, // Keep both for compatibility
      title,
      content,
      type,
      is_read: false,
      metadata: JSON.stringify(metadata),
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString() // Keep both for compatibility
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.notifications,
      ID.unique(),
      notificationData
    );

    console.log('✅ Notification created:', response.$id);
    return response;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
};

export { NOTIFICATION_TYPES };
export default NotificationSystem;