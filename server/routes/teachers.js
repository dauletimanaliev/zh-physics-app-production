const express = require('express');
const { db } = require('../models/database');
const { requireTeacherRole } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware для всех роутов
router.use(requireTeacherRole);

// Получение списка учеников
router.get('/students', async (req, res) => {
  try {
    const { search, class: userClass, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, name, surname, school, class, xp, streak, level,
        last_activity, created_at
      FROM users 
      WHERE role = 'student'
    `;
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR surname LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (userClass) {
      query += ' AND class = ?';
      params.push(userClass);
    }

    query += ' ORDER BY last_activity DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const students = await db.all(query, params);

    // Подсчет общего количества
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE role = "student"';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (name LIKE ? OR surname LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (userClass) {
      countQuery += ' AND class = ?';
      countParams.push(userClass);
    }

    const { total } = await db.get(countQuery, countParams);

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка получения учеников:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение детальной информации об ученике
router.get('/students/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const student = await db.get(
      'SELECT * FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Ученик не найден' });
    }

    // Прогресс по материалам
    const progress = await db.all(`
      SELECT 
        em.title,
        em.subject,
        up.progress_percentage,
        up.time_spent,
        up.last_accessed,
        up.completed_at
      FROM user_progress up
      JOIN educational_materials em ON up.material_id = em.id
      WHERE up.user_id = ?
      ORDER BY up.last_accessed DESC
    `, [studentId]);

    // Результаты тестов
    const testResults = await db.all(`
      SELECT 
        t.title,
        t.subject,
        tr.score,
        tr.total_questions,
        tr.time_taken,
        tr.completed_at
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.user_id = ?
      ORDER BY tr.completed_at DESC
    `, [studentId]);

    // Достижения
    const achievements = await db.all(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC',
      [studentId]
    );

    res.json({
      student: {
        ...student,
        subjects: student.subjects ? JSON.parse(student.subjects) : []
      },
      progress,
      testResults,
      achievements
    });

  } catch (error) {
    console.error('Ошибка получения данных ученика:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание учебного материала
router.post('/materials', async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      subject,
      tags,
      status = 'draft'
    } = req.body;

    const result = await db.run(`
      INSERT INTO educational_materials 
      (title, content, type, subject, author_id, status, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, content, type, subject, req.user.id, status, tags]);

    res.json({
      success: true,
      materialId: result.id,
      message: 'Материал создан'
    });

  } catch (error) {
    console.error('Ошибка создания материала:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление учебного материала
router.put('/materials/:materialId', async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const {
      title,
      content,
      type,
      subject,
      tags,
      status
    } = req.body;

    // Проверяем права доступа
    const material = await db.get(
      'SELECT * FROM educational_materials WHERE id = ? AND author_id = ?',
      [materialId, req.user.id]
    );

    if (!material) {
      return res.status(404).json({ error: 'Материал не найден или нет прав доступа' });
    }

    await db.run(`
      UPDATE educational_materials SET
      title = ?, content = ?, type = ?, subject = ?, 
      tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP,
      published_at = CASE WHEN ? = 'published' AND status != 'published' 
                     THEN CURRENT_TIMESTAMP ELSE published_at END
      WHERE id = ?
    `, [title, content, type, subject, tags, status, status, materialId]);

    res.json({ success: true, message: 'Материал обновлен' });

  } catch (error) {
    console.error('Ошибка обновления материала:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление учебного материала
router.delete('/materials/:materialId', async (req, res) => {
  try {
    const materialId = req.params.materialId;

    // Проверяем права доступа
    const material = await db.get(
      'SELECT * FROM educational_materials WHERE id = ? AND author_id = ?',
      [materialId, req.user.id]
    );

    if (!material) {
      return res.status(404).json({ error: 'Материал не найден или нет прав доступа' });
    }

    await db.run('DELETE FROM educational_materials WHERE id = ?', [materialId]);

    res.json({ success: true, message: 'Материал удален' });

  } catch (error) {
    console.error('Ошибка удаления материала:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение материалов учителя
router.get('/materials', async (req, res) => {
  try {
    const { status, subject, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM educational_materials 
      WHERE author_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const materials = await db.all(query, params);

    res.json({ materials });

  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание теста
router.post('/tests', async (req, res) => {
  try {
    const {
      title,
      subject,
      questions,
      time_limit = 600,
      difficulty = 'medium'
    } = req.body;

    const result = await db.run(`
      INSERT INTO tests (title, subject, questions, time_limit, difficulty, author_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, subject, JSON.stringify(questions), time_limit, difficulty, req.user.id]);

    res.json({
      success: true,
      testId: result.id,
      message: 'Тест создан'
    });

  } catch (error) {
    console.error('Ошибка создания теста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Аналитика класса
router.get('/analytics/class', async (req, res) => {
  try {
    const { class: userClass, subject } = req.query;

    // Общая статистика класса
    let query = `
      SELECT 
        COUNT(*) as total_students,
        AVG(xp) as avg_xp,
        AVG(streak) as avg_streak,
        COUNT(CASE WHEN last_activity > datetime('now', '-7 days') THEN 1 END) as active_week
      FROM users 
      WHERE role = 'student'
    `;
    const params = [];

    if (userClass) {
      query += ' AND class = ?';
      params.push(userClass);
    }

    const classStats = await db.get(query, params);

    // Топ учеников
    let topQuery = `
      SELECT name, surname, xp, streak, class
      FROM users 
      WHERE role = 'student'
    `;
    const topParams = [];

    if (userClass) {
      topQuery += ' AND class = ?';
      topParams.push(userClass);
    }

    topQuery += ' ORDER BY xp DESC LIMIT 10';

    const topStudents = await db.all(topQuery, topParams);

    res.json({
      classStats,
      topStudents
    });

  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
