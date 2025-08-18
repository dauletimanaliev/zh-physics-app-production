#!/usr/bin/env python3
import requests
import os
from PIL import Image, ImageDraw, ImageFont

# Create a test image with Kazakh text
def create_test_image():
    # Create a white image
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    # Add the Kazakh text from the problem
    text = """Төмендегі сурете оқушылардың жүрген жолы мен ғимараттардың 
арасындағы қашықтық берілген. Егер Айжан мектептен дүкенге 5 минутта, 
ал Олжас дүкеннен кітапханаға 3 минутта, Арман үйінен кітапханаға 
9 минутта барса, жылдамдығы ең үлкен оқушы:

A) Айжан
B) Олжас  
C) Арман
D) Айжан мен Арман
E) Олжас пен Арман"""
    
    # Draw text on image
    draw.multiline_text((50, 50), text, fill='black', font=font, spacing=10)
    
    # Save the image
    img.save('test_kazakh_problem.png')
    print("✅ Created test image: test_kazakh_problem.png")
    return 'test_kazakh_problem.png'

def test_photo_upload():
    # Create test image
    image_path = create_test_image()
    
    # Upload to API
    api_url = "https://web-production-2678c.up.railway.app/api/ai/upload-question-photo"
    
    try:
        with open(image_path, 'rb') as f:
            files = {'photo': ('test_problem.png', f, 'image/png')}
            response = requests.post(api_url, files=files, timeout=30)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Photo upload successful!")
            print(f"📝 Message: {data.get('message', 'No message')}")
            
            if 'virtual_question' in data:
                vq = data['virtual_question']
                print("🤖 Generated virtual question:")
                print(f"   ID: {vq.get('id')}")
                print(f"   Text: {vq.get('text', '')[:100]}...")
                print(f"   Topic: {vq.get('topic')}")
                print(f"   Difficulty: {vq.get('difficulty')}")
                print(f"   Options: {len(vq.get('options', []))} choices")
                print(f"   Answer: {vq.get('correct_answer')}")
        else:
            print(f"❌ Upload failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Clean up
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    test_photo_upload()
