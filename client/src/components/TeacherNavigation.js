import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LogoutModal from './LogoutModal';

const TeacherNavigation = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'students', icon: '👥', label: 'Ученики' },
    { id: 'materials', icon: '📚', label: 'Материалы' },
    { id: 'messages', icon: '💬', label: 'Сообщения' },
    { id: 'analytics', icon: '📈', label: 'Аналитика' },
    { id: 'profile', icon: '👤', label: 'Профиль' }
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLogoutLoading(true);
      await logout(true); // Delete from database
      setShowLogoutModal(false);
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      color: 'white'
    }}>
      {/* Logo/Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '700'
        }}>⚛️</div>
        <span style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'white'
        }}>Физика</span>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flex: 1,
        justifyContent: 'center'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: activeTab === tab.id 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'transparent',
              border: 'none',
              borderRadius: '12px',
              color: activeTab === tab.id 
                ? 'white' 
                : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* User Info & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || 'У'}
          </div>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {user?.name || 'Учитель'}
          </span>
        </div>
        
        <button
          onClick={handleLogoutClick}
          style={{
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
        >
          Выйти
        </button>
      </div>
      
      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        loading={logoutLoading}
      />
    </nav>
  );
};

export default TeacherNavigation;
