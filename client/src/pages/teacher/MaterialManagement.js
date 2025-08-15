import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import apiClient from '../../services/apiClient';
import FileUploader from '../../components/FileUploader';
import MaterialViewer from '../../components/MaterialViewer';

const MaterialManagement = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);

  // Form state for creating/editing materials
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    content: '',
    type: 'text', // text, video, pdf, interactive
    category: 'mechanics',
    difficulty: 'easy',
    duration: 10, // minutes
    isPublished: false,
    tags: '',
    videoUrl: '',
    pdfUrl: '',
    thumbnailUrl: ''
  });
  const [attachedFiles, setAttachedFiles] = useState([]);

  const categories = [
    { id: 'all', name: 'Все разделы', icon: '📚', color: '#6b7280' },
    { id: 'mechanics', name: 'Механика', icon: '⚙️', color: '#3b82f6' },
    { id: 'thermodynamics', name: 'Термодинамика', icon: '🌡️', color: '#ef4444' },
    { id: 'electricity', name: 'Электричество', icon: '⚡', color: '#f59e0b' },
    { id: 'magnetism', name: 'Магнетизм', icon: '🧲', color: '#8b5cf6' },
    { id: 'optics', name: 'Оптика', icon: '🔍', color: '#10b981' },
    { id: 'atomic', name: 'Атомная физика', icon: '⚛️', color: '#06b6d4' }
  ];

  const materialTypes = [
    { id: 'text', name: 'Текстовый материал', icon: '📄' },
    { id: 'video', name: 'Видео урок', icon: '🎥' },
    { id: 'pdf', name: 'PDF документ', icon: '📋' },
    { id: 'interactive', name: 'Интерактивный урок', icon: '🎮' }
  ];

  const difficulties = [
    { id: 'easy', name: 'Легкий', color: '#10b981' },
    { id: 'medium', name: 'Средний', color: '#f59e0b' },
    { id: 'hard', name: 'Сложный', color: '#ef4444' }
  ];

  useEffect(() => {
    loadMaterials();
  }, [selectedCategory, searchQuery]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading teacher materials...');
      
      // Use real teacher telegram_id from backend
      const teacherId = '111333'; // Real teacher ID from backend sample data
      console.log('🔑 Loading materials for teacherId:', teacherId);
      
      // Load teacher's materials from API
      const response = await apiClient.getTeacherMaterials(teacherId);
      console.log('📚 Teacher materials response:', response);
      
      // Extract materials array from response (handle both array and object responses)
      const teacherMaterials = Array.isArray(response) ? response : (response?.materials || []);
      console.log('📊 Materials count:', teacherMaterials?.length);
      
      // Log each material's title for debugging
      if (teacherMaterials && teacherMaterials.length > 0) {
        teacherMaterials.forEach((material, index) => {
          console.log(`📄 Material ${index + 1}:`, {
            id: material.id,
            title: material.title,
            type: material.type,
            category: material.category,
            isPublished: material.isPublished
          });
        });
      } else {
        console.log('⚠️ No materials found or materials is null/undefined');
      }
      
      // Filter by category and search
      let filteredMaterials = teacherMaterials || [];
      
      if (selectedCategory !== 'all') {
        filteredMaterials = filteredMaterials.filter(m => m.category === selectedCategory);
      }
      
      if (searchQuery?.trim()) {
        filteredMaterials = filteredMaterials.filter(m => 
          (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      console.log('🎯 Final filtered materials:', filteredMaterials);
      filteredMaterials.forEach((material, index) => {
        console.log(`📄 Material ${index + 1}:`, {
          id: material.id,
          title: material.title,
          type: material.type,
          category: material.category,
          subject: material.subject,
          difficulty: material.difficulty,
          duration: material.duration,
          description: material.description,
          isPublished: material.isPublished
        });
      });
      setMaterials(filteredMaterials);
    } catch (error) {
      console.error('❌ Error loading materials:', error);
      // Fallback to empty array - no mock data
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async () => {
    console.log('🚀 Creating new material...');
    console.log('📝 Material form data:', materialForm);
    console.log('✏️ Editing material:', editingMaterial);
    console.log('🔍 Is editing mode?', !!editingMaterial);
    console.log('👤 Current user object:', user);
    console.log('🆔 User ID:', user?.id);
    
    try {
      console.log('👤 Current user data:', user);
      console.log('🔍 User ID fields:', {
        id: user?.id,
        user_id: user?.user_id,
        telegram_id: user?.telegram_id
      });
      
      // Use real teacher telegram_id from backend
      const teacherId = '111333'; // Real teacher ID from backend sample data
      console.log('🔑 TeacherId resolved to:', teacherId);
      
      // Process attached files
      const processedFiles = await Promise.all(
        attachedFiles.map(async (fileData) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: fileData.name,
                size: fileData.size,
                type: fileData.type,
                data: reader.result
              });
            };
            reader.readAsDataURL(fileData.file);
          });
        })
      );

      const materialData = {
        title: materialForm.title || '',
        description: materialForm.description || '',
        content: materialForm.content || '',
        type: materialForm.type || 'text',
        category: materialForm.category || 'mechanics',
        difficulty: materialForm.difficulty || 'easy',
        duration: materialForm.duration || 10,
        isPublished: materialForm.isPublished || false,
        teacherId: teacherId,
        tags: materialForm.tags || '',
        videoUrl: materialForm.videoUrl || null,
        pdfUrl: materialForm.pdfUrl || null,
        thumbnailUrl: materialForm.thumbnailUrl || null,
        attachments: processedFiles
      };
      
      console.log('📊 Sending material data to API:', materialData);
      console.log('✅ Required fields check:', {
        title: !!materialData.title,
        type: !!materialData.type, 
        category: !!materialData.category,
        teacherId: !!materialData.teacherId
      });
      
      let result;
      if (editingMaterial) {
        // Редактирование существующего материала
        console.log('✏️ Updating existing material with ID:', editingMaterial.id);
        result = await apiClient.updateMaterial(editingMaterial.id, materialData);
        console.log('✅ Material updated successfully:', result);
        
        // Отправляем WebSocket событие об обновлении материала
        if (socket && socket.connected) {
          console.log('📡 Sending material_updated event via WebSocket');
          socket.emit('material_updated', { material: result });
        }
      } else {
        // Создание нового материала
        console.log('➕ Creating new material with attachments:', processedFiles.length);
        result = await apiClient.createMaterial(materialData);
        console.log('✅ Material created successfully:', result);
        
        // Отправляем WebSocket событие о новом материале
        if (socket && socket.connected) {
          console.log('📡 Sending material_created event via WebSocket');
          socket.emit('material_created', { material: result });
        } else {
          console.warn('⚠️ Socket not connected, real-time update skipped');
        }
      }
      
      // Reload materials from server to get complete data
      await loadMaterials();
      
      setShowCreateModal(false);
      resetMaterialForm();
      console.log('🎉 Material created/updated and list refreshed');
    } catch (error) {
      console.error('❌ Error creating material:', error);
      alert('Ошибка при создании материала: ' + error.message);
    }
  };

  const handleEditMaterial = (material) => {

    console.log('🔧 Edit button clicked for material:', material);
    setEditingMaterial(material);
    console.log('✏️ EditingMaterial set to:', material);
    setMaterialForm({
      title: material.title,
      description: material.description,
      content: material.content || '',
      type: material.type,
      category: material.category,
      difficulty: material.difficulty,
      duration: material.duration,
      isPublished: material.isPublished,
      tags: material.tags ? material.tags.join(', ') : '',
      videoUrl: material.videoUrl || '',
      pdfUrl: material.pdfUrl || '',
      thumbnailUrl: material.thumbnailUrl || ''
    });
    setShowCreateModal(true);
  };

  const handleDeleteMaterial = (material) => {
    setMaterialToDelete(material);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    
    try {
      await apiClient.deleteMaterial(materialToDelete.id);
      
      // Reload materials from server to get updated list
      await loadMaterials();
      
      setShowDeleteDialog(false);
      setMaterialToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting material:', error);
    }
  };

  const handleViewMaterial = (material) => {
    setViewingMaterial(material);
    setShowMaterialViewer(true);
  };

  const handleCloseMaterialViewer = () => {
    setShowMaterialViewer(false);
    setViewingMaterial(null);
  };

  const handlePublishMaterial = async (materialId, isPublished) => {
    try {
      // Convert frontend field to backend field name
      await apiClient.updateMaterial(materialId, { is_published: isPublished });
      setMaterials(materials.map(m => 
        m.id === materialId ? { ...m, isPublished, is_published: isPublished } : m
      ));
      console.log(`✅ Material ${isPublished ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('❌ Error updating material:', error);
      alert('Ошибка при обновлении материала');
    }
  };

  const resetMaterialForm = () => {
    setMaterialForm({
      title: '',
      description: '',
      content: '',
      type: 'text',
      category: 'mechanics',
      difficulty: 'easy',
      duration: 10,
      isPublished: false,
      tags: '',
      videoUrl: '',
      pdfUrl: '',
      thumbnailUrl: ''
    });
    setAttachedFiles([]);
    setEditingMaterial(null);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: 'white'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 10px 0',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      fontSize: '16px',
      opacity: 0.9,
      margin: 0
    },
    controls: {
      display: 'flex',
      gap: '15px',
      marginBottom: '25px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    createButton: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      borderRadius: '15px',
      padding: '15px 30px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
      transition: 'all 0.3s ease'
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      backdropFilter: 'blur(10px)'
    },
    categoryFilter: {
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '14px',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer'
    },
    materialsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    materialCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    materialHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px'
    },
    materialTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'white',
      margin: '0 0 5px 0'
    },
    materialMeta: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '10px'
    },
    materialDescription: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '15px'
    },
    materialActions: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    },
    actionButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    publishButton: {
      background: '#10b981',
      color: 'white'
    },
    unpublishButton: {
      background: '#6b7280',
      color: 'white'
    },
    viewButton: {
      background: '#8b5cf6',
      color: 'white'
    },
    editButton: {
      background: '#3b82f6',
      color: 'white'
    },
    deleteButton: {
      background: '#ef4444',
      color: 'white'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      color: '#1a1a1a'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      fontSize: '14px',
      transition: 'border-color 0.2s ease'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      fontSize: '14px',
      minHeight: '120px',
      resize: 'vertical',
      transition: 'border-color 0.2s ease'
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      fontSize: '14px',
      background: 'white',
      cursor: 'pointer'
    },
    modalActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '30px'
    },
    cancelButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      background: 'white',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    saveButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      background: '#10b981',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: 'white' }}>Загрузка материалов...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>📚 Управление материалами</h1>
        <p style={pageStyles.subtitle}>Создавайте и редактируйте учебные материалы для студентов</p>
      </div>

      {/* Controls */}
      <div style={pageStyles.controls}>
        <button
          style={pageStyles.createButton}
          onClick={() => {
            resetMaterialForm();
            setEditingMaterial(null);
            setShowCreateModal(true);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: '20px' }}>➕</span>
          <span>Создать материал</span>
        </button>

        <input
          style={pageStyles.searchInput}
          type="text"
          placeholder="🔍 Поиск материалов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          style={pageStyles.categoryFilter}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div style={pageStyles.materialsGrid}>
          {filteredMaterials.map(material => {
            const category = categories.find(c => c.id === material.category || c.id === material.subject);
            const difficulty = difficulties.find(d => d.id === material.difficulty);
            const materialType = materialTypes.find(t => t.id === material.type);
            
            console.log(`🎨 Rendering card for material ${material.id}:`, {
              'material.difficulty': material.difficulty,
              'material.duration': material.duration,
              'found difficulty object': difficulty,
              'found materialType object': materialType,
              'difficulty.name': difficulty?.name,
              'materialType.name': materialType?.name
            });
            
            return (
              <div
                key={material.id}
                style={pageStyles.materialCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={pageStyles.materialHeader}>
                  <div>
                    <h3 style={pageStyles.materialTitle}>
                      {material.title || 'Без названия'} 
                      {!material.title && <span style={{color: 'red'}}> (title пустой!)</span>}
                    </h3>
                    <div style={pageStyles.materialMeta}>
                      <span>{materialType?.icon} {materialType?.name}</span>
                      <span>•</span>
                      <span>{category?.icon} {category?.name}</span>
                      <span>•</span>
                      <span style={{ color: difficulty?.color }}>
                        {difficulty?.name}
                      </span>
                      <span>•</span>
                      <span>{material.duration} мин</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: material.isPublished ? '#10b981' : '#6b7280',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {material.isPublished ? 'ОПУБЛИКОВАН' : 'ЧЕРНОВИК'}
                  </div>
                </div>

                <p style={pageStyles.materialDescription}>
                  {material.description}
                </p>

                <div style={pageStyles.materialActions}>
                  <button
                    style={{
                      ...pageStyles.actionButton,
                      ...(material.isPublished ? pageStyles.unpublishButton : pageStyles.publishButton)
                    }}
                    onClick={() => handlePublishMaterial(material.id, !material.isPublished)}
                  >
                    {material.isPublished ? '📤 Снять с публикации' : '📢 Опубликовать'}
                  </button>
                  
                  <button
                    style={{...pageStyles.actionButton, ...pageStyles.viewButton}}
                    onClick={() => handleViewMaterial(material)}
                  >
                    👁️ Просмотреть
                  </button>
                  
                  <button
                    style={{...pageStyles.actionButton, ...pageStyles.editButton}}
                    onClick={() => handleEditMaterial(material)}
                  >
                    ✏️ Редактировать
                  </button>
                  
                  <button
                    style={{...pageStyles.actionButton, ...pageStyles.deleteButton}}
                    onClick={() => handleDeleteMaterial(material)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={pageStyles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
          <h3>Материалы не найдены</h3>
          <p>
            {searchQuery || selectedCategory !== 'all' 
              ? 'Попробуйте изменить фильтры поиска'
              : 'Создайте свой первый учебный материал для студентов'
            }
          </p>
        </div>
      )}

      {/* Create/Edit Material Modal */}
      {showCreateModal && (
        <div style={pageStyles.modal}>
          <div style={pageStyles.modalContent}>
            <h2 style={{ marginTop: 0 }}>
              {editingMaterial ? '✏️ Редактировать материал' : '➕ Создать новый материал'}
            </h2>
            
            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Название материала</label>
              <input
                style={pageStyles.input}
                type="text"
                value={materialForm.title}
                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                placeholder="Например: Законы Ньютона"
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Описание</label>
              <textarea
                style={pageStyles.textarea}
                value={materialForm.description}
                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                placeholder="Краткое описание материала..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Тип материала</label>
                <select
                  style={pageStyles.select}
                  value={materialForm.type}
                  onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                >
                  {materialTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Категория</label>
                <select
                  style={pageStyles.select}
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({...materialForm, category: e.target.value})}
                >
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Сложность</label>
                <select
                  style={pageStyles.select}
                  value={materialForm.difficulty}
                  onChange={(e) => setMaterialForm({...materialForm, difficulty: e.target.value})}
                >
                  {difficulties.map(diff => (
                    <option key={diff.id} value={diff.id}>
                      {diff.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Длительность (мин)</label>
                <input
                  style={pageStyles.input}
                  type="number"
                  value={materialForm.duration}
                  onChange={(e) => setMaterialForm({...materialForm, duration: e.target.value === '' ? '' : parseInt(e.target.value)})}
                  min="1"
                  max="180"
                />
              </div>
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Содержание материала</label>
              <textarea
                style={{...pageStyles.textarea, minHeight: '200px'}}
                value={materialForm.content}
                onChange={(e) => setMaterialForm({...materialForm, content: e.target.value})}
                placeholder="Основное содержание материала..."
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Прикрепленные файлы</label>
              <FileUploader 
                onFilesSelected={setAttachedFiles}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>

            {materialForm.type === 'video' && (
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>URL видео</label>
                <input
                  style={pageStyles.input}
                  type="url"
                  value={materialForm.videoUrl}
                  onChange={(e) => setMaterialForm({...materialForm, videoUrl: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            )}

            {materialForm.type === 'pdf' && (
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>URL PDF файла</label>
                <input
                  style={pageStyles.input}
                  type="url"
                  value={materialForm.pdfUrl}
                  onChange={(e) => setMaterialForm({...materialForm, pdfUrl: e.target.value})}
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            )}

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Теги (через запятую)</label>
              <input
                style={pageStyles.input}
                type="text"
                value={materialForm.tags}
                onChange={(e) => setMaterialForm({...materialForm, tags: e.target.value})}
                placeholder="физика, механика, законы"
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={materialForm.isPublished}
                  onChange={(e) => setMaterialForm({...materialForm, isPublished: e.target.checked})}
                />
                <span>Опубликовать материал сразу</span>
              </label>
            </div>

            <div style={pageStyles.modalActions}>
              <button
                style={pageStyles.cancelButton}
                onClick={() => {
                  setShowCreateModal(false);
                  resetMaterialForm();
                }}
              >
                Отмена
              </button>
              <button
                style={pageStyles.saveButton}
                onClick={handleCreateMaterial}
                disabled={!materialForm.title?.trim()}
              >
                {editingMaterial ? 'Сохранить' : 'Создать материал'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              🗑️
            </div>
            
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '10px'
            }}>
              Удалить материал?
            </h3>
            
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '30px',
              lineHeight: '1.5'
            }}>
              Вы уверены, что хотите удалить материал<br/>
              <strong>"{materialToDelete?.title}"</strong>?<br/>
              Это действие нельзя отменить.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={cancelDeleteMaterial}
              >
                Отмена
              </button>
              
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={confirmDeleteMaterial}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Viewer Modal */}
      {showMaterialViewer && viewingMaterial && (
        <MaterialViewer
          material={viewingMaterial}
          onClose={handleCloseMaterialViewer}
        />
      )}
    </div>
  );
};

export default MaterialManagement;
