import React, { useState, useEffect } from 'react';
import './styles/App.css';
import './styles/themes.css';
import Registration from './pages/Registration';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import apiClient from './services/apiClient';

// New modern pages
import StudentQuickActionsPage from './pages/StudentQuickActionsPage';
import QuickActionsPage from './pages/QuickActionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import QuestsPage from './pages/QuestsPage';
import TestsPage from './pages/TestsPage';
import MaterialsPage from './pages/MaterialsPage';
import MaterialPage from './pages/MaterialPage';
import MaterialManagement from './pages/teacher/MaterialManagement';
import StudentList from './pages/teacher/StudentList';
import ScheduleManager from './pages/ScheduleManager';
import DirectorDashboard from './pages/DirectorDashboard';
import ProfilePage from './pages/ProfilePage';
import StudentManagementPage from './pages/StudentManagementPage';

// Legacy components for fallback
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminPanel from './components/AdminPanel';

function App() {
  const { isAuthenticated, user, loading, login } = useAuth();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [materialId, setMaterialId] = useState(null);

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // Quick initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setIsRegistered(true);
    } else {
      setRole(null);
      setIsRegistered(false);
    }
  }, [user]);

  // Navigation function to change pages
  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    if (params.materialId) {
      setMaterialId(params.materialId);
    }
  };

  // Make navigation available globally
  useEffect(() => {
    window.navigateTo = navigateTo;
    return () => {
      delete window.navigateTo;
    };
  }, []);

  if (isLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-logo">⚛️</div>
        <div className="loading-text">Загрузка приложения...</div>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isRegistered) {
    return <Registration onComplete={async (userData) => {
      console.log('Registration completed:', userData);
      
      // ✅ Save user in AuthContext (this also saves to localStorage)
      login(userData);
      
      // ✅ Save user in API database
      try {
        await apiClient.createUser({
          telegram_id: userData.telegram_id || userData.id,
          username: userData.username || null,
          first_name: userData.firstName,
          last_name: userData.lastName,
          birth_date: userData.birthDate ? userData.birthDate.toISOString().split('T')[0] : null,
          language: userData.language || 'ru',
          role: userData.role,
          registration_date: userData.registrationTime
        });
        console.log('✅ User saved to API database');
      } catch (error) {
        console.error('⚠️ Failed to save user to API database:', error);
        // Continue anyway - user is saved locally
      }
      
      // Set local state for role-based rendering
      setRole(userData.role);
      setIsRegistered(true);
    }} />;
  }

  const renderPage = () => {
    // Student pages
    if (role === 'student') {
      switch (currentPage) {
        case 'home':
          return <StudentQuickActionsPage />;
        case 'materials':
          return <MaterialsPage />;
        case 'material':
          return <MaterialPage materialId={materialId} navigateTo={navigateTo} />;
        case 'tests':
          return <TestsPage />;
        case 'schedule':
          return <SchedulePage />;
        case 'leaderboard':
          return <LeaderboardPage />;
        case 'quests':
          return <QuestsPage />;
        case 'profile':
          return <ProfilePage />;
        // Fallback to legacy components
        case 'dashboard':
          return <StudentDashboard />;
        default:
          return <StudentQuickActionsPage />;
      }
    }
    
    // Teacher pages
    else if (role === 'teacher') {
      switch (currentPage) {
        case 'home':
          return <QuickActionsPage />;
        case 'admin':
          return <AdminPanel />;
        case 'students':
          return <StudentList />;
        case 'materials':
          return <MaterialManagement />;
        case 'schedule':
          return <ScheduleManager />;
        case 'material':
          return <MaterialPage materialId={materialId} navigateTo={navigateTo} />;
        case 'tests':
          return <TestsPage />;
        case 'leaderboard':
          return <LeaderboardPage />;
        case 'profile':
          return <ProfilePage />;
        // Fallback to legacy components
        case 'dashboard':
          return <TeacherDashboard />;
        default:
          return <QuickActionsPage />;
      }
    }
    
    // Director/Admin pages
    else if (role === 'director' || role === 'admin') {
      switch (currentPage) {
        case 'home':
          return <DirectorDashboard />;
        case 'admin':
          return <AdminPanel />;
        case 'materials':
          return <MaterialsPage />;
        case 'tests':
          return <TestsPage />;
        case 'schedule':
          return <SchedulePage />;
        case 'leaderboard':
          return <LeaderboardPage />;
        case 'profile':
          return <ProfilePage />;
        default:
          return <DirectorDashboard />;
      }
    }
    
    // Default fallback
    return <StudentQuickActionsPage />;
  };

  return (
    <ThemeProvider>
      <SocketProvider>
        <div className="App">
          {renderPage()}
        
        {/* Bottom Navigation for mobile */}
      {(role === 'student' || role === 'teacher') && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 0',
          zIndex: 1000
        }}>
          {role === 'student' ? (
            <>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'home' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>🏠</span>
                <span>Главная</span>
              </button>
              <button
                onClick={() => navigateTo('tests')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'tests' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>📝</span>
                <span>Тесты</span>
              </button>
              <button
                onClick={() => navigateTo('materials')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'materials' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>📚</span>
                <span>Материалы</span>
              </button>
              <button
                onClick={() => navigateTo('leaderboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'leaderboard' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>🏆</span>
                <span>Рейтинг</span>
              </button>
              <button
                onClick={() => navigateTo('profile')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'profile' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>👤</span>
                <span>Профиль</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'home' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>🏠</span>
                <span>Главная</span>
              </button>
              <button
                onClick={() => navigateTo('admin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'admin' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>⚙️</span>
                <span>Панель</span>
              </button>
              <button
                onClick={() => navigateTo('materials')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'materials' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>📚</span>
                <span>Материалы</span>
              </button>
              <button
                onClick={() => navigateTo('profile')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 'profile' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>👤</span>
                <span>Профиль</span>
              </button>
            </>
          )}
        </div>
      )}
      </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
