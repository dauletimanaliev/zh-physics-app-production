import React, { useState, useEffect } from 'react';
import './EnhancedLeaderboard.css';

const EnhancedLeaderboard = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('points');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeRange, sortBy]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?limit=20`);
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  const getProgressLevel = (points) => {
    if (points >= 1000) return 'Эксперт';
    if (points >= 500) return 'Продвинутый';
    if (points >= 200) return 'Средний';
    if (points >= 50) return 'Начинающий';
    return 'Новичок';
  };

  const getLevelColor = (points) => {
    if (points >= 1000) return '#6f42c1';
    if (points >= 500) return '#007bff';
    if (points >= 200) return '#28a745';
    if (points >= 50) return '#ffc107';
    return '#6c757d';
  };

  const sortLeaderboard = (data) => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points;
        case 'materials':
          return b.materials_viewed - a.materials_viewed;
        case 'tests':
          return b.tests_completed - a.tests_completed;
        case 'average':
          return (b.avg_test_score || 0) - (a.avg_test_score || 0);
        default:
          return b.points - a.points;
      }
    });
  };

  const sortedLeaderboard = sortLeaderboard(leaderboard);

  if (loading) {
    return (
      <div className="enhanced-leaderboard loading">
        <div className="loading-spinner"></div>
        <p>Загрузка рейтинга...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-leaderboard">
      <div className="leaderboard-header">
        <h3>🏆 Рейтинг учеников</h3>
        <div className="leaderboard-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="points">По баллам</option>
            <option value="materials">По материалам</option>
            <option value="tests">По тестам</option>
            <option value="average">По среднему баллу</option>
          </select>
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="all">Все время</option>
            <option value="month">За месяц</option>
            <option value="week">За неделю</option>
          </select>
        </div>
      </div>

      {sortedLeaderboard.length === 0 ? (
        <div className="no-data">
          <p>Пока нет данных для рейтинга</p>
          <p>Начните изучать материалы и проходить тесты!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="podium">
            {sortedLeaderboard.slice(0, 3).map((user, index) => (
              <div 
                key={user.id} 
                className={`podium-place place-${index + 1} ${user.id === currentUserId ? 'current-user' : ''}`}
              >
                <div className="podium-avatar">
                  <div className="avatar-circle" style={{ backgroundColor: getLevelColor(user.points) }}>
                    {(user.first_name || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="rank-badge">{getRankIcon(index + 1)}</div>
                </div>
                <div className="podium-info">
                  <div className="user-name">
                    {user.first_name || user.username || 'Пользователь'}
                  </div>
                  <div className="user-level">{getProgressLevel(user.points)}</div>
                  <div className="user-points">{user.points} баллов</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed List */}
          <div className="leaderboard-list">
            <div className="list-header">
              <div className="header-rank">Место</div>
              <div className="header-user">Ученик</div>
              <div className="header-stats">Статистика</div>
              <div className="header-progress">Прогресс</div>
            </div>

            {sortedLeaderboard.map((user, index) => (
              <div 
                key={user.id}
                className={`leaderboard-item ${user.id === currentUserId ? 'current-user' : ''}`}
              >
                <div className="item-rank">
                  <span className="rank-number">{getRankIcon(index + 1)}</span>
                </div>

                <div className="item-user">
                  <div className="user-avatar" style={{ backgroundColor: getLevelColor(user.points) }}>
                    {(user.first_name || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.first_name || user.username || 'Пользователь'}
                      {user.id === currentUserId && <span className="you-badge">Вы</span>}
                    </div>
                    <div className="user-level" style={{ color: getLevelColor(user.points) }}>
                      {getProgressLevel(user.points)}
                    </div>
                  </div>
                </div>

                <div className="item-stats">
                  <div className="stat-item">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value">{user.points}</span>
                    <span className="stat-label">баллов</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📚</span>
                    <span className="stat-value">{user.materials_viewed || 0}</span>
                    <span className="stat-label">материалов</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value">{user.tests_completed || 0}</span>
                    <span className="stat-label">тестов</span>
                  </div>
                </div>

                <div className="item-progress">
                  {user.avg_test_score > 0 && (
                    <div className="progress-circle">
                      <div className="circle-progress" style={{
                        background: `conic-gradient(${getLevelColor(user.points)} ${user.avg_test_score * 3.6}deg, #e9ecef 0deg)`
                      }}>
                        <div className="circle-inner">
                          <span className="progress-value">{Math.round(user.avg_test_score)}%</span>
                        </div>
                      </div>
                      <div className="progress-label">Средний балл</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current User Position (if not in top 10) */}
          {currentUserId && !sortedLeaderboard.slice(0, 10).find(u => u.id === currentUserId) && (
            <div className="current-user-position">
              {(() => {
                const userIndex = sortedLeaderboard.findIndex(u => u.id === currentUserId);
                if (userIndex >= 0) {
                  const user = sortedLeaderboard[userIndex];
                  return (
                    <div className="user-position-card">
                      <div className="position-header">Ваша позиция</div>
                      <div className="leaderboard-item current-user">
                        <div className="item-rank">
                          <span className="rank-number">{getRankIcon(userIndex + 1)}</span>
                        </div>
                        <div className="item-user">
                          <div className="user-avatar" style={{ backgroundColor: getLevelColor(user.points) }}>
                            {(user.first_name || user.username || 'U')[0].toUpperCase()}
                          </div>
                          <div className="user-details">
                            <div className="user-name">
                              {user.first_name || user.username || 'Пользователь'}
                              <span className="you-badge">Вы</span>
                            </div>
                            <div className="user-level" style={{ color: getLevelColor(user.points) }}>
                              {getProgressLevel(user.points)}
                            </div>
                          </div>
                        </div>
                        <div className="item-stats">
                          <div className="stat-item">
                            <span className="stat-value">{user.points}</span>
                            <span className="stat-label">баллов</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </>
      )}

      <div className="leaderboard-footer">
        <button onClick={fetchLeaderboard} className="refresh-btn">
          🔄 Обновить рейтинг
        </button>
      </div>
    </div>
  );
};

export default EnhancedLeaderboard;
