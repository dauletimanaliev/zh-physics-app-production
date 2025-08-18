#!/usr/bin/env python3
"""
Create teacher user to test role-based filtering
"""
import requests
import json

API_BASE = "https://web-production-2678c.up.railway.app/api"

def create_teacher():
    """Create teacher user"""
    
    teacher_data = {
        "telegram_id": 9999999999,
        "username": "teacher_main",
        "first_name": "Учитель",
        "last_name": "Главный",
        "language": "ru",
        "role": "teacher"
    }
    
    try:
        print(f"🧑‍🏫 Creating teacher user...")
        
        response = requests.post(
            f"{API_BASE}/users", 
            json=teacher_data,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📊 Status: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 200:
            print(f"✅ Teacher created successfully!")
            
            # Check all users
            print("\n👥 All users:")
            users_response = requests.get(f"{API_BASE}/admin/users", timeout=10)
            if users_response.status_code == 200:
                users = users_response.json()['users']
                for user in users:
                    role = user.get('role', 'student')
                    print(f"  - {user['first_name']} (ID: {user['telegram_id']}, Role: {role})")
            
            # Check teacher analytics
            print("\n📊 Teacher analytics:")
            analytics_response = requests.get(f"{API_BASE}/teacher/students", timeout=10)
            if analytics_response.status_code == 200:
                data = analytics_response.json()
                students = data.get('students', [])
                print(f"Students found: {len(students)}")
                print(f"Total count: {data.get('total_count', 0)}")
                print(f"Active count: {data.get('active_count', 0)}")
                
                print("\nStudents by role:")
                for student in students[:3]:
                    role = student.get('role', 'student')
                    code = student.get('code', 'no_code')
                    print(f"  - {student['first_name']} (Role: {role}, Code: {code})")
            else:
                print(f"❌ Analytics error: {analytics_response.text}")
        else:
            print(f"❌ Failed to create teacher")
            
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == "__main__":
    create_teacher()
