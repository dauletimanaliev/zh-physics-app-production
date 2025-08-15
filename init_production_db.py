#!/usr/bin/env python3
"""
Initialize production database with sample data
"""
import asyncio
import os
from database import Database

async def init_production_database():
    """Initialize production database with essential data"""
    print("🔧 Initializing production database...")
    
    # Use production database file
    db_file = "ent_bot_production.db"
    if os.path.exists(db_file):
        print(f"📁 Database {db_file} already exists")
    else:
        print(f"📁 Creating new database {db_file}")
    
    db = Database(db_file)
    await db.init_db()
    
    # Create sample teacher user
    teacher_id = await db.create_user(
        telegram_id=111333,
        username="teacher_demo",
        first_name="Demo",
        last_name="Teacher",
        language="ru",
        role="teacher"
    )
    print(f"👨‍🏫 Created teacher user with ID: {teacher_id}")
    
    # Create sample student user
    student_id = await db.create_user(
        telegram_id=222444,
        username="student_demo", 
        first_name="Demo",
        last_name="Student",
        language="ru",
        role="student"
    )
    print(f"👨‍🎓 Created student user with ID: {student_id}")
    
    print("✅ Production database initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_production_database())
