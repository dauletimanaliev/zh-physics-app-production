import asyncpg
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

class PostgresDatabase:
    def __init__(self):
        # Railway PostgreSQL connection string
        self.database_url = os.environ.get('DATABASE_URL', 
            'postgresql://postgres:password@localhost:5432/physics_app')
        self.pool = None
    
    async def init_db(self):
        """Initialize database connection pool and create tables"""
        try:
            self.pool = await asyncpg.create_pool(self.database_url)
            await self.create_tables()
            print("✅ PostgreSQL database initialized successfully")
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
            raise e
    
    async def create_tables(self):
        """Create all necessary tables with enhanced schema"""
        async with self.pool.acquire() as conn:
            # Users table with enhanced fields
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    telegram_id BIGINT UNIQUE NOT NULL,
                    username VARCHAR(255),
                    first_name VARCHAR(255),
                    last_name VARCHAR(255),
                    language VARCHAR(10) DEFAULT 'ru',
                    points INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    role VARCHAR(20) DEFAULT 'student',
                    is_active BOOLEAN DEFAULT true,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Materials table with analytics
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS materials (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    content TEXT,
                    type VARCHAR(50) DEFAULT 'text',
                    category VARCHAR(100) DEFAULT 'general',
                    difficulty VARCHAR(20) DEFAULT 'easy',
                    duration INTEGER DEFAULT 10,
                    is_published BOOLEAN DEFAULT false,
                    tags JSONB DEFAULT '[]',
                    video_url TEXT,
                    pdf_url TEXT,
                    thumbnail_url TEXT,
                    attachments JSONB DEFAULT '[]',
                    teacher_id INTEGER REFERENCES users(id),
                    views_count INTEGER DEFAULT 0,
                    likes_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Material views tracking
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS material_views (
                    id SERIAL PRIMARY KEY,
                    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    duration_seconds INTEGER DEFAULT 0,
                    UNIQUE(material_id, user_id)
                )
            ''')
            
            # Tests table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS tests (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    questions JSONB NOT NULL,
                    category VARCHAR(100) DEFAULT 'general',
                    difficulty VARCHAR(20) DEFAULT 'easy',
                    time_limit INTEGER DEFAULT 30,
                    is_active BOOLEAN DEFAULT true,
                    teacher_id INTEGER REFERENCES users(id),
                    attempts_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Test attempts
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS test_attempts (
                    id SERIAL PRIMARY KEY,
                    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    answers JSONB NOT NULL,
                    score INTEGER NOT NULL,
                    max_score INTEGER NOT NULL,
                    time_taken INTEGER DEFAULT 0,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Schedule table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS schedule (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    day_of_week INTEGER NOT NULL,
                    time_start TIME NOT NULL,
                    time_end TIME,
                    subject VARCHAR(100),
                    topic VARCHAR(200),
                    teacher_id INTEGER REFERENCES users(id),
                    classroom VARCHAR(50),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Messages/Notifications table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    content TEXT NOT NULL,
                    sender_id INTEGER REFERENCES users(id),
                    recipient_id INTEGER REFERENCES users(id),
                    message_type VARCHAR(50) DEFAULT 'personal',
                    is_broadcast BOOLEAN DEFAULT false,
                    is_read BOOLEAN DEFAULT false,
                    priority VARCHAR(20) DEFAULT 'normal',
                    scheduled_at TIMESTAMP,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    read_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # User progress tracking
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS user_progress (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    category VARCHAR(100) NOT NULL,
                    total_materials INTEGER DEFAULT 0,
                    completed_materials INTEGER DEFAULT 0,
                    total_tests INTEGER DEFAULT 0,
                    completed_tests INTEGER DEFAULT 0,
                    average_score DECIMAL(5,2) DEFAULT 0.0,
                    time_spent_minutes INTEGER DEFAULT 0,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, category)
                )
            ''')
            
            # Create indexes for performance
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_materials_teacher_id ON materials(teacher_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_material_views_user_material ON material_views(user_id, material_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)')
            
            print("✅ All database tables created successfully")
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
    
    # User methods
    async def add_user(self, telegram_id: int, username: str = None, first_name: str = None, 
                      last_name: str = None, language: str = 'ru', role: str = 'student'):
        """Add new user to database"""
        async with self.pool.acquire() as conn:
            query = '''
                INSERT INTO users (telegram_id, username, first_name, last_name, language, role)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (telegram_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    language = EXCLUDED.language,
                    last_activity = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            '''
            return await conn.fetchval(query, telegram_id, username, first_name, last_name, language, role)
    
    async def get_user(self, user_id: int):
        """Get user by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM users WHERE id = $1', user_id)
            return dict(row) if row else None
    
    async def get_user_by_telegram_id(self, telegram_id):
        """Get user by telegram_id"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM users WHERE telegram_id = $1', telegram_id)
            return dict(row) if row else None
    
    async def get_all_users(self):
        """Get all users"""
        async with self.pool.acquire() as conn:
            query = 'SELECT * FROM users ORDER BY created_at DESC'
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
    
    # Material methods with analytics
    async def add_material(self, material_data: Dict[str, Any]):
        """Add new material"""
        async with self.pool.acquire() as conn:
            query = '''
                INSERT INTO materials (title, description, content, type, category, difficulty, 
                                     duration, is_published, tags, video_url, pdf_url, 
                                     thumbnail_url, attachments, teacher_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id
            '''
            return await conn.fetchval(
                query,
                material_data.get('title'),
                material_data.get('description'),
                material_data.get('content'),
                material_data.get('type', 'text'),
                material_data.get('category', 'general'),
                material_data.get('difficulty', 'easy'),
                material_data.get('duration', 10),
                material_data.get('is_published', False),
                json.dumps(material_data.get('tags', [])),
                material_data.get('video_url'),
                material_data.get('pdf_url'),
                material_data.get('thumbnail_url'),
                material_data.get('attachments', '[]'),
                material_data.get('teacher_id', 1)
            )
    
    async def get_all_materials(self):
        """Get all materials with analytics"""
        async with self.pool.acquire() as conn:
            query = '''
                SELECT m.*, COUNT(mv.id) as views_count
                FROM materials m
                LEFT JOIN material_views mv ON m.id = mv.material_id
                GROUP BY m.id
                ORDER BY m.created_at DESC
            '''
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
    
    async def get_materials_by_teacher(self, teacher_id: int):
        """Get materials by teacher ID"""
        async with self.pool.acquire() as conn:
            query = '''
                SELECT m.*, COUNT(mv.id) as views_count
                FROM materials m
                LEFT JOIN material_views mv ON m.id = mv.material_id
                WHERE m.teacher_id = $1
                GROUP BY m.id
                ORDER BY m.created_at DESC
            '''
            rows = await conn.fetch(query, teacher_id)
            return [dict(row) for row in rows]
    
    async def get_material_by_id(self, material_id: int):
        """Get material by ID with view tracking"""
        async with self.pool.acquire() as conn:
            query = '''
                SELECT m.*, u.first_name as teacher_name, u.username as teacher_username
                FROM materials m
                LEFT JOIN users u ON m.teacher_id = u.id
                WHERE m.id = $1
            '''
            row = await conn.fetchrow(query, material_id)
            if row:
                material = dict(row)
                # Parse JSON fields
                material['tags'] = json.loads(material['tags']) if material['tags'] else []
                if isinstance(material['attachments'], str):
                    material['attachments'] = json.loads(material['attachments'])
                return material
            return None
    
    async def update_material(self, material_id: int, material_data: dict):
        """Update material by ID"""
        async with self.pool.acquire() as conn:
            query = '''
                UPDATE materials SET
                    title = $2,
                    description = $3,
                    content = $4,
                    type = $5,
                    category = $6,
                    difficulty = $7,
                    duration = $8,
                    is_published = $9,
                    tags = $10,
                    video_url = $11,
                    pdf_url = $12,
                    thumbnail_url = $13,
                    attachments = $14,
                    teacher_id = $15,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id
            '''
            return await conn.fetchval(
                query,
                material_id,
                material_data.get('title'),
                material_data.get('description'),
                material_data.get('content'),
                material_data.get('type'),
                material_data.get('category'),
                material_data.get('difficulty'),
                material_data.get('duration'),
                material_data.get('is_published'),
                material_data.get('tags'),
                material_data.get('video_url'),
                material_data.get('pdf_url'),
                material_data.get('thumbnail_url'),
                material_data.get('attachments'),
                material_data.get('teacher_id')
            )
    
    async def delete_material(self, material_id: int):
        """Delete material by ID"""
        async with self.pool.acquire() as conn:
            query = 'DELETE FROM materials WHERE id = $1'
            await conn.execute(query, material_id)
    
    async def update_material_publish_status(self, material_id: int, is_published: bool):
        """Update material publish status"""
        async with self.pool.acquire() as conn:
            query = '''
                UPDATE materials SET 
                    is_published = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            '''
            await conn.execute(query, material_id, is_published)
    
    async def track_material_view(self, material_id: int, user_id: int, duration_seconds: int = 0):
        """Track material view for analytics"""
        async with self.pool.acquire() as conn:
            # Insert or update view record
            await conn.execute('''
                INSERT INTO material_views (material_id, user_id, duration_seconds)
                VALUES ($1, $2, $3)
                ON CONFLICT (material_id, user_id) DO UPDATE SET
                    viewed_at = CURRENT_TIMESTAMP,
                    duration_seconds = GREATEST(material_views.duration_seconds, EXCLUDED.duration_seconds)
            ''', material_id, user_id, duration_seconds)
            
            # Update material views count
            await conn.execute('''
                UPDATE materials SET views_count = (
                    SELECT COUNT(*) FROM material_views WHERE material_id = $1
                ) WHERE id = $1
            ''', material_id)
    
    async def get_material_analytics(self, material_id: int):
        """Get detailed analytics for a material"""
        async with self.pool.acquire() as conn:
            # Basic stats
            stats = await conn.fetchrow('''
                SELECT 
                    m.views_count,
                    m.likes_count,
                    COUNT(DISTINCT mv.user_id) as unique_viewers,
                    AVG(mv.duration_seconds) as avg_view_duration,
                    MAX(mv.viewed_at) as last_viewed
                FROM materials m
                LEFT JOIN material_views mv ON m.id = mv.material_id
                WHERE m.id = $1
                GROUP BY m.id, m.views_count, m.likes_count
            ''', material_id)
            
            # Recent viewers
            viewers = await conn.fetch('''
                SELECT u.first_name, u.username, mv.viewed_at, mv.duration_seconds
                FROM material_views mv
                JOIN users u ON mv.user_id = u.id
                WHERE mv.material_id = $1
                ORDER BY mv.viewed_at DESC
                LIMIT 10
            ''', material_id)
            
            return {
                'stats': dict(stats) if stats else {},
                'recent_viewers': [dict(v) for v in viewers]
            }
    
    # Message/Notification methods
    async def send_message(self, sender_id: int, title: str, content: str, 
                          recipient_id: int = None, is_broadcast: bool = False,
                          message_type: str = 'personal', priority: str = 'normal'):
        """Send message to user(s)"""
        async with self.pool.acquire() as conn:
            if is_broadcast:
                # Send to all users
                users = await conn.fetch('SELECT id FROM users WHERE is_active = true')
                for user in users:
                    await conn.execute('''
                        INSERT INTO messages (title, content, sender_id, recipient_id, 
                                            message_type, is_broadcast, priority)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ''', title, content, sender_id, user['id'], message_type, True, priority)
            else:
                # Send to specific user
                await conn.execute('''
                    INSERT INTO messages (title, content, sender_id, recipient_id, 
                                        message_type, is_broadcast, priority)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                ''', title, content, sender_id, recipient_id, message_type, False, priority)
    
    async def get_user_messages(self, user_id: int, unread_only: bool = False):
        """Get messages for user"""
        async with self.pool.acquire() as conn:
            where_clause = 'WHERE m.recipient_id = $1'
            if unread_only:
                where_clause += ' AND m.is_read = false'
            
            query = f'''
                SELECT m.*, u.first_name as sender_name, u.username as sender_username
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                {where_clause}
                ORDER BY m.sent_at DESC
            '''
            rows = await conn.fetch(query, user_id)
            return [dict(row) for row in rows]
    
    async def mark_message_read(self, message_id: int, user_id: int):
        """Mark message as read"""
        async with self.pool.acquire() as conn:
            await conn.execute('''
                UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND recipient_id = $2
            ''', message_id, user_id)
    
    # Schedule methods
    async def add_schedule(self, schedule_data: Dict[str, Any]):
        """Add schedule entry"""
        async with self.pool.acquire() as conn:
            query = '''
                INSERT INTO schedule (title, description, day_of_week, time_start, time_end,
                                    subject, topic, teacher_id, classroom)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            '''
            return await conn.fetchval(
                query,
                schedule_data.get('title'),
                schedule_data.get('description'),
                schedule_data.get('day_of_week'),
                schedule_data.get('time_start'),
                schedule_data.get('time_end'),
                schedule_data.get('subject'),
                schedule_data.get('topic'),
                schedule_data.get('teacher_id'),
                schedule_data.get('classroom')
            )
    
    async def get_schedule(self):
        """Get all active schedule entries"""
        async with self.pool.acquire() as conn:
            query = '''
                SELECT s.*, u.first_name as teacher_name, u.username as teacher_username
                FROM schedule s
                LEFT JOIN users u ON s.teacher_id = u.id
                WHERE s.is_active = true
                ORDER BY s.day_of_week, s.time_start
            '''
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
    
    # Progress tracking methods
    async def update_user_progress(self, user_id: int, category: str, 
                                  material_completed: bool = False, 
                                  test_completed: bool = False, 
                                  test_score: float = None,
                                  time_spent_minutes: int = 0):
        """Update user progress in a category"""
        async with self.pool.acquire() as conn:
            # Get or create progress record
            await conn.execute('''
                INSERT INTO user_progress (user_id, category)
                VALUES ($1, $2)
                ON CONFLICT (user_id, category) DO NOTHING
            ''', user_id, category)
            
            # Update progress
            updates = []
            params = [user_id, category]
            param_count = 2
            
            if material_completed:
                param_count += 1
                updates.append(f'completed_materials = completed_materials + 1')
            
            if test_completed:
                param_count += 1
                updates.append(f'completed_tests = completed_tests + 1')
            
            if test_score is not None:
                param_count += 1
                params.append(test_score)
                updates.append(f'average_score = (average_score * completed_tests + ${param_count}) / (completed_tests + 1)')
            
            if time_spent_minutes > 0:
                param_count += 1
                params.append(time_spent_minutes)
                updates.append(f'time_spent_minutes = time_spent_minutes + ${param_count}')
            
            updates.append('last_activity = CURRENT_TIMESTAMP')
            updates.append('updated_at = CURRENT_TIMESTAMP')
            
            if updates:
                query = f'''
                    UPDATE user_progress 
                    SET {', '.join(updates)}
                    WHERE user_id = $1 AND category = $2
                '''
                await conn.execute(query, *params)
    
    async def get_user_progress(self, user_id: int):
        """Get comprehensive user progress"""
        async with self.pool.acquire() as conn:
            # Overall progress
            progress = await conn.fetch('''
                SELECT * FROM user_progress WHERE user_id = $1 ORDER BY category
            ''', user_id)
            
            # Recent activity
            recent_views = await conn.fetch('''
                SELECT m.title, m.category, mv.viewed_at
                FROM material_views mv
                JOIN materials m ON mv.material_id = m.id
                WHERE mv.user_id = $1
                ORDER BY mv.viewed_at DESC
                LIMIT 10
            ''', user_id)
            
            # Test results
            test_results = await conn.fetch('''
                SELECT t.title, ta.score, ta.max_score, ta.completed_at
                FROM test_attempts ta
                JOIN tests t ON ta.test_id = t.id
                WHERE ta.user_id = $1
                ORDER BY ta.completed_at DESC
                LIMIT 10
            ''', user_id)
            
            return {
                'progress_by_category': [dict(p) for p in progress],
                'recent_activity': [dict(v) for v in recent_views],
                'recent_tests': [dict(t) for t in test_results]
            }
    
    # Leaderboard methods
    async def get_leaderboard(self, limit: int = 10):
        """Get user leaderboard"""
        async with self.pool.acquire() as conn:
            query = '''
                SELECT 
                    u.id, u.first_name, u.username, u.points, u.level,
                    COUNT(DISTINCT mv.material_id) as materials_viewed,
                    COUNT(DISTINCT ta.test_id) as tests_completed,
                    AVG(ta.score::float / ta.max_score * 100) as avg_test_score
                FROM users u
                LEFT JOIN material_views mv ON u.id = mv.user_id
                LEFT JOIN test_attempts ta ON u.id = ta.user_id
                WHERE u.role = 'student' AND u.is_active = true
                GROUP BY u.id, u.first_name, u.username, u.points, u.level
                ORDER BY u.points DESC, avg_test_score DESC
                LIMIT $1
            '''
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]
