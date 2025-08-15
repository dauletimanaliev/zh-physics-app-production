const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3003',
    'https://physics-mini-app-cors-fixed.windsurf.build',
    'https://physics-mini-app-final.windsurf.build',
    'https://physics-mini-app-v3.windsurf.build'
  ],
  credentials: true
}));
app.use(express.json());

// SQLite Database setup
const dbPath = path.join(__dirname, 'physics_app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      telegram_id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birth_date TEXT,
      language TEXT DEFAULT 'ru',
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
      school TEXT,
      grade TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Materials table
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'video', 'pdf', 'interactive')),
      category TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      duration INTEGER DEFAULT 15,
      is_published BOOLEAN DEFAULT 0,
      author_id TEXT REFERENCES users(telegram_id) ON DELETE CASCADE,
      tags TEXT,
      video_url TEXT,
      pdf_url TEXT,
      thumbnail_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tests table
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      time_limit INTEGER DEFAULT 30,
      total_questions INTEGER NOT NULL,
      is_published BOOLEAN DEFAULT 0,
      author_id TEXT REFERENCES users(telegram_id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User progress table
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
      total_points INTEGER DEFAULT 0,
      tests_completed INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      max_streak INTEGER DEFAULT 0,
      avg_score REAL DEFAULT 0.0,
      level_id INTEGER DEFAULT 1,
      xp_points INTEGER DEFAULT 0,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Test results table
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(telegram_id) ON DELETE CASCADE,
      test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      percentage REAL NOT NULL,
      time_taken INTEGER,
      answers TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, test_id)
    );
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('❌ Error creating tables:', err.message);
    } else {
      console.log('✅ Database tables initialized');
      insertSampleData();
    }
  });
}

// Insert sample data
function insertSampleData() {
  // Check if sample data already exists
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('📊 Inserting sample data...');
      
      // Insert sample users
      const sampleUsers = [
        ['111333', 'Учитель', 'Физики', '1985-01-01', 'ru', 'teacher', 'Школа №1', null],
        ['111444', 'Студент', 'Тестовый', '2005-01-01', 'ru', 'student', 'Школа №1', '11'],
        ['111555', 'Админ', 'Системы', '1980-01-01', 'ru', 'admin', 'Школа №1', null]
      ];
      
      const insertUser = db.prepare('INSERT INTO users (telegram_id, first_name, last_name, birth_date, language, role, school, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      sampleUsers.forEach(user => insertUser.run(user));
      insertUser.finalize();
      
      // Insert sample materials
      const sampleMaterials = [
        ['Механика: Основы кинематики', 'Изучение движения тел без учета причин движения', 'Кинематика изучает движение тел в пространстве и времени...', 'text', 'mechanics', 'easy', 20, 1, '111333', 'механика,кинематика,движение'],
        ['Электричество и магнетизм', 'Основы электромагнитных явлений', 'Электричество и магнетизм - фундаментальные явления природы...', 'text', 'electricity', 'medium', 25, 1, '111333', 'электричество,магнетизм,поле'],
        ['Термодинамика: Законы тепла', 'Изучение тепловых процессов и энергии', 'Термодинамика изучает тепловые процессы и превращения энергии...', 'text', 'thermodynamics', 'medium', 30, 1, '111333', 'термодинамика,тепло,энергия']
      ];
      
      const insertMaterial = db.prepare('INSERT INTO materials (title, description, content, type, category, difficulty, duration, is_published, author_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      sampleMaterials.forEach(material => insertMaterial.run(material));
      insertMaterial.finalize();
      
      // Insert sample user progress
      db.run('INSERT INTO user_progress (user_id, total_points, tests_completed, current_streak, max_streak, avg_score, level_id, xp_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        ['111444', 150, 3, 5, 7, 85.5, 2, 150]);
      
      console.log('✅ Sample data inserted');
    }
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Physics Mini App API Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== USERS ENDPOINTS ====================

// Create user (registration)
app.post('/api/users', (req, res) => {
  const { telegram_id, first_name, last_name, birth_date, language, role, school, grade } = req.body;
  
  const query = `
    INSERT INTO users (telegram_id, first_name, last_name, birth_date, language, role, school, grade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [telegram_id, first_name, last_name, birth_date, language, role, school, grade], function(err) {
    if (err) {
      console.error('❌ Error creating user:', err.message);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Get the created user
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, user) => {
      if (err) {
        console.error('❌ Error fetching created user:', err.message);
        return res.status(500).json({ error: 'User created but failed to fetch' });
      }
      
      // Create initial progress record
      db.run('INSERT INTO user_progress (user_id) VALUES (?)', [telegram_id], (err) => {
        if (err) {
          console.error('❌ Error creating user progress:', err.message);
        }
      });
      
      console.log('✅ User created:', user);
      res.json({ success: true, user });
    });
  });
});

// Get user by telegram_id
app.get('/api/users/:telegram_id', (req, res) => {
  const { telegram_id } = req.params;
  
  db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, user) => {
    if (err) {
      console.error('❌ Error fetching user:', err.message);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  });
});

// Update user
app.put('/api/users/:telegram_id', (req, res) => {
  const { telegram_id } = req.params;
  const { first_name, last_name, birth_date, language, school, grade } = req.body;
  
  const query = `
    UPDATE users 
    SET first_name = ?, last_name = ?, birth_date = ?, language = ?, school = ?, grade = ?, updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;
  
  db.run(query, [first_name, last_name, birth_date, language, school, grade, telegram_id], function(err) {
    if (err) {
      console.error('❌ Error updating user:', err.message);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User updated successfully' });
  });
});

// Delete user
app.delete('/api/users/:telegram_id', (req, res) => {
  const { telegram_id } = req.params;
  
  db.run('DELETE FROM users WHERE telegram_id = ?', [telegram_id], function(err) {
    if (err) {
      console.error('❌ Error deleting user:', err.message);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User deleted:', telegram_id);
    res.json({ success: true, message: 'User deleted successfully' });
  });
});

// Get all users (for admin)
app.get('/api/users', (req, res) => {
  const { role } = req.query;
  
  let query = 'SELECT * FROM users';
  let params = [];
  
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, users) => {
    if (err) {
      console.error('❌ Error fetching users:', err.message);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    res.json({ success: true, users });
  });
});

// ==================== MATERIALS ENDPOINTS ====================

// Create material
app.post('/api/materials', (req, res) => {
  const { title, description, content, type, category, difficulty, duration, is_published, author_id, tags } = req.body;
  
  const query = `
    INSERT INTO materials (title, description, content, type, category, difficulty, duration, is_published, author_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [title, description, content, type, category, difficulty, duration, is_published, author_id, tags], function(err) {
    if (err) {
      console.error('❌ Error creating material:', err.message);
      return res.status(500).json({ error: 'Failed to create material' });
    }
    
    // Get the created material
    db.get('SELECT * FROM materials WHERE id = ?', [this.lastID], (err, material) => {
      if (err) {
        console.error('❌ Error fetching created material:', err.message);
        return res.status(500).json({ error: 'Material created but failed to fetch' });
      }
      
      console.log('✅ Material created:', material);
      res.json({ success: true, material });
    });
  });
});

// Get all published materials (for students)
app.get('/api/materials', (req, res) => {
  const query = `
    SELECT m.*, u.first_name as author_name, u.last_name as author_surname
    FROM materials m
    LEFT JOIN users u ON m.author_id = u.telegram_id
    WHERE m.is_published = 1
    ORDER BY m.created_at DESC
  `;
  
  db.all(query, [], (err, materials) => {
    if (err) {
      console.error('❌ Error fetching materials:', err.message);
      return res.status(500).json({ error: 'Failed to fetch materials' });
    }
    
    res.json({ success: true, materials });
  });
});

// Get materials by teacher
app.get('/api/materials/teacher/:teacher_id', (req, res) => {
  const { teacher_id } = req.params;
  
  const query = `
    SELECT m.*, u.first_name as author_name, u.last_name as author_surname
    FROM materials m
    LEFT JOIN users u ON m.author_id = u.telegram_id
    WHERE m.author_id = ?
    ORDER BY m.created_at DESC
  `;
  
  db.all(query, [teacher_id], (err, materials) => {
    if (err) {
      console.error('❌ Error fetching teacher materials:', err.message);
      return res.status(500).json({ error: 'Failed to fetch teacher materials' });
    }
    
    res.json({ success: true, materials });
  });
});

// Update material
app.put('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, content, type, category, difficulty, duration, is_published, tags } = req.body;
  
  const query = `
    UPDATE materials 
    SET title = ?, description = ?, content = ?, type = ?, category = ?, 
        difficulty = ?, duration = ?, is_published = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [title, description, content, type, category, difficulty, duration, is_published, tags, id], function(err) {
    if (err) {
      console.error('❌ Error updating material:', err.message);
      return res.status(500).json({ error: 'Failed to update material' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ success: true, message: 'Material updated successfully' });
  });
});

// Delete material
app.delete('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM materials WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('❌ Error deleting material:', err.message);
      return res.status(500).json({ error: 'Failed to delete material' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    console.log('✅ Material deleted:', id);
    res.json({ success: true, message: 'Material deleted successfully' });
  });
});

// Update user profile
app.put('/api/users/:telegram_id', async (req, res) => {
  try {
    const { telegram_id } = req.params;
    const { first_name, last_name, school, grade } = req.body;
    
    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, school = $3, grade = $4, updated_at = NOW()
      WHERE telegram_id = $5
      RETURNING *
    `;
    
    const values = [first_name, last_name, school, grade, telegram_id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:telegram_id', async (req, res) => {
  try {
    const { telegram_id } = req.params;
    
    // Delete user progress first (foreign key constraint)
    await pool.query('DELETE FROM user_progress WHERE user_id = $1', [telegram_id]);
    
    // Delete user
    const query = 'DELETE FROM users WHERE telegram_id = $1 RETURNING *';
    const result = await pool.query(query, [telegram_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all users (for admin/teacher)
app.get('/api/users', async (req, res) => {
  try {
    const query = `
      SELECT u.*, 
             COALESCE(up.total_points, 0) as total_points,
             COALESCE(up.tests_completed, 0) as tests_completed,
             COALESCE(up.current_streak, 0) as current_streak,
             COALESCE(up.avg_score, 0) as avg_score
      FROM users u
      LEFT JOIN user_progress up ON u.telegram_id = up.user_id
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ==================== MATERIALS ENDPOINTS ====================

// Create material
app.post('/api/materials', async (req, res) => {
  try {
    const { title, description, content, type, category, difficulty, duration, is_published, author_id, tags } = req.body;
    
    const query = `
      INSERT INTO materials (title, description, content, type, category, difficulty, duration, is_published, author_id, tags, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [title, description, content, type, category, difficulty, duration, is_published, author_id, tags];
    const result = await pool.query(query, values);
    
    console.log('✅ Material created:', result.rows[0]);
    res.json({ success: true, material: result.rows[0] });
  } catch (error) {
    console.error('❌ Error creating material:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Get all published materials (for students)
app.get('/api/materials', async (req, res) => {
  try {
    const query = `
      SELECT m.*, u.first_name as author_name, u.last_name as author_surname
      FROM materials m
      LEFT JOIN users u ON m.author_id = u.telegram_id
      WHERE m.is_published = true
      ORDER BY m.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error getting materials:', error);
    res.status(500).json({ error: 'Failed to get materials' });
  }
});

// Get materials by teacher (all materials for teacher management)
app.get('/api/materials/teacher/:teacher_id', async (req, res) => {
  try {
    const { teacher_id } = req.params;
    
    const query = `
      SELECT m.*, u.first_name as author_name, u.last_name as author_surname
      FROM materials m
      LEFT JOIN users u ON m.author_id = u.telegram_id
      WHERE m.author_id = $1
      ORDER BY m.created_at DESC
    `;
    
    const result = await pool.query(query, [teacher_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error getting teacher materials:', error);
    res.status(500).json({ error: 'Failed to get teacher materials' });
  }
});

// Update material
app.put('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, type, category, difficulty, duration, is_published, tags } = req.body;
    
    const query = `
      UPDATE materials 
      SET title = $1, description = $2, content = $3, type = $4, category = $5, 
          difficulty = $6, duration = $7, is_published = $8, tags = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    
    const values = [title, description, content, type, category, difficulty, duration, is_published, tags, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ success: true, material: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Delete material
app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM materials WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

// ==================== LEADERBOARD ENDPOINTS ====================

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const query = `
      SELECT u.telegram_id, u.first_name, u.last_name, u.school, u.grade,
             COALESCE(up.total_points, 0) as total_points,
             COALESCE(up.tests_completed, 0) as tests_completed,
             COALESCE(up.current_streak, 0) as current_streak,
             COALESCE(up.avg_score, 0) as avg_score,
             ROW_NUMBER() OVER (ORDER BY COALESCE(up.total_points, 0) DESC) as rank
      FROM users u
      LEFT JOIN user_progress up ON u.telegram_id = up.user_id
      WHERE u.role = 'student'
      ORDER BY total_points DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// ==================== USER PROGRESS ENDPOINTS ====================

// Get user progress
app.get('/api/users/:user_id/progress', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const query = 'SELECT * FROM user_progress WHERE user_id = $1';
    const result = await pool.query(query, [user_id]);
    
    if (result.rows.length === 0) {
      // Create initial progress record
      const createQuery = `
        INSERT INTO user_progress (user_id, total_points, tests_completed, current_streak, avg_score, created_at, updated_at)
        VALUES ($1, 0, 0, 0, 0, NOW(), NOW())
        RETURNING *
      `;
      const createResult = await pool.query(createQuery, [user_id]);
      return res.json(createResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error getting user progress:', error);
    res.status(500).json({ error: 'Failed to get user progress' });
  }
});

// Update user progress
app.put('/api/users/:user_id/progress', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { total_points, tests_completed, current_streak, avg_score } = req.body;
    
    const query = `
      INSERT INTO user_progress (user_id, total_points, tests_completed, current_streak, avg_score, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_points = $2,
        tests_completed = $3,
        current_streak = $4,
        avg_score = $5,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [user_id, total_points, tests_completed, current_streak, avg_score];
    const result = await pool.query(query, values);
    
    res.json({ success: true, progress: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating user progress:', error);
    res.status(500).json({ error: 'Failed to update user progress' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Physics Mini App API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
