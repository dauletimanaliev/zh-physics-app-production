import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';

const StudentList = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('👥 Loading students list...');
      
      const response = await apiClient.getAllUsers();
      console.log('📊 Users response:', response);
      
      // Show all users as students (remove strict filtering)
      const studentsList = response.users || [];
      
      // Add registration status
      const studentsWithStatus = studentsList.map(student => ({
        ...student,
        isRegistered: !!((student.first_name || student.name) && student.telegram_id),
        lastActive: student.last_activity || null
      }));
      
      console.log(`✅ Found ${studentsWithStatus.length} students`);
      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('❌ Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.telegram_id?.toString().includes(searchQuery);
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'registered' && student.isRegistered) ||
                         (filterStatus === 'unregistered' && !student.isRegistered);
    
    return matchesSearch && matchesFilter;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'surname':
        return (a.surname || '').localeCompare(b.surname || '');
      case 'birth_date':
        return new Date(a.birth_date || 0) - new Date(b.birth_date || 0);
      case 'registration':
        return b.isRegistered - a.isRegistered;
      case 'activity':
        return new Date(b.last_activity || 0) - new Date(a.last_activity || 0);
      default:
        return 0;
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusBadge = (student) => {
    if (student.isRegistered) {
      return <span className="status-badge registered">✅ Зарегистрирован</span>;
    }
    return <span className="status-badge unregistered">❌ Не зарегистрирован</span>;
  };

  const getActivityStatus = (lastActivity) => {
    if (!lastActivity) return 'Никогда';
    
    const now = new Date();
    const activity = new Date(lastActivity);
    const diffHours = (now - activity) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Сейчас онлайн';
    if (diffHours < 24) return `${Math.floor(diffHours)} ч назад`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)} дн назад`;
    return formatDate(lastActivity);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Загрузка списка учеников...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Список учеников</h1>
        <p style={styles.subtitle}>Управление учениками и отслеживание регистрации</p>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Поиск по имени, фамилии или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="name">Сортировка по имени</option>
            <option value="surname">Сортировка по фамилии</option>
            <option value="birth_date">Сортировка по дате рождения</option>
            <option value="registration">Сортировка по регистрации</option>
            <option value="activity">Сортировка по активности</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="all">Все ученики</option>
            <option value="registered">Зарегистрированные</option>
            <option value="unregistered">Не зарегистрированные</option>
          </select>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{students.length}</span>
          <span style={styles.statLabel}>Всего учеников</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{students.filter(s => s.isRegistered).length}</span>
          <span style={styles.statLabel}>Зарегистрированы</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{students.filter(s => !s.isRegistered).length}</span>
          <span style={styles.statLabel}>Не зарегистрированы</span>
        </div>
      </div>

      <div style={styles.studentsList}>
        {sortedStudents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👥</div>
            <h3>Ученики не найдены</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          sortedStudents.map((student) => (
            <div key={student.id} style={styles.studentCard}>
              <div style={styles.studentHeader}>
                <div style={styles.studentAvatar}>
                  {student.photo_url ? (
                    <img src={student.photo_url} alt="Avatar" style={styles.avatarImage} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {(student.name || 'U').charAt(0)}
                    </div>
                  )}
                </div>
                <div style={styles.studentInfo}>
                  <h3 className="student-name">
                    {student.first_name || student.name || 'Студент'} {student.last_name || student.surname || ''}
                  </h3>
                  <p style={styles.studentId}>ID: {student.telegram_id || student.id}</p>
                </div>
                <div style={styles.studentStatus}>
                  {getStatusBadge(student)}
                </div>
              </div>

              <div style={styles.studentDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📅 Дата рождения:</span>
                  <span style={styles.detailValue}>{formatDate(student.birth_date)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📊 Статус:</span>
                  <span style={styles.detailValue}>{student.isRegistered ? 'Зарегистрирован' : 'Не завершил регистрацию'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📱 Telegram ID:</span>
                  <span style={styles.detailValue}>{student.telegram_id || 'Не указан'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>⏰ Последняя активность:</span>
                  <span style={styles.detailValue}>{getActivityStatus(student.last_activity)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>🏆 Очки:</span>
                  <span style={styles.detailValue}>{student.points || 0} XP</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>🔥 Серия:</span>
                  <span style={styles.detailValue}>{student.streak || 0} дней</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
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
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    color: 'white'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 10px 0'
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.8,
    margin: 0
  },
  controls: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  searchContainer: {
    flex: 1,
    minWidth: '300px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333'
  },
  filters: {
    display: 'flex',
    gap: '10px'
  },
  select: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '14px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    cursor: 'pointer'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)'
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.8
  },
  studentsList: {
    display: 'grid',
    gap: '20px'
  },
  studentCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  studentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  studentAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  studentId: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.7
  },
  studentStatus: {
    marginLeft: 'auto'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  studentDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: '14px',
    opacity: 0.8
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    opacity: 0.7
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .status-badge.registered {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }
  
  .status-badge.unregistered {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
`;
document.head.appendChild(styleSheet);

export default StudentList;
