#!/usr/bin/env python3
"""
Clear all users from production database on Railway
"""
import requests
import json

# Production API Configuration
API_BASE_URL = "https://web-production-2678c.up.railway.app"

def clear_production_users():
    """Clear all users from production database"""
    try:
        print("🗑️ Clearing all users from production database...")
        
        # Direct database clear endpoint
        clear_url = f"{API_BASE_URL}/admin/clear-users"
        
        response = requests.post(clear_url)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result.get('message', 'Users cleared successfully')}")
            print(f"📊 Deleted {result.get('deleted_count', 0)} users")
        else:
            print(f"❌ Failed to clear users: {response.status_code}")
            print(f"Response: {response.text}")
        
        # Verify database is empty
        verify_response = requests.get(f"{API_BASE_URL}/api/admin/users")
        if verify_response.status_code == 200:
            remaining_users = verify_response.json().get('users', [])
            print(f"📊 Remaining users in production: {len(remaining_users)}")
        
    except Exception as e:
        print(f"❌ Error clearing production users: {e}")

if __name__ == "__main__":
    clear_production_users()
