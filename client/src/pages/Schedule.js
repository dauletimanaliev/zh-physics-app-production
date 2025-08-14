import React, { useState, useEffect } from 'react';
import './Schedule.css';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  const daysOfWeek = [
    'Понедельник',
    'Вторник', 
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье'
  ];

  useEffect(() => {
    fetchSchedule();
    setSelectedDay(getCurrentDay());
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await new Promise((resolve) =>
        setTimeout(() =>
          resolve({
            data: [
              {
                id: 1,
                day_of_week: 0,
                time_start: '09:00',
                time_end: '10:30',
                subject: 'Физика',
                topic: 'Механика',
                teacher: 'Иванов И.И.',
                classroom: 'Каб. 101'
              },
              {
                id: 2,
                day_of_week: 0,
                time_start: '10:45',
                time_end: '12:15',
                subject: 'Математика',
                topic: 'Алгебра',
                teacher: 'Петров П.П.',
                classroom: 'Каб. 205'
              }
            ],
          }),
        1000
        )
      );
      setSchedule(response.data);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDay = () => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  };

  const getScheduleForDay = (dayIndex) => {
    return schedule.filter(item => item.day_of_week === dayIndex);
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>📅 Расписание занятий</h1>
        <p>План уроков на неделю</p>
      </div>

      <div className="day-selector">
        {daysOfWeek.map((day, index) => (
          <button
            key={index}
            className={`day-button ${selectedDay === index ? 'active' : ''}`}
            onClick={() => setSelectedDay(index)}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      <div className="schedule-content">
        {loading ? (
          <div className="loading">Загрузка расписания...</div>
        ) : (
          <div className="schedule-day">
            <h2>{daysOfWeek[selectedDay]}</h2>
            
            {getScheduleForDay(selectedDay).length === 0 ? (
              <div className="no-classes">
                <h3>Свободный день! 🎉</h3>
                <p>На этот день занятий не запланировано</p>
              </div>
            ) : (
              <div className="classes-list">
                {getScheduleForDay(selectedDay).map((classItem) => (
                  <div key={classItem.id} className="class-card">
                    <div className="class-time">
                      {classItem.time_start} - {classItem.time_end}
                    </div>
                    <div className="class-details">
                      <div className="class-subject">{classItem.subject}</div>
                      <div className="class-topic">{classItem.topic}</div>
                      <div className="class-teacher">👨‍🏫 {classItem.teacher}</div>
                      <div className="class-room">📍 {classItem.classroom}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
