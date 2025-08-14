import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const TestsPage = () => {
  const { user } = useAuth();
  
  // Redirect teachers to their dashboard - they shouldn't take tests
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
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>👨‍🏫</div>
          <h2 style={{ marginBottom: '15px' }}>Доступ ограничен</h2>
          <p style={{ opacity: 0.8, lineHeight: '1.5', marginBottom: '25px' }}>
            Учителя не сдают тесты - они их создают! Перейдите в панель управления для создания и редактирования тестов.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => {
                // Redirect to teacher dashboard with test management
                window.location.href = '#/teacher-dashboard?view=testManagement';
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
              ➕ Создать тест
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
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const categories = [
    { id: 'all', name: 'Все темы', icon: '📚', color: '#6b7280' },
    { id: 'mechanics', name: 'Механика', icon: '⚙️', color: '#3b82f6' },
    { id: 'thermodynamics', name: 'Термодинамика', icon: '🌡️', color: '#ef4444' },
    { id: 'electricity', name: 'Электричество', icon: '⚡', color: '#f59e0b' },
    { id: 'optics', name: 'Оптика', icon: '🔍', color: '#8b5cf6' },
    { id: 'atomic', name: 'Атомная физика', icon: '⚛️', color: '#10b981' },
    { id: 'waves', name: 'Волны', icon: '〰️', color: '#06b6d4' }
  ];

  const difficulties = [
    { id: 'all', name: 'Все уровни' },
    { id: 'easy', name: 'Легкий', color: '#10b981' },
    { id: 'medium', name: 'Средний', color: '#f59e0b' },
    { id: 'hard', name: 'Сложный', color: '#ef4444' }
  ];

  useEffect(() => {
    loadTests();
    loadUserStats();
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTests({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchQuery || undefined
      });
      
      // Transform API data
      const testsData = data.map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        category: test.category || 'mechanics',
        difficulty: test.difficulty || 'medium',
        questionsCount: test.questions_count || 10,
        timeLimit: test.time_limit || 30, // minutes
        maxScore: test.max_score || 100,
        attempts: test.user_attempts || 0,
        bestScore: test.user_best_score || null,
        averageScore: test.average_score || 0,
        completions: test.completions_count || 0,
        tags: test.tags || [],
        isLocked: test.is_locked || false,
        requiredLevel: test.required_level || 1,
        rewards: {
          points: test.reward_points || 50,
          experience: test.reward_experience || 25
        }
      }));
      
      setTests(testsData);
      
    } catch (error) {
      console.error('⚠️ Error loading tests from API, using fallback data:', error);
      console.log('🔄 Loading fallback tests with zero user progress');
      // Fallback data with zero user progress for new users
      setTests([
        {
          id: 1,
          title: 'Основы кинематики',
          description: 'Тест на понимание основных понятий движения: скорость, ускорение, перемещение',
          category: 'mechanics',
          difficulty: 'easy',
          questionsCount: 15,
          timeLimit: 20,
          maxScore: 100,
          attempts: 0,              // 0 попыток для нового пользователя
          bestScore: null,          // Нет лучшего результата
          averageScore: 75,         // Общий средний балл (не пользователя)
          completions: 1250,        // Общее количество прохождений
          tags: ['движение', 'скорость', 'ускорение'],
          isLocked: false,
          requiredLevel: 1,
          rewards: { points: 75, experience: 30 }
        },
        {
          id: 2,
          title: 'Законы Ньютона',
          description: 'Проверьте знание трех законов Ньютона и их применение в решении задач',
          category: 'mechanics',
          difficulty: 'medium',
          questionsCount: 20,
          timeLimit: 35,
          maxScore: 100,
          attempts: 0,              // 0 попыток для нового пользователя
          bestScore: null,          // Нет лучшего результата
          averageScore: 68,         // Общий средний балл (не пользователя)
          completions: 980,         // Общее количество прохождений
          tags: ['Ньютон', 'сила', 'масса'],
          isLocked: true,           // Заблокирован для новых пользователей
          requiredLevel: 2,
          rewards: { points: 100, experience: 40 }
        },
        {
          id: 3,
          title: 'Термодинамические процессы',
          description: 'Изучение изотермических, изохорных и изобарных процессов',
          category: 'thermodynamics',
          difficulty: 'hard',
          questionsCount: 25,
          timeLimit: 45,
          maxScore: 100,
          attempts: 0,
          bestScore: null,
          averageScore: 65,
          completions: 650,
          tags: ['температура', 'давление', 'объем'],
          isLocked: false,
          requiredLevel: 4,
          rewards: { points: 150, experience: 60 }
        },
        {
          id: 4,
          title: 'Электрические цепи',
          description: 'Расчет сопротивления, тока и напряжения в различных электрических цепях',
          category: 'electricity',
          difficulty: 'medium',
          questionsCount: 18,
          timeLimit: 30,
          maxScore: 100,
          attempts: 0,
          bestScore: null,
          averageScore: 70,
          completions: 820,
          tags: ['ток', 'напряжение', 'сопротивление'],
          isLocked: true,
          requiredLevel: 3,
          rewards: { points: 120, experience: 50 }
        },
        {
          id: 5,
          title: 'Волновая оптика',
          description: 'Интерференция, дифракция и поляризация света',
          category: 'optics',
          difficulty: 'hard',
          questionsCount: 22,
          timeLimit: 40,
          maxScore: 100,
          attempts: 0,
          bestScore: null,
          averageScore: 58,
          completions: 420,
          tags: ['свет', 'волны', 'интерференция'],
          isLocked: true,
          requiredLevel: 5,
          rewards: { points: 180, experience: 70 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      if (user?.id) {
        console.log('🔄 Loading user test stats from API for user:', user.id);
        const apiStats = await apiClient.getUserProgress(user.id);
        
        const userTestStats = {
          totalTests: apiStats.total_tests || 0,
          completedTests: apiStats.tests_completed || 0,
          averageScore: apiStats.avg_score || 0,
          totalTime: Math.round((apiStats.tests_completed || 0) * 10), // Estimate: 10 min per test
          streak: apiStats.streak || 0,
          level: apiStats.level || 1,
          experience: apiStats.points || 0,
          nextLevelExp: (apiStats.level || 1) * 100
        };
        
        console.log('✅ User test stats loaded from API:', userTestStats);
        setUserStats(userTestStats);
      } else {
        console.log('🆕 No user ID - showing zero test stats');
        setUserStats({
          totalTests: 0,
          completedTests: 0,
          averageScore: 0,
          totalTime: 0,
          streak: 0,
          level: 1,
          experience: 0,
          nextLevelExp: 100
        });
      }
    } catch (error) {
      console.error('⚠️ Error loading user stats from API, using defaults:', error);
      console.log('🆕 New user - showing zero test stats');
      setUserStats({
        totalTests: 0,
        completedTests: 0,
        averageScore: 0,
        totalTime: 0,
        streak: 0,
        level: 1,
        experience: 0,
        nextLevelExp: 100
      });
    }
  };

  const startTest = async (testId) => {
    try {
      console.log('🚀 Starting test with ID:', testId);
      const test = tests.find(t => t.id === testId);
      
      if (!test) {
        alert('Тест не найден');
        return;
      }
      
      if (test.isLocked) {
        alert(`Тест заблокирован. Требуется уровень ${test.requiredLevel}`);
        return;
      }
      
      const testSession = await apiClient.startTest(testId);
      console.log('✅ Test session created:', testSession);
      
      // Set active test and show test modal
      setActiveTest({
        ...test,
        sessionId: testSession.id,
        currentQuestion: 1,
        answers: {},
        startTime: new Date()
      });
      setShowTestModal(true);
      
    } catch (error) {
      console.error('❌ Error starting test:', error);
      alert('Ошибка при запуске теста. Попробуйте позже.');
    }
  };

  const getDifficultyColor = (difficulty) => {
    const diff = difficulties.find(d => d.id === difficulty);
    return diff?.color || '#6b7280';
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories[0];
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#ef4444';
    return '#6b7280';
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchQuery || 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

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
    statsCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginBottom: '30px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '20px'
    },
    statItem: {
      textAlign: 'center'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    filters: {
      display: 'flex',
      gap: '20px',
      marginBottom: '30px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '12px 16px',
      borderRadius: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      outline: 'none'
    },
    filterGroup: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    filterBtn: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    activeFilterBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    testsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px'
    },
    testCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    },
    lockedCard: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    testHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px'
    },
    categoryIcon: {
      fontSize: '32px',
      minWidth: '40px'
    },
    testInfo: {
      flex: 1,
      minWidth: 0
    },
    testTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '8px',
      lineHeight: '1.3'
    },
    testDescription: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: '1.4',
      marginBottom: '16px'
    },
    testMeta: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    difficultyBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      position: 'absolute',
      top: '16px',
      right: '16px'
    },
    testStats: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '16px',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px'
    },
    statGroup: {
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '2px'
    },
    statText: {
      fontSize: '10px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    tags: {
      display: 'flex',
      gap: '6px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    tag: {
      padding: '4px 8px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.1)',
      fontSize: '11px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    testFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px'
    },
    rewards: {
      display: 'flex',
      gap: '12px',
      fontSize: '12px'
    },
    rewardItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#fbbf24'
    },
    startButton: {
      padding: '10px 20px',
      borderRadius: '20px',
      border: 'none',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    lockedButton: {
      background: 'rgba(107, 114, 128, 0.3)',
      cursor: 'not-allowed'
    },
    retakeButton: {
      background: 'linear-gradient(135deg, #10b981, #059669)'
    },
    lockOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '16px'
    },
    lockIcon: {
      fontSize: '48px',
      color: 'rgba(255, 255, 255, 0.5)'
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
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
            <div>Загрузка тестов...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📝 Тесты</h1>
        <p style={pageStyles.subtitle}>Проверьте свои знания по физике</p>
      </div>

      {/* User Stats */}
      {userStats && (
        <div style={pageStyles.statsCard}>
          <div style={pageStyles.statItem}>
            <div style={pageStyles.statValue}>{userStats.completedTests}</div>
            <div style={pageStyles.statLabel}>Пройдено</div>
          </div>
          <div style={pageStyles.statItem}>
            <div style={pageStyles.statValue}>{userStats.averageScore}%</div>
            <div style={pageStyles.statLabel}>Средний балл</div>
          </div>
          <div style={pageStyles.statItem}>
            <div style={pageStyles.statValue}>{userStats.streak}</div>
            <div style={pageStyles.statLabel}>Серия дней</div>
          </div>
          <div style={pageStyles.statItem}>
            <div style={pageStyles.statValue}>{userStats.level}</div>
            <div style={pageStyles.statLabel}>Уровень</div>
          </div>
          <div style={pageStyles.statItem}>
            <div style={pageStyles.statValue}>{Math.floor(userStats.totalTime / 60)}ч</div>
            <div style={pageStyles.statLabel}>Время изучения</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={pageStyles.filters}>
        <input
          type="text"
          placeholder="🔍 Поиск тестов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={pageStyles.searchInput}
        />
        
        <div style={pageStyles.filterGroup}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                ...pageStyles.filterBtn,
                ...(selectedCategory === category.id ? pageStyles.activeFilterBtn : {})
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
        
        <div style={pageStyles.filterGroup}>
          {difficulties.map(difficulty => (
            <button
              key={difficulty.id}
              onClick={() => setSelectedDifficulty(difficulty.id)}
              style={{
                ...pageStyles.filterBtn,
                ...(selectedDifficulty === difficulty.id ? pageStyles.activeFilterBtn : {})
              }}
            >
              {difficulty.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length > 0 ? (
        <div style={pageStyles.testsGrid}>
          {filteredTests.map(test => {
            const categoryInfo = getCategoryInfo(test.category);
            const isLocked = test.isLocked || (userStats && userStats.level < test.requiredLevel);
            
            return (
              <div
                key={test.id}
                style={{
                  ...pageStyles.testCard,
                  ...(isLocked ? pageStyles.lockedCard : {})
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Difficulty Badge */}
                <div style={{
                  ...pageStyles.difficultyBadge,
                  background: getDifficultyColor(test.difficulty) + '20',
                  border: `1px solid ${getDifficultyColor(test.difficulty)}30`,
                  color: getDifficultyColor(test.difficulty)
                }}>
                  {difficulties.find(d => d.id === test.difficulty)?.name}
                </div>

                {/* Test Header */}
                <div style={pageStyles.testHeader}>
                  <div style={{
                    ...pageStyles.categoryIcon,
                    color: categoryInfo.color
                  }}>
                    {categoryInfo.icon}
                  </div>
                  <div style={pageStyles.testInfo}>
                    <div style={pageStyles.testTitle}>{test.title}</div>
                  </div>
                </div>

                {/* Description */}
                <div style={pageStyles.testDescription}>
                  {test.description}
                </div>

                {/* Meta Info */}
                <div style={pageStyles.testMeta}>
                  <div style={pageStyles.metaItem}>
                    <span>📋</span>
                    <span>{test.questionsCount} вопросов</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span>⏱️</span>
                    <span>{test.timeLimit} мин</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span>👥</span>
                    <span>{test.completions} прошли</span>
                  </div>
                  {test.requiredLevel > 1 && (
                    <div style={pageStyles.metaItem}>
                      <span>🎯</span>
                      <span>Уровень {test.requiredLevel}+</span>
                    </div>
                  )}
                </div>

                {/* Test Stats */}
                <div style={pageStyles.testStats}>
                  <div style={pageStyles.statGroup}>
                    <div style={pageStyles.statNumber}>{test.attempts}</div>
                    <div style={pageStyles.statText}>Попытки</div>
                  </div>
                  <div style={pageStyles.statGroup}>
                    <div style={{
                      ...pageStyles.statNumber,
                      color: test.bestScore ? getScoreColor(test.bestScore) : 'inherit'
                    }}>
                      {test.bestScore || '-'}
                    </div>
                    <div style={pageStyles.statText}>Лучший результат</div>
                  </div>
                  <div style={pageStyles.statGroup}>
                    <div style={pageStyles.statNumber}>{test.averageScore}%</div>
                    <div style={pageStyles.statText}>Средний балл</div>
                  </div>
                </div>

                {/* Tags */}
                {test.tags.length > 0 && (
                  <div style={pageStyles.tags}>
                    {test.tags.map((tag, index) => (
                      <span key={index} style={pageStyles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div style={pageStyles.testFooter}>
                  <div style={pageStyles.rewards}>
                    <div style={pageStyles.rewardItem}>
                      <span>⭐</span>
                      <span>+{test.rewards.points}</span>
                    </div>
                    <div style={pageStyles.rewardItem}>
                      <span>🎯</span>
                      <span>+{test.rewards.experience} XP</span>
                    </div>
                  </div>
                  
                  {isLocked ? (
                    <button style={{
                      ...pageStyles.startButton,
                      ...pageStyles.lockedButton
                    }}>
                      🔒 Заблокировано
                    </button>
                  ) : (
                    <button
                      style={{
                        ...pageStyles.startButton,
                        ...(test.attempts > 0 ? pageStyles.retakeButton : {})
                      }}
                      onClick={() => startTest(test.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {test.attempts > 0 ? '🔄 Пересдать' : '▶️ Начать тест'}
                    </button>
                  )}
                </div>

                {/* Lock Overlay */}
                {isLocked && (
                  <div style={pageStyles.lockOverlay}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={pageStyles.lockIcon}>🔒</div>
                      <div style={{ fontSize: '14px', marginTop: '8px' }}>
                        Требуется уровень {test.requiredLevel}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={pageStyles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3>Тесты не найдены</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}

      {/* Test Taking Modal */}
      {showTestModal && activeTest && (
        <div style={{
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
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            color: 'white',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowTestModal(false);
                setActiveTest(null);
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                minWidth: '60px',
                minHeight: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                margin: '0 auto 20px',
                aspectRatio: '1',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
            >
              ✕
            </button>

            {/* Test Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {activeTest.title}
              </h2>
              <p style={{ margin: '0', opacity: 0.8, fontSize: '16px' }}>
                Вопрос {activeTest.currentQuestion} из {activeTest.questionsCount}
              </p>
            </div>

            {/* Mock Question */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
                Какая из формул описывает второй закон Ньютона?
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {['F = ma', 'E = mc²', 'v = at', 'P = mv'].map((option, index) => (
                  <button
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '10px',
                      padding: '15px',
                      color: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onClick={async () => {
                      // Complete test with realistic results based on user level and test difficulty
                      try {
                        const userLevel = userStats?.level || 1;
                        const testDifficulty = activeTest.difficulty || 'easy';
                        const result = await apiClient.finishTest(activeTest.sessionId, userLevel, testDifficulty);
                        console.log('✅ Test completed:', result);
                        
                        // Show beautiful result modal instead of alert
                        setTestResult({
                          ...result,
                          testTitle: activeTest.title,
                          rewards: activeTest.rewards
                        });
                        setShowTestModal(false);
                        setShowResultModal(true);
                        
                        // Reload stats
                        loadUserStats();
                        
                      } catch (error) {
                        console.error('❌ Error finishing test:', error);
                        // Show error in beautiful modal too
                        setTestResult({
                          error: true,
                          message: 'Ошибка при завершении теста. Попробуйте позже.'
                        });
                        setShowTestModal(false);
                        setShowResultModal(true);
                      }
                    }}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              opacity: 0.8
            }}>
              <span>⏱️ Время: {activeTest.timeLimit} мин</span>
              <span>🎯 Награда: +{activeTest.rewards.points} очков</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Modal */}
      {showResultModal && testResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: testResult.error 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : testResult.passed 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '25px',
            padding: '40px 30px',
            maxWidth: '500px',
            width: '100%',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}>
            {testResult.error ? (
              // Error State
              <>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>😔</div>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '24px', fontWeight: '700' }}>
                  Ошибка
                </h2>
                <p style={{ margin: '0 0 30px 0', fontSize: '16px', opacity: 0.9 }}>
                  {testResult.message}
                </p>
              </>
            ) : (
              // Success State
              <>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                  {testResult.passed ? '🎉' : '📚'}
                </div>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700' }}>
                  {testResult.passed ? 'Тест пройден!' : 'Тест завершен'}
                </h2>
                <p style={{ margin: '0 0 30px 0', fontSize: '16px', opacity: 0.9 }}>
                  {testResult.testTitle}
                </p>

                {/* Results Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {testResult.score}%
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                      Ваш результат
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '5px' }}>
                      {testResult.correctAnswers}/{testResult.totalQuestions}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                      Правильных ответов
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  padding: '15px 20px',
                  marginBottom: '30px',
                  fontSize: '14px'
                }}>
                  <span>⏱️ Время: {testResult.timeSpent} мин</span>
                  {testResult.rewards && (
                    <span>🎯 +{testResult.rewards.points} очков</span>
                  )}
                </div>

                {/* Motivational Message */}
                <p style={{ 
                  margin: '0 0 30px 0', 
                  fontSize: '16px', 
                  fontWeight: '500',
                  opacity: 0.9
                }}>
                  {testResult.passed 
                    ? 'Отличная работа! Продолжайте в том же духе!' 
                    : 'Не расстраивайтесь! Попробуйте еще раз - у вас получится!'}
                </p>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setShowResultModal(false);
                setTestResult(null);
                setActiveTest(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                padding: '15px 40px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✨ Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsPage;
