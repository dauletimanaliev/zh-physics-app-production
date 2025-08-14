const { db } = require('../models/database');

async function initializeAdmin() {
  try {
    const adminTelegramId = '1350637421';
    
    // Проверяем, существует ли уже админ
    const existingAdmin = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [adminTelegramId]
    );

    if (existingAdmin) {
      // Обновляем роль на админа, если пользователь уже существует
      await db.run(
        'UPDATE users SET role = ? WHERE telegram_id = ?',
        ['admin', adminTelegramId]
      );
      console.log('✅ Роль администратора обновлена для пользователя:', adminTelegramId);
    } else {
      // Создаем нового админа
      await db.run(
        `INSERT INTO users (telegram_id, name, surname, role, xp, streak, level) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminTelegramId, 'Администратор', 'ЕНТ', 'admin', 5000, 30, 10]
      );
      console.log('✅ Администратор создан:', adminTelegramId);
    }

    // Создаем приветственное достижение для админа
    await db.run(
      `INSERT OR IGNORE INTO achievements (user_id, type, title, description, xp_reward)
       SELECT id, 'admin_welcome', 'Добро пожаловать, Администратор!', 'Вы получили права администратора ЕНТ системы', 1000
       FROM users WHERE telegram_id = ?`,
      [adminTelegramId]
    );

    console.log('🎉 Администратор успешно инициализирован!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации администратора:', error);
  }
}

module.exports = { initializeAdmin };
