import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import PhotoQuestionUpload from './PhotoQuestionUpload';
import './PhysicsTestSystem.css';

const PhysicsTestSystem = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [mode, setMode] = useState('test'); // 'test' or 'photo'
  const [expandedExplanation, setExpandedExplanation] = useState(false);
  const [questionSet, setQuestionSet] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTestMode, setIsTestMode] = useState(false);

  const generateQuestion = async (selectedTopic = null, selectedDifficulty = null) => {
    setIsGenerating(true);
    setShowResult(false);
    setUserAnswer('');
    
    try {
      console.log('📸 Для генерации вопроса необходимо загрузить фото');
      
      // Show instruction message - no API call needed
      setCurrentQuestion({
        text: "Для генерации вопросов необходимо загрузить фото с задачей",
        type: "photo_required",
        options: ["Загрузить фото"],
        correct_answer: "",
        explanation: "Переключитесь на режим 'Фото → Виртуальная задача' и загрузите изображение",
        topic: "Инструкция",
        difficulty: "info"
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      setCurrentQuestion({
        text: "Загрузите фото физической задачи для генерации вопросов",
        type: "photo_required",
        options: [],
        correct_answer: "",
        explanation: "Используйте режим загрузки фото для создания вопросов на основе изображений",
        topic: "Инструкция",
        difficulty: "info"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    try {
      console.log('📝 Submitting answer:', userAnswer);
      
      // Enhanced answer checking with AI explanation
      const response = await apiClient.checkAnswer({
        question_id: currentQuestion.id || 'generated',
        question_text: currentQuestion.text,
        user_answer: userAnswer,
        correct_answer: currentQuestion.correct_answer,
        question_type: currentQuestion.type,
        options: currentQuestion.options,
        topic: currentQuestion.topic,
        difficulty: currentQuestion.difficulty
      });
      
      console.log('✅ Answer checked:', response);
      
      const historyItem = {
        question: currentQuestion.text,
        user_answer: userAnswer,
        correct_answer: currentQuestion.correct_answer,
        is_correct: response.is_correct,
        explanation: response.explanation || currentQuestion.explanation,
        ai_feedback: response.ai_feedback || null
      };
      
      setTestHistory(prev => [...prev, historyItem]);
      
      if (response.is_correct) {
        setScore(prev => prev + 1);
      }
      
      setShowResult(true);
      
    } catch (error) {
      console.error('❌ Error checking answer:', error);
      // Enhanced fallback answer checking
      const isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
      
      const historyItem = {
        question: currentQuestion.text,
        user_answer: userAnswer,
        correct_answer: currentQuestion.correct_answer,
        is_correct: isCorrect,
        explanation: currentQuestion.explanation,
        ai_feedback: isCorrect ? 
          "Отлично! Вы правильно решили задачу." : 
          `Неправильно. Правильный ответ: ${currentQuestion.correct_answer}. ${currentQuestion.explanation}`
      };
      
      setTestHistory(prev => [...prev, historyItem]);
      
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      
      setShowResult(true);
    }
  };

  const resetTest = () => {
    setCurrentQuestion(null);
    setUserAnswer('');
    setShowResult(false);
    setTestHistory([]);
    setScore(0);
    setQuestionCount(0);
  };

  const handleQuestionCreated = (response) => {
    console.log('📸 New virtual questions created:', response);
    
    // Handle multiple questions from AI
    if (response.questions && Array.isArray(response.questions)) {
      setQuestionSet(response.questions);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(response.questions[0]);
      setIsTestMode(true);
    } else if (response.virtual_question) {
      // Handle single question fallback
      setQuestionSet([response.virtual_question]);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(response.virtual_question);
      setIsTestMode(true);
    }
    
    setMode('test');
    setShowResult(false);
    setUserAnswer('');
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionSet.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questionSet[nextIndex]);
      setUserAnswer('');
      setShowResult(false);
      setExpandedExplanation(false);
    } else {
      // Test completed
      alert(`Тест завершен! Ваш результат: ${score}/${questionSet.length}`);
      setIsTestMode(false);
      setQuestionSet([]);
      setCurrentQuestion(null);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(questionSet[prevIndex]);
      setUserAnswer('');
      setShowResult(false);
      setExpandedExplanation(false);
    }
  };

  return (
    <div className="physics-test-system">
      <div className="test-header">
        <h1>🧪 Физика с ИИ</h1>
        
        {/* Mode Selector */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'test' ? 'active' : ''}`}
            onClick={() => setMode('test')}
          >
            🤖 ИИ Тесты
          </button>
          <button 
            className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
            onClick={() => setMode('photo')}
          >
            📸 Фото → Виртуальная задача
          </button>
        </div>

        {mode === 'test' && (
          <div className="test-mode">
            {!isTestMode && (
              <div className="test-controls">
                <div className="topic-selector">
                  <label>🎯 Тема:</label>
                  <select>
                    <option>Любая тема</option>
                  </select>
                </div>
                
                <div className="difficulty-selector">
                  <label>🎚️ Сложность:</label>
                  <select>
                    <option>Любая</option>
                  </select>
                </div>
                
                <button 
                  className="generate-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    generateQuestion();
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? '⏳ Генерация...' : '🤖 Генерировать вопрос'}
                </button>
              </div>
            )}
            
            {isTestMode && questionSet.length > 0 && (
              <div className="test-progress">
                <div className="progress-info">
                  <span>Вопрос {currentQuestionIndex + 1} из {questionSet.length}</span>
                  <span>Счет: {score}/{questionCount}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${((currentQuestionIndex + 1) / questionSet.length) * 100}%`}}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Upload Mode */}
      {mode === 'photo' && (
        <PhotoQuestionUpload onQuestionCreated={handleQuestionCreated} />
      )}


      {/* Test Mode */}
      {mode === 'test' && (
        <>
          {isGenerating ? (
            <div className="loading-container">
              <div className="ai-loading">
                <div className="ai-brain">🤖</div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <h3>ИИ генерирует вопрос по физике...</h3>
              <p>Создаем уникальную задачу специально для вас</p>
            </div>
          ) : currentQuestion ? (
            <div className="question-container">
              <div className="question-header">
                <span className="question-topic">{currentQuestion.topic || 'Физика'}</span>
                <span className="question-difficulty">{currentQuestion.difficulty || 'medium'}</span>
              </div>
              
              <div className="question-content">
                <h2>{currentQuestion.text}</h2>
                
                {currentQuestion.image && (
                  <div className="question-image">
                    <img src={currentQuestion.image} alt="График или диаграмма" />
                  </div>
                )}
                
                {currentQuestion.formula && (
                  <div className="question-formula">
                    <code>{currentQuestion.formula}</code>
                  </div>
                )}
              </div>

              {!showResult ? (
                <div className="answer-section">
                  {/* Topic and Difficulty Selector */}
                  <div className="question-filters">
                    <div className="filter-group">
                      <label>📚 Тема:</label>
                      <select className="filter-select">
                        <option value="">Любая тема</option>
                        <option value="mechanics">🚀 Механика</option>
                        <option value="electricity">⚡ Электричество</option>
                        <option value="thermodynamics">🌡️ Термодинамика</option>
                        <option value="optics">🔍 Оптика</option>
                        <option value="quantum">⚛️ Квантовая физика</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>🎯 Сложность:</label>
                      <select className="filter-select">
                        <option value="">Любая</option>
                        <option value="easy">🟢 Легко</option>
                        <option value="medium">🟡 Средне</option>
                        <option value="hard">🔴 Сложно</option>
                      </select>
                    </div>
                  </div>

                  {currentQuestion.type === 'photo_required' ? (
                    <div className="photo-required-message">
                      <div className="instruction-card">
                        <h3>📸 Загрузите фото для генерации вопросов</h3>
                        <p>Система работает только с реальными изображениями физических задач</p>
                        <button 
                          className="switch-mode-btn"
                          onClick={() => setMode('photo')}
                        >
                          📸 Перейти к загрузке фото
                        </button>
                      </div>
                    </div>
                  ) : currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                    <div className="multiple-choice">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          className={`option-btn ${userAnswer === option ? 'selected' : ''}`}
                          onClick={() => setUserAnswer(option)}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </button>
                      ))}
                    </div>
                  ) : currentQuestion.type !== 'photo_required' ? (
                    <div className="text-answer">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Введите ваш ответ..."
                        className="answer-input"
                        onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                      />
                    </div>
                  ) : null}

                  {currentQuestion.type !== 'photo_required' && (
                    <button 
                      onClick={submitAnswer} 
                      className="submit-btn"
                      disabled={!userAnswer.trim()}
                    >
                      ✅ Проверить ответ
                    </button>
                  )}
                </div>
              ) : (
                <div className="result-section">
                  <div className={`result-card ${testHistory[testHistory.length - 1]?.is_correct ? 'correct' : 'incorrect'}`}>
                    <div className="result-icon">
                      {testHistory[testHistory.length - 1]?.is_correct ? '🎉' : '❌'}
                    </div>
                    <h3>
                      {testHistory[testHistory.length - 1]?.is_correct ? 'Правильно!' : 'Неправильно'}
                    </h3>
                    <p><strong>Ваш ответ:</strong> {userAnswer}</p>
                    <p><strong>Правильный ответ:</strong> {currentQuestion.correct_answer}</p>
                    {testHistory[testHistory.length - 1]?.ai_feedback && (
                      <div className="ai-feedback">
                        <h4>🤖 ИИ Обратная связь:</h4>
                        <p>{testHistory[testHistory.length - 1].ai_feedback}</p>
                      </div>
                    )}
                    {testHistory[testHistory.length - 1]?.explanation && (
                      <div className="explanation">
                        <h4>💡 Объяснение:</h4>
                        <div className="explanation-content">
                          <p className="explanation-short">
                            {testHistory[testHistory.length - 1].explanation.split('.')[0]}.
                          </p>
                          {!expandedExplanation && (
                            <button 
                              className="expand-btn"
                              onClick={() => setExpandedExplanation(true)}
                            >
                              📖 Развернуть подробное решение
                            </button>
                          )}
                          {expandedExplanation && (
                            <div className="explanation-detailed">
                              <div className="solution-steps">
                                <h5>🔍 Пошаговое решение:</h5>
                                <div className="step">
                                  <span className="step-number">1.</span>
                                  <span className="step-text">Определяем данные из условия задачи</span>
                                </div>
                                <div className="step">
                                  <span className="step-number">2.</span>
                                  <span className="step-text">Выбираем подходящую формулу</span>
                                </div>
                                <div className="step">
                                  <span className="step-number">3.</span>
                                  <span className="step-text">Подставляем значения и вычисляем</span>
                                </div>
                                <div className="step">
                                  <span className="step-number">4.</span>
                                  <span className="step-text">Проверяем размерность и логичность ответа</span>
                                </div>
                              </div>
                              <div className="full-explanation">
                                <h5>📚 Полное объяснение:</h5>
                                <p>{testHistory[testHistory.length - 1].explanation}</p>
                              </div>
                              <div className="related-topics">
                                <h5>🔗 Связанные темы:</h5>
                                <div className="topic-tags">
                                  <span className="topic-tag">Кинематика</span>
                                  <span className="topic-tag">Графики движения</span>
                                  <span className="topic-tag">Перемещение</span>
                                </div>
                              </div>
                              <button 
                                className="collapse-btn"
                                onClick={() => setExpandedExplanation(false)}
                              >
                                ⬆️ Свернуть
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="next-actions">
                    {questionSet.length > 1 && (
                      <div className="navigation-controls">
                        <div className="progress-info">
                          Вопрос {currentQuestionIndex + 1} из {questionSet.length}
                        </div>
                        <div className="nav-buttons">
                          <button 
                            onClick={previousQuestion} 
                            className="nav-btn"
                            disabled={currentQuestionIndex === 0}
                          >
                            ⬅️ Предыдущий
                          </button>
                          <button 
                            onClick={nextQuestion} 
                            className="nav-btn"
                            disabled={currentQuestionIndex === questionSet.length - 1}
                          >
                            ➡️ Следующий
                          </button>
                        </div>
                      </div>
                    )}
                    <button onClick={(e) => { e.preventDefault(); generateQuestion(); }} className="next-btn">
                      🎲 Новый вопрос
                    </button>
                    <button onClick={(e) => { e.preventDefault(); resetTest(); }} className="reset-btn">
                      🔄 Начать заново
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-question">
              <h3>Готовы к тесту по физике?</h3>
              <button onClick={(e) => { e.preventDefault(); generateQuestion(); }} className="start-btn">
                🚀 Начать тест
              </button>
            </div>
          )}

          {testHistory.length > 0 && (
            <div className="test-history">
              <h3>📊 История ответов</h3>
              <div className="history-list">
                {testHistory.slice(-3).map((item, index) => (
                  <div key={index} className={`history-item ${item.is_correct ? 'correct' : 'incorrect'}`}>
                    <div className="history-icon">
                      {item.is_correct ? '✅' : '❌'}
                    </div>
                    <div className="history-content">
                      <p className="history-question">{item.question}</p>
                      <p className="history-answer">
                        <strong>Ваш ответ:</strong> {item.user_answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhysicsTestSystem;
