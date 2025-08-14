import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async (deleteFromDatabase = false) => {
    console.log('🚀 Logout function called with:', { deleteFromDatabase, user });
    
    try {
      if (deleteFromDatabase) {
        console.log('🔍 Checking if user exists:', !!user);
        
        if (user) {
          // Get user ID for deletion - try multiple possible ID fields
          const userId = user.telegram_id || user.id || user.user_id;
          console.log('🔑 User ID candidates:', { 
            telegram_id: user.telegram_id, 
            id: user.id, 
            user_id: user.user_id,
            finalUserId: userId 
          });
          console.log('👤 Full user object:', user);
          
          if (userId) {
            console.log('📞 Calling API to delete user:', userId);
            const result = await apiClient.logoutUser(userId);
            console.log('📋 Logout API result:', result);
            
            if (result && result.success) {
              console.log('✅ User successfully deleted from database');
            } else {
              console.warn('⚠️ API reported unsuccessful deletion:', result?.message || 'No result');
            }
          } else {
            console.error('❌ No valid user ID found for deletion');
            console.error('🔍 Available user fields:', Object.keys(user));
          }
        } else {
          console.error('❌ No user object found in context');
        }
      } else {
        console.log('⏭️ Skipping database deletion (deleteFromDatabase = false)');
      }
    } catch (error) {
      console.error('❌ Error during logout from database:', error);
      console.error('🔍 Error details:', error.message, error.stack);
      // Continue with local logout even if API call fails
    }
    
    // Always clear local data
    console.log('🧹 Clearing local user data');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    console.log('✅ Local logout completed');
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
