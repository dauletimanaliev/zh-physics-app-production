import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const StudentManagementPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getTeacherStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to mock data
      setStudents([
        {
          id: 1,
          name: 'Айдар Касымов',
          username: '@aidar_k',
          points: 2450,
          level: 8,
          streak: 12,
          tests_completed: 15,
          avg_score: 85,
          last_active: '5 мин назад',
          status: 'active',
          progress: {
            mechanics: { completed: 8, total: 12, score: 78 },
            electricity: { completed: 5, total: 10, score: 85 },
            optics: { completed: 2, total: 6, score: 68 }
          }
        },
        {
          id: 2,
          name: 'Алия Мухамедова',
          username: '@aliya_m',
          points: 1890,
          level: 6,
          streak: 8,
          tests_completed: 12,
          avg_score: 78,
          last_active: '1 час назад',
          status: 'active',
          progress: {
            mechanics: { completed: 6, total: 12, score: 72 },
            electricity: { completed: 4, total: 10, score: 80 },
            optics: { completed: 3, total: 6, score: 75 }
          }
        },
        {
          id: 3,
          name: 'Данияр Сарсенов',
          username: '@daniiar_s',
          points: 3200,
          level: 10,
          streak: 25,
          tests_completed: 22,
          avg_score: 92,
          last_active: '2 мин назад',
          status: 'active',
          progress: {
            mechanics: { completed: 12, total: 12, score: 95 },
            electricity: { completed: 9, total: 10, score: 88 },
            optics: { completed: 5, total: 6, score: 90 }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    try {
      const detailedStudent = await apiClient.getStudentDetails(student.id);
      setSelectedStudent(detailedStudent);
    } catch (error) {
      console.error('Error loading student details:', error);
    }
    setShowStudentModal(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      default: return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚛️</div>
          <div>Загрузка списка учеников...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 5px 0',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>👥 Управление учениками</h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0',
            fontSize: '16px'
          }}>Просмотр и анализ успеваемости учеников</p>
        </div>
        <button
          onClick={() => window.navigateTo && window.navigateTo('teacher')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          ← Назад к панели
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="🔍 Поиск учеников..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '300px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontSize: '16px',
            outline: 'none'
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontSize: '16px',
            outline: 'none',
            minWidth: '150px'
          }}
        >
          <option value="all">Все ученики</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>

      {/* Students Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {filteredStudents.map(student => (
          <div
            key={student.id}
            onClick={() => handleStudentClick(student)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {/* Student Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 5px 0',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>{student.name}</h3>
                <p style={{
                  margin: '0',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px'
                }}>{student.username}</p>
              </div>
              <div style={{
                background: getStatusColor(student.status),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {getStatusText(student.status)}
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>
                  {student.points}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Баллы
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                  Ур. {student.level}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Уровень
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                  🔥 {student.streak}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Стрик
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#8b5cf6' }}>
                  {student.avg_score}%
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Средний балл
                </div>
              </div>
            </div>

            {/* Last Activity */}
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              Последняя активность: {student.last_active}
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Ученики не найдены</h3>
          <p style={{ margin: '0', fontSize: '16px' }}>
            Попробуйте изменить параметры поиска или фильтры
          </p>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '24px',
                fontWeight: '700'
              }}>📊 Детали ученика</h2>
              <button
                onClick={() => setShowStudentModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px'
            }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>
                {selectedStudent.name}
              </h3>
              <p style={{
                margin: '0',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px'
              }}>
                {selectedStudent.username}
              </p>
            </div>

            {/* Detailed Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                  {selectedStudent.points}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Баллы
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {selectedStudent.level}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Уровень
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                  {selectedStudent.streak}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Стрик (дни)
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                  {selectedStudent.tests_completed}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Тестов
                </div>
              </div>
            </div>

            {/* Progress by Topic */}
            {selectedStudent.progress && (
              <div>
                <h4 style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>Прогресс по темам:</h4>
                {Object.entries(selectedStudent.progress).map(([topic, data]) => (
                  <div key={topic} style={{
                    marginBottom: '15px',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                        {topic === 'mechanics' ? 'Механика' :
                         topic === 'electricity' ? 'Электричество' :
                         topic === 'optics' ? 'Оптика' : topic}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {data.completed}/{data.total} ({data.score}%)
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(data.completed / data.total) * 100}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, #10b981, #3b82f6)`,
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementPage;
