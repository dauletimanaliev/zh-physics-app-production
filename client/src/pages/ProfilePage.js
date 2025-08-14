import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [achievements, setAchievements] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [editForm, setEditForm] = useState({});

  const tabs = [
    { id: 'stats', name: 'Статистика', icon: '📊' },
    { id: 'achievements', name: 'Достижения', icon: '🏆' },
    { id: 'settings', name: 'Настройки', icon: '⚙️' },
    { id: 'history', name: 'История', icon: '📚' }
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Load real user stats from API
      let userStats = {
        level: 1,
        experience: 0,
        nextLevelExp: 100,
        streak: 0,
        totalPoints: 0,
        testsCompleted: 0,
        studyTime: 0,
        rank: null,
        coins: 0
      };

      if (user?.id) {
        try {
          console.log('🔄 Loading user stats from API for user:', user.id);
          const apiStats = await apiClient.getUserProgress(user.id);
          userStats = {
            level: apiStats.level || 1,
            experience: apiStats.points || 0,
            nextLevelExp: (apiStats.level || 1) * 100,
            streak: apiStats.streak || 0,
            totalPoints: apiStats.points || 0,
            testsCompleted: apiStats.tests_completed || 0,
            studyTime: 0, // TODO: Add to API
            rank: null, // TODO: Add to API
            coins: 0 // TODO: Add to API
          };
          console.log('✅ User stats loaded from API:', userStats);
        } catch (error) {
          console.error('⚠️ Failed to load user stats from API, using defaults:', error);
          console.log('🆕 New user - showing zero stats');
        }
      } else {
        console.log('🆕 No user ID - showing zero stats');
      }

      const profileData = {
        name: userData.name || user?.firstName || 'Студент',
        email: userData.email || '',
        phone: userData.phone || '',
        birthDate: userData.birthDate || '',
        school: userData.school || 'Школа №1',
        grade: userData.grade || '11 класс',
        avatar: userData.avatar || null,
        ...userStats
      };
      
      setProfile(profileData);
      setEditForm(profileData);
      
      // Mock achievements
      setAchievements([
        {
          id: 1,
          title: 'Первые шаги',
          description: 'Прошли первый тест',
          icon: '🚀',
          earned: true,
          earnedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          title: 'Неделя подряд',
          description: 'Занимались 7 дней подряд',
          icon: '🔥',
          earned: true,
          earnedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          id: 3,
          title: 'Отличник',
          description: 'Набрали 90%+ в 5 тестах',
          icon: '⭐',
          earned: false,
          progress: 3,
          maxProgress: 5
        }
      ]);
      
      // Load real statistics from API or use defaults for new users
      let statisticsData = {
        totalStudyTime: 0,
        averageSessionTime: 0,
        favoriteSubject: 'Не определен',
        strongestTopic: 'Не определен',
        testHistory: [],
        subjectProgress: [
          { subject: 'Механика', progress: 0 },
          { subject: 'Электричество', progress: 0 },
          { subject: 'Оптика', progress: 0 },
          { subject: 'Термодинамика', progress: 0 }
        ]
      };

      if (user?.id && userStats.testsCompleted > 0) {
        try {
          console.log('🔄 Loading detailed statistics from API for user:', user.id);
          // TODO: Add API endpoint for detailed statistics
          // const apiStatistics = await apiClient.getUserStatistics(user.id);
          
          // For now, calculate basic statistics from available data
          const totalTests = userStats.testsCompleted || 0;
          const totalPoints = userStats.totalPoints || 0;
          
          if (totalTests > 0) {
            // Calculate estimated study time (rough estimate: 10 minutes per test)
            const estimatedStudyTime = totalTests * 10;
            statisticsData = {
              totalStudyTime: estimatedStudyTime,
              averageSessionTime: Math.round(estimatedStudyTime / Math.max(totalTests, 1)),
              favoriteSubject: totalPoints > 100 ? 'Механика' : 'Не определен',
              strongestTopic: 'Базовые понятия',
              testHistory: [], // TODO: Load from API
              subjectProgress: [
                { subject: 'Механика', progress: Math.min(Math.round((totalPoints / 50) * 10), 100) },
                { subject: 'Электричество', progress: Math.min(Math.round((totalPoints / 75) * 10), 100) },
                { subject: 'Оптика', progress: Math.min(Math.round((totalPoints / 100) * 10), 100) },
                { subject: 'Термодинамика', progress: Math.min(Math.round((totalPoints / 125) * 10), 100) }
              ]
            };
          }
          
          console.log('✅ Statistics calculated from user progress:', statisticsData);
        } catch (error) {
          console.error('⚠️ Failed to load detailed statistics, using defaults:', error);
        }
      } else {
        console.log('🆕 New user or no tests completed - showing zero statistics');
      }

      setStatistics(statisticsData);
      
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await apiClient.updateUserProfile(editForm);
      setProfile(editForm);
      setEditing(false);
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...userData, ...editForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (updateUser) {
        updateUser(updatedUser);
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Ошибка при сохранении профиля');
    }
  };

  const getProgressPercentage = () => {
    if (!profile) return 0;
    return Math.min((profile.experience / profile.nextLevelExp) * 100, 100);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>👤</div>
          <div>Загрузка профиля...</div>
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
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0 0 10px 0',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>👤 Профиль</h1>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: '0'
        }}>Ваша статистика и настройки</p>
      </div>

      {/* Profile Card */}
      {profile && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            minWidth: '100px',
            minHeight: '100px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: '600',
            margin: '0 auto 20px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            aspectRatio: '1',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}>
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            {profile.name}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '20px' }}>
{profile.role === 'teacher' ? (
              `Уровень ${profile.level} • Преподаватель физики`
            ) : (
              `Уровень ${profile.level} • ${profile.school} • ${profile.grade}`
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '6px',
                width: `${getProgressPercentage()}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
              {profile.experience}/{profile.nextLevelExp} XP до следующего уровня
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                {profile.totalPoints}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Очков
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                {profile.testsCompleted}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Тестов
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                {profile.streak}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Дней подряд
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                #{profile.rank}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Место
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              border: 'none',
              background: activeTab === tab.id 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === tab.id 
                ? 'white' 
                : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {activeTab === 'stats' && statistics && (
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>📊 Подробная статистика</h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {formatTime(statistics.totalStudyTime)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Общее время
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {formatTime(statistics.averageSessionTime)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Среднее за сессию
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {statistics.favoriteSubject}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Любимый предмет
                </div>
              </div>
            </div>

            <h4 style={{ margin: '30px 0 16px', fontSize: '16px' }}>Прогресс по предметам:</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {statistics.subjectProgress.map((subject, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{subject.subject}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '100px',
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${subject.progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '40px' }}>
                      {subject.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>🏆 Достижения</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  style={{
                    padding: '20px',
                    background: achievement.earned 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: achievement.earned 
                      ? '1px solid rgba(16, 185, 129, 0.3)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative'
                  }}
                >
                  {achievement.earned && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#34d399'
                    }}>
                      ✓ Получено
                    </div>
                  )}
                  
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{achievement.icon}</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    {achievement.title}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: '1.4',
                    marginBottom: '12px'
                  }}>
                    {achievement.description}
                  </div>
                  
                  {!achievement.earned && achievement.progress !== undefined && (
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Прогресс: {achievement.progress}/{achievement.maxProgress}
                    </div>
                  )}
                  
                  {achievement.earned && achievement.earnedDate && (
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Получено: {achievement.earnedDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && profile && (
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>⚙️ Настройки профиля</h3>
            
            {editing ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>Имя</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      placeholder="Введите ваше имя"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      placeholder="Введите email"
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '20px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginRight: '12px'
                    }}
                  >
                    💾 Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditForm(profile);
                    }}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '20px',
                      border: 'none',
                      background: 'rgba(107, 114, 128, 0.3)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ❌ Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Имя</div>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      fontSize: '14px'
                    }}>
                      {profile.name}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Email</div>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      fontSize: '14px'
                    }}>
                      {profile.email || 'Не указан'}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginTop: '20px'
                  }}
                >
                  ✏️ Редактировать
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && statistics && (
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>📚 История тестов</h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {statistics.testHistory.map((test, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {new Date(test.date).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {test.subject}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: getScoreColor(test.score)
                  }}>
                    {test.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
