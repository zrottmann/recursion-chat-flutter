class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Use environment variable or construct from current host
      const wsUrl = import.meta.env.VITE_WS_URL || 
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/chat`;
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.onConnectionOpen();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(token), this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  onConnectionOpen() {
    this.emit('connected');
  }

  onMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'chat_message':
        this.emit('message', payload);
        break;
      case 'negotiation_update':
        this.emit('negotiation_update', payload);
        break;
      case 'user_joined':
        this.emit('user_joined', payload);
        break;
      case 'user_left':
        this.emit('user_left', payload);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Negotiation-specific methods
  joinNegotiation(negotiationId) {
    this.send('join_negotiation', { negotiationId });
  }

  leaveNegotiation(negotiationId) {
    this.send('leave_negotiation', { negotiationId });
  }

  sendMessage(negotiationId, message) {
    this.send('send_message', { negotiationId, message });
  }

  updateNegotiationStatus(negotiationId, status) {
    this.send('update_status', { negotiationId, status });
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;