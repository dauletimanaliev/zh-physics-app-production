#!/usr/bin/env python3
"""
Clear all students from the database
"""
import requests
import json

# API Configuration
API_BASE_URL = "https://web-production-2678c.up.railway.app/api"

def clear_all_students():
    """Clear all students from the database"""
    try:
        print("🗑️ Clearing all students from database...")
        
        # Get all users first
        response = requests.get(f"{API_BASE_URL}/admin/users")
        if response.status_code != 200:
            print(f"❌ Failed to get users: {response.status_code}")
            return
        
        users = response.json().get('users', [])
        print(f"📊 Found {len(users)} users in database")
        
        # Delete each user
        deleted_count = 0
        for user in users:
            user_id = user.get('id') or user.get('telegram_id')
            if user_id:
                delete_response = requests.delete(f"{API_BASE_URL}/admin/users/{user_id}")
                if delete_response.status_code == 200:
                    deleted_count += 1
                    print(f"✅ Deleted user: {user.get('first_name', 'Unknown')} (ID: {user_id})")
                else:
                    print(f"❌ Failed to delete user {user_id}: {delete_response.status_code}")
        
        print(f"🎯 Successfully deleted {deleted_count} users")
        
        # Verify database is empty
        verify_response = requests.get(f"{API_BASE_URL}/admin/users")
        if verify_response.status_code == 200:
            remaining_users = verify_response.json().get('users', [])
            print(f"📊 Remaining users in database: {len(remaining_users)}")
        
    except Exception as e:
        print(f"❌ Error clearing students: {e}")

if __name__ == "__main__":
    clear_all_students()
