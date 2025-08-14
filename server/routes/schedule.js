const express = require('express');
const { db } = require('../models/database');
const { requireTeacherRole } = require('../middleware/auth');

const router = express.Router();

// Получение расписания
router.get('/', async (req, res) => {
  try {
    const { date, week } = req.query;
    
    let query = 'SELECT * FROM schedules WHERE 1=1';
    const params = [];

    if (date) {
      query += ' AND DATE(start_time) = ?';
      params.push(date);
    } else if (week) {
      query += ' AND DATE(start_time) BETWEEN ? AND ?';
      const startOfWeek = new Date(week);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      params.push(startOfWeek.toISOString().split('T')[0]);
      params.push(endOfWeek.toISOString().split('T')[0]);
    }

    query += ' ORDER BY start_time ASC';

    const schedule = await db.all(query, params);

    res.json({ schedule });

  } catch (error) {
    console.error('Ошибка получения расписания:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание события в расписании (только для учителей)
router.post('/', requireTeacherRole, async (req, res) => {
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      type,
      subject,
      teacher,
      classroom,
      target_users
    } = req.body;

    const result = await db.run(`
      INSERT INTO schedules 
      (title, description, start_time, end_time, type, subject, teacher, classroom, target_users, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, start_time, end_time, type, subject, teacher, classroom, target_users, req.user.id]);

    res.json({
      success: true,
      scheduleId: result.id,
      message: 'Событие добавлено в расписание'
    });

  } catch (error) {
    console.error('Ошибка создания события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление события в расписании
router.put('/:scheduleId', requireTeacherRole, async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const {
      title,
      description,
      start_time,
      end_time,
      type,
      subject,
      teacher,
      classroom,
      target_users
    } = req.body;

    await db.run(`
      UPDATE schedules SET
      title = ?, description = ?, start_time = ?, end_time = ?,
      type = ?, subject = ?, teacher = ?, classroom = ?, target_users = ?
      WHERE id = ? AND author_id = ?
    `, [title, description, start_time, end_time, type, subject, teacher, classroom, target_users, scheduleId, req.user.id]);

    res.json({ success: true, message: 'Событие обновлено' });

  } catch (error) {
    console.error('Ошибка обновления события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление события из расписания
router.delete('/:scheduleId', requireTeacherRole, async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;

    await db.run('DELETE FROM schedules WHERE id = ? AND author_id = ?', [scheduleId, req.user.id]);

    res.json({ success: true, message: 'Событие удалено' });

  } catch (error) {
    console.error('Ошибка удаления события:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
