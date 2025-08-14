"""
Multilingual support for the ЕНТ preparation bot
Supports Russian (ru), Kazakh (kz), and English (en)
"""

TRANSLATIONS = {
    'ru': {
        # Commands and buttons
        'start_welcome': "👋 Добро пожаловать в бота для подготовки к ЕНТ!\n\nВыберите язык:",
        'language_selected': "✅ Язык установлен: Русский",
        'main_menu': "📚 Главное меню",
        'schedule_btn': "📅 Расписание",
        'videos_btn': "🎥 Видеоуроки",
        'materials_btn': "📖 Материалы",
        'test_btn': "📝 Тесты",
        'top_btn': "🏆 Рейтинг",
        'quests_btn': "🎯 Квесты",
        'help_btn': "❓ Помощь",
        'language_btn': "🌐 Язык",
        'game_btn': "🎮 Викторина",
        'webapp_btn': "🌐 Веб-приложение",
        
        # Schedule
        'schedule_title': "📅 Расписание занятий",
        'no_schedule': "Расписание пока не добавлено",
        'schedule_day': "День",
        'schedule_time': "Время",
        'schedule_subject': "Предмет",
        'schedule_topic': "Тема",
        
        # Subjects
        'physics': "Физика",
        'mathematics': "Математика",
        'chemistry': "Химия",
        'biology': "Биология",
        'history': "История",
        'geography': "География",
        'kazakh_lang': "Казахский язык",
        'russian_lang': "Русский язык",
        'english_lang': "Английский язык",
        
        # Tests
        'choose_subject': "Выберите предмет для тестирования:",
        'test_question': "Вопрос {current}/{total}",
        'test_result': "🎯 Результат теста:\n\nПравильных ответов: {correct}/{total}\nПроцент: {percentage}%\nПолучено очков: +{points}",
        'correct_answer': "✅ Правильно!",
        'wrong_answer': "❌ Неправильно. Правильный ответ: {answer}",
        
        # Leaderboard
        'leaderboard_title': "🏆 Топ игроков",
        'leaderboard_entry': "{position}. {name} - {points} очков (Уровень {level})",
        'your_position': "Ваша позиция: {position}",
        'your_stats': "📊 Ваша статистика:\nОчки: {points}\nУровень: {level}",
        
        # Quests
        'quests_title': "🎯 Активные квесты",
        'quest_entry': "🎯 {title}\n📝 {description}\n🏆 Награда: {reward} очков",
        'no_quests': "Активных квестов нет",
        
        # Materials
        'materials_title': "📖 Учебные материалы",
        'choose_material_subject': "Выберите предмет:",
        'no_materials': "Материалы не найдены",
        
        # Help
        'help_text': """📚 Помощь по командам:

/start - Начать работу с ботом
/schedule - Посмотреть расписание
/videos - Видеоуроки по предметам
/materials - Учебные материалы
/test - Пройти тест
/top - Таблица лидеров
/quests - Активные квесты
/language - Сменить язык
/help - Эта справка

🎮 Геймификация:
• За каждый пройденный тест получаете очки
• Уровень повышается каждые 100 очков
• Выполняйте квесты для бонусных очков""",
        
        # Days of week
        'monday': "Понедельник",
        'tuesday': "Вторник", 
        'wednesday': "Среда",
        'thursday': "Четверг",
        'friday': "Пятница",
        'saturday': "Суббота",
        'sunday': "Воскресенье",
        
        # Common
        'back': "◀️ Назад",
        'next': "Далее ▶️",
        'cancel': "❌ Отмена",
        'loading': "⏳ Загрузка...",
    },
    
    'kz': {
        # Commands and buttons
        'start_welcome': "👋 ҰБТ-ға дайындалу ботына қош келдіңіз!\n\nТілді таңдаңыз:",
        'language_selected': "✅ Тіл орнатылды: Қазақша",
        'main_menu': "📚 Басты мәзір",
        'schedule_btn': "📅 Кесте",
        'videos_btn': "🎥 Видеосабақтар",
        'materials_btn': "📖 Материалдар",
        'test_btn': "📝 Тесттер",
        'top_btn': "🏆 Рейтинг",
        'quests_btn': "🎯 Квесттер",
        'help_btn': "❓ Көмек",
        'language_btn': "🌐 Тіл",
        
        # Schedule
        'schedule_title': "📅 Сабақ кестесі",
        'no_schedule': "Кесте әлі қосылмаған",
        'schedule_day': "Күн",
        'schedule_time': "Уақыт",
        'schedule_subject': "Пән",
        'schedule_topic': "Тақырып",
        
        # Subjects
        'physics': "Физика",
        'mathematics': "Математика",
        'chemistry': "Химия",
        'biology': "Биология", 
        'history': "Тарих",
        'geography': "География",
        'kazakh_lang': "Қазақ тілі",
        'russian_lang': "Орыс тілі",
        'english_lang': "Ағылшын тілі",
        
        # Tests
        'choose_subject': "Тест үшін пәнді таңдаңыз:",
        'test_question': "Сұрақ {current}/{total}",
        'test_result': "🎯 Тест нәтижесі:\n\nДұрыс жауаптар: {correct}/{total}\nПайыз: {percentage}%\nАлған ұпайлар: +{points}",
        'correct_answer': "✅ Дұрыс!",
        'wrong_answer': "❌ Қате. Дұрыс жауап: {answer}",
        
        # Leaderboard
        'leaderboard_title': "🏆 Топ ойыншылар",
        'leaderboard_entry': "{position}. {name} - {points} ұпай (Деңгей {level})",
        'your_position': "Сіздің орныңыз: {position}",
        'your_stats': "📊 Сіздің статистикаңыз:\nУпайлар: {points}\nДеңгей: {level}",
        
        # Quests
        'quests_title': "🎯 Белсенді квесттер",
        'quest_entry': "🎯 {title}\n📝 {description}\n🏆 Сыйлық: {reward} ұпай",
        'no_quests': "Белсенді квесттер жоқ",
        
        # Materials
        'materials_title': "📖 Оқу материалдары",
        'choose_material_subject': "Пәнді таңдаңыз:",
        'no_materials': "Материалдар табылмады",
        
        # Help
        'help_text': """📚 Командалар бойынша көмек:

/start - Ботпен жұмысты бастау
/schedule - Кестені қарау
/videos - Пәндер бойынша видеосабақтар
/materials - Оқу материалдары
/test - Тест тапсыру
/top - Лидерлер кестесі
/quests - Белсенді квесттер
/language - Тілді өзгерту
/help - Бұл анықтама

🎮 Геймификация:
• Әр тапсырылған тест үшін ұпай аласыз
• Деңгей әр 100 ұпайға көтеріледі
• Бонус ұпайлар үшін квесттерді орындаңыз""",
        
        # Days of week
        'monday': "Дүйсенбі",
        'tuesday': "Сейсенбі",
        'wednesday': "Сәрсенбі", 
        'thursday': "Бейсенбі",
        'friday': "Жұма",
        'saturday': "Сенбі",
        'sunday': "Жексенбі",
        
        # Common
        'back': "◀️ Артқа",
        'next': "Келесі ▶️",
        'cancel': "❌ Болдырмау",
        'loading': "⏳ Жүктелуде...",
    },
    
    'en': {
        # Commands and buttons
        'start_welcome': "👋 Welcome to the UNT preparation bot!\n\nChoose your language:",
        'language_selected': "✅ Language set: English",
        'main_menu': "📚 Main Menu",
        'schedule_btn': "📅 Schedule",
        'videos_btn': "🎥 Video Lessons",
        'materials_btn': "📖 Materials",
        'test_btn': "📝 Tests",
        'top_btn': "🏆 Leaderboard",
        'quests_btn': "🎯 Quests",
        'help_btn': "❓ Help",
        'language_btn': "🌐 Language",
        
        # Schedule
        'schedule_title': "📅 Class Schedule",
        'no_schedule': "No schedule added yet",
        'schedule_day': "Day",
        'schedule_time': "Time",
        'schedule_subject': "Subject",
        'schedule_topic': "Topic",
        
        # Subjects
        'physics': "Physics",
        'mathematics': "Mathematics",
        'chemistry': "Chemistry",
        'biology': "Biology",
        'history': "History",
        'geography': "Geography",
        'kazakh_lang': "Kazakh Language",
        'russian_lang': "Russian Language",
        'english_lang': "English Language",
        
        # Tests
        'choose_subject': "Choose subject for testing:",
        'test_question': "Question {current}/{total}",
        'test_result': "🎯 Test Result:\n\nCorrect answers: {correct}/{total}\nPercentage: {percentage}%\nPoints earned: +{points}",
        'correct_answer': "✅ Correct!",
        'wrong_answer': "❌ Wrong. Correct answer: {answer}",
        
        # Leaderboard
        'leaderboard_title': "🏆 Top Players",
        'leaderboard_entry': "{position}. {name} - {points} points (Level {level})",
        'your_position': "Your position: {position}",
        'your_stats': "📊 Your Statistics:\nPoints: {points}\nLevel: {level}",
        
        # Quests
        'quests_title': "🎯 Active Quests",
        'quest_entry': "🎯 {title}\n📝 {description}\n🏆 Reward: {reward} points",
        'no_quests': "No active quests",
        
        # Materials
        'materials_title': "📖 Study Materials",
        'choose_material_subject': "Choose subject:",
        'no_materials': "No materials found",
        
        # Help
        'help_text': """📚 Command Help:

/start - Start using the bot
/schedule - View schedule
/videos - Video lessons by subject
/materials - Study materials
/test - Take a test
/top - Leaderboard
/quests - Active quests
/language - Change language
/help - This help

🎮 Gamification:
• Earn points for each completed test
• Level up every 100 points
• Complete quests for bonus points""",
        
        # Days of week
        'monday': "Monday",
        'tuesday': "Tuesday",
        'wednesday': "Wednesday",
        'thursday': "Thursday", 
        'friday': "Friday",
        'saturday': "Saturday",
        'sunday': "Sunday",
        
        # Common
        'back': "◀️ Back",
        'next': "Next ▶️",
        'cancel': "❌ Cancel",
        'loading': "⏳ Loading...",
    }
}

def get_text(key: str, language: str = 'ru', **kwargs) -> str:
    """Get translated text by key and language"""
    if language not in TRANSLATIONS:
        language = 'ru'  # fallback to Russian
    
    text = TRANSLATIONS[language].get(key, TRANSLATIONS['ru'].get(key, key))
    
    # Format with provided kwargs
    try:
        return text.format(**kwargs)
    except (KeyError, ValueError):
        return text

def get_language_keyboard():
    """Get language selection keyboard"""
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru"),
            InlineKeyboardButton(text="🇰🇿 Қазақша", callback_data="lang_kz"),
        ],
        [
            InlineKeyboardButton(text="🇬🇧 English", callback_data="lang_en"),
        ]
    ])
    return keyboard

def get_main_menu_keyboard(language: str = 'ru'):
    """Get main menu keyboard"""
    from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=get_text('schedule_btn', language)),
                KeyboardButton(text=get_text('videos_btn', language)),
            ],
            [
                KeyboardButton(text=get_text('materials_btn', language)),
                KeyboardButton(text=get_text('test_btn', language)),
            ],
            [
                KeyboardButton(text=get_text('top_btn', language)),
                KeyboardButton(text=get_text('quests_btn', language)),
            ],
            [
                KeyboardButton(
                    text=get_text('webapp_btn', language),
                    web_app=WebAppInfo(url="https://your-domain.com/ent_web_app/index.html")
                ),
                KeyboardButton(text=get_text('help_btn', language)),
            ],
            [
                KeyboardButton(text=get_text('language_btn', language)),
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    return keyboard

def get_subjects_keyboard(language: str = 'ru'):
    """Get subjects selection keyboard - Physics and Mathematics only"""
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    
    subjects = [
        ('physics', 'physics'),
        ('mathematics', 'mathematics'),
    ]
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text=get_text(subject_key, language),
            callback_data=f"subject_{subject_value}"
        )] for subject_key, subject_value in subjects
    ])
    return keyboard
