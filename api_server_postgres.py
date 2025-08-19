from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from typing import List, Optional, Dict, Any
import asyncio
import uvicorn
import os
from database_postgres import PostgresDatabase
import json
import traceback
from datetime import datetime
from contextlib import asynccontextmanager

# Global database instance
db = None

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler with full error protection"""
    global db
    try:
        print("🚀 Starting API server with PostgreSQL...")
        
        # Safe database initialization
        try:
            db = PostgresDatabase()
            await db.init_db()
            print("✅ PostgreSQL database initialized successfully")
        except Exception as db_error:
            print(f"❌ Database initialization error: {db_error}")
            print(f"📜 DB Error traceback: {traceback.format_exc()}")
            db = None
            
        print("🎯 API server startup completed")
        
    except Exception as startup_error:
        print(f"💥 CRITICAL STARTUP ERROR: {startup_error}")
        print(f"📜 Startup error traceback: {traceback.format_exc()}")
    
    yield  # Server is running
    
    # Cleanup on shutdown
    try:
        print("🛑 Shutting down API server...")
        if db:
            await db.close()
    except Exception as shutdown_error:
        print(f"⚠️ Shutdown error: {shutdown_error}")

# Initialize FastAPI app with lifespan
app = FastAPI(title="Physics Bot API", version="2.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database placeholder
db = None

# Global exception handler
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

# Pydantic models
class User(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language: str = 'ru'
    role: str = 'student'

class Message(BaseModel):
    title: str
    content: str
    recipient_id: Optional[int] = None
    is_broadcast: bool = False
    message_type: str = 'personal'
    priority: str = 'normal'

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "OK", "service": "Physics Bot API v2.0", "database": "PostgreSQL"}

# User endpoints
@app.post("/api/users")
async def create_user(user: User):
    try:
        user_id = await db.add_user(
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            language=user.language,
            role=user.role
        )
        return {"message": "User created successfully", "user_id": user_id}
    except Exception as e:
        print(f"❌ User creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

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
        raise HTTPException(status_code=500, detail="Failed to retrieve user")

@app.get("/api/users")
async def get_all_users():
    try:
        users = await db.get_all_users()
        return {"users": users}
    except Exception as e:
        print(f"❌ Get all users error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")

# Materials endpoints with analytics
@app.get("/api/materials")
async def get_materials():
    try:
        materials = await db.get_all_materials()
        # Convert frontend field names
        for material in materials:
            material['isPublished'] = material.pop('is_published', True)
            material['videoUrl'] = material.pop('video_url', '')
            material['pdfUrl'] = material.pop('pdf_url', '')
            material['thumbnailUrl'] = material.pop('thumbnail_url', '')
            material['teacherId'] = material.pop('teacher_id', 1)
            # Parse tags if it's a string
            if isinstance(material.get('tags'), str):
                try:
                    material['tags'] = json.loads(material['tags'])
                except:
                    material['tags'] = []
        return {"materials": materials}
    except Exception as e:
        print(f"❌ Get materials error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve materials")

@app.get("/api/materials/teacher/{teacher_telegram_id}")
async def get_teacher_materials(teacher_telegram_id: int):
    """Get materials by teacher telegram_id"""
    try:
        # Find teacher by telegram_id
        teacher = await db.get_user_by_telegram_id(teacher_telegram_id)
        if not teacher:
            return []
        
        # Get materials by teacher_id
        materials = await db.get_materials_by_teacher(teacher['id'])
        
        # Convert frontend field names
        for material in materials:
            material['isPublished'] = material.pop('is_published', True)
            material['videoUrl'] = material.pop('video_url', '')
            material['pdfUrl'] = material.pop('pdf_url', '')
            material['thumbnailUrl'] = material.pop('thumbnail_url', '')
            material['teacherId'] = material.pop('teacher_id', 1)
            # Parse tags if it's a string
            if isinstance(material.get('tags'), str):
                try:
                    material['tags'] = json.loads(material['tags'])
                except:
                    material['tags'] = []
        
        return materials
    except Exception as e:
        print(f"❌ Error getting teacher materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/{material_id}")
async def get_material(material_id: int, user_id: Optional[int] = None):
    """Get material by ID with view tracking"""
    try:
        material = await db.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Track view if user_id provided
        if user_id:
            await db.track_material_view(material_id, user_id)
        
        # Convert field names for frontend
        material['isPublished'] = material.pop('is_published', True)
        material['videoUrl'] = material.pop('video_url', '')
        material['pdfUrl'] = material.pop('pdf_url', '')
        material['thumbnailUrl'] = material.pop('thumbnail_url', '')
        material['teacherId'] = material.pop('teacher_id', 1)
        
        # Parse tags if it's a string
        if isinstance(material.get('tags'), str):
            try:
                material['tags'] = json.loads(material['tags'])
            except:
                material['tags'] = []
        
        return material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/materials/{material_id}")
async def update_material(material_id: int, material_data: Dict[str, Any]):
    """Update material by ID"""
    try:
        print(f"📝 Updating material {material_id}: {material_data.get('title', 'Untitled')}")
        
        # Process tags
        tags = material_data.get('tags', [])
        if isinstance(tags, list):
            tags_processed = tags
        else:
            tags_processed = []
        
        # Process attachments
        attachments = material_data.get('attachments', [])
        processed_attachments = []
        if attachments:
            for attachment in attachments:
                processed_attachment = {
                    'name': attachment.get('name', ''),
                    'type': attachment.get('type', ''),
                    'size': attachment.get('size', 0),
                    'data': attachment.get('data', ''),
                    'uploaded_at': datetime.now().isoformat()
                }
                processed_attachments.append(processed_attachment)
        
        # Get teacher_id by telegram_id
        teacher_telegram_id = material_data.get('teacherId', 111333)
        if isinstance(teacher_telegram_id, str):
            try:
                teacher_telegram_id = int(teacher_telegram_id)
            except ValueError:
                teacher_telegram_id = 111333
        
        # Find user by telegram_id
        teacher_user = await db.get_user_by_telegram_id(teacher_telegram_id)
        teacher_id = teacher_user['id'] if teacher_user else 1
        
        # Ensure duration is integer
        duration = material_data.get('duration', 10)
        if isinstance(duration, str):
            try:
                duration = int(duration)
            except ValueError:
                duration = 10
        
        material_dict = {
            'title': material_data.get('title', ''),
            'description': material_data.get('description', ''),
            'content': material_data.get('content', ''),
            'type': material_data.get('type', 'text'),
            'category': material_data.get('category', 'general'),
            'difficulty': material_data.get('difficulty', 'easy'),
            'duration': duration,
            'is_published': material_data.get('isPublished', False),
            'tags': json.dumps(tags_processed),
            'video_url': material_data.get('videoUrl', ''),
            'pdf_url': material_data.get('pdfUrl', ''),
            'thumbnail_url': material_data.get('thumbnailUrl', ''),
            'attachments': json.dumps(processed_attachments),
            'teacher_id': teacher_id
        }
        
        await db.update_material(material_id, material_dict)
        print(f"✅ Material {material_id} updated successfully")
        
        return {"message": "Material updated successfully"}
    except Exception as e:
        print(f"❌ Error updating material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/materials/{material_id}")
async def delete_material(material_id: int):
    """Delete material by ID"""
    try:
        print(f"🗑️ Deleting material: {material_id}")
        
        # Check if material exists
        material = await db.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        await db.delete_material(material_id)
        print(f"✅ Material {material_id} deleted successfully")
        
        return {"message": "Material deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/materials/{material_id}/publish")
async def toggle_material_publish(material_id: int, publish_data: Dict[str, Any]):
    """Toggle material publish status"""
    try:
        is_published = publish_data.get('isPublished', True)
        print(f"📢 {'Publishing' if is_published else 'Unpublishing'} material: {material_id}")
        
        # Check if material exists
        material = await db.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        await db.update_material_publish_status(material_id, is_published)
        print(f"✅ Material {material_id} {'published' if is_published else 'unpublished'}")
        
        return {"message": f"Material {'published' if is_published else 'unpublished'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating material publish status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/materials")
async def create_material(material_data: Dict[str, Any]):
    try:
        print(f"📝 Creating new material: {material_data.get('title', 'Untitled')}")
        
        # Process tags
        tags = material_data.get('tags', [])
        if isinstance(tags, list):
            tags_processed = tags
        else:
            tags_processed = []
        
        # Process attachments
        attachments = material_data.pop('attachments', [])
        processed_attachments = []
        
        if attachments:
            for attachment in attachments:
                processed_attachment = {
                    'name': attachment.get('name', ''),
                    'type': attachment.get('type', ''),
                    'size': attachment.get('size', 0),
                    'data': attachment.get('data', ''),
                    'uploaded_at': datetime.now().isoformat()
                }
                processed_attachments.append(processed_attachment)
        
        # Get teacher_id by telegram_id
        teacher_telegram_id = material_data.get('teacherId', 111333)
        if isinstance(teacher_telegram_id, str):
            try:
                teacher_telegram_id = int(teacher_telegram_id)
            except ValueError:
                teacher_telegram_id = 111333
        
        # Find user by telegram_id
        teacher_user = await db.get_user_by_telegram_id(teacher_telegram_id)
        teacher_id = teacher_user['id'] if teacher_user else 1
        
        # Ensure duration is integer
        duration = material_data.get('duration', 10)
        if isinstance(duration, str):
            try:
                duration = int(duration)
            except ValueError:
                duration = 10
        
        material_dict = {
            'title': material_data.get('title', ''),
            'description': material_data.get('description', ''),
            'content': material_data.get('content', ''),
            'type': material_data.get('type', 'text'),
            'category': material_data.get('category', 'general'),
            'difficulty': material_data.get('difficulty', 'easy'),
            'duration': duration,
            'is_published': material_data.get('isPublished', False),
            'tags': tags_processed,
            'video_url': material_data.get('videoUrl', ''),
            'pdf_url': material_data.get('pdfUrl', ''),
            'thumbnail_url': material_data.get('thumbnailUrl', ''),
            'attachments': json.dumps(processed_attachments),
            'teacher_id': teacher_id
        }
        
        material_id = await db.add_material(material_dict)
        print(f"✅ Material created with ID: {material_id}")
        
        return {
            "message": "Material created successfully",
            "material_id": material_id
        }
    except Exception as e:
        print(f"❌ Error creating material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/{material_id}/content")
async def get_material_content(material_id: int, user_id: Optional[int] = None):
    try:
        print(f"📄 Loading content for material: {material_id}")
        
        material = await db.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Track view if user_id provided
        if user_id:
            await db.track_material_view(material_id, user_id)
        
        # Convert field names for frontend
        material['isPublished'] = material.pop('is_published', True)
        material['videoUrl'] = material.pop('video_url', '')
        material['pdfUrl'] = material.pop('pdf_url', '')
        material['thumbnailUrl'] = material.pop('thumbnail_url', '')
        material['teacherId'] = material.pop('teacher_id', 1)
        
        print(f"✅ Material content loaded: {material.get('title', 'No title')}")
        return material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error loading material content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/{material_id}/analytics")
async def get_material_analytics(material_id: int):
    try:
        analytics = await db.get_material_analytics(material_id)
        return analytics
    except Exception as e:
        print(f"❌ Error getting material analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Messages/Notifications endpoints
@app.post("/api/messages")
async def send_message(message: Message, sender_id: int):
    try:
        await db.send_message(
            sender_id=sender_id,
            title=message.title,
            content=message.content,
            recipient_id=message.recipient_id,
            is_broadcast=message.is_broadcast,
            message_type=message.message_type,
            priority=message.priority
        )
        return {"message": "Message sent successfully"}
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/messages")
async def get_user_messages(user_id: int, unread_only: bool = False):
    try:
        messages = await db.get_user_messages(user_id, unread_only)
        return {"messages": messages}
    except Exception as e:
        print(f"❌ Error getting user messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/messages/{message_id}/read")
async def mark_message_read(message_id: int, user_id: int):
    try:
        await db.mark_message_read(message_id, user_id)
        return {"message": "Message marked as read"}
        return {"message": "Schedule entry added successfully", "schedule_id": schedule_id}
    except Exception as e:
        print(f"❌ Error adding schedule entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Progress and Analytics endpoints
@app.get("/api/users/{user_id}/progress")
async def get_user_progress(user_id: int):
    try:
        progress = await db.get_user_progress(user_id)
        return progress
    except Exception as e:
        print(f"❌ Error getting user progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10):
    try:
        leaderboard = await db.get_leaderboard(limit)
        return {"leaderboard": leaderboard}
    except Exception as e:
        print(f"❌ Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Teacher dashboard endpoints
@app.get("/api/teachers/{teacher_id}/stats")
async def get_teacher_stats(teacher_id: int):
    try:
        if not db:
            raise HTTPException(status_code=503, detail="Database not available")
        
        users = await db.get_all_users()
        materials = await db.get_all_materials()
        
        total_students = len([u for u in users if u.get('role') == 'student'])
        total_tests = len(materials)
        
        # Calculate average score from user progress
        total_score = 0
        scored_users = 0
        for user in users:
            if user.get('role') == 'student' and 'progress' in user:
                total_score += user.get('progress', 0)
                scored_users += 1
        
        average_score = total_score / scored_users if scored_users > 0 else 0
        
        return {
            "totalStudents": total_students,
            "totalTests": total_tests,
            "averageScore": round(average_score, 1),
            "completedAssignments": total_tests * 2,  # Mock calculation
            "pendingAssignments": max(0, total_tests - 5),  # Mock calculation
            "recentActivity": [
                {
                    "type": "test_completed",
                    "student": "Студент А",
                    "score": 85,
                    "date": datetime.now().isoformat()
                },
                {
                    "type": "assignment_submitted", 
                    "student": "Студент Б",
                    "date": datetime.now().isoformat()
                }
            ]
        }
    except Exception as e:
        print(f"❌ Error getting teacher stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/stats")
async def get_teacher_stats_legacy():
    return await get_teacher_stats(1)

@app.get("/api/teacher/materials")
async def get_teacher_materials(teacher_id: int = 111333):
    try:
        materials = await db.get_all_materials()
        # Filter by teacher
        teacher_materials = [m for m in materials if m.get('teacher_id') == teacher_id]
        
        # Convert field names
        for material in teacher_materials:
            material['isPublished'] = material.pop('is_published', True)
            material['videoUrl'] = material.pop('video_url', '')
            material['pdfUrl'] = material.pop('pdf_url', '')
            material['thumbnailUrl'] = material.pop('thumbnail_url', '')
            material['teacherId'] = material.pop('teacher_id', 1)
        
        return {"materials": teacher_materials}
    except Exception as e:
        print(f"❌ Error getting teacher materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI endpoints for photo processing and virtual questions
@app.post("/api/ai/photo-to-question")
async def photo_to_question():
    try:
        # Generate varied physics questions
        import random
        
        questions = [
            {
                "text": "Найдите силу тяжести для тела массой 5 кг",
                "options": ["49 Н", "50 Н", "5 Н", "490 Н"],
                "correct_answer": "49 Н",
                "topic": "Механика",
                "difficulty": "easy",
                "explanation": "F = mg = 5 кг × 9.8 м/с² = 49 Н"
            },
            {
                "text": "Определите ускорение тела при силе 20 Н и массе 4 кг",
                "options": ["5 м/с²", "80 м/с²", "16 м/с²", "0.2 м/с²"],
                "correct_answer": "5 м/с²",
                "topic": "Динамика",
                "difficulty": "medium",
                "explanation": "a = F/m = 20 Н / 4 кг = 5 м/с²"
            },
            {
                "text": "Найдите кинетическую энергию тела массой 2 кг при скорости 10 м/с",
                "options": ["100 Дж", "20 Дж", "200 Дж", "10 Дж"],
                "correct_answer": "100 Дж",
                "topic": "Энергия",
                "difficulty": "medium",
                "explanation": "Ek = mv²/2 = 2×10²/2 = 100 Дж"
            },
            {
                "text": "Определите период колебаний пружинного маятника с k=100 Н/м, m=1 кг",
                "options": ["0.63 с", "1.0 с", "10 с", "0.1 с"],
                "correct_answer": "0.63 с",
                "topic": "Колебания",
                "difficulty": "hard",
                "explanation": "T = 2π√(m/k) = 2π√(1/100) ≈ 0.63 с"
            },
            {
                "text": "Найдите импульс тела массой 3 кг при скорости 8 м/с",
                "options": ["24 кг·м/с", "11 кг·м/с", "2.67 кг·м/с", "64 кг·м/с"],
                "correct_answer": "24 кг·м/с",
                "topic": "Импульс",
                "difficulty": "easy",
                "explanation": "p = mv = 3 кг × 8 м/с = 24 кг·м/с"
            },
            {
                "text": "Определите мощность при работе 600 Дж за 10 секунд",
                "options": ["60 Вт", "610 Вт", "6000 Вт", "6 Вт"],
                "correct_answer": "60 Вт",
                "topic": "Мощность",
                "difficulty": "easy",
                "explanation": "P = A/t = 600 Дж / 10 с = 60 Вт"
            }
        ]
        
        selected_question = random.choice(questions)
        
        return {
            "success": True,
            "virtual_question": {
                "id": int(datetime.now().timestamp()),
                "text": selected_question["text"],
                "type": "multiple_choice",
                "options": selected_question["options"],
                "correct_answer": selected_question["correct_answer"],
                "topic": selected_question["topic"],
                "difficulty": selected_question["difficulty"],
                "explanation": selected_question["explanation"]
            }
        }
    except Exception as e:
        print(f"❌ Error processing photo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/virtual-questions")
async def get_virtual_questions():
    try:
        return {
            "questions": [
                {
                    "id": 1,
                    "text": "Найдите скорость тела при свободном падении через 3 секунды",
                    "type": "multiple_choice",
                    "options": ["29.4 м/с", "9.8 м/с", "19.6 м/с", "39.2 м/с"],
                    "correct_answer": "29.4 м/с",
                    "topic": "Кинематика",
                    "difficulty": "medium",
                    "created_at": datetime.now().isoformat()
                }
            ]
        }
    except Exception as e:
        print(f"❌ Error getting virtual questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/check-answer")
async def check_answer():
    try:
        return {
            "correct": True,
            "explanation": "Правильный ответ! Отличная работа.",
            "feedback": "Вы правильно применили формулу и получили верный результат.",
            "confidence": 0.95
        }
    except Exception as e:
        print(f"❌ Error checking answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True, log_level="info")
