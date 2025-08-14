import asyncio
import aiosqlite
from database import Database

async def clear_database():
    """Completely clear all data from database"""
    db_path = "ent_bot.db"
    
    # Initialize database with proper schema
    db_instance = Database(db_path)
    await db_instance.init_db()
    print("✅ Database schema initialized")
    
    async with aiosqlite.connect(db_path) as db:
        # Clear all data from all tables
        try:
            await db.execute("DELETE FROM user_progress")
            await db.execute("DELETE FROM schedule")
            await db.execute("DELETE FROM quests")
            await db.execute("DELETE FROM tests")
            await db.execute("DELETE FROM materials") 
            await db.execute("DELETE FROM users")
            await db.commit()
            print("🧹 All data cleared from database")
            
            # Verify tables are empty
            tables = ['users', 'materials', 'tests', 'quests', 'schedule', 'user_progress']
            for table in tables:
                cursor = await db.execute(f"SELECT COUNT(*) FROM {table}")
                count = await cursor.fetchone()
                print(f"📊 {table}: {count[0]} records")
                
        except Exception as e:
            print(f"Error clearing database: {e}")
    
    print("✅ Database completely cleared - all counts are now 0")

if __name__ == "__main__":
    asyncio.run(clear_database())
