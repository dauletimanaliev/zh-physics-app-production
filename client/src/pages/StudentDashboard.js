import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import apiClient from '../services/apiClient';

const StudentDashboard = () => {
  const { user, updateUserXP } = useAuth();
  const { notifications } = useSocket();
  const [progress, setProgress] = useState({
    level: 1,
    xp: 0,
    streak: 0,
    totalTests: 0,
    averageScore: 0,
    rank: 0,
    studyTime: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
    checkBirthday();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading student dashboard data...');
      
      // Get user data from localStorage and AuthContext
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.telegram_id || userData.id || user?.telegram_id || user?.id || 1;
      
      console.log('🆔 Loading dashboard for user ID:', userId);
      
      // Try to get real user profile data
      try {
        const realProfileData = await apiClient.getRealUserProfile(userId);
        
        if (realProfileData && realProfileData.userStats) {
          const userStats = realProfileData.userStats;
          const progressData = {
            level: userStats.level || 1,
            xp: userStats.points || 0,
            streak: userStats.streak || 0,
            totalTests: userStats.tests_completed || 0,
            averageScore: Math.round(userStats.avg_score || 0),
            rank: userStats.rank || 0,
            studyTime: Math.round((userStats.tests_completed || 0) * 0.5)
          };
          
          console.log('✅ Dashboard progress loaded:', progressData);
          setProgress(progressData);
          setAchievements(realProfileData.achievements || []);
        } else {
          console.log('⚠️ No user stats, using default progress');
        }
      } catch (apiError) {
        console.error('❌ API error loading dashboard:', apiError);
        // Keep default progress values
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBirthday = () => {
    if (user?.birth_date) {
      const today = new Date();
      const birthDate = new Date(user.birth_date);
      
      if (today.getMonth() === birthDate.getMonth() && 
          today.getDate() === birthDate.getDate()) {
        setShowBirthdayModal(true);
      }
    }
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '✨';
    return '💫';
  };

  const getLevelInfo = (xp) => {
    const level = Math.floor(xp / 1000) + 1;
    const currentLevelXP = xp % 1000;
    const nextLevelXP = 1000;
    const progress = (currentLevelXP / nextLevelXP) * 100;
    
    return { level, currentLevelXP, nextLevelXP, progress };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  const levelInfo = getLevelInfo(user?.xp || 0);

  return (
    <div className="student-dashboard">
      {/* Birthday Modal */}
      {showBirthdayModal && (
        <div className="birthday-modal">
          <div className="birthday-content">
            <div className="birthday-animation">🎉</div>
            <h2>С Днем Рождения, {user.name}! 🎂</h2>
            <p>Желаем успехов в изучении физики!</p>
            <div className="birthday-gift">
              <p>🎁 Бонус: +100 XP</p>
            </div>
            <button 
              className="birthday-close"
              onClick={() => {
                setShowBirthdayModal(false);
                updateUserXP(100);
              }}
            >
              Спасибо!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="avatar">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="user-details">
            <h1>Привет, {user?.name}! 👋</h1>
            <p className="user-school">{user?.school} • {user?.class} класс</p>
          </div>
        </div>
        
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <span className="stat-value">{user?.xp || 0}</span>
              <span className="stat-label">XP</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">{getStreakEmoji(user?.streak || 0)}</div>
            <div className="stat-info">
              <span className="stat-value">{user?.streak || 0}</span>
              <span className="stat-label">дней подряд</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <span className="stat-value">{levelInfo.level}</span>
              <span className="stat-label">уровень</span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="level-progress">
        <div className="level-info">
          <span>Уровень {levelInfo.level}</span>
          <span>{levelInfo.currentLevelXP}/{levelInfo.nextLevelXP} XP</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${levelInfo.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Быстрые действия</h2>
        <div className="action-grid">
          <div className="action-card" onClick={() => window.location.href = '/materials'}>
            <div className="action-icon">📚</div>
            <h3>Материалы</h3>
            <p>Изучай новые темы</p>
          </div>
          
          <div className="action-card" onClick={() => window.location.href = '/tests'}>
            <div className="action-icon">📝</div>
            <h3>Тесты</h3>
            <p>Проверь знания</p>
          </div>
          
          <div className="action-card" onClick={() => window.location.href = '/schedule'}>
            <div className="action-icon">📅</div>
            <h3>Расписание</h3>
            <p>Планируй время</p>
          </div>
          
          <div className="action-card" onClick={() => window.location.href = '/leaderboard'}>
            <div className="action-icon">🏅</div>
            <h3>Рейтинг</h3>
            <p>Соревнуйся с друзьями</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {progress && (
        <div className="progress-overview">
          <h2>Твой прогресс</h2>
          <div className="subject-progress">
            {progress.progress?.map((subject, index) => (
              <div key={index} className="subject-card">
                <div className="subject-header">
                  <h3>{subject.subject}</h3>
                  <span className="completion-rate">
                    {Math.round(subject.avg_progress || 0)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${subject.avg_progress || 0}%` }}
                  ></div>
                </div>
                <div className="subject-stats">
                  <span>{subject.completed_materials}/{subject.total_materials} материалов</span>
                  <span>{Math.round((subject.total_time || 0) / 60)} мин</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="achievements-section">
          <h2>Последние достижения</h2>
          <div className="achievements-list">
            {achievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="achievement-card">
                <div className="achievement-badge">🏆</div>
                <div className="achievement-info">
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  <span className="achievement-xp">+{achievement.xp_reward} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h2>Уведомления</h2>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="notification-card">
                <div className="notification-icon">
                  {notification.type === 'birthday' && '🎉'}
                  {notification.type === 'message' && '💬'}
                  {notification.type === 'broadcast' && '📢'}
                  {notification.type === 'system' && '⚙️'}
                </div>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
