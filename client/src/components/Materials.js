import React, { useState } from 'react';
import './Materials.css';

const Materials = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Барлығы', icon: '📚' },
    { id: 'video', name: 'Видео', icon: '🎥' },
    { id: 'text', name: 'Мәтін', icon: '📄' },
    { id: 'interactive', name: 'Интерактивті', icon: '🎮' }
  ];

  const materials = [
    {
      id: 1,
      title: 'Механика негіздері',
      subject: 'Механика',
      type: 'video',
      duration: '45 мин',
      views: 1250,
      rating: 4.8,
      thumbnail: '🚀',
      description: 'Ньютон заңдары және қозғалыс теориясы',
      isBookmarked: true,
      progress: 75
    },
    {
      id: 2,
      title: 'Термодинамика заңдары',
      subject: 'Термодинамика',
      type: 'text',
      duration: '30 мин',
      views: 980,
      rating: 4.6,
      thumbnail: '🌡️',
      description: 'Идеал газ заңдары және жылу алмасу',
      isBookmarked: false,
      progress: 100
    },
    {
      id: 3,
      title: 'Электростатика',
      subject: 'Электричество',
      type: 'interactive',
      duration: '60 мин',
      views: 750,
      rating: 4.9,
      thumbnail: '⚡',
      description: 'Кулон заңы және электр өрісі',
      isBookmarked: true,
      progress: 30
    },
    {
      id: 4,
      title: 'Магнит өрісі',
      subject: 'Магнетизм',
      type: 'video',
      duration: '40 мин',
      views: 1100,
      rating: 4.7,
      thumbnail: '🧲',
      description: 'Магнит өрісінің қасиеттері',
      isBookmarked: false,
      progress: 0
    },
    {
      id: 5,
      title: 'Геометриялық оптика',
      subject: 'Оптика',
      type: 'text',
      duration: '35 мин',
      views: 890,
      rating: 4.5,
      thumbnail: '🔍',
      description: 'Жарық сәулелерінің таралуы',
      isBookmarked: true,
      progress: 50
    },
    {
      id: 6,
      title: 'Атом құрылысы',
      subject: 'Атомная физика',
      type: 'interactive',
      duration: '50 мин',
      views: 1350,
      rating: 4.8,
      thumbnail: '⚛️',
      description: 'Атом моделдері және электрондар',
      isBookmarked: false,
      progress: 25
    },
    {
      id: 7,
      title: 'Толқындар мен тербелістер',
      subject: 'Механика',
      type: 'video',
      duration: '55 мин',
      views: 920,
      rating: 4.7,
      thumbnail: '〰️',
      description: 'Механикалық толқындар және резонанс',
      isBookmarked: true,
      progress: 60
    },
    {
      id: 8,
      title: 'Ядролық физика',
      subject: 'Атомная физика',
      type: 'text',
      duration: '42 мин',
      views: 680,
      rating: 4.6,
      thumbnail: '☢️',
      description: 'Радиоактивтілік және ядролық реакциялар',
      isBookmarked: false,
      progress: 15
    }
  ];

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || material.type === selectedCategory;
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleBookmark = (id) => {
    // В реальном приложении здесь будет API вызов
    console.log('Toggle bookmark for material:', id);
  };

  return (
    <div className="materials-container">
      <div className="materials-header">
        <h1>Физика материалдары</h1>
        <p>Физика бойынша видео дәрістер және оқу материалдары</p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Материалдарды іздеу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="categories-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="materials-grid">
        {filteredMaterials.map(material => (
          <div key={material.id} className="material-card">
            <div className="material-thumbnail">
              <div className="thumbnail-icon">{material.thumbnail}</div>
              <div className="material-type">{material.type === 'video' ? '🎥' : material.type === 'text' ? '📄' : '🎮'}</div>
              <button 
                className={`bookmark-btn ${material.isBookmarked ? 'bookmarked' : ''}`}
                onClick={() => toggleBookmark(material.id)}
              >
                {material.isBookmarked ? '❤️' : '🤍'}
              </button>
            </div>
            
            <div className="material-content">
              <div className="material-subject">{material.subject}</div>
              <h3 className="material-title">{material.title}</h3>
              <p className="material-description">{material.description}</p>
              
              <div className="material-stats">
                <span className="duration">⏱️ {material.duration}</span>
                <span className="views">👁️ {material.views}</span>
                <span className="rating">⭐ {material.rating}</span>
              </div>

              {material.progress > 0 && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${material.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{material.progress}%</span>
                </div>
              )}

              <button className="start-btn">
                {material.progress === 0 ? 'Бастау' : 
                 material.progress === 100 ? 'Қайта көру' : 'Жалғастыру'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">📭</div>
          <h3>Материалдар табылмады</h3>
          <p>Іздеу шарттарын өзгертіп көріңіз</p>
        </div>
      )}
    </div>
  );
};

export default Materials;
