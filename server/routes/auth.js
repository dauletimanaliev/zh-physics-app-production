const express = require('express');
const { db } = require('../models/database');
const { verifyTelegramWebAppData, generateToken } = require('../middleware/auth');

const router = express.Router();

// Вход через Telegram Web App
router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;

    // Проверяем данные Telegram Web App
    if (!verifyTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Недействительные данные Telegram' });
    }

    // Парсим данные пользователя
    const urlParams = new URLSearchParams(initData);
    const userDataString = urlParams.get('user');
    
    if (!userDataString) {
      return res.status(400).json({ error: 'Данные пользователя не найдены' });
    }

    const userData = JSON.parse(userDataString);
    const telegramId = userData.id.toString();

    // Проверяем существование пользователя
    let user = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (!user) {
      // Создаем нового пользователя
      const result = await db.run(
        `INSERT INTO users (telegram_id, name, surname, role) 
         VALUES (?, ?, ?, ?)`,
        [
          telegramId,
          userData.first_name || 'Пользователь',
          userData.last_name || '',
          'student' // По умолчанию роль ученика
        ]
      );

      user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    }

    // Обновляем последнюю активность
    await db.run(
      'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Генерируем JWT токен
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        name: user.name,
        surname: user.surname,
        role: user.role,
        xp: user.xp,
        streak: user.streak,
        level: user.level
      }
    });

  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение профиля пользователя
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ent_app_secret_key_2024');
    
    const user = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      id: user.id,
      telegram_id: user.telegram_id,
      name: user.name,
      surname: user.surname,
      role: user.role,
      birth_date: user.birth_date,
      phone: user.phone,
      school: user.school,
      class: user.class,
      subjects: user.subjects ? JSON.parse(user.subjects) : [],
      photo_url: user.photo_url,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      last_activity: user.last_activity,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление профиля пользователя
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ent_app_secret_key_2024');
    
    const {
      name,
      surname,
      birth_date,
      phone,
      school,
      class: userClass,
      subjects,
      photo_url
    } = req.body;

    await db.run(
      `UPDATE users SET 
       name = ?, surname = ?, birth_date = ?, phone = ?, 
       school = ?, class = ?, subjects = ?, photo_url = ?
       WHERE telegram_id = ?`,
      [
        name,
        surname,
        birth_date,
        phone,
        school,
        userClass,
        subjects ? JSON.stringify(subjects) : null,
        photo_url,
        decoded.telegram_id
      ]
    );

    res.json({ success: true, message: 'Профиль обновлен' });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
