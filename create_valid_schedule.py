#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

# API URL
API_URL = "https://web-production-2678c.up.railway.app/api"

def create_valid_schedule():
    """Создает валидное расписание с правильными полями"""
    
    # Правильный формат данных для расписания
    schedule_data = {
        "title": "Физика - Механика",
        "description": "Основы механики для 10 класса",
        "subject": "Физика",
        "dayOfWeek": "monday",  # camelCase формат
        "startTime": "09:00",   # обязательно
        "endTime": "10:30",     # обязательно
        "startDate": "2025-08-20",  # обязательно
        "endDate": "2025-09-20",    # обязательно
        "location": "Кабинет 205",
        "maxStudents": 25,
        "teacherId": 1,
        "userId": 1,
        "type": "lecture",
        "difficulty": "intermediate",
        "duration": 90,
        "price": 0,
        "isRecurring": True,
        "isOnline": False,
        "requirements": "Учебник физики 10 класс"
    }
    
    try:
        print(f"📅 Создаю валидное расписание: {schedule_data['title']}")
        print(f"🔍 Данные: {json.dumps(schedule_data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            f"{API_URL}/schedules",
            json=schedule_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Расписание создано успешно!")
            print(f"📋 ID: {result.get('id')}")
            print(f"📋 Название: {result.get('title')}")
            print(f"📋 Время: {result.get('startTime')} - {result.get('endTime')}")
            print(f"📋 Даты: {result.get('startDate')} до {result.get('endDate')}")
            return result
        else:
            print(f"❌ Ошибка создания: {response.status_code}")
            print(f"📋 Ответ: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

def get_all_schedules():
    """Получает все публичные расписания"""
    try:
        response = requests.get(f"{API_URL}/schedules/public")
        if response.status_code == 200:
            schedules = response.json()
            print(f"📅 Найдено расписаний: {len(schedules)}")
            for schedule in schedules:
                print(f"  - {schedule.get('title')} ({schedule.get('start_date')} - {schedule.get('end_date')})")
            return schedules
        else:
            print(f"❌ Ошибка получения расписаний: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Создание валидного расписания")
    print("=" * 50)
    
    # Создаем валидное расписание
    result = create_valid_schedule()
    
    if result:
        print("\n" + "=" * 50)
        print("📋 Проверяем все расписания:")
        get_all_schedules()
