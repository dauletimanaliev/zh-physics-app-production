import React, { useState, useEffect } from 'react';
import './Tests.css';

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tests from API
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      // Simulate API call
      const response = await new Promise((resolve) =>
        setTimeout(() =>
          resolve({
            data: [
              { id: 1, subject: 'Физика', questions: 15, duration: '20 минут' },
              { id: 2, subject: 'Математика', questions: 10, duration: '15 минут' },
            ],
          }),
        1000
        )
      );
      setTests(response.data);
    } catch (error) {
      console.error('Ошибка загрузки тестов:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tests-page">
      <h1>Тесты</h1>
      <p>Проходите тесты по физике</p>
      {loading ? (
        <div className="loading">Загрузка тестов...</div>
      ) : (
        <div className="test-list">
          {tests.map((test) => (
            <div key={test.id} className="test-card">
              <h2>{test.subject}</h2>
              <p>Вопросы: {test.questions}</p>
              <p>Длительность: {test.duration}</p>
              <button className="start-test-button">Начать тест</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tests;
