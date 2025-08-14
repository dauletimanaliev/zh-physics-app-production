import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ style = {} }) => {
  const { theme, toggleTheme, isDark, colors } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '20px',
        color: colors.text,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 4px 12px ${colors.shadow}`,
        transition: 'all 0.3s ease',
        zIndex: 999,
        ...style
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'scale(1.1)';
        e.target.style.boxShadow = `0 6px 20px ${colors.shadow}`;
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = `0 4px 12px ${colors.shadow}`;
      }}
      title={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
