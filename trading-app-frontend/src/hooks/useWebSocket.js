import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import wsService from '../services/websocket';

export const useWebSocket = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        wsService.connect(token);
      }
    } else {
      wsService.disconnect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated]);

  const joinNegotiation = useCallback((negotiationId) => {
    wsService.joinNegotiation(negotiationId);
  }, []);

  const leaveNegotiation = useCallback((negotiationId) => {
    wsService.leaveNegotiation(negotiationId);
  }, []);

  const sendMessage = useCallback((negotiationId, message) => {
    wsService.sendMessage(negotiationId, message);
  }, []);

  const on = useCallback((event, callback) => {
    wsService.on(event, callback);
    
    return () => {
      wsService.off(event, callback);
    };
  }, []);

  return {
    joinNegotiation,
    leaveNegotiation,
    sendMessage,
    on,
    wsService,
  };
};