#!/usr/bin/env python3
"""
Create test user directly in database and test API
"""
import sqlite3
import requests
import json

def create_test_user_in_db():
    """Create test user directly in local database"""
    try:
        # Connect to database
        conn = sqlite3.connect('ent_bot.db')
        cursor = conn.cursor()
        
        # Create users table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                telegram_id INTEGER UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                language TEXT DEFAULT 'ru',
                role TEXT DEFAULT 'student',
                code TEXT,
                birth_date TEXT,
                registration_date TEXT,
                points INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                streak INTEGER DEFAULT 0,
                tests_completed INTEGER DEFAULT 0,
                avg_score REAL DEFAULT 0,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert test user with code 111444
        test_users = [
            (123456789, 'test_student1', 'Иван', 'Петров', 'ru', 'student', '111444'),
            (987654321, 'test_student2', 'Мария', 'Сидорова', 'ru', 'student', '111444'),
            (555666777, 'test_student3', 'Алексей', 'Козлов', 'ru', 'student', '111444')
        ]
        
        for user_data in test_users:
            cursor.execute("""
                INSERT OR REPLACE INTO users 
                (telegram_id, username, first_name, last_name, language, role, code)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, user_data)
        
        conn.commit()
        
        # Check if users were created
        cursor.execute("SELECT COUNT(*) FROM users WHERE code = '111444'")
        count = cursor.fetchone()[0]
        print(f"✅ Created {count} test users with code 111444")
        
        # Show all users
        cursor.execute("SELECT telegram_id, first_name, last_name, code FROM users")
        users = cursor.fetchall()
        print("👥 All users in database:")
        for user in users:
            print(f"  - {user[1]} {user[2]} (ID: {user[0]}, Code: {user[3]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    API_BASE = "https://web-production-2678c.up.railway.app/api"
    
    try:
        # Test teacher students endpoint
        print("\n🔍 Testing teacher students endpoint...")
        response = requests.get(f"{API_BASE}/teacher/students", timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Students found: {len(data.get('students', []))}")
            if data.get('students'):
                for student in data['students'][:3]:  # Show first 3
                    print(f"  - {student.get('first_name')} {student.get('last_name')} (Code: {student.get('code')})")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ API test error: {e}")

if __name__ == "__main__":
    print("🧪 Creating test users directly in database...")
    if create_test_user_in_db():
        print("\n🌐 Testing API endpoints...")
        test_api_endpoints()
    else:
        print("❌ Failed to create test users")
