import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import TestManagement from './teacher/TestManagement';
import StudentManagement from './teacher/StudentManagement';
import MaterialManagement from './teacher/MaterialManagement';
import TestCreationDebug from '../components/TestCreationDebug';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Check URL parameters for direct navigation
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      setCurrentView(viewParam);
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load teacher statistics
      const teacherStats = await apiClient.getTeacherStats();
      setStatistics(teacherStats);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Fallback mock data
      setStatistics({
        totalStudents: 25,
        totalTests: 8,
        totalMaterials: 15,
        activeStudents: 18,
        averageScore: 78,
        completedTests: 156
      });
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Обзор', icon: '📊' },
    { id: 'students', name: 'Студенты', icon: '👥' },
    { id: 'materials', name: 'Материалы', icon: '📚' },
    { id: 'schedule', name: 'Расписание', icon: '📅' },
    { id: 'analytics', name: 'Аналитика', icon: '📈' }
  ];

  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white'
    },
    sidebar: {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '250px',
      height: '100vh',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '20px',
      zIndex: 100
    },
    logo: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '30px',
      textAlign: 'center',
      padding: '15px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '15px'
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 15px',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    navItemActive: {
      background: 'rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    },
    mainContent: {
      marginLeft: '250px',
      padding: '20px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 10px 0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.8)',
      margin: '0'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      textAlign: 'center',
      transition: 'all 0.3s ease'
    },
    statIcon: {
      fontSize: '32px',
      marginBottom: '15px'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      display: 'block',
      marginBottom: '5px'
    },
    statLabel: {
      fontSize: '14px',
      opacity: 0.8
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px'
    },
    actionCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    actionIcon: {
      fontSize: '48px',
      marginBottom: '15px'
    },
    actionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '10px'
    },
    actionDescription: {
      fontSize: '14px',
      opacity: 0.8,
      lineHeight: '1.5'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Загрузка панели учителя...</h2>
        </div>
      </div>
    );
  }

  // Render TestManagement if testManagement view is selected
  if (currentView === 'testManagement') {
    return <TestManagement />;
  }

  // Render StudentManagement if students view is selected
  if (currentView === 'students') {
    return <StudentManagement />;
  }

  // Render MaterialManagement if materials view is selected
  if (currentView === 'materials') {
    return <MaterialManagement />;
  }

  return (
    <div style={pageStyles.container}>
      {/* Sidebar Navigation */}
      <div style={pageStyles.sidebar}>
        <div style={pageStyles.logo}>
          🎓 Учитель Физики
        </div>
        
        {navigationItems.map(item => (
          <div
            key={item.id}
            style={{
              ...pageStyles.navItem,
              ...(currentView === item.id ? pageStyles.navItemActive : {})
            }}
            onClick={() => setCurrentView(item.id)}
            onMouseEnter={(e) => {
              if (currentView !== item.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== item.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={pageStyles.mainContent}>
        {/* Header */}
        <div style={pageStyles.header}>
          <h1 style={pageStyles.title}>👋 Добро пожаловать, {user?.name}!</h1>
          <p style={pageStyles.subtitle}>Панель управления для учителя физики</p>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div style={pageStyles.statsGrid}>
            <div
              style={pageStyles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={pageStyles.statIcon}>👥</div>
              <span style={pageStyles.statValue}>{statistics.totalStudents}</span>
              <span style={pageStyles.statLabel}>Всего студентов</span>
            </div>

            <div
              style={pageStyles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={pageStyles.statIcon}>📝</div>
              <span style={pageStyles.statValue}>{statistics.totalTests}</span>
              <span style={pageStyles.statLabel}>Создано тестов</span>
            </div>

            <div
              style={pageStyles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={pageStyles.statIcon}>✅</div>
              <span style={pageStyles.statValue}>{statistics.completedTests}</span>
              <span style={pageStyles.statLabel}>Пройдено тестов</span>
            </div>

            <div
              style={pageStyles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={pageStyles.statIcon}>📊</div>
              <span style={pageStyles.statValue}>{statistics.averageScore}%</span>
              <span style={pageStyles.statLabel}>Средний балл</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={pageStyles.quickActions}>
          <div
            style={pageStyles.actionCard}
            onClick={() => setCurrentView('testManagement')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={pageStyles.actionIcon}>📝</div>
            <div style={pageStyles.actionTitle}>Управление тестами</div>
            <div style={pageStyles.actionDescription}>
              Создавайте и редактируйте тесты, добавляйте вопросы с вариантами ответов
            </div>
          </div>

          <div
            style={pageStyles.actionCard}
            onClick={() => setCurrentView('students')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={pageStyles.actionIcon}>👥</div>
            <div style={pageStyles.actionTitle}>Управление студентами</div>
            <div style={pageStyles.actionDescription}>
              Просматривайте прогресс студентов и анализируйте их результаты
            </div>
          </div>

          <div
            style={pageStyles.actionCard}
            onClick={() => setCurrentView('materials')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={pageStyles.actionIcon}>📚</div>
            <div style={pageStyles.actionTitle}>Учебные материалы</div>
            <div style={pageStyles.actionDescription}>
              Создавайте и организуйте учебные материалы по физике
            </div>
          </div>

          <div
            style={pageStyles.actionCard}
            onClick={() => setCurrentView('analytics')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={pageStyles.actionIcon}>📈</div>
            <div style={pageStyles.actionTitle}>Аналитика</div>
            <div style={pageStyles.actionDescription}>
              Анализируйте успеваемость и прогресс ваших студентов
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Component for Test Creation */}
      <TestCreationDebug />
    </div>
  );
};

export default TeacherDashboard;
