import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    isRecurring: false,
    subject: '',
    location: '',
    maxStudents: 30,
    type: 'lecture',
    difficulty: 'intermediate',
    duration: 90,
    price: 0,
    tags: '',
    isOnline: false,
    requirements: ''
  });

  const teacherId = 1; // Get from context/auth

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading schedules...');
      const response = await apiClient.getUserSchedules(teacherId);
      const scheduleList = Array.isArray(response) ? response : (response?.schedules || []);
      console.log('📊 Loaded schedules:', scheduleList.length);
      setSchedules(scheduleList);
    } catch (error) {
      console.error('❌ Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      console.log('➕ Creating new schedule:', scheduleForm.title);
      
      const scheduleData = {
        ...scheduleForm,
        teacherId: teacherId,
        userId: teacherId
      };
      
      const result = await apiClient.createSchedule(scheduleData);
      console.log('✅ Schedule created successfully:', result);
      
      await loadSchedules();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('❌ Error creating schedule:', error);
      alert('Ошибка при создании расписания: ' + error.message);
    }
  };

  const resetForm = () => {
    setScheduleForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      dayOfWeek: '',
      isRecurring: false,
      subject: '',
      location: '',
      maxStudents: 30,
      type: 'lecture',
      difficulty: 'intermediate',
      duration: 90,
      price: 0,
      tags: '',
      isOnline: false,
      requirements: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const getDayName = (dayOfWeek) => {
    const days = {
      monday: 'Понедельник',
      tuesday: 'Вторник', 
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье'
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
      color: 'white'
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      margin: '0 0 10px 0',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      fontSize: '18px',
      opacity: '0.9',
      fontWeight: '400'
    },
    controls: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '40px',
      flexWrap: 'wrap'
    },
    createButton: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    scheduleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '25px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    scheduleCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '25px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      color: '#1a1a1a'
    },
    scheduleTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '12px',
      color: '#1f2937'
    },
    scheduleInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '20px'
    },
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#6b7280'
    },
    scheduleActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end'
    },
    actionButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    editButton: {
      background: '#3b82f6',
      color: 'white'
    },
    deleteButton: {
      background: '#ef4444',
      color: 'white'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      color: '#1a1a1a'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      fontSize: '14px',
      transition: 'border-color 0.2s ease'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      fontSize: '14px',
      minHeight: '100px',
      resize: 'vertical',
      transition: 'border-color 0.2s ease'
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      fontSize: '14px',
      background: 'white',
      cursor: 'pointer'
    },
    checkbox: {
      marginRight: '8px'
    },
    modalActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '30px'
    },
    cancelButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      background: 'white',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    saveButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      background: '#10b981',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: 'white' }}>Загрузка расписания...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📅 Управление расписанием</h1>
        <p style={pageStyles.subtitle}>Создавайте и делитесь своими расписаниями</p>
      </div>

      {/* Controls */}
      <div style={pageStyles.controls}>
        <button
          style={pageStyles.createButton}
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
          }}
        >
          ➕ Создать новое
        </button>
      </div>

      {/* Schedule Grid */}
      {schedules.length === 0 ? (
        <div style={pageStyles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
          <h3>У вас пока нет расписаний. Создайте первое!</h3>
          <p>Нажмите кнопку "Создать новое" чтобы начать</p>
        </div>
      ) : (
        <div style={pageStyles.scheduleGrid}>
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              style={pageStyles.scheduleCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={pageStyles.scheduleTitle}>{schedule.title}</div>
              
              <div style={pageStyles.scheduleInfo}>
                <div style={pageStyles.infoRow}>
                  <span>📚</span>
                  <span>{schedule.subject || 'Физика'}</span>
                </div>
                
                <div style={pageStyles.infoRow}>
                  <span>📍</span>
                  <span>{schedule.location || 'Не указано'}</span>
                </div>
                
                <div style={pageStyles.infoRow}>
                  <span>🗓️</span>
                  <span>{getDayName(schedule.dayOfWeek)}</span>
                </div>
                
                <div style={pageStyles.infoRow}>
                  <span>⏰</span>
                  <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                </div>
                
                <div style={pageStyles.infoRow}>
                  <span>📅</span>
                  <span>{formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}</span>
                </div>
                
                <div style={pageStyles.infoRow}>
                  <span>👥</span>
                  <span>До {schedule.maxStudents || 30} студентов</span>
                </div>
                
                {schedule.description && (
                  <div style={pageStyles.infoRow}>
                    <span>📝</span>
                    <span>{schedule.description}</span>
                  </div>
                )}
              </div>
              
              <div style={pageStyles.scheduleActions}>
                <button
                  style={{...pageStyles.actionButton, ...pageStyles.editButton}}
                  onClick={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit schedule:', schedule.id);
                  }}
                >
                  ✏️ Редактировать
                </button>
                
                <button
                  style={{...pageStyles.actionButton, ...pageStyles.deleteButton}}
                  onClick={() => {
                    // TODO: Implement delete functionality
                    console.log('Delete schedule:', schedule.id);
                  }}
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div style={pageStyles.modal} onClick={() => setShowCreateModal(false)}>
          <div style={pageStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '25px', color: '#1f2937' }}>📅 Создать новое расписание</h2>
            
            {/* Название занятия */}
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>📚 Название занятия *</label>
              <input
                style={pageStyles.input}
                type="text"
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                placeholder="Например: Механика - Основы кинематики"
              />
            </div>
            
            {/* Описание */}
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>📝 Описание занятия</label>
              <textarea
                style={pageStyles.textarea}
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                placeholder="Подробное описание того, что будет изучаться на занятии..."
              />
            </div>
            
            {/* Предмет и Тип занятия */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📖 Предмет *</label>
                <select
                  style={pageStyles.select}
                  value={scheduleForm.subject}
                  onChange={(e) => setScheduleForm({...scheduleForm, subject: e.target.value})}
                >
                  <option value="">Выберите предмет</option>
                  <option value="Физика">🔬 Физика</option>
                  <option value="Математика">📐 Математика</option>
                  <option value="Химия">⚗️ Химия</option>
                  <option value="Биология">🧬 Биология</option>
                  <option value="Информатика">💻 Информатика</option>
                  <option value="Астрономия">🌟 Астрономия</option>
                </select>
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📋 Тип занятия</label>
                <select
                  style={pageStyles.select}
                  value={scheduleForm.type || 'lecture'}
                  onChange={(e) => setScheduleForm({...scheduleForm, type: e.target.value})}
                >
                  <option value="lecture">📚 Лекция</option>
                  <option value="practice">🔧 Практика</option>
                  <option value="lab">🧪 Лабораторная</option>
                  <option value="seminar">💬 Семинар</option>
                  <option value="exam">📝 Экзамен</option>
                  <option value="consultation">❓ Консультация</option>
                </select>
              </div>
            </div>
            
            {/* День недели и Уровень сложности */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📅 День недели *</label>
                <select
                  style={pageStyles.select}
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) => setScheduleForm({...scheduleForm, dayOfWeek: e.target.value})}
                >
                  <option value="">Выберите день</option>
                  <option value="monday">🔵 Понедельник</option>
                  <option value="tuesday">🟢 Вторник</option>
                  <option value="wednesday">🟡 Среда</option>
                  <option value="thursday">🟠 Четверг</option>
                  <option value="friday">🔴 Пятница</option>
                  <option value="saturday">🟣 Суббота</option>
                  <option value="sunday">⚪ Воскресенье</option>
                </select>
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>⭐ Уровень сложности</label>
                <select
                  style={pageStyles.select}
                  value={scheduleForm.difficulty || 'intermediate'}
                  onChange={(e) => setScheduleForm({...scheduleForm, difficulty: e.target.value})}
                >
                  <option value="beginner">🟢 Начальный</option>
                  <option value="intermediate">🟡 Средний</option>
                  <option value="advanced">🔴 Продвинутый</option>
                </select>
              </div>
            </div>
            
            {/* Время начала и окончания */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>🕐 Время начала *</label>
                <input
                  style={pageStyles.input}
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                />
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>🕑 Время окончания *</label>
                <input
                  style={pageStyles.input}
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                />
              </div>
            </div>
            
            {/* Даты начала и окончания */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📅 Дата начала курса</label>
                <input
                  style={pageStyles.input}
                  type="date"
                  value={scheduleForm.startDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, startDate: e.target.value})}
                />
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📅 Дата окончания курса</label>
                <input
                  style={pageStyles.input}
                  type="date"
                  value={scheduleForm.endDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, endDate: e.target.value})}
                />
              </div>
            </div>
            
            {/* Место проведения и Продолжительность */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📍 Место проведения</label>
                <input
                  style={pageStyles.input}
                  type="text"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm({...scheduleForm, location: e.target.value})}
                  placeholder="Аудитория 101, Онлайн, Лаборатория..."
                />
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>⏱️ Продолжительность (мин)</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={scheduleForm.duration || 90}
                  onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value) || 90})}
                />
              </div>
            </div>
            
            {/* Максимум студентов и Цена */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>👥 Максимум студентов</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  min="1"
                  max="100"
                  value={scheduleForm.maxStudents}
                  onChange={(e) => setScheduleForm({...scheduleForm, maxStudents: parseInt(e.target.value) || 30})}
                />
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>💰 Цена за занятие (₸)</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  min="0"
                  step="100"
                  value={scheduleForm.price || 0}
                  onChange={(e) => setScheduleForm({...scheduleForm, price: parseInt(e.target.value) || 0})}
                  placeholder="0 - бесплатно"
                />
              </div>
            </div>
            
            {/* Теги */}
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>🏷️ Теги (через запятую)</label>
              <input
                style={pageStyles.input}
                type="text"
                value={scheduleForm.tags || ''}
                onChange={(e) => setScheduleForm({...scheduleForm, tags: e.target.value})}
                placeholder="механика, кинематика, физика, школьная программа"
              />
            </div>
            
            {/* Дополнительные опции */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    style={pageStyles.checkbox}
                    type="checkbox"
                    checked={scheduleForm.isRecurring}
                    onChange={(e) => setScheduleForm({...scheduleForm, isRecurring: e.target.checked})}
                  />
                  <span style={pageStyles.label}>🔄 Повторяющееся расписание</span>
                </label>
              </div>
              
              <div style={pageStyles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    style={pageStyles.checkbox}
                    type="checkbox"
                    checked={scheduleForm.isOnline || false}
                    onChange={(e) => setScheduleForm({...scheduleForm, isOnline: e.target.checked})}
                  />
                  <span style={pageStyles.label}>💻 Онлайн занятие</span>
                </label>
              </div>
            </div>
            
            {/* Требования к студентам */}
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>📋 Требования к студентам</label>
              <textarea
                style={pageStyles.textarea}
                value={scheduleForm.requirements || ''}
                onChange={(e) => setScheduleForm({...scheduleForm, requirements: e.target.value})}
                placeholder="Необходимые знания, материалы, подготовка..."
              />
            </div>
            
            <div style={pageStyles.modalActions}>
              <button
                style={pageStyles.cancelButton}
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                ❌ Отмена
              </button>
              
              <button
                style={pageStyles.saveButton}
                onClick={handleCreateSchedule}
                disabled={!scheduleForm.title.trim() || !scheduleForm.subject || !scheduleForm.dayOfWeek || !scheduleForm.startTime || !scheduleForm.endTime}
              >
                ✅ Создать расписание
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
