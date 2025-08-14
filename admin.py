"""
Admin functionality for the ЕНТ preparation bot
Handles admin/teacher commands and mass notifications
"""

import asyncio
from typing import List, Dict, Any
from aiogram import Bot
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from database import Database
from translations import get_text

# Import admin IDs from config
from config import ADMIN_IDS

class AdminManager:
    def __init__(self, bot: Bot, db: Database):
        self.bot = bot
        self.db = db
    
    def is_admin(self, user_id: int) -> bool:
        """Check if user is admin/teacher"""
        return user_id in ADMIN_IDS
    
    async def get_all_users(self) -> List[Dict]:
        """Get all registered users for mass notifications"""
        async with self.db.db_path and __import__('aiosqlite').connect(self.db.db_path) as conn:
            conn.row_factory = __import__('aiosqlite').Row
            async with conn.execute("SELECT telegram_id, language FROM users") as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def send_mass_notification(self, message_text: str, admin_id: int) -> Dict[str, int]:
        """Send message to all users"""
        users = await self.get_all_users()
        success_count = 0
        error_count = 0
        
        for user in users:
            try:
                if user['telegram_id'] != admin_id:  # Don't send to admin who sent it
                    await self.bot.send_message(
                        chat_id=user['telegram_id'],
                        text=f"📢 {message_text}"
                    )
                    success_count += 1
                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.1)
            except Exception as e:
                error_count += 1
                print(f"Failed to send message to {user['telegram_id']}: {e}")
        
        return {"success": success_count, "errors": error_count}
    
    async def add_material(self, subject: str, topic: str, material_type: str, 
                          title: str, url: str, description: str = "", language: str = "ru"):
        """Add new material to database"""
        async with __import__('aiosqlite').connect(self.db.db_path) as conn:
            await conn.execute("""
                INSERT INTO materials (subject, topic, type, title, url, description, language)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (subject, topic, material_type, title, url, description, language))
            await conn.commit()
    
    async def add_test_question(self, subject: str, question: str, option_a: str, 
                               option_b: str, option_c: str, option_d: str, 
                               correct_answer: str, explanation: str = "", language: str = "ru"):
        """Add new test question to database"""
        async with __import__('aiosqlite').connect(self.db.db_path) as conn:
            await conn.execute("""
                INSERT INTO tests (subject, question, option_a, option_b, option_c, option_d, 
                                 correct_answer, explanation, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (subject, question, option_a, option_b, option_c, option_d, 
                  correct_answer, explanation, language))
            await conn.commit()
    
    async def update_schedule(self, day_of_week: int, time: str, subject: str, 
                             topic: str = "", teacher: str = ""):
        """Update schedule entry"""
        async with __import__('aiosqlite').connect(self.db.db_path) as conn:
            # First, deactivate existing entry for this day and time
            await conn.execute("""
                UPDATE schedule SET is_active = 0 
                WHERE day_of_week = ? AND time = ?
            """, (day_of_week, time))
            
            # Add new entry
            await conn.execute("""
                INSERT INTO schedule (day_of_week, time, subject, topic, teacher)
                VALUES (?, ?, ?, ?, ?)
            """, (day_of_week, time, subject, topic, teacher))
            await conn.commit()
    
    async def get_user_stats(self) -> Dict[str, Any]:
        """Get bot usage statistics"""
        async with __import__('aiosqlite').connect(self.db.db_path) as conn:
            conn.row_factory = __import__('aiosqlite').Row
            
            # Total users
            async with conn.execute("SELECT COUNT(*) as count FROM users") as cursor:
                total_users = (await cursor.fetchone())['count']
            
            # Active users (with points > 0)
            async with conn.execute("SELECT COUNT(*) as count FROM users WHERE points > 0") as cursor:
                active_users = (await cursor.fetchone())['count']
            
            # Total tests taken
            async with conn.execute("SELECT COUNT(*) as count FROM user_progress WHERE progress_type = 'test'") as cursor:
                total_tests = (await cursor.fetchone())['count']
            
            # Language distribution
            async with conn.execute("SELECT language, COUNT(*) as count FROM users GROUP BY language") as cursor:
                language_stats = await cursor.fetchall()
            
            return {
                "total_users": total_users,
                "active_users": active_users,
                "total_tests": total_tests,
                "language_stats": [dict(row) for row in language_stats]
            }

def get_admin_keyboard(language: str = 'ru'):
    """Get admin control keyboard"""
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📢 Массовое уведомление", callback_data="admin_broadcast"),
            InlineKeyboardButton(text="📊 Статистика", callback_data="admin_stats"),
        ],
        [
            InlineKeyboardButton(text="📚 Добавить материал", callback_data="admin_add_material"),
            InlineKeyboardButton(text="❓ Добавить тест", callback_data="admin_add_test"),
        ],
        [
            InlineKeyboardButton(text="📅 Обновить расписание", callback_data="admin_schedule"),
            InlineKeyboardButton(text="👥 Список пользователей", callback_data="admin_users"),
        ]
    ])
    return keyboard

# Admin help text
ADMIN_HELP_TEXT = """
🔧 **Админ-команды:**

/admin - Админ-панель
/broadcast <текст> - Отправить сообщение всем пользователям
/stats - Статистика бота
/add_material - Добавить учебный материал
/add_test - Добавить тест
/set_schedule - Обновить расписание

**Примеры использования:**
/broadcast Завтра дополнительное занятие по физике в 15:00!
/add_material physics "Механика" video "Законы Ньютона" https://youtube.com/...

**Доступные предметы:** physics, mathematics
**Поддерживаемые языки:** ru, kz, en
"""
