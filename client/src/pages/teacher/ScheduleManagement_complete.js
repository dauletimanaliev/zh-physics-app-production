import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSelectDaysModal, setShowSelectDaysModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'lecture',
    difficulty: 'beginner',
    location: '',
    subjects: []
  });

  const teacherId = 1;

  useEffect(() => {
    loadSchedules();
    // Убедимся что модальные окна закрыты при загрузке
    setShowSelectDaysModal(false);
    setShowEditScheduleModal(false);
    setEditingSchedule(null);
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading ALL schedules...');
      const scheduleList = await apiClient.getPublicSchedules();
      console.log('📅 Raw API response:', scheduleList);
      
      // Маппинг данных из API формата в нужный формат
      const mappedSchedules = (scheduleList || []).map(schedule => ({
        ...schedule,
        dayOfWeek: schedule.day_of_week || schedule.dayOfWeek,
        startDate: schedule.start_date || schedule.startDate,
        endDate: schedule.end_date || schedule.endDate,
        startTime: schedule.start_time || schedule.startTime,
        endTime: schedule.end_time || schedule.endTime,
        teacherId: schedule.teacher_id || schedule.teacherId,
        maxStudents: schedule.max_students || schedule.maxStudents,
        isRecurring: schedule.is_recurring || schedule.isRecurring,
        isOnline: schedule.is_online || schedule.isOnline
      }));
      
      console.log('📅 Mapped schedules:', mappedSchedules);
      console.log('📅 Schedule count:', mappedSchedules.length);
      setSchedules(mappedSchedules);
    } catch (error) {
      console.error('❌ Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDaySelection = (dayOfWeek) => {
    if (selectedDays.includes(dayOfWeek)) {
      setSelectedDays(selectedDays.filter(day => day !== dayOfWeek));
    } else {
      setSelectedDays([...selectedDays, dayOfWeek]);
    }
  };

  const proceedToScheduleEdit = () => {
    if (selectedDays.length === 0) return;
    
    const subjects = selectedDays.map(day => ({
      dayOfWeek: day,
      subject: '',
      startTime: '',
      endTime: '',
      duration: '90'
    }));
    
    setScheduleForm({ ...scheduleForm, subjects });
    setShowSelectDaysModal(false);
    setShowEditScheduleModal(true);
  };

  const updateSubject = (index, field, value) => {
    const newSubjects = [...scheduleForm.subjects];
    newSubjects[index][field] = value;
    setScheduleForm({ ...scheduleForm, subjects: newSubjects });
  };

  const handleCreateSchedule = async () => {
    try {
      setLoading(true);
      console.log('🚀 STARTING SCHEDULE CREATION');
      console.log('📅 Selected days:', selectedDays);
      console.log('📝 Schedule form:', scheduleForm);
      console.log('📚 Subjects:', scheduleForm.subjects);
      
      const createdSchedules = [];
      
      // Создаем расписание для каждого выбранного дня, но только с первым предметом
      const firstSubject = scheduleForm.subjects[0];
      
      if (!firstSubject || !firstSubject.name || !firstSubject.startTime || !firstSubject.endTime) {
        console.log('⚠️ No valid subject found');
        setSuccessMessage('❌ Заполните данные предмета');
        return;
      }
      
      for (const day of selectedDays) {
        const scheduleData = {
          title: scheduleForm.title,
          description: scheduleForm.description,
          subject: firstSubject.name,
          dayOfWeek: day,
          startTime: firstSubject.startTime,
          endTime: firstSubject.endTime,
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate,
          location: scheduleForm.location,
          maxStudents: 30,
          teacherId: teacherId,
          userId: teacherId,
          type: scheduleForm.type,
          difficulty: scheduleForm.difficulty,
          duration: firstSubject.duration || 90,
          price: 0,
          isRecurring: true,
          isOnline: false,
          requirements: ''
        };
        
        console.log(`📝 Creating schedule for ${day}:`, JSON.stringify(scheduleData, null, 2));
        
        try {
          const createdSchedule = await apiClient.createSchedule(scheduleData);
          console.log(`✅ Schedule created for ${day}:`, createdSchedule);
          createdSchedules.push(createdSchedule);
        } catch (createError) {
          console.error(`❌ Failed to create schedule for ${day}:`, createError);
          console.error('📋 Failed data:', scheduleData);
        }
      }
      
      console.log('✅ Total created schedules:', createdSchedules.length);
      console.log('📋 Created schedules list:', createdSchedules);
      
      if (createdSchedules.length > 0) {
        setSuccessMessage(`✅ Создано ${createdSchedules.length} расписаний`);
        resetForm();
        console.log('🔄 Reloading schedules...');
        await loadSchedules();
      } else {
        setSuccessMessage('❌ Не удалось создать расписания');
      }
      
    } catch (error) {
      console.error('❌ Error in handleCreateSchedule:', error);
      setSuccessMessage('❌ Ошибка при создании расписаний');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      setLoading(true);
      const schedulePromises = [];
      
      // First delete existing schedules for this group
      if (editingSchedule && editingSchedule.schedules) {
        const deletePromises = editingSchedule.schedules.map(schedule => 
          apiClient.deleteSchedule(schedule.id)
        );
        await Promise.all(deletePromises);
      }
      
      // Then create new schedules
      scheduleForm.subjects.forEach((subject) => {
        if (subject.subject && subject.startTime && subject.endTime) {
          const scheduleData = {
            title: scheduleForm.title,
            description: scheduleForm.description,
            startDate: scheduleForm.startDate,
            endDate: scheduleForm.endDate,
            type: scheduleForm.type,
            difficulty: scheduleForm.difficulty,
            location: scheduleForm.location,
            dayOfWeek: subject.dayOfWeek,
            subject: subject.subject,
            startTime: subject.startTime,
            endTime: subject.endTime,
            duration: subject.duration,
            teacherId: teacherId,
            userId: teacherId
          };
          schedulePromises.push(apiClient.createSchedule(scheduleData));
        }
      });

      await Promise.all(schedulePromises);
      await loadSchedules();
      resetForm();
      setSuccessMessage('✅ Расписание обновлено успешно!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating schedule:', error);
      setSuccessMessage('❌ Ошибка при обновлении расписания');
      setTimeout(() => setSuccessMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group) => {
    setEditingSchedule(group);
    setScheduleForm({
      title: group.title,
      description: group.description || '',
      startDate: group.startDate,
      endDate: group.endDate,
      type: group.type || 'lecture',
      difficulty: group.difficulty || 'beginner',
      location: group.location || '',
      subjects: group.schedules.map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        subject: schedule.subject,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: schedule.duration || '90'
      }))
    });
    setSelectedDays(group.schedules.map(s => s.dayOfWeek));
    setShowEditScheduleModal(true);
  };

  const handleDeleteGroup = (group) => {
    setScheduleToDelete(group);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    try {
      setLoading(true);
      const deletePromises = scheduleToDelete.schedules.map(schedule => 
        apiClient.deleteSchedule(schedule.id)
      );
      await Promise.all(deletePromises);
      await loadSchedules();
      setSuccessMessage('✅ Расписание удалено успешно!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setSuccessMessage('❌ Ошибка при удалении расписания');
      setTimeout(() => setSuccessMessage(''), 4000);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setScheduleToDelete(null);
    }
  };

  const cancelDeleteSchedule = () => {
    setShowDeleteDialog(false);
    setScheduleToDelete(null);
  };

  const resetForm = () => {
    setScheduleForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      type: 'lecture',
      difficulty: 'beginner',
      location: '',
      subjects: []
    });
    setSelectedDays([]);
    setEditingSchedule(null);
    setShowEditScheduleModal(false);
  };

  const getDayName = (dayOfWeek) => {
    const dayNames = {
      monday: 'Понедельник',
      tuesday: 'Вторник', 
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье'
    };
    return dayNames[dayOfWeek] || dayOfWeek;
  };

  const getDayOrder = (dayOfWeek) => {
    const dayOrder = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 7
    };
    return dayOrder[dayOfWeek] || 0;
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
    return weekNumber;
  };

  const getMonthName = (date) => {
    const months = [
      'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];
    return months[new Date(date).getMonth()];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  const groupSchedulesByWeek = () => {
    console.log('🔍 groupSchedulesByWeek called with schedules:', schedules);
    if (!schedules.length) {
      console.log('⚠️ No schedules to group');
      return [];
    }
    const grouped = {};
    
    schedules.forEach(schedule => {
      console.log('🔍 Processing schedule:', schedule);
      const key = `${schedule.title}-${schedule.startDate}-${schedule.endDate}`;
      console.log('🔍 Group key:', key);
      if (!grouped[key]) {
        grouped[key] = {
          title: schedule.title,
          description: schedule.description,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          location: schedule.location,
          type: schedule.type,
          schedules: []
        };
      }
      grouped[key].schedules.push(schedule);
    });

    Object.values(grouped).forEach(group => {
      group.schedules.sort((a, b) => getDayOrder(a.dayOfWeek) - getDayOrder(b.dayOfWeek));
    });
    
    const result = Object.values(grouped);
    console.log('🔍 Final grouped result:', result);
    return result;
  };

  const renderWeeklySchedule = () => {
    console.log('🔍 renderWeeklySchedule called with schedules:', schedules);
    const weeklyGroups = groupSchedulesByWeek();
    console.log('🔍 weeklyGroups:', weeklyGroups);
    
    if (weeklyGroups.length === 0) {
      console.log('⚠️ No weekly groups found');
      return <div>Нет групп для отображения</div>;
    }
    
    const renderedGroups = weeklyGroups.map((group, index) => {
      console.log('🎨 Rendering group:', group);
      
      // Проверяем наличие данных - пропускаем группы с невалидными датами
      if (!group.startDate || group.startDate === 'undefined' || !group.schedules || group.schedules.length === 0) {
        console.log('⚠️ Skipping invalid group data:', group.title);
        return null; // Не рендерим невалидные группы
      }
      
      const startDate = new Date(group.startDate);
      const year = startDate.getFullYear();
      const month = getMonthName(group.startDate);
      const weekNumber = getWeekNumber(group.startDate);
      
      const sortedSchedules = group.schedules.sort((a, b) => getDayOrder(a.dayOfWeek) - getDayOrder(b.dayOfWeek));
      const firstDay = getDayName(sortedSchedules[0].dayOfWeek);
      const lastDay = getDayName(sortedSchedules[sortedSchedules.length - 1].dayOfWeek);
      
      console.log('🎨 About to render JSX for group:', group.title);
      
      const jsx = (
        <div key={`schedule-${group.title}-${index}`} style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '20px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '200px',
          display: 'block'
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
                <div style={{ 
                  fontSize: '16px', 
                  opacity: '0.9',
                  marginBottom: '10px'
                }}>
                  📅 {year} год, {month}, неделя {weekNumber}-я
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  opacity: '0.8'
                }}>
                  🗓️ {formatDate(group.startDate)} - {formatDate(group.endDate)}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditGroup(group);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                  ✏️ Редактировать
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.8)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                  🗑️ Удалить
                </button>
              </div>
            </div>
            
            {group.description && (
              <p style={{ margin: '0 0 15px 0', fontSize: '16px', opacity: '0.9' }}>
                {group.description}
              </p>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                📅 {firstDay} - {lastDay}
              </span>
              
              {group.location && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}>
                  📍 {group.location}
                </span>
              )}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
              📅 Расписание на неделю ({group.schedules.length} занятий)
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {group.schedules.map((schedule, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    {getDayName(schedule.dayOfWeek)}
                  </div>
                  <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '6px' }}>
                    📖 {schedule.subject}
                  </div>
                  <div style={{ fontSize: '14px', opacity: '0.8' }}>
                    🕐 {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      
      console.log('✅ JSX created for group:', group.title, jsx);
      return jsx;
    });
    
    // Фильтруем null значения
    const validGroups = renderedGroups.filter(group => group !== null);
    console.log('🎨 Final rendered groups array:', validGroups);
    return validGroups;
  };

  const pageStyles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: '0 0 10px 0' },
    subtitle: { fontSize: '18px', color: '#6b7280', margin: 0 },
    controls: { display: 'flex', justifyContent: 'center', marginBottom: '30px' },
    createButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
      transition: 'all 0.3s ease'
    },
    modal: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px'
    },
    modalContent: {
      background: 'white', borderRadius: '20px', padding: '30px', width: '100%',
      maxWidth: '600px', maxHeight: '90vh', overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: {
      width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb',
      fontSize: '14px', transition: 'border-color 0.2s ease'
    },
    select: {
      width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb',
      fontSize: '14px', background: 'white', cursor: 'pointer'
    },
    modalActions: { display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' },
    cancelButton: {
      padding: '12px 24px', borderRadius: '8px', border: '2px solid #e5e7eb',
      background: 'white', color: '#6b7280', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
    },
    saveButton: {
      padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#10b981',
      color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
    },
    dayButton: {
      padding: '15px 20px',
      borderRadius: '12px',
      border: '2px solid #e5e7eb',
      background: 'white',
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'all 0.3s ease'
    },
    dayButtonSelected: {
      background: '#10b981',
      color: 'white',
      borderColor: '#10b981'
    }
  };

  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📅 Управление расписанием</h1>
        <p style={pageStyles.subtitle}>Создавайте недельные расписания по дням</p>
      </div>

      <div style={pageStyles.controls}>
        <button
          style={pageStyles.createButton}
          onClick={() => setShowSelectDaysModal(true)}
        >
          ➕ Создать расписание
        </button>
      </div>

      {/* Шаг 1: Выбор дней недели */}
      {showSelectDaysModal && (
        <div style={pageStyles.modal} onClick={() => setShowSelectDaysModal(false)}>
          <div style={pageStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 25px 0', color: '#1f2937', fontSize: '28px' }}>
              📅 Выберите дни недели
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {[
                { key: 'monday', name: '🔵 Понедельник' },
                { key: 'tuesday', name: '🟢 Вторник' },
                { key: 'wednesday', name: '🟡 Среда' },
                { key: 'thursday', name: '🟠 Четверг' },
                { key: 'friday', name: '🔴 Пятница' },
                { key: 'saturday', name: '🟣 Суббота' },
                { key: 'sunday', name: '⚪ Воскресенье' }
              ].map(day => (
                <button
                  key={day.key}
                  onClick={() => handleDaySelection(day.key)}
                  style={{
                    ...pageStyles.dayButton,
                    ...(selectedDays.includes(day.key) ? pageStyles.dayButtonSelected : {})
                  }}
                >
                  {day.name}
                </button>
              ))}
            </div>
            
            <div style={pageStyles.modalActions}>
              <button style={pageStyles.cancelButton} onClick={() => setShowSelectDaysModal(false)}>
                ❌ Отмена
              </button>
              <button
                style={{
                  ...pageStyles.saveButton,
                  opacity: selectedDays.length === 0 ? 0.5 : 1,
                  cursor: selectedDays.length === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={proceedToScheduleEdit}
                disabled={selectedDays.length === 0}
              >
                ➡️ Далее ({selectedDays.length} дней)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шаг 2: Редактирование расписания */}
      {showEditScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0'
        }} onClick={() => setShowEditScheduleModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px 20px 0 0',
            padding: '15px 15px 100px 15px',
            width: '100%',
            maxWidth: '100vw',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '22px', textAlign: 'center' }}>
              ✏️ Редактировать расписание
            </h2>
            
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>📚 Название курса *</label>
              <input
                style={pageStyles.input}
                type="text"
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                placeholder="Например: Физика - Механика"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📅 Дата начала *</label>
                <input
                  style={pageStyles.input}
                  type="date"
                  value={scheduleForm.startDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, startDate: e.target.value})}
                />
              </div>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>📅 Дата окончания *</label>
                <input
                  style={pageStyles.input}
                  type="date"
                  value={scheduleForm.endDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div style={{
              background: '#f8fafc', padding: '20px', borderRadius: '12px',
              marginBottom: '25px', border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>📅 Расписание по дням</h3>
              
              {scheduleForm.subjects.map((subject, index) => (
                <div key={index} style={{
                  border: '2px solid #e2e8f0', borderRadius: '12px', padding: '20px',
                  marginBottom: '15px', background: 'white'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px' }}>
                    {getDayName(subject.dayOfWeek)}
                  </h4>
                  
                  <div>
                    {/* Первый ряд: Предмет и Начало */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <label style={{ ...pageStyles.label, marginBottom: '5px' }}>📚 Предмет</label>
                        <select
                          style={pageStyles.input}
                          value={subject.name}
                          onChange={(e) => updateSubject(index, 'name', e.target.value)}
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
                      <div>
                        <label style={{ ...pageStyles.label, marginBottom: '5px' }}>🕐 Начало</label>
                        <input
                          style={pageStyles.input}
                          type="time"
                          value={subject.startTime}
                          onChange={(e) => updateSubject(index, 'startTime', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Второй ряд: Конец и Минуты */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px',
                      gap: '10px',
                      alignItems: 'end'
                    }}>
                      <div>
                        <label style={{ ...pageStyles.label, marginBottom: '5px' }}>🕐 Конец</label>
                        <input
                          style={pageStyles.input}
                          type="time"
                          value={subject.endTime}
                          onChange={(e) => updateSubject(index, 'endTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ ...pageStyles.label, marginBottom: '5px' }}>⏱️ Мин</label>
                        <input
                          style={pageStyles.input}
                          type="number"
                          value={subject.duration}
                          onChange={(e) => updateSubject(index, 'duration', e.target.value)}
                          placeholder="90"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={pageStyles.modalActions}>
              <button style={pageStyles.cancelButton} onClick={() => setShowEditScheduleModal(false)}>
                ❌ Отмена
              </button>
              <button
                style={{
                  ...pageStyles.saveButton,
                  opacity: !scheduleForm.title.trim() || !scheduleForm.startDate || !scheduleForm.endDate || scheduleForm.subjects.length === 0 ? 0.5 : 1,
                  cursor: !scheduleForm.title.trim() || !scheduleForm.startDate || !scheduleForm.endDate || scheduleForm.subjects.length === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={() => {
                  console.log('🔍 Form validation check:');
                  console.log('Title:', scheduleForm.title.trim());
                  console.log('Start date:', scheduleForm.startDate);
                  console.log('End date:', scheduleForm.endDate);
                  console.log('Subjects count:', scheduleForm.subjects.length);
                  console.log('Subjects:', scheduleForm.subjects);
                  
                  if (editingSchedule) {
                    handleUpdateSchedule();
                  } else {
                    handleCreateSchedule();
                  }
                }}
                disabled={!scheduleForm.title.trim() || !scheduleForm.startDate || !scheduleForm.endDate || scheduleForm.subjects.length === 0}
              >
                {editingSchedule ? '✅ Обновить расписание' : '✅ Создать расписание'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ textAlign: 'center', margin: '40px 0 20px 0', color: '#1f2937' }}>
          📅 Мои расписания ({schedules.length})
        </h2>
        {schedules.length > 0 ? (
          <div style={{ padding: '10px' }}>
            {console.log('🎨 Rendering schedules:', schedules)}
            {(() => {
              const renderedSchedules = renderWeeklySchedule();
              console.log('🔍 About to render in DOM:', renderedSchedules);
              console.log('🔍 Rendered schedules length:', renderedSchedules?.length);
              return renderedSchedules;
            })()}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            📝 Расписания не найдены. Создайте первое расписание!
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px 20px 0 0',
            padding: '25px 20px 35px 20px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out',
            '@media (min-width: 768px)': {
              borderRadius: '20px',
              alignSelf: 'center',
              width: '90%',
              maxWidth: '400px'
            }
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              🗑️ Удаление расписания
            </h3>
            <p style={{
              margin: '0 0 25px 0',
              fontSize: '16px',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Вы уверены, что хотите удалить расписание <strong>"{scheduleToDelete?.title}"</strong>?
              <br />
              Это действие нельзя отменить.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              <button
                onClick={confirmDeleteSchedule}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  width: '100%',
                  minHeight: '48px'
                }}
              >
                {loading ? '⏳ Удаление...' : '🗑️ Удалить'}
              </button>
              <button
                onClick={cancelDeleteSchedule}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  minHeight: '48px'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
