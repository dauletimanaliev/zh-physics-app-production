import React, { useState, useRef } from 'react';
import apiClient from '../services/apiClient';
import './PhotoQuestionUpload.css';

const PhotoQuestionUpload = ({ onQuestionCreated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedQuestion, setProcessedQuestion] = useState(null);
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
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

  const uploadPhoto = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      console.log('📸 Uploading photo for AI processing...');
      
      const response = await apiClient.uploadQuestionPhoto(selectedFile);
      
      if (response.success) {
        setProcessedQuestion(response.virtual_question);
        console.log('✅ Photo processed successfully:', response.virtual_question);
        
        // Add to uploaded questions list
        setUploadedQuestions(prev => [response.virtual_question, ...prev]);
        
        // Notify parent component
        if (onQuestionCreated) {
          onQuestionCreated(response.virtual_question);
        }
      }
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      alert('Ошибка при обработке фото. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setProcessedQuestion(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadVirtualQuestions = async () => {
    try {
      const response = await apiClient.getVirtualQuestions();
      setUploadedQuestions(response.questions || []);
    } catch (error) {
      console.error('❌ Error loading virtual questions:', error);
    }
  };

  React.useEffect(() => {
    loadVirtualQuestions();
  }, []);

  return (
    <div className="photo-question-upload">
      <div className="upload-header">
        <h2>📸 Загрузить Фото Задачи</h2>
        <p>Сфотографируйте задачу по физике, и ИИ сделает её виртуальной с интерактивными ответами</p>
      </div>

      {!processedQuestion ? (
        <div className="upload-section">
          <div 
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="photo-preview" />
                <div className="preview-overlay">
                  <button onClick={clearSelection} className="clear-btn">
                    ✕ Удалить
                  </button>
                </div>
              </div>
            ) : (
              <div className="drop-zone-content">
                <div className="upload-icon">📷</div>
                <h3>Перетащите фото сюда или нажмите для выбора</h3>
                <p>Поддерживаются: JPG, PNG, WEBP</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {selectedFile && (
            <div className="upload-actions">
              <button 
                onClick={uploadPhoto} 
                disabled={isProcessing}
                className="process-btn"
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    🤖 ИИ обрабатывает фото...
                  </>
                ) : (
                  '🚀 Создать виртуальную задачу'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="processed-question">
          <div className="success-header">
            <div className="success-icon">✅</div>
            <h3>Фото успешно обработано ИИ!</h3>
            <p>Виртуальная задача создана и готова к решению</p>
          </div>

          <div className="virtual-question-preview">
            <div className="question-header">
              <span className="question-topic">{processedQuestion.topic}</span>
              <span className="question-difficulty">{processedQuestion.difficulty}</span>
            </div>
            
            <div className="question-text">
              <h4>{processedQuestion.text}</h4>
            </div>

            {processedQuestion.formula && (
              <div className="question-formula">
                <code>{processedQuestion.formula}</code>
              </div>
            )}

            <div className="question-options">
              {processedQuestion.options.map((option, index) => (
                <div key={index} className="option-preview">
                  {String.fromCharCode(65 + index)}. {option}
                </div>
              ))}
            </div>

            <div className="correct-answer">
              <strong>Правильный ответ:</strong> {processedQuestion.correct_answer}
            </div>

            <div className="explanation">
              <strong>Объяснение:</strong> {processedQuestion.explanation}
            </div>
          </div>

          <div className="processed-actions">
            <button onClick={clearSelection} className="new-photo-btn">
              📸 Загрузить новое фото
            </button>
          </div>
        </div>
      )}

      {uploadedQuestions.length > 0 && (
        <div className="uploaded-questions">
          <h3>📚 Созданные виртуальные задачи ({uploadedQuestions.length})</h3>
          <div className="questions-grid">
            {uploadedQuestions.slice(0, 6).map((question, index) => (
              <div key={question.id} className="question-card">
                <div className="card-header">
                  <span className="card-topic">{question.topic}</span>
                  <span className="card-difficulty">{question.difficulty}</span>
                </div>
                <div className="card-text">
                  {question.text.substring(0, 80)}...
                </div>
                <div className="card-footer">
                  <span className="created-badge">📸 Из фото</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoQuestionUpload;
