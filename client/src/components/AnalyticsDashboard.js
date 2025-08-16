import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ materialId, isTeacher = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (materialId && isTeacher) {
      fetchAnalytics();
    }
  }, [materialId, timeRange, isTeacher]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/materials/${materialId}/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 сек';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isTeacher) {
    return null;
  }

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <p>Аналитика недоступна</p>
      </div>
    );
  }

  const { stats, recent_viewers } = analytics;

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h3>📊 Аналитика материала</h3>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="day">За день</option>
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
            <option value="all">Все время</option>
          </select>
        </div>
      </div>

      <div className="analytics-stats">
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.views_count || 0}</div>
            <div className="stat-label">Всего просмотров</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.unique_viewers || 0}</div>
            <div className="stat-label">Уникальных зрителей</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-number">
              {formatDuration(Math.round(stats.avg_view_duration || 0))}
            </div>
            <div className="stat-label">Среднее время</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.likes_count || 0}</div>
            <div className="stat-label">Лайков</div>
          </div>
        </div>
      </div>

      {recent_viewers && recent_viewers.length > 0 && (
        <div className="recent-viewers">
          <h4>🕒 Последние просмотры</h4>
          <div className="viewers-list">
            {recent_viewers.map((viewer, index) => (
              <div key={index} className="viewer-item">
                <div className="viewer-avatar">
                  {(viewer.first_name || viewer.username || 'U')[0].toUpperCase()}
                </div>
                <div className="viewer-info">
                  <div className="viewer-name">
                    {viewer.first_name || viewer.username || 'Пользователь'}
                  </div>
                  <div className="viewer-meta">
                    <span className="view-time">
                      {formatDate(viewer.viewed_at)}
                    </span>
                    {viewer.duration_seconds > 0 && (
                      <span className="view-duration">
                        • {formatDuration(viewer.duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="analytics-insights">
        <h4>💡 Инсайты</h4>
        <div className="insights-list">
          {stats.unique_viewers > 0 && (
            <div className="insight-item">
              <span className="insight-icon">📈</span>
              <span className="insight-text">
                Материал просмотрели {stats.unique_viewers} из {stats.views_count} раз
                {stats.views_count > stats.unique_viewers && 
                  ` (${Math.round((stats.views_count - stats.unique_viewers) / stats.unique_viewers * 100)}% повторных просмотров)`
                }
              </span>
            </div>
          )}
          
          {stats.avg_view_duration > 60 && (
            <div className="insight-item">
              <span className="insight-icon">⭐</span>
              <span className="insight-text">
                Высокая вовлеченность: среднее время просмотра более минуты
              </span>
            </div>
          )}
          
          {stats.last_viewed && (
            <div className="insight-item">
              <span className="insight-icon">🕐</span>
              <span className="insight-text">
                Последний просмотр: {formatDate(stats.last_viewed)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
