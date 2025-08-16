import aiosqlite
from typing import Optional, List, Dict

class ScheduleDatabase:
    def __init__(self, db_path: str = "ent_bot.db"):
        self.db_path = db_path
    
    async def init_schedule_tables(self):
        """Initialize schedule-related tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Schedules table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    creator_id INTEGER NOT NULL,
                    creator_type TEXT NOT NULL DEFAULT 'student',  -- 'student', 'teacher'
                    visibility TEXT NOT NULL DEFAULT 'private',  -- 'private', 'public', 'global'
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (creator_id) REFERENCES users (telegram_id)
                )
            """)
            
            # Schedule entries table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS schedule_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    schedule_id INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,  -- 0=Monday, 6=Sunday
                    time_start TEXT NOT NULL,  -- HH:MM format
                    time_end TEXT NOT NULL,    -- HH:MM format
                    subject TEXT NOT NULL,
                    topic TEXT,
                    location TEXT,
                    notes TEXT,
                    color TEXT DEFAULT '#3498db',
                    FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
                )
            """)
            
            await db.commit()
            print("✅ Schedule tables initialized successfully")

    # Schedule methods
    async def create_schedule(self, title: str, description: str, creator_id: int, creator_type: str = 'student', visibility: str = 'private'):
        """Create a new schedule"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO schedules (title, description, creator_id, creator_type, visibility)
                VALUES (?, ?, ?, ?, ?)
            """, (title, description, creator_id, creator_type, visibility))
            await db.commit()
            return cursor.lastrowid

    async def get_user_schedules(self, user_id: int):
        """Get all schedules created by a user"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM schedules WHERE creator_id = ? ORDER BY updated_at DESC
            """, (user_id,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_public_schedules(self, user_id: int = None):
        """Get all public schedules (excluding user's own if user_id provided)"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            query = """
                SELECT s.*, u.first_name, u.last_name 
                FROM schedules s 
                LEFT JOIN users u ON s.creator_id = u.telegram_id
                WHERE s.visibility IN ('public', 'global')
            """
            params = []
            
            if user_id:
                query += " AND s.creator_id != ?"
                params.append(user_id)
                
            query += " ORDER BY s.updated_at DESC"
            
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_schedule_by_id(self, schedule_id: int):
        """Get schedule by ID with entries"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            
            # Get schedule info
            async with db.execute("""
                SELECT s.*, u.first_name, u.last_name 
                FROM schedules s 
                LEFT JOIN users u ON s.creator_id = u.telegram_id
                WHERE s.id = ?
            """, (schedule_id,)) as cursor:
                schedule = await cursor.fetchone()
                if not schedule:
                    return None
                
                schedule = dict(schedule)
                
            # Get schedule entries
            async with db.execute("""
                SELECT * FROM schedule_entries WHERE schedule_id = ? ORDER BY day_of_week, time_start
            """, (schedule_id,)) as cursor:
                entries = await cursor.fetchall()
                schedule['entries'] = [dict(entry) for entry in entries]
                
            return schedule

    async def add_schedule_entry(self, schedule_id: int, day_of_week: int, time_start: str, time_end: str, 
                                subject: str, topic: str = None, location: str = None, notes: str = None, color: str = '#3498db'):
        """Add entry to schedule"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO schedule_entries (schedule_id, day_of_week, time_start, time_end, subject, topic, location, notes, color)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (schedule_id, day_of_week, time_start, time_end, subject, topic, location, notes, color))
            
            # Update schedule updated_at
            await db.execute("UPDATE schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (schedule_id,))
            await db.commit()
            return cursor.lastrowid

    async def update_schedule_visibility(self, schedule_id: int, visibility: str):
        """Update schedule visibility"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE schedules SET visibility = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (visibility, schedule_id))
            await db.commit()

    async def delete_schedule(self, schedule_id: int):
        """Delete schedule and all its entries"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
            await db.commit()

    async def delete_schedule_entry(self, entry_id: int):
        """Delete schedule entry"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM schedule_entries WHERE id = ?", (entry_id,))
            await db.commit()

    async def update_schedule_entry(self, entry_id: int, **kwargs):
        """Update schedule entry"""
        fields = []
        values = []
        
        for key, value in kwargs.items():
            if key in ['day_of_week', 'time_start', 'time_end', 'subject', 'topic', 'location', 'notes', 'color']:
                fields.append(f"{key} = ?")
                values.append(value)
        
        if not fields:
            return
            
        values.append(entry_id)
        query = f"UPDATE schedule_entries SET {', '.join(fields)} WHERE id = ?"
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(query, values)
            await db.commit()
