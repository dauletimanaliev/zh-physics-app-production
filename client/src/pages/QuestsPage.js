import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const QuestsPage = () => {
  const { user } = useAuth();
  
  // Teachers don't do student quests - they manage them
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
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
          <h2 style={{ marginBottom: '15px' }}>Квесты для студентов</h2>
          <p style={{ opacity: 0.8, lineHeight: '1.5', marginBottom: '25px' }}>
            Квесты предназначены для студентов. Учителя могут создавать и управлять квестами через административную панель.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Вернуться назад
          </button>
        </div>
      </div>
    );
  }
  
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // available, completed, daily
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [showQuestModal, setShowQuestModal] = useState(false);

  const questTypes = {
    daily: { name: 'Ежедневные', icon: '📅', color: '#3b82f6' },
    weekly: { name: 'Еженедельные', icon: '📊', color: '#8b5cf6' },
    achievement: { name: 'Достижения', icon: '🏆', color: '#f59e0b' },
    special: { name: 'Особые', icon: '⭐', color: '#ef4444' }
  };

  const tabs = [
    { id: 'available', name: 'Доступные', icon: '🎯' },
    { id: 'completed', name: 'Выполненные', icon: '✅' },
    { id: 'daily', name: 'Ежедневные', icon: '📅' }
  ];

  useEffect(() => {
    loadQuests();
  }, [activeTab]);

  const loadQuests = async () => {
    setLoading(true);
    try {
      // Try to get real quests data first
      const response = await apiClient.getRealQuests('ru');
      if (response && response.quests && response.quests.length > 0) {
        setQuests(response.quests);
      } else {
        // Fallback to old API
        const data = await apiClient.getQuests(activeTab);
        
        // Transform API data
        const questsData = data.map(quest => ({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          type: quest.type || 'daily',
          difficulty: quest.difficulty || 'easy',
          reward: quest.reward || 100,
          progress: quest.progress || 0,
          maxProgress: quest.max_progress || 1,
          completed: quest.completed || false,
          expiresAt: quest.expires_at,
          requirements: quest.requirements || [],
          category: quest.category || 'general',
          icon: quest.icon || '🎯'
        }));
        
        setQuests(questsData);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
      // Fallback to mock data
      const mockQuests = {
        available: [
          {
            id: 1,
            title: 'Первые шаги',
            description: 'Пройдите первый тест по физике',
            type: 'daily',
            difficulty: 'easy',
            reward: 100,
            progress: 0,
            maxProgress: 1,
            completed: false,
            requirements: ['Пройти любой тест'],
            category: 'beginner',
            icon: '🚀'
          },
          {
            id: 2,
            title: 'Знаток механики',
            description: 'Наберите 80% или выше в 3 тестах по механике',
            type: 'weekly',
            difficulty: 'medium',
            reward: 300,
            progress: 1,
            maxProgress: 3,
            completed: false,
            requirements: ['Пройти 3 теста по механике с результатом 80%+'],
            category: 'mechanics',
            icon: '⚙️'
          },
          {
            id: 3,
            title: 'Ежедневная практика',
            description: 'Занимайтесь 7 дней подряд',
            type: 'achievement',
            difficulty: 'hard',
            reward: 500,
            progress: 4,
            maxProgress: 7,
            completed: false,
            requirements: ['Заниматься каждый день в течение недели'],
            category: 'streak',
            icon: '🔥'
          },
          {
            id: 4,
            title: 'Мастер формул',
            description: 'Изучите 20 формул',
            type: 'special',
            difficulty: 'medium',
            reward: 250,
            progress: 12,
            maxProgress: 20,
            completed: false,
            requirements: ['Изучить 20 различных формул'],
            category: 'formulas',
            icon: '📐'
          }
        ],
        completed: [
          {
            id: 5,
            title: 'Новичок',
            description: 'Зарегистрируйтесь в приложении',
            type: 'achievement',
            difficulty: 'easy',
            reward: 50,
            progress: 1,
            maxProgress: 1,
            completed: true,
            requirements: ['Создать аккаунт'],
            category: 'beginner',
            icon: '👋'
          },
          {
            id: 6,
            title: 'Первые очки',
            description: 'Наберите 100 очков',
            type: 'achievement',
            difficulty: 'easy',
            reward: 100,
            progress: 100,
            maxProgress: 100,
            completed: true,
            requirements: ['Набрать 100 очков'],
            category: 'points',
            icon: '⭐'
          }
        ],
        daily: [
          {
            id: 7,
            title: 'Утренняя разминка',
            description: 'Решите 5 задач до 12:00',
            type: 'daily',
            difficulty: 'easy',
            reward: 50,
            progress: 3,
            maxProgress: 5,
            completed: false,
            expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
            requirements: ['Решить 5 задач до полудня'],
            category: 'daily',
            icon: '🌅'
          },
          {
            id: 8,
            title: 'Теория дня',
            description: 'Прочитайте 3 статьи',
            type: 'daily',
            difficulty: 'easy',
            reward: 75,
            progress: 1,
            maxProgress: 3,
            completed: false,
            expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
            requirements: ['Прочитать 3 теоретические статьи'],
            category: 'daily',
            icon: '📚'
          }
        ]
      };
      
      setQuests(mockQuests[activeTab] || []);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (questId) => {
    try {
      await apiClient.claimQuestReward(questId);
      // Update quest status
      setQuests(prev => prev.map(quest => 
        quest.id === questId 
          ? { ...quest, completed: true, progress: quest.maxProgress }
          : quest
      ));
      
      // Show success message or animation
      alert(`Награда получена! +${quests.find(q => q.id === questId)?.reward} очков`);
      
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Ошибка при получении награды');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyName = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return 'Неизвестно';
    }
  };

  const formatTimeLeft = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Истекло';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  const getProgressPercentage = (progress, maxProgress) => {
    return Math.min((progress / maxProgress) * 100, 100);
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
    tabs: {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    tab: {
      padding: '12px 20px',
      borderRadius: '25px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    activeTab: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    questsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    questCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    },
    completedCard: {
      background: 'rgba(16, 185, 129, 0.2)',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    },
    questHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px'
    },
    questIcon: {
      fontSize: '32px',
      minWidth: '40px'
    },
    questInfo: {
      flex: 1,
      minWidth: 0
    },
    questTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '4px',
      lineHeight: '1.3'
    },
    questType: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      marginBottom: '8px'
    },
    questDescription: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: '1.4',
      marginBottom: '16px'
    },
    questProgress: {
      marginBottom: '16px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #10b981, #34d399)',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    progressText: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    questFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px'
    },
    reward: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#fbbf24'
    },
    difficulty: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    claimButton: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      background: 'linear-gradient(135deg, #10b981, #34d399)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    timeLeft: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      padding: '4px 8px',
      borderRadius: '12px',
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      fontSize: '12px',
      fontWeight: '500',
      color: '#fca5a5'
    },
    requirements: {
      marginTop: '12px',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    requirementItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '4px'
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
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '30px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎯</div>
            <div>Загрузка квестов...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>🎯 Квесты</h1>
        <p style={pageStyles.subtitle}>Выполняйте задания и получайте награды</p>
      </div>

      {/* Tabs */}
      <div style={pageStyles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...pageStyles.tab,
              ...(activeTab === tab.id ? pageStyles.activeTab : {})
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Quests Grid */}
      {quests.length > 0 ? (
        <div style={pageStyles.questsGrid}>
          {quests.map(quest => (
            <div
              key={quest.id}
              style={{
                ...pageStyles.questCard,
                ...(quest.completed ? pageStyles.completedCard : {})
              }}
              onClick={() => {
                setSelectedQuest(quest);
                setShowQuestModal(true);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Time Left Badge */}
              {quest.expiresAt && !quest.completed && (
                <div style={pageStyles.timeLeft}>
                  ⏰ {formatTimeLeft(quest.expiresAt)}
                </div>
              )}

              {/* Quest Header */}
              <div style={pageStyles.questHeader}>
                <div style={pageStyles.questIcon}>{quest.icon}</div>
                <div style={pageStyles.questInfo}>
                  <div style={pageStyles.questTitle}>{quest.title}</div>
                  <div style={{
                    ...pageStyles.questType,
                    background: questTypes[quest.type]?.color + '20',
                    border: `1px solid ${questTypes[quest.type]?.color}30`,
                    color: questTypes[quest.type]?.color || 'white'
                  }}>
                    <span>{questTypes[quest.type]?.icon}</span>
                    <span>{questTypes[quest.type]?.name}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={pageStyles.questDescription}>
                {quest.description}
              </div>

              {/* Progress */}
              <div style={pageStyles.questProgress}>
                <div style={pageStyles.progressBar}>
                  <div 
                    style={{
                      ...pageStyles.progressFill,
                      width: `${getProgressPercentage(quest.progress, quest.maxProgress)}%`
                    }}
                  />
                </div>
                <div style={pageStyles.progressText}>
                  <span>{quest.progress}/{quest.maxProgress}</span>
                  <span>{Math.round(getProgressPercentage(quest.progress, quest.maxProgress))}%</span>
                </div>
              </div>

              {/* Footer */}
              <div style={pageStyles.questFooter}>
                <div style={pageStyles.reward}>
                  <span>⭐</span>
                  <span>+{quest.reward}</span>
                </div>
                
                <div style={{
                  ...pageStyles.difficulty,
                  background: getDifficultyColor(quest.difficulty) + '20',
                  border: `1px solid ${getDifficultyColor(quest.difficulty)}30`,
                  color: getDifficultyColor(quest.difficulty)
                }}>
                  {getDifficultyName(quest.difficulty)}
                </div>

                {quest.completed ? (
                  <div style={{
                    ...pageStyles.claimButton,
                    background: 'rgba(16, 185, 129, 0.3)',
                    cursor: 'default'
                  }}>
                    ✅ Выполнено
                  </div>
                ) : quest.progress >= quest.maxProgress ? (
                  <button
                    style={pageStyles.claimButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      claimReward(quest.id);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    🎁 Получить
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={pageStyles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h3>Нет доступных квестов</h3>
          <p>Проверьте позже или переключитесь на другую вкладку</p>
        </div>
      )}

      {/* Quest Details Modal */}
      {showQuestModal && selectedQuest && (
        <div style={pageStyles.modal} onClick={() => setShowQuestModal(false)}>
          <div style={pageStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={pageStyles.modalHeader}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
                  {selectedQuest.icon} {selectedQuest.title}
                </h2>
                <div style={{
                  ...pageStyles.questType,
                  background: questTypes[selectedQuest.type]?.color + '20',
                  border: `1px solid ${questTypes[selectedQuest.type]?.color}30`,
                  color: questTypes[selectedQuest.type]?.color || 'white'
                }}>
                  <span>{questTypes[selectedQuest.type]?.icon}</span>
                  <span>{questTypes[selectedQuest.type]?.name}</span>
                </div>
              </div>
              <button
                style={pageStyles.closeButton}
                onClick={() => setShowQuestModal(false)}
              >
                ×
              </button>
            </div>

            <div style={pageStyles.questDescription}>
              {selectedQuest.description}
            </div>

            <div style={pageStyles.questProgress}>
              <div style={pageStyles.progressBar}>
                <div 
                  style={{
                    ...pageStyles.progressFill,
                    width: `${getProgressPercentage(selectedQuest.progress, selectedQuest.maxProgress)}%`
                  }}
                />
              </div>
              <div style={pageStyles.progressText}>
                <span>Прогресс: {selectedQuest.progress}/{selectedQuest.maxProgress}</span>
                <span>{Math.round(getProgressPercentage(selectedQuest.progress, selectedQuest.maxProgress))}%</span>
              </div>
            </div>

            {selectedQuest.requirements && selectedQuest.requirements.length > 0 && (
              <div style={pageStyles.requirements}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Требования:</h4>
                {selectedQuest.requirements.map((req, index) => (
                  <div key={index} style={pageStyles.requirementItem}>
                    <span>•</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...pageStyles.questFooter, marginTop: '20px' }}>
              <div style={pageStyles.reward}>
                <span>⭐</span>
                <span>Награда: +{selectedQuest.reward} очков</span>
              </div>
              
              <div style={{
                ...pageStyles.difficulty,
                background: getDifficultyColor(selectedQuest.difficulty) + '20',
                border: `1px solid ${getDifficultyColor(selectedQuest.difficulty)}30`,
                color: getDifficultyColor(selectedQuest.difficulty)
              }}>
                {getDifficultyName(selectedQuest.difficulty)}
              </div>
            </div>

            {selectedQuest.expiresAt && !selectedQuest.completed && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '14px',
                color: '#fca5a5'
              }}>
                ⏰ Осталось времени: {formatTimeLeft(selectedQuest.expiresAt)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestsPage;
