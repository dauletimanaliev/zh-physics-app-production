"""
Configuration file for the ЕНТ preparation bot
Add admin/teacher user IDs here
"""

# Admin/Teacher user IDs - add your teacher IDs here
# To get your Telegram user ID, send a message to @userinfobot
ADMIN_IDS = [
  
  1350637421  
   
    
    # Add your admin IDs here:
    # Your_User_ID_Here,
]

# Bot settings
BOT_SETTINGS = {
    'subjects': ['physics', 'mathematics'],  # Only Physics and Mathematics
    'default_language': 'ru',
    'points_per_correct_answer': 10,
    'points_per_level': 100,
    'max_test_questions': 10,
}

# Database settings
DATABASE_SETTINGS = {
    'db_path': 'ent_bot.db',
    'backup_enabled': True,
    'backup_interval_hours': 24,
}

# Gamification settings
GAMIFICATION = {
    'levels': {
        1: {'min_points': 0, 'title': 'Новичок'},
        2: {'min_points': 100, 'title': 'Ученик'},
        3: {'min_points': 300, 'title': 'Знаток'},
        4: {'min_points': 600, 'title': 'Эксперт'},
        5: {'min_points': 1000, 'title': 'Мастер'},
        6: {'min_points': 1500, 'title': 'Гуру'},
        7: {'min_points': 2500, 'title': 'Легенда'},
    },
    'achievements': [
        {'id': 'first_test', 'name': 'Первый тест', 'description': 'Пройти первый тест', 'points': 25},
        {'id': 'physics_master', 'name': 'Мастер физики', 'description': 'Пройти 10 тестов по физике', 'points': 100},
        {'id': 'math_genius', 'name': 'Гений математики', 'description': 'Пройти 10 тестов по математике', 'points': 100},
        {'id': 'perfect_score', 'name': 'Идеальный результат', 'description': 'Получить 100% в тесте', 'points': 50},
        {'id': 'streak_7', 'name': 'Неделя активности', 'description': 'Проходить тесты 7 дней подряд', 'points': 150},
    ]
}

# Messages for different languages
WELCOME_MESSAGES = {
    'ru': """
🎓 Добро пожаловать в бота для подготовки к ЕНТ!

📚 Доступные предметы:
• Физика
• Математика

🎮 Особенности:
• Интерактивные тесты
• Система очков и уровней
• Видеоуроки
• Расписание занятий
• Поддержка 3 языков

Выберите язык для начала работы:
""",
    'kz': """
🎓 ҰБТ-ға дайындалу ботына қош келдіңіз!

📚 Қол жетімді пәндер:
• Физика
• Математика

🎮 Ерекшеліктер:
• Интерактивті тесттер
• Ұпай және деңгей жүйесі
• Видеосабақтар
• Сабақ кестесі
• 3 тілді қолдау

Жұмысты бастау үшін тілді таңдаңыз:
""",
    'en': """
🎓 Welcome to the UNT preparation bot!

📚 Available subjects:
• Physics
• Mathematics

🎮 Features:
• Interactive tests
• Points and levels system
• Video lessons
• Class schedule
• 3 language support

Choose your language to get started:
"""
}
