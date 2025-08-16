#!/usr/bin/env python3
"""
Clear all users directly from the database
"""
import asyncio
import sys
import os

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_postgres import DatabasePostgres

async def clear_all_users():
    """Clear all users directly from the database"""
    try:
        print("🗑️ Connecting to database...")
        db = DatabasePostgres()
        await db.connect()
        
        print("📊 Getting current user count...")
        users = await db.get_all_users()
        print(f"Found {len(users)} users in database")
        
        if len(users) == 0:
            print("✅ Database is already empty")
            return
        
        # Show users before deletion
        for user in users:
            name = user.get('first_name', 'Unknown')
            telegram_id = user.get('telegram_id', 'Unknown')
            print(f"  - {name} (ID: {telegram_id})")
        
        print("\n🗑️ Clearing all users...")
        
        # Execute direct SQL to delete all users
        query = "DELETE FROM users"
        await db.execute_query(query)
        
        print("✅ All users deleted successfully")
        
        # Verify database is empty
        users_after = await db.get_all_users()
        print(f"📊 Users remaining: {len(users_after)}")
        
        await db.close()
        
    except Exception as e:
        print(f"❌ Error clearing users: {e}")

if __name__ == "__main__":
    asyncio.run(clear_all_users())
