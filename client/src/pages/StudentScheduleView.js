import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const StudentScheduleView = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('current');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading schedules for student view...');
      const scheduleList = await apiClient.getPublicSchedules();
      console.log('📅 Loaded schedules:', scheduleList);
      
      // Маппинг данных из API формата в нужный формат
      const mappedSchedules = scheduleList.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        subject: schedule.subject,
        dayOfWeek: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        startDate: schedule.start_date,
        endDate: schedule.end_date,
        location: schedule.location,
        maxStudents: schedule.max_students,
        teacherId: schedule.teacher_id,
        type: schedule.type,
        difficulty: schedule.difficulty,
        duration: schedule.duration,
        isOnline: schedule.is_online
      }));
      
      setSchedules(mappedSchedules);
    } catch (error) {
      console.error('❌ Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const groupSchedulesByWeek = () => {
    const groups = {};
    
    schedules.forEach(schedule => {
      if (!schedule.startDate || !schedule.endDate) return;
      
      const groupKey = `${schedule.title}-${schedule.startDate}-${schedule.endDate}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: schedule.title,
          description: schedule.description,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          location: schedule.location,
          type: schedule.type,
          difficulty: schedule.difficulty,
          schedules: []
        };
      }
      
      groups[groupKey].schedules.push(schedule);
    });
    
    return Object.values(groups);
  };

  const getDayName = (dayOfWeek) => {
    const days = {
      'monday': 'Понедельник',
      'tuesday': 'Вторник', 
      'wednesday': 'Среда',
      'thursday': 'Четверг',
      'friday': 'Пятница',
      'saturday': 'Суббота',
      'sunday': 'Воскресенье'
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  const getDayOrder = (dayOfWeek) => {
    const order = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
      'friday': 5, 'saturday': 6, 'sunday': 7
    };
    return order[dayOfWeek] || 8;
  };

  const getSubjectEmoji = (subject) => {
    const emojis = {
      'Физика': '🔬',
      'Математика': '📐',
      'Химия': '⚗️',
      'Биология': '🧬',
      'Информатика': '💻',
      'Астрономия': '🌟'
    };
    return emojis[subject] || '📚';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'beginner': '#4ade80',
      'intermediate': '#f59e0b', 
      'advanced': '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  const renderScheduleGroups = () => {
    const weeklyGroups = groupSchedulesByWeek();
    
    if (weeklyGroups.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <h3>Расписания не найдены</h3>
          <p>Учителя пока не добавили расписания занятий</p>
        </div>
      );
    }

    return weeklyGroups.map((group, index) => {
      if (!group.startDate || !group.schedules || group.schedules.length === 0) {
        return null;
      }

      const sortedSchedules = group.schedules.sort((a, b) => 
        getDayOrder(a.dayOfWeek) - getDayOrder(b.dayOfWeek)
      );

      return (
        <div key={index} style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '20px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700' }}>
                  📚 {group.title}
                </h3>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '16px' }}>
                  {group.description}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {group.type === 'lecture' ? '📖 Лекция' : '🔬 Практика'}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              fontSize: '14px', 
              opacity: 0.9,
              marginBottom: '20px'
            }}>
              <span>📅 {group.startDate} - {group.endDate}</span>
              <span>📍 {group.location}</span>
              <span style={{ 
                color: getDifficultyColor(group.difficulty),
                fontWeight: '600'
              }}>
                ⭐ {group.difficulty}
              </span>
            </div>
          </div>

          <div>
            <h4 style={{ 
              margin: '0 0 15px 0', 
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📅 Расписание на неделю ({sortedSchedules.length} занятий)
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '15px'
            }}>
              {sortedSchedules.map((schedule, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '16px' }}>
                      {getDayName(schedule.dayOfWeek)}
                    </span>
                    {schedule.isOnline && (
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        🌐 Онлайн
                      </span>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span>{getSubjectEmoji(schedule.subject)}</span>
                    <span style={{ fontWeight: '500' }}>{schedule.subject}</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '14px',
                    opacity: 0.9
                  }}>
                    <span>🕐</span>
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                    <span>({schedule.duration} мин)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '30px 20px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '32px', 
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📅 Расписание занятий
        </h1>
        <p style={{ 
          margin: '0', 
          fontSize: '18px', 
          color: '#6b7280' 
        }}>
          Все занятия, добавленные учителями
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Загрузка расписаний...</p>
        </div>
      )}

      {/* Schedules */}
      {!loading && (
        <div>
          <h2 style={{ 
            textAlign: 'center', 
            margin: '0 0 30px 0', 
            color: '#1f2937',
            fontSize: '24px'
          }}>
            📚 Доступные курсы ({schedules.length})
          </h2>
          {renderScheduleGroups()}
        </div>
      )}

      {/* Back Button */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
        >
          ← Назад к панели
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentScheduleView;
