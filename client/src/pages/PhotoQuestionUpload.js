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
      
      console.log('📋 Full response from backend:', response);
      
      if (response.questions && Array.isArray(response.questions)) {
        // Handle multiple questions from AI
        console.log('✅ Multiple questions processed:', response.questions);
        setUploadedQuestions(prev => [...response.questions, ...prev]);
        
        // Notify parent component with all questions
        if (onQuestionCreated) {
          onQuestionCreated({ questions: response.questions });
        }
      } else if (response.virtual_question) {
        // Handle single question fallback
        setProcessedQuestion(response.virtual_question);
        console.log('✅ Single question processed:', response.virtual_question);
        
        setUploadedQuestions(prev => [response.virtual_question, ...prev]);
        
        if (onQuestionCreated) {
          onQuestionCreated({ virtual_question: response.virtual_question });
        }
      } else {
        console.log('⚠️ No questions in response:', response);
        alert('Не удалось извлечь вопросы из изображения. Попробуйте другое фото.');
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
          <h3>🤖 Виртуальная задача создана!</h3>
          <div className="question-card">
            {processedQuestion.original_photo && (
              <div className="original-photo-display">
                <h4>📸 Загруженное изображение:</h4>
                <img 
                  src={processedQuestion.original_photo} 
                  alt="Загруженная задача" 
                  className="uploaded-image-display"
                />
              </div>
            )}
            <div className="question-header">
              <span className="topic-badge">{processedQuestion.topic}</span>
              <span className="difficulty-badge">{processedQuestion.difficulty}</span>
            </div>
            <p className="question-text">{processedQuestion.text}</p>
            {processedQuestion.formula && (
              <div className="formula-box">
                <code>{processedQuestion.formula}</code>
              </div>
            )}
            <div className="options-list">
              {processedQuestion.options?.map((option, index) => (
                <div key={index} className="option-item">
                  {String.fromCharCode(65 + index)}. {option}
                </div>
              ))}
            </div>
            <div className="answer-section">
              <strong>Правильный ответ: {processedQuestion.correct_answer}</strong>
              {processedQuestion.explanation && (
                <p className="explanation">{processedQuestion.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="processed-actions">
        <button onClick={clearSelection} className="new-photo-btn">
          📸 Загрузить новое фото
        </button>
      </div>

      {uploadedQuestions.length > 0 && (
        <div className="uploaded-questions">
          <h3>📚 Созданные виртуальные задачи ({uploadedQuestions.length})</h3>
          <div className="questions-grid">
            {uploadedQuestions.slice(0, 6).map((question, index) => (
              <div key={question.id} className="question-card">
                {question.original_photo && (
                  <div className="original-photo-display">
                    <img 
                      src={question.original_photo} 
                      alt="Загруженная задача" 
                      className="uploaded-image-display"
                    />
                  </div>
                )}
                <div className="card-header">
                  <span className="card-topic">{question.topic}</span>
                  <span className="card-difficulty">{question.difficulty}</span>
                </div>
                <p className="card-text">
                  {question.text?.substring(0, 100)}...
                </p>
                <div className="card-footer">
                  <span className="created-badge">✅ Создано из фото</span>
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
