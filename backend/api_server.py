from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from typing import List, Optional, Dict, Any
import asyncio
import uvicorn
import os
import sys
import json
import traceback
from datetime import datetime
from contextlib import asynccontextmanager
import asyncpg

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database_postgres import PostgresDatabase

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler with full error protection"""
    try:
        global db
        print("🚀 Starting API server with PostgreSQL...")
        
        # Safe database initialization
        try:
            db = PostgresDatabase()
            await db.init_db()
            print("✅ PostgreSQL database initialized successfully")
        except Exception as db_error:
            print(f"❌ Database initialization error: {db_error}")
            raise db_error
        
        yield
    except Exception as startup_error:
        print(f"🚨 CRITICAL STARTUP ERROR: {startup_error}")
        raise startup_error
    
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
    """Global exception handler for debugging"""
    try:
        # Don't handle HTTPException - let FastAPI handle it
        if isinstance(exc, HTTPException):
            raise exc
            
        error_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        print(f"🚨 CRITICAL ERROR [{error_id}]: {type(exc).__name__}: {str(exc)}")
        print(f"📍 Request: {request.method} {request.url}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "error_id": error_id,
                "message": str(exc)
            }
        )
    except Exception as handler_error:
        print(f"💥 Exception handler failed: {handler_error}")
        return JSONResponse(
            status_code=500,
            content={"error": "Critical system error"}
        )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint for Railway"""
    try:
        if db:
            # Test database connection
            await db.get_connection()
            return {"status": "healthy", "database": "connected", "timestamp": datetime.now().isoformat()}
        else:
            return {"status": "unhealthy", "database": "not_initialized", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}

# Materials endpoints
@app.get("/api/materials")
async def get_materials():
    """Get all published materials"""
    try:
        print("📚 Loading all published materials from PostgreSQL...")
        
        # First, let's check all materials to debug
        all_materials = await db.get_all_materials_debug()
        print(f"🔍 DEBUG: Total materials in DB: {len(all_materials)}")
        for material in all_materials[:3]:  # Show first 3 for debugging
            print(f"🔍 DEBUG: Material {material.get('id')}: title='{material.get('title')}', isPublished={material.get('isPublished')}, type={type(material.get('isPublished'))}")
        
        materials = await db.get_published_materials()
        print(f"✅ Found {len(materials)} published materials")
        return {"materials": materials}
    except Exception as e:
        print(f"❌ Error loading materials: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading materials: {str(e)}")

@app.get("/api/materials/{material_id}")
async def get_material(material_id: int):
    """Get specific material by ID"""
    try:
        print(f"📖 Loading material {material_id} from PostgreSQL...")
        material = await db.get_material_by_id(material_id)
        if not material:
            print(f"❌ Material {material_id} not found in database")
            raise HTTPException(status_code=404, detail="Material not found")
        print(f"✅ Material {material_id} loaded successfully: {material.get('title', 'No title')}")
        return material
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error loading material {material_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading material: {str(e)}")

@app.post("/api/materials")
async def create_material(material_data: Dict[str, Any]):
    """Create new material"""
    try:
        print(f"📝 Creating new material: {material_data.get('title', 'Untitled')}")
        
        # Process tags
        tags = material_data.get('tags', [])
        if isinstance(tags, list):
            tags_json = json.dumps(tags)
        else:
            tags_json = str(tags) if tags else json.dumps([])
        
        # Process attachments
        attachments = material_data.get('attachments', [])
        if attachments:
            processed_attachments = []
            for attachment in attachments:
                processed_attachment = {
                    'name': attachment.get('name', ''),
                    'type': attachment.get('type', ''),
                    'size': attachment.get('size', 0),
                    'data': attachment.get('data', ''),
                    'uploaded_at': datetime.now().isoformat()
                }
                processed_attachments.append(processed_attachment)
            attachments_json = json.dumps(processed_attachments)
        else:
            attachments_json = json.dumps([])
        
        # Prepare material dict
        material_dict = {
            'title': material_data.get('title', ''),
            'description': material_data.get('description', ''),
            'content': material_data.get('content', ''),
            'type': material_data.get('type', 'text'),
            'category': material_data.get('category', 'general'),
            'difficulty': material_data.get('difficulty', 'easy'),
            'duration': material_data.get('duration', 10),
            'isPublished': material_data.get('isPublished', False),
            'tags': tags_json,
            'videoUrl': material_data.get('videoUrl', ''),
            'pdfUrl': material_data.get('pdfUrl', ''),
            'thumbnailUrl': material_data.get('thumbnailUrl', ''),
            'teacherId': material_data.get('teacherId', 1),
            'attachments': attachments_json
        }
        
        material_id = await db.add_material(material_dict)
        print(f"✅ Material created with ID: {material_id}")
        
        return {"id": material_id, "message": "Material created successfully"}
    except Exception as e:
        print(f"❌ Error creating material: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error creating material: {str(e)}")

@app.put("/api/materials/{material_id}")
async def update_material(material_id: int, material_data: Dict[str, Any]):
    """Update existing material"""
    try:
        print(f"📝 Updating material {material_id}")
        
        # Process tags if provided
        if 'tags' in material_data:
            tags = material_data['tags']
            if isinstance(tags, list):
                material_data['tags'] = json.dumps(tags)
            else:
                material_data['tags'] = str(tags) if tags else json.dumps([])
        
        # Process attachments if provided
        if 'attachments' in material_data:
            attachments = material_data['attachments']
            if attachments:
                processed_attachments = []
                for attachment in attachments:
                    processed_attachment = {
                        'name': attachment.get('name', ''),
                        'type': attachment.get('type', ''),
                        'size': attachment.get('size', 0),
                        'data': attachment.get('data', ''),
                        'uploaded_at': datetime.now().isoformat()
                    }
                    processed_attachments.append(processed_attachment)
                material_data['attachments'] = json.dumps(processed_attachments)
            else:
                material_data['attachments'] = json.dumps([])
        
        success = await db.update_material(material_id, material_data)
        if not success:
            raise HTTPException(status_code=404, detail="Material not found")
        
        print(f"✅ Material {material_id} updated successfully")
        return {"message": "Material updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating material {material_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating material: {str(e)}")

@app.delete("/api/materials/{material_id}")
async def delete_material(material_id: int):
    """Delete material"""
    try:
        print(f"🗑️ Deleting material {material_id}")
        success = await db.delete_material(material_id)
        if not success:
            raise HTTPException(status_code=404, detail="Material not found")
        
        print(f"✅ Material {material_id} deleted successfully")
        return {"message": "Material deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting material {material_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting material: {str(e)}")

@app.get("/api/materials/teacher/{teacher_id}")
async def get_teacher_materials(teacher_id: str):
    """Get all materials for a specific teacher"""
    try:
        print(f"📚 Loading materials for teacher {teacher_id}")
        materials = await db.get_materials_by_teacher(teacher_id)
        print(f"✅ Found {len(materials)} materials for teacher {teacher_id}")
        return {"materials": materials}
    except Exception as e:
        print(f"❌ Error loading teacher materials: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading teacher materials: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Physics Bot API v2.0", "status": "running", "database": "PostgreSQL"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting Physics Bot API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
