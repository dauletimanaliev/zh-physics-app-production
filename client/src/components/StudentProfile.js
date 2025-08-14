import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import LogoutModal from './LogoutModal';
import './StudentProfile.css';

const StudentProfile = () => {
  const [userInfo, setUserInfo] = useState({
    name: 'Студент',
    email: '',
    birthDate: '',
    language: 'ru',
    role: 'student',
    level: 1,
    xp: 0,
    streak: 0,
    totalTests: 0,
    averageScore: 0,
    rank: 0,
    studyTime: 0,
    achievements: 0,
    coins: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableInfo, setEditableInfo] = useState({
    school: 'Школа №1',
    grade: '11 сынып'
  });
  const { user, logout } = useAuth();

  useEffect(() => {
    loadUserProfile();
  }, []);

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

  const handleEditProfile = () => {
    setEditableInfo({
      school: userInfo.school || 'Школа №1',
      grade: userInfo.grade || '11 сынып'
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Update userInfo with new values
      const updatedUserInfo = {
        ...userInfo,
        school: editableInfo.school,
        grade: editableInfo.grade
      };
      
      setUserInfo(updatedUserInfo);
      
      // Save to localStorage for persistence
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = {
        ...userData,
        school: editableInfo.school,
        grade: editableInfo.grade
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      setIsEditingProfile(false);
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading student profile...');
      
      // Get real user data from localStorage and AuthContext
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const role = localStorage.getItem('role');
      
      console.log('📊 User data from localStorage:', userData);
      console.log('👤 User from AuthContext:', user);
      
      // Initialize with real user data from registration
      const realUserData = {
        name: userData.name || user?.name || 'Студент',
        email: userData.email || user?.email || '',
        phone: userData.phone || user?.phone || '',
        birthDate: userData.birthDate || user?.birthDate || '',
        school: userData.school || user?.school || 'Школа №1',
        grade: userData.grade || user?.grade || '11 сынып',
        level: 'Жаңадан бастаушы', // Start with beginner level
        subjects: ['Механика', 'Электричество', 'Термодинамика', 'Оптика'],
        streak: 0, // Start with 0
        xp: 0, // Start with 0
        achievements: 0, // Start with 0
        totalTests: 0, // Start with 0
        averageScore: 0, // Start with 0
        studyTime: 0, // Start with 0 hours
        rank: 0, // Start with 0
        coins: 0 // Start with 0 coins
      };
      
      // Initialize editable info with current values
      setEditableInfo({
        school: realUserData.school,
        grade: realUserData.grade
      });
      
      console.log('📋 Initial user data:', realUserData);
      
      // Load ALL real data from API
      try {
        // Get user ID from multiple sources
        const userId = userData.telegram_id || userData.id || user?.telegram_id || user?.id || 1;
        console.log('🆔 Using user ID for API calls:', userId);
        
        // Always set basic user info first (so user sees their name immediately)
        setUserInfo(realUserData);
        
        // Get comprehensive real user profile data
        console.log('🌐 Calling getRealUserProfile API...');
        const realProfileData = await apiClient.getRealUserProfile(userId);
        
        console.log('📈 API Response:', realProfileData);
        
        // Check if user is newly registered (within last hour)
        const userRegistrationTime = userData.registrationTime || user?.registrationTime;
        const isNewUser = userRegistrationTime && (Date.now() - new Date(userRegistrationTime).getTime()) < 3600000; // 1 hour
        
        if (realProfileData && realProfileData.userStats && Object.keys(realProfileData.userStats).length > 0 && !isNewUser) {
          // Use real stats from API only for existing users
          console.log('✅ Using real user stats from API for existing user');
          const userStats = realProfileData.userStats;
          const completeUserData = {
            ...realUserData,
            level: userStats.level || 1,
            xp: userStats.points || 0,
            streak: userStats.streak || 0,
            totalTests: userStats.tests_completed || 0,
            averageScore: Math.round(userStats.avg_score || 0),
            rank: userStats.rank || 0,
            studyTime: Math.round((userStats.tests_completed || 0) * 0.5), // hours
            achievements: realProfileData.achievements?.filter(a => a.unlocked).length || 0,
            coins: Math.floor((userStats.points || 0) / 10) // 1 coin per 10 points
          };
          
          console.log('📊 Complete user data with stats:', completeUserData);
          setUserInfo(completeUserData);
          
          // Set real activity data
          setRecentActivity(realProfileData.activity || []);
          
          // Set real weekly stats
          setWeeklyStats(realProfileData.weeklyStats || []);
          
          // Set real achievements
          setAchievements(realProfileData.achievements || []);
          
        } else if (isNewUser) {
          // New user - show zero stats
          console.log('🆕 New user detected - showing zero stats');
          const newUserData = {
            ...realUserData,
            level: 1,
            xp: 0,
            streak: 0,
            totalTests: 0,
            averageScore: 0,
            rank: 0,
            studyTime: 0,
            achievements: 0,
            coins: 0
          };
          
          setUserInfo(newUserData);
          setRecentActivity([]);
          setWeeklyStats([]);
          setAchievements([]);
          
        } else {
          console.log('⚠️ No user stats from getRealUserProfile, trying individual API calls...');
          // Fallback: try individual API calls
          const [leaderboardResponse, activityResponse, weeklyResponse, achievementsResponse] = await Promise.allSettled([
            apiClient.getRealLeaderboard(50),
            apiClient.getRealUserActivity(userId, 10),
            apiClient.getRealWeeklyStats(userId),
            apiClient.getRealUserAchievements(userId)
          ]);
          
          let userStats = {
            level: 1,
            points: 0,
            streak: 0,
            tests_completed: 0,
            avg_score: 0,
            rank: 0
          };
          
          if (leaderboardResponse.status === 'fulfilled' && leaderboardResponse.value?.leaderboard) {
            const currentUser = leaderboardResponse.value.leaderboard.find(user => 
              user.name.includes(userData.name) || user.username === userData.username || user.id === userId
            );
            if (currentUser) {
              console.log('✅ Found existing user in leaderboard:', currentUser);
              userStats = currentUser;
            } else {
              console.log('🆕 New user - showing zero stats');
            }
          }
          
          const completeUserData = {
            ...realUserData,
            level: userStats.level || 1,
            xp: userStats.points || 0,
            streak: userStats.streak || 0,
            totalTests: userStats.tests_completed || 0,
            averageScore: Math.round(userStats.avg_score || 0),
            rank: userStats.rank || 0,
            studyTime: Math.round((userStats.tests_completed || 0) * 0.5),
            achievements: achievementsResponse.status === 'fulfilled' ? 
              achievementsResponse.value?.achievements?.filter(a => a.unlocked).length || 0 : 0,
            coins: Math.floor((userStats.points || 0) / 10)
          };
          
          setUserInfo(completeUserData);
          
          // Set real data from individual responses
          if (activityResponse.status === 'fulfilled') {
            setRecentActivity(activityResponse.value?.activities || []);
          }
          if (weeklyResponse.status === 'fulfilled') {
            setWeeklyStats(weeklyResponse.value?.weeklyStats || []);
          }
          if (achievementsResponse.status === 'fulfilled') {
            setAchievements(achievementsResponse.value?.achievements || []);
          }
        }
        
      } catch (error) {
        console.error('❌ API error:', error);
        console.log('🔄 API not available, using basic user data from registration');
        
        // Ensure user sees their basic info even if API fails
        setUserInfo(realUserData);
        
        // Set empty arrays for other data
        setRecentActivity([]);
        setWeeklyStats([]);
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Аккаунттан шығуды растайсыз ба?')) {
      logout();
      // Очистка localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('isRegistered');
      // Перезагрузка страницы для возврата к регистрации
      window.location.reload();
    }
  };

  const saveUserInfo = async (updatedInfo) => {
    try {
      // Save to localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...updatedInfo };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Try to save to API
      try {
        await apiClient.updateUserProfile(updatedInfo);
        console.log('Profile updated successfully');
      } catch (error) {
        console.log('API update failed, saved locally');
      }
      
      // Update local state
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  };

  // All data (achievements, activity, weeklyStats) are now loaded from API and stored in state
  // Fallback data for when no real data is available
  const fallbackActivity = recentActivity.length === 0 ? [
    { 
      id: 1,
      type: 'registration',
      action: 'Платформаға тіркелді', 
      score: null, 
      xpGained: 0,
      time: 'Жаңа ғана',
      icon: '🎉'
    },
    { 
      id: 2,
      type: 'welcome',
      action: 'Профильді қарады', 
      score: null, 
      xpGained: 0,
      time: 'Қазір',
      icon: '👋'
    }
  ] : recentActivity;

  const fallbackWeeklyStats = weeklyStats.length === 0 ? [
    { day: 'Дс', tests: 0, time: 0, xp: 0 },
    { day: 'Сс', tests: 0, time: 0, xp: 0 },
    { day: 'Ср', tests: 0, time: 0, xp: 0 },
    { day: 'Бс', tests: 0, time: 0, xp: 0 },
    { day: 'Жм', tests: 0, time: 0, xp: 0 },
    { day: 'Сб', tests: 0, time: 0, xp: 0 },
    { day: 'Жк', tests: 0, time: 0, xp: 0 }
  ] : weeklyStats;

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Профиль жүктелуде...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header Section */}
        <div className="profile-header">
          <div className="header-background"></div>
          <div className="header-content">
            <div className="avatar-section">
              <div className="avatar-container">
                <img src="/images/default-avatar.svg" alt="Avatar" className="profile-avatar" />
                <div className="avatar-badge">{userInfo.streak}🔥</div>
                <button className="avatar-edit-btn">📷</button>
              </div>
              <div className="level-display">
                <div className="level-badge">Уровень {userInfo.level}</div>
                <div className="xp-bar">
                  {(() => {
                    const currentLevel = userInfo.level || 1;
                    const currentXP = userInfo.xp || 0;
                    const xpForCurrentLevel = (currentLevel - 1) * 300; // 300 XP per level
                    const xpForNextLevel = currentLevel * 300;
                    const progressXP = currentXP - xpForCurrentLevel;
                    const neededXP = xpForNextLevel - xpForCurrentLevel;
                    const progressPercent = Math.min((progressXP / neededXP) * 100, 100);
                    
                    return (
                      <>
                        <div className="xp-fill" style={{ width: `${progressPercent}%` }}></div>
                        <span className="xp-text">{currentXP}/{xpForNextLevel} XP</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            <div className="profile-info">
              <h1>{userInfo.name}</h1>
              {isEditingProfile ? (
                <div className="profile-edit-form">
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={editableInfo.school}
                      onChange={(e) => setEditableInfo({...editableInfo, school: e.target.value})}
                      placeholder="Школа"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '14px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>•</span>
                    <input
                      type="text"
                      value={editableInfo.grade}
                      onChange={(e) => setEditableInfo({...editableInfo, grade: e.target.value})}
                      placeholder="Класс"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '14px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSaveProfile}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#4CAF50',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Сохранить
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p className="profile-subtitle">{userInfo.school} • {userInfo.grade}</p>
                  <button
                    onClick={handleEditProfile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px'
                    }}
                    title="Редактировать школу и класс"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <div className="quick-stats">
                <div className="quick-stat">
                  <span className="stat-value">#{userInfo.rank}</span>
                  <span className="stat-label">Рейтинг</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-value">{userInfo.coins}</span>
                  <span className="stat-label">🪙 Тиын</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-value">{userInfo.averageScore}%</span>
                  <span className="stat-label">Орташа</span>
                </div>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="edit-profile-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? '💾 Сақтау' : '✏️ Өңдеу'}
              </button>
              
              {/* Logout Button - Always visible */}
              <button 
                onClick={handleLogoutClick}
                style={{
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginLeft: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 3px 10px rgba(231, 76, 60, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 5px 15px rgba(231, 76, 60, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 3px 10px rgba(231, 76, 60, 0.3)';
                }}
              >
                🚪 Шығу
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Шолу
          </button>
          <button 
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🏆 Жетістіктер
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📈 Белсенділік
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Баптаулар
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Main Stats Grid */}
              <div className="main-stats-grid">
                <div className="stat-card streak-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-info">
                    <h3>{userInfo.streak}</h3>
                    <p>Күн streak</p>
                  </div>
                  <div className="stat-trend">+2</div>
                </div>
                
                <div className="stat-card xp-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <h3>{userInfo.xp.toLocaleString()}</h3>
                    <p>Жалпы XP</p>
                  </div>
                  <div className="stat-trend">+150</div>
                </div>
                
                <div className="stat-card tests-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <h3>{userInfo.totalTests}</h3>
                    <p>Тест тапсырды</p>
                  </div>
                  <div className="stat-trend">+5</div>
                </div>
                
                <div className="stat-card time-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <h3>{userInfo.studyTime}ч</h3>
                    <p>Оқу уақыты</p>
                  </div>
                  <div className="stat-trend">+4.2ч</div>
                </div>
              </div>

              {/* Weekly Activity Chart */}
              <div className="weekly-chart-card">
                <h3>Апталық белсенділік</h3>
                <div className="chart-container">
                  {fallbackWeeklyStats.map((day, index) => (
                    <div key={index} className="chart-bar">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${(day.xp / 720) * 100}%` }}
                      ></div>
                      <span className="bar-label">{day.day}</span>
                      <span className="bar-value">{day.xp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Progress */}
              <div className="subject-progress-card">
                <h3>Пән бойынша прогресс</h3>
                <div className="subjects-list">
                  {userInfo.subjects.map((subject, index) => {
                    // Start with 0% progress for new users
                    const progress = 0; // Will be calculated from real test results
                    return (
                      <div key={index} className="subject-item">
                        <div className="subject-info">
                          <span className="subject-name">{subject}</span>
                          <span className="subject-percent">{progress}%</span>
                        </div>
                        <div className="subject-progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-tab">
              <div className="achievements-header">
                <h3>Жетістіктер ({achievements.filter(a => a.unlocked).length}/{achievements.length})</h3>
                <div className="achievement-filters">
                  <button className="filter-btn active">Барлығы</button>
                  <button className="filter-btn">Алынған</button>
                  <button className="filter-btn">Прогресс</button>
                </div>
              </div>
              
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.rarity}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <h4>{achievement.name}</h4>
                      <p>{achievement.desc}</p>
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          ></div>
                        </div>
                        <span>{achievement.progress}/{achievement.target}</span>
                      </div>
                    </div>
                    {achievement.unlocked && <div className="unlock-badge">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-header">
                <h3>Соңғы белсенділік</h3>
                <div className="activity-filters">
                  <button className="filter-btn active">Барлығы</button>
                  <button className="filter-btn">Тестілер</button>
                  <button className="filter-btn">Материалдар</button>
                  <button className="filter-btn">Жетістіктер</button>
                </div>
              </div>
              
              <div className="activity-timeline">
                {fallbackActivity.map((activity) => (
                  <div key={activity.id} className={`activity-item ${activity.type}`}>
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <h4>{activity.action}</h4>
                      <div className="activity-meta">
                        <span className="activity-time">{activity.time}</span>
                        {activity.score && (
                          <span className="activity-score">{activity.score}%</span>
                        )}
                        <span className="activity-xp">+{activity.xpGained} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              {/* Logout Section - Moved to top for better visibility */}
              <div style={{
                border: '2px solid rgba(231, 76, 60, 0.3)',
                background: 'rgba(231, 76, 60, 0.1)',
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
                  🚪 Аккаунттан шығу
                </button>
              </div>

              <div className="settings-section">
                <h3>Жеке ақпарат</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Аты-жөні</label>
                    <input 
                      type="text" 
                      value={userInfo.name} 
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setUserInfo({...userInfo, name: newValue});
                        if (isEditing) {
                          saveUserInfo({ name: newValue });
                        }
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={userInfo.email} 
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setUserInfo({...userInfo, email: newValue});
                        if (isEditing) {
                          saveUserInfo({ email: newValue });
                        }
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Телефон</label>
                    <input 
                      type="tel" 
                      value={userInfo.phone} 
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setUserInfo({...userInfo, phone: newValue});
                        if (isEditing) {
                          saveUserInfo({ phone: newValue });
                        }
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Мектеп</label>
                    <input 
                      type="text" 
                      value={userInfo.school} 
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setUserInfo({...userInfo, school: newValue});
                        if (isEditing) {
                          saveUserInfo({ school: newValue });
                        }
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Сынып</label>
                    <select 
                      value={userInfo.grade || '11'} 
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setUserInfo({...userInfo, grade: newValue});
                        if (isEditing) {
                          saveUserInfo({ grade: newValue });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: isEditing ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '16px',
                        cursor: isEditing ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="9">9 сынып</option>
                      <option value="10">10 сынып</option>
                      <option value="11">11 сынып</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Хабарландырулар</h3>
                <div className="settings-toggles">
                  <div className="toggle-item">
                    <span>Push хабарландырулар</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="toggle-item">
                    <span>Email хабарландырулар</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="toggle-item">
                    <span>Streak еске салғыштар</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{
                border: '2px solid rgba(231, 76, 60, 0.3)',
                background: 'rgba(231, 76, 60, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px'
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
                    boxShadow: '0 5px 15px rgba(231, 76, 60, 0.3)',
                    width: '100%'
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
                  🚪 Аккаунттан шығу
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

export default StudentProfile;
