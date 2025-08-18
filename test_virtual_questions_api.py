#!/usr/bin/env python3
import requests

def test_virtual_questions_api():
    """Test the virtual questions API to see if photos are included"""
    api_url = "https://web-production-2678c.up.railway.app/api/ai/virtual-questions"
    
    try:
        response = requests.get(api_url, timeout=30)
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            questions = data.get('questions', [])
            total = data.get('total', 0)
            
            print(f"✅ Found {total} virtual questions")
            
            for i, question in enumerate(questions[:3]):  # Show first 3
                print(f"\n🤖 Question {i+1}:")
                print(f"   ID: {question.get('id')}")
                print(f"   Text: {question.get('text', '')[:60]}...")
                print(f"   Topic: {question.get('topic')}")
                print(f"   Has photo: {'Yes' if question.get('original_photo') else 'No'}")
                if question.get('original_photo'):
                    photo_data = question.get('original_photo')
                    print(f"   Photo size: {len(photo_data)} chars")
                    print(f"   Photo starts with: {photo_data[:50]}...")
        else:
            print(f"❌ API failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_virtual_questions_api()
