import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../services/apiClient';
import './SolutionChecker.css';

const SolutionChecker = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const analyzeSolution = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      console.log('🔍 Analyzing solution with AI...');
      
      const response = await apiClient.checkSolutionPhoto(selectedFile);
      
      if (response.success) {
        setAnalysis(response.analysis);
        console.log('✅ Solution analyzed successfully:', response.analysis);
        
        // Add to recent analyses
        setRecentAnalyses(prev => [response.analysis, ...prev.slice(0, 4)]);
        
        // Load updated analyses
        loadRecentAnalyses();
      }
    } catch (error) {
      console.error('❌ Error analyzing solution:', error);
      alert('Ошибка при анализе решения. Попробуйте еще раз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadRecentAnalyses = async () => {
    try {
      const response = await apiClient.getSolutionAnalyses();
      setRecentAnalyses(response.analyses || []);
    } catch (error) {
      console.error('❌ Error loading analyses:', error);
    }
  };

  useEffect(() => {
    loadRecentAnalyses();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 70) return '#FF9800';
    return '#F44336';
  };

  const getGradeEmoji = (grade) => {
    if (grade === 'Отлично') return '🎉';
    if (grade === 'Есть ошибки') return '⚠️';
    return '❌';
  };

  return (
    <div className="solution-checker">
      <div className="checker-header">
        <h2>🔍 ИИ Проверка Решений</h2>
        <p>Загрузите фото вашего решения физической задачи для анализа</p>
      </div>

      <div className="upload-section">
        {!selectedFile ? (
          <div 
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">📸</div>
              <h3>Загрузить фото решения</h3>
              <p>Перетащите файл сюда или нажмите для выбора</p>
              <p className="file-hint">Поддерживаются: JPG, PNG, HEIC</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="photo-preview" />
            <div className="preview-overlay">
              <button onClick={clearSelection} className="clear-btn">
                ✕ Очистить
              </button>
            </div>
            <div className="upload-actions">
              <button 
                onClick={analyzeSolution} 
                disabled={isAnalyzing}
                className="analyze-btn"
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner"></div>
                    Анализирую решение...
                  </>
                ) : (
                  '🤖 Проверить решение'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {analysis && (
        <div className="analysis-result">
          <div className="result-header">
            <h3>{getGradeEmoji(analysis.overall_grade)} Результат анализа</h3>
            <div className="score-badge" style={{ backgroundColor: getScoreColor(analysis.score) }}>
              {analysis.score}/100
            </div>
          </div>

          {analysis.original_photo && (
            <div className="original-solution">
              <h4>📝 Ваше решение:</h4>
              <img 
                src={analysis.original_photo} 
                alt="Проверенное решение" 
                className="solution-image"
              />
            </div>
          )}

          <div className="analysis-details">
            <div className="overall-feedback">
              <h4>📋 Общая оценка: {analysis.overall_grade}</h4>
              <p className="feedback-text">{analysis.feedback}</p>
              <div className="confidence">
                Уверенность ИИ: {Math.round(analysis.confidence * 100)}%
              </div>
            </div>

            <div className="detailed-check">
              <h4>🔍 Детальная проверка:</h4>
              <div className="check-items">
                {Object.entries(analysis.detailed_analysis).map(([key, value]) => (
                  <div key={key} className="check-item">
                    <span className="check-result">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="suggestions">
                <h4>💡 Рекомендации:</h4>
                <ul>
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ai-info">
              <small>Проверено: {analysis.ai_model}</small>
            </div>
          </div>
        </div>
      )}

      <div className="new-check-actions">
        <button onClick={clearSelection} className="new-check-btn">
          📸 Проверить новое решение
        </button>
      </div>

      {recentAnalyses.length > 0 && (
        <div className="recent-analyses">
          <h3>📚 Недавние проверки ({recentAnalyses.length})</h3>
          <div className="analyses-grid">
            {recentAnalyses.slice(0, 6).map((analysisItem, index) => (
              <div key={analysisItem.id} className="analysis-card">
                {analysisItem.original_photo && (
                  <div className="card-photo">
                    <img 
                      src={analysisItem.original_photo} 
                      alt="Проверенное решение" 
                      className="card-solution-image"
                    />
                  </div>
                )}
                <div className="card-content">
                  <div className="card-header">
                    <span className="card-grade">{analysisItem.overall_grade}</span>
                    <span 
                      className="card-score"
                      style={{ backgroundColor: getScoreColor(analysisItem.score) }}
                    >
                      {analysisItem.score}/100
                    </span>
                  </div>
                  <p className="card-feedback">
                    {analysisItem.feedback.substring(0, 80)}...
                  </p>
                  <div className="card-footer">
                    <span className="checked-badge">
                      {analysisItem.is_correct ? '✅ Правильно' : '❌ Есть ошибки'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SolutionChecker;
