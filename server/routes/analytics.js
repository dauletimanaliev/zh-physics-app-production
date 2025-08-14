const express = require('express');
const { db } = require('../models/database');
const { requireTeacherRole } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware для всех роутов
router.use(requireTeacherRole);

// Общая аналитика системы
router.get('/overview', async (req, res) => {
  try {
    // Общие статистики
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "student"');
    const totalMaterials = await db.get('SELECT COUNT(*) as count FROM educational_materials WHERE status = "published"');
    const totalTests = await db.get('SELECT COUNT(*) as count FROM tests');
    const activeUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "student" AND last_activity > datetime("now", "-7 days")');

    // Активность по дням (последние 7 дней)
    const dailyActivity = await db.all(`
      SELECT 
        DATE(last_activity) as date,
        COUNT(*) as active_users
      FROM users 
      WHERE role = "student" AND last_activity > datetime("now", "-7 days")
      GROUP BY DATE(last_activity)
      ORDER BY date
    `);

    // Популярные предметы
    const popularSubjects = await db.all(`
      SELECT 
        subject,
        COUNT(*) as material_count,
        SUM(views_count) as total_views
      FROM educational_materials 
      WHERE status = "published"
      GROUP BY subject
      ORDER BY total_views DESC
      LIMIT 10
    `);

    res.json({
      overview: {
        totalUsers: totalUsers.count,
        totalMaterials: totalMaterials.count,
        totalTests: totalTests.count,
        activeUsers: activeUsers.count
      },
      dailyActivity,
      popularSubjects
    });

  } catch (error) {
    console.error('Ошибка получения общей аналитики:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Аналитика по студентам
router.get('/students', async (req, res) => {
  try {
    const { class: userClass, subject } = req.query;

    // Топ студентов по XP
    let topStudentsQuery = `
      SELECT name, surname, class, xp, streak, level
      FROM users 
      WHERE role = "student"
    `;
    const topParams = [];

    if (userClass) {
      topStudentsQuery += ' AND class = ?';
      topParams.push(userClass);
    }

    topStudentsQuery += ' ORDER BY xp DESC LIMIT 20';

    const topStudents = await db.all(topStudentsQuery, topParams);

    // Распределение по уровням
    let levelDistQuery = `
      SELECT level, COUNT(*) as count
      FROM users 
      WHERE role = "student"
    `;
    const levelParams = [];

    if (userClass) {
      levelDistQuery += ' AND class = ?';
      levelParams.push(userClass);
    }

    levelDistQuery += ' GROUP BY level ORDER BY count DESC';

    const levelDistribution = await db.all(levelDistQuery, levelParams);

    // Активность по классам
    const classActivity = await db.all(`
      SELECT 
        class,
        COUNT(*) as total_students,
        AVG(xp) as avg_xp,
        AVG(streak) as avg_streak,
        COUNT(CASE WHEN last_activity > datetime("now", "-7 days") THEN 1 END) as active_students
      FROM users 
      WHERE role = "student" AND class IS NOT NULL
      GROUP BY class
      ORDER BY avg_xp DESC
    `);

    res.json({
      topStudents,
      levelDistribution,
      classActivity
    });

  } catch (error) {
    console.error('Ошибка получения аналитики студентов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Аналитика по материалам
router.get('/materials', async (req, res) => {
  try {
    // Самые популярные материалы
    const popularMaterials = await db.all(`
      SELECT 
        em.title,
        em.subject,
        em.type,
        em.views_count,
        COUNT(up.id) as students_started,
        COUNT(CASE WHEN up.progress_percentage = 100 THEN 1 END) as students_completed
      FROM educational_materials em
      LEFT JOIN user_progress up ON em.id = up.material_id
      WHERE em.status = "published"
      GROUP BY em.id
      ORDER BY em.views_count DESC
      LIMIT 20
    `);

    // Статистика по предметам
    const subjectStats = await db.all(`
      SELECT 
        em.subject,
        COUNT(em.id) as total_materials,
        AVG(em.views_count) as avg_views,
        COUNT(up.id) as total_progress_records,
        AVG(up.progress_percentage) as avg_completion
      FROM educational_materials em
      LEFT JOIN user_progress up ON em.id = up.material_id
      WHERE em.status = "published"
      GROUP BY em.subject
      ORDER BY total_materials DESC
    `);

    res.json({
      popularMaterials,
      subjectStats
    });

  } catch (error) {
    console.error('Ошибка получения аналитики материалов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Аналитика по тестам
router.get('/tests', async (req, res) => {
  try {
    // Результаты тестов
    const testResults = await db.all(`
      SELECT 
        t.title,
        t.subject,
        COUNT(tr.id) as attempts,
        AVG(tr.score) as avg_score,
        AVG(tr.time_taken) as avg_time,
        MAX(tr.score) as max_score,
        MIN(tr.score) as min_score
      FROM tests t
      LEFT JOIN test_results tr ON t.id = tr.test_id
      GROUP BY t.id
      ORDER BY attempts DESC
    `);

    // Распределение оценок
    const scoreDistribution = await db.all(`
      SELECT 
        CASE 
          WHEN (score * 100 / total_questions) >= 90 THEN 'Отлично'
          WHEN (score * 100 / total_questions) >= 70 THEN 'Хорошо'
          WHEN (score * 100 / total_questions) >= 50 THEN 'Удовлетворительно'
          ELSE 'Неудовлетворительно'
        END as grade,
        COUNT(*) as count
      FROM test_results
      GROUP BY grade
    `);

    res.json({
      testResults,
      scoreDistribution
    });

  } catch (error) {
    console.error('Ошибка получения аналитики тестов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
