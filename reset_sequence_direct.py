#!/usr/bin/env python3
import asyncio
import asyncpg
import os

async def reset_materials_sequence():
    """Reset materials ID sequence to start from 1"""
    try:
        # Railway PostgreSQL connection string
        DATABASE_URL = "postgresql://postgres:bBFCaGDdEEeB-cCBgBGCEGdBbBCgbdgF@postgres.railway.internal:5432/railway"
        
        print("🔗 Connecting to Railway PostgreSQL...")
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Check current materials
        materials = await conn.fetch('SELECT id, title FROM materials ORDER BY id')
        print(f"📊 Current materials in database: {len(materials)}")
        for material in materials:
            print(f"  - ID: {material['id']}, Title: {material['title']}")
        
        # Get current sequence value
        current_seq = await conn.fetchval("SELECT last_value FROM materials_id_seq")
        print(f"📈 Current sequence value: {current_seq}")
        
        # Reset sequence to 1
        await conn.execute('ALTER SEQUENCE materials_id_seq RESTART WITH 1')
        print("✅ Materials ID sequence reset to 1")
        
        # Verify sequence value
        new_seq = await conn.fetchval("SELECT last_value FROM materials_id_seq") 
        print(f"📈 New sequence value: {new_seq}")
        
        await conn.close()
        print("✅ Database connection closed")
        return True
        
    except Exception as e:
        print(f"❌ Error resetting sequence: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(reset_materials_sequence())
