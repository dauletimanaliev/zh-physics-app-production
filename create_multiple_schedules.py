#!/usr/bin/env python3
"""
Script to create multiple test schedules for better testing
"""

import requests
import json
from datetime import datetime, timedelta

# API configuration
API_BASE_URL = "https://web-production-2678c.up.railway.app/api"

def create_schedule(schedule_data):
    """Create a single schedule"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/schedules",
            json=schedule_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ Created: {schedule_data['title']} ({schedule_data['dayOfWeek']})")
            return result
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def create_test_schedules():
    """Create multiple test schedules"""
    
    today = datetime.now()
    start_date = today.strftime('%Y-%m-%d')
    end_date = (today + timedelta(days=30)).strftime('%Y-%m-%d')
    
    schedules = [
        {
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
        },
        {
            "title": "Физика - Механика",
            "description": "Основы механики для 10 класса",
            "startDate": start_date,
            "endDate": end_date,
            "type": "lecture",
            "difficulty": "intermediate",
            "location": "Кабинет 205",
            "dayOfWeek": "wednesday",
            "subject": "Кинематика",
            "startTime": "11:00",
            "endTime": "12:30",
            "duration": "90",
            "teacherId": 1,
            "userId": 1
        },
        {
            "title": "Физика - Механика",
            "description": "Основы механики для 10 класса",
            "startDate": start_date,
            "endDate": end_date,
            "type": "lecture",
            "difficulty": "intermediate",
            "location": "Кабинет 205",
            "dayOfWeek": "friday",
            "subject": "Динамика",
            "startTime": "14:00",
            "endTime": "15:30",
            "duration": "90",
            "teacherId": 1,
            "userId": 1
        },
        {
            "title": "Математика - Алгебра",
            "description": "Алгебра для 11 класса",
            "startDate": start_date,
            "endDate": end_date,
            "type": "lecture",
            "difficulty": "advanced",
            "location": "Кабинет 301",
            "dayOfWeek": "tuesday",
            "subject": "Алгебра",
            "startTime": "10:00",
            "endTime": "11:30",
            "duration": "90",
            "teacherId": 1,
            "userId": 1
        },
        {
            "title": "Математика - Алгебра",
            "description": "Алгебра для 11 класса",
            "startDate": start_date,
            "endDate": end_date,
            "type": "lecture",
            "difficulty": "advanced",
            "location": "Кабинет 301",
            "dayOfWeek": "thursday",
            "subject": "Функции",
            "startTime": "13:00",
            "endTime": "14:30",
            "duration": "90",
            "teacherId": 1,
            "userId": 1
        }
    ]
    
    print(f"📅 Creating {len(schedules)} test schedules...")
    
    created_count = 0
    for schedule in schedules:
        result = create_schedule(schedule)
        if result:
            created_count += 1
    
    print(f"\n📊 Created {created_count}/{len(schedules)} schedules")
    
    # Check final count
    response = requests.get(f"{API_BASE_URL}/schedules/user/1")
    if response.status_code == 200:
        final_schedules = response.json()
        print(f"📋 Total schedules in database: {len(final_schedules)}")
        for schedule in final_schedules:
            print(f"  - {schedule.get('title', 'No title')} ({schedule.get('dayOfWeek', 'No day')})")
    
    return created_count

if __name__ == "__main__":
    print("🚀 Creating multiple test schedules...")
    create_test_schedules()
