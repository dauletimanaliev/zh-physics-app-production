#!/usr/bin/env python3
"""
Script to create test schedule data via API
"""

import requests
import json
from datetime import datetime, timedelta

# API configuration
API_BASE_URL = "https://web-production-2678c.up.railway.app/api"

def create_test_schedule():
    """Create a test schedule for teacher ID 1"""
    
    # Calculate dates
    today = datetime.now()
    start_date = today.strftime('%Y-%m-%d')
    end_date = (today + timedelta(days=30)).strftime('%Y-%m-%d')
    
    schedule_data = {
        "title": "Физика - Механика",
        "description": "Основы механики для 10 класса",
        "startDate": start_date,
        "endDate": end_date,
        "type": "lecture",
        "difficulty": "intermediate",
        "location": "Кабинет 205",
        "dayOfWeek": "monday",
        "subject": "Механика",
        "startTime": "09:00",
        "endTime": "10:30",
        "duration": "90",
        "teacherId": 1,
        "userId": 1
    }
    
    try:
        print(f"📅 Creating test schedule...")
        print(f"API URL: {API_BASE_URL}/schedules")
        print(f"Schedule data: {json.dumps(schedule_data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            f"{API_BASE_URL}/schedules",
            json=schedule_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print(f"✅ Schedule created successfully!")
            print(f"Created schedule: {json.dumps(result, indent=2, ensure_ascii=False)}")
            return result
        else:
            print(f"❌ Error creating schedule: {response.status_code}")
            print(f"Response text: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception creating schedule: {e}")
        return None

def get_user_schedules(user_id=1):
    """Get schedules for a user"""
    try:
        print(f"📋 Getting schedules for user {user_id}...")
        
        response = requests.get(f"{API_BASE_URL}/schedules/user/{user_id}")
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            schedules = response.json()
            print(f"✅ Found {len(schedules)} schedules:")
            for schedule in schedules:
                print(f"  - {schedule.get('title', 'No title')} ({schedule.get('dayOfWeek', 'No day')})")
            return schedules
        else:
            print(f"❌ Error getting schedules: {response.status_code}")
            print(f"Response text: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Exception getting schedules: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Testing schedule API...")
    
    # First, check existing schedules
    existing_schedules = get_user_schedules(1)
    
    # Create a test schedule
    created_schedule = create_test_schedule()
    
    # Check schedules again
    print("\n" + "="*50)
    updated_schedules = get_user_schedules(1)
    
    print(f"\n📊 Summary:")
    print(f"Before: {len(existing_schedules)} schedules")
    print(f"After: {len(updated_schedules)} schedules")
