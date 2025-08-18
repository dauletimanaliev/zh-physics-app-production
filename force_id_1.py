#!/usr/bin/env python3
import requests
import json

API_BASE = "https://web-production-2678c.up.railway.app/api"

def force_create_user():
    """Force create user with specific ID and code"""
    
    user_data = {
        "telegram_id": 1111444,
        "username": "test_student_code", 
        "first_name": "Студент",
        "last_name": "Код111444",
        "language": "ru",
        "role": "student"
    }
    
    try:
        print(f"🧪 Creating user with special ID for code testing...")
        
        response = requests.post(
            f"{API_BASE}/users", 
            json=user_data,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📊 Status: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 200:
            print(f"✅ User created successfully!")
            
            # Check teacher analytics immediately
            print("\n🔍 Checking teacher analytics...")
            analytics_response = requests.get(f"{API_BASE}/teacher/students", timeout=10)
            print(f"Analytics Status: {analytics_response.status_code}")
            
            if analytics_response.status_code == 200:
                data = analytics_response.json()
                students = data.get('students', [])
                print(f"👥 Found {len(students)} students with code 111444")
                
                for student in students:
                    print(f"  - {student.get('first_name')} {student.get('last_name')} (Code: {student.get('code')})")
            else:
                print(f"❌ Analytics error: {analytics_response.text}")
        else:
            print(f"❌ Failed to create user")
            
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == "__main__":
    force_create_user()
