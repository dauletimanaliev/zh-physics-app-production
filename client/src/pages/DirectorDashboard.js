import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const DirectorDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadDirectorData();
  }, []);

  const loadDirectorData = async () => {
    try {
      setLoading(true);
      const [statsData, teachersData, studentsData, analyticsData] = await Promise.all([
        apiClient.getDirectorStats(),
        apiClient.getAllTeachers(),
        apiClient.getAllStudents(),
        apiClient.getSystemAnalytics()
      ]);

      setStats(statsData);
      setTeachers(teachersData);
      setStudents(studentsData);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading director data:', error);
      // Fallback mock data
      setStats({
        totalStudents: 1250,
        totalTeachers: 45,
        activeTests: 28,
        completedTests: 156,
        totalMaterials: 89,
        systemUptime: 99.8,
        monthlyGrowth: 15.2,
        averageScore: 78.5
      });

      setTeachers([
        {
          id: 1,
          name: 'Асель Нурланова',
          email: 'asel.n@school.kz',
          studentsCount: 85,
          testsCreated: 12,
          averageStudentScore: 82,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active'
        },
        {
          id: 2,
          name: 'Данияр Жанибеков',
          email: 'daniiar.zh@school.kz',
          studentsCount: 72,
          testsCreated: 8,
          averageStudentScore: 79,
          lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000),
          status: 'active'
        },
        {
          id: 3,
          name: 'Гульнара Сейтова',
          email: 'gulnara.s@school.kz',
          studentsCount: 68,
          testsCreated: 15,
          averageStudentScore: 85,
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'inactive'
        }
      ]);

      setStudents([
        { grade: '9', count: 320, averageScore: 75 },
        { grade: '10', count: 410, averageScore: 78 },
        { grade: '11', count: 520, averageScore: 82 }
      ]);

      setAnalytics({
        dailyActiveUsers: [45, 52, 48, 61, 55, 58, 62],
        testCompletions: [12, 15, 18, 14, 20, 16, 22],
        topPerformingClasses: [
          { name: '11А', teacher: 'Асель Нурланова', averageScore: 88 },
          { name: '10Б', teacher: 'Гульнара Сейтова', averageScore: 85 },
          { name: '11В', teacher: 'Данияр Жанибеков', averageScore: 83 }
        ]
      });

      setNotifications([
        {
          id: 1,
          type: 'warning',
          title: 'Низкая активность',
          message: 'Учитель Гульнара Сейтова не заходила в систему 24 часа',
          time: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 2,
          type: 'success',
          title: 'Новый рекорд',
          message: 'Класс 11А показал лучший результат за месяц - 88%',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 3,
          type: 'info',
          title: 'Системное обновление',
          message: 'Запланировано обновление системы на завтра в 02:00',
          time: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ]);

    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'overview', name: 'Обзор', icon: '📊' },
    { id: 'teachers', name: 'Учителя', icon: '👨‍🏫' },
    { id: 'students', name: 'Ученики', icon: '👨‍🎓' },
    { id: 'analytics', name: 'Аналитика', icon: '📈' },
    { id: 'system', name: 'Система', icon: '⚙️' },
    { id: 'reports', name: 'Отчеты', icon: '📋' }
  ];

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} дн. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    return 'Только что';
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning': return '#f59e0b';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
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
      gap: '12px'
    },
    avatar: {
      width: '40px',
      height: '40px',
      minWidth: '40px',
      minHeight: '40px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600',
      marginRight: '12px',
      aspectRatio: '1',
      flexShrink: 0,
      boxSizing: 'border-box'
    },
    userDetails: {
      display: 'flex',
      flexDirection: 'column'
    },
    userName: {
      fontSize: '18px',
      fontWeight: '600',
      lineHeight: '1.2'
    },
    userRole: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: '1.2'
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
      marginLeft: '16px'
    },
    navigation: {
      display: 'flex',
      gap: '12px',
      marginBottom: '30px',
      overflowX: 'auto',
      padding: '0 10px'
    },
    navItem: {
      padding: '12px 20px',
      borderRadius: '25px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap'
    },
    activeNavItem: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    content: {
      display: 'grid',
      gap: '20px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    statLabel: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '4px'
    },
    statChange: {
      fontSize: '12px',
      fontWeight: '500'
    },
    positiveChange: {
      color: '#10b981'
    },
    negativeChange: {
      color: '#ef4444'
    },
    sectionCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    teachersList: {
      display: 'grid',
      gap: '12px'
    },
    teacherItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    teacherAvatar: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600'
    },
    teacherInfo: {
      flex: 1
    },
    teacherName: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    teacherEmail: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '4px'
    },
    teacherStats: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    activeStatus: {
      background: 'rgba(16, 185, 129, 0.2)',
      color: '#34d399'
    },
    inactiveStatus: {
      background: 'rgba(107, 114, 128, 0.2)',
      color: '#9ca3af'
    },
    notificationsList: {
      display: 'grid',
      gap: '12px'
    },
    notificationItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    notificationIcon: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginTop: '6px'
    },
    notificationContent: {
      flex: 1
    },
    notificationTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    notificationMessage: {
      fontSize: '13px',
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: '1.4',
      marginBottom: '4px'
    },
    notificationTime: {
      fontSize: '11px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    analyticsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    chartPlaceholder: {
      height: '200px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      flexWrap: 'wrap'
    },
    actionButton: {
      padding: '10px 20px',
      borderRadius: '20px',
      border: 'none',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '18px'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>👨‍💼</div>
            <div>Загрузка панели директора...</div>
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div style={pageStyles.content}>
      {/* Stats Grid */}
      <div style={pageStyles.statsGrid}>
        <div style={pageStyles.statCard}>
          <div style={pageStyles.statValue}>{stats.totalStudents}</div>
          <div style={pageStyles.statLabel}>Всего учеников</div>
          <div style={{ ...pageStyles.statChange, ...pageStyles.positiveChange }}>
            +{stats.monthlyGrowth}% за месяц
          </div>
        </div>
        <div style={pageStyles.statCard}>
          <div style={pageStyles.statValue}>{stats.totalTeachers}</div>
          <div style={pageStyles.statLabel}>Учителей</div>
          <div style={{ ...pageStyles.statChange, ...pageStyles.positiveChange }}>
            +2 за месяц
          </div>
        </div>
        <div style={pageStyles.statCard}>
          <div style={pageStyles.statValue}>{stats.averageScore}%</div>
          <div style={pageStyles.statLabel}>Средний балл</div>
          <div style={{ ...pageStyles.statChange, ...pageStyles.positiveChange }}>
            +3.2% за месяц
          </div>
        </div>
        <div style={pageStyles.statCard}>
          <div style={pageStyles.statValue}>{stats.systemUptime}%</div>
          <div style={pageStyles.statLabel}>Время работы</div>
          <div style={{ ...pageStyles.statChange, ...pageStyles.positiveChange }}>
            Стабильно
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div style={pageStyles.sectionCard}>
        <div style={pageStyles.sectionTitle}>
          <span>🔔</span>
          <span>Последние уведомления</span>
        </div>
        <div style={pageStyles.notificationsList}>
          {notifications.slice(0, 5).map(notification => (
            <div key={notification.id} style={pageStyles.notificationItem}>
              <div style={{
                ...pageStyles.notificationIcon,
                background: getNotificationColor(notification.type)
              }} />
              <div style={pageStyles.notificationContent}>
                <div style={pageStyles.notificationTitle}>{notification.title}</div>
                <div style={pageStyles.notificationMessage}>{notification.message}</div>
                <div style={pageStyles.notificationTime}>{getTimeAgo(notification.time)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeachers = () => (
    <div style={pageStyles.sectionCard}>
      <div style={pageStyles.sectionTitle}>
        <span>👨‍🏫</span>
        <span>Управление учителями</span>
      </div>
      <div style={pageStyles.teachersList}>
        {teachers.map(teacher => (
          <div key={teacher.id} style={pageStyles.teacherItem}>
            <div style={pageStyles.teacherAvatar}>
              {teacher.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={pageStyles.teacherInfo}>
              <div style={pageStyles.teacherName}>{teacher.name}</div>
              <div style={pageStyles.teacherEmail}>{teacher.email}</div>
              <div style={pageStyles.teacherStats}>
                {teacher.studentsCount} учеников • {teacher.testsCreated} тестов • 
                средний балл {teacher.averageStudentScore}%
              </div>
            </div>
            <div style={{
              ...pageStyles.statusBadge,
              ...(teacher.status === 'active' ? pageStyles.activeStatus : pageStyles.inactiveStatus)
            }}>
              {teacher.status === 'active' ? 'Активен' : 'Неактивен'}
            </div>
          </div>
        ))}
      </div>
      <div style={pageStyles.actionButtons}>
        <button style={pageStyles.actionButton}>+ Добавить учителя</button>
        <button style={pageStyles.actionButton}>📊 Отчет по учителям</button>
        <button style={pageStyles.actionButton}>✉️ Отправить уведомление</button>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div style={pageStyles.analyticsGrid}>
      <div style={pageStyles.sectionCard}>
        <div style={pageStyles.sectionTitle}>
          <span>📈</span>
          <span>Активность пользователей</span>
        </div>
        <div style={pageStyles.chartPlaceholder}>
          График активности за неделю
        </div>
      </div>
      <div style={pageStyles.sectionCard}>
        <div style={pageStyles.sectionTitle}>
          <span>📝</span>
          <span>Выполнение тестов</span>
        </div>
        <div style={pageStyles.chartPlaceholder}>
          График выполнения тестов
        </div>
      </div>
      <div style={pageStyles.sectionCard}>
        <div style={pageStyles.sectionTitle}>
          <span>🏆</span>
          <span>Лучшие классы</span>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {analytics?.topPerformingClasses.map((classInfo, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ fontWeight: '600' }}>{classInfo.name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {classInfo.teacher}
                </div>
              </div>
              <div style={{ fontWeight: '700', color: '#10b981' }}>
                {classInfo.averageScore}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'teachers': return renderTeachers();
      case 'analytics': return renderAnalytics();
      case 'students':
        return (
          <div style={pageStyles.sectionCard}>
            <div style={pageStyles.sectionTitle}>
              <span>👨‍🎓</span>
              <span>Статистика по ученикам</span>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {students.map((grade, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{grade.grade} класс</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {grade.count} учеников
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {grade.averageScore}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      средний балл
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div style={pageStyles.sectionCard}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <h3>Раздел в разработке</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Этот функционал будет доступен в следующем обновлении
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <div style={pageStyles.logo}>
          <span style={pageStyles.atomIcon}>⚛️</span>
          <span>Физика - Панель директора</span>
        </div>
        
        <div style={pageStyles.userInfo}>
          <div style={pageStyles.avatar}>
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'Д'}
          </div>
          <div style={pageStyles.userDetails}>
            <div style={pageStyles.userName}>
              {user?.name || 'Директор'}
            </div>
            <div style={pageStyles.userRole}>Администратор системы</div>
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

      {/* Navigation */}
      <div style={pageStyles.navigation}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              ...pageStyles.navItem,
              ...(activeSection === section.id ? pageStyles.activeNavItem : {})
            }}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <span>{section.icon}</span>
            <span>{section.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default DirectorDashboard;
