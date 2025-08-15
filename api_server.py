from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from typing import List, Optional, Dict, Any
import asyncio
import uvicorn
import os
from database import Database
import json

# Initialize FastAPI app
app = FastAPI(title="Physics Bot API", version="1.0.0")

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

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"❌ Validation error: {exc}")
    print(f"📜 Error details: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

# Pydantic models
class User(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    language: str = 'ru'

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

# Startup event
@app.on_event("startup")
async def startup_event():
    await db.init_db()
    print("✅ Database initialized")

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "OK", "service": "Physics Bot API"}

# User endpoints
@app.post("/api/users")
async def create_user(user: User):
    try:
        await db.add_user(
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            language=user.language
        )
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users/{telegram_id}")
async def get_user(telegram_id: int):
    try:
        user = await db.get_user(telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users")
async def create_user(user: User):
    try:
        await db.add_user(
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            language=user.language or 'ru'
        )
        return {"success": True, "message": "Пользователь успешно создан"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
@app.get("/api/materials/{subject}")
async def get_materials_by_subject(subject: str, language: str = 'ru'):
    try:
        materials = await db.get_materials_by_subject(subject, language)
        return {"materials": materials}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Schedule endpoints
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
        # Get real data from database
        users = await db.get_all_users()
        tests = await db.get_all_tests()
        materials = await db.get_all_materials()
        
        # Calculate real statistics
        total_students = len([u for u in users if u.get('role') == 'student'])
        active_tests = len([t for t in tests if t.get('is_published', False)])
        total_materials = len([m for m in materials if m.get('is_published', False)])
        
        # For QuickActionsPage compatibility
        return {
            "totalStudents": total_students,
            "activeTests": active_tests,
            "newMessages": 0,  # TODO: implement messaging system
            "pendingReports": total_materials,  # Use materials count as reports
            
            # Additional detailed stats for dashboard
            "detailed": {
                "total_students": total_students,
                "active_students": len([u for u in users if u.get('points', 0) > 0]),
                "inactive_students": total_students - len([u for u in users if u.get('points', 0) > 0]),
                "avg_points": round(sum(u.get('points', 0) for u in users) / total_students if total_students > 0 else 0, 1),
                "total_tests_taken": sum(u.get('tests_completed', 0) for u in users),
                "published_tests": active_tests,
                "published_materials": total_materials,
                "top_performers": await db.get_leaderboard(3)
            }
        }
    except Exception as e:
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
async def create_material(material: Material):
    """Create a new material"""
    try:
        print(f"➕ Creating new material: {material.title}")
        print(f"📊 Material data: {material.dict()}")
        print(f"🔍 Raw request data received")
        
        # Convert teacherId to int if it's a string
        teacher_id = material.teacherId
        if isinstance(teacher_id, str):
            try:
                teacher_id = int(teacher_id)
            except ValueError:
                teacher_id = None
        
        # Insert material into database
        material_id = await db.create_material(
            title=material.title,
            description=material.description or "",
            content=material.content or "",
            type=material.type,
            category=material.category,
            difficulty=material.difficulty,
            duration=material.duration,
            is_published=material.isPublished,
            tags=json.dumps(material.tags),
            video_url=material.videoUrl,
            pdf_url=material.pdfUrl,
            thumbnail_url=material.thumbnailUrl,
            teacher_id=teacher_id
        )
        
        # Get the complete created material from database
        created_material = await db.get_material_by_id(material_id)
        
        print(f"✅ Material created successfully with ID: {material_id}")
        return created_material
    except Exception as e:
        print(f"❌ Error creating material: {e}")
        print(f"🔍 Exception type: {type(e)}")
        import traceback
        print(f"📜 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/materials/{material_id}")
async def update_material(material_id: int, update_data: Dict[str, Any]):
    """Update an existing material"""
    try:
        print(f"✏️ Updating material {material_id}: {update_data}")
        
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
        
        print(f"🔄 Converted data for database: {update_data}")
        
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
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/api/materials/{material_id}/content")
async def get_material_content(material_id: int):
    """Get full content of a specific material"""
    try:
        print(f"📄 Loading content for material: {material_id}")
        
        # Get material content from database
        material = await db.get_material_by_id(material_id)
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        print(f"✅ Material content loaded successfully")
        return material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error loading material content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")
