#!/usr/bin/env python3
"""
Create users directly in production database via Railway API
"""
import requests
import json
import time

API_BASE = "https://web-production-2678c.up.railway.app/api"

def create_production_users():
    """Create test users in production database"""
    
    test_users = [
        {
            "telegram_id": 1001001001,
            "username": "student_ivan",
            "first_name": "Иван",
            "last_name": "Петров",
            "language": "ru",
            "role": "student"
        },
        {
            "telegram_id": 1002002002,
            "username": "student_maria", 
            "first_name": "Мария",
            "last_name": "Сидорова",
            "language": "ru",
            "role": "student"
        },
        {
            "telegram_id": 1003003003,
            "username": "student_alex",
            "first_name": "Алексей", 
            "last_name": "Козлов",
            "language": "ru",
            "role": "student"
        }
    ]
    
    created_count = 0
    
    for user_data in test_users:
        try:
            print(f"🧪 Creating user: {user_data['first_name']} {user_data['last_name']}")
            
            response = requests.post(
                f"{API_BASE}/users", 
                json=user_data,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ User created successfully!")
                created_count += 1
            else:
                print(f"❌ Failed: {response.text}")
                
            time.sleep(1)  # Small delay between requests
            
        except Exception as e:
            print(f"💥 Error creating user {user_data['first_name']}: {e}")
    
    print(f"\n📊 Summary: {created_count}/{len(test_users)} users created")
    
    # Check if users appear in teacher analytics
    if created_count > 0:
        print("\n🔍 Checking teacher analytics...")
        try:
            response = requests.get(f"{API_BASE}/teacher/students", timeout=10)
            if response.status_code == 200:
                data = response.json()
                students = data.get('students', [])
                print(f"👥 Found {len(students)} students with code 111444")
                
                for student in students[:5]:  # Show first 5
                    print(f"  - {student.get('first_name')} {student.get('last_name')} (ID: {student.get('telegram_id')})")
            else:
                print(f"❌ Analytics error: {response.text}")
        except Exception as e:
            print(f"💥 Analytics check error: {e}")

if __name__ == "__main__":
    print("🚀 Creating users in production database...")
    create_production_users()
