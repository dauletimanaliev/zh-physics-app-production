#!/usr/bin/env python3
import requests
import json

def create_material_with_id_1():
    """Попытка создать материал с ID 1 через API"""
    
    # Сначала проверим что база пустая
    response = requests.get('https://web-production-2678c.up.railway.app/api/materials')
    materials = response.json().get('materials', [])
    print(f"📊 Материалов в базе: {len(materials)}")
    
    # Создадим материал
    material_data = {
        "title": "Первый материал",
        "description": "Материал с ID 1",
        "subject": "Физика", 
        "grade": "10",
        "teacher": "Учитель",
        "tags": ["физика", "первый"],
        "attachments": [],
        "isPublished": 1
    }
    
    response = requests.post(
        'https://web-production-2678c.up.railway.app/api/materials',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(material_data)
    )
    
    if response.status_code == 200:
        result = response.json()
        material_id = result.get('material_id')
        print(f"✅ Материал создан с ID: {material_id}")
        return material_id
    else:
        print(f"❌ Ошибка создания материала: {response.text}")
        return None

if __name__ == "__main__":
    create_material_with_id_1()
