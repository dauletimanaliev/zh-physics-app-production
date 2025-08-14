import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const TestCreationDebug = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState(null);

  const createSimpleTest = async () => {
    console.log('🔥 Debug: Creating simple test...');
    setIsCreating(true);
    setResult(null);

    try {
      const testData = {
        title: 'Тест по механике (Debug)',
        description: 'Простой тест для проверки функциональности',
        category: 'mechanics',
        difficulty: 'easy',
        timeLimit: 15,
        maxScore: 100,
        requiredLevel: 1,
        rewardPoints: 50,
        rewardExperience: 25,
        isPublished: true,
        teacherId: user?.id || 'debug-teacher'
      };

      console.log('📊 Test data to send:', testData);
      console.log('👤 Current user:', user);

      const newTest = await apiClient.createTest(testData);
      console.log('✅ Test created successfully:', newTest);
      
      setResult({
        success: true,
        test: newTest,
        message: 'Тест успешно создан!'
      });

    } catch (error) {
      console.error('❌ Error creating test:', error);
      setResult({
        success: false,
        error: error.message,
        message: 'Ошибка при создании теста'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid #10b981',
      borderRadius: '15px',
      padding: '20px',
      maxWidth: '300px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      zIndex: 999,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#1a1a1a' }}>
        🔧 Debug: Создание теста
      </h3>
      
      <button
        onClick={createSimpleTest}
        disabled={isCreating}
        style={{
          width: '100%',
          background: isCreating ? '#6b7280' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isCreating ? 'not-allowed' : 'pointer',
          marginBottom: '15px',
          transition: 'all 0.2s ease'
        }}
      >
        {isCreating ? '⏳ Создание...' : '🚀 Создать тестовый тест'}
      </button>

      {result && (
        <div style={{
          padding: '10px',
          borderRadius: '8px',
          background: result.success ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
          fontSize: '12px'
        }}>
          <div style={{ 
            color: result.success ? '#065f46' : '#991b1b',
            fontWeight: '600',
            marginBottom: '5px'
          }}>
            {result.success ? '✅' : '❌'} {result.message}
          </div>
          
          {result.success && result.test && (
            <div style={{ color: '#065f46' }}>
              <strong>ID:</strong> {result.test.id}<br/>
              <strong>Название:</strong> {result.test.title}
            </div>
          )}
          
          {!result.success && result.error && (
            <div style={{ color: '#991b1b', fontSize: '11px' }}>
              <strong>Ошибка:</strong> {result.error}
            </div>
          )}
        </div>
      )}

      <div style={{
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '10px',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '10px'
      }}>
        <strong>Пользователь:</strong> {user?.name || 'Не авторизован'}<br/>
        <strong>Роль:</strong> {user?.role || 'Неизвестно'}<br/>
        <strong>ID:</strong> {user?.id || 'Нет ID'}
      </div>
    </div>
  );
};

export default TestCreationDebug;
