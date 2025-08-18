import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const StudentQuickActionsPage = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyQuest, setDailyQuest] = useState(null);

  useEffect(() => {
    loadStudentStats();
    loadDailyQuest();
  }, []);

  const loadStudentStats = async () => {
    try {
      if (!user?.id) {
        console.log('🆕 New user - showing zero stats');
        setStats({
          level: 1,
          experience: 0,
          points: 0,
          tests_completed: 0,
          streak: 0,
          avg_score: 0
        });
        return;
      }
      const data = await apiClient.getUserProgress(user.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Mock data fallback
      setStats({
        level: 5,
        experience: 1250,
        nextLevelExp: 1500,
        streak: 7,
        totalPoints: 2850,
        testsCompleted: 23,
        studyTime: 420 // minutes
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyQuest = async () => {
    try {
      const response = await apiClient.getQuests('daily');
      const quests = response.quests || response || [];
      const activeQuest = Array.isArray(quests) ? quests.find(q => !q.completed) : null;
      setDailyQuest(activeQuest);
    } catch (error) {
      console.error('Error loading daily quest:', error);
      // Mock data fallback
      setDailyQuest({
        title: 'Утренняя разминка',
        description: 'Решите 5 задач до 12:00',
        progress: 3,
        maxProgress: 5,
        reward: 50,
        icon: '🌅'
      });
    }
  };

  const quickActions = [
    {
      id: 'physics-test',
      title: 'ИИ Тесты по Физике',
      subtitle: 'Умные вопросы с ИИ',
      icon: '🤖',
      color: '#3b82f6',
      action: () => navigateTo('physics-test')
    },
    {
      id: 'take-test',
      title: 'Пройти тест',
      subtitle: 'Проверить знания',
      icon: '📝',
      color: '#3b82f6',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('tests');
        }
      }
    },
    {
      id: 'study-materials',
      title: 'Изучить материалы',
      subtitle: 'Теория и формулы',
      icon: '📚',
      color: '#10b981',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('materials');
        }
      }
    },
    {
      id: 'view-progress',
      title: 'Мой прогресс',
      subtitle: 'Статистика и достижения',
      icon: '📊',
      color: '#8b5cf6',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('profile');
        }
      }
    },
    {
      id: 'schedule',
      title: 'Расписание занятий',
      subtitle: 'Смотри занятия учителей',
      icon: '📅',
      color: '#06b6d4',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('schedule');
        }
      }
    },
    {
      id: 'daily-quest',
      title: 'Ежедневный квест',
      subtitle: dailyQuest ? `${dailyQuest.progress}/${dailyQuest.maxProgress} выполнено` : 'Загрузка...',
      icon: '🎯',
      color: '#f59e0b',
      action: () => {
        if (window.navigateTo) {
          window.navigateTo('quests');
        }
      }
    }
  ];

  const getProgressPercentage = () => {
    if (!stats) return 0;
    return Math.min((stats.experience / stats.nextLevelExp) * 100, 100);
  };

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
    userDetails: {
      display: 'flex',
      flexDirection: 'column'
    },
    userName: {
      fontSize: '16px',
      fontWeight: '500',
      lineHeight: '1.2'
    },
    userLevel: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: '1.2'
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
    progressSection: {
      marginTop: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    levelInfo: {
      fontSize: '16px',
      fontWeight: '600'
    },
    expInfo: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '16px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #10b981, #34d399)',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px'
    },
    statItem: {
      textAlign: 'center'
    },
    statValue: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    dailyQuestBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      padding: '4px 8px',
      borderRadius: '12px',
      background: 'rgba(245, 158, 11, 0.2)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      fontSize: '12px',
      fontWeight: '500',
      color: '#fbbf24'
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
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'С'}
            </div>
            <div style={pageStyles.userDetails}>
              <div style={pageStyles.userName}>
                {user?.name || 'Студент'}
              </div>
              {stats && (
                <div style={pageStyles.userLevel}>
                  Уровень {stats.level} • {stats.streak} дней
                </div>
              )}
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
                style={{
                  ...pageStyles.actionItem,
                  ...(action.id === 'daily-quest' && dailyQuest ? { position: 'relative' } : {})
                }}
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
                {/* Daily Quest Badge */}
                {action.id === 'daily-quest' && dailyQuest && (
                  <div style={pageStyles.dailyQuestBadge}>
                    +{dailyQuest.reward} ⭐
                  </div>
                )}

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

          {/* Progress Section */}
          {stats && (
            <div style={pageStyles.progressSection}>
              <div style={pageStyles.progressHeader}>
                <div style={pageStyles.levelInfo}>
                  Уровень {stats.level}
                </div>
                <div style={pageStyles.expInfo}>
                  {stats.experience}/{stats.nextLevelExp} XP
                </div>
              </div>
              
              <div style={pageStyles.progressBar}>
                <div 
                  style={{
                    ...pageStyles.progressFill,
                    width: `${getProgressPercentage()}%`
                  }}
                />
              </div>

              <div style={pageStyles.statsGrid}>
                <div style={pageStyles.statItem}>
                  <div style={pageStyles.statValue}>{stats.totalPoints}</div>
                  <div style={pageStyles.statLabel}>Очков</div>
                </div>
                <div style={pageStyles.statItem}>
                  <div style={pageStyles.statValue}>{stats.testsCompleted}</div>
                  <div style={pageStyles.statLabel}>Тестов</div>
                </div>
                <div style={pageStyles.statItem}>
                  <div style={pageStyles.statValue}>{Math.floor(stats.studyTime / 60)}ч</div>
                  <div style={pageStyles.statLabel}>Изучено</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQuickActionsPage;
