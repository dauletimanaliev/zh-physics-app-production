#!/usr/bin/env python3
"""
Test script to create users and verify they are saved correctly
"""
import requests
import json
from datetime import datetime

API_BASE = "https://web-production-2678c.up.railway.app/api"

def test_user_creation():
    """Test creating a user with code 111444"""
    
    # Test user data - minimal required fields only
    test_user = {
        "telegram_id": 999888777,
        "first_name": "Тест"
    }
    
    print("🧪 Testing user creation...")
    print(f"📤 Sending user data: {json.dumps(test_user, indent=2, ensure_ascii=False)}")
    
    try:
        # Create user
        response = requests.post(f"{API_BASE}/users", json=test_user, timeout=10)
        print(f"📊 Response status: {response.status_code}")
        print(f"📋 Response data: {response.text}")
        
        if response.status_code == 200:
            print("✅ User created successfully!")
            
            # Check if user appears in teacher students
            print("\n🔍 Checking teacher students...")
            students_response = requests.get(f"{API_BASE}/teacher/students", timeout=10)
            print(f"📊 Students response status: {students_response.status_code}")
            
            if students_response.status_code == 200:
                students_data = students_response.json()
                print(f"👥 Students found: {json.dumps(students_data, indent=2, ensure_ascii=False)}")
                
                if students_data.get('students'):
                    print(f"✅ Found {len(students_data['students'])} students with code 111444")
                else:
                    print("❌ No students found with code 111444")
            else:
                print(f"❌ Failed to get students: {students_response.text}")
                
        else:
            print(f"❌ Failed to create user: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == "__main__":
    test_user_creation()
