import React, { useEffect, useState } from 'react';
import './StudentDashboard.css';
import apiClient from '../services/apiClient';

const StudentDashboard = () => {
  const [userStats, setUserStats] = useState({
    rank: null,
    points: null,
    level: null,
    streak: null,
  });
  const [quests, setQuests] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Try to load real data from multiple endpoints
      const [leaderboardResponse, questsResponse, materialsResponse] = await Promise.allSettled([
        apiClient.getRealLeaderboard(10),
        apiClient.getRealQuests('ru'),
        apiClient.getRealMaterials('Физика', 'ru')
      ]);

      // Process real leaderboard data
      if (leaderboardResponse.status === 'fulfilled' && leaderboardResponse.value?.leaderboard) {
        const currentUserRank = leaderboardResponse.value.leaderboard.find(user => 
          user.username === user?.username || user.id === user?.telegram_id
        );
        if (currentUserRank) {
          setUserStats(prev => ({
            ...prev,
            rank: currentUserRank.rank,
            points: currentUserRank.points,
            level: currentUserRank.level,
            streak: currentUserRank.streak
          }));
        }
      }

      // Process real quests data
      if (questsResponse.status === 'fulfilled' && questsResponse.value?.quests) {
        setQuests(questsResponse.value.quests.slice(0, 3)); // Show first 3 quests
      }

      // Process real materials data
      if (materialsResponse.status === 'fulfilled' && materialsResponse.value?.materials) {
        setRecentMaterials(materialsResponse.value.materials.slice(0, 3)); // Show first 3 materials
      }

      // If no real data available, fall back to mock data
      if (leaderboardResponse.status === 'rejected' && questsResponse.status === 'rejected') {
        // Fallback to mock data
        const mockData = {
          // Add mock data here
        };
        setUserStats(mockData.userStats);
        setQuests(mockData.quests);
        setRecentMaterials(mockData.recentMaterials);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <h1>ҰБТ дайындығы</h1>
        <p>Қосымшаға қош келдіңіз!</p>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">📝</div>
          <h3>Тестілеу</h3>
          <p>Физика және математика бойынша тестілер</p>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📅</div>
          <h3>Кесте</h3>
          <p>Сабақтар кестесі және оқу жоспары</p>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📚</div>
          <h3>Материалдар</h3>
          <p>Видео сабақтар және оқу материалдары</p>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🏆</div>
          <h3>Рейтинг</h3>
          <p>Ең үздік студенттердің тізімі</p>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📋</div>
          <h3>Тапсырмалар</h3>
          <p>Күнделікті және апталық тапсырмалар</p>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👤</div>
          <h3>Профиль</h3>
          <p>Жеке ақпарат және жетістіктер</p>
        </div>
      </div>

      <div className="achievements-section">
        <h2>Соңғы жетістіктер</h2>
        <div className="achievements-list">
          <p>Сізде әзірше жетістік жоқ</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
