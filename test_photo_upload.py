#!/usr/bin/env python3
"""
Test script for photo upload and virtual question creation
"""
import requests
import json

# API base URL
API_BASE_URL = "https://web-production-2678c.up.railway.app/api"

def test_photo_upload():
    """Test photo upload endpoint"""
    print("🧪 Testing photo upload and virtual question creation...")
    
    # Create a simple test image (1x1 pixel PNG)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Prepare files for upload
    files = {
        'photo': ('test_physics_question.png', test_image_data, 'image/png')
    }
    
    try:
        # Upload photo
        print("📸 Uploading test photo...")
        response = requests.post(f"{API_BASE_URL}/ai/upload-question-photo", files=files)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Photo upload successful!")
            print(f"📝 Message: {data.get('message')}")
            
            if 'virtual_question' in data:
                question = data['virtual_question']
                print(f"🤖 Generated virtual question:")
                print(f"   ID: {question.get('id')}")
                print(f"   Text: {question.get('text')[:100]}...")
                print(f"   Topic: {question.get('topic')}")
                print(f"   Difficulty: {question.get('difficulty')}")
                print(f"   Options: {len(question.get('options', []))} choices")
                print(f"   Answer: {question.get('correct_answer')}")
                
                return question
        else:
            print(f"❌ Upload failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during upload: {str(e)}")
        return None

def test_get_virtual_questions():
    """Test getting all virtual questions"""
    print("\n🔍 Testing virtual questions retrieval...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/ai/virtual-questions")
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            questions = data.get('questions', [])
            total = data.get('total', 0)
            
            print(f"✅ Found {total} virtual questions")
            
            for i, question in enumerate(questions[:3]):  # Show first 3
                print(f"   {i+1}. {question.get('text', '')[:80]}...")
                print(f"      Topic: {question.get('topic')} | Difficulty: {question.get('difficulty')}")
                
            return questions
        else:
            print(f"❌ Failed to get questions: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting questions: {str(e)}")
        return []

def test_ai_question_generation():
    """Test AI question generation"""
    print("\n🤖 Testing AI question generation...")
    
    try:
        response = requests.post(f"{API_BASE_URL}/ai/generate-question")
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            question = data.get('question')
            
            if question:
                print("✅ AI question generated successfully!")
                print(f"   Text: {question.get('text')}")
                print(f"   Topic: {question.get('topic')}")
                print(f"   Difficulty: {question.get('difficulty')}")
                print(f"   Options: {question.get('options')}")
                print(f"   Answer: {question.get('correct_answer')}")
                
                return question
        else:
            print(f"❌ Generation failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating question: {str(e)}")
        return None

def test_answer_checking(question):
    """Test answer checking"""
    if not question:
        return
        
    print("\n✅ Testing answer checking...")
    
    correct_answer = question.get('correct_answer')
    
    # Test with correct answer
    test_data = {
        "question_id": question.get('id'),
        "user_answer": correct_answer,
        "correct_answer": correct_answer
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/ai/check-answer", json=test_data)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            is_correct = result.get('is_correct')
            feedback = result.get('feedback')
            
            print(f"✅ Answer check result: {'Correct' if is_correct else 'Incorrect'}")
            print(f"   Feedback: {feedback}")
            print(f"   Confidence: {result.get('confidence', 0)}")
            
        else:
            print(f"❌ Answer check failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error checking answer: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting comprehensive AI Physics Test System tests...\n")
    
    # Test 1: Photo upload and virtual question creation
    uploaded_question = test_photo_upload()
    
    # Test 2: Get all virtual questions
    virtual_questions = test_get_virtual_questions()
    
    # Test 3: AI question generation
    ai_question = test_ai_question_generation()
    
    # Test 4: Answer checking
    test_question = uploaded_question or ai_question
    test_answer_checking(test_question)
    
    print("\n🎉 All tests completed!")
    print(f"📊 Summary:")
    print(f"   - Photo upload: {'✅' if uploaded_question else '❌'}")
    print(f"   - Virtual questions: {'✅' if virtual_questions else '❌'}")
    print(f"   - AI generation: {'✅' if ai_question else '❌'}")
    print(f"   - Answer checking: {'✅' if test_question else '❌'}")
