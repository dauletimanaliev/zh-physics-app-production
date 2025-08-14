const express = require('express');
const { db } = require('../models/database');

const router = express.Router();

// Получение всех материалов
router.get('/', async (req, res) => {
  try {
    const { subject, type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        em.*,
        u.name as author_name,
        u.surname as author_surname
      FROM educational_materials em
      LEFT JOIN users u ON em.author_id = u.id
      WHERE em.status = 'published'
    `;
    const params = [];

    if (subject) {
      query += ' AND em.subject = ?';
      params.push(subject);
    }

    if (type) {
      query += ' AND em.type = ?';
      params.push(type);
    }

    query += ' ORDER BY em.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const materials = await db.all(query, params);

    res.json({ materials });

  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение конкретного материала
router.get('/:materialId', async (req, res) => {
  try {
    const materialId = req.params.materialId;

    const material = await db.get(`
      SELECT 
        em.*,
        u.name as author_name,
        u.surname as author_surname
      FROM educational_materials em
      LEFT JOIN users u ON em.author_id = u.id
      WHERE em.id = ? AND em.status = 'published'
    `, [materialId]);

    if (!material) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    // Увеличиваем счетчик просмотров
    await db.run(
      'UPDATE educational_materials SET views_count = views_count + 1 WHERE id = ?',
      [materialId]
    );

    res.json({ material });

  } catch (error) {
    console.error('Ошибка получения материала:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики материала
router.get('/:materialId/stats', async (req, res) => {
  try {
    const materialId = req.params.materialId;

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as completed_count,
        AVG(progress_percentage) as avg_progress,
        AVG(time_spent) as avg_time_spent
      FROM user_progress 
      WHERE material_id = ?
    `, [materialId]);

    res.json({ stats });

  } catch (error) {
    console.error('Ошибка получения статистики материала:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание нового материала
router.post('/', async (req, res) => {
  try {
    console.log('🚀 POST /api/materials called');
    console.log('📝 Request body:', req.body);
    
    const { 
      title, 
      description, 
      content, 
      type, 
      category, 
      difficulty = 'medium',
      duration = 15,
      teacherId,
      tags = [],
      isPublished = false 
    } = req.body;

    console.log('📝 Creating material:', { title, type, category, teacherId });

    // Валидация обязательных полей
    if (!title || !type || !category || !teacherId) {
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные поля: title, type, category, teacherId' 
      });
    }

    // Создаем материал в базе данных (включая новые поля)
    const result = await db.run(`
      INSERT INTO educational_materials (
        title, 
        description,
        content, 
        type, 
        subject, 
        difficulty,
        duration,
        author_id, 
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      title,
      description || '',
      content || '',
      type,
      category,
      difficulty,
      duration,
      teacherId,
      isPublished ? 'published' : 'draft'
    ]);

    // Получаем созданный материал
    const newMaterial = await db.get(`
      SELECT 
        em.*,
        u.name as author_name,
        u.surname as author_surname
      FROM educational_materials em
      LEFT JOIN users u ON em.author_id = u.id
      WHERE em.id = ?
    `, [result.lastID]);

    console.log('✅ Material created successfully:', newMaterial);

    res.status(201).json({ 
      material: newMaterial,
      message: 'Материал успешно создан'
    });

  } catch (error) {
    console.error('❌ Error creating material:', error);
    res.status(500).json({ error: 'Ошибка при создании материала: ' + error.message });
  }
});

// Обновление материала (публикация/редактирование)
router.put('/:materialId', async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const { 
      title, 
      description,
      content, 
      type, 
      category, 
      difficulty,
      duration,
      isPublished,
      tags = []
    } = req.body;

    console.log('📝 Updating material:', { materialId, title, difficulty, duration, isPublished });
    console.log('🔍 Full request body:', req.body);

    // Валидация ID материала
    if (!materialId || materialId === 'undefined') {
      return res.status(400).json({ 
        error: 'Некорректный ID материала' 
      });
    }

    // Проверяем, существует ли материал
    const existingMaterial = await db.get(
      'SELECT * FROM educational_materials WHERE id = ?',
      [materialId]
    );

    if (!existingMaterial) {
      return res.status(404).json({ 
        error: 'Материал не найден' 
      });
    }

    // Обновляем материал (включая новые поля difficulty, duration, description)
    await db.run(`
      UPDATE educational_materials 
      SET 
        title = ?, 
        description = ?,
        content = ?, 
        type = ?, 
        subject = ?, 
        difficulty = ?,
        duration = ?,
        tags = ?,
        status = ?,
        updated_at = datetime('now'),
        published_at = CASE WHEN ? = 1 AND status = 'draft' THEN datetime('now') ELSE published_at END
      WHERE id = ?
    `, [
      title || existingMaterial.title,
      description || existingMaterial.description,
      content || existingMaterial.content,
      type || existingMaterial.type,
      category || existingMaterial.subject,
      difficulty !== undefined ? difficulty : existingMaterial.difficulty,
      duration !== undefined ? duration : existingMaterial.duration,
      tags || existingMaterial.tags,
      isPublished ? 'published' : 'draft',
      isPublished ? 1 : 0,
      materialId
    ]);

    // Получаем обновленный материал
    const updatedMaterial = await db.get(`
      SELECT 
        em.*,
        u.name as author_name,
        u.surname as author_surname
      FROM educational_materials em
      LEFT JOIN users u ON em.author_id = u.id
      WHERE em.id = ?
    `, [materialId]);

    console.log('✅ Material updated successfully:', updatedMaterial);

    res.json({ 
      material: updatedMaterial,
      message: isPublished ? 'Материал успешно опубликован' : 'Материал успешно обновлен'
    });

  } catch (error) {
    console.error('❌ Error updating material:', error);
    res.status(500).json({ error: 'Ошибка при обновлении материала: ' + error.message });
  }
});

// Получение материалов конкретного учителя
router.get('/teacher/:teacherId/materials', async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('👨‍🏫 Getting materials for teacher:', teacherId);

    const materials = await db.all(`
      SELECT 
        em.*,
        u.name as author_name,
        u.surname as author_surname
      FROM educational_materials em
      LEFT JOIN users u ON em.author_id = u.id
      WHERE em.author_id = ?
      ORDER BY em.created_at DESC
    `, [teacherId]);

    console.log('📚 Found materials for teacher:', materials.length);
    
    // Преобразуем данные в нужный формат
    const formattedMaterials = materials.map(material => ({
      id: material.id,
      title: material.title,
      description: material.description || '',
      content: material.content,
      type: material.type,
      category: material.subject, // subject -> category
      difficulty: material.difficulty || 'medium', // use real data from database
      duration: material.duration || 15, // use real data from database
      isPublished: material.status === 'published',
      tags: material.tags ? material.tags.split(',') : [],
      videoUrl: material.file_url || '',
      pdfUrl: '',
      thumbnailUrl: '',
      createdAt: material.created_at,
      updatedAt: material.updated_at,
      author: {
        name: material.author_name,
        surname: material.author_surname
      }
    }));
   
    res.json(formattedMaterials);
  } catch (error) {
    console.error('❌ Error getting teacher materials:', error);
    res.status(500).json({ error: 'Ошибка при получении материалов учителя' });
  }
});

// Удаление материала
router.delete('/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    console.log('🗑️ DELETE /api/materials/:materialId called with ID:', materialId);

    // Проверяем, существует ли материал
    const existingMaterial = await db.get(`
      SELECT * FROM educational_materials 
      WHERE id = ?
    `, [materialId]);

    if (!existingMaterial) {
      return res.status(404).json({ 
        error: 'Материал не найден' 
      });
    }

    console.log('📄 Found material to delete:', existingMaterial.title);

    // Удаляем материал из базы данных
    await db.run(`
      DELETE FROM educational_materials 
      WHERE id = ?
    `, [materialId]);

    console.log('✅ Material deleted successfully');

    res.json({ 
      message: 'Материал успешно удален',
      deletedMaterial: {
        id: existingMaterial.id,
        title: existingMaterial.title
      }
    });

  } catch (error) {
    console.error('❌ Error deleting material:', error);
    res.status(500).json({ error: 'Ошибка при удалении материала: ' + error.message });
  }
});

module.exports = router;
