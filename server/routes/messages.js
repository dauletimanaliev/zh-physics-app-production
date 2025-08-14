const express = require('express');
const { db } = require('../models/database');
const { requireTeacherRole } = require('../middleware/auth');

const router = express.Router();

// Отправка сообщения (только для учителей)
router.post('/send', requireTeacherRole, async (req, res) => {
  try {
    const {
      recipient_id,
      content,
      type = 'text',
      is_broadcast = false,
      target_group
    } = req.body;

    if (is_broadcast) {
      // Массовая рассылка
      let targetUsers = [];
      
      if (target_group === 'all') {
        targetUsers = await db.all('SELECT id FROM users WHERE role = "student"');
      } else if (target_group) {
        targetUsers = await db.all('SELECT id FROM users WHERE role = "student" AND class = ?', [target_group]);
      }

      // Отправляем сообщение каждому пользователю
      for (const user of targetUsers) {
        await db.run(`
          INSERT INTO messages (sender_id, recipient_id, content, type, is_broadcast, target_group)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [req.user.id, user.id, content, type, is_broadcast, target_group]);
      }

      res.json({ 
        success: true, 
        message: `Сообщение отправлено ${targetUsers.length} получателям` 
      });
    } else {
      // Личное сообщение
      await db.run(`
        INSERT INTO messages (sender_id, recipient_id, content, type)
        VALUES (?, ?, ?, ?)
      `, [req.user.id, recipient_id, content, type]);

      res.json({ success: true, message: 'Сообщение отправлено' });
    }

  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение истории сообщений
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query, params;

    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      // Учитель видит отправленные сообщения
      query = `
        SELECT 
          m.*,
          u.name as recipient_name,
          u.surname as recipient_surname
        FROM messages m
        LEFT JOIN users u ON m.recipient_id = u.id
        WHERE m.sender_id = ?
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [req.user.id, parseInt(limit), offset];
    } else {
      // Ученик видит полученные сообщения
      query = `
        SELECT 
          m.*,
          u.name as sender_name,
          u.surname as sender_surname
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.recipient_id = ?
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [req.user.id, parseInt(limit), offset];
    }

    const messages = await db.all(query, params);

    res.json({ messages });

  } catch (error) {
    console.error('Ошибка получения истории сообщений:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Отметка сообщения как прочитанного
router.put('/:messageId/read', async (req, res) => {
  try {
    const messageId = req.params.messageId;

    await db.run(`
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND recipient_id = ?
    `, [messageId, req.user.id]);

    res.json({ success: true, message: 'Сообщение отмечено как прочитанное' });

  } catch (error) {
    console.error('Ошибка отметки сообщения:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение статистики доставки (для учителей)
router.get('/:messageId/delivery', requireTeacherRole, async (req, res) => {
  try {
    const messageId = req.params.messageId;

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as total_read,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END) as total_unread
      FROM messages 
      WHERE id = ? OR (is_broadcast = 1 AND sender_id = ? AND sent_at = (
        SELECT sent_at FROM messages WHERE id = ?
      ))
    `, [messageId, req.user.id, messageId]);

    res.json({ stats });

  } catch (error) {
    console.error('Ошибка получения статистики доставки:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
