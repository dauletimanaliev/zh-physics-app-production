import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const ScheduleManager = () => {
  const { user } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [publicSchedules, setPublicSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my', 'public', 'create'

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    visibility: 'private'
  });

  const [newEntry, setNewEntry] = useState({
    day_of_week: 0,
    time_start: '',
    time_end: '',
    subject: '',
    topic: '',
    location: '',
    notes: '',
    color: '#3498db'
  });

  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

  useEffect(() => {
    loadUserSchedules();
    loadPublicSchedules();
  }, [user]);

  const loadUserSchedules = async () => {
    if (!user?.telegram_id) return;
    
    try {
      setLoading(true);
      const response = await apiClient.request(`/schedules/user/${user.telegram_id}`, 'GET');
      setSchedules(response.schedules || []);
    } catch (error) {
      console.error('Error loading user schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicSchedules = async () => {
    try {
      const response = await apiClient.request(`/schedules/public?user_id=${user?.telegram_id || ''}`, 'GET');
      setPublicSchedules(response.schedules || []);
    } catch (error) {
      console.error('Error loading public schedules:', error);
    }
  };

  const createSchedule = async () => {
    if (!newSchedule.title.trim()) return;
    
    try {
      setLoading(true);
      const response = await apiClient.request('/schedules', 'POST', {
        ...newSchedule,
        user_id: user.telegram_id
      });
      
      setNewSchedule({ title: '', description: '', visibility: 'private' });
      setShowCreateForm(false);
      await loadUserSchedules();
      alert('Расписание создано успешно!');
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Ошибка при создании расписания');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleDetails = async (scheduleId) => {
    try {
      const schedule = await apiClient.request(`/schedules/${scheduleId}`, 'GET');
      setSelectedSchedule(schedule);
    } catch (error) {
      console.error('Error loading schedule details:', error);
    }
  };

  const addScheduleEntry = async () => {
    if (!selectedSchedule || !newEntry.subject.trim()) return;
    
    try {
      await apiClient.request(`/schedules/${selectedSchedule.id}/entries`, 'POST', newEntry);
      setNewEntry({
        day_of_week: 0,
        time_start: '',
        time_end: '',
        subject: '',
        topic: '',
        location: '',
        notes: '',
        color: '#3498db'
      });
      setShowEntryForm(false);
      await loadScheduleDetails(selectedSchedule.id);
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      alert('Ошибка при добавлении записи');
    }
  };

  const updateVisibility = async (scheduleId, visibility) => {
    try {
      await apiClient.request(`/schedules/${scheduleId}/visibility`, 'PUT', null, {
        visibility
      });
      await loadUserSchedules();
      await loadPublicSchedules();
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm('Удалить расписание?')) return;
    
    try {
      await apiClient.request(`/schedules/${scheduleId}`, 'DELETE');
      await loadUserSchedules();
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    tabs: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '30px',
      gap: '10px'
    },
    tab: {
      padding: '10px 20px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '25px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    activeTab: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      transform: 'scale(1.05)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    card: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '15px',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)'
    },
    scheduleHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    scheduleTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: 0
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    privateBadge: {
      backgroundColor: '#95a5a6',
      color: 'white'
    },
    publicBadge: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    globalBadge: {
      backgroundColor: '#e74c3c',
      color: 'white'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      border: 'none',
      borderRadius: '20px',
      color: 'white',
      cursor: 'pointer',
      margin: '5px',
      transition: 'all 0.3s ease'
    },
    primaryButton: {
      backgroundColor: '#3498db',
      padding: '12px 24px',
      fontSize: '16px'
    },
    form: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.1)',
      color: 'white',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.1)',
      color: 'white'
    },
    scheduleView: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '15px',
      padding: '20px',
      marginTop: '20px'
    },
    dayColumn: {
      marginBottom: '20px'
    },
    dayHeader: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px',
      padding: '10px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '8px'
    },
    entry: {
      padding: '10px',
      marginBottom: '8px',
      borderRadius: '8px',
      borderLeft: '4px solid',
      backgroundColor: 'rgba(255,255,255,0.1)'
    },
    entryTime: {
      fontSize: '12px',
      opacity: 0.8
    },
    entrySubject: {
      fontWeight: 'bold',
      marginBottom: '4px'
    }
  };

  const getBadgeStyle = (visibility) => {
    const baseStyle = { ...styles.badge };
    switch (visibility) {
      case 'private': return { ...baseStyle, ...styles.privateBadge };
      case 'public': return { ...baseStyle, ...styles.publicBadge };
      case 'global': return { ...baseStyle, ...styles.globalBadge };
      default: return baseStyle;
    }
  };

  const renderScheduleCard = (schedule, isOwner = false) => (
    <div key={schedule.id} style={styles.card}>
      <div style={styles.scheduleHeader}>
        <h3 style={styles.scheduleTitle}>{schedule.title}</h3>
        <span style={getBadgeStyle(schedule.visibility)}>
          {schedule.visibility === 'private' ? 'Приватное' : 
           schedule.visibility === 'public' ? 'Публичное' : 'Глобальное'}
        </span>
      </div>
      
      {schedule.description && (
        <p style={{ marginBottom: '15px', opacity: 0.9 }}>{schedule.description}</p>
      )}
      
      {!isOwner && schedule.first_name && (
        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          Автор: {schedule.first_name} {schedule.last_name || ''}
        </p>
      )}
      
      <div>
        <button 
          style={styles.button}
          onClick={() => loadScheduleDetails(schedule.id)}
        >
          Просмотреть
        </button>
        
        {isOwner && (
          <>
            <button 
              style={styles.button}
              onClick={() => {
                setSelectedSchedule(schedule);
                setShowEntryForm(true);
              }}
            >
              Добавить запись
            </button>
            
            <select 
              value={schedule.visibility}
              onChange={(e) => updateVisibility(schedule.id, e.target.value)}
              style={{ ...styles.select, width: 'auto', margin: '5px' }}
            >
              <option value="private">Приватное</option>
              <option value="public">Публичное</option>
              <option value="global">Глобальное</option>
            </select>
            
            <button 
              style={{ ...styles.button, backgroundColor: '#e74c3c' }}
              onClick={() => deleteSchedule(schedule.id)}
            >
              Удалить
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderScheduleView = () => {
    if (!selectedSchedule) return null;

    const entriesByDay = {};
    (selectedSchedule.entries || []).forEach(entry => {
      if (!entriesByDay[entry.day_of_week]) {
        entriesByDay[entry.day_of_week] = [];
      }
      entriesByDay[entry.day_of_week].push(entry);
    });

    return (
      <div style={styles.scheduleView}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{selectedSchedule.title}</h2>
          <button 
            style={styles.button}
            onClick={() => setSelectedSchedule(null)}
          >
            Закрыть
          </button>
        </div>
        
        {dayNames.map((dayName, dayIndex) => (
          <div key={dayIndex} style={styles.dayColumn}>
            <div style={styles.dayHeader}>{dayName}</div>
            {entriesByDay[dayIndex] ? entriesByDay[dayIndex].map(entry => (
              <div 
                key={entry.id} 
                style={{ ...styles.entry, borderLeftColor: entry.color }}
              >
                <div style={styles.entryTime}>
                  {entry.time_start} - {entry.time_end}
                </div>
                <div style={styles.entrySubject}>{entry.subject}</div>
                {entry.topic && <div>{entry.topic}</div>}
                {entry.location && <div>📍 {entry.location}</div>}
                {entry.notes && <div style={{ fontSize: '12px', opacity: 0.8 }}>{entry.notes}</div>}
              </div>
            )) : (
              <div style={{ opacity: 0.5, padding: '10px' }}>Нет занятий</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📅 Управление расписанием</h1>
        <p>Создавайте и делитесь своими расписаниями</p>
      </div>

      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'my' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('my')}
        >
          Мои расписания ({schedules.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'public' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('public')}
        >
          Публичные ({publicSchedules.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'create' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('create')}
        >
          Создать новое
        </button>
      </div>

      {activeTab === 'my' && (
        <div style={styles.grid}>
          {schedules.map(schedule => renderScheduleCard(schedule, true))}
          {schedules.length === 0 && (
            <div style={styles.card}>
              <p>У вас пока нет расписаний. Создайте первое!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'public' && (
        <div style={styles.grid}>
          {publicSchedules.map(schedule => renderScheduleCard(schedule, false))}
          {publicSchedules.length === 0 && (
            <div style={styles.card}>
              <p>Пока нет публичных расписаний</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={styles.form}>
          <h3>Создать новое расписание</h3>
          
          <input
            style={styles.input}
            type="text"
            placeholder="Название расписания"
            value={newSchedule.title}
            onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
          />
          
          <input
            style={styles.input}
            type="text"
            placeholder="Описание (необязательно)"
            value={newSchedule.description}
            onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
          />
          
          <select
            style={styles.select}
            value={newSchedule.visibility}
            onChange={(e) => setNewSchedule({...newSchedule, visibility: e.target.value})}
          >
            <option value="private">Приватное (только я)</option>
            <option value="public">Публичное (все могут видеть)</option>
            <option value="global">Глобальное (рекомендуется всем)</option>
          </select>
          
          <button 
            style={{...styles.button, ...styles.primaryButton}}
            onClick={createSchedule}
            disabled={loading || !newSchedule.title.trim()}
          >
            {loading ? 'Создание...' : 'Создать расписание'}
          </button>
        </div>
      )}

      {showEntryForm && selectedSchedule && (
        <div style={styles.form}>
          <h3>Добавить запись в расписание</h3>
          
          <select
            style={styles.select}
            value={newEntry.day_of_week}
            onChange={(e) => setNewEntry({...newEntry, day_of_week: parseInt(e.target.value)})}
          >
            {dayNames.map((day, index) => (
              <option key={index} value={index}>{day}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              style={{...styles.input, flex: 1}}
              type="time"
              placeholder="Время начала"
              value={newEntry.time_start}
              onChange={(e) => setNewEntry({...newEntry, time_start: e.target.value})}
            />
            <input
              style={{...styles.input, flex: 1}}
              type="time"
              placeholder="Время окончания"
              value={newEntry.time_end}
              onChange={(e) => setNewEntry({...newEntry, time_end: e.target.value})}
            />
          </div>
          
          <input
            style={styles.input}
            type="text"
            placeholder="Предмет *"
            value={newEntry.subject}
            onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})}
          />
          
          <input
            style={styles.input}
            type="text"
            placeholder="Тема"
            value={newEntry.topic}
            onChange={(e) => setNewEntry({...newEntry, topic: e.target.value})}
          />
          
          <input
            style={styles.input}
            type="text"
            placeholder="Место проведения"
            value={newEntry.location}
            onChange={(e) => setNewEntry({...newEntry, location: e.target.value})}
          />
          
          <input
            style={styles.input}
            type="text"
            placeholder="Заметки"
            value={newEntry.notes}
            onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
          />
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Цвет:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {colors.map(color => (
                <div
                  key={color}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: newEntry.color === color ? '3px solid white' : '1px solid rgba(255,255,255,0.3)'
                  }}
                  onClick={() => setNewEntry({...newEntry, color})}
                />
              ))}
            </div>
          </div>
          
          <div>
            <button 
              style={{...styles.button, ...styles.primaryButton}}
              onClick={addScheduleEntry}
              disabled={!newEntry.subject.trim()}
            >
              Добавить запись
            </button>
            <button 
              style={styles.button}
              onClick={() => setShowEntryForm(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {renderScheduleView()}
    </div>
  );
};

export default ScheduleManager;
