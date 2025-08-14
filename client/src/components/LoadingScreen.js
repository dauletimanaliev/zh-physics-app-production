import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <div className="loading-logo">⚛️</div>
      <div className="loading-text">Загрузка приложения...</div>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingScreen;
