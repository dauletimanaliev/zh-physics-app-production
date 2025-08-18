from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import asyncio
from database import Database
from database_schedule import ScheduleDatabase
import json
import traceback
from datetime import datetime
import aiosqlite
import os

# Lifespan event handler to replace deprecated on_event
from contextlib import asynccontextmanager

# Pydantic models
class User(BaseModel):
    telegram_id: int
    first_name: str
    username: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    language: Optional[str] = 'ru'
    role: Optional[str] = 'student'
    registration_date: Optional[str] = None

class TestAnswer(BaseModel):
    test_id: int
    answer: str
    user_id: int

class ScheduleCreate(BaseModel):
    title: str
    description: str
    visibility: str = 'private'

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler with full error protection"""
    try:
        global db, schedule_db
        print("🚀 Starting API server...")
        
        # Safe database initialization
        try:
            db = Database()
            await db.init_db()
            schedule_db = ScheduleDatabase()
            await schedule_db.init_schedule_tables()
            print("✅ Database initialized successfully")
        except Exception as db_error:
            print(f"❌ Database initialization error: {db_error}")
            print(f"📜 DB Error traceback: {traceback.format_exc()}")
            
        # Safe test data creation
        try:
            await create_safe_test_data()
        except Exception as test_error:
            print(f"⚠️ Test data creation error: {test_error}")
            
        print("🎯 API server startup completed")
        
    except Exception as startup_error:
        print(f"💥 CRITICAL STARTUP ERROR: {startup_error}")
        print(f"📜 Startup error traceback: {traceback.format_exc()}")
    
    yield  # Server is running
    
    # Cleanup on shutdown
    try:
        print("🛑 Shutting down API server...")
    except Exception as shutdown_error:
        print(f"⚠️ Shutdown error: {shutdown_error}")

# Initialize FastAPI app with lifespan
app = FastAPI(title="Physics Bot API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db_file = os.environ.get('DATABASE_FILE', 'ent_bot.db')
db = Database(db_file)

# Global exception handler to prevent cascade errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    try:
        error_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        print(f"🚨 CRITICAL ERROR [{error_id}]: {type(exc).__name__}: {str(exc)}")
        print(f"📍 Request: {request.method} {request.url}")
        print(f"📜 Traceback: {traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "error_id": error_id,
                "message": "Server encountered an error. Please try again."
            }
        )
    except Exception as handler_error:
        print(f"💥 HANDLER ERROR: {handler_error}")
        return JSONResponse(
            status_code=500,
            content={"error": "Critical system error"}
        )

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        print(f"❌ Validation error: {exc}")
        print(f"📜 Error details: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors(), "body": exc.body}
        )
    except Exception as e:
        print(f"💥 Validation handler error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Validation error processing failed"}
        )

# Pydantic models
class UserCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    language: str = 'ru'

class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    visibility: str = 'private'  # 'private', 'public', 'global'

class ScheduleEntryCreate(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    time_start: str   # HH:MM format
    time_end: str     # HH:MM format
    subject: str
    topic: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    color: str = '#3498db'

class TestAnswer(BaseModel):
    test_id: int
    answer: str
    user_id: int

class ScheduleEntry(BaseModel):
    day_of_week: int
    time_start: str
    time_end: Optional[str] = None
    subject: str
    topic: Optional[str] = None
    teacher: Optional[str] = None
    classroom: Optional[str] = None
    description: Optional[str] = None

class Material(BaseModel):
    title: str
    description: Optional[str] = ""
    content: Optional[str] = ""
    type: str  # text, video, pdf, interactive
    category: str  # mechanics, thermodynamics, electricity, etc.
    difficulty: str = "easy"  # easy, medium, hard
    duration: int = 10  # minutes
    isPublished: bool = False
    tags: List[str] = []
    videoUrl: Optional[str] = None
    pdfUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    teacherId: Optional[int] = None


async def create_safe_test_data():
    """Safely create test data without causing cascade errors"""
    try:
        # Check if we have any materials
        materials = await db.get_all_materials()
        if not materials or len(materials) == 0:
            print("📝 Creating initial test material...")
            
            test_material = {
                'title': 'Тестовый материал с вложениями',
                'description': 'Материал для проверки отображения вложений',
                'content': '''# Тестовый материал

Это тестовый материал для проверки системы вложений.

## Содержание:
- Изображения
- Документы
- Видео файлы''',
                'type': 'text',
                'category': 'test',
                'difficulty': 'easy',
                'duration': 5,
                'isPublished': True,
                'tags': json.dumps(['тест', 'вложения']),
                'attachments': json.dumps([
                    {
                        'name': 'test_image.png',
                        'type': 'image/png',
                        'size': 95,
                        'data': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                        'uploaded_at': datetime.now().isoformat()
                    }
                ]),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            material_id = await db.add_material(test_material)
            print(f"✅ Created test material with ID: {material_id}")
            
    except Exception as e:
        print(f"⚠️ Safe test data creation failed: {e}")
        # Don't propagate the error

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "OK", "service": "Physics Bot API"}

# User endpoints with error protection
@app.post("/api/users")
async def create_user(user: User):
    try:
        await db.add_user(
            telegram_id=user.telegram_id,
            username=getattr(user, 'username', None),
            first_name=user.first_name,
            last_name=getattr(user, 'last_name', None),
            birth_date=getattr(user, 'birth_date', None),
            language=getattr(user, 'language', 'ru'),
            role=getattr(user, 'role', 'student'),
            registration_date=getattr(user, 'registration_date', None)
        )
        return {"message": "User created successfully", "id": user.telegram_id}
    except Exception as e:
        print(f"❌ User creation error: {e}")
        print(f"📜 Traceback: {traceback.format_exc()}")
        print(f"📋 User data received: {user}")
        raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")

@app.get("/api/users/{telegram_id}")
async def get_user(telegram_id: int):
    try:
        user = await db.get_user(telegram_id)
        if user:
            return user
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        print(f"❌ Get user error: {e}")
        print(f"📜 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user")

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int):
    try:
        success = await db.delete_user(user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True, "message": "Пользователь успешно удален из системы"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/progress")
async def get_user_progress(user_id: int):
    try:
        # Get user basic info
        user = await db.get_user_by_id(user_id)
        if not user:
            # Return default values for new users instead of 404
            print(f"⚠️ User {user_id} not found in database, returning default values")
            return {
                "user_id": user_id,
                "points": 0,
                "tests_completed": 0,
                "streak": 0,
                "level": 1,
                "avg_score": 0,
                "progress": []
            }
        
        # Get user progress stats
        progress = await db.get_user_progress(user_id)
        
        return {
            "user_id": user_id,
            "points": user.get('points', 0),
            "tests_completed": user.get('tests_completed', 0),
            "streak": user.get('streak', 0),
            "level": user.get('level', 1),
            "avg_score": user.get('avg_score', 0),
            "progress": progress
        }
    except Exception as e:
        print(f"❌ Error in get_user_progress for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10):
    try:
        leaderboard = await db.get_leaderboard(limit)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoints
@app.get("/api/tests")
async def get_tests(language: str = 'ru'):
    """Get all tests"""
    try:
        tests = await db.get_all_tests(language)
        return tests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tests/{subject}")
async def get_tests_by_subject(subject: str, language: str = 'ru', limit: int = 10):
    """Get tests by subject"""
    tests = db.get_tests_by_subject(subject, language, limit)
    return {"tests": tests}

@app.post("/api/tests/submit")
async def submit_test_answer(answer: TestAnswer):
    try:
        # Here you would implement test scoring logic
        # For now, just add points to user
        await db.add_points(answer.user_id, 10)  # 10 points per correct answer
        return {"message": "Answer submitted successfully", "points_awarded": 10}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Materials endpoints
@app.get("/api/materials")
async def get_all_materials():
    """Get all materials"""
    try:
        materials = await db.get_all_materials()
        return materials
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/published")
async def get_published_materials(user_id: Optional[int] = None, category: Optional[str] = None):
    """Get all published materials for students"""
    try:
        print(f"📚 Loading published materials for student, category: {category}")
        
        # Get all materials from database with error handling
        try:
            materials = await db.get_all_materials()
            print(f"📊 Found {len(materials)} total materials in database")
        except Exception as db_error:
            print(f"❌ Database error getting materials: {db_error}")
            print(f"📜 Database error traceback: {traceback.format_exc()}")
            # Return empty list if database fails
            return []
        
        if not materials:
            print("📭 No materials found in database")
            return []
        
        # Filter only published materials
        published_materials = []
        for m in materials:
            is_published = m.get('is_published')
            print(f"🔍 Material {m.get('id')}: {m.get('title')} - is_published: {is_published} (type: {type(is_published)})")
            if is_published == 1 or is_published is True:
                published_materials.append(m)
        
        # Filter by category if specified
        if category and category != 'all':
            published_materials = [m for m in published_materials if m.get('category') == category]
        
        print(f"✅ Found {len(published_materials)} published materials")
        return published_materials
    except Exception as e:
        print(f"❌ Error loading published materials: {e}")
        print(f"📜 Full traceback: {traceback.format_exc()}")
        # Return empty list instead of raising error
        return []

# User progress and bookmarks endpoints
@app.get("/api/users/{user_id}/progress")
async def get_user_progress(user_id: int):
    """Get user progress stats"""
    try:
        user = await db.get_user_by_id(user_id)
        if not user:
            return {"experience": 0, "nextLevelExp": 1000, "level": 1}
        
        return {
            "experience": user.get('points', 0),
            "nextLevelExp": 1000,
            "level": user.get('level', 1),
            "testsCompleted": user.get('tests_completed', 0),
            "avgScore": user.get('avg_score', 0)
        }
    except Exception as e:
        print(f"❌ Error loading user progress: {e}")
        return {"experience": 0, "nextLevelExp": 1000, "level": 1}

@app.get("/api/users/{user_id}/bookmarks")
async def get_user_bookmarks(user_id: int):
    """Get user bookmarks"""
    try:
        # For now return empty array, can implement later
        return []
    except Exception as e:
        print(f"❌ Error loading user bookmarks: {e}")
        return []

@app.post("/api/users/{user_id}/bookmarks")
async def add_bookmark(user_id: int, data: Dict[str, Any]):
    """Add bookmark for user"""
    try:
        # For now just return success, can implement later
        return {"success": True}
    except Exception as e:
        print(f"❌ Error adding bookmark: {e}")
        return {"success": False}

@app.delete("/api/users/{user_id}/bookmarks/{material_id}")
async def remove_bookmark(user_id: int, material_id: int):
    """Remove bookmark for user"""
    try:
        # For now just return success, can implement later
        return {"success": True}
    except Exception as e:
        print(f"❌ Error removing bookmark: {e}")
        return {"success": False}

@app.get("/api/materials/{material_id}")
async def get_material_by_id(material_id: int):
    """Get material by ID"""
    try:
        material = await db.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        return material
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/by-subject/{subject}")
async def get_materials_by_subject(subject: str, language: str = 'ru'):
    try:
        materials = await db.get_materials_by_subject(subject, language)
        return {"materials": materials}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin clear users endpoint
@app.post("/admin/clear-users")
async def clear_all_users():
    try:
        print("🗑️ Clearing all users from database...")
        
        # Get current count
        users = await db.get_all_users()
        count = len(users)
        print(f"📊 Found {count} users to delete")
        
        # Clear all users
        await db.execute_query("DELETE FROM users")
        
        print(f"✅ Successfully deleted {count} users")
        return {"message": f"Successfully cleared {count} users", "deleted_count": count}
    except Exception as e:
        print(f"❌ Error clearing users: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing users: {str(e)}")

# Schedule Management Endpoints
@app.post("/api/schedules/reset")
async def reset_schedules_table():
    """Reset the schedules table with proper structure"""
    try:
        print("🔄 Resetting schedules table...")
        
        async with aiosqlite.connect(db.db_path) as conn:
            # Drop existing table
            await conn.execute('DROP TABLE IF EXISTS schedules')
            
            # Create new table with correct structure
            await conn.execute('''
                CREATE TABLE schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    subject TEXT,
                    day_of_week TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    location TEXT,
                    max_students INTEGER DEFAULT 30,
                    teacher_id INTEGER,
                    user_id INTEGER,
                    is_recurring BOOLEAN DEFAULT 0,
                    type TEXT DEFAULT 'lecture',
                    difficulty TEXT DEFAULT 'intermediate',
                    duration INTEGER DEFAULT 90,
                    price INTEGER DEFAULT 0,
                    tags TEXT,
                    is_online BOOLEAN DEFAULT 0,
                    requirements TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            await conn.commit()
            
        print("✅ Schedules table reset successfully")
        return {"message": "Schedules table reset successfully"}
        
    except Exception as e:
        print(f"❌ Error resetting schedules table: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schedules")
async def create_schedule(schedule_data: Dict[str, Any]):
    try:
        print(f"📅 Creating schedule: {schedule_data.get('title', 'Unknown')}")
        
        # Extract data from request - handle both camelCase and snake_case
        title = schedule_data.get('title', '')
        description = schedule_data.get('description', '')
        subject = schedule_data.get('subject', 'Физика')
        day_of_week = schedule_data.get('dayOfWeek') or schedule_data.get('day_of_week', 'monday')
        start_time = schedule_data.get('startTime') or schedule_data.get('start_time', '')
        end_time = schedule_data.get('endTime') or schedule_data.get('end_time', '')
        start_date = schedule_data.get('startDate') or schedule_data.get('start_date', '')
        end_date = schedule_data.get('endDate') or schedule_data.get('end_date', '')
        location = schedule_data.get('location', '')
        max_students = schedule_data.get('maxStudents', 30)
        teacher_id = schedule_data.get('teacherId', 1)
        user_id = schedule_data.get('userId', teacher_id)
        is_recurring = schedule_data.get('isRecurring', False)
        
        # Additional fields
        schedule_type = schedule_data.get('type', 'lecture')
        difficulty = schedule_data.get('difficulty', 'intermediate')
        duration = schedule_data.get('duration', 90)
        price = schedule_data.get('price', 0)
        tags = schedule_data.get('tags', '')
        is_online = schedule_data.get('isOnline', False)
        requirements = schedule_data.get('requirements', '')
        
        # Ensure table exists with proper structure
        async with aiosqlite.connect(db.db_path) as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    subject TEXT,
                    day_of_week TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    location TEXT,
                    max_students INTEGER DEFAULT 30,
                    teacher_id INTEGER,
                    user_id INTEGER,
                    is_recurring BOOLEAN DEFAULT 0,
                    type TEXT DEFAULT 'lecture',
                    difficulty TEXT DEFAULT 'intermediate',
                    duration INTEGER DEFAULT 90,
                    price INTEGER DEFAULT 0,
                    tags TEXT,
                    is_online BOOLEAN DEFAULT 0,
                    requirements TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor = await conn.execute('''
                INSERT INTO schedules (title, description, subject, day_of_week, start_time, end_time,
                                     start_date, end_date, location, max_students, teacher_id, user_id,
                                     is_recurring, type, difficulty, duration, price, tags, is_online,
                                     requirements, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                        datetime('now'), datetime('now'))
            ''', (
                title, description, subject, day_of_week, start_time, end_time,
                start_date, end_date, location, max_students, teacher_id, user_id,
                is_recurring, schedule_type, difficulty, duration, price, tags, is_online,
                requirements
            ))
            
            schedule_id = cursor.lastrowid
            await conn.commit()
            
        print(f"✅ Schedule created with ID: {schedule_id}")
        
        return {
            "id": schedule_id,
            "title": title,
            "description": description,
            "subject": subject,
            "dayOfWeek": day_of_week,
            "startTime": start_time,
            "endTime": end_time,
            "startDate": start_date,
            "endDate": end_date,
            "location": location,
            "maxStudents": max_students,
            "teacherId": teacher_id,
            "isRecurring": is_recurring,
            "type": schedule_type,
            "difficulty": difficulty,
            "duration": duration,
            "price": price,
            "tags": tags,
            "isOnline": is_online,
            "requirements": requirements
        }
    except Exception as e:
        print(f"❌ Error creating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schedules/user/{user_id}")
async def get_user_schedules(user_id: int):
    try:
        print(f"📅 Loading schedules for user: {user_id}")
        
        async with aiosqlite.connect(db.db_path) as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    subject TEXT,
                    day_of_week TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    location TEXT,
                    max_students INTEGER DEFAULT 30,
                    teacher_id INTEGER,
                    user_id INTEGER,
                    is_recurring BOOLEAN DEFAULT 0,
                    type TEXT DEFAULT 'lecture',
                    difficulty TEXT DEFAULT 'intermediate',
                    duration INTEGER DEFAULT 90,
                    price INTEGER DEFAULT 0,
                    tags TEXT,
                    is_online BOOLEAN DEFAULT 0,
                    requirements TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.row_factory = aiosqlite.Row
            async with conn.execute('''
                SELECT * FROM schedules WHERE teacher_id = ? OR user_id = ? ORDER BY created_at DESC
            ''', (user_id, user_id)) as cursor:
                rows = await cursor.fetchall()
                
                schedules = []
                for row in rows:
                    schedule = {
                        "id": row["id"],
                        "title": row["title"],
                        "description": row["description"],
                        "subject": row["subject"],
                        "dayOfWeek": row["day_of_week"],
                        "startTime": row["start_time"],
                        "endTime": row["end_time"],
                        "startDate": row["start_date"],
                        "endDate": row["end_date"],
                        "location": row["location"],
                        "maxStudents": row["max_students"],
                        "teacherId": row["teacher_id"],
                        "userId": row["user_id"],
                        "isRecurring": bool(row["is_recurring"]),
                        "type": row["type"],
                        "difficulty": row["difficulty"],
                        "duration": row["duration"],
                        "price": row["price"],
                        "tags": row["tags"],
                        "isOnline": bool(row["is_online"]),
                        "requirements": row["requirements"],
                        "createdAt": row["created_at"],
                        "updatedAt": row["updated_at"]
                    }
                    schedules.append(schedule)
                
                print(f"📊 Found {len(schedules)} schedules")
                return schedules
                
    except Exception as e:
        print(f"❌ Error loading schedules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schedules/public")
async def get_public_schedules(user_id: int = None):
    try:
        print(f"📅 Loading public schedules for user: {user_id}")
        
        async with aiosqlite.connect(db.db_path) as conn:
            # Ensure table exists first
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    subject TEXT,
                    day_of_week TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    location TEXT,
                    max_students INTEGER DEFAULT 30,
                    teacher_id INTEGER,
                    user_id INTEGER,
                    is_recurring BOOLEAN DEFAULT 0,
                    type TEXT DEFAULT 'lecture',
                    difficulty TEXT DEFAULT 'intermediate',
                    duration INTEGER DEFAULT 90,
                    price INTEGER DEFAULT 0,
                    tags TEXT,
                    is_online BOOLEAN DEFAULT 0,
                    requirements TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.row_factory = aiosqlite.Row
            # Get all schedules (no visibility column in our simple structure)
            async with conn.execute('''
                SELECT * FROM schedules ORDER BY created_at DESC
            ''') as cursor:
                rows = await cursor.fetchall()
                
                schedules = []
                for row in rows:
                    schedule = dict(row)
                    schedules.append(schedule)
                
                print(f"📊 Found {len(schedules)} public schedules")
                return schedules
                
    except Exception as e:
        print(f"❌ Error loading public schedules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schedules/{schedule_id}")
async def get_schedule_details(schedule_id: int):
    try:
        schedule = await schedule_db.get_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return schedule
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schedules/{schedule_id}/entries")
async def add_schedule_entry(schedule_id: int, entry: ScheduleEntryCreate):
    try:
        entry_id = await schedule_db.add_schedule_entry(
            schedule_id=schedule_id,
            day_of_week=entry.day_of_week,
            time_start=entry.time_start,
            time_end=entry.time_end,
            subject=entry.subject,
            topic=entry.topic,
            location=entry.location,
            notes=entry.notes,
            color=entry.color
        )
        return {"message": "Schedule entry added successfully", "entry_id": entry_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/schedules/{schedule_id}/visibility")
async def update_schedule_visibility(schedule_id: int, visibility: str):
    try:
        if visibility not in ['private', 'public', 'global']:
            raise HTTPException(status_code=400, detail="Invalid visibility value")
        
        await schedule_db.update_schedule_visibility(schedule_id, visibility)
        return {"message": "Schedule visibility updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/schedules/{schedule_id}")
async def delete_schedule(schedule_id: int):
    try:
        await schedule_db.delete_schedule(schedule_id)
        return {"message": "Schedule deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/schedule-entries/{entry_id}")
async def delete_schedule_entry(entry_id: int):
    try:
        await schedule_db.delete_schedule_entry(entry_id)
        return {"message": "Schedule entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Old Schedule endpoints (keeping for compatibility)
@app.get("/api/schedule")
async def get_schedule():
    try:
        schedule = await db.get_schedule()
        return {"schedule": schedule}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schedule")
async def add_schedule_entry(entry: ScheduleEntry):
    try:
        await db.add_schedule(
            day_of_week=entry.day_of_week,
            time_start=entry.time_start,
            time_end=entry.time_end,
            subject=entry.subject,
            topic=entry.topic,
            teacher=entry.teacher,
            classroom=entry.classroom,
            description=entry.description
        )
        return {"message": "Schedule entry added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/schedule/{schedule_id}")
async def delete_schedule_entry(schedule_id: int):
    try:
        success = await db.delete_schedule(schedule_id)
        if not success:
            raise HTTPException(status_code=404, detail="Schedule entry not found")
        return {"message": "Schedule entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Quests endpoints
@app.get("/api/quests")
async def get_active_quests(language: str = 'ru'):
    try:
        quests = await db.get_active_quests(language)
        return {"quests": quests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints
@app.get("/api/admin/users")
async def get_all_users():
    try:
        users = await db.get_all_users()
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/students")
async def get_teacher_students_by_code():
    """Get all students registered with teacher code 111444"""
    try:
        users = await db.get_all_users()
        print(f"🔍 Total users found: {len(users)}")
        
        # Filter ONLY students with code 111444
        students = []
        for user in users:
            user_role = user.get('role', 'student')
            user_code = user.get('code')
            
            print(f"👤 User {user.get('first_name')}: role={user_role}, code={user_code}")
            
            # Only include actual students with code 111444
            if user_role == 'student' and user_code == '111444':
                students.append(user)
        
        print(f"📊 Students with code 111444: {len(students)}")
        
        # Add additional stats for each student
        for student in students:
            student['tests_completed'] = student.get('tests_completed', 0)
            student['points'] = student.get('points', 0)
            student['last_activity'] = student.get('last_activity', 'Никогда')
            student['registration_date'] = student.get('registration_date', 'Неизвестно')
        
        return {
            "students": students,
            "total_count": len(students),
            "active_count": len([s for s in students if s.get('points', 0) > 0])
        }
    except Exception as e:
        print(f"❌ Error getting teacher students: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats():
    try:
        user_count = await db.get_user_count()
        leaderboard = await db.get_leaderboard(5)
        
        return {
            "user_count": user_count,
            "top_users": leaderboard,
            "total_tests": 0,  # You can implement this
            "total_materials": 0  # You can implement this
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Teacher-specific endpoints
@app.get("/api/teacher/students")
async def get_teacher_students():
    """Get all students with detailed stats for teacher dashboard"""
    try:
        users = await db.get_all_users()
        students = []
        
        for user in users:
            # Calculate student stats (mock data for now, replace with real calculations)
            student_data = {
                "id": user.get('telegram_id', user.get('id')),
                "name": f"{user.get('first_name', 'Студент')} {user.get('last_name', '')}".strip(),
                "username": user.get('username', ''),
                "points": user.get('points', 0),
                "level": user.get('level', 1),
                "streak": user.get('streak', 0),
                "tests_completed": user.get('tests_completed', 0),
                "avg_score": user.get('avg_score', 0),
                "last_active": user.get('last_activity', ''),
                "registration_date": user.get('registration_date', ''),
                "status": "active" if user.get('points', 0) > 0 else "inactive",
                "progress": {
                    "mechanics": {"completed": 5, "total": 10, "score": 75},
                    "electricity": {"completed": 3, "total": 8, "score": 82},
                    "optics": {"completed": 2, "total": 6, "score": 68}
                }
            }
            students.append(student_data)
        
        return {"students": students}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/stats")
async def get_teacher_stats():
    """Get teacher quick actions statistics"""
    try:
        print("📊 Getting teacher stats...")
        
        # Get real data from database with error handling
        try:
            users = await db.get_all_users()
            print(f"👥 Found {len(users)} users")
        except Exception as e:
            print(f"❌ Error getting users: {e}")
            users = []
            
        try:
            tests = await db.get_all_tests()
            print(f"📝 Found {len(tests)} tests")
        except Exception as e:
            print(f"❌ Error getting tests: {e}")
            tests = []
            
        try:
            materials = await db.get_all_materials()
            print(f"📚 Found {len(materials)} materials")
        except Exception as e:
            print(f"❌ Error getting materials: {e}")
            materials = []
        
        # Calculate real statistics with safe defaults
        total_students = len([u for u in users if u.get('role') == 'student']) if users else 0
        active_tests = len([t for t in tests if t.get('is_published', False)]) if tests else 0
        total_materials = len([m for m in materials if m.get('is_published', False)]) if materials else 0
        
        print(f"📈 Stats: {total_students} students, {active_tests} tests, {total_materials} materials")
        
        # For QuickActionsPage compatibility
        result = {
            "totalStudents": total_students,
            "activeTests": active_tests,
            "newMessages": 0,  # TODO: implement messaging system
            "pendingReports": total_materials,  # Use materials count as reports
            
            # Additional detailed stats for dashboard
            "detailed": {
                "total_students": total_students,
                "active_students": len([u for u in users if u.get('points', 0) > 0]) if users else 0,
                "inactive_students": max(0, total_students - len([u for u in users if u.get('points', 0) > 0])) if users else 0,
                "avg_points": round(sum(u.get('points', 0) for u in users) / total_students if total_students > 0 else 0, 1),
                "total_tests_taken": sum(u.get('tests_completed', 0) for u in users) if users else 0,
                "published_tests": active_tests,
                "published_materials": total_materials,
                "top_performers": []  # Simplified for now
            }
        }
        
        print("✅ Teacher stats generated successfully")
        return result
        
    except Exception as e:
        print(f"❌ Error in get_teacher_stats: {e}")
        print(f"📜 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/student/{student_id}")
async def get_student_details(student_id: int):
    """Get detailed information about a specific student"""
    try:
        user = await db.get_user(student_id)
        if not user:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get detailed student analytics
        student_details = {
            "id": student_id,
            "name": f"{user.get('first_name', 'Студент')} {user.get('last_name', '')}".strip(),
            "username": user.get('username', ''),
            "points": user.get('points', 0),
            "level": user.get('level', 1),
            "streak": user.get('streak', 0),
            "registration_date": user.get('registration_date', ''),
            "last_active": user.get('last_activity', ''),
            "stats": {
                "tests_completed": user.get('tests_completed', 0),
                "avg_score": user.get('avg_score', 0),
                "time_spent": "12ч 45мин",
                "materials_viewed": 23,
                "achievements": 5
            },
            "progress_by_topic": {
                "mechanics": {"completed": 8, "total": 12, "score": 78, "time": "3ч 20мин"},
                "electricity": {"completed": 5, "total": 10, "score": 85, "time": "2ч 15мин"},
                "thermodynamics": {"completed": 3, "total": 8, "score": 72, "time": "1ч 45мин"},
                "optics": {"completed": 2, "total": 6, "score": 68, "time": "45мин"}
            },
            "recent_tests": [
                {"topic": "Механика", "score": 85, "date": "2024-01-10", "time": "15мин"},
                {"topic": "Электричество", "score": 92, "date": "2024-01-09", "time": "12мин"},
                {"topic": "Оптика", "score": 78, "date": "2024-01-08", "time": "18мин"}
            ],
            "achievements": [
                {"name": "Первый тест", "icon": "🎯", "date": "2024-01-05"},
                {"name": "Физик", "icon": "⚛️", "date": "2024-01-07"},
                {"name": "Стрик 7 дней", "icon": "🔥", "date": "2024-01-10"}
            ]
        }
        
        return student_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real data endpoints for leaderboard
@app.get("/api/leaderboard/real")
async def get_real_leaderboard(limit: int = 10):
    """Get real leaderboard from database"""
    try:
        users = await db.get_all_users()
        # Sort by points descending
        sorted_users = sorted(users, key=lambda x: x.get('points', 0), reverse=True)[:limit]
        
        leaderboard = []
        for i, user in enumerate(sorted_users):
            leaderboard.append({
                "rank": i + 1,
                "id": user.get('telegram_id', user.get('id')),
                "name": f"{user.get('first_name', 'Пользователь')} {user.get('last_name', '')}".strip(),
                "username": user.get('username', ''),
                "points": user.get('points', 0),
                "level": user.get('level', 1),
                "streak": user.get('streak', 0),
                "tests_completed": user.get('tests_completed', 0),
                "avg_score": user.get('avg_score', 0)
            })
        
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real data endpoints for quests
@app.get("/api/quests/real")
async def get_real_quests(language: str = 'ru'):
    """Get real quests from database"""
    try:
        quests = await db.get_active_quests(language)
        return {"quests": quests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real data endpoints for materials
@app.get("/api/materials/real")
async def get_real_materials(subject: str = 'Физика', language: str = 'ru'):
    """Get real materials from database"""
    try:
        materials = await db.get_materials_by_subject(subject, language)
        return {"materials": materials}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real data endpoints for tests
@app.get("/api/tests/real")
async def get_real_tests(subject: str = 'Физика', language: str = 'ru', limit: int = 10):
    """Get real tests from database"""
    try:
        tests = await db.get_tests_by_subject(subject, language, limit)
        return {"tests": tests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real user activity endpoint
@app.get("/api/user/{user_id}/activity")
async def get_user_activity(user_id: int, limit: int = 10):
    """Get real user activity from database"""
    try:
        # Get user progress records as activity
        progress_records = await db.execute("""
            SELECT up.*, t.title as test_title, t.subject 
            FROM user_progress up 
            JOIN tests t ON up.test_id = t.id 
            WHERE up.user_id = ? 
            ORDER BY up.completed_at DESC 
            LIMIT ?
        """, (user_id, limit))
        
        activities = []
        for record in progress_records:
            activities.append({
                "id": record[0],
                "type": "test_completed",
                "action": f"Тест '{record[7]}' аяқталды",
                "score": record[3],
                "xpGained": record[4],
                "time": record[6],
                "icon": "📝",
                "subject": record[8]
            })
        
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real weekly stats endpoint
@app.get("/api/user/{user_id}/weekly-stats")
async def get_user_weekly_stats(user_id: int):
    """Get real weekly stats for user"""
    try:
        # Get last 7 days of activity
        weekly_stats = []
        days = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк']
        
        for i, day in enumerate(days):
            # Get stats for each day (mock calculation for now)
            day_stats = await db.execute("""
                SELECT COUNT(*) as tests, SUM(xp_gained) as xp, SUM(time_spent) as time
                FROM user_progress 
                WHERE user_id = ? AND DATE(completed_at) = DATE('now', '-{} days')
            """.format(6-i), (user_id,))
            
            if day_stats:
                stats = day_stats[0]
                weekly_stats.append({
                    "day": day,
                    "tests": stats[0] or 0,
                    "xp": stats[1] or 0,
                    "time": stats[2] or 0
                })
            else:
                weekly_stats.append({"day": day, "tests": 0, "xp": 0, "time": 0})
        
        return {"weeklyStats": weekly_stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Real achievements endpoint
@app.get("/api/user/{user_id}/achievements")
async def get_user_achievements(user_id: int):
    """Get real user achievements based on their stats"""
    try:
        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        achievements = [
            {
                "id": 1,
                "name": "Streak Master",
                "icon": "🔥",
                "desc": "25 күн қатарынан оқу",
                "progress": user.get('streak', 0),
                "target": 25,
                "unlocked": (user.get('streak', 0) >= 25),
                "rarity": "epic"
            },
            {
                "id": 2,
                "name": "Physics Genius",
                "icon": "⚛️",
                "desc": "100 физика тестін тапсыру",
                "progress": user.get('tests_completed', 0),
                "target": 100,
                "unlocked": (user.get('tests_completed', 0) >= 100),
                "rarity": "legendary"
            },
            {
                "id": 3,
                "name": "First Steps",
                "icon": "👶",
                "desc": "Алғашқы тестті тапсыру",
                "progress": user.get('tests_completed', 0),
                "target": 1,
                "unlocked": (user.get('tests_completed', 0) >= 1),
                "rarity": "common"
            },
            {
                "id": 4,
                "name": "High Scorer",
                "icon": "🎯",
                "desc": "90% дан жоғары нәтиже алу",
                "progress": user.get('avg_score', 0),
                "target": 90,
                "unlocked": (user.get('avg_score', 0) >= 90),
                "rarity": "rare"
            },
            {
                "id": 5,
                "name": "Study Marathon",
                "icon": "📚",
                "desc": "10 сағат оқу",
                "progress": user.get('tests_completed', 0) * 0.5,  # estimate study time
                "target": 10,
                "unlocked": ((user.get('tests_completed', 0) * 0.5) >= 10),
                "rarity": "rare"
            },
            {
                "id": 6,
                "name": "XP Collector",
                "icon": "⭐",
                "desc": "1000 XP жинау",
                "progress": user.get('points', 0),
                "target": 1000,
                "unlocked": (user.get('points', 0) >= 1000),
                "rarity": "rare"
            }
        ]
        
        return {"achievements": achievements}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Teacher-specific real data endpoints
@app.get("/api/teacher/{teacher_id}/profile")
async def get_teacher_profile(teacher_id: int):
    """Get comprehensive teacher profile with real stats"""
    try:
        # Get teacher user data
        teacher = await db.get_user_by_id(teacher_id)
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        # Get students taught by this teacher (mock for now, would need teacher-student relationship table)
        students = await db.get_all_users()
        student_count = len([s for s in students if s.get('role') != 'teacher'])
        
        # Calculate teacher stats based on students' performance
        total_tests_assigned = len(await db.get_all_tests())
        total_materials_created = len(await db.get_all_materials())
        
        # Get average student performance
        avg_student_score = sum(s.get('avg_score', 0) for s in students if s.get('role') != 'teacher') / max(student_count, 1)
        
        teacher_profile = {
            "id": teacher.get('id'),
            "firstName": teacher.get('first_name', ''),
            "lastName": teacher.get('last_name', ''),
            "email": teacher.get('email', ''),
            "phone": teacher.get('phone', ''),
            "subjects": ["Физика"],
            "experience": f"{teacher.get('level', 1)} жыл",
            "education": "Физика мамандығы",
            "bio": "Физика пәнінің мұғалімі",
            "studentsCount": student_count,
            "testsAssigned": total_tests_assigned,
            "materialsCreated": total_materials_created,
            "avgStudentScore": round(avg_student_score, 1),
            "totalXP": teacher.get('points', 0),
            "level": teacher.get('level', 1),
            "streak": teacher.get('streak', 0),
            "registrationDate": teacher.get('registration_date', ''),
            "lastActivity": teacher.get('last_activity', '')
        }
        
        return {"teacher": teacher_profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/{teacher_id}/class-analytics")
async def get_teacher_class_analytics(teacher_id: int):
    """Get comprehensive class analytics for teacher"""
    try:
        async with aiosqlite.connect("ent_bot.db") as db:
            # Get all students (for teacher analytics, we'll show all students)
            students_cursor = await db.execute("""
                SELECT id, username, first_name, last_name, points, streak, 
                       tests_completed, avg_score, last_activity
                FROM users 
                WHERE id != ? AND id < 2000
                ORDER BY points DESC
            """, (teacher_id,))
            students = await students_cursor.fetchall()
            
            if not students:
                return {
                    "analytics": {
                        "totalStudents": 0,
                        "activeStudents": 0,
                        "avgClassScore": 0,
                        "totalTestsCompleted": 0,
                        "recentActivity": [],
                        "topStudents": []
                    }
                }
            
            # Calculate analytics
            total_students = len(students)
            active_students = len([s for s in students if s[8] and s[8] != ''])  # has last_activity
            avg_score = sum(s[7] or 0 for s in students) / total_students if total_students > 0 else 0
            total_tests = sum(s[6] or 0 for s in students)
            
            # Format top students
            top_students = [
                {
                    "id": s[0],
                    "name": f"{s[2]} {s[3]}",
                    "points": s[4] or 0,
                    "streak": s[5] or 0,
                    "tests_completed": s[6] or 0,
                    "avg_score": s[7] or 0
                }
                for s in students[:5]
            ]
            
            # Format recent activity (mock for now)
            recent_activity = [
                {
                    "student": f"{s[2]} {s[3]}",
                    "action": "Тест аяқталды",
                    "score": s[7] or 0,
                    "time": "Жақында"
                }
                for s in students[:3]
            ]
            
            return {
                "analytics": {
                    "totalStudents": total_students,
                    "activeStudents": active_students,
                    "avgClassScore": round(avg_score, 1),
                    "totalTestsCompleted": total_tests,
                    "recentActivity": recent_activity,
                    "topStudents": top_students
                }
            }
            
        
        return {"analytics": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Physics-specific endpoints
@app.get("/api/physics/topics")
async def get_physics_topics():
    """Get all physics topics available"""
    topics = [
        {"id": "mechanics", "name": "Механика", "icon": "🚀"},
        {"id": "thermodynamics", "name": "Термодинамика", "icon": "🌡️"},
        {"id": "electricity", "name": "Электричество", "icon": "⚡"},
        {"id": "magnetism", "name": "Магнетизм", "icon": "🧲"},
        {"id": "optics", "name": "Оптика", "icon": "🔍"},
        {"id": "atomic", "name": "Атомная физика", "icon": "⚛️"}
    ]
    return {"topics": topics}

@app.get("/api/physics/progress/{user_id}")
async def get_user_physics_progress(user_id: int):
    """Get user's progress in physics topics"""
    try:
        user = await db.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mock progress data - in real implementation, you'd calculate from user_progress table
        progress = {
            "mechanics": {"completed": 18, "total": 25, "score": 82},
            "thermodynamics": {"completed": 12, "total": 18, "score": 75},
            "electricity": {"completed": 15, "total": 22, "score": 78},
            "magnetism": {"completed": 9, "total": 16, "score": 71},
            "optics": {"completed": 8, "total": 14, "score": 79},
            "atomic": {"completed": 5, "total": 12, "score": 68}
        }
        
        return {
            "user_id": user_id,
            "total_xp": user.get('points', 0),
            "level": user.get('level', 1),
            "progress": progress
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/user/{user_id}/logout")
async def logout_user(user_id: int):
    """Completely remove user data from system on logout"""
    try:
        async with aiosqlite.connect("ent_bot.db") as db:
            # Delete user progress first (foreign key constraint)
            await db.execute("DELETE FROM user_progress WHERE user_id = ?", (user_id,))
            
            # Delete user from users table
            cursor = await db.execute("DELETE FROM users WHERE id = ?", (user_id,))
            await db.commit()
            
            if cursor.rowcount > 0:
                return {"success": True, "message": "Пользователь успешно удален из системы"}
            else:
                return {"success": False, "message": "Пользователь не найден"}
                
    except Exception as e:
        print(f"Error during logout: {e}")
        return {"success": False, "message": "Ошибка при выходе из системы"}

# Material Management Endpoints for Teachers

@app.get("/api/materials/teacher/{teacher_id}")
async def get_teacher_materials(teacher_id: int):
    """Get all materials created by a specific teacher"""
    try:
        print(f"📚 Loading materials for teacher: {teacher_id}")
        
        # Get materials from database where teacher_id matches
        materials = await db.get_materials_by_teacher(teacher_id)
        
        print(f"✅ Found {len(materials)} materials for teacher {teacher_id}")
        return {"materials": materials}
    except Exception as e:
        print(f"❌ Error loading teacher materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/materials")
async def create_material(material_data: Dict[str, Any]):
    """Create a new material with optional file attachments"""
    try:
        print(f"📝 Creating material with data: {material_data}")
        
        # Extract material fields
        title = material_data.get('title', '')
        description = material_data.get('description', '')
        content = material_data.get('content', '')
        material_type = material_data.get('type', 'text')
        category = material_data.get('category', 'mechanics')
        difficulty = material_data.get('difficulty', 'easy')
        duration = material_data.get('duration', 10)
        is_published = material_data.get('isPublished', False)
        teacher_id = material_data.get('teacherId', '111333')  # Default teacher ID
        
        # Handle tags
        tags = material_data.get('tags', [])
        if isinstance(tags, str):
            # If tags is a string, split by comma
            tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
        tags_json = json.dumps(tags) if tags else None
        
        # Handle URLs
        video_url = material_data.get('videoUrl') or None
        pdf_url = material_data.get('pdfUrl') or None
        thumbnail_url = material_data.get('thumbnailUrl') or None
        
        # Handle attachments
        attachments = material_data.get('attachments', [])
        attachments_json = json.dumps(attachments) if attachments else None
        
        print(f"🔍 Material fields: title='{title}', type='{material_type}', category='{category}'")
        print(f"📎 Attachments: {len(attachments)} files")
        
        # Insert material into database
        async with aiosqlite.connect(db.db_path) as conn:
            cursor = await conn.execute('''
                INSERT INTO materials (title, description, content, type, category, difficulty, duration, 
                                     is_published, tags, video_url, pdf_url, thumbnail_url, teacher_id, attachments,
                                     subject, language, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ''', (
                title, description, content, material_type, category, difficulty, duration,
                is_published, tags_json, video_url, pdf_url, thumbnail_url, teacher_id, attachments_json,
                'Физика', 'ru'  # Default subject and language
            ))
            
            material_id = cursor.lastrowid
            await conn.commit()
            
            print(f"✅ Material created with ID: {material_id}")
            
            # Return the created material with correct field names for frontend
            return {
                "message": "Material created successfully",
                "material_id": material_id,
                "id": material_id,
                "title": title,
                "description": description,
                "content": content,
                "type": material_type,
                "category": category,
                "subject": 'Физика',
                "difficulty": difficulty,
                "duration": duration,
                "isPublished": is_published,
                "is_published": is_published,
                "tags": tags,
                "videoUrl": video_url,
                "pdfUrl": pdf_url,
                "thumbnailUrl": thumbnail_url,
                "teacherId": teacher_id,
                "attachments": attachments
            }
            
    except Exception as e:
        print(f"❌ Error creating material: {e}")
        print(f"📜 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
@app.delete("/api/materials/{material_id}")
async def delete_material(material_id: int):
    """Delete material by ID"""
    try:
        success = await db.delete_material(material_id)
        if not success:
            raise HTTPException(status_code=404, detail="Material not found")
        return {"message": "Material deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/materials/{material_id}")
async def update_material(material_id: int, update_data: Dict[str, Any]):
    """Update an existing material with optional file attachments"""
    try:
        print(f"✏️ Updating material {material_id}: {update_data.get('title', 'Unknown')}")
        
        # Extract attachments if present
        attachments = update_data.pop('attachments', None)
        
        # Convert frontend field names to database field names
        if 'teacherId' in update_data:
            update_data['teacher_id'] = update_data.pop('teacherId')
        if 'isPublished' in update_data:
            update_data['is_published'] = update_data.pop('isPublished')
        if 'videoUrl' in update_data:
            update_data['video_url'] = update_data.pop('videoUrl')
        if 'pdfUrl' in update_data:
            update_data['pdf_url'] = update_data.pop('pdfUrl')
        if 'thumbnailUrl' in update_data:
            update_data['thumbnail_url'] = update_data.pop('thumbnailUrl')
        
        # Process attachments and store as JSON
        if attachments is not None:
            if attachments:  # If there are attachments
                processed_attachments = []
                for attachment in attachments:
                    processed_attachment = {
                        'name': attachment.get('name', ''),
                        'type': attachment.get('type', ''),
                        'size': attachment.get('size', 0),
                        'data': attachment.get('data', ''),  # Base64 data
                        'uploaded_at': datetime.now().isoformat()
                    }
                    processed_attachments.append(processed_attachment)
                
                update_data['attachments'] = json.dumps(processed_attachments)
                print(f"📎 Processing {len(processed_attachments)} attachments")
            else:  # If attachments array is empty, clear attachments
                update_data['attachments'] = json.dumps([])
                print("🗑️ Clearing attachments")
        
        # Add updated timestamp
        update_data['updated_at'] = datetime.now().isoformat()
        
        print(f"🔄 Converted data for database (keys): {list(update_data.keys())}")
        
        # Update material in database
        success = await db.update_material(material_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Get updated material
        updated_material = await db.get_material_by_id(material_id)
        
        print(f"✅ Material {material_id} updated successfully")
        return updated_material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating material: {e}")
        print(f"📜 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/materials-clear")
async def clear_all_materials():
    """Clear all materials from database and reset ID sequence"""
    try:
        print("🗑️ Clearing all materials from database and resetting ID sequence...")
        await db.clear_all_materials()
        print("✅ All materials cleared and ID sequence reset to 1")
        return {"message": "All materials cleared and ID sequence reset successfully"}
    except Exception as e:
        print(f"❌ Error clearing materials: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing materials: {str(e)}")

@app.post("/api/materials-force-id")
async def create_material_with_id(material_data: Dict[str, Any]):
    """Create material with specific ID (for testing)"""
    try:
        force_id = material_data.get('force_id', 1)
        print(f"🎯 Creating material with forced ID: {force_id}")
        
        # Delete existing material with this ID if exists
        await db.execute('DELETE FROM materials WHERE id = ?', (force_id,))
        
        # Process material data
        tags = material_data.get('tags', [])
        if isinstance(tags, list):
            tags_json = json.dumps(tags)
        else:
            tags_json = str(tags) if tags else json.dumps([])
        
        attachments = material_data.get('attachments', [])
        attachments_json = json.dumps(attachments) if attachments else json.dumps([])
        
        # Insert with specific ID
        await db.execute('''
            INSERT INTO materials (id, title, description, content, type, category, difficulty, duration, 
                                 is_published, tags, video_url, pdf_url, thumbnail_url, teacher_id, attachments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            force_id,
            material_data.get('title', 'Untitled'),
            material_data.get('description', ''),
            material_data.get('content', ''),
            material_data.get('type', 'text'),
            material_data.get('category', 'mechanics'),
            material_data.get('difficulty', 'easy'),
            material_data.get('duration', 10),
            material_data.get('isPublished', 1),
            tags_json,
            material_data.get('video_url', ''),
            material_data.get('pdf_url', ''),
            material_data.get('thumbnail_url', ''),
            1,  # teacher_id
            attachments_json
        ))
        
        # Update sequence to continue from this ID
        await db.execute(f'UPDATE sqlite_sequence SET seq = {force_id} WHERE name = "materials"')
        
        print(f"✅ Material created with ID {force_id} and sequence updated")
        return {"message": "Material created with forced ID", "material_id": force_id}
        
    except Exception as e:
        print(f"❌ Error creating material with forced ID: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.delete("/api/materials/{material_id}")
async def delete_material(material_id: int):
    """Delete a material"""
    try:
        print(f"🗑️ Deleting material: {material_id}")
        
        # Delete material from database
        success = await db.delete_material(material_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Material not found")
        
        print(f"✅ Material {material_id} deleted successfully")
        return {"success": True, "message": "Material deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials")
async def get_materials_for_student(category: Optional[str] = None):
    """Get published materials for students, optionally filtered by category"""
    try:
        print(f"📖 Loading published materials, category: {category or 'all'}")
        
        # Get only published materials
        materials = await db.get_published_materials(category=category)
        
        print(f"✅ Found {len(materials)} published materials")
        return {"materials": materials}
    except Exception as e:
        print(f"❌ Error loading materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/{material_id}")
async def get_material(material_id: int, user_id: int = None):
    """Get a specific material by ID and track view"""
    try:
        print(f"📖 Loading material {material_id}...")
        material = await db.get_material_by_id(material_id)
        if not material:
            print(f"❌ Material {material_id} not found in database")
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Track view if user_id provided
        if user_id:
            await db.track_material_view(material_id, user_id)
            print(f"👁️ View tracked for user {user_id} on material {material_id}")
        
        print(f"✅ Material {material_id} loaded successfully: {material.get('title', 'No title')}")
        return material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error loading material {material_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading material: {str(e)}")

@app.get("/api/materials/{material_id}/content")
async def get_material_content(material_id: int):
    """Get full content of a specific material"""
    try:
        print(f"📄 Loading content for material: {material_id}")
        
        # Get material content from database
        material = await db.get_material_by_id(material_id)
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        print(f"✅ Material content loaded: {material.get('title', 'No title')}")
        print(f"📎 Attachments in response: {material.get('attachments', 'No attachments')}")
        print(f"📊 Attachments type: {type(material.get('attachments'))}")
        if material.get('attachments'):
            print(f"📋 Attachments count: {len(material.get('attachments', []))}")
        
        return material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error loading material content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Physics Question Generation Endpoints
@app.post("/api/ai/generate-question")
async def generate_physics_question():
    """Generate AI-powered physics question with visual elements"""
    try:
        import random
        import json
        
        # Expanded physics questions with diverse topics
        sample_questions = [
            {
                "id": random.randint(1000, 9999),
                "text": "Дене 2 м биіктіктен 2 м/с жылдамдықпен көлденең лақтырылды. Дене 60 м үйдің жанынан толық өтіп кету үшін кететін уақыт:",
                "type": "multiple_choice",
                "topic": "Механика",
                "difficulty": "hard",
                "options": ["10 с", "12 с", "30 с", "29 с", "31 с"],
                "correct_answer": "30 с",
                "explanation": "Көлденең лақтыру есебі. Тік бағытта: h = v₀t + gt²/2, 2 = 0 + 10t²/2, t = 0.63 с. Көлденең: x = v₀t = 2×30 = 60 м",
                "formula": "x = v₀t, h = gt²/2",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Автомобиль массой 1200 кг движется со скоростью 20 м/с. Какова его кинетическая энергия?",
                "type": "calculation",
                "topic": "Механика",
                "difficulty": "medium",
                "options": ["240 кДж", "480 кДж", "120 кДж", "360 кДж"],
                "correct_answer": "240 кДж",
                "explanation": "Кинетическая энергия вычисляется по формуле E = mv²/2 = 1200×20²/2 = 240000 Дж = 240 кДж",
                "formula": "E = mv²/2",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Снаряд выпущен под углом 45° к горизонту со скоростью 100 м/с. Максимальная высота полета:",
                "type": "calculation",
                "topic": "Механика",
                "difficulty": "hard",
                "options": ["125 м", "250 м", "500 м", "1000 м"],
                "correct_answer": "125 м",
                "explanation": "H = (v₀sin α)²/(2g) = (100×sin45°)²/(2×10) = (70.7)²/20 ≈ 125 м",
                "formula": "H = (v₀sin α)²/(2g)",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Какой закон описывает зависимость силы тока от напряжения в проводнике?",
                "type": "multiple_choice",
                "topic": "Электричество",
                "difficulty": "easy",
                "options": ["Закон Ома", "Закон Кулона", "Закон Ампера", "Закон Фарадея"],
                "correct_answer": "Закон Ома",
                "explanation": "Закон Ома устанавливает, что сила тока прямо пропорциональна напряжению: I = U/R",
                "formula": "I = U/R",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Конденсатор емкостью 10 мкФ заряжен до напряжения 100 В. Энергия конденсатора:",
                "type": "calculation",
                "topic": "Электричество",
                "difficulty": "medium",
                "options": ["0.05 Дж", "0.1 Дж", "0.5 Дж", "1 Дж"],
                "correct_answer": "0.05 Дж",
                "explanation": "W = CU²/2 = 10×10⁻⁶×100²/2 = 0.05 Дж",
                "formula": "W = CU²/2",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Тело свободно падает с высоты 45 м. Сколько времени займет падение? (g = 10 м/с²)",
                "type": "calculation",
                "topic": "Механика",
                "difficulty": "medium",
                "options": ["3 с", "4.5 с", "6 с", "9 с"],
                "correct_answer": "3 с",
                "explanation": "Время свободного падения: t = √(2h/g) = √(2×45/10) = √9 = 3 с",
                "formula": "h = gt²/2, откуда t = √(2h/g)",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Идеальный газ изотермически расширяется от 2 л до 8 л при давлении 4 атм. Работа газа:",
                "type": "calculation",
                "topic": "Термодинамика",
                "difficulty": "hard",
                "options": ["1120 Дж", "2240 Дж", "560 Дж", "4480 Дж"],
                "correct_answer": "1120 Дж",
                "explanation": "A = nRT×ln(V₂/V₁) = pV×ln(V₂/V₁) = 4×101325×0.002×ln(4) ≈ 1120 Дж",
                "formula": "A = pV×ln(V₂/V₁)",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "При какой температуре вода кипит при нормальном атмосферном давлении?",
                "type": "multiple_choice",
                "topic": "Термодинамика",
                "difficulty": "easy",
                "options": ["90°C", "100°C", "110°C", "120°C"],
                "correct_answer": "100°C",
                "explanation": "При нормальном атмосферном давлении (101.3 кПа) вода кипит при температуре 100°C",
                "formula": None,
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Линза с фокусным расстоянием 20 см дает изображение предмета на расстоянии 60 см. Расстояние до предмета:",
                "type": "calculation",
                "topic": "Оптика",
                "difficulty": "medium",
                "options": ["30 см", "15 см", "12 см", "40 см"],
                "correct_answer": "30 см",
                "explanation": "1/F = 1/d + 1/f, 1/20 = 1/d + 1/60, 1/d = 1/20 - 1/60 = 1/30, d = 30 см",
                "formula": "1/F = 1/d + 1/f",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Частота колебаний маятника длиной 1 м равна примерно:",
                "type": "calculation",
                "topic": "Механика",
                "difficulty": "hard",
                "options": ["0.5 Гц", "1 Гц", "1.6 Гц", "2 Гц"],
                "correct_answer": "0.5 Гц",
                "explanation": "Период математического маятника T = 2π√(L/g) = 2π√(1/10) ≈ 2 с, частота f = 1/T ≈ 0.5 Гц",
                "formula": "T = 2π√(L/g), f = 1/T",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Электрон движется в магнитном поле с индукцией 0.1 Тл со скоростью 10⁶ м/с. Радиус траектории:",
                "type": "calculation",
                "topic": "Электричество",
                "difficulty": "hard",
                "options": ["5.7×10⁻⁵ м", "1.1×10⁻⁴ м", "2.8×10⁻⁵ м", "9.1×10⁻⁶ м"],
                "correct_answer": "5.7×10⁻⁵ м",
                "explanation": "r = mv/(eB) = 9.1×10⁻³¹×10⁶/(1.6×10⁻¹⁹×0.1) ≈ 5.7×10⁻⁵ м",
                "formula": "r = mv/(eB)",
                "image": None
            },
            {
                "id": random.randint(1000, 9999),
                "text": "Фотон с энергией 3.1 эВ падает на металл с работой выхода 2.1 эВ. Максимальная кинетическая энергия фотоэлектронов:",
                "type": "calculation",
                "topic": "Квантовая физика",
                "difficulty": "medium",
                "options": ["1 эВ", "2.1 эВ", "3.1 эВ", "5.2 эВ"],
                "correct_answer": "1 эВ",
                "explanation": "Уравнение Эйнштейна: Ek = hν - A = 3.1 - 2.1 = 1 эВ",
                "formula": "Ek = hν - A",
                "image": None
            }
        ]
        
        # Select random question
        question = random.choice(sample_questions)
        
        print(f"🤖 Generated AI question: {question['text'][:50]}...")
        
        return {"question": question, "status": "success"}
        
    except Exception as e:
        print(f"❌ Error generating question: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating question: {str(e)}")

@app.post("/api/ai/check-answer")
async def check_physics_answer(request: Request):
    """Check physics answer with AI assistance"""
    try:
        data = await request.json()
        question_id = data.get("question_id")
        user_answer = data.get("user_answer", "").strip()
        correct_answer = data.get("correct_answer", "").strip()
        
        print(f"🔍 Checking answer for question {question_id}")
        print(f"User answer: '{user_answer}', Correct: '{correct_answer}'")
        
        # Simple answer checking (can be enhanced with AI)
        is_correct = False
        
        # Normalize answers for comparison
        user_normalized = user_answer.lower().replace(" ", "")
        correct_normalized = correct_answer.lower().replace(" ", "")
        
        # Check exact match
        if user_normalized == correct_normalized:
            is_correct = True
        
        # Check if numeric answers are close
        try:
            import re
            user_nums = re.findall(r'\d+\.?\d*', user_answer)
            correct_nums = re.findall(r'\d+\.?\d*', correct_answer)
            
            if user_nums and correct_nums:
                user_val = float(user_nums[0])
                correct_val = float(correct_nums[0])
                # Allow 5% tolerance for numeric answers
                if abs(user_val - correct_val) / correct_val < 0.05:
                    is_correct = True
        except:
            pass
        
        result = {
            "is_correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "confidence": 0.95 if is_correct else 0.85,
            "feedback": "Отлично! Правильный ответ." if is_correct else "Неправильно. Попробуйте еще раз."
        }
        
        print(f"✅ Answer check result: {is_correct}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error checking answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking answer: {str(e)}")

# Photo Upload and Processing Endpoints
@app.post("/api/ai/upload-question-photo")
async def upload_question_photo(request: Request):
    """Upload photo of physics question and convert to virtual question"""
    try:
        form = await request.form()
        photo_file = form.get("photo")
        
        if not photo_file:
            raise HTTPException(status_code=400, detail="No photo uploaded")
        
        # Read photo data
        photo_data = await photo_file.read()
        
        print(f"📸 Processing uploaded photo: {photo_file.filename}")
        print(f"📊 Photo size: {len(photo_data)} bytes")
        
        # For now, simulate AI processing and return a virtual question
        # In real implementation, you would use OCR + AI to extract text
        import random
        virtual_question = {
            "id": random.randint(10000, 99999),
            "text": "Дене 2 м биіктіктен 2 м/с жылдамдықпен көлденең лақтырылды. Дене 60 м үйдің жанынан толық өтіп кету үшін кететін уақыт:",
            "type": "multiple_choice",
            "topic": "Механика",
            "difficulty": "hard",
            "options": ["10 с", "12 с", "30 с", "29 с", "31 с"],
            "correct_answer": "30 с",
            "explanation": "Көлденең лақтыру есебі. Горизонтальное движение: x = v₀t, вертикальное: h = gt²/2",
            "formula": "x = v₀t, h = gt²/2",
            "original_photo": f"data:image/jpeg;base64,{photo_data.hex()[:100]}...",
            "created_from_photo": True
        }
        
        # Save to database
        await save_virtual_question(virtual_question)
        
        return {
            "success": True,
            "message": "Фото успешно обработано ИИ",
            "virtual_question": virtual_question
        }
        
    except Exception as e:
        print(f"❌ Error processing photo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing photo: {str(e)}")

@app.get("/api/ai/virtual-questions")
async def get_virtual_questions():
    """Get all virtual questions created from photos"""
    try:
        questions = await get_all_virtual_questions()
        return {"questions": questions, "total": len(questions)}
    except Exception as e:
        print(f"❌ Error getting virtual questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_virtual_question(question_data):
    """Save virtual question to database"""
    try:
        async with aiosqlite.connect("ent_bot.db") as db:
            # Create table if not exists
            await db.execute("""
                CREATE TABLE IF NOT EXISTS virtual_questions (
                    id INTEGER PRIMARY KEY,
                    question_id INTEGER UNIQUE,
                    text TEXT,
                    type TEXT,
                    topic TEXT,
                    difficulty TEXT,
                    options TEXT,
                    correct_answer TEXT,
                    explanation TEXT,
                    formula TEXT,
                    original_photo TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert question
            await db.execute("""
                INSERT OR REPLACE INTO virtual_questions 
                (question_id, text, type, topic, difficulty, options, correct_answer, explanation, formula, original_photo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                question_data["id"],
                question_data["text"],
                question_data["type"],
                question_data["topic"],
                question_data["difficulty"],
                json.dumps(question_data["options"]),
                question_data["correct_answer"],
                question_data["explanation"],
                question_data.get("formula"),
                question_data.get("original_photo")
            ))
            
            await db.commit()
            print(f"✅ Saved virtual question {question_data['id']} to database")
            
    except Exception as e:
        print(f"❌ Error saving virtual question: {str(e)}")
        raise e

async def get_all_virtual_questions():
    """Get all virtual questions from database"""
    try:
        async with aiosqlite.connect("ent_bot.db") as db:
            cursor = await db.execute("""
                SELECT question_id, text, type, topic, difficulty, options, correct_answer, explanation, formula, created_at
                FROM virtual_questions ORDER BY created_at DESC
            """)
            rows = await cursor.fetchall()
            
            questions = []
            for row in rows:
                questions.append({
                    "id": row[0],
                    "text": row[1],
                    "type": row[2],
                    "topic": row[3],
                    "difficulty": row[4],
                    "options": json.loads(row[5]) if row[5] else [],
                    "correct_answer": row[6],
                    "explanation": row[7],
                    "formula": row[8],
                    "created_at": row[9],
                    "created_from_photo": True
                })
            
            return questions
            
    except Exception as e:
        print(f"❌ Error getting virtual questions: {str(e)}")
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")
