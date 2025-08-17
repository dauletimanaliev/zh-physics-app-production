import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    completedTests: 0,
    totalMaterials: 0,
    averageScore: 0,
    streakLeaders: []
  });
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    loadDashboardData();
    loadStudents();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading dashboard data from API...');
      
      // Load real data from API with error handling
      const [adminStats, leaderboard] = await Promise.all([
        apiClient.getAdminStats().catch(err => {
          console.log('Admin stats API failed, using fallback');
          return { totalStudents: 0, activeToday: 0, completedTests: 0, totalMaterials: 0, averageScore: 0 };
        }),
        apiClient.getLeaderboard(5).catch(err => {
          console.log('Leaderboard API failed, using fallback');
          return [];
        })
      ]);

      console.log('📊 Admin stats:', adminStats);
      console.log('🏆 Leaderboard:', leaderboard);

      // Ensure leaderboard is an array
      const leaderboardArray = Array.isArray(leaderboard) ? leaderboard : [];

      setStats({
        totalStudents: adminStats.totalStudents || 0,
        activeToday: adminStats.activeToday || 0,
        completedTests: adminStats.completedTests || 0,
        totalMaterials: adminStats.totalMaterials || 0,
        averageScore: adminStats.averageScore || 0,
        streakLeaders: leaderboardArray.map(user => ({
          name: `${user.first_name || user.name || 'Студент'} ${(user.last_name || user.surname || '').charAt(0)}.`,
          streak: user.streak || 0,
          class: user.class || 'Не указан',
          points: user.points || user.experience || 0
        }))
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data if API fails
      setStats({
        totalStudents: 0,
        activeToday: 0,
        completedTests: 0,
        totalMaterials: 0,
        averageScore: 0,
        streakLeaders: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      console.log('🔍 Loading students from API...');
      
      // Load real student data from API
      const allUsers = await apiClient.getAllUsers();
      console.log('📊 All users loaded:', allUsers);
      
      // Ensure allUsers is an array and extract users from response
      const usersData = allUsers.users || allUsers;
      const usersArray = Array.isArray(usersData) ? usersData : [];
      const studentUsers = usersArray.filter(user => 
        !user.role || user.role === 'student' || user.role === undefined
      );
      
      console.log('👥 Student users filtered:', studentUsers);
      
      const studentsData = studentUsers.map(user => ({
        id: user.telegram_id || user.id,
        name: `${user.first_name || user.name || 'Студент'} ${user.last_name || user.surname || ''}`.trim(),
        class: user.class || 'Не указан',
        lastActive: getTimeAgo(user.last_activity || user.last_active || Date.now()),
        testsCompleted: user.tests_completed || 0,
        averageScore: user.average_score || user.avg_score || 0,
        streak: user.streak || 0,
        totalTime: formatStudyTime(user.total_study_time || 0),
        status: getStudentStatus(user.last_activity || user.last_active),
        points: user.points || user.experience || 0,
        level: user.level || Math.floor((user.points || 0) / 500) + 1
      }));
      
      console.log('✅ Students data processed:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to mock data if API fails
      setStudents([
        {
          id: 1,
          name: 'Айгерим Касымова',
          class: '11А',
          lastActive: '2 часа назад',
          testsCompleted: 45,
          averageScore: 85,
          streak: 15,
          totalTime: '24ч 30м',
          status: 'active'
        },
        {
          id: 2,
          name: 'Данияр Муратов',
          class: '11Б',
          lastActive: '1 час назад',
          testsCompleted: 38,
          averageScore: 78,
          streak: 12,
          totalTime: '18ч 45м',
          status: 'active'
        },
        {
          id: 3,
          name: 'Амина Сарсенова',
          class: '10А',
          lastActive: '30 минут назад',
          testsCompleted: 52,
          averageScore: 92,
          streak: 10,
          totalTime: '31ч 15м',
          status: 'active'
        },
        {
          id: 2,
          name: 'Данияр Муратов',
          class: '11Б',
          lastActive: '1 час назад',
          testsCompleted: 38,
          averageScore: 78,
          streak: 12,
          totalTime: '18ч 45м',
          status: 'active'
        },
        {
          id: 3,
          name: 'Амина Сарсенова',
          class: '10А',
          lastActive: '30 минут назад',
          testsCompleted: 52,
          averageScore: 92,
          streak: 10,
          totalTime: '31ч 15м',
          status: 'active'
        }
      ]);
    }
  };

  // Helper functions
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  };

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const getStudentStatus = (lastActivity) => {
    if (!lastActivity) return 'inactive';
    const now = new Date();
    const time = new Date(lastActivity);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 30) return 'active';
    if (diffInMinutes < 1440) return 'away';
    return 'inactive';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>📊 Панель управления</h2>
        <div className="quick-actions">
          <button className="action-btn primary" onClick={() => setActiveTab('materials')}>
            📚 Создать материал
          </button>
          <button className="action-btn secondary" onClick={() => setActiveTab('messages')}>
            💬 Отправить уведомление
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Всего учеников</p>
          </div>
          <div className="stat-trend positive">+12 за месяц</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3>{stats.activeToday}</h3>
            <p>Активны сегодня</p>
          </div>
          <div className="stat-trend positive">+8 от вчера</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{stats.completedTests}</h3>
            <p>Тестов пройдено</p>
          </div>
          <div className="stat-trend positive">+156 за неделю</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.averageScore}%</h3>
            <p>Средний балл</p>
          </div>
          <div className="stat-trend positive">+2.3%</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="activity-section">
          <h3>🔥 Лидеры по стрикам</h3>
          <div className="streak-leaders">
            {stats.streakLeaders.map((leader, index) => (
              <div key={index} className="leader-item">
                <div className="leader-rank">#{index + 1}</div>
                <div className="leader-info">
                  <span className="leader-name">{leader.name}</span>
                  <span className="leader-class">{leader.class}</span>
                </div>
                <div className="leader-streak">{leader.streak} дней</div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-activity">
          <h3>📈 Последняя активность</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-text">
                <strong>Студент</strong> завершил тест "Механика"
                <span className="activity-time">5 минут назад</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📚</div>
              <div className="activity-text">
                <strong>Студент</strong> изучил материал "Электричество"
                <span className="activity-time">12 минут назад</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🏆</div>
              <div className="activity-text">
                <strong>Амина С.</strong> получила достижение "Отличник"
                <span className="activity-time">1 час назад</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="students-management">
      <div className="students-header">
        <h2>👥 Управление учениками</h2>
        <div className="students-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Поиск учеников..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="class-filter"
          >
            <option value="all">Все классы</option>
            <option value="11А">11А</option>
            <option value="11Б">11Б</option>
            <option value="10А">10А</option>
            <option value="10Б">10Б</option>
          </select>
          <button className="export-btn">📊 Экспорт</button>
        </div>
      </div>

      <div className="students-grid">
        {filteredStudents.map(student => (
          <div key={student.id} className="student-card">
            <div className="student-header">
              <div className="student-avatar">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="student-info">
                <h4>{student.name}</h4>
                <span className="student-class">{student.class}</span>
              </div>
              <div className={`student-status ${student.status}`}></div>
            </div>
            
            <div className="student-stats">
              <div className="stat-item">
                <span className="stat-label">Тесты:</span>
                <span className="stat-value">{student.testsCompleted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Средний балл:</span>
                <span className="stat-value">{student.averageScore}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Стрик:</span>
                <span className="stat-value">{student.streak} дней</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Время:</span>
                <span className="stat-value">{student.totalTime}</span>
              </div>
            </div>

            <div className="student-actions">
              <button className="btn-small primary">👁️ Профиль</button>
              <button className="btn-small secondary">💬 Сообщение</button>
              <button className="btn-small tertiary">📊 Аналитика</button>
            </div>

            <div className="student-last-active">
              Последняя активность: {student.lastActive}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="messages-management">
      <div className="messages-header">
        <h2>💬 Система сообщений</h2>
        <button className="create-message-btn">✉️ Новое сообщение</button>
      </div>

      <div className="message-composer">
        <div className="composer-header">
          <h3>Создать сообщение</h3>
        </div>
        
        <div className="composer-form">
          <div className="form-row">
            <div className="form-group">
              <label>Получатели:</label>
              <select className="recipient-select">
                <option value="all">📢 Всем ученикам</option>
                <option value="class">🏫 Конкретному классу</option>
                <option value="individual">👤 Конкретному ученику</option>
              </select>
            </div>
            <div className="form-group">
              <label>Тип сообщения:</label>
              <select className="message-type-select">
                <option value="notification">🔔 Уведомление</option>
                <option value="reminder">⏰ Напоминание</option>
                <option value="congratulation">🎉 Поздравление</option>
                <option value="announcement">📣 Объявление</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Заголовок:</label>
            <input type="text" placeholder="Введите заголовок сообщения..." className="message-title" />
          </div>

          <div className="form-group">
            <label>Текст сообщения:</label>
            <textarea 
              placeholder="Введите текст сообщения..."
              className="message-content"
              rows="4"
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Отправить:</label>
              <select className="send-time-select">
                <option value="now">🚀 Сейчас</option>
                <option value="scheduled">⏰ Запланировать</option>
              </select>
            </div>
            <div className="form-group">
              <label>Приоритет:</label>
              <select className="priority-select">
                <option value="normal">📝 Обычный</option>
                <option value="high">⚠️ Высокий</option>
                <option value="urgent">🚨 Срочный</option>
              </select>
            </div>
          </div>

          <div className="composer-actions">
            <button className="btn-draft">💾 Сохранить черновик</button>
            <button className="btn-preview">👁️ Предпросмотр</button>
            <button className="btn-send">📤 Отправить</button>
          </div>
        </div>
      </div>

      <div className="message-templates">
        <h3>📋 Быстрые шаблоны</h3>
        <div className="templates-grid">
          <div className="template-card">
            <h4>🎂 День рождения</h4>
            <p>Поздравление с днем рождения</p>
            <button className="use-template-btn">Использовать</button>
          </div>
          <div className="template-card">
            <h4>⏰ Напоминание о тесте</h4>
            <p>Напоминание о предстоящем тесте</p>
            <button className="use-template-btn">Использовать</button>
          </div>
          <div className="template-card">
            <h4>🏆 Достижение</h4>
            <p>Поздравление с достижением</p>
            <button className="use-template-btn">Использовать</button>
          </div>
        </div>
      </div>

      <div className="message-history">
        <h3>📜 История сообщений</h3>
        <div className="history-list">
          <div className="history-item">
            <div className="message-info">
              <h4>Напоминание о контрольной работе</h4>
              <p>Отправлено всем ученикам 11А класса</p>
              <span className="message-date">Сегодня, 14:30</span>
            </div>
            <div className="message-stats">
              <span className="read-count">👁️ 28/30 прочитали</span>
              <button className="view-details-btn">Подробнее</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaterials = () => (
    <div className="materials-management">
      <div className="materials-header">
        <h2>📚 Управление материалами</h2>
        <button className="create-material-btn">➕ Создать материал</button>
      </div>

      <div className="materials-filters">
        <div className="filter-group">
          <select className="subject-filter">
            <option value="all">Все предметы</option>
            <option value="physics">Физика</option>
            <option value="math">Математика</option>
            <option value="chemistry">Химия</option>
          </select>
          <select className="status-filter">
            <option value="all">Все статусы</option>
            <option value="published">Опубликовано</option>
            <option value="draft">Черновик</option>
            <option value="archived">Архив</option>
          </select>
        </div>
        <div className="search-materials">
          <input type="text" placeholder="🔍 Поиск материалов..." />
        </div>
      </div>

      <div className="materials-grid">
        <div className="material-card">
          <div className="material-thumbnail">
            <div className="material-type">📹</div>
          </div>
          <div className="material-info">
            <h4>Законы Ньютона</h4>
            <p>Видео-урок о трех законах Ньютона</p>
            <div className="material-meta">
              <span className="material-subject">Физика</span>
              <span className="material-status published">Опубликовано</span>
              <span className="material-views">👁️ 245</span>
            </div>
          </div>
          <div className="material-actions">
            <button className="btn-edit">✏️</button>
            <button className="btn-stats">📊</button>
            <button className="btn-more">⋯</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="schedule-management">
      <div className="schedule-header">
        <h2>📅 Управление расписанием</h2>
        <button 
          className="create-event-btn"
          onClick={() => setCurrentPage('schedule')}
        >
          ➕ Создать событие
        </button>
      </div>

      <div className="schedule-calendar">
        <div className="calendar-header">
          <button className="nav-btn">‹</button>
          <h3>Декабрь 2024</h3>
          <button className="nav-btn">›</button>
        </div>
        
        <div className="calendar-grid">
          <div className="calendar-day-header">Пн</div>
          <div className="calendar-day-header">Вт</div>
          <div className="calendar-day-header">Ср</div>
          <div className="calendar-day-header">Чт</div>
          <div className="calendar-day-header">Пт</div>
          <div className="calendar-day-header">Сб</div>
          <div className="calendar-day-header">Вс</div>
          
          {Array.from({length: 35}, (_, i) => {
            const dayNumber = i > 30 ? i - 30 : i + 1;
            return (
              <div key={`calendar-day-${i}`} className={`calendar-day ${i === 13 ? 'today' : ''} ${i > 30 ? 'other-month' : ''}`}>
                <span className="day-number">{dayNumber}</span>
                {i === 13 && <div className="event-dot physics"></div>}
                {i === 20 && <div className="event-dot test"></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="upcoming-events">
        <h3>📋 Ближайшие события</h3>
        <div className="events-list">
          <div className="event-item">
            <div className="event-date">
              <span className="day">14</span>
              <span className="month">Дек</span>
            </div>
            <div className="event-info">
              <h4>Урок: Электромагнетизм</h4>
              <p>11А класс • 10:00 - 11:30</p>
            </div>
            <div className="event-actions">
              <button className="btn-edit-event">✏️</button>
              <button className="btn-notify">🔔</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-management">
      <div className="analytics-header">
        <h2>📊 Аналитика и отчеты</h2>
        <div className="analytics-controls">
          <select className="period-select">
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
          <button className="export-report-btn">📥 Экспорт отчета</button>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="metric-card">
          <h3>👥 Активность учеников</h3>
          <div className="metric-chart">
            <div className="chart-placeholder">📈 График активности</div>
          </div>
        </div>
        
        <div className="metric-card">
          <h3>📝 Результаты тестов</h3>
          <div className="metric-chart">
            <div className="chart-placeholder">📊 Диаграмма результатов</div>
          </div>
        </div>
      </div>

      <div className="detailed-reports">
        <h3>📋 Детальные отчеты</h3>
        <div className="reports-grid">
          <div className="report-card">
            <h4>📈 Отчет по успеваемости</h4>
            <p>Анализ успеваемости по классам и предметам</p>
            <button className="generate-report-btn">Сгенерировать</button>
          </div>
          <div className="report-card">
            <h4>⏱️ Отчет по времени</h4>
            <p>Анализ времени, проведенного в приложении</p>
            <button className="generate-report-btn">Сгенерировать</button>
          </div>
          <div className="report-card">
            <h4>🎯 Отчет по достижениям</h4>
            <p>Статистика по полученным достижениям</p>
            <button className="generate-report-btn">Сгенерировать</button>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'students', label: '👥 Ученики', icon: '👥' },
    { id: 'messages', label: '💬 Сообщения', icon: '💬' },
    { id: 'materials', label: '📚 Материалы', icon: '📚' },
    { id: 'schedule', label: '📅 Расписание', icon: '📅' },
    { id: 'analytics', label: '📊 Аналитика', icon: '📊' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'students': return renderStudents();
      case 'messages': return renderMessages();
      case 'materials': return renderMaterials();
      case 'schedule': return renderSchedule();
      case 'analytics': return renderAnalytics();
      default: return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка панели управления...</p>
      </div>
    );
  }

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: 'white',
    padding: '20px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    gap: '20px'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '500'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25px 30px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    marginBottom: '30px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  logo: {
    fontSize: '40px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '10px',
    backdropFilter: 'blur(10px)'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    background: 'linear-gradient(45deg, #fff, #e0e7ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '14px',
    margin: '4px 0 0 0',
    opacity: 0.8
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  notificationBadge: {
    position: 'relative',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  notificationIcon: {
    fontSize: '20px'
  },
  notificationCount: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  userAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px'
  },
  userRole: {
    fontSize: '12px',
    opacity: 0.7
  },
  navigationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  navCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden'
  },
  navCardActive: {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
  },
  navCardIcon: {
    fontSize: '32px',
    marginBottom: '15px',
    display: 'block'
  },
  navCardContent: {
    position: 'relative',
    zIndex: 2
  },
  navCardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  navCardDescription: {
    fontSize: '14px',
    opacity: 0.8,
    margin: 0,
    lineHeight: 1.4
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '4px',
    height: '100%',
    background: 'linear-gradient(to bottom, #22c55e, #16a34a)',
    borderRadius: '0 20px 20px 0'
  },
  quickActionsPanel: {
    background: 'rgba(59, 130, 246, 0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '25px 30px',
    marginBottom: '30px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  quickActions: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  quickActionBtn: {
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
  },
  quickActionBtnSecondary: {
    background: 'rgba(236, 72, 153, 0.2)',
    border: '1px solid rgba(236, 72, 153, 0.3)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  contentArea: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minHeight: '400px'
  }
};

  return (
    <div style={styles.container}>
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loadingText}>Загрузка панели управления...</div>
        </div>
      ) : (
        <>
          {/* Modern Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.logoContainer}>
                <div style={styles.logo}>🎓</div>
                <div>
                  <h1 style={styles.title}>Административная панель</h1>
                  <p style={styles.subtitle}>Система управления образованием</p>
                </div>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.notificationBadge}>
                <span style={styles.notificationIcon}>🔔</span>
                <span style={styles.notificationCount}>3</span>
              </div>
              <div style={styles.userProfile}>
                <div style={styles.userAvatar}>
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'A'}
                </div>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>{user?.name || 'Администратор'}</span>
                  <span style={styles.userRole}>Директор/Учитель</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div style={styles.navigationGrid}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                style={{
                  ...styles.navCard,
                  ...(activeTab === tab.id ? styles.navCardActive : {})
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <div style={styles.navCardIcon}>{tab.icon}</div>
                <div style={styles.navCardContent}>
                  <h3 style={styles.navCardTitle}>{tab.label.replace(/^\S+\s/, '')}</h3>
                  <p style={styles.navCardDescription}>
                    {tab.id === 'dashboard' && 'Обзор системы'}
                    {tab.id === 'students' && 'Управление учениками'}
                    {tab.id === 'messages' && 'Отправка уведомлений'}
                    {tab.id === 'materials' && 'Создание контента'}
                    {tab.id === 'schedule' && 'Планирование занятий'}
                    {tab.id === 'analytics' && 'Отчеты и статистика'}
                  </p>
                </div>
                {activeTab === tab.id && <div style={styles.activeIndicator}></div>}
              </div>
            ))}
          </div>

          {/* Quick Actions Panel */}
          <div style={styles.quickActionsPanel}>
            <h2 style={styles.panelTitle}>📊 Панель управления</h2>
            <div style={styles.quickActions}>
              <button 
                style={styles.quickActionBtn}
                onClick={() => setActiveTab('materials')}
              >
                📚 Создать материал
              </button>
              <button 
                style={styles.quickActionBtnSecondary}
                onClick={() => setActiveTab('messages')}
              >
                💬 Отправить уведомление
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div style={styles.contentArea}>
            {renderTabContent()}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
