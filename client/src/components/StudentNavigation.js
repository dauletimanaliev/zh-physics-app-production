import React, { useState } from 'react';
import './StudentNavigation.css';

const StudentNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', icon: '🏠', label: 'Главная' },
    { id: 'materials', icon: '📚', label: 'Материалы' },
    { id: 'tests', icon: '📝', label: 'Тесты' },
    { id: 'schedule', icon: '📅', label: 'Расписание' },
    { id: 'profile', icon: '👤', label: 'Профиль' }
  ];

  return (
    <div className="student-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default StudentNavigation;
