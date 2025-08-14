import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    activeStudents: 0, 
    inactiveStudents: 0,
    avgPoints: 0,
    totalTestsTaken: 0,
    avgCompletionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get user data to determine teacher ID
      const savedUser = localStorage.getItem('user');
      let teacherId = 1; // fallback
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        teacherId = userData.telegram_id || userData.id || 1;
      }

      // Get comprehensive real teacher data from new API endpoints
      const realTeacherData = await apiClient.getRealTeacherData(teacherId);
      
      if (realTeacherData.analytics && Object.keys(realTeacherData.analytics).length > 0) {
        // Use real analytics data
        const analytics = realTeacherData.analytics;
        setStats({
          totalStudents: analytics.totalStudents || 0,
          activeStudents: analytics.activeStudents || 0,
          inactiveStudents: (analytics.totalStudents || 0) - (analytics.activeStudents || 0),
          avgPoints: Math.round(analytics.avgClassScore || 0),
          totalTestsTaken: analytics.totalTestsCompleted || 0,
          avgCompletionRate: analytics.avgClassScore || 0
        });

        setRecentActivity(analytics.recentActivity || []);
        setTopPerformers(analytics.topStudents || []);
      } else {
        // Fallback to old API
        const teacherStats = await apiClient.getTeacherStats();
        
        setStats({
          totalStudents: teacherStats.total_students || 0,
          activeStudents: teacherStats.active_students || 0,
          inactiveStudents: teacherStats.inactive_students || 0,
          avgPoints: teacherStats.avg_points || 0,
          totalTestsTaken: teacherStats.total_tests_taken || 0,
          avgCompletionRate: teacherStats.avg_completion_rate || 0
        });

        setRecentActivity(teacherStats.recent_activity || []);
        setTopPerformers(teacherStats.top_performers || []);
      }
      
    } catch (error) {
      console.error('Error loading teacher dashboard data:', error);
      // Final fallback to minimal mock data
      setStats({ 
        totalStudents: 0, 
        activeStudents: 0, 
        inactiveStudents: 0,
        avgPoints: 0,
        totalTestsTaken: 0,
        avgCompletionRate: 0
      });
      setRecentActivity([
        { student: 'Айдар К.', action: 'Завершил тест по механике', score: 85, time: '5 мин назад' },
        { student: 'Студент', action: 'Изучил материал по электричеству', time: '15 мин назад' },
        { student: 'Студент', action: 'Получил достижение "Физик"', time: '1 час назад' }
      ]);
      setTopPerformers([
        { first_name: 'Студент', points: 2850 },
        { first_name: 'Студент', points: 2650 },
        { first_name: 'Амина', points: 2400 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚛️</div>
          <div>Загрузка данных панели учителя...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 5px 0',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>🎓 Панель учителя</h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0',
            fontSize: '16px'
          }}>Добро пожаловать в административную панель физики!</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            color: 'white',
            fontSize: '18px'
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || 'У'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>
              {user?.name || 'Учитель'}
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px'
            }}>Учитель физики</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        padding: '30px',
        marginBottom: '10px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {stats.totalStudents}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            Всего учеников
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {stats.activeStudents}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            Активных учеников
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {stats.totalTestsTaken}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            Тестов пройдено
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚛️</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {Math.round(stats.avgPoints)}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            Средние баллы
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        padding: '0 30px 30px 30px'
      }}>
        {/* Quick Actions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600'
          }}>⚡ Быстрые действия</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quickActions.map((action, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '24px' }}>{action.icon}</div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                    {action.title}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px'
                  }}>
                    {action.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600'
          }}>📈 Последняя активность</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: '600' }}>{activity.student}</div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px'
                  }}>{activity.time}</div>
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  marginBottom: activity.score ? '4px' : '0'
                }}>
                  {activity.action}
                </div>
                {activity.score && (
                  <div style={{
                    color: '#4ade80',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Результат: {activity.score}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
