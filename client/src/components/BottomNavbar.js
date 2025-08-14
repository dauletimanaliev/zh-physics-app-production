import React from 'react';
import './BottomNavbar.css';
import { useAuth } from '../contexts/AuthContext';

const BottomNavbar = () => {
  const { logout } = useAuth();

  const handleNavClick = (section) => {
    console.log(`Navigating to: ${section}`);
    // Add navigation logic here
  };

  return (
    <nav className="bottom-navbar">
      <a href="#" onClick={() => handleNavClick('home')} className="active">
        <i className="fas fa-home"></i>
        <span>Басты</span>
      </a>
      <a href="#" onClick={() => handleNavClick('tests')}>
        <i className="fas fa-edit"></i>
        <span>Тест</span>
      </a>
      <a href="#" onClick={() => handleNavClick('schedule')}>
        <i className="fas fa-calendar"></i>
        <span>Кесте</span>
      </a>
      <a href="#" onClick={() => handleNavClick('materials')}>
        <i className="fas fa-book"></i>
        <span>Материал</span>
      </a>
      <a href="#" onClick={() => handleNavClick('profile')}>
        <i className="fas fa-user"></i>
        <span>Профиль</span>
      </a>
      <a href="#" onClick={logout}>
        <i className="fas fa-sign-out-alt"></i>
        <span>Выйти</span>
      </a>
    </nav>
  );
};

export default BottomNavbar;
