import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const SchedulePage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week, month, day
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'lesson',
    duration: 60
  });

  const eventTypes = [
    { id: 'lesson', name: 'Урок', icon: '📚', color: '#4f46e5' },
    { id: 'test', name: 'Тест', icon: '📝', color: '#dc2626' },
    { id: 'homework', name: 'Домашнее задание', icon: '📋', color: '#059669' },
    { id: 'exam', name: 'Экзамен', icon: '🎯', color: '#7c2d12' },
    { id: 'lab', name: 'Лабораторная', icon: '🔬', color: '#7c3aed' },
    { id: 'meeting', name: 'Встреча', icon: '👥', color: '#0891b2' }
  ];

  useEffect(() => {
    loadSchedule();
  }, [selectedDate, viewMode]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const scheduleData = await apiClient.getSchedule();
      
      // Transform API data
      const eventsData = scheduleData.map(item => ({
        id: item.id,
        title: item.title || 'Событие',
        description: item.description || '',
        date: new Date(item.date),
        time: item.time || '10:00',
        type: item.type || 'lesson',
        duration: item.duration || 60,
        teacher: item.teacher || 'Учитель',
        classroom: item.classroom || 'Аудитория',
        participants: item.participants || []
      }));
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading schedule:', error);
      // Fallback mock data
      setEvents([
        {
          id: 1,
          title: 'Механика: Законы Ньютона',
          description: 'Изучение трех законов Ньютона и их применение',
          date: new Date(),
          time: '10:00',
          type: 'lesson',
          duration: 90,
          teacher: 'Иванов И.И.',
          classroom: 'Каб. 205',
          participants: ['Айдар К.', 'Амина С.', 'Данияр М.']
        },
        {
          id: 2,
          title: 'Контрольная работа: Термодинамика',
          description: 'Проверочная работа по разделу термодинамика',
          date: new Date(Date.now() + 86400000), // tomorrow
          time: '14:30',
          type: 'test',
          duration: 60,
          teacher: 'Петрова А.В.',
          classroom: 'Каб. 301',
          participants: []
        },
        {
          id: 3,
          title: 'Лабораторная: Изучение колебаний',
          description: 'Практическая работа с маятником',
          date: new Date(Date.now() + 172800000), // day after tomorrow
          time: '11:15',
          type: 'lab',
          duration: 120,
          teacher: 'Сидоров П.П.',
          classroom: 'Лаб. 101',
          participants: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    try {
      const eventData = {
        ...newEvent,
        date: new Date(`${newEvent.date}T${newEvent.time}`).toISOString(),
        user_id: user?.telegram_id
      };
      
      const createdEvent = await apiClient.addScheduleEntry(eventData);
      setEvents(prev => [...prev, {
        ...eventData,
        id: createdEvent.id || Date.now(),
        date: new Date(eventData.date)
      }]);
      
      setShowAddModal(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'lesson',
        duration: 60
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await apiClient.deleteScheduleEntry(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const formatTime = (time) => {
    return time.slice(0, 5);
  };

  const getEventTypeInfo = (type) => {
    return eventTypes.find(t => t.id === type) || eventTypes[0];
  };

  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    controls: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    viewModeBtn: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px'
    },
    activeViewBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    addBtn: {
      padding: '10px 20px',
      borderRadius: '12px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    dateNavigation: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '20px'
    },
    navBtn: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '18px',
      transition: 'all 0.3s ease'
    },
    currentDate: {
      fontSize: '20px',
      fontWeight: '600',
      minWidth: '200px',
      textAlign: 'center'
    },
    weekView: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    },
    dayColumn: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      minHeight: '400px'
    },
    dayHeader: {
      textAlign: 'center',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    },
    dayName: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    dayNumber: {
      fontSize: '18px',
      fontWeight: '700'
    },
    eventCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative'
    },
    eventTime: {
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '4px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    eventTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '4px',
      lineHeight: '1.2'
    },
    eventMeta: {
      fontSize: '11px',
      color: 'rgba(255, 255, 255, 0.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    eventTypeIcon: {
      fontSize: '16px'
    },
    deleteBtn: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(220, 38, 38, 0.8)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '20px',
      textAlign: 'center'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '14px',
      fontWeight: '500'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical'
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '20px'
    },
    cancelBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.8)',
      cursor: 'pointer',
      fontSize: '14px'
    },
    saveBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '18px'
    }
  };

  const weekDates = getWeekDates(selectedDate);
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📅</div>
            <div>Загрузка расписания...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📅 Расписание</h1>
        <div style={pageStyles.controls}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              ...pageStyles.viewModeBtn,
              ...(viewMode === 'day' ? pageStyles.activeViewBtn : {})
            }}
          >
            День
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              ...pageStyles.viewModeBtn,
              ...(viewMode === 'week' ? pageStyles.activeViewBtn : {})
            }}
          >
            Неделя
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              ...pageStyles.viewModeBtn,
              ...(viewMode === 'month' ? pageStyles.activeViewBtn : {})
            }}
          >
            Месяц
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={pageStyles.addBtn}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>➕</span>
            <span>Добавить событие</span>
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div style={pageStyles.dateNavigation}>
        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - 7);
            setSelectedDate(newDate);
          }}
          style={pageStyles.navBtn}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ←
        </button>
        <div style={pageStyles.currentDate}>
          {selectedDate.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + 7);
            setSelectedDate(newDate);
          }}
          style={pageStyles.navBtn}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          →
        </button>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div style={pageStyles.weekView}>
          {weekDates.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} style={pageStyles.dayColumn}>
                <div style={pageStyles.dayHeader}>
                  <div style={{
                    ...pageStyles.dayName,
                    color: isToday ? '#fbbf24' : 'white'
                  }}>
                    {dayNames[index]}
                  </div>
                  <div style={{
                    ...pageStyles.dayNumber,
                    color: isToday ? '#fbbf24' : 'white'
                  }}>
                    {date.getDate()}
                  </div>
                </div>
                
                {dayEvents.map(event => {
                  const typeInfo = getEventTypeInfo(event.type);
                  return (
                    <div
                      key={event.id}
                      style={{
                        ...pageStyles.eventCard,
                        borderLeft: `4px solid ${typeInfo.color}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.querySelector('.delete-btn').style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.querySelector('.delete-btn').style.opacity = '0';
                      }}
                    >
                      <div style={pageStyles.eventTime}>
                        {formatTime(event.time)}
                      </div>
                      <div style={pageStyles.eventTitle}>
                        {event.title}
                      </div>
                      <div style={pageStyles.eventMeta}>
                        <span style={pageStyles.eventTypeIcon}>
                          {typeInfo.icon}
                        </span>
                        <span>{event.duration} мин</span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(event.id);
                        }}
                        style={pageStyles.deleteBtn}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div style={pageStyles.modal} onClick={() => setShowAddModal(false)}>
          <div style={pageStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={pageStyles.modalTitle}>Добавить событие</h2>
            
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Название</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                style={pageStyles.input}
                placeholder="Название события"
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Описание</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                style={pageStyles.textarea}
                placeholder="Описание события"
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Дата</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                style={pageStyles.input}
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Время</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                style={pageStyles.input}
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Тип события</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                style={pageStyles.select}
              >
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Длительность (минуты)</label>
              <input
                type="number"
                value={newEvent.duration}
                onChange={(e) => setNewEvent(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                style={pageStyles.input}
                min="15"
                max="240"
                step="15"
              />
            </div>

            <div style={pageStyles.modalActions}>
              <button
                onClick={() => setShowAddModal(false)}
                style={pageStyles.cancelBtn}
              >
                Отмена
              </button>
              <button
                onClick={addEvent}
                style={pageStyles.saveBtn}
                disabled={!newEvent.title || !newEvent.date || !newEvent.time}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
