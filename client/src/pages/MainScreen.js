import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import './MainScreen.css';

const MainScreen = ({ user }) => {
  const [userStats, setUserStats] = useState({
    points: 70,
    level: 1,
    testsCompleted: 3,
    streak: 2,
    rank: 'Бастаушы'
  });
  const [greeting, setGreeting] = useState('');
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Доброе утро');
    } else if (hour < 18) {
      setGreeting('Добрый день');
    } else {
      setGreeting('Добрый вечер');
    }

    // Check for birthday
    checkBirthday();
  }, []);

  const checkBirthday = () => {
    if (user?.birthDate) {
      const today = new Date();
      const birthDate = new Date(user.birthDate);
      
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

  const getLevelInfo = (points) => {
    const level = Math.floor(points / 100) + 1;
    const progress = (points % 100);
    return { level, progress };
  };

  const levelInfo = getLevelInfo(userStats.points);

  return (
    <div className="main-screen">
      {/* Header Section */}
      <div className="header-section">
        <div className="user-greeting">
          <div className="avatar-container">
            <div className="user-avatar">
              <span>{user?.firstName?.charAt(0) || 'У'}</span>
            </div>
            <div className="level-badge">{levelInfo.level}</div>
          </div>
          <div className="greeting-text">
            <h1>{greeting}, {user?.firstName || 'Ученик'}! 👋</h1>
            {user?.role === 'teacher' ? (
              <p className="user-school">Преподаватель физики • {user?.subjects?.join(', ') || 'Физика'}</p>
            ) : (
              <p className="user-school">{user?.school || 'Школа №1'} • {user?.grade || '11'} класс</p>
            )}
          </div>
        </div>
        
        <div className="level-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${levelInfo.progress}%` }}></div>
          </div>
          <span className="progress-text">{userStats.points} XP / {levelInfo.level * 100} XP</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card points-card">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <span className="card-value">{userStats.points}</span>
            <span className="card-label">Ұпай</span>
          </div>
        </div>
        
        <div className="stat-card rank-card">
          <div className="card-icon">🏆</div>
          <div className="card-content">
            <span className="card-value">{userStats.rank}</span>
            <span className="card-label">Рейтинг</span>
          </div>
        </div>
        
        <div className="stat-card tests-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="card-value">{userStats.testsCompleted}</span>
            <span className="card-label">Тест</span>
          </div>
        </div>
        
        <div className="stat-card streak-card">
          <div className="card-icon">{getStreakEmoji(userStats.streak)}</div>
          <div className="card-content">
            <span className="card-value">{userStats.streak}</span>
            <span className="card-label">Күн қатарынан</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">📝 Тестілеу</h3>
        <div className="action-card">
          <div className="action-icon">📝</div>
          <div className="action-content">
            <h4>Физика бойынша тест</h4>
            <p>15 сұрақ • 20 минут</p>
          </div>
          <button className="action-button">Бастау</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3 className="section-title">📈 Соңғы белсенділік</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-text">
              <span>Математика тестін аяқтадыңыз</span>
              <small>2 сағат бұрын</small>
            </div>
            <div className="activity-points">+15 XP</div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">🎯</div>
            <div className="activity-text">
              <span>Күнделікті квест орындалды</span>
              <small>1 күн бұрын</small>
            </div>
            <div className="activity-points">+25 XP</div>
          </div>
        </div>
      </div>

      {/* Birthday Modal */}
      {showBirthdayModal && (
        <div className="birthday-modal">
          <div className="modal-content">
            <div className="birthday-animation">🎉</div>
            <h2>С Днем Рождения! 🎂</h2>
            <p>Желаем успехов в изучении физики!</p>
            <div className="birthday-reward">
              <span className="reward-icon">🎁</span>
              <span>+100 бонусных очков!</span>
            </div>
            <button 
              className="birthday-close"
              onClick={() => setShowBirthdayModal(false)}
            >
              Спасибо! ✨
            </button>
          </div>
        </div>
      )}

      <BottomNavbar />
    </div>
  );
};

export default MainScreen;
