const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../physics_app.db');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Подключение к базе данных установлено');
          resolve();
        }
      });
    });
  }

  async initTables() {
    const tables = [
      // Пользователи
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        birth_date DATE,
        phone TEXT,
        school TEXT,
        class TEXT,
        subjects TEXT,
        photo_url TEXT,
        level TEXT DEFAULT 'beginner',
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Учебные материалы
      `CREATE TABLE IF NOT EXISTS educational_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        difficulty TEXT DEFAULT 'medium',
        duration INTEGER DEFAULT 15,
        description TEXT,
        author_id INTEGER,
        status TEXT DEFAULT 'draft',
        views_count INTEGER DEFAULT 0,
        file_url TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME,
        FOREIGN KEY (author_id) REFERENCES users (id)
      )`,

      // Прогресс пользователей
      `CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        progress_percentage INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        test_scores TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (material_id) REFERENCES educational_materials (id)
      )`,

      // Расписание
      `CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        type TEXT NOT NULL,
        subject TEXT,
        teacher TEXT,
        classroom TEXT,
        target_users TEXT,
        author_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users (id)
      )`,

      // События дня рождения
      `CREATE TABLE IF NOT EXISTS birthday_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        birth_date DATE NOT NULL,
        congratulation_sent BOOLEAN DEFAULT FALSE,
        bonus_awarded BOOLEAN DEFAULT FALSE,
        special_badge_expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Сообщения
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        recipient_id INTEGER,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME,
        message_status TEXT DEFAULT 'sent',
        is_broadcast BOOLEAN DEFAULT FALSE,
        target_group TEXT,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (recipient_id) REFERENCES users (id)
      )`,

      // Достижения
      `CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        badge_url TEXT,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        xp_reward INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Тесты
      `CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        questions TEXT NOT NULL,
        time_limit INTEGER DEFAULT 600,
        difficulty TEXT DEFAULT 'medium',
        author_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users (id)
      )`,

      // Результаты тестов
      `CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        time_taken INTEGER,
        answers TEXT,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (test_id) REFERENCES tests (id)
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    console.log('✅ Все таблицы созданы');
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close(() => {
        console.log('✅ Соединение с базой данных закрыто');
        resolve();
      });
    });
  }
}

const db = new Database();

async function initDatabase() {
  await db.connect();
  await db.initTables();
  return db;
}

module.exports = { Database, db, initDatabase };
