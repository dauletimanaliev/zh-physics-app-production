import React, { useState, useEffect } from 'react';
import './NotificationCenter.css';

const NotificationCenter = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchMessages();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/messages`);
      const data = await response.json();
      
      setMessages(data.messages || []);
      setUnreadCount(data.messages?.filter(m => !m.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      default: return '🔵';
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'assignment': return '📚';
      case 'announcement': return '📢';
      case 'reminder': return '⏰';
      case 'grade': return '📊';
      default: return '💬';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="notification-center">
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Уведомления</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : messages.length === 0 ? (
              <div className="no-messages">Нет уведомлений</div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id}
                  className={`notification-item ${!message.is_read ? 'unread' : ''}`}
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  <div className="notification-icons">
                    {getPriorityIcon(message.priority)}
                    {getMessageTypeIcon(message.message_type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">{message.title}</div>
                    <div className="notification-text">{message.content}</div>
                    <div className="notification-meta">
                      <span className="sender">
                        {message.sender_name || 'Система'}
                      </span>
                      <span className="time">
                        {formatDate(message.sent_at)}
                      </span>
                    </div>
                  </div>

                  {!message.is_read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {messages.length > 0 && (
            <div className="notification-footer">
              <button 
                onClick={fetchMessages}
                className="refresh-btn"
              >
                🔄 Обновить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
