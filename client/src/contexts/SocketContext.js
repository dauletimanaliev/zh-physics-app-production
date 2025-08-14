import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      initializeSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, user]);

  const initializeSocket = () => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    // Обработка новых сообщений
    newSocket.on('new_message', (message) => {
      addNotification({
        id: Date.now(),
        type: 'message',
        title: 'Новое сообщение',
        message: `От ${message.sender_name}: ${message.content}`,
        timestamp: new Date(),
        data: message
      });
    });

    // Обработка массовых уведомлений
    newSocket.on('broadcast_notification', (notification) => {
      addNotification({
        id: Date.now(),
        type: 'broadcast',
        title: 'Уведомление от учителя',
        message: notification.content,
        timestamp: new Date(),
        data: notification
      });
    });

    // Обработка уведомлений о дне рождения
    newSocket.on('birthday_notification', (notification) => {
      addNotification({
        id: Date.now(),
        type: 'birthday',
        title: '🎉 С Днем Рождения!',
        message: notification.message,
        timestamp: new Date(),
        special: true,
        data: notification
      });
    });

    // Системные уведомления
    newSocket.on('system_notification', (notification) => {
      addNotification({
        id: Date.now(),
        type: 'system',
        title: 'Системное уведомление',
        message: notification.message,
        timestamp: new Date(),
        data: notification
      });
    });

    // Обновления прогресса (для учителей)
    newSocket.on('student_progress_update', (update) => {
      if (user.role === 'teacher' || user.role === 'admin') {
        addNotification({
          id: Date.now(),
          type: 'progress',
          title: 'Обновление прогресса',
          message: `${update.student_name} обновил прогресс: ${update.progress_percentage}%`,
          timestamp: new Date(),
          data: update
        });
      }
    });

    setSocket(newSocket);
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.png'
      });
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const sendMessage = (recipientId, content, type = 'text') => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        recipient_id: recipientId,
        content,
        type
      });
    }
  };

  const broadcastMessage = (content, targetGroup = 'all', type = 'text') => {
    if (socket && isConnected) {
      socket.emit('broadcast_message', {
        content,
        target_group: targetGroup,
        type
      });
    }
  };

  const updateProgress = (materialId, progressPercentage) => {
    if (socket && isConnected) {
      socket.emit('progress_update', {
        material_id: materialId,
        progress_percentage: progressPercentage
      });
    }
  };

  const value = {
    socket,
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    sendMessage,
    broadcastMessage,
    updateProgress
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
