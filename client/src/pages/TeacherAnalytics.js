import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import './TeacherAnalytics.css';

const TeacherAnalytics = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading teacher students...');
      
      const response = await apiClient.getTeacherStudents();
      console.log('👥 Students response:', response);
      
      setStudents(response.students || []);
      setTotalCount(response.total_count || 0);
      setActiveCount(response.active_count || 0);
    } catch (error) {
      console.error('❌ Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Неизвестно') return 'Неизвестно';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const getActivityStatus = (points) => {
    if (points > 100) return { text: 'Активный', color: '#4CAF50' };
    if (points > 0) return { text: 'Умеренный', color: '#FF9800' };
    return { text: 'Неактивный', color: '#F44336' };
  };

  if (loading) {
    return (
      <div className="teacher-analytics">
        <div className="analytics-header">
          <h1>📊 Аналитика учеников</h1>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-analytics">
      <div className="analytics-header">
        <h1>📊 Аналитика учеников</h1>
        <p>Ученики зарегистрированные с кодом 111444</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{totalCount}</h3>
            <p>Всего учеников</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>{activeCount}</h3>
            <p>Активных учеников</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">😴</div>
          <div className="stat-info">
            <h3>{totalCount - activeCount}</h3>
            <p>Неактивных учеников</p>
          </div>
        </div>
      </div>

      <div className="students-section">
        <h2>Список учеников</h2>
        
        {students.length === 0 ? (
          <div className="no-students">
            <p>Пока нет учеников с кодом 111444</p>
          </div>
        ) : (
          <div className="students-list">
            {students.map((student, index) => {
              const activity = getActivityStatus(student.points);
              
              return (
                <div key={student.telegram_id || index} className="student-card">
                  <div className="student-avatar">
                    <span>{student.first_name?.[0] || '?'}</span>
                  </div>
                  
                  <div className="student-info">
                    <h3>{student.first_name} {student.last_name || ''}</h3>
                    <p className="student-username">@{student.username || 'без_username'}</p>
                    <p className="student-date">Регистрация: {formatDate(student.registration_date)}</p>
                  </div>
                  
                  <div className="student-stats">
                    <div className="stat">
                      <span className="stat-value">{student.points}</span>
                      <span className="stat-label">Баллы</span>
                    </div>
                    
                    <div className="stat">
                      <span className="stat-value">{student.tests_completed}</span>
                      <span className="stat-label">Тесты</span>
                    </div>
                    
                    <div className="activity-status" style={{ color: activity.color }}>
                      {activity.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="refresh-section">
        <button onClick={loadStudents} className="refresh-btn">
          🔄 Обновить данные
        </button>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
