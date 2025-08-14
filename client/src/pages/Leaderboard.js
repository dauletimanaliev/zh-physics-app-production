import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch leaderboard data from API
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Simulate API call
      const response = await new Promise((resolve) =>
        setTimeout(() =>
          resolve({
            data: [
              { id: 1, name: 'Алексей', points: 1500, rank: 1 },
              { id: 2, name: 'Мария', points: 1450, rank: 2 },
              { id: 3, name: 'Дмитрий', points: 1400, rank: 3 },
            ],
          }),
        1000
        )
      );
      setLeaders(response.data);
    } catch (error) {
      console.error('Ошибка загрузки рейтинга:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-page">
      <h1>Рейтинг</h1>
      <p>Таблица лидеров учеников</p>
      {loading ? (
        <div className="loading">Загрузка рейтинга...</div>
      ) : (
        <div className="leaderboard-list">
          {leaders.map((leader) => (
            <div key={leader.id} className="leader-card">
              <h2>{leader.rank}. {leader.name}</h2>
              <p>Очки: {leader.points}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
