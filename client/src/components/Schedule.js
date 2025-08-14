import React, { useState } from 'react';
import './Schedule.css';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'day'

  const events = [
    {
      id: 1,
      title: 'Физика дәрісі',
      subject: 'Физика',
      type: 'lesson',
      startTime: '09:00',
      endTime: '10:30',
      date: '2024-01-15',
      teacher: 'Нұрлан Мұратұлы',
      location: 'Аудитория 101',
      color: '#667eea'
    },
    {
      id: 2,
      title: 'Математика тесті',
      subject: 'Математика',
      type: 'test',
      startTime: '11:00',
      endTime: '12:00',
      date: '2024-01-15',
      teacher: 'Айгүл Серікқызы',
      location: 'Аудитория 205',
      color: '#f093fb'
    },
    {
      id: 3,
      title: 'Химия зертханасы',
      subject: 'Химия',
      type: 'lab',
      startTime: '14:00',
      endTime: '15:30',
      date: '2024-01-15',
      teacher: 'Болат Қасымұлы',
      location: 'Зертхана 3',
      color: '#4ecdc4'
    },
    {
      id: 4,
      title: 'Биология семинары',
      subject: 'Биология',
      type: 'seminar',
      startTime: '10:00',
      endTime: '11:30',
      date: '2024-01-16',
      teacher: 'Гүлнар Әбдіқызы',
      location: 'Аудитория 302',
      color: '#45b7d1'
    },
    {
      id: 5,
      title: 'Физика тесті',
      subject: 'Физика',
      type: 'test',
      startTime: '15:00',
      endTime: '16:00',
      date: '2024-01-17',
      teacher: 'Нұрлан Мұратұлы',
      location: 'Аудитория 101',
      color: '#667eea'
    }
  ];

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date + ' ' + a.startTime) - new Date(b.date + ' ' + b.startTime))
    .slice(0, 5);

  const todayEvents = events.filter(event => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today;
  });

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'lesson': return '📚';
      case 'test': return '📝';
      case 'lab': return '🧪';
      case 'seminar': return '💬';
      default: return '📅';
    }
  };

  const getEventTypeName = (type) => {
    switch (type) {
      case 'lesson': return 'Дәріс';
      case 'test': return 'Тест';
      case 'lab': return 'Зертхана';
      case 'seminar': return 'Семинар';
      default: return 'Оқиға';
    }
  };

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h1>Сабақтар кестесі</h1>
        <p>Сабақтар кестесі және оқу жоспары</p>
      </div>

      {/* View Mode Selector */}
      <div className="view-selector">
        <button 
          className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          Күн
        </button>
        <button 
          className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          Апта
        </button>
        <button 
          className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          Ай
        </button>
      </div>

      {/* Today's Events */}
      <div className="today-section">
        <h2>Бүгінгі сабақтар</h2>
        {todayEvents.length > 0 ? (
          <div className="today-events">
            {todayEvents.map(event => (
              <div key={event.id} className="today-event" style={{ borderLeftColor: event.color }}>
                <div className="event-time">
                  <span className="time">{event.startTime}</span>
                  <span className="duration">
                    {Math.round((new Date(`1970-01-01 ${event.endTime}`) - new Date(`1970-01-01 ${event.startTime}`)) / 60000)} мин
                  </span>
                </div>
                <div className="event-details">
                  <div className="event-header">
                    <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                    <h3>{event.title}</h3>
                    <span className="event-type">{getEventTypeName(event.type)}</span>
                  </div>
                  <div className="event-info">
                    <span className="teacher">👨‍🏫 {event.teacher}</span>
                    <span className="location">📍 {event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-events">
            <div className="no-events-icon">📅</div>
            <p>Бүгін сабақтар жоқ</p>
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="upcoming-section">
        <h2>Алдағы сабақтар</h2>
        <div className="upcoming-events">
          {upcomingEvents.map(event => (
            <div key={event.id} className="upcoming-event">
              <div className="event-date">
                <div className="date-day">{new Date(event.date).getDate()}</div>
                <div className="date-month">
                  {new Date(event.date).toLocaleDateString('kk-KZ', { month: 'short' })}
                </div>
              </div>
              <div className="event-content">
                <div className="event-header">
                  <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                  <h3>{event.title}</h3>
                </div>
                <div className="event-meta">
                  <span className="time">⏰ {event.startTime} - {event.endTime}</span>
                  <span className="subject" style={{ color: event.color }}>
                    {event.subject}
                  </span>
                </div>
                <div className="event-location">
                  <span>📍 {event.location}</span>
                  <span>👨‍🏫 {event.teacher}</span>
                </div>
              </div>
              <div className="event-actions">
                <button className="remind-btn">🔔</button>
                <button className="details-btn">ℹ️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="schedule-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Бүгін</h3>
            <p>{todayEvents.length} сабақ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Осы аптада</h3>
            <p>{events.length} сабақ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>Келесі сабақ</h3>
            <p>{upcomingEvents.length > 0 ? upcomingEvents[0].startTime : 'Жоқ'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
