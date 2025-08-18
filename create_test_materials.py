#!/usr/bin/env python3
import requests
import json

API_URL = "https://web-production-2678c.up.railway.app/api"

def create_material(material_data):
    """Create a new material via API"""
    try:
        response = requests.post(f"{API_URL}/materials", json=material_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created material: {material_data['title']} (ID: {result.get('id', 'unknown')})")
            return result
        else:
            print(f"❌ Failed to create material: {material_data['title']}")
            print(f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating material: {e}")
        return None

def main():
    """Create test materials"""
    print("🚀 Creating test materials...")
    
    materials = [
        {
            "title": "Механика: Основы кинематики",
            "description": "Изучение движения тел без учета причин, вызывающих это движение",
            "subject": "Физика",
            "grade": "10",
            "teacher": "Иванов И.И.",
            "tags": ["механика", "кинематика", "движение"],
            "attachments": [],
            "isPublished": 1
        },
        {
            "title": "Электричество и магнетизм",
            "description": "Основы электростатики и электродинамики",
            "subject": "Физика", 
            "grade": "11",
            "teacher": "Петров П.П.",
            "tags": ["электричество", "магнетизм", "заряд"],
            "attachments": [],
            "isPublished": 1
        },
        {
            "title": "Оптика: Законы отражения и преломления",
            "description": "Изучение поведения света при взаимодействии с различными средами",
            "subject": "Физика",
            "grade": "11", 
            "teacher": "Сидоров С.С.",
            "tags": ["оптика", "свет", "отражение", "преломление"],
            "attachments": [],
            "isPublished": 1
        }
    ]
    
    created_materials = []
    for material in materials:
        result = create_material(material)
        if result:
            created_materials.append(result)
    
    print(f"\n✅ Successfully created {len(created_materials)} materials")
    
    # Verify materials were created
    print("\n📋 Checking created materials...")
    try:
        response = requests.get(f"{API_URL}/materials")
        if response.status_code == 200:
            materials = response.json()
            if isinstance(materials, list):
                print(f"Total materials in database: {len(materials)}")
                for material in materials:
                    print(f"  - ID: {material['id']}, Title: {material['title']}")
            else:
                materials = materials.get('materials', [])
                print(f"Total materials in database: {len(materials)}")
                for material in materials:
                    print(f"  - ID: {material['id']}, Title: {material['title']}")
        else:
            print(f"❌ Failed to fetch materials: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching materials: {e}")

if __name__ == "__main__":
    main()
