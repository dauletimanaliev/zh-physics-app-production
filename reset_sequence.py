#!/usr/bin/env python3
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.production')

async def reset_materials_sequence():
    """Reset materials ID sequence to start from 1"""
    try:
        # Connect to PostgreSQL
        DATABASE_URL = os.getenv('DATABASE_URL')
        if not DATABASE_URL:
            print("❌ DATABASE_URL not found in environment")
            return False
            
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Check current materials
        materials = await conn.fetch('SELECT id, title FROM materials ORDER BY id')
        print(f"📊 Current materials in database: {len(materials)}")
        for material in materials:
            print(f"  - ID: {material['id']}, Title: {material['title']}")
        
        # Reset sequence
        await conn.execute('ALTER SEQUENCE materials_id_seq RESTART WITH 1')
        print("✅ Materials ID sequence reset to 1")
        
        # Verify sequence value
        result = await conn.fetchval("SELECT last_value FROM materials_id_seq")
        print(f"📈 Current sequence value: {result}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error resetting sequence: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(reset_materials_sequence())
