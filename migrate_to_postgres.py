#!/usr/bin/env python3
"""
Migration script to move data from SQLite to PostgreSQL
"""
import asyncio
import sqlite3
import json
from datetime import datetime
from database_postgres import PostgresDatabase

async def migrate_data():
    """Migrate all data from SQLite to PostgreSQL"""
    print("🚀 Starting migration from SQLite to PostgreSQL...")
    
    # Initialize PostgreSQL database
    pg_db = PostgresDatabase()
    await pg_db.init_db()
    
    # Connect to SQLite database
    sqlite_conn = sqlite3.connect('ent_bot.db')
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    
    try:
        # Migrate users
        print("👥 Migrating users...")
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        user_mapping = {}  # SQLite ID -> PostgreSQL ID
        
        # Create default teacher first if not exists
        default_teacher_id = await pg_db.add_user(
            telegram_id=111333,
            username='teacher',
            first_name='Учитель',
            last_name='Физики',
            language='ru',
            role='teacher'
        )
        user_mapping[1] = default_teacher_id  # Map default teacher
        print(f"  ✅ Created default teacher (ID: 1 -> {default_teacher_id})")
        
        for user in users:
            user_dict = dict(user)
            if user_dict['telegram_id'] == 111333:
                # Skip if already created
                user_mapping[user_dict['id']] = default_teacher_id
                continue
                
            pg_user_id = await pg_db.add_user(
                telegram_id=user_dict['telegram_id'],
                username=user_dict.get('username'),
                first_name=user_dict.get('first_name'),
                last_name=user_dict.get('last_name'),
                language=user_dict.get('language', 'ru'),
                role='teacher' if user_dict.get('telegram_id') == 111333 else 'student'
            )
            user_mapping[user_dict['id']] = pg_user_id
            print(f"  ✅ Migrated user: {user_dict.get('first_name', 'Unknown')} (ID: {user_dict['id']} -> {pg_user_id})")
        
        # Migrate materials
        print("📚 Migrating materials...")
        cursor.execute("SELECT * FROM materials")
        materials = cursor.fetchall()
        
        for material in materials:
            material_dict = dict(material)
            
            # Handle JSON fields
            tags = material_dict.get('tags', '[]')
            if isinstance(tags, str):
                try:
                    tags = json.loads(tags)
                except:
                    tags = []
            
            attachments = material_dict.get('attachments', '[]')
            if isinstance(attachments, str) and attachments:
                try:
                    attachments = json.loads(attachments)
                except:
                    attachments = []
            
            # Map teacher ID
            teacher_id = user_mapping.get(material_dict.get('teacher_id'), 1)
            
            pg_material_data = {
                'title': material_dict.get('title', 'Untitled'),
                'description': material_dict.get('description', ''),
                'content': material_dict.get('content', ''),
                'type': material_dict.get('type', 'text'),
                'category': material_dict.get('category', 'general'),
                'difficulty': material_dict.get('difficulty', 'easy'),
                'duration': material_dict.get('duration', 10),
                'is_published': bool(material_dict.get('is_published', 0)),
                'tags': tags,
                'video_url': material_dict.get('video_url'),
                'pdf_url': material_dict.get('pdf_url'),
                'thumbnail_url': material_dict.get('thumbnail_url'),
                'attachments': json.dumps(attachments) if attachments else '[]',
                'teacher_id': teacher_id
            }
            
            pg_material_id = await pg_db.add_material(pg_material_data)
            print(f"  ✅ Migrated material: {material_dict.get('title', 'Untitled')} (ID: {material_dict['id']} -> {pg_material_id})")
        
        # Migrate schedule if exists
        print("📅 Migrating schedule...")
        try:
            cursor.execute("SELECT * FROM schedule")
            schedules = cursor.fetchall()
            
            for schedule in schedules:
                schedule_dict = dict(schedule)
                teacher_id = user_mapping.get(schedule_dict.get('teacher_id'), 1)
                
                schedule_data = {
                    'title': schedule_dict.get('subject', 'Class'),
                    'description': schedule_dict.get('description', ''),
                    'day_of_week': schedule_dict.get('day_of_week', 1),
                    'time_start': schedule_dict.get('time_start', '09:00'),
                    'time_end': schedule_dict.get('time_end', '10:00'),
                    'subject': schedule_dict.get('subject', ''),
                    'topic': schedule_dict.get('topic', ''),
                    'teacher_id': teacher_id,
                    'classroom': schedule_dict.get('classroom', '')
                }
                
                await pg_db.add_schedule(schedule_data)
                print(f"  ✅ Migrated schedule: {schedule_dict.get('subject', 'Class')}")
        except Exception as e:
            print(f"  ⚠️ Schedule migration skipped: {e}")
        
        print("✅ Migration completed successfully!")
        print(f"📊 Migrated {len(users)} users and {len(materials)} materials")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        raise e
    finally:
        sqlite_conn.close()
        await pg_db.close()

if __name__ == "__main__":
    asyncio.run(migrate_data())
