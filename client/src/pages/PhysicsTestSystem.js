import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import PhotoQuestionUpload from './PhotoQuestionUpload';
import './PhysicsTestSystem.css';

const PhysicsTestSystem = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [mode, setMode] = useState('test'); // 'test' or 'photo'

  const generateQuestion = async (selectedTopic = null, selectedDifficulty = null) => {
    setIsGenerating(true);
    setShowResult(false);
    setUserAnswer('');
    
    try {
      console.log('🤖 Generating AI physics question...');
      
      // Call AI API to generate physics question with filters
      const response = await apiClient.generateAIQuestion({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        language: 'ru'
      });
      
      console.log('✅ AI Question generated:', response);
      setCurrentQuestion(response.question);
      setQuestionCount(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Error generating question:', error);
      // Fallback to a default question with multiple choice
      setCurrentQuestion({
        text: "Какая сила действует на тело массой 2 кг при ускорении 3 м/с²?",
        type: "multiple_choice",
        options: ["4 Н", "6 Н", "8 Н", "10 Н"],
        correct_answer: "6 Н",
        explanation: "По второму закону Ньютона: F = ma = 2 кг × 3 м/с² = 6 Н",
        topic: "Механика",
        difficulty: "easy"
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

  const handleQuestionCreated = (newQuestion) => {
    console.log('📸 New virtual question created:', newQuestion);
    // Could switch to test mode and load this question
    setMode('test');
    setCurrentQuestion(newQuestion);
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
          <div className="test-stats">
            <div className="stat">
              <span className="stat-value">{score}</span>
              <span className="stat-label">Правильных</span>
            </div>
            <div className="stat">
              <span className="stat-value">{questionCount}</span>
              <span className="stat-label">Вопросов</span>
            </div>
            <div className="stat">
              <span className="stat-value">{questionCount > 0 ? Math.round((score / questionCount) * 100) : 0}%</span>
              <span className="stat-label">Точность</span>
            </div>
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

                  {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
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
                  ) : (
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
                  )}

                  <button 
                    onClick={submitAnswer} 
                    className="submit-btn"
                    disabled={!userAnswer.trim()}
                  >
                    ✅ Проверить ответ
                  </button>
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
                        <p>{testHistory[testHistory.length - 1].explanation}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="next-actions">
                    <button onClick={generateQuestion} className="next-btn">
                      🎲 Следующий вопрос
                    </button>
                    <button onClick={resetTest} className="reset-btn">
                      🔄 Начать заново
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-question">
              <h3>Готовы к тесту по физике?</h3>
              <button onClick={generateQuestion} className="start-btn">
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
