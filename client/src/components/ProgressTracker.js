import React, { useState, useEffect } from 'react';
import './ProgressTracker.css';

const ProgressTracker = ({ userId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (userId) {
      fetchProgress();
    }
  }, [userId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/progress`);
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="progress-tracker loading">
        <div className="loading-spinner"></div>
        <p>Загрузка прогресса...</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="progress-tracker">
        <p>Данные о прогрессе недоступны</p>
      </div>
    );
  }

  const { progress_by_category, recent_activity, recent_tests } = progress;
  const categories = progress_by_category || [];
  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(cat => cat.category === selectedCategory);

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>📊 Мой прогресс</h3>
        <div className="category-filter">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="progress-overview">
        {filteredCategories.length === 0 ? (
          <div className="no-progress">
            <p>Пока нет данных о прогрессе</p>
            <p>Начните изучать материалы, чтобы отслеживать свой прогресс!</p>
          </div>
        ) : (
          filteredCategories.map(category => {
            const materialProgress = getCompletionPercentage(
              category.completed_materials, 
              category.total_materials
            );
            const testProgress = getCompletionPercentage(
              category.completed_tests, 
              category.total_tests
            );

            return (
              <div key={category.category} className="category-progress">
                <div className="category-header">
                  <h4>{category.category}</h4>
                  <div className="category-stats">
                    <span className="time-spent">
                      ⏱️ {formatTime(category.time_spent_minutes)}
                    </span>
                    {category.average_score > 0 && (
                      <span className="avg-score">
                        📊 {category.average_score.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="progress-bars">
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>📚 Материалы</span>
                      <span>{category.completed_materials}/{category.total_materials}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${materialProgress}%`,
                          backgroundColor: getProgressColor(materialProgress)
                        }}
                      ></div>
                    </div>
                    <span className="progress-percentage">{materialProgress}%</span>
                  </div>

                  <div className="progress-item">
                    <div className="progress-label">
                      <span>✅ Тесты</span>
                      <span>{category.completed_tests}/{category.total_tests}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${testProgress}%`,
                          backgroundColor: getProgressColor(testProgress)
                        }}
                      ></div>
                    </div>
                    <span className="progress-percentage">{testProgress}%</span>
                  </div>
                </div>

                <div className="last-activity">
                  <small>
                    Последняя активность: {formatDate(category.last_activity)}
                  </small>
                </div>
              </div>
            );
          })
        )}
      </div>

      {recent_activity && recent_activity.length > 0 && (
        <div className="recent-activity">
          <h4>🕒 Недавняя активность</h4>
          <div className="activity-list">
            {recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">📖</div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-meta">
                    <span className="activity-category">{activity.category}</span>
                    <span className="activity-time">
                      {formatDate(activity.viewed_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent_tests && recent_tests.length > 0 && (
        <div className="recent-tests">
          <h4>📝 Последние тесты</h4>
          <div className="tests-list">
            {recent_tests.slice(0, 5).map((test, index) => {
              const scorePercentage = Math.round((test.score / test.max_score) * 100);
              return (
                <div key={index} className="test-item">
                  <div className="test-score" style={{ 
                    backgroundColor: getProgressColor(scorePercentage) 
                  }}>
                    {scorePercentage}%
                  </div>
                  <div className="test-content">
                    <div className="test-title">{test.title}</div>
                    <div className="test-meta">
                      <span>{test.score}/{test.max_score} баллов</span>
                      <span>{formatDate(test.completed_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="progress-actions">
        <button onClick={fetchProgress} className="refresh-btn">
          🔄 Обновить прогресс
        </button>
      </div>
    </div>
  );
};

export default ProgressTracker;
