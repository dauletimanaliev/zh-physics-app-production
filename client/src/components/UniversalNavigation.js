import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LogoutModal from './LogoutModal';

const UniversalNavigation = ({ activeTab, onTabChange, userRole = 'student' }) => {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Different navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { id: 'profile', icon: '👤', label: 'Профиль' }
    ];

    if (userRole === 'student') {
      return [
        { id: 'dashboard', icon: '🏠', label: 'Главная' },
        { id: 'tests', icon: '📝', label: 'Тесты' },
        { id: 'materials', icon: '📚', label: 'Материалы' },
        { id: 'schedule', icon: '📅', label: 'Расписание' },
        { id: 'leaderboard', icon: '🏆', label: 'Рейтинг' },
        { id: 'tasks', icon: '✅', label: 'Задания' },
        ...commonItems
      ];
    } else if (userRole === 'teacher' || userRole === 'admin') {
      return [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'students', icon: '👥', label: 'Ученики' },
        { id: 'materials', icon: '📚', label: 'Материалы' },
        { id: 'messages', icon: '💬', label: 'Сообщения' },
        { id: 'schedule', icon: '📅', label: 'Расписание' },
        { id: 'analytics', icon: '📈', label: 'Аналитика' },
        ...commonItems
      ];
    }
    return commonItems;
  };

  const navItems = getNavigationItems();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (tabId) => {
    onTabChange(tabId);
    setIsMenuOpen(false); // Close mobile menu after selection
  };

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

  const navStyles = {
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '12px 16px' : '12px 24px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: isMobile ? '16px' : '18px',
      fontWeight: '600'
    },
    logo: {
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: '700'
    },
    navItems: {
      display: isMobile ? 'none' : 'flex',
      gap: '8px',
      flex: 1,
      justifyContent: 'center',
      maxWidth: '800px'
    },
    mobileNavItems: {
      display: isMenuOpen ? 'flex' : 'none',
      flexDirection: 'column',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '16px',
      gap: '8px'
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: isMobile ? '12px 16px' : '10px 16px',
      background: 'transparent',
      border: 'none',
      borderRadius: '12px',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      width: isMobile ? '100%' : 'auto',
      justifyContent: isMobile ? 'flex-start' : 'center'
    },
    activeNavItem: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '16px'
    },
    userInfo: {
      display: isMobile ? 'none' : 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      minWidth: '40px',
      minHeight: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600',
      color: 'white',
      marginRight: '12px',
      aspectRatio: '1',
      flexShrink: 0,
      boxSizing: 'border-box'
    },
    userName: {
      fontSize: '14px',
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.9)'
    },
    logoutBtn: {
      padding: isMobile ? '6px 10px' : '8px 12px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: 'rgba(255, 255, 255, 0.8)',
      cursor: 'pointer',
      fontSize: isMobile ? '11px' : '12px',
      transition: 'all 0.3s ease'
    },
    mobileMenuBtn: {
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '16px'
    }
  };

  return (
    <nav style={navStyles.nav}>
      {/* Brand/Logo */}
      <div style={navStyles.brand}>
        <div style={navStyles.logo}>⚛️</div>
        <span>Физика</span>
      </div>

      {/* Desktop Navigation */}
      <div style={navStyles.navItems}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            style={{
              ...navStyles.navItem,
              ...(activeTab === item.id ? navStyles.activeNavItem : {})
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Navigation */}
      <div style={navStyles.mobileNavItems}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            style={{
              ...navStyles.navItem,
              ...(activeTab === item.id ? navStyles.activeNavItem : {})
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* User Section */}
      <div style={navStyles.userSection}>
        <div style={navStyles.userInfo}>
          <div style={navStyles.avatar}>
            {user?.name?.split(' ').map(n => n[0]).join('') || 'У'}
          </div>
          <span style={navStyles.userName}>
            {user?.name || 'Пользователь'}
          </span>
        </div>
        
        <button
          onClick={handleLogoutClick}
          style={navStyles.logoutBtn}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
        >
          {isMobile ? '🚪' : 'Выйти'}
        </button>

        {/* Mobile Menu Button */}
        <button
          style={navStyles.mobileMenuBtn}
          onClick={toggleMenu}
        >
          {isMenuOpen ? '✕' : '☰'}
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

export default UniversalNavigation;
