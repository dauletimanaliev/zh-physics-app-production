import aiosqlite
import asyncio
from typing import Optional, List, Dict
import json

class Database:
    def __init__(self, db_path: str = "ent_bot.db"):
        self.db_path = db_path
    
    async def init_db(self):
        """Initialize database with all required tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Users table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    language TEXT DEFAULT 'ru',
                    points INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    streak INTEGER DEFAULT 0,
                    tests_completed INTEGER DEFAULT 0,
                    avg_score REAL DEFAULT 0,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Materials table (enhanced for teacher management)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS materials (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subject TEXT NOT NULL,
                    topic TEXT NOT NULL,
                    type TEXT NOT NULL,  -- 'text', 'video', 'pdf', 'interactive'
                    title TEXT NOT NULL,
                    url TEXT,
                    description TEXT,
                    content TEXT,
                    category TEXT NOT NULL,  -- 'mechanics', 'thermodynamics', etc.
                    difficulty TEXT DEFAULT 'easy',  -- 'easy', 'medium', 'hard'
                    duration INTEGER DEFAULT 10,  -- minutes
                    is_published BOOLEAN DEFAULT 0,
                    tags TEXT,  -- JSON array of tags
                    video_url TEXT,
                    pdf_url TEXT,
                    thumbnail_url TEXT,
                    teacher_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    language TEXT DEFAULT 'ru',
                    FOREIGN KEY (teacher_id) REFERENCES users (id)
                )
            """)
            
            # Tests table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS tests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subject TEXT NOT NULL,
                    question TEXT NOT NULL,
                    option_a TEXT NOT NULL,
                    option_b TEXT NOT NULL,
                    option_c TEXT NOT NULL,
                    option_d TEXT NOT NULL,
                    correct_answer TEXT NOT NULL,  -- 'A', 'B', 'C', 'D'
                    explanation TEXT,
                    language TEXT DEFAULT 'ru'
                )
            """)
            
            # Quests table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS quests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    reward_points INTEGER DEFAULT 50,
                    quest_type TEXT NOT NULL,  -- 'test', 'video', 'daily'
                    target_count INTEGER DEFAULT 1,
                    start_date DATE,
                    end_date DATE,
                    is_active BOOLEAN DEFAULT 1,
                    language TEXT DEFAULT 'ru'
                )
            """)
            
            # Schedule table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS schedule (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    day_of_week INTEGER NOT NULL,  -- 0=Monday, 6=Sunday
                    time_start TEXT NOT NULL,
                    time_end TEXT,
                    subject TEXT NOT NULL,
                    topic TEXT,
                    teacher TEXT,
                    classroom TEXT,
                    description TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # User progress table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS user_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    quest_id INTEGER,
                    test_id INTEGER,
                    material_id INTEGER,
                    progress_type TEXT NOT NULL,  -- 'quest', 'test', 'material'
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    score INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users (telegram_id)
                )
            """)
            
            await db.commit()
    
    async def add_user(self, telegram_id: int, username: str = None, first_name: str = None, language: str = 'ru'):
        """Add new user or update existing"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO users (telegram_id, username, first_name, language)
                VALUES (?, ?, ?, ?)
            """, (telegram_id, username, first_name, language))
            await db.commit()
    
    async def get_user(self, telegram_id: int) -> Optional[Dict]:
        """Get user by telegram_id"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM users WHERE telegram_id = ?", (telegram_id,)
            ) as cursor:
                row = await cursor.fetchone()
                return dict(row) if row else None
    
    async def update_user_language(self, telegram_id: int, language: str):
        """Update user language"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE users SET language = ? WHERE telegram_id = ?",
                (language, telegram_id)
            )
            await db.commit()
    
    async def add_points(self, telegram_id: int, points: int):
        """Add points to user and update level"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE users SET points = points + ? WHERE telegram_id = ?",
                (points, telegram_id)
            )
            
            # Update level based on points (every 100 points = 1 level)
            await db.execute("""
                UPDATE users SET level = (points / 100) + 1 WHERE telegram_id = ?
            """, (telegram_id,))
            await db.commit()
    
    async def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by id (telegram_id)"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM users WHERE telegram_id = ?", (user_id,)
            ) as cursor:
                row = await cursor.fetchone()
                return dict(row) if row else None
    
    async def get_user_progress(self, user_id: int) -> List[Dict]:
        """Get user progress history"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM user_progress 
                WHERE user_id = ? 
                ORDER BY completed_at DESC
            """, (user_id,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def delete_user(self, user_id: int) -> bool:
        """Delete user and all related data"""
        async with aiosqlite.connect(self.db_path) as db:
            try:
                # Delete user progress first (foreign key constraint)
                await db.execute("DELETE FROM user_progress WHERE user_id = ?", (user_id,))
                
                # Delete user
                cursor = await db.execute("DELETE FROM users WHERE telegram_id = ?", (user_id,))
                await db.commit()
                
                # Return True if user was deleted (affected rows > 0)
                return cursor.rowcount > 0
            except Exception as e:
                print(f"Error deleting user {user_id}: {e}")
                return False
    
    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get top users by points"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT telegram_id, first_name, username, points, level
                FROM users 
                ORDER BY points DESC 
                LIMIT ?
            """, (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_all_tests(self, language: str = 'ru') -> List[Dict]:
        """Get all tests"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM tests 
                WHERE language = ?
                ORDER BY subject, difficulty, title
            """, (language,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_tests_by_subject(self, subject: str, language: str = 'ru', limit: int = 10) -> List[Dict]:
        """Get random tests by subject"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM tests 
                WHERE subject = ? AND language = ?
                ORDER BY RANDOM() 
                LIMIT ?
            """, (subject, language, limit)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_materials_by_subject(self, subject: str, language: str = 'ru') -> List[Dict]:
        """Get materials by subject"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM materials 
                WHERE subject = ? AND language = ?
                ORDER BY topic, title
            """, (subject, language)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_schedule(self) -> List[Dict]:
        """Get active schedule"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM schedule 
                WHERE is_active = 1
                ORDER BY day_of_week, time_start
            """) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_active_quests(self, language: str = 'ru') -> List[Dict]:
        """Get active quests"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM quests 
                WHERE is_active = 1 AND language = ?
                ORDER BY reward_points DESC
            """, (language,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def add_schedule(self, day_of_week: int, time_start: str, subject: str, topic: str = None, teacher: str = None, time_end: str = None, classroom: str = None, description: str = None):
        """Add schedule entry"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO schedule (day_of_week, time_start, time_end, subject, topic, teacher, classroom, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (day_of_week, time_start, time_end, subject, topic, teacher, classroom, description))
            await db.commit()
    
    async def delete_schedule(self, schedule_id: int):
        """Delete schedule entry by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM schedule WHERE id = ?", (schedule_id,))
            await db.commit()
            return cursor.rowcount > 0
    
    async def get_all_users(self) -> List[Dict]:
        """Get all users for admin panel"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT telegram_id, username, first_name, language, points, level, registration_date
                FROM users 
                ORDER BY registration_date DESC
            """) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_user_count(self) -> int:
        """Get total user count"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT COUNT(*) FROM users") as cursor:
                result = await cursor.fetchone()
                return result[0] if result else 0

    # Material Management Methods for Teachers
    
    async def get_materials_by_teacher(self, teacher_id: int) -> List[Dict]:
        """Get all materials created by a specific teacher"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT id, title, description, content, type, category, difficulty, 
                       duration, is_published as isPublished, tags, video_url as videoUrl, 
                       pdf_url as pdfUrl, thumbnail_url as thumbnailUrl, teacher_id as teacherId,
                       created_at, updated_at
                FROM materials 
                WHERE teacher_id = ?
                ORDER BY updated_at DESC
            """, (teacher_id,)) as cursor:
                rows = await cursor.fetchall()
                materials = []
                for row in rows:
                    material = dict(row)
                    # Parse tags from JSON
                    if material['tags']:
                        try:
                            material['tags'] = json.loads(material['tags'])
                        except:
                            material['tags'] = []
                    else:
                        material['tags'] = []
                    materials.append(material)
                return materials

    async def create_material(self, title: str, description: str, content: str, 
                            type: str, category: str, difficulty: str, duration: int,
                            is_published: bool, tags: str, video_url: str = None,
                            pdf_url: str = None, thumbnail_url: str = None,
                            teacher_id: int = None) -> int:
        """Create a new material and return its ID"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO materials (title, description, content, type, category, difficulty,
                                     duration, is_published, tags, video_url, pdf_url, 
                                     thumbnail_url, teacher_id, subject, topic)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Физика', ?)
            """, (title, description, content, type, category, difficulty, duration,
                  is_published, tags, video_url, pdf_url, thumbnail_url, teacher_id, category))
            await db.commit()
            return cursor.lastrowid

    async def update_material(self, material_id: int, update_data: Dict) -> bool:
        """Update an existing material"""
        async with aiosqlite.connect(self.db_path) as db:
            # Build dynamic update query
            set_clauses = []
            values = []
            
            for key, value in update_data.items():
                if key == 'isPublished':
                    set_clauses.append("is_published = ?")
                    values.append(value)
                elif key == 'videoUrl':
                    set_clauses.append("video_url = ?")
                    values.append(value)
                elif key == 'pdfUrl':
                    set_clauses.append("pdf_url = ?")
                    values.append(value)
                elif key == 'thumbnailUrl':
                    set_clauses.append("thumbnail_url = ?")
                    values.append(value)
                elif key == 'tags' and isinstance(value, list):
                    set_clauses.append("tags = ?")
                    values.append(json.dumps(value))
                else:
                    set_clauses.append(f"{key} = ?")
                    values.append(value)
            
            if not set_clauses:
                return False
                
            set_clauses.append("updated_at = CURRENT_TIMESTAMP")
            values.append(material_id)
            
            query = f"UPDATE materials SET {', '.join(set_clauses)} WHERE id = ?"
            cursor = await db.execute(query, values)
            await db.commit()
            return cursor.rowcount > 0

    async def delete_material(self, material_id: int) -> bool:
        """Delete a material"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM materials WHERE id = ?", (material_id,))
            await db.commit()
            return cursor.rowcount > 0

    async def get_material_by_id(self, material_id: int) -> Optional[Dict]:
        """Get a specific material by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT id, title, description, content, type, category, difficulty, 
                       duration, is_published as isPublished, tags, video_url as videoUrl, 
                       pdf_url as pdfUrl, thumbnail_url as thumbnailUrl, teacher_id as teacherId,
                       created_at, updated_at
                FROM materials 
                WHERE id = ?
            """, (material_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    material = dict(row)
                    # Parse tags from JSON
                    if material['tags']:
                        try:
                            material['tags'] = json.loads(material['tags'])
                        except:
                            material['tags'] = []
                    else:
                        material['tags'] = []
                    return material
                return None

    async def get_all_materials(self) -> List[Dict]:
        """Get all materials (published and unpublished)"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            
            async with db.execute("""
                SELECT id, title, description, content, type, category, difficulty, 
                       duration, is_published, tags, video_url as videoUrl, 
                       pdf_url as pdfUrl, thumbnail_url as thumbnailUrl, teacher_id as teacherId,
                       created_at, updated_at
                FROM materials 
                ORDER BY created_at DESC
            """) as cursor:
                rows = await cursor.fetchall()
                materials = []
                for row in rows:
                    material = dict(row)
                    # Parse tags from JSON
                    if material['tags']:
                        try:
                            material['tags'] = json.loads(material['tags'])
                        except:
                            material['tags'] = []
                    else:
                        material['tags'] = []
                    materials.append(material)
                return materials

    async def get_published_materials(self, category: str = None) -> List[Dict]:
        """Get all published materials, optionally filtered by category"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            
            query = """
                SELECT id, title, description, content, type, category, difficulty, 
                       duration, is_published as isPublished, tags, video_url as videoUrl, 
                       pdf_url as pdfUrl, thumbnail_url as thumbnailUrl, teacher_id as teacherId,
                       created_at, updated_at
                FROM materials 
                WHERE is_published = 1
            """
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
                
            query += " ORDER BY updated_at DESC"
            
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                materials = []
                for row in rows:
                    material = dict(row)
                    # Parse tags from JSON
                    if material['tags']:
                        try:
                            material['tags'] = json.loads(material['tags'])
                        except:
                            material['tags'] = []
                    else:
                        material['tags'] = []
                    materials.append(material)
                return materials
