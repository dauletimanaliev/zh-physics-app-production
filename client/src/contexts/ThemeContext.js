import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Get theme from Telegram Web App
    if (window.Telegram?.WebApp?.colorScheme) {
      setTheme(window.Telegram.WebApp.colorScheme);
    }

    // Listen for theme changes
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.onEvent('themeChanged', () => {
        setTheme(window.Telegram.WebApp.colorScheme);
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Comprehensive color palette for both themes
  const colors = {
    light: {
      // Background colors
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBackground: 'rgba(255, 255, 255, 0.1)',
      modalBackground: 'rgba(255, 255, 255, 0.95)',
      
      // Text colors
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textDark: '#1a1a1a',
      
      // UI elements
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      
      // Interactive elements
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#6b7280',
      accent: '#3b82f6',
      
      // Status colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    },
    dark: {
      // Background colors
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      cardBackground: 'rgba(255, 255, 255, 0.05)',
      modalBackground: 'rgba(26, 26, 46, 0.95)',
      
      // Text colors
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textDark: '#ffffff',
      
      // UI elements
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      
      // Interactive elements
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#6b7280',
      accent: '#3b82f6',
      
      // Status colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    }
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    colors: colors[theme],
    allColors: colors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
