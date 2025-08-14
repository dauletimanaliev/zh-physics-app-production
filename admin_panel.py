"""
Advanced Admin Panel for ЕНТ Bot
Full schedule management, content control, and admin features
"""

import asyncio
from typing import List, Dict, Any, Optional
from aiogram import Bot
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from database import Database
from config import ADMIN_IDS
import aiosqlite

class AdminStates(StatesGroup):
    # Schedule management
    waiting_for_schedule_day = State()
    waiting_for_schedule_time_start = State()
    waiting_for_schedule_time_end = State()
    waiting_for_schedule_subject = State()
    waiting_for_schedule_topic = State()
    waiting_for_schedule_teacher = State()
    waiting_for_schedule_classroom = State()
    waiting_for_schedule_description = State()
    
    # Material management
    waiting_for_material_subject = State()
    waiting_for_material_topic = State()
    waiting_for_material_title = State()
    waiting_for_material_url = State()
    waiting_for_material_description = State()
    
    # Test management
    waiting_for_test_subject = State()
    waiting_for_test_question = State()
    waiting_for_test_option_a = State()
    waiting_for_test_option_b = State()
    waiting_for_test_option_c = State()
    waiting_for_test_option_d = State()
    waiting_for_test_correct = State()
    waiting_for_test_explanation = State()
    
    # Broadcast
    waiting_for_broadcast = State()
    
    # Quest management
    waiting_for_quest_title = State()
    waiting_for_quest_description = State()
    waiting_for_quest_reward = State()

class AdvancedAdminPanel:
    def __init__(self, bot: Bot, db: Database):
        self.bot = bot
        self.db = db
    
    def is_admin(self, user_id: int) -> bool:
        """Check if user is admin"""
        return user_id in ADMIN_IDS
    
    def get_main_admin_keyboard(self):
        """Get main admin panel keyboard"""
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="📅 Управление расписанием", callback_data="admin_schedule"),
                InlineKeyboardButton(text="🗑️ Удалить из расписания", callback_data="admin_schedule_manage_delete")
            ],
            [
                InlineKeyboardButton(text="📚 Управление материалами", callback_data="admin_materials"),
                InlineKeyboardButton(text="📝 Управление тестами", callback_data="admin_tests")
            ],
            [
                InlineKeyboardButton(text="🎯 Управление квестами", callback_data="admin_quests"),
                InlineKeyboardButton(text="📢 Массовая рассылка", callback_data="admin_broadcast")
            ],
            [
                InlineKeyboardButton(text="👥 Список пользователей", callback_data="admin_users"),
                InlineKeyboardButton(text="📊 Статистика", callback_data="admin_stats")
            ],
            [
                InlineKeyboardButton(text="👤 Пользовательское меню", callback_data="user_menu")
            ]
        ])
        return keyboard
    
    def get_schedule_management_keyboard(self):
        """Get schedule management keyboard"""
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="➕ Добавить занятие", callback_data="admin_schedule_add"),
                InlineKeyboardButton(text="📋 Просмотр расписания", callback_data="admin_schedule_view"),
            ],
            [
                InlineKeyboardButton(text="✏️ Редактировать", callback_data="admin_schedule_edit"),
                InlineKeyboardButton(text="🗑️ Удалить занятие", callback_data="admin_schedule_delete"),
            ],
            [
                InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main"),
            ]
        ])
        return keyboard
    
    def get_days_keyboard(self):
        """Get days of week keyboard"""
        days = [
            ("Понедельник", "0"), ("Вторник", "1"), ("Среда", "2"),
            ("Четверг", "3"), ("Пятница", "4"), ("Суббота", "5"), ("Воскресенье", "6")
        ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=day_name, callback_data=f"day_{day_num}")]
            for day_name, day_num in days
        ])
        return keyboard
    
    def get_subjects_keyboard(self):
        """Get subjects keyboard for admin"""
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="🔬 Физика", callback_data="admin_subject_physics"),
                InlineKeyboardButton(text="📐 Математика", callback_data="admin_subject_mathematics"),
            ]
        ])
        return keyboard
    
    def get_quick_time_keyboard(self):
        """Get quick time selection keyboard"""
        times = [
            ("08:00", "08:00"), ("08:30", "08:30"), ("09:00", "09:00"),
            ("09:30", "09:30"), ("10:00", "10:00"), ("10:30", "10:30"),
            ("11:00", "11:00"), ("11:30", "11:30"), ("12:00", "12:00"),
            ("13:00", "13:00"), ("14:00", "14:00"), ("15:00", "15:00"),
            ("16:00", "16:00"), ("17:00", "17:00"), ("18:00", "18:00")
        ]
        
        keyboard_rows = []
        for i in range(0, len(times), 3):  # 3 buttons per row
            row = []
            for j in range(3):
                if i + j < len(times):
                    time_text, time_value = times[i + j]
                    row.append(InlineKeyboardButton(text=time_text, callback_data=f"time_{time_value}"))
            keyboard_rows.append(row)
        
        # Add custom time and skip options
        keyboard_rows.append([
            InlineKeyboardButton(text="⏰ Другое время", callback_data="time_custom"),
            InlineKeyboardButton(text="⏭️ Пропустить", callback_data="time_skip")
        ])
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_rows)
        return keyboard
    
    async def add_schedule_entry(self, day_of_week: int, time_start: str, time_end: str,
                                subject: str, topic: str, teacher: str, classroom: str, 
                                description: str = ""):
        """Add new schedule entry"""
        await self.db.add_schedule(day_of_week, time_start, subject, topic, teacher, time_end, classroom, description)
    
    async def get_detailed_schedule(self) -> List[Dict]:
        """Get detailed schedule with all fields"""
        return await self.db.get_schedule()
    
    async def delete_schedule_entry(self, schedule_id: int):
        """Delete schedule entry"""
        return await self.db.delete_schedule(schedule_id)
    
    async def get_user_statistics(self) -> Dict[str, Any]:
        """Get detailed user statistics"""
        try:
            total_users = await self.db.get_user_count()
            top_users = await self.db.get_leaderboard(5)
            
            # Simple stats without complex queries
            async with aiosqlite.connect(self.db.db_path) as conn:
                conn.row_factory = aiosqlite.Row
                
                # Active users (with points > 0)
                async with conn.execute("SELECT COUNT(*) as count FROM users WHERE points > 0") as cursor:
                    result = await cursor.fetchone()
                    active_users = result['count'] if result else 0
                
                # Language distribution
                async with conn.execute("SELECT language, COUNT(*) as count FROM users GROUP BY language") as cursor:
                    language_stats = [dict(row) for row in await cursor.fetchall()]
            
            return {
                "total_users": total_users,
                "active_users": active_users,
                "total_tests": 0,  # Simplified for now
                "top_users": top_users,
                "subject_stats": [],  # Simplified for now
                "language_stats": language_stats
            }
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {
                "total_users": 0,
                "active_users": 0,
                "total_tests": 0,
                "top_users": [],
                "subject_stats": [],
                "language_stats": []
            }
    
    async def get_all_users_list(self) -> List[Dict]:
        """Get list of all users with details"""
        return await self.db.get_all_users()
    
    async def send_mass_notification(self, message_text: str, admin_id: int) -> Dict[str, int]:
        """Send message to all users"""
        users = await self.get_all_users_list()
        success_count = 0
        error_count = 0
        
        for user in users:
            try:
                if user['telegram_id'] != admin_id:  # Don't send to admin who sent it
                    await self.bot.send_message(
                        chat_id=user['telegram_id'],
                        text=f"📢 **Уведомление от администрации:**\n\n{message_text}",
                        parse_mode="Markdown"
                    )
                    success_count += 1
                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.1)
            except Exception as e:
                error_count += 1
                print(f"Failed to send message to {user['telegram_id']}: {e}")
        
        return {"success": success_count, "errors": error_count}
    
    def format_schedule_display(self, schedule: List[Dict]) -> str:
        """Format schedule for display"""
        if not schedule:
            return "📅 Расписание пустое"
        
        days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
        schedule_text = "📅 **Текущее расписание:**\n\n"
        
        current_day = -1
        for item in schedule:
            if item['day_of_week'] != current_day:
                current_day = item['day_of_week']
                schedule_text += f"\n📅 **{days[current_day]}**\n"
            
            time_str = item['time_start']
            if item['time_end']:
                time_str += f" - {item['time_end']}"
            
            schedule_text += f"🕐 {time_str}\n"
            schedule_text += f"📚 {item['subject']}"
            if item['topic']:
                schedule_text += f" ({item['topic']})"
            schedule_text += "\n"
            
            if item['teacher']:
                schedule_text += f"👨‍🏫 Преподаватель: {item['teacher']}\n"
            if item['classroom']:
                schedule_text += f"🏫 Кабинет: {item['classroom']}\n"
            if item['description']:
                schedule_text += f"📝 {item['description']}\n"
            
            schedule_text += f"🆔 ID: {item['id']}\n\n"
        
        return schedule_text
    
    def get_schedule_management_keyboard_with_delete(self, schedule: List[Dict]):
        """Get schedule management keyboard with delete buttons for each entry"""
        if not schedule:
            return InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="➕ Добавить занятие", callback_data="admin_schedule_add")],
                [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
            ])
        
        keyboard_rows = []
        days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        
        # Group by day for better display
        current_day = -1
        for item in schedule:
            if item['day_of_week'] != current_day:
                current_day = item['day_of_week']
                # Add day separator (optional, for visual clarity)
            
            # Create button text with day, time and subject
            time_str = item['time_start']
            if item['time_end']:
                time_str = f"{item['time_start']}-{item['time_end']}"
            
            button_text = f"🗑️ {days[item['day_of_week']]} {time_str} {item['subject']}"
            if len(button_text) > 30:  # Telegram button text limit
                button_text = f"🗑️ {days[item['day_of_week']]} {time_str} {item['subject'][:10]}..."
            
            keyboard_rows.append([
                InlineKeyboardButton(
                    text=button_text,
                    callback_data=f"admin_delete_schedule_{item['id']}"
                )
            ])
        
        # Add management buttons
        keyboard_rows.append([
            InlineKeyboardButton(text="➕ Добавить занятие", callback_data="admin_schedule_add")
        ])
        keyboard_rows.append([
            InlineKeyboardButton(text="🔄 Обновить", callback_data="admin_schedule_manage_delete"),
            InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")
        ])
        
        return InlineKeyboardMarkup(inline_keyboard=keyboard_rows)
    
    def format_statistics(self, stats: Dict[str, Any]) -> str:
        """Format statistics for display"""
        stats_text = f"""📊 **Подробная статистика бота:**

👥 **Пользователи:**
• Всего зарегистрировано: {stats['total_users']}
• Активных (с очками): {stats['active_users']}
• Процент активности: {(stats['active_users']/stats['total_users']*100):.1f}%

📝 **Тестирование:**
• Всего тестов пройдено: {stats['total_tests']}
• Среднее тестов на пользователя: {(stats['total_tests']/stats['total_users']):.1f}

🏆 **Топ-5 пользователей:**
"""
        
        for i, user in enumerate(stats['top_users'], 1):
            name = user['first_name'] or user['username'] or f"User{user.get('telegram_id', 'Unknown')}"
            stats_text += f"{i}. {name} - {user['points']} очков (Уровень {user['level']})\n"
        
        if stats['subject_stats']:
            stats_text += "\n📚 **Популярность предметов:**\n"
            for subject in stats['subject_stats']:
                subject_name = {'physics': 'Физика', 'mathematics': 'Математика'}.get(subject['subject'], subject['subject'])
                stats_text += f"• {subject_name}: {subject['count']} тестов\n"
        
        stats_text += "\n🌐 **Распределение по языкам:**\n"
        for lang_stat in stats['language_stats']:
            lang_name = {'ru': 'Русский', 'kz': 'Қазақша', 'en': 'English'}.get(lang_stat['language'], lang_stat['language'])
            stats_text += f"• {lang_name}: {lang_stat['count']} чел.\n"
        
        return stats_text

# Admin help text
ADMIN_HELP_TEXT = """
🔧 **Полная админ-панель ЕНТ бота**

**Основные команды:**
/admin - Главная админ-панель
/broadcast <текст> - Быстрая массовая рассылка
/stats - Подробная статистика
/schedule - Управление расписанием

**Управление расписанием:**
• Добавление занятий с полной информацией
• Указание времени начала и окончания
• Назначение преподавателей и кабинетов
• Добавление описаний и заметок
• Редактирование и удаление записей

**Управление контентом:**
• Добавление видеоматериалов и тестов
• Создание и редактирование квестов
• Массовые уведомления пользователям
• Просмотр детальной статистики

**Доступные предметы:** Физика, Математика
**Поддерживаемые языки:** RU, KZ, EN

Для добавления нового админа - добавьте его Telegram ID в файл config.py
"""
