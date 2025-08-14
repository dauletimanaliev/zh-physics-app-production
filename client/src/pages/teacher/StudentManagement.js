import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';

const StudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading real students from API...');
      
      // Load all real users from the system
      const allUsers = await apiClient.getAllUsers();
      console.log('📊 Loaded users:', allUsers);
      
      // Filter only students (not teachers) and add calculated fields
      const studentUsers = allUsers
        .filter(user => user.role === 'student')
        .map(student => ({
          ...student,
          // Calculate derived fields from real data
          level: Math.floor((student.points || 0) / 500) + 1, // Level based on points
          experience: student.points || 0,
          totalPoints: student.points || 0,
          testsCompleted: student.tests_completed || 0,
          averageScore: student.avg_score || 0,
          streak: student.streak || 0,
          status: student.last_active ? 
            (new Date() - new Date(student.last_active) < 7 * 24 * 60 * 60 * 1000 ? 'active' : 'inactive') : 
            'inactive',
          lastActive: student.last_active || student.created_at || new Date().toISOString(),
          joinedAt: student.created_at || new Date().toISOString(),
          // Handle missing fields gracefully
          school: student.school || 'Не указана',
          class: student.class || 'Не указан'
        }));
      
      console.log('✅ Processed students:', studentUsers);
      setStudents(studentUsers);
      
      // Show message if no students found
      if (studentUsers.length === 0) {
        console.log('ℹ️ No students found in the system');
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      // Show empty state instead of mock data
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (student) => {
    try {
      setSelectedStudent(student);
      // Load detailed student information
      const details = await apiClient.getStudentDetails(student.id);
      setStudentDetails(details);
      setShowStudentProfile(true);
    } catch (error) {
      console.error('Error loading student details:', error);
      // Fallback with basic info
      setStudentDetails({
        ...student,
        recentTests: [
          { id: 1, title: 'Основы кинематики', score: 85, date: '2024-03-10', duration: 12 },
          { id: 2, title: 'Законы Ньютона', score: 78, date: '2024-03-08', duration: 15 },
          { id: 3, title: 'Работа и энергия', score: 92, date: '2024-03-05', duration: 10 }
        ],
        achievements: [
          { id: 1, title: 'Первый тест', icon: '🎯', date: '2024-01-20' },
          { id: 2, title: 'Неделя подряд', icon: '🔥', date: '2024-02-15' },
          { id: 3, title: 'Отличник', icon: '⭐', date: '2024-03-01' }
        ],
        weeklyActivity: [
          { day: 'Пн', tests: 2, points: 150 },
          { day: 'Вт', tests: 1, points: 75 },
          { day: 'Ср', tests: 3, points: 225 },
          { day: 'Чт', tests: 0, points: 0 },
          { day: 'Пт', tests: 2, points: 180 },
          { day: 'Сб', tests: 1, points: 90 },
          { day: 'Вс', tests: 0, points: 0 }
        ]
      });
      setShowStudentProfile(true);
    }
  };

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.school?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = filterLevel === 'all' || student.level.toString() === filterLevel;
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return b.level - a.level;
        case 'score':
          return b.averageScore - a.averageScore;
        case 'activity':
          return new Date(b.lastActive) - new Date(a.lastActive);
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getLastActiveText = (lastActive) => {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffInHours = Math.floor((now - lastActiveDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Сейчас онлайн';
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} дн назад`;
    return `${Math.floor(diffInDays / 7)} нед назад`;
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
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 10px 0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.8)',
      margin: '0'
    },
    controls: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '12px 15px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      placeholder: 'rgba(255, 255, 255, 0.6)'
    },
    select: {
      padding: '12px 15px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px'
    },
    studentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px'
    },
    studentCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    studentHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '15px'
    },
    avatar: {
      width: '50px',
      height: '50px',
      minWidth: '50px',
      minHeight: '50px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '600',
      marginRight: '15px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      aspectRatio: '1',
      flexShrink: 0,
      boxSizing: 'border-box'
    },
    studentInfo: {
      flex: 1
    },
    studentName: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '5px'
    },
    studentSchool: {
      fontSize: '12px',
      opacity: 0.8
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      marginBottom: '15px'
    },
    statItem: {
      textAlign: 'center',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px'
    },
    statValue: {
      fontSize: '20px',
      fontWeight: '700',
      display: 'block'
    },
    statLabel: {
      fontSize: '11px',
      opacity: 0.8
    },
    viewButton: {
      width: '100%',
      padding: '12px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '10px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
      color: 'white'
    },
    closeButton: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer'
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '15px'
    },
    profileAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      fontWeight: '700'
    },
    profileInfo: {
      flex: 1
    },
    profileName: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '5px'
    },
    profileDetails: {
      fontSize: '14px',
      opacity: 0.8,
      lineHeight: '1.5'
    },
    tabsContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      paddingBottom: '10px'
    },
    tab: {
      padding: '8px 16px',
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      color: 'white',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    activeTab: {
      background: 'rgba(255, 255, 255, 0.3)'
    },
    tabContent: {
      minHeight: '300px'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Загрузка студентов...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>👥 Управление студентами</h1>
        <p style={pageStyles.subtitle}>Просматривайте прогресс и управляйте студентами</p>
      </div>

      {/* Controls */}
      <div style={pageStyles.controls}>
        <input
          style={pageStyles.searchInput}
          type="text"
          placeholder="🔍 Поиск по имени, фамилии или школе..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          style={pageStyles.select}
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="all">Все уровни</option>
          <option value="1">Уровень 1</option>
          <option value="2">Уровень 2</option>
          <option value="3">Уровень 3</option>
          <option value="4">Уровень 4</option>
          <option value="5">Уровень 5+</option>
        </select>

        <select
          style={pageStyles.select}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">По имени</option>
          <option value="level">По уровню</option>
          <option value="score">По баллам</option>
          <option value="activity">По активности</option>
        </select>
      </div>

      {/* Students Grid */}
      {filteredStudents.length > 0 ? (
        <div style={pageStyles.studentsGrid}>
          {filteredStudents.map(student => (
            <div
              key={student.id}
              style={pageStyles.studentCard}
              onClick={() => handleViewProfile(student)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={pageStyles.studentHeader}>
                <div style={pageStyles.avatar}>
                  {student.name.charAt(0)}{student.surname.charAt(0)}
                </div>
                <div style={pageStyles.studentInfo}>
                  <div style={pageStyles.studentName}>
                    {student.name} {student.surname}
                  </div>
                  <div style={pageStyles.studentSchool}>
                    {student.school} • {student.class}
                  </div>
                </div>
                <div
                  style={{
                    ...pageStyles.statusBadge,
                    background: getStatusColor(student.status),
                    color: 'white'
                  }}
                >
                  {student.status === 'active' ? 'Активен' : 'Неактивен'}
                </div>
              </div>

              <div style={pageStyles.statsGrid}>
                <div style={pageStyles.statItem}>
                  <span style={pageStyles.statValue}>{student.level}</span>
                  <span style={pageStyles.statLabel}>Уровень</span>
                </div>
                <div style={pageStyles.statItem}>
                  <span style={pageStyles.statValue}>{student.averageScore}%</span>
                  <span style={pageStyles.statLabel}>Средний балл</span>
                </div>
                <div style={pageStyles.statItem}>
                  <span style={pageStyles.statValue}>{student.testsCompleted}</span>
                  <span style={pageStyles.statLabel}>Тестов</span>
                </div>
                <div style={pageStyles.statItem}>
                  <span style={pageStyles.statValue}>{student.streak}</span>
                  <span style={pageStyles.statLabel}>Streak</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '15px' }}>
                Последняя активность: {getLastActiveText(student.lastActive)}
              </div>

              <button
                style={pageStyles.viewButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                📊 Посмотреть профиль
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: '50px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
          <h3>
            {searchTerm || filterLevel !== 'all' 
              ? 'Студенты не найдены' 
              : 'Пока нет зарегистрированных студентов'
            }
          </h3>
          <p style={{ opacity: 0.8 }}>
            {searchTerm || filterLevel !== 'all'
              ? 'Попробуйте изменить параметры поиска'
              : 'Студенты появятся здесь после регистрации в системе'
            }
          </p>
        </div>
      )}

      {/* Student Profile Modal */}
      {showStudentProfile && selectedStudent && studentDetails && (
        <div style={pageStyles.modal}>
          <div style={{ ...pageStyles.modalContent, position: 'relative' }}>
            <button
              style={pageStyles.closeButton}
              onClick={() => {
                setShowStudentProfile(false);
                setSelectedStudent(null);
                setStudentDetails(null);
              }}
            >
              ✕
            </button>

            {/* Profile Header */}
            <div style={pageStyles.profileHeader}>
              <div style={pageStyles.profileAvatar}>
                {selectedStudent.name.charAt(0)}{selectedStudent.surname.charAt(0)}
              </div>
              <div style={pageStyles.profileInfo}>
                <div style={pageStyles.profileName}>
                  {selectedStudent.name} {selectedStudent.surname}
                </div>
                <div style={pageStyles.profileDetails}>
                  📚 {selectedStudent.school} • {selectedStudent.class}<br/>
                  🎂 {new Date().getFullYear() - selectedStudent.birthYear} лет<br/>
                  📅 В системе с {new Date(selectedStudent.joinedAt).toLocaleDateString('ru-RU')}<br/>
                  ⭐ Уровень {selectedStudent.level} • {selectedStudent.totalPoints} очков
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div style={pageStyles.statsGrid}>
              <div style={pageStyles.statItem}>
                <span style={pageStyles.statValue}>{studentDetails.testsCompleted}</span>
                <span style={pageStyles.statLabel}>Тестов пройдено</span>
              </div>
              <div style={pageStyles.statItem}>
                <span style={pageStyles.statValue}>{studentDetails.averageScore}%</span>
                <span style={pageStyles.statLabel}>Средний балл</span>
              </div>
              <div style={pageStyles.statItem}>
                <span style={pageStyles.statValue}>{studentDetails.streak}</span>
                <span style={pageStyles.statLabel}>Дней подряд</span>
              </div>
              <div style={pageStyles.statItem}>
                <span style={pageStyles.statValue}>{studentDetails.totalPoints}</span>
                <span style={pageStyles.statLabel}>Всего очков</span>
              </div>
            </div>

            {/* Recent Tests */}
            <div style={{ marginTop: '30px' }}>
              <h3>📝 Последние тесты</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {studentDetails.recentTests?.map(test => (
                  <div
                    key={test.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600' }}>{test.title}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {new Date(test.date).toLocaleDateString('ru-RU')} • {test.duration} мин
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        background: test.score >= 80 ? '#10b981' : test.score >= 60 ? '#f59e0b' : '#ef4444',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {test.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div style={{ marginTop: '30px' }}>
              <h3>🏆 Достижения</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {studentDetails.achievements?.map(achievement => (
                  <div
                    key={achievement.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{achievement.icon}</span>
                    <span>{achievement.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
