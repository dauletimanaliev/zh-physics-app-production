import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import LogoutModal from './LogoutModal';

const TeacherProfile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    language: 'ru',
    role: 'teacher',
    email: '',
    phone: '',
    subjects: ['Физика'],
    experience: '',
    education: '',
    bio: '',
    studentsCount: 0,
    testsAssigned: 0,
    materialsCreated: 0,
    avgStudentScore: 0,
    totalXP: 0,
    level: 1,
    streak: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [classAnalytics, setClassAnalytics] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    loadTeacherProfile();
  }, [user]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout(true); // true = delete from database
      // User will be redirected to registration by App.js
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, still logout locally
      await logout(false);
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const loadTeacherProfile = async () => {
    setLoading(true);
    try {
      // Get basic user data from localStorage first
      const savedUser = localStorage.getItem('user');
      let userData = {};
      if (savedUser) {
        userData = JSON.parse(savedUser);
      } else if (user) {
        userData = user;
      }

      // Get teacher ID (use telegram_id or fallback to 1 for teacher)
      const teacherId = userData.telegram_id || userData.id || 1;

      // Load comprehensive real teacher data from API
      const realTeacherData = await apiClient.getRealTeacherData(teacherId);
      
      if (realTeacherData.profile && Object.keys(realTeacherData.profile).length > 0) {
        // Use real profile data from API
        const realProfile = realTeacherData.profile;
        setProfileData({
          firstName: realProfile.firstName || userData.firstName || userData.first_name || '',
          lastName: realProfile.lastName || userData.lastName || userData.last_name || '',
          birthDate: userData.birthDate || '',
          language: userData.language || 'ru',
          role: userData.role || 'teacher',
          email: realProfile.email || userData.email || '',
          phone: realProfile.phone || userData.phone || '',
          subjects: realProfile.subjects || ['Физика'],
          experience: realProfile.experience || '1 жыл',
          education: realProfile.education || 'Физика мамандығы',
          bio: realProfile.bio || 'Физика пәнінің мұғалімі',
          studentsCount: realProfile.studentsCount || 0,
          testsAssigned: realProfile.testsAssigned || 0,
          materialsCreated: realProfile.materialsCreated || 0,
          avgStudentScore: realProfile.avgStudentScore || 0,
          totalXP: realProfile.totalXP || 0,
          level: realProfile.level || 1,
          streak: realProfile.streak || 0
        });

        // Set real class analytics
        setClassAnalytics(realTeacherData.analytics || {});
      } else {
        // Fallback to basic user data with minimal stats
        setProfileData(prev => ({
          ...prev,
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          birthDate: userData.birthDate || '',
          language: userData.language || 'ru',
          role: userData.role || 'teacher'
        }));
      }
    } catch (error) {
      console.error('Error loading teacher profile:', error);
      // Fallback to localStorage data
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setProfileData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          birthDate: userData.birthDate || '',
          language: userData.language || 'ru',
          role: userData.role || 'teacher'
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save to localStorage and update context
    localStorage.setItem('user', JSON.stringify(profileData));
    setIsEditing(false);
    // Here you could also make an API call to save to backend
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const getLanguageName = (code) => {
    const languages = {
      'ru': 'Русский',
      'kz': 'Қазақша', 
      'en': 'English'
    };
    return languages[code] || 'Русский';
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Не указан';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Профиль жүктелуде...</p>
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
          }}>🎓 Профиль учителя</h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0',
            fontSize: '16px'
          }}>Управление личной информацией и статистика</p>
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

      {/* Real Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {profileData.studentsCount}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Студенттер</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {profileData.testsAssigned}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Тесттер</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📚</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {profileData.materialsCreated}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Материалдар</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {profileData.avgStudentScore}%
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Орташа балл</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>⭐</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {profileData.totalXP}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>XP</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {profileData.streak}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Streak</div>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Profile Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '30px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            minWidth: '120px',
            minHeight: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: '700',
            margin: '0 auto 20px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            aspectRatio: '1',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}>
            {profileData.firstName ? profileData.firstName[0].toUpperCase() : 'У'}
            {profileData.lastName ? profileData.lastName[0].toUpperCase() : ''}
          </div>
          <h2 style={{
            margin: '0 0 10px 0',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            {profileData.firstName} {profileData.lastName}
          </h2>
          <p style={{
            margin: '0 0 20px 0',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px'
          }}>
            Учитель физики
          </p>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${isEditing ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '12px',
              padding: '10px 20px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isEditing ? '❌ Отменить' : '✏️ Редактировать'}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '10px 20px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                marginLeft: '10px'
              }}
            >
              ✅ Сохранить
            </button>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              marginLeft: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            🚪 Шығу
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {[
            { id: 'info', label: '📋 Основная информация', icon: '📋' },
            { id: 'contact', label: '📞 Контакты', icon: '📞' },
            { id: 'professional', label: '🎓 Профессиональное', icon: '🎓' },
            { id: 'settings', label: '⚙️ Баптаулар', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '15px',
                background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #fbbf24' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '30px' }}>
          {activeTab === 'info' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
                Основная информация
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Имя
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {profileData.firstName || 'Не указано'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Фамилия
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {profileData.lastName || 'Не указано'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Дата рождения
                  </label>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    {formatDate(profileData.birthDate)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Возраст
                  </label>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    {calculateAge(profileData.birthDate)} лет
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Язык
                  </label>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    {getLanguageName(profileData.language)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Роль
                  </label>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    Учитель
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
                Контактная информация
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {profileData.email || 'Не указан'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Телефон
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {profileData.phone || 'Не указан'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
                Профессиональная информация
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '20px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Предметы
                  </label>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    {profileData.subjects.join(', ')}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Опыт работы
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '60px'
                    }}>
                      {profileData.experience || 'Не указан'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Образование
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '60px'
                    }}>
                      {profileData.education || 'Не указано'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
                Баптаулар
              </h3>
              
              {/* Logout Section - Moved to top for better visibility */}
              <div style={{
                background: 'rgba(231, 76, 60, 0.1)',
                border: '2px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  color: '#e74c3c', 
                  margin: '0 0 15px 0', 
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  ⚠️ Қауіпті аймақ
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  margin: '0 0 15px 0',
                  fontSize: '14px'
                }}>
                  Жүйеден шыққанда барлық деректеріңіз жойылады
                </p>
                <button
                  onClick={handleLogoutClick}
                  style={{
                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 5px 15px rgba(231, 76, 60, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 5px 15px rgba(231, 76, 60, 0.3)';
                  }}
                >
                  🚪 Жүйеден шығу
                </button>
              </div>


            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        loading={logoutLoading}
      />
    </div>
  );
};

export default TeacherProfile;
