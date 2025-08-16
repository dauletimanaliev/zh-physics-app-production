import React, { useState, useEffect } from 'react';
import './MaterialPage.css';

const MaterialPage = ({ materialId, navigateTo }) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (materialId) {
      fetchMaterial();
    }
  }, [materialId]);

  useEffect(() => {
    if (material) {
      parseAttachments();
    }
  }, [material]);

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://web-production-2678c.up.railway.app/api'
          : 'http://localhost:8000/api');
      
      // Get user ID for view tracking
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.telegram_id || userData.id;
      
      // Build URL with user_id parameter for view tracking
      const url = userId 
        ? `${apiUrl}/materials/${materialId}?user_id=${userId}`
        : `${apiUrl}/materials/${materialId}`;
      
      console.log('📖 Fetching material with view tracking:', url);
      
      // Try to get specific material first
      let response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Material data loaded:', data);
        
        // Check if we got a direct material object
        if (data.id) {
          // Direct material object from /api/materials/{id}
          setMaterial(data);
          console.log('👁️ Material view tracked for user:', userId);
          return;
        }
        
        // If direct API returns empty or wrong format, try getting all materials
        console.log('Direct API did not return material, trying to get all materials...');
      } else {
        console.log('Direct API failed with status:', response.status);
      }
      
      // Fallback: get all materials and find the one we need
      console.log('Fetching all materials to find the requested one...');
      response = await fetch(`${apiUrl}/materials`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const allData = await response.json();
      const materials = allData.materials || [];
      console.log('All materials:', materials.map(m => ({id: m.id, title: m.title})));
      console.log('Looking for materialId:', materialId, 'type:', typeof materialId);
      
      const foundMaterial = materials.find(m => {
        console.log('Checking material:', m.id, 'type:', typeof m.id, 'matches:', m.id == materialId);
        return m.id == materialId;
      });
      
      console.log('Found material:', foundMaterial);
      if (!foundMaterial) {
        console.log('Available materials:', materials.map(m => `ID: ${m.id}, Title: ${m.title}`));
        // If material not found but others exist, redirect to first available
        if (materials.length > 0) {
          console.log('Redirecting to first available material:', materials[0].id);
          window.history.replaceState(null, '', `?material=${materials[0].id}`);
          setMaterial(materials[0]);
          return;
        }
        // If no materials exist at all, show error message
        console.log('No materials found in database');
        setError('В базе данных нет материалов');
        setLoading(false);
        return;
      }
      
      setMaterial(foundMaterial);
    } catch (error) {
      console.error('Error fetching material:', error);
      setError('Ошибка загрузки материала: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const parseAttachments = () => {
    if (!material) return;
    
    try {
      let parsedAttachments = [];
      
      if (typeof material.attachments === 'string') {
        parsedAttachments = JSON.parse(material.attachments);
      } else if (Array.isArray(material.attachments)) {
        parsedAttachments = material.attachments;
      }
      
      const validAttachments = parsedAttachments.filter(attachment => 
        attachment && attachment.name && attachment.type
      );
      
      console.log('Parsed attachments:', validAttachments);
      setAttachments(validAttachments);
    } catch (error) {
      console.error('Error parsing attachments:', error);
      setAttachments([]);
    }
  };

  const renderAttachment = (attachment, index) => {
    const { name, type, data } = attachment;
    
    if (type.startsWith('image/')) {
      return (
        <div key={index} className="attachment-item image-attachment">
          <h4>{name}</h4>
          <div className="image-container">
            <img 
              src={data} 
              alt={name}
              className="attachment-image"
              onError={(e) => {
                console.error('Image load error:', e);
                e.target.style.display = 'none';
              }}
            />
          </div>
          <button 
            onClick={() => downloadAttachment(attachment)}
            className="download-btn"
          >
            📥 Скачать
          </button>
        </div>
      );
    }
    
    if (type.startsWith('video/')) {
      return (
        <div key={index} className="attachment-item video-attachment">
          <h4>{name}</h4>
          <video 
            controls 
            className="attachment-video"
            onError={(e) => console.error('Video load error:', e)}
          >
            <source src={data} type={type} />
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
          <button 
            onClick={() => downloadAttachment(attachment)}
            className="download-btn"
          >
            📥 Скачать
          </button>
        </div>
      );
    }
    
    if (type === 'application/pdf') {
      return (
        <div key={index} className="attachment-item pdf-attachment">
          <div className="pdf-header">
            <span className="pdf-icon">📄</span>
            <h4>📋 {name}</h4>
            <span className="pdf-badge">PDF</span>
          </div>
          <div className="pdf-container">
            <iframe 
              src={data}
              className="attachment-pdf"
              title={name}
            />
          </div>
          <button 
            onClick={() => downloadAttachment(attachment)}
            className="download-btn pdf-download"
          >
            📥 Скачать PDF
          </button>
        </div>
      );
    }
    
    return (
      <div key={index} className="attachment-item file-attachment">
        <div className="file-info">
          <span className="file-icon">📄</span>
          <div className="file-details">
            <div className="file-name">{name}</div>
            <div className="file-type">{type}</div>
          </div>
        </div>
        <button 
          onClick={() => downloadAttachment(attachment)}
          className="download-btn"
        >
          📥 Скачать
        </button>
      </div>
    );
  };

  const downloadAttachment = (attachment) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Ошибка при скачивании файла');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  if (loading) {
    return (
      <div className="material-page loading">
        <div className="loading-spinner"></div>
        <p>Загрузка материала...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="material-page error">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => navigateTo('materials')} className="back-btn">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="material-page error">
        <div className="error-message">
          <h2>Материал не найден</h2>
          <button onClick={() => navigateTo('materials')} className="back-btn">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="material-page">
      <div className="material-header">
        <button onClick={() => navigateTo('materials')} className="back-btn">
          ← Назад
        </button>
        
        <div className="material-title-section">
          <h1 className="material-title">{material.title}</h1>
          
          <div className="material-meta">
            <span className="category-badge">
              📚 {material.category}
            </span>
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(material.difficulty) }}
            >
              📊 {material.difficulty}
            </span>
            <span className="duration-badge">
              ⏱️ {formatDuration(material.duration)}
            </span>
            <span className="views-badge">
              👁️ {material.views_count} просмотров
            </span>
          </div>

          {material.description && (
            <p className="material-description">{material.description}</p>
          )}

          {material.tags && material.tags.length > 0 && (
            <div className="material-tags">
              {material.tags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          )}

          <div className="teacher-info">
            <span>👨‍🏫 {material.teacher_name || 'Учитель'}</span>
          </div>
        </div>
      </div>

      <div className="material-content">
        {material.content && (
          <div className="main-content">
            <h2>Содержание</h2>
            <div 
              className="content-text"
              dangerouslySetInnerHTML={{ __html: material.content.replace(/\n/g, '<br>') }}
            />
          </div>
        )}

        {material.videoUrl && (
          <div className="video-section">
            <h2>Видео</h2>
            <div className="video-container">
              <iframe
                src={material.videoUrl}
                title="Material Video"
                allowFullScreen
                className="material-video"
              />
            </div>
          </div>
        )}

        {material.pdfUrl && (
          <div className="pdf-section">
            <h2>PDF Материал</h2>
            <div className="pdf-container">
              <iframe
                src={material.pdfUrl}
                title="Material PDF"
                className="material-pdf"
              />
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="attachments-section">
            <h2>Прикрепленные файлы ({attachments.length})</h2>
            <div className="attachments-grid">
              {attachments.map((attachment, index) => renderAttachment(attachment, index))}
            </div>
          </div>
        )}

        {!material.content && !material.videoUrl && !material.pdfUrl && attachments.length === 0 && (
          <div className="no-content">
            <p>Содержимое материала пока не добавлено</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialPage;
