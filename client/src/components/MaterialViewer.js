import React, { useState, useEffect } from 'react';

const MaterialViewer = ({ material, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    // Валидация входных данных
    if (!material) {
      console.log('⚠️ No material provided');
      setAttachments([]);
      return;
    }

    try {
      // Проверяем наличие attachments
      if (!material.attachments) {
        console.log('⚠️ No attachments field in material');
        // Создаем демо-вложения для тестирования
        const demoAttachments = [
          {
            name: 'demo_image.png',
            type: 'image/png',
            size: 95,
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            uploaded_at: new Date().toISOString()
          },
          {
            name: 'demo_document.pdf',
            type: 'application/pdf',
            size: 1024,
            data: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago=',
            uploaded_at: new Date().toISOString()
          }
        ];
        console.log('🎯 Using demo attachments for testing:', demoAttachments);
        setAttachments(demoAttachments);
        return;
      }

      // Парсинг attachments с валидацией
      let parsedAttachments;
      if (typeof material.attachments === 'string') {
        try {
          parsedAttachments = JSON.parse(material.attachments);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.log('Raw data:', material.attachments);
          setAttachments([]);
          return;
        }
      } else {
        parsedAttachments = material.attachments;
      }

      // Валидация массива
      if (!Array.isArray(parsedAttachments)) {
        console.error('❌ Attachments is not an array:', typeof parsedAttachments);
        setAttachments([]);
        return;
      }

      // Валидация каждого вложения
      const validAttachments = parsedAttachments.filter(attachment => {
        if (!attachment || typeof attachment !== 'object') {
          console.warn('⚠️ Invalid attachment object:', attachment);
          return false;
        }
        if (!attachment.name || !attachment.type) {
          console.warn('⚠️ Attachment missing name or type:', attachment);
          return false;
        }
        return true;
      });

      console.log('📎 Valid attachments found:', validAttachments.length);
      console.log('📋 Attachments data:', validAttachments);
      setAttachments(validAttachments);

    } catch (error) {
      console.error('❌ Critical error in attachments processing:', error);
      console.error('Error stack:', error.stack);
      console.log('Material data:', material);
      setAttachments([]);
    }
  }, [material]);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'txt': '📄',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp4': '🎥',
      'avi': '🎥',
      'mov': '🎥',
      'mp3': '🎵',
      'wav': '🎵',
      'zip': '📦',
      'rar': '📦',
      'ppt': '📊',
      'pptx': '📊',
      'xls': '📊',
      'xlsx': '📊'
    };
    return iconMap[extension] || '📎';
  };

  const handleFileDownload = (attachment) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    } else if (attachment.data) {
      // Handle base64 data
      let dataUrl = attachment.data;
      
      // Add proper data URL prefix if missing
      if (!dataUrl.startsWith('data:')) {
        const extension = attachment.name.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
        const isPdf = extension === 'pdf';
        const isVideo = ['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension);
        
        if (isImage) {
          dataUrl = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${dataUrl}`;
        } else if (isPdf) {
          dataUrl = `data:application/pdf;base64,${dataUrl}`;
        } else if (isVideo) {
          dataUrl = `data:video/${extension};base64,${dataUrl}`;
        } else {
          dataUrl = `data:application/octet-stream;base64,${dataUrl}`;
        }
      }
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFilePreview = (attachment) => {
    try {
      // Валидация входных данных
      if (!attachment) {
        console.warn('⚠️ No attachment provided to renderFilePreview');
        return null;
      }

      if (!attachment.name) {
        console.warn('⚠️ Attachment has no name:', attachment);
        return null;
      }
      
      const extension = attachment.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
      const isPdf = extension === 'pdf';
      const isVideo = ['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension);
      
      console.log(`🔍 Processing file: ${attachment.name}, type: ${extension}, isImage: ${isImage}, isPdf: ${isPdf}`);
      
      // Безопасное получение URL
      let srcUrl = null;
      try {
        srcUrl = attachment.url;
        if (!srcUrl && attachment.data) {
          // Валидация data поля
          if (typeof attachment.data !== 'string') {
            console.error('❌ Attachment data is not a string:', typeof attachment.data);
            return null;
          }

          // Проверяем формат data URL
          if (!attachment.data.startsWith('data:')) {
            if (isImage) {
              srcUrl = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${attachment.data}`;
            } else if (isPdf) {
              srcUrl = `data:application/pdf;base64,${attachment.data}`;
            } else if (isVideo) {
              srcUrl = `data:video/${extension};base64,${attachment.data}`;
            } else {
              srcUrl = attachment.data;
            }
          } else {
            srcUrl = attachment.data;
          }
        }
      } catch (urlError) {
        console.error('❌ Error processing attachment URL:', urlError);
        return null;
      }

      if (!srcUrl) {
        console.warn('⚠️ No valid URL found for attachment:', attachment.name);
        return null;
      }

      console.log(`✅ Generated URL for ${attachment.name}: ${srcUrl.substring(0, 50)}...`);
      
      // Рендеринг изображений с защитой от ошибок
      if (isImage) {
        return (
          <div style={styles.imagePreview} key={attachment.name}>
            <img 
              src={srcUrl} 
              alt={attachment.name}
              style={styles.previewImage}
              onError={(e) => {
                console.error('❌ Image load error:', attachment.name, e);
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff6b6b;">❌ Не удалось загрузить изображение: ${attachment.name}</div>`;
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', attachment.name);
              }}
            />
          </div>
        );
      }
      
      // Рендеринг видео с защитой от ошибок
      if (isVideo) {
        return (
          <div style={styles.videoPreview} key={attachment.name}>
            <video 
              src={srcUrl}
              controls
              style={styles.previewVideo}
              onError={(e) => {
                console.error('❌ Video load error:', attachment.name, e);
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff6b6b;">❌ Не удалось загрузить видео: ${attachment.name}</div>`;
              }}
            >
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          </div>
        );
      }
      
      // Рендеринг PDF с защитой от ошибок
      if (isPdf) {
        return (
          <div style={styles.pdfPreview} key={attachment.name}>
            <iframe
              src={srcUrl}
              style={styles.pdfFrame}
              title={attachment.name}
              onError={(e) => {
                console.error('❌ PDF load error:', attachment.name, e);
              }}
            />
          </div>
        );
      }
      
      return null;

    } catch (error) {
      console.error('❌ Critical error in renderFilePreview:', error);
      console.error('Error stack:', error.stack);
      console.log('Attachment data:', attachment);
      return (
        <div style={{padding: '20px', textAlign: 'center', color: '#ff6b6b'}}>
          ❌ Ошибка отображения файла: {attachment?.name || 'Unknown'}
        </div>
      );
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    },
    header: {
      padding: '20px 30px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'white',
      margin: 0
    },
    closeBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      color: 'white',
      fontSize: '20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    content: {
      padding: '30px',
      maxHeight: 'calc(90vh - 140px)',
      overflowY: 'auto',
      color: 'white'
    },
    materialInfo: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      marginBottom: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    description: {
      fontSize: '16px',
      lineHeight: '1.6',
      marginBottom: '30px',
      color: 'rgba(255, 255, 255, 0.9)'
    },
    materialContent: {
      fontSize: '16px',
      lineHeight: '1.8',
      marginBottom: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    attachmentsSection: {
      marginTop: '30px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '15px',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    attachmentsList: {
      display: 'grid',
      gap: '15px'
    },
    attachmentItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '15px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    attachmentIcon: {
      fontSize: '24px',
      minWidth: '30px'
    },
    attachmentInfo: {
      flex: 1
    },
    attachmentName: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      marginBottom: '4px'
    },
    attachmentSize: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    downloadBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 12px',
      color: 'white',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    imagePreview: {
      marginTop: '15px',
      textAlign: 'center'
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    },
    pdfPreview: {
      marginTop: '15px',
      height: '400px',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    pdfFrame: {
      width: '100%',
      height: '100%',
      border: 'none',
      borderRadius: '8px'
    },
    videoPreview: {
      marginTop: '15px',
      textAlign: 'center'
    },
    previewVideo: {
      maxWidth: '100%',
      maxHeight: '400px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    },
    noContent: {
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.6)',
      fontStyle: 'italic',
      padding: '40px'
    }
  };

  if (!material) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{material.title}</h2>
          <button 
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Material Info */}
          <div style={styles.materialInfo}>
            <div style={styles.infoItem}>
              <span>📂</span>
              <span>{material.category || 'Общее'}</span>
            </div>
            <div style={styles.infoItem}>
              <span>⏱️</span>
              <span>{material.duration || 'Не указано'}</span>
            </div>
            <div style={styles.infoItem}>
              <span>📊</span>
              <span>{material.difficulty || 'Средний'}</span>
            </div>
            <div style={styles.infoItem}>
              <span>👁️</span>
              <span>{material.views || 0} просмотров</span>
            </div>
          </div>

          {/* Description */}
          {material.description && (
            <div style={styles.description}>
              {material.description}
            </div>
          )}

          {/* Main Content */}
          <div style={styles.materialContent}>
            {material.content ? (
              <div dangerouslySetInnerHTML={{ __html: material.content }} />
            ) : (
              <div style={styles.noContent}>
                Содержимое материала не загружено
              </div>
            )}
          </div>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div style={styles.attachmentsSection}>
              <h3 style={styles.sectionTitle}>
                <span>📎</span>
                Прикрепленные файлы
              </h3>
              <div style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <div key={index}>
                    <div 
                      style={styles.attachmentItem}
                      onClick={() => handleFileDownload(attachment)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <div style={styles.attachmentIcon}>
                        {getFileIcon(attachment.name)}
                      </div>
                      <div style={styles.attachmentInfo}>
                        <div style={styles.attachmentName}>{attachment.name}</div>
                        <div style={styles.attachmentSize}>
                          {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Размер неизвестен'}
                        </div>
                      </div>
                      <button 
                        style={styles.downloadBtn}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        Скачать
                      </button>
                    </div>
                    {renderFilePreview(attachment)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialViewer;
