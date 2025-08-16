import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import apiClient from '../services/apiClient';
import MaterialViewer from '../components/MaterialViewer';

const MaterialsPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const categories = [
    { id: 'all', name: 'Все разделы', icon: '📚' },
    { id: 'mechanics', name: 'Механика', icon: '⚙️' },
    { id: 'thermodynamics', name: 'Термодинамика', icon: '🌡️' },
    { id: 'electricity', name: 'Электричество', icon: '⚡' },
    { id: 'magnetism', name: 'Магнетизм', icon: '🧲' },
    { id: 'optics', name: 'Оптика', icon: '🔍' },
    { id: 'atomic', name: 'Атомная физика', icon: '⚛️' }
  ];

  const getTypeIcon = (type) => {
    const typeIcons = {
      'text': '📄',
      'video': '🎥',
      'pdf': '📋',
      'interactive': '🎮'
    };
    return typeIcons[type] || '📄';
  };

  useEffect(() => {
    loadMaterials();
    loadBookmarks();
  }, [selectedCategory]);

  // WebSocket event handlers for real-time updates
  useEffect(() => {
    if (socket) {
      console.log('🔌 Setting up WebSocket listeners for global materials...');
      
      // Listen for new materials from global teacher
      socket.on('new_material', (data) => {
        console.log('📡 Received new global material via WebSocket:', data);
        const newMaterialData = data.material || data;
        
        // Only add if it's published and from global teacher
        if (newMaterialData.status === 'published' || newMaterialData.isPublished) {
          setMaterials(prevMaterials => [newMaterialData, ...prevMaterials]);
          
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Новый материал: ${newMaterialData.title}`, {
              body: 'Материал добавлен учителем',
              icon: '/favicon.ico'
            });
          }
        }
      });

      // Listen for material updates from global teacher
      socket.on('material_updated', (data) => {
        console.log('📡 Received global material update via WebSocket:', data);
        setMaterials(prevMaterials => {
          return prevMaterials.map(material => 
            material.id === data.material.id ? { ...material, ...data.material } : material
          );
        });
      });

      // Listen for material deletions
      socket.on('material_deleted', (data) => {
        console.log('📡 Received material deletion via WebSocket:', data);
        setMaterials(prevMaterials => 
          prevMaterials.filter(material => material.id !== data.materialId)
        );
      });

      return () => {
        socket.off('new_material');
        socket.off('material_updated');
        socket.off('material_deleted');
      };
    }
  }, [socket]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading ALL published materials for student (no limits)...');
      
      // Get user data from localStorage and AuthContext
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      console.log('👤 User data for materials:', userData);
      
      let materialsData = [];
      
      // Try multiple sources to get ALL materials created by admins/teachers
      try {
        console.log('🔗 Loading ALL global materials from teachers/admins...');
        
        // 1. Get materials from API (all published materials)
        console.log('📚 Loading published materials from database, category:', selectedCategory);
        
        const response = await apiClient.getMaterialsForStudent();
        console.log('📚 API materials response:', response);
        
        let apiMaterials = [];
        if (Array.isArray(response)) {
          apiMaterials = response;
        } else if (response && Array.isArray(response.materials)) {
          apiMaterials = response.materials;
        }
        
        // Merge API materials with existing, avoiding duplicates
        apiMaterials.forEach(apiMaterial => {
          const exists = materialsData.find(m => m.id === apiMaterial.id);
          if (!exists) {
            materialsData.push(apiMaterial);
          }
        });
        
        console.log('📊 Total materials loaded from all sources:', materialsData.length);
      } catch (error) {
        console.error('❌ Error loading materials:', error);
      }
      
      // Get user data from localStorage and AuthContext
      const userId = userData.telegram_id || userData.id || user?.telegram_id || user?.id;
      
      console.log('🆔 Using user ID for materials:', userId);
      
      // Load published materials for student (only published materials)
      const category = selectedCategory === 'all' ? null : selectedCategory;
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 10000)
      );
      
      const materialsPromise = apiClient.getMaterialsForStudent(userId, category);
      const publishedMaterials = await Promise.race([materialsPromise, timeoutPromise]);
      
      console.log('✅ Published materials loaded:', publishedMaterials);
      
      // Transform API data to our format if we have data from old API
      if (publishedMaterials && publishedMaterials.length > 0 && !materialsData.length) {
        materialsData = publishedMaterials.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type, // text, video, pdf, interactive
        category: item.category,
        duration: `${item.duration} мин`,
        difficulty: item.difficulty,
        thumbnail: getTypeIcon(item.type),
        url: item.videoUrl || item.pdfUrl || '#',
        content: item.content,
        tags: item.tags || [],
        views: item.views || 0,
        rating: item.rating || '0.0',
        isBookmarked: bookmarks.includes(item.id),
        teacherId: item.teacherId
      }));
      }
      
      setMaterials(materialsData);
      console.log(`🎯 Loaded ${materialsData.length} published materials`);
    } catch (error) {
      console.error('❌ Error loading materials:', error);
      
      // No fallback materials - show empty state
      setMaterials([]);
      console.log('📚 No materials available');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      // Load user bookmarks from API
      const userBookmarks = await apiClient.getUserBookmarks(user?.telegram_id);
      setBookmarks(userBookmarks || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([2]); // Mock bookmarked material
    }
  };

  const toggleBookmark = async (materialId) => {
    try {
      const isCurrentlyBookmarked = bookmarks.includes(materialId);
      
      if (isCurrentlyBookmarked) {
        await apiClient.removeBookmark(user?.telegram_id, materialId);
        setBookmarks(prev => prev.filter(id => id !== materialId));
      } else {
        await apiClient.addBookmark(user?.telegram_id, materialId);
        setBookmarks(prev => [...prev, materialId]);
      }
      
      // Update materials state
      setMaterials(prev => prev.map(material => 
        material.id === materialId 
          ? { ...material, isBookmarked: !isCurrentlyBookmarked }
          : material
      ));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;    
  });

  const openMaterial = (material) => {
    // Navigate to material page instead of opening modal
    if (window.navigateTo) {
      window.navigateTo('material', { materialId: material.id });
    } else {
      console.error('Navigation function not available');
    }
  };

  const closeMaterial = () => {
    setSelectedMaterial(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#f87171';
      default: return '#6b7280';
    }
  };



  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white',
      padding: '20px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 10px 0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.8)',
      margin: '0'
    },
    controls: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      marginBottom: '30px',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    searchBox: {
      flex: '1',
      minWidth: '250px',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      backdropFilter: 'blur(10px)'
    },
    categories: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '20px'
    },
    categoryBtn: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    activeCategoryBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontWeight: '600'
    },
    viewControls: {
      display: 'flex',
      gap: '8px'
    },
    viewBtn: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    activeViewBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white'
    },
    materialsGrid: {
      display: 'grid',
      gridTemplateColumns: viewMode === 'grid' 
        ? 'repeat(auto-fill, minmax(300px, 1fr))' 
        : '1fr',
      gap: '20px'
    },
    materialCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: viewMode === 'list' ? 'flex' : 'block',
      alignItems: viewMode === 'list' ? 'center' : 'stretch',
      gap: viewMode === 'list' ? '20px' : '0'
    },
    materialThumbnail: {
      fontSize: '48px',
      textAlign: 'center',
      marginBottom: viewMode === 'list' ? '0' : '16px',
      minWidth: viewMode === 'list' ? '60px' : 'auto'
    },
    materialContent: {
      flex: viewMode === 'list' ? '1' : 'none'
    },
    materialTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '8px',
      color: 'white'
    },
    materialDescription: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '12px',
      lineHeight: '1.4'
    },
    materialMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '12px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    difficultyBadge: {
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    materialActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    bookmarkBtn: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    },
    startBtn: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      fontSize: '18px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'rgba(255, 255, 255, 0.7)'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loading}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚛️</div>
            <div>Загрузка материалов...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📚 Учебные материалы</h1>
        <p style={pageStyles.subtitle}>Изучайте физику с интерактивными материалами</p>
      </div>

      {/* Controls */}
      <div style={pageStyles.controls}>
        <input
          type="text"
          placeholder="🔍 Поиск материалов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={pageStyles.searchBox}
        />
        
        <div style={pageStyles.viewControls}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              ...pageStyles.viewBtn,
              ...(viewMode === 'grid' ? pageStyles.activeViewBtn : {})
            }}
          >
            ⊞
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...pageStyles.viewBtn,
              ...(viewMode === 'list' ? pageStyles.activeViewBtn : {})
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Categories */}
      <div style={pageStyles.categories}>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              ...pageStyles.categoryBtn,
              ...(selectedCategory === category.id ? pageStyles.activeCategoryBtn : {})
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div style={pageStyles.materialsGrid}>
          {filteredMaterials.map(material => (
            <div
              key={material.id}
              style={pageStyles.materialCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={pageStyles.materialThumbnail}>
                {getTypeIcon(material.type)}
              </div>
              
              <div style={pageStyles.materialContent}>
                <h3 style={pageStyles.materialTitle}>{material.title}</h3>
                <p style={pageStyles.materialDescription}>{material.description}</p>
                
                <div style={pageStyles.materialMeta}>
                  <div style={pageStyles.metaItem}>
                    <span>⏱️</span>
                    <span>{material.duration}</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span>👁️</span>
                    <span>{material.views}</span>
                  </div>
                  <div style={pageStyles.metaItem}>
                    <span>⭐</span>
                    <span>{material.rating}</span>
                  </div>
                  <div 
                    style={{
                      ...pageStyles.difficultyBadge,
                      backgroundColor: getDifficultyColor(material.difficulty),
                      color: 'white'
                    }}
                  >
                    {material.difficulty}
                  </div>
                </div>

                <div style={pageStyles.materialActions}>
                  <button
                    onClick={() => toggleBookmark(material.id)}
                    style={pageStyles.bookmarkBtn}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    {material.isBookmarked ? '🔖' : '🏷️'}
                  </button>
                  
                  <button
                    onClick={() => openMaterial(material)}
                    style={pageStyles.startBtn}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    Открыть материал
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={pageStyles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3>Материалы не найдены</h3>
          <p>Попробуйте изменить критерии поиска</p>
        </div>
      )}

    </div>
  );
};

export default MaterialsPage;
