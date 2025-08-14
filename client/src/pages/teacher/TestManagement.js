import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';

const TestManagement = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Form states
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    category: 'mechanics',
    difficulty: 'easy',
    timeLimit: 20,
    maxScore: 100,
    requiredLevel: 1,
    rewardPoints: 50,
    rewardExperience: 25,
    isPublished: false
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 1
  });

  const categories = [
    { id: 'mechanics', name: 'Механика', icon: '⚙️' },
    { id: 'thermodynamics', name: 'Термодинамика', icon: '🌡️' },
    { id: 'electricity', name: 'Электричество', icon: '⚡' },
    { id: 'optics', name: 'Оптика', icon: '🔍' },
    { id: 'atomic', name: 'Атомная физика', icon: '⚛️' },
    { id: 'waves', name: 'Волны', icon: '〰️' }
  ];

  const difficulties = [
    { id: 'easy', name: 'Легкий', color: '#10b981' },
    { id: 'medium', name: 'Средний', color: '#f59e0b' },
    { id: 'hard', name: 'Сложный', color: '#ef4444' }
  ];

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading teacher tests...');
      
      // Load teacher's tests
      const teacherTests = await apiClient.getTeacherTests();
      console.log('📊 Teacher tests loaded:', teacherTests);
      setTests(teacherTests);
    } catch (error) {
      console.error('❌ Error loading tests:', error);
      console.log('🔄 Using fallback mock data');
      
      // Fallback mock data
      setTests([
        {
          id: 1,
          title: 'Основы кинематики',
          description: 'Тест на понимание основных понятий движения',
          category: 'mechanics',
          difficulty: 'easy',
          questionsCount: 15,
          timeLimit: 20,
          isPublished: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      console.log('✅ TestManagement loading complete');
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    console.log('🚀 handleCreateTest called!');
    console.log('📝 Test form data:', testForm);
    console.log('👤 User data:', user);
    
    try {
      const testData = {
        ...testForm,
        teacherId: user.id
      };
      console.log('📊 Sending test data to API:', testData);
      
      const newTest = await apiClient.createTest(testData);
      console.log('✅ Test created successfully:', newTest);
      
      setTests([...tests, newTest]);
      setShowCreateModal(false);
      resetTestForm();
      console.log('🎉 Test added to list and modal closed');
    } catch (error) {
      console.error('❌ Error creating test:', error);
      console.error('❌ Error details:', error.message);
      alert('Ошибка при создании теста: ' + error.message);
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      description: test.description,
      category: test.category,
      difficulty: test.difficulty,
      timeLimit: test.timeLimit,
      maxScore: test.maxScore,
      requiredLevel: test.requiredLevel,
      rewardPoints: test.rewardPoints,
      rewardExperience: test.rewardExperience,
      isPublished: test.isPublished
    });
    setShowCreateModal(true);
  };

  const handleManageQuestions = (test) => {
    setCurrentTest(test);
    setShowQuestionModal(true);
  };

  const handleAddQuestion = () => {
    setCurrentQuestion(null);
    resetQuestionForm();
  };

  const handleEditQuestion = (question) => {
    setCurrentQuestion(question);
    setQuestionForm({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: question.points
    });
  };

  const handleSaveQuestion = async () => {
    try {
      if (currentQuestion) {
        // Update existing question
        await apiClient.updateQuestion(currentQuestion.id, questionForm);
      } else {
        // Create new question
        await apiClient.createQuestion(currentTest.id, questionForm);
      }
      
      // Refresh questions
      // In real implementation, reload questions for current test
      resetQuestionForm();
      setCurrentQuestion(null);
      console.log('✅ Question saved');
    } catch (error) {
      console.error('❌ Error saving question:', error);
      alert('Ошибка при сохранении вопроса');
    }
  };

  const resetTestForm = () => {
    setTestForm({
      title: '',
      description: '',
      category: 'mechanics',
      difficulty: 'easy',
      timeLimit: 20,
      maxScore: 100,
      requiredLevel: 1,
      rewardPoints: 50,
      rewardExperience: 25,
      isPublished: false
    });
    setEditingTest(null);
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1
    });
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
    createButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '15px',
      padding: '20px 40px',
      color: 'white',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
      minWidth: '250px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    testsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px'
    },
    testCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease'
    },
    testTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '10px'
    },
    testDescription: {
      fontSize: '14px',
      opacity: 0.8,
      marginBottom: '20px',
      lineHeight: '1.5'
    },
    testMeta: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      marginBottom: '20px',
      fontSize: '13px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      opacity: 0.8
    },
    testActions: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    },
    actionButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '10px',
      padding: '8px 15px',
      color: 'white',
      fontSize: '12px',
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
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
      color: 'white'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '600'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    modalActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '30px'
    },
    saveButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 25px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    cancelButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '10px',
      padding: '12px 25px',
      color: 'white',
      fontSize: '14px',
      cursor: 'pointer'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Загрузка тестов...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📝 Управление тестами</h1>
        <p style={pageStyles.subtitle}>Создавайте и редактируйте тесты для студентов</p>
      </div>

      {/* Create Test Button */}
      <button
        style={pageStyles.createButton}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔥 Create Test button clicked!');
          console.log('📊 Current showCreateModal state:', showCreateModal);
          setShowCreateModal(true);
          console.log('✅ setShowCreateModal(true) called');
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: '24px' }}>➕</span>
        <span>Создать новый тест</span>
      </button>

      {/* Tests Grid */}
      {tests.length > 0 ? (
        <div style={pageStyles.testsGrid}>
          {tests.map(test => {
            const category = categories.find(c => c.id === test.category);
            const difficulty = difficulties.find(d => d.id === test.difficulty);
            
            return (
              <div
                key={test.id}
                style={pageStyles.testCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={pageStyles.testTitle}>
                  {category?.icon} {test.title}
                </div>
                <div style={pageStyles.testDescription}>
                  {test.description}
                </div>
                
                <div style={pageStyles.testMeta}>
                  <div style={pageStyles.metaItem}>
                    <span>📋</span>
                    <span>{test.questionsCount || 0} вопросов</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span>⏱️</span>
                    <span>{test.timeLimit} мин</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span style={{ color: difficulty?.color }}>●</span>
                    <span>{difficulty?.name}</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span>{test.isPublished ? '✅' : '⏳'}</span>
                    <span>{test.isPublished ? 'Опубликован' : 'Черновик'}</span>
                  </div>
                </div>

                <div style={pageStyles.testActions}>
                  <button
                    style={pageStyles.actionButton}
                    onClick={() => handleManageQuestions(test)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    📝 Вопросы
                  </button>
                  <button
                    style={pageStyles.actionButton}
                    onClick={() => handleEditTest(test)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    style={{
                      ...pageStyles.actionButton,
                      background: test.isPublished 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {test.isPublished ? '📴 Скрыть' : '📢 Опубликовать'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: '50px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
          <h3>Тестов пока нет</h3>
          <p style={{ opacity: 0.8 }}>Создайте первый тест для ваших студентов</p>
        </div>
      )}

      {/* Create/Edit Test Modal */}
      {console.log('🔍 Rendering modal check - showCreateModal:', showCreateModal)}
      {showCreateModal && (
        <div style={pageStyles.modal}>
          <div style={pageStyles.modalContent}>
            <h2 style={{ marginTop: 0 }}>
              {editingTest ? '✏️ Редактировать тест' : '➕ Создать новый тест'}
            </h2>
            
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Название теста</label>
              <input
                style={pageStyles.input}
                type="text"
                value={testForm.title}
                onChange={(e) => setTestForm({...testForm, title: e.target.value})}
                placeholder="Например: Основы механики"
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Описание</label>
              <textarea
                style={pageStyles.textarea}
                value={testForm.description}
                onChange={(e) => setTestForm({...testForm, description: e.target.value})}
                placeholder="Краткое описание теста..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Категория</label>
                <select
                  style={pageStyles.select}
                  value={testForm.category}
                  onChange={(e) => setTestForm({...testForm, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Сложность</label>
                <select
                  style={pageStyles.select}
                  value={testForm.difficulty}
                  onChange={(e) => setTestForm({...testForm, difficulty: e.target.value})}
                >
                  {difficulties.map(diff => (
                    <option key={diff.id} value={diff.id}>
                      {diff.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Время (мин)</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  value={testForm.timeLimit}
                  onChange={(e) => setTestForm({...testForm, timeLimit: parseInt(e.target.value)})}
                  min="5"
                  max="120"
                />
              </div>

              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Очки</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  value={testForm.rewardPoints}
                  onChange={(e) => setTestForm({...testForm, rewardPoints: parseInt(e.target.value)})}
                  min="10"
                  max="500"
                />
              </div>

              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Уровень</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  value={testForm.requiredLevel}
                  onChange={(e) => setTestForm({...testForm, requiredLevel: parseInt(e.target.value)})}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div style={pageStyles.modalActions}>
              <button
                style={pageStyles.cancelButton}
                onClick={() => {
                  setShowCreateModal(false);
                  resetTestForm();
                }}
              >
                Отмена
              </button>
              <button
                style={pageStyles.saveButton}
                onClick={handleCreateTest}
                disabled={!testForm.title.trim()}
              >
                {editingTest ? 'Сохранить' : 'Создать тест'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Management Modal */}
      {showQuestionModal && currentTest && (
        <div style={pageStyles.modal}>
          <div style={pageStyles.modalContent}>
            <h2 style={{ marginTop: 0 }}>
              📝 Вопросы: {currentTest.title}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <button
                style={pageStyles.createButton}
                onClick={handleAddQuestion}
              >
                ➕ Добавить вопрос
              </button>
            </div>

            {/* Question Form */}
            {(currentQuestion !== null || questionForm.question) && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3>{currentQuestion ? 'Редактировать вопрос' : 'Новый вопрос'}</h3>
                
                <div style={pageStyles.formGroup}>
                  <label style={pageStyles.label}>Текст вопроса</label>
                  <textarea
                    style={pageStyles.textarea}
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                    placeholder="Введите текст вопроса..."
                  />
                </div>

                <div style={pageStyles.formGroup}>
                  <label style={pageStyles.label}>Варианты ответов</label>
                  {questionForm.options.map((option, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={questionForm.correctAnswer === index}
                        onChange={() => setQuestionForm({...questionForm, correctAnswer: index})}
                      />
                      <input
                        style={{ ...pageStyles.input, margin: 0 }}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[index] = e.target.value;
                          setQuestionForm({...questionForm, options: newOptions});
                        }}
                        placeholder={`Вариант ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                </div>

                <div style={pageStyles.formGroup}>
                  <label style={pageStyles.label}>Объяснение (необязательно)</label>
                  <textarea
                    style={pageStyles.textarea}
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                    placeholder="Объяснение правильного ответа..."
                  />
                </div>

                <div style={pageStyles.modalActions}>
                  <button
                    style={pageStyles.cancelButton}
                    onClick={() => {
                      resetQuestionForm();
                      setCurrentQuestion(null);
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    style={pageStyles.saveButton}
                    onClick={handleSaveQuestion}
                    disabled={!questionForm.question.trim() || questionForm.options.some(opt => !opt.trim())}
                  >
                    Сохранить вопрос
                  </button>
                </div>
              </div>
            )}

            <div style={pageStyles.modalActions}>
              <button
                style={pageStyles.cancelButton}
                onClick={() => {
                  setShowQuestionModal(false);
                  setCurrentTest(null);
                  resetQuestionForm();
                  setCurrentQuestion(null);
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
