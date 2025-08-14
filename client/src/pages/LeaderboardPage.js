import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  // Teachers don't participate in student leaderboard
  if (user && user.role === 'teacher') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          color: 'white',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
          <h2 style={{ marginBottom: '15px' }}>Рейтинг студентов</h2>
          <p style={{ opacity: 0.8, lineHeight: '1.5', marginBottom: '25px' }}>
            Это рейтинг для студентов. Учителя могут просматривать статистику студентов в разделе "Управление студентами".
          </p>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => {
                // Redirect to teacher dashboard with student management
                window.location.href = '#/teacher-dashboard?view=students';
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 30px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              👥 Управление студентами
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Вернуться назад
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month
  const [categoryFilter, setCategoryFilter] = useState('points'); // points, tests, streak
  const [userRank, setUserRank] = useState({
    badges: [],
    name: '',
    points: 0,
    rank: 0
  });

  const categories = [
    { id: 'points', name: 'Очки', icon: '⭐', color: '#fbbf24' },
    { id: 'tests', name: 'Тесты', icon: '📝', color: '#3b82f6' },
    { id: 'streak', name: 'Серии', icon: '🔥', color: '#ef4444' },
    { id: 'time', name: 'Время', icon: '⏱️', color: '#10b981' }
  ];

  const timeFilters = [
    { id: 'all', name: 'Все время' },
    { id: 'month', name: 'Месяц' },
    { id: 'week', name: 'Неделя' }
  ];

  const generateMockLeaderboard = () => {
    // Return empty array to show only real data from database
    // No fake names or mock users
    return [];
  };

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter, categoryFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Try to get real leaderboard data first
      const response = await apiClient.getRealLeaderboard(50);
      if (response && response.leaderboard && response.leaderboard.length > 0) {
        setLeaderboard(response.leaderboard);
        
        // Find current user's rank
        const currentUserIndex = response.leaderboard.findIndex(item => 
          item.id === user?.telegram_id || item.username === user?.username
        );
        if (currentUserIndex !== -1) {
          setUserRank(response.leaderboard[currentUserIndex]);
        }
      } else {
        // Fallback to old API
        const fallbackResponse = await apiClient.getLeaderboard(50);
        if (fallbackResponse && fallbackResponse.leaderboard && Array.isArray(fallbackResponse.leaderboard)) {
          const data = fallbackResponse.leaderboard;
          
          // Transform API data
          const leaderboardData = data.map((item, index) => ({
            id: item.telegram_id || item.id,
            rank: index + 1,
            name: `${item.first_name || 'Студент'} ${(item.last_name || '').charAt(0)}.`.trim(),
            avatar: item.avatar || null,
            points: item.points || 0,
            testsCompleted: item.tests_completed || 0,
            streak: item.streak || 0,
            studyTime: item.total_study_time || 0,
            level: item.level || 1,
            badges: Array.isArray(item.badges) ? item.badges : [],
            isCurrentUser: item.telegram_id === user?.telegram_id
          }));
          
          setLeaderboard(leaderboardData);
          
          // Find current user's rank
          const currentUserIndex = leaderboardData.findIndex(item => item.isCurrentUser);
          if (currentUserIndex !== -1) {
            setUserRank(leaderboardData[currentUserIndex]);
          }
        } else {
          // Final fallback to mock data
          setLeaderboard(generateMockLeaderboard());
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Fallback to mock data
      setLeaderboard(generateMockLeaderboard());
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#fbbf24';
      case 2: return '#9ca3af';
      case 3: return '#cd7c2f';
      default: return 'rgba(255, 255, 255, 0.7)';
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const getCategoryValue = (item, category) => {
    switch (category) {
      case 'points': return item.points;
      case 'tests': return item.testsCompleted;
      case 'streak': return item.streak;
      case 'time': return formatTime(item.studyTime);
      default: return item.points;
    }
  };

  const getCategoryIcon = (category) => {
    return categories.find(c => c.id === category)?.icon || '⭐';
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
    filters: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    filterGroup: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    filterBtn: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    activeFilterBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    userRankCard: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    userAvatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: '600'
    },
    userInfo: {
      flex: 1
    },
    userName: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    userRank: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '8px'
    },
    userStats: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px'
    },
    leaderboardList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    leaderboardItem: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '16px 20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    currentUserItem: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      transform: 'scale(1.02)'
    },
    rankBadge: {
      minWidth: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '700',
      background: 'rgba(255, 255, 255, 0.1)'
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
    playerInfo: {
      flex: 1,
      minWidth: 0
    },
    playerName: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '4px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    playerLevel: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    playerScore: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '700'
    },
    badges: {
      display: 'flex',
      gap: '4px',
      fontSize: '16px'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '18px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    topThree: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px',
      marginBottom: '30px'
    },
    podiumItem: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    podiumRank: {
      fontSize: '32px',
      marginBottom: '12px'
    },
    podiumAvatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: '600',
      margin: '0 auto 12px'
    },
    podiumName: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px'
    },
    podiumScore: {
      fontSize: '20px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏆</div>
            <div>Загрузка рейтинга...</div>
          </div>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>🏆 Рейтинг</h1>
        <p style={pageStyles.subtitle}>Соревнуйтесь с другими учениками</p>
      </div>

      {/* Filters */}
      <div style={pageStyles.filters}>
        <div style={pageStyles.filterGroup}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              style={{
                ...pageStyles.filterBtn,
                ...(categoryFilter === category.id ? pageStyles.activeFilterBtn : {})
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
        
        <div style={pageStyles.filterGroup}>
          {timeFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              style={{
                ...pageStyles.filterBtn,
                ...(timeFilter === filter.id ? pageStyles.activeFilterBtn : {})
              }}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <div style={pageStyles.userRankCard}>
          <div style={pageStyles.userAvatar}>
            {userRank.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={pageStyles.userInfo}>
            <div style={pageStyles.userName}>Ваша позиция</div>
            <div style={pageStyles.userRank}>
              {getRankIcon(userRank.rank)} {userRank.rank} место
            </div>
            <div style={pageStyles.userStats}>
              <div style={pageStyles.statItem}>
                <span>⭐</span>
                <span>{userRank.points} очков</span>
              </div>
              <div style={pageStyles.statItem}>
                <span>📝</span>
                <span>{userRank.testsCompleted} тестов</span>
              </div>
              <div style={pageStyles.statItem}>
                <span>🔥</span>
                <span>{userRank.streak} дней</span>
              </div>
              <div style={pageStyles.statItem}>
                <span>⏱️</span>
                <span>{formatTime(userRank.studyTime)}</span>
              </div>
            </div>
          </div>
          <div style={pageStyles.badges}>
            {userRank.badges && Array.isArray(userRank.badges) ? userRank.badges.map((badge, index) => (
              <span key={index}>{badge}</span>
            )) : null}
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div style={pageStyles.topThree}>
          {/* 2nd Place */}
          <div style={pageStyles.podiumItem}>
            <div style={{
              ...pageStyles.podiumRank,
              color: getRankColor(2)
            }}>
              🥈
            </div>
            <div style={pageStyles.podiumAvatar}>
              {topThree[1].name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={pageStyles.podiumName}>{topThree[1].name}</div>
            <div style={pageStyles.podiumScore}>
              <span>{getCategoryIcon(categoryFilter)}</span>
              <span>{getCategoryValue(topThree[1], categoryFilter)}</span>
            </div>
          </div>

          {/* 1st Place */}
          <div style={{
            ...pageStyles.podiumItem,
            transform: 'scale(1.05)',
            zIndex: 2
          }}>
            <div style={{
              ...pageStyles.podiumRank,
              color: getRankColor(1)
            }}>
              🥇
            </div>
            <div style={pageStyles.podiumAvatar}>
              {topThree[0].name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={pageStyles.podiumName}>{topThree[0].name}</div>
            <div style={pageStyles.podiumScore}>
              <span>{getCategoryIcon(categoryFilter)}</span>
              <span>{getCategoryValue(topThree[0], categoryFilter)}</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div style={pageStyles.podiumItem}>
            <div style={{
              ...pageStyles.podiumRank,
              color: getRankColor(3)
            }}>
              🥉
            </div>
            <div style={pageStyles.podiumAvatar}>
              {topThree[2].name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={pageStyles.podiumName}>{topThree[2].name}</div>
            <div style={pageStyles.podiumScore}>
              <span>{getCategoryIcon(categoryFilter)}</span>
              <span>{getCategoryValue(topThree[2], categoryFilter)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rest of Leaderboard */}
      {restOfLeaderboard.length > 0 && (
        <div style={pageStyles.leaderboardList}>
          {restOfLeaderboard.map(player => (
            <div
              key={player.id}
              style={{
                ...pageStyles.leaderboardItem,
                ...(player.isCurrentUser ? pageStyles.currentUserItem : {})
              }}
              onMouseEnter={(e) => {
                if (!player.isCurrentUser) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!player.isCurrentUser) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{
                ...pageStyles.rankBadge,
                color: getRankColor(player.rank)
              }}>
                {getRankIcon(player.rank)}
              </div>
              
              <div style={pageStyles.avatar}>
                {player.name.split(' ').map(n => n[0]).join('')}
              </div>
              
              <div style={pageStyles.playerInfo}>
                <div style={pageStyles.playerName}>
                  {player.name}
                  {player.isCurrentUser && ' (Вы)'}
                </div>
                <div style={pageStyles.playerLevel}>
                  <span>🎯</span>
                  <span>Уровень {player.level}</span>
                </div>
              </div>
              
              <div style={pageStyles.playerScore}>
                <span>{getCategoryIcon(categoryFilter)}</span>
                <span>{getCategoryValue(player, categoryFilter)}</span>
              </div>
              
              <div style={pageStyles.badges}>
                {player.badges && Array.isArray(player.badges) ? player.badges.map((badge, index) => (
                  <span key={index}>{badge}</span>
                )) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {leaderboard.length === 0 && (
        <div style={pageStyles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3>Рейтинг пуст</h3>
          <p>Станьте первым в рейтинге!</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
