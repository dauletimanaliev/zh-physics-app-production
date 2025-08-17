import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const QuickActionsPage = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading real teacher stats...');
      
      // Try to get real teacher stats from API
      const data = await apiClient.getTeacherStats();
      console.log('✅ Real teacher stats loaded:', data);
      
      setStats({
        totalStudents: data.totalStudents || 0,
        activeTests: data.activeTests || 0,
        newMessages: data.newMessages || 0,
        pendingReports: data.pendingReports || 0
      });
    } catch (error) {
      console.error('❌ Error loading teacher stats:', error);
      
      // Initialize with zero values instead of mock data
      setStats({
        totalStudents: 0,
        activeTests: 0,
        newMessages: 0,
        pendingReports: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      id: 'create-test',
      title: 'Создать тест',
      subtitle: 'Новый тест по физике',
      icon: '📝',
      color: '#3b82f6',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('tests');
        }
      }
    },
    {
      id: 'add-material',
      title: 'Добавить материал',
      subtitle: 'Загрузить урок',
      icon: '📚',
      color: '#10b981',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('materials');
        }
      }
    },
    {
      id: 'create-schedule',
      title: 'Создать расписание',
      subtitle: 'Новое расписание',
      icon: '📅',
      color: '#ef4444',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('schedule');
        }
      }
    },
    {
      id: 'view-reports',
      title: 'Посмотреть отчеты',
      subtitle: 'Аналитика класса',
      icon: '📊',
      color: '#8b5cf6',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('admin');
        }
      }
    },
    {
      id: 'send-message',
      title: 'Отправить сообщение',
      subtitle: 'Уведомить учеников',
      icon: '💬',
      color: '#f59e0b',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('admin');
        }
      }
    }
  ];

  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      padding: '0 10px'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '24px',
      fontWeight: '700'
    },
    atomIcon: {
      fontSize: '32px'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease'
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600'
    },
    userName: {
      fontSize: '16px',
      fontWeight: '500'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%'
    },
    quickActionsCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      width: '100%',
      maxWidth: '600px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '30px'
    },
    cardTitle: {
      fontSize: '28px',
      fontWeight: '700',
      margin: 0
    },
    lightningIcon: {
      fontSize: '32px'
    },
    actionsGrid: {
      display: 'grid',
      gap: '16px'
    },
    actionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '20px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    actionIcon: {
      fontSize: '40px',
      minWidth: '60px',
      textAlign: 'center'
    },
    actionContent: {
      flex: 1
    },
    actionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '4px',
      lineHeight: '1.3'
    },
    actionSubtitle: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: '1.4'
    },
    actionArrow: {
      fontSize: '20px',
      color: 'rgba(255, 255, 255, 0.5)',
      transition: 'all 0.3s ease'
    },
    statsBar: {
      display: 'flex',
      justifyContent: 'space-around',
      marginTop: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    statItem: {
      textAlign: 'center'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      fontSize: '18px'
    },
    logoutButton: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#fca5a5',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      marginLeft: '12px'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚛️</div>
            <div>Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <div style={pageStyles.logo}>
          <span style={pageStyles.atomIcon}>⚛️</span>
          <span>Физика</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={pageStyles.userInfo}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={pageStyles.avatar}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'У'}
            </div>
            <div style={pageStyles.userName}>
              {user?.name || 'Учитель'}
            </div>
          </div>
          
          <button
            style={pageStyles.logoutButton}
            onClick={logout}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={pageStyles.mainContent}>
        <div style={pageStyles.quickActionsCard}>
          {/* Card Header */}
          <div style={pageStyles.cardHeader}>
            <span style={pageStyles.lightningIcon}>⚡</span>
            <h1 style={pageStyles.cardTitle}>Быстрые действия</h1>
          </div>

          {/* Actions Grid */}
          <div style={pageStyles.actionsGrid}>
            {quickActions.map((action, index) => (
              <div
                key={action.id}
                style={pageStyles.actionItem}
                onClick={action.action}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                  const arrow = e.currentTarget.querySelector('.action-arrow');
                  if (arrow) {
                    arrow.style.transform = 'translateX(4px)';
                    arrow.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  const arrow = e.currentTarget.querySelector('.action-arrow');
                  if (arrow) {
                    arrow.style.transform = 'translateX(0)';
                    arrow.style.color = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
              >
                <div style={{
                  ...pageStyles.actionIcon,
                  color: action.color
                }}>
                  {action.icon}
                </div>
                
                <div style={pageStyles.actionContent}>
                  <div style={pageStyles.actionTitle}>{action.title}</div>
                  <div style={pageStyles.actionSubtitle}>{action.subtitle}</div>
                </div>
                
                <div 
                  className="action-arrow"
                  style={pageStyles.actionArrow}
                >
                  →
                </div>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          {stats && (
            <div style={pageStyles.statsBar}>
              <div style={pageStyles.statItem}>
                <div style={pageStyles.statValue}>{stats.totalStudents}</div>
                <div style={pageStyles.statLabel}>Учеников</div>
              </div>
              <div style={pageStyles.statItem}>
                <div style={pageStyles.statValue}>{stats.activeTests}</div>
                <div style={pageStyles.statLabel}>Активных тестов</div>
              </div>
              <div style={pageStyles.statItem}>
                <div style={pageStyles.statValue}>{stats.newMessages}</div>
                <div style={pageStyles.statLabel}>Новых сообщений</div>
              </div>
              <div style={pageStyles.statItem}>
                <div style={pageStyles.statValue}>{stats.pendingReports}</div>
                <div style={pageStyles.statLabel}>Отчетов</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPage;
