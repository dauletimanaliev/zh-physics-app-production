const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ent_app_secret_key_2024';

// Проверка Telegram Web App данных
function verifyTelegramWebAppData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN || '8203177420:AAH7FogV1z85q7UTm5_gPwu95u2MAFKfj-I')
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Ошибка проверки Telegram данных:', error);
    return false;
  }
}

// Middleware для проверки JWT токена
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Проверяем существование пользователя в базе
    const user = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return res.status(403).json({ error: 'Недействительный токен' });
  }
}

// Middleware для проверки роли учителя/админа
function requireTeacherRole(req, res, next) {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль учителя или администратора' });
  }
  next();
}

// Middleware для проверки роли администратора
function requireAdminRole(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуется роль администратора' });
  }
  next();
}

// Генерация JWT токена
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id,
      telegram_id: user.telegram_id,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  authenticateToken,
  requireTeacherRole,
  requireAdminRole,
  verifyTelegramWebAppData,
  generateToken
};
