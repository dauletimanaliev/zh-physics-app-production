import React, { useState, useRef } from 'react';

const FileUploader = ({ onFilesSelected, maxFiles = 5, maxSize = 10 * 1024 * 1024 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const acceptedTypes = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg,.jpeg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'video/mp4': '.mp4',
    'video/avi': '.avi',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar'
  };

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `Файл "${file.name}" слишком большой. Максимальный размер: ${formatFileSize(maxSize)}`;
    }
    
    if (!Object.keys(acceptedTypes).includes(file.type)) {
      return `Файл "${file.name}" имеет неподдерживаемый формат`;
    }
    
    return null;
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const errors = [];
    const validFiles = [];

    if (selectedFiles.length + fileArray.length > maxFiles) {
      errors.push(`Можно загрузить максимум ${maxFiles} файлов`);
      return;
    }

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const styles = {
    container: {
      width: '100%',
      marginBottom: '20px'
    },
    dropZone: {
      border: `3px dashed ${dragActive ? '#4ade80' : '#8b5cf6'}`,
      borderRadius: '12px',
      padding: '30px 20px',
      textAlign: 'center',
      background: dragActive ? 'rgba(74, 222, 128, 0.15)' : 'rgba(139, 92, 246, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '20px',
      minHeight: '140px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
    },
    dropZoneContent: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '16px',
      fontWeight: '500'
    },
    dropZoneIcon: {
      fontSize: '40px',
      marginBottom: '12px',
      color: '#8b5cf6'
    },
    dropZoneText: {
      marginBottom: '8px',
      fontWeight: '600'
    },
    dropZoneSubtext: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    uploadBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '16px',
      transition: 'all 0.3s ease'
    },
    hiddenInput: {
      display: 'none'
    },
    filesList: {
      display: 'grid',
      gap: '12px'
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    fileIcon: {
      fontSize: '24px',
      minWidth: '30px'
    },
    fileInfo: {
      flex: 1
    },
    fileName: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      marginBottom: '4px'
    },
    fileSize: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    filePreview: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      objectFit: 'cover'
    },
    removeBtn: {
      background: 'rgba(248, 113, 113, 0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      color: '#f87171',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    filesHeader: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'white',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.dropZone}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div style={styles.dropZoneContent}>
          <div style={styles.dropZoneIcon}>📎</div>
          <div style={styles.dropZoneText}>
            Перетащите файлы сюда или нажмите для выбора
          </div>
          <div style={styles.dropZoneSubtext}>
            Поддерживаемые форматы: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, MP4, MP3 и др.
          </div>
          <div style={styles.dropZoneSubtext}>
            Максимальный размер файла: {formatFileSize(maxSize)}
          </div>
          <button 
            type="button"
            style={styles.uploadBtn}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Выбрать файлы
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={Object.values(acceptedTypes).join(',')}
        onChange={handleChange}
        style={styles.hiddenInput}
      />

      {selectedFiles.length > 0 && (
        <div>
          <div style={styles.filesHeader}>
            <span>📁</span>
            Выбранные файлы ({selectedFiles.length}/{maxFiles})
          </div>
          <div style={styles.filesList}>
            {selectedFiles.map((fileData) => (
              <div key={fileData.id} style={styles.fileItem}>
                <div style={styles.fileIcon}>
                  {getFileIcon(fileData.file)}
                </div>
                {fileData.preview && (
                  <img 
                    src={fileData.preview} 
                    alt={fileData.name}
                    style={styles.filePreview}
                  />
                )}
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{fileData.name}</div>
                  <div style={styles.fileSize}>{formatFileSize(fileData.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileData.id);
                  }}
                  style={styles.removeBtn}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(248, 113, 113, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(248, 113, 113, 0.2)';
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
