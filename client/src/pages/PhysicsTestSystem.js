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
  const [currentMode, setCurrentMode] = useState('test'); // 'test' or 'upload'

  const generateQuestion = async (selectedTopic = null, selectedDifficulty = null) => {
    setIsGenerating(true);
    setShowResult(false);
    setUserAnswer('');
    
    try {
      console.log('🤖 Generating AI physics question...');
      
      // Call AI API to generate physics question with filters
      const response = await apiClient.generatePhysicsQuestion({
        topic: selectedTopic,
        difficulty: selectedDifficulty
      });
      
      setCurrentQuestion(response.question);
      setQuestionCount(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Error generating question:', error);
      
      // Fallback to sample question if AI fails
      setCurrentQuestion({
        id: Date.now(),
        text: "Тело массой 2 кг движется со скоростью 10 м/с. Какова его кинетическая энергия?",
        type: "calculation",
        image: null,
        options: ["100 Дж", "200 Дж", "20 Дж", "50 Дж"],
        correct_answer: "100 Дж",
        explanation: "Кинетическая энергия вычисляется по формуле E = mv²/2 = 2×10²/2 = 100 Дж",
        difficulty: "medium",
        topic: "Механика"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion) return;
    
    try {
      // Check answer with AI
      const result = await apiClient.checkPhysicsAnswer({
        question_id: currentQuestion.id,
        user_answer: userAnswer,
        correct_answer: currentQuestion.correct_answer
      });
      
      const isCorrect = result.is_correct;
      
      // Update score and history
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      
      setTestHistory(prev => [...prev, {
        question: currentQuestion.text,
        user_answer: userAnswer,
        correct_answer: currentQuestion.correct_answer,
        is_correct: isCorrect,
        explanation: currentQuestion.explanation,
        timestamp: new Date()
      }]);
      
      setShowResult(true);
      
    } catch (error) {
      console.error('❌ Error checking answer:', error);
      
      // Fallback answer checking
      const isCorrect = userAnswer.toLowerCase().trim() === 
                       currentQuestion.correct_answer.toLowerCase().trim();
      
      if (isCorrect) setScore(prev => prev + 1);
      
      setTestHistory(prev => [...prev, {
        question: currentQuestion.text,
        user_answer: userAnswer,
        correct_answer: currentQuestion.correct_answer,
        is_correct: isCorrect,
        explanation: currentQuestion.explanation,
        timestamp: new Date()
      }]);
      
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

  useEffect(() => {
    generateQuestion();
  }, []);

  const handlePhotoQuestionCreated = (question) => {
    setCurrentQuestion(question);
    setCurrentMode('test');
    setQuestionCount(prev => prev + 1);
  };

  return (
    <div className="physics-test-system">
      <div className="test-header">
        <h1>🧪 Физика с ИИ</h1>
        
        {/* Mode Selector */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${currentMode === 'test' ? 'active' : ''}`}
            onClick={() => setCurrentMode('test')}
          >
            🤖 ИИ Тесты
          </button>
          <button 
            className={`mode-btn ${currentMode === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentMode('upload')}
          >
            📸 Фото → Виртуальная задача
          </button>
        </div>

        {currentMode === 'test' && (
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
              <span className="stat-value">
                {questionCount > 0 ? Math.round((score / questionCount) * 100) : 0}%
              </span>
              <span className="stat-label">Точность</span>
            </div>
          </div>
        )}
      </div>

      {isGenerating ? (
        <div className="generating-question">
          <div className="ai-loader">
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
      ) : currentMode === 'upload' ? (
        <PhotoQuestionUpload onQuestionCreated={handlePhotoQuestionCreated} />
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
                disabled={!userAnswer.trim()}
                className="submit-btn"
              >
                ✓ Проверить ответ
              </button>
            </div>
          ) : (
            <div className="result-section">
              <div className={`result-card ${testHistory[testHistory.length - 1]?.is_correct ? 'correct' : 'incorrect'}`}>
                <div className="result-icon">
                  {testHistory[testHistory.length - 1]?.is_correct ? '✅' : '❌'}
                </div>
                <h3>
                  {testHistory[testHistory.length - 1]?.is_correct ? 'Правильно!' : 'Неправильно'}
                </h3>
                <p><strong>Ваш ответ:</strong> {userAnswer}</p>
                <p><strong>Правильный ответ:</strong> {currentQuestion.correct_answer}</p>
                
                {currentQuestion.explanation && (
                  <div className="explanation">
                    <h4>📚 Объяснение:</h4>
                    <p>{currentQuestion.explanation}</p>
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
    </div>
  );
};

export default PhysicsTestSystem;
