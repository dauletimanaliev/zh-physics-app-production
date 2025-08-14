const express = require('express');
const { db } = require('../models/database');

const router = express.Router();

// Получение прогресса студента
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user.id;

    // Общий прогресс
    const progress = await db.all(`
      SELECT 
        em.subject,
        COUNT(*) as total_materials,
        COUNT(CASE WHEN up.progress_percentage = 100 THEN 1 END) as completed_materials,
        AVG(up.progress_percentage) as avg_progress,
        SUM(up.time_spent) as total_time
      FROM educational_materials em
      LEFT JOIN user_progress up ON em.id = up.material_id AND up.user_id = ?
      WHERE em.status = 'published'
      GROUP BY em.subject
    `, [userId]);

    // Последние активности
    const recentActivity = await db.all(`
      SELECT 
        em.title,
        em.subject,
        up.progress_percentage,
        up.last_accessed,
        up.time_spent
      FROM user_progress up
      JOIN educational_materials em ON up.material_id = em.id
      WHERE up.user_id = ?
      ORDER BY up.last_accessed DESC
      LIMIT 10
    `, [userId]);

    // Достижения
    const achievements = await db.all(`
      SELECT * FROM achievements 
      WHERE user_id = ? 
      ORDER BY earned_at DESC
    `, [userId]);

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
      LIMIT 10
    `, [userId]);

    res.json({
      progress,
      recentActivity,
      achievements,
      testResults,
      user: {
        xp: req.user.xp,
        streak: req.user.streak,
        level: req.user.level
      }
    });

  } catch (error) {
    console.error('Ошибка получения прогресса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение материалов для изучения
router.get('/materials', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        em.*,
        up.progress_percentage,
        up.last_accessed,
        CASE WHEN up.progress_percentage = 100 THEN 1 ELSE 0 END as is_completed
      FROM educational_materials em
      LEFT JOIN user_progress up ON em.id = up.material_id AND up.user_id = ?
      WHERE em.status = 'published'
    `;
    
    const params = [userId];

    if (subject) {
      query += ' AND em.subject = ?';
      params.push(subject);
    }

    query += ' ORDER BY em.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const materials = await db.all(query, params);

    // Подсчет общего количества
    let countQuery = 'SELECT COUNT(*) as total FROM educational_materials WHERE status = "published"';
    const countParams = [];
    
    if (subject) {
      countQuery += ' AND subject = ?';
      countParams.push(subject);
    }

    const { total } = await db.get(countQuery, countParams);

    res.json({
      materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление прогресса по материалу
router.post('/progress/:materialId', async (req, res) => {
  try {
    const userId = req.user.id;
    const materialId = req.params.materialId;
    const { progress_percentage, time_spent } = req.body;

    // Проверяем существование материала
    const material = await db.get(
      'SELECT * FROM educational_materials WHERE id = ? AND status = "published"',
      [materialId]
    );

    if (!material) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    // Проверяем существующий прогресс
    const existingProgress = await db.get(
      'SELECT * FROM user_progress WHERE user_id = ? AND material_id = ?',
      [userId, materialId]
    );

    if (existingProgress) {
      // Обновляем прогресс
      await db.run(`
        UPDATE user_progress SET 
        progress_percentage = ?, 
        time_spent = time_spent + ?,
        last_accessed = CURRENT_TIMESTAMP,
        completed_at = CASE WHEN ? = 100 THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE user_id = ? AND material_id = ?
      `, [progress_percentage, time_spent, progress_percentage, userId, materialId]);
    } else {
      // Создаем новый прогресс
      await db.run(`
        INSERT INTO user_progress (user_id, material_id, progress_percentage, time_spent, completed_at)
        VALUES (?, ?, ?, ?, CASE WHEN ? = 100 THEN CURRENT_TIMESTAMP ELSE NULL END)
      `, [userId, materialId, progress_percentage, time_spent, progress_percentage]);
    }

    // Начисляем XP за прогресс
    if (progress_percentage === 100 && (!existingProgress || existingProgress.progress_percentage < 100)) {
      const xpReward = 50; // XP за завершение материала
      await db.run(
        'UPDATE users SET xp = xp + ? WHERE id = ?',
        [xpReward, userId]
      );

      // Добавляем достижение
      await db.run(`
        INSERT INTO achievements (user_id, type, title, description, xp_reward)
        VALUES (?, 'material_completed', 'Материал изучен', ?, ?)
      `, [userId, `Завершен материал: ${material.title}`, xpReward]);
    }

    res.json({ success: true, message: 'Прогресс обновлен' });

  } catch (error) {
    console.error('Ошибка обновления прогресса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение тестов
router.get('/tests', async (req, res) => {
  try {
    const { subject } = req.query;

    let query = 'SELECT * FROM tests';
    const params = [];

    if (subject) {
      query += ' WHERE subject = ?';
      params.push(subject);
    }

    query += ' ORDER BY created_at DESC';

    const tests = await db.all(query, params);

    res.json({ tests });

  } catch (error) {
    console.error('Ошибка получения тестов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Прохождение теста
router.post('/tests/:testId/submit', async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.testId;
    const { answers, time_taken } = req.body;

    // Получаем тест
    const test = await db.get('SELECT * FROM tests WHERE id = ?', [testId]);
    
    if (!test) {
      return res.status(404).json({ error: 'Тест не найден' });
    }

    const questions = JSON.parse(test.questions);
    let score = 0;

    // Подсчитываем правильные ответы
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        score++;
      }
    });

    // Сохраняем результат
    await db.run(`
      INSERT INTO test_results (user_id, test_id, score, total_questions, time_taken, answers)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, testId, score, questions.length, time_taken, JSON.stringify(answers)]);

    // Начисляем XP
    const xpReward = Math.round((score / questions.length) * 100);
    await db.run('UPDATE users SET xp = xp + ? WHERE id = ?', [xpReward, userId]);

    res.json({
      success: true,
      score,
      total_questions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      xp_earned: xpReward
    });

  } catch (error) {
    console.error('Ошибка отправки теста:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение рейтинга (leaderboard)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await db.all(`
      SELECT 
        name,
        surname,
        xp,
        streak,
        level,
        school,
        class
      FROM users 
      WHERE role = 'student'
      ORDER BY xp DESC, streak DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ leaderboard });

  } catch (error) {
    console.error('Ошибка получения рейтинга:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
