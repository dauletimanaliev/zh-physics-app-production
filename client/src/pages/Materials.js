import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import './Materials.css';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch materials from API
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      // Try to get real materials data first
      const response = await apiClient.getRealMaterials('Физика', 'ru');
      if (response && response.materials && response.materials.length > 0) {
        setMaterials(response.materials);
      } else {
        // Fallback to mock data
        const mockMaterials = await new Promise((resolve) =>
          setTimeout(() =>
            resolve({
              data: [
                { id: 1, subject: 'Физика', type: 'Видео', title: 'Основы механики', description: 'Видео о механике', url: '#' },
                { id: 2, subject: 'Физика', type: 'PDF', title: 'Кинематика', description: 'Учебник по кинематике', url: '#' },
                { id: 3, subject: 'Физика', type: 'Интерактив', title: 'Динамика', description: 'Интерактивные задания', url: '#' },
                { id: 4, subject: 'Физика', type: 'Видео', title: 'Термодинамика', description: 'Видеолекции', url: '#' },
              ],
            }),
          1000
          )
        );
        setMaterials(mockMaterials.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      // Fallback to mock data on error
      setMaterials([
        { id: 1, subject: 'Физика', type: 'Видео', title: 'Основы механики', description: 'Видео о механике', url: '#' },
        { id: 2, subject: 'Физика', type: 'PDF', title: 'Кинематика', description: 'Учебник по кинематике', url: '#' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="materials-page">
      <h1>Учебные материалы</h1>
      <p>Изучайте материалы по физике</p>
      {loading ? (
        <div className="loading">Загрузка материалов...</div>
      ) : (
        <div className="materials-list">
          {materials.map((material) => (
            <div key={material.id} className="material-card">
              <h2>{material.title}</h2>
              <p>Предмет: {material.subject}</p>
              <p>Тип: {material.type}</p>
              <p>{material.description}</p>
              <a href={material.url} className="view-material-button">Просмотр</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Materials;
