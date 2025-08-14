import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from './apiClient';

// Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // You can fetch user data here if needed
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

class AuthService {
  async loginWithTelegram(initData) {
    try {
      const response = await apiClient.post('/auth/telegram', {
        initData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка входа');
    }
  }

  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка получения профиля');
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка обновления профиля');
    }
  }
}

export const authService = new AuthService();
