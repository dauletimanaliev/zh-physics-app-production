#!/usr/bin/env python3
import requests
import json
import random
from datetime import datetime, timedelta

API_URL = "https://web-production-2678c.up.railway.app/api"

def create_user(user_data):
    """Create a new user via API"""
    try:
        response = requests.post(f"{API_URL}/users", json=user_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created user: {user_data['first_name']} {user_data['last_name']} (ID: {result.get('id', 'unknown')})")
            return result
        else:
            print(f"❌ Failed to create user: {user_data['first_name']} {user_data['last_name']}")
            print(f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return None

def generate_random_stats():
    """Generate random user statistics"""
    tests_completed = random.randint(15, 80)
    average_score = random.randint(65, 98)
    streak_days = random.randint(3, 25)
    study_time_hours = random.randint(10, 50)
    study_time_minutes = random.randint(0, 59)
    
    # Random last activity (1-30 days ago)
    last_activity = datetime.now() - timedelta(days=random.randint(1, 30))
    
    return {
        "tests_completed": tests_completed,
        "average_score": average_score,
        "streak_days": streak_days,
        "study_time": f"{study_time_hours}ч {study_time_minutes}м",
        "last_activity": last_activity.isoformat()
    }

def main():
    """Create test users with realistic Kazakh names"""
    print("🚀 Creating test users...")
    
    users = [
        {
            "telegram_id": 1001,
            "first_name": "Айгерим",
            "last_name": "Касымова",
            "username": "aigera_k",
            "birth_date": "2006-03-15",
            "school": "Назарбаев Интеллектуальная школа",
            "class": "11А",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1002,
            "first_name": "Данияр",
            "last_name": "Муратов",
            "username": "daniyar_m",
            "birth_date": "2005-11-22",
            "school": "Гимназия №159",
            "class": "11Б",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1003,
            "first_name": "Амина",
            "last_name": "Сарсенова",
            "username": "amina_s",
            "birth_date": "2006-07-08",
            "school": "Лицей №28",
            "class": "10А",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1004,
            "first_name": "Арман",
            "last_name": "Жанибеков",
            "username": "arman_zh",
            "birth_date": "2005-09-12",
            "school": "Школа-лицей №165",
            "class": "11В",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1005,
            "first_name": "Алия",
            "last_name": "Токтарова",
            "username": "aliya_t",
            "birth_date": "2006-01-25",
            "school": "Гимназия №25",
            "class": "10Б",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1006,
            "first_name": "Нурлан",
            "last_name": "Абдуллаев",
            "username": "nurlan_a",
            "birth_date": "2005-05-30",
            "school": "Лицей БИЛ",
            "class": "11А",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1007,
            "first_name": "Жанель",
            "last_name": "Кенжебаева",
            "username": "zhanel_k",
            "birth_date": "2006-04-18",
            "school": "Назарбаев Интеллектуальная школа",
            "class": "10В",
            "role": "student",
            **generate_random_stats()
        },
        {
            "telegram_id": 1008,
            "first_name": "Ерлан",
            "last_name": "Сейтказиев",
            "username": "erlan_s",
            "birth_date": "2005-12-03",
            "school": "Гимназия №159",
            "class": "11Г",
            "role": "student",
            **generate_random_stats()
        }
    ]
    
    created_users = []
    for user in users:
        result = create_user(user)
        if result:
            created_users.append(result)
    
    print(f"\n✅ Successfully created {len(created_users)} users")
    
    # Verify users were created
    print("\n📋 Checking created users...")
    try:
        response = requests.get(f"{API_URL}/users")
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print(f"Total users in database: {len(users)}")
            for user in users:
                print(f"  - ID: {user.get('id', user.get('telegram_id'))}, Name: {user.get('first_name', user.get('name', 'Unknown'))} {user.get('last_name', user.get('surname', ''))}")
        else:
            print(f"❌ Failed to fetch users: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching users: {e}")

if __name__ == "__main__":
    main()
