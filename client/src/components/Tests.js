import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import './Tests.css';

const Tests = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [physicsTopics, setPhysicsTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [testSession, setTestSession] = useState(null);

  // Load physics topics from API
  useEffect(() => {
    loadPhysicsTopics();
  }, []);

  const loadPhysicsTopics = async () => {
    try {
      setLoading(true);
      
      // Try to load from API, fallback to mock data
      try {
        const response = await apiClient.getPhysicsTopics();
        const topics = response.topics || [];
        
        // Add progress data for each topic
        const topicsWithProgress = topics.map(topic => ({
          ...topic,
          testsCount: getRandomInt(12, 30),
          completedTests: getRandomInt(5, 20),
          averageScore: getRandomInt(65, 95),
          streak: getRandomInt(1, 10)
        }));
        
        setPhysicsTopics(topicsWithProgress);
      } catch (error) {
        console.log('API not available, using mock data');
        // Fallback to original mock data
        setPhysicsTopics([
          {
            id: 'mechanics',
            name: 'Механика',
            icon: '🚀',
            description: 'Кинематика, динамика, статика',
            testsCount: 25,
            completedTests: 18,
            averageScore: 82,
            streak: 7
          },
          {
            id: 'thermodynamics',
            name: 'Термодинамика',
            icon: '🌡️',
            description: 'Газовые законы, тепловые процессы',
            testsCount: 18,
            completedTests: 12,
            averageScore: 75,
            streak: 4
          },
          {
            id: 'electricity',
            name: 'Электричество',
            icon: '⚡',
            description: 'Электростатика, постоянный ток',
            testsCount: 22,
            completedTests: 15,
            averageScore: 78,
            streak: 5
          },
          {
            id: 'magnetism',
            name: 'Магнетизм',
            icon: '🧲',
            description: 'Магнитное поле, электромагнетизм',
            testsCount: 16,
            completedTests: 9,
            averageScore: 71,
            streak: 3
          },
          {
            id: 'optics',
            name: 'Оптика',
            icon: '🔍',
            description: 'Геометрическая и волновая оптика',
            testsCount: 14,
            completedTests: 8,
            averageScore: 79,
            streak: 2
          },
          {
            id: 'atomic',
            name: 'Атомная физика',
            icon: '⚛️',
            description: 'Строение атома, ядерная физика',
            testsCount: 12,
            completedTests: 5,
            averageScore: 68,
            streak: 1
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading physics topics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for random integers
  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Load tests for selected subject
  const loadTests = async (subject) => {
    try {
      const response = await apiClient.getTestsBySubject(subject);
      setTests(response.tests || apiClient.getMockTests(subject));
    } catch (error) {
      console.log('Using mock tests');
      setTests(apiClient.getMockTests(subject));
    }
  };

  // Start test session
  const startTest = async (subject) => {
    await loadTests(subject.id);
    setTestSession({
      subject: subject,
      currentQuestion: 0,
      answers: [],
      score: 0,
      startTime: new Date()
    });
  };

  const recentTests = [
    { subject: 'Механика', topic: 'Ньютон заңдары', score: 95, date: '2 сағат бұрын' },
    { subject: 'Электричество', topic: 'Ом заңы', score: 88, date: '1 күн бұрын' },
    { subject: 'Термодинамика', topic: 'Идеал газ', score: 76, date: '2 күн бұрын' },
    { subject: 'Оптика', topic: 'Линзалар', score: 92, date: '3 күн бұрын' },
    { subject: 'Магнетизм', topic: 'Индукция', score: 84, date: '4 күн бұрын' }
  ];

  if (loading) {
    return (
      <div className="tests-container">
        <div className="tests-header">
          <h1>Физика тестілері</h1>
          <p>Жүктелуде...</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Test session interface
  if (testSession && tests.length > 0) {
    const currentQuestion = tests[testSession.currentQuestion];
    
    if (!currentQuestion) {
      // Test completed
      return (
        <div className="tests-container">
          <div className="test-results">
            <h1>🎉 Тест аяқталды!</h1>
            <div className="results-card">
              <h2>{testSession.subject.name}</h2>
              <div className="score-display">
                <div className="score-circle">
                  <span className="score-number">
                    {Math.round((testSession.score / tests.length) * 100)}%
                  </span>
                </div>
              </div>
              <div className="results-stats">
                <div className="stat">
                  <span className="label">Дұрыс жауаптар:</span>
                  <span className="value">{testSession.score}/{tests.length}</span>
                </div>
                <div className="stat">
                  <span className="label">Уақыт:</span>
                  <span className="value">
                    {Math.round((new Date() - testSession.startTime) / 1000 / 60)} мин
                  </span>
                </div>
              </div>
              <div className="results-actions">
                <button 
                  className="retry-btn"
                  onClick={() => startTest(testSession.subject)}
                >
                  🔄 Қайталау
                </button>
                <button 
                  className="back-btn"
                  onClick={() => {
                    setTestSession(null);
                    setSelectedSubject(null);
                  }}
                >
                  🏠 Басты бетке
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const handleAnswer = async (answer) => {
      const isCorrect = answer === currentQuestion.correct_answer;
      const newAnswers = [...testSession.answers, { 
        questionId: currentQuestion.id, 
        answer, 
        correct: isCorrect 
      }];
      
      const newScore = testSession.score + (isCorrect ? 1 : 0);
      
      // Submit answer to API
      try {
        await apiClient.submitTestAnswer({
          test_id: currentQuestion.id,
          answer: answer,
          user_id: 12345 // Mock user ID
        });
      } catch (error) {
        console.log('Answer submission failed, continuing offline');
      }
      
      setTestSession({
        ...testSession,
        currentQuestion: testSession.currentQuestion + 1,
        answers: newAnswers,
        score: newScore
      });
    };

    return (
      <div className="tests-container">
        <div className="test-interface">
          <div className="test-header">
            <button 
              className="back-button"
              onClick={() => setTestSession(null)}
            >
              ← Шығу
            </button>
            <div className="test-progress">
              <span>{testSession.currentQuestion + 1}/{tests.length}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((testSession.currentQuestion + 1) / tests.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="question-card">
            <h2 className="question-text">{currentQuestion.question}</h2>
            
            <div className="options-grid">
              <button 
                className="option-btn"
                onClick={() => handleAnswer('A')}
              >
                <span className="option-letter">A</span>
                <span className="option-text">{currentQuestion.option_a}</span>
              </button>
              <button 
                className="option-btn"
                onClick={() => handleAnswer('B')}
              >
                <span className="option-letter">B</span>
                <span className="option-text">{currentQuestion.option_b}</span>
              </button>
              <button 
                className="option-btn"
                onClick={() => handleAnswer('C')}
              >
                <span className="option-letter">C</span>
                <span className="option-text">{currentQuestion.option_c}</span>
              </button>
              <button 
                className="option-btn"
                onClick={() => handleAnswer('D')}
              >
                <span className="option-letter">D</span>
                <span className="option-text">{currentQuestion.option_d}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSubject) {
    return (
      <div className="tests-container">
        <div className="tests-header">
          <button 
            className="back-button"
            onClick={() => setSelectedSubject(null)}
          >
            ← Артқа
          </button>
          <h1>{selectedSubject.name} Тестілері</h1>
        </div>
        
        <div className="subject-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Орташа ұпай</h3>
              <p>{selectedSubject.averageScore}%</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Аяқталған</h3>
              <p>{selectedSubject.completedTests}/{selectedSubject.testsCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <h3>Streak</h3>
              <p>{selectedSubject.streak} күн</p>
            </div>
          </div>
        </div>

        <div className="test-categories">
          <div className="category-card">
            <h3>🎯 Жаттығу тестілері</h3>
            <p>Тақырып бойынша қысқа тестілер</p>
            <button 
              className="start-test-btn"
              onClick={() => startTest(selectedSubject)}
            >
              Бастау
            </button>
          </div>
          <div className="category-card">
            <h3>📝 Толық тест</h3>
            <p>ҰБТ форматындағы толық тест</p>
            <button 
              className="start-test-btn"
              onClick={() => startTest(selectedSubject)}
            >
              Бастау
            </button>
          </div>
          <div className="category-card">
            <h3>⏱️ Уақытпен тест</h3>
            <p>Уақыт шектеулі тест</p>
            <button 
              className="start-test-btn"
              onClick={() => startTest(selectedSubject)}
            >
              Бастау
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tests-container">
      <div className="tests-header">
        <h1>Физика тестілері</h1>
        <p>Физика бөлімін таңдаңыз</p>
      </div>

      <div className="subjects-grid">
        {physicsTopics.map(topic => (
          <div 
            key={topic.id} 
            className="subject-card"
            onClick={() => setSelectedSubject(topic)}
          >
            <div className="subject-icon">{topic.icon}</div>
            <div className="subject-info">
              <h3>{topic.name}</h3>
              <p>{topic.description}</p>
            </div>
            <div className="subject-stats">
              <div className="progress-ring">
                <div className="progress-text">
                  {Math.round((topic.completedTests / topic.testsCount) * 100)}%
                </div>
              </div>
              <div className="stats-mini">
                <span>⭐ {topic.averageScore}%</span>
                <span>🔥 {topic.streak}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-tests">
        <h2>Соңғы нәтижелер</h2>
        <div className="recent-list">
          {recentTests.map((test, index) => (
            <div key={index} className="recent-item">
              <div className="test-info">
                <h4>{test.subject} - {test.topic}</h4>
                <p>{test.date}</p>
              </div>
              <div className={`test-score ${test.score >= 80 ? 'good' : test.score >= 60 ? 'average' : 'poor'}`}>
                {test.score}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tests;
