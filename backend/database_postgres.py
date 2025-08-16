import asyncpg
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any

class PostgresDatabase:
    def __init__(self):
        # Get database URL from environment
        self.database_url = os.environ.get('DATABASE_URL')
        if not self.database_url:
            # Fallback for local development
            self.database_url = os.environ.get('DATABASE_PRIVATE_URL', 
                'postgresql://postgres:password@localhost:5432/physics_bot')
        
        self.pool = None
        print(f"🔗 PostgreSQL connection configured")

    async def init_db(self):
        """Initialize database connection pool and create tables"""
        try:
            # Create connection pool
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            
            # Create tables
            await self.create_tables()
            print("✅ PostgreSQL database initialized successfully")
            
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
            raise e

    async def create_tables(self):
        """Create database tables if they don't exist"""
        async with self.pool.acquire() as conn:
            # Materials table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS materials (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    content TEXT,
                    type VARCHAR(50) DEFAULT 'text',
                    category VARCHAR(100) DEFAULT 'general',
                    difficulty VARCHAR(20) DEFAULT 'easy',
                    duration INTEGER DEFAULT 10,
                    "isPublished" BOOLEAN DEFAULT FALSE,
                    tags JSONB DEFAULT '[]',
                    "videoUrl" TEXT,
                    "pdfUrl" TEXT,
                    "thumbnailUrl" TEXT,
                    "teacherId" INTEGER DEFAULT 1,
                    attachments JSONB DEFAULT '[]',
                    views_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Users table
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    telegram_id BIGINT UNIQUE,
                    username VARCHAR(100),
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(20) DEFAULT 'student',
                    school VARCHAR(200),
                    class_name VARCHAR(20),
                    birth_year INTEGER,
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    streak INTEGER DEFAULT 0,
                    tests_completed INTEGER DEFAULT 0,
                    average_score FLOAT DEFAULT 0.0,
                    total_points INTEGER DEFAULT 0,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active'
                )
            ''')
            
            print("✅ Database tables created/verified")

    async def get_connection(self):
        """Get database connection from pool"""
        if not self.pool:
            raise Exception("Database pool not initialized")
        return await self.pool.acquire()

    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("🔌 Database connection pool closed")

    # Materials methods
    async def get_published_materials(self) -> List[Dict]:
        """Get all published materials"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT * FROM materials 
                WHERE "isPublished" = 1 
                ORDER BY created_at DESC
            ''')
            
            materials = []
            for row in rows:
                material = dict(row)
                # Parse JSON fields
                if material.get('tags'):
                    try:
                        material['tags'] = json.loads(material['tags']) if isinstance(material['tags'], str) else material['tags']
                    except:
                        material['tags'] = []
                else:
                    material['tags'] = []
                
                if material.get('attachments'):
                    try:
                        material['attachments'] = json.loads(material['attachments']) if isinstance(material['attachments'], str) else material['attachments']
                    except:
                        material['attachments'] = []
                else:
                    material['attachments'] = []
                
                materials.append(material)
            
            return materials

    async def get_all_materials_debug(self) -> List[Dict]:
        """Get all materials for debugging purposes"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('SELECT id, title, "isPublished" FROM materials ORDER BY created_at DESC')
            return [dict(row) for row in rows]

    async def get_materials_by_teacher(self, teacher_id: str) -> List[Dict]:
        """Get all materials for a specific teacher"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT * FROM materials 
                WHERE "teacherId" = $1 
                ORDER BY created_at DESC
            ''', teacher_id)
            
            materials = []
            for row in rows:
                material = dict(row)
                # Parse JSON fields
                if material.get('tags'):
                    try:
                        material['tags'] = json.loads(material['tags']) if isinstance(material['tags'], str) else material['tags']
                    except:
                        material['tags'] = []
                else:
                    material['tags'] = []
                
                if material.get('attachments'):
                    try:
                        material['attachments'] = json.loads(material['attachments']) if isinstance(material['attachments'], str) else material['attachments']
                    except:
                        material['attachments'] = []
                else:
                    material['attachments'] = []
                
                materials.append(material)
            
            return materials

    async def get_material_by_id(self, material_id: int) -> Optional[Dict]:
        """Get material by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM materials WHERE id = $1', material_id)
            
            if not row:
                return None
            
            material = dict(row)
            # Parse JSON fields
            if material.get('tags'):
                try:
                    material['tags'] = json.loads(material['tags']) if isinstance(material['tags'], str) else material['tags']
                except:
                    material['tags'] = []
            else:
                material['tags'] = []
            
            if material.get('attachments'):
                try:
                    material['attachments'] = json.loads(material['attachments']) if isinstance(material['attachments'], str) else material['attachments']
                except:
                    material['attachments'] = []
            else:
                material['attachments'] = []
            
            return material

    async def add_material(self, material_data: Dict[str, Any]) -> int:
        """Add new material"""
        async with self.pool.acquire() as conn:
            # Insert material
            material_id = await conn.fetchval('''
                INSERT INTO materials (
                    title, description, content, type, category, difficulty, 
                    duration, "isPublished", tags, "videoUrl", "pdfUrl", 
                    "thumbnailUrl", "teacherId", attachments
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id
            ''', 
                material_data.get('title'),
                material_data.get('description'),
                material_data.get('content'),
                material_data.get('type'),
                material_data.get('category'),
                material_data.get('difficulty'),
                material_data.get('duration'),
                material_data.get('isPublished'),
                material_data.get('tags'),
                material_data.get('videoUrl'),
                material_data.get('pdfUrl'),
                material_data.get('thumbnailUrl'),
                material_data.get('teacherId'),
                material_data.get('attachments')
            )
            
            return material_id

    async def update_material(self, material_id: int, material_data: Dict[str, Any]) -> bool:
        """Update existing material"""
        async with self.pool.acquire() as conn:
            # Build dynamic update query
            set_clauses = []
            values = []
            param_count = 1
            
            for key, value in material_data.items():
                if key == 'id':
                    continue
                set_clauses.append(f'"{key}" = ${param_count}')
                values.append(value)
                param_count += 1
            
            if not set_clauses:
                return False
            
            # Add updated_at
            set_clauses.append(f'updated_at = ${param_count}')
            values.append(datetime.now())
            param_count += 1
            
            # Add material_id for WHERE clause
            values.append(material_id)
            
            query = f'''
                UPDATE materials 
                SET {', '.join(set_clauses)}
                WHERE id = ${param_count}
            '''
            
            result = await conn.execute(query, *values)
            return result != 'UPDATE 0'

    async def delete_material(self, material_id: int) -> bool:
        """Delete material"""
        async with self.pool.acquire() as conn:
            result = await conn.execute('DELETE FROM materials WHERE id = $1', material_id)
            return result != 'DELETE 0'

    # User methods
    async def get_user_by_telegram_id(self, telegram_id: int) -> Optional[Dict]:
        """Get user by Telegram ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM users WHERE telegram_id = $1', telegram_id)
            return dict(row) if row else None

    async def add_user(self, user_data: Dict[str, Any]) -> int:
        """Add new user"""
        async with self.pool.acquire() as conn:
            user_id = await conn.fetchval('''
                INSERT INTO users (
                    telegram_id, username, first_name, last_name, role,
                    school, class_name, birth_year
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            ''',
                user_data.get('telegram_id'),
                user_data.get('username'),
                user_data.get('first_name'),
                user_data.get('last_name'),
                user_data.get('role', 'student'),
                user_data.get('school'),
                user_data.get('class_name'),
                user_data.get('birth_year')
            )
            
            return user_id
