import asyncio
import logging
import os
from typing import Dict, Any

from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

from database import Database
from translations import get_text, get_language_keyboard, get_main_menu_keyboard, get_subjects_keyboard
from admin import AdminManager, ADMIN_IDS, get_admin_keyboard, ADMIN_HELP_TEXT
from admin_panel import AdvancedAdminPanel, AdminStates as AdvancedAdminStates, ADMIN_HELP_TEXT as ADVANCED_ADMIN_HELP

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot and dispatcher
bot = Bot(token=os.getenv('BOT_TOKEN'))
storage = MemoryStorage()
dp = Dispatcher(storage=storage)
router = Router()

# Initialize database
db = Database()

# Initialize admin manager
admin_manager = AdminManager(bot, db)

# Initialize advanced admin panel
advanced_admin = AdvancedAdminPanel(bot, db)

# States for FSM
class TestStates(StatesGroup):
    waiting_for_subject = State()
    taking_test = State()

class UserStates(StatesGroup):
    selecting_language = State()

class AdminStates(StatesGroup):
    waiting_for_broadcast = State()
    waiting_for_material = State()
    waiting_for_test = State()

# Global variables for test sessions
user_test_sessions: Dict[int, Dict[str, Any]] = {}

@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext):
    """Handle /start command"""
    user = await db.get_user(message.from_user.id)
    
    # Check if user is admin
    is_admin = advanced_admin.is_admin(message.from_user.id)
    
    if not user:
        # New user - show language selection
        await message.answer(
            get_text('start_welcome'),
            reply_markup=get_language_keyboard()
        )
        await state.set_state(UserStates.selecting_language)
    else:
        # Existing user
        if is_admin:
            # Admin user - show admin panel
            await message.answer(
                "🔧 **Добро пожаловать, Администратор!**\n\nВы вошли в расширенную админ-панель ЕНТ бота:",
                reply_markup=advanced_admin.get_main_admin_keyboard(),
                parse_mode="Markdown"
            )
        else:
            # Regular user - show main menu
            await message.answer(
                get_text('main_menu', user['language']),
                reply_markup=get_main_menu_keyboard(user['language'])
            )

@router.callback_query(F.data.startswith("lang_"))
async def process_language_selection(callback: CallbackQuery, state: FSMContext):
    """Handle language selection"""
    language = callback.data.split("_")[1]
    
    # Add or update user in database
    await db.add_user(
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        first_name=callback.from_user.first_name,
        language=language
    )
    
    # Check if user is admin
    is_admin = advanced_admin.is_admin(callback.from_user.id)
    
    await callback.message.edit_text(get_text('language_selected', language))
    
    if is_admin:
        # Admin user - show admin panel
        await callback.message.answer(
            "🔧 **Добро пожаловать, Администратор!**\n\nВы вошли в расширенную админ-панель ЕНТ бота:",
            reply_markup=advanced_admin.get_main_admin_keyboard(),
            parse_mode="Markdown"
        )
    else:
        # Regular user - show main menu
        await callback.message.answer(
            get_text('main_menu', language),
            reply_markup=get_main_menu_keyboard(language)
        )
    
    await state.clear()
    await callback.answer()

@router.message(Command("language"))
async def cmd_language(message: Message):
    """Handle /language command"""
    await message.answer(
        get_text('start_welcome'),
        reply_markup=get_language_keyboard()
    )

@router.message(F.text.in_([
    "🌐 Язык", "🌐 Тіл", "🌐 Language"
]))
async def btn_language(message: Message):
    """Handle language button"""
    await cmd_language(message)

@router.message(Command("schedule"))
async def cmd_schedule(message: Message):
    """Handle /schedule command"""
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please start with /start")
        return
    
    schedule = await db.get_schedule()
    
    if not schedule:
        await message.answer(get_text('no_schedule', user['language']))
        return
    
    # Format schedule
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    schedule_text = f"📅 {get_text('schedule_title', user['language'])}\n\n"
    
    current_day = -1
    for item in schedule:
        if item['day_of_week'] != current_day:
            current_day = item['day_of_week']
            day_name = get_text(days[current_day], user['language'])
            schedule_text += f"\n📅 **{day_name}**\n"
        
        # Format time
        time_str = item['time_start']
        if item.get('time_end'):
            time_str += f" - {item['time_end']}"
        
        schedule_text += f"🕐 {time_str} - {item['subject']}"
        if item['topic']:
            schedule_text += f" ({item['topic']})"
        
        # Add teacher and classroom if available
        if item.get('teacher'):
            schedule_text += f"\n   👨‍🏫 {item['teacher']}"
        if item.get('classroom'):
            schedule_text += f"\n   🏫 Кабинет {item['classroom']}"
        
        schedule_text += "\n"
    
    await message.answer(schedule_text, parse_mode="Markdown")

@router.message(F.text.in_([
    "📅 Расписание", "📅 Кесте", "📅 Schedule"
]))
async def btn_schedule(message: Message):
    """Handle schedule button"""
    await cmd_schedule(message)

@router.message(Command("test"))
async def cmd_test(message: Message, state: FSMContext):
    """Handle /test command"""
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please start with /start")
        return
    
    await message.answer(
        get_text('choose_subject', user['language']),
        reply_markup=get_subjects_keyboard(user['language'])
    )
    await state.set_state(TestStates.waiting_for_subject)

@router.message(F.text.in_([
    "📝 Тесты", "📝 Тесттер", "📝 Tests"
]))
async def btn_test(message: Message, state: FSMContext):
    """Handle test button"""
    await cmd_test(message, state)

@router.callback_query(F.data.startswith("subject_"), StateFilter(TestStates.waiting_for_subject))
async def process_subject_selection(callback: CallbackQuery, state: FSMContext):
    """Handle subject selection for tests"""
    subject = callback.data.split("_")[1]
    user = await db.get_user(callback.from_user.id)
    
    # Get tests for the subject
    tests = await db.get_tests_by_subject(subject, user['language'], 10)
    
    if not tests:
        await callback.message.edit_text(f"No tests available for {subject}")
        await state.clear()
        await callback.answer()
        return
    
    # Initialize test session
    user_test_sessions[callback.from_user.id] = {
        'tests': tests,
        'current_question': 0,
        'correct_answers': 0,
        'user_answers': []
    }
    
    # Send first question
    await send_test_question(callback.message, callback.from_user.id, user['language'])
    await state.set_state(TestStates.taking_test)
    await callback.answer()

async def send_test_question(message: Message, user_id: int, language: str):
    """Send current test question"""
    session = user_test_sessions[user_id]
    current_test = session['tests'][session['current_question']]
    
    question_text = get_text('test_question', language, 
                           current=session['current_question'] + 1,
                           total=len(session['tests']))
    question_text += f"\n\n❓ {current_test['question']}\n\n"
    question_text += f"A) {current_test['option_a']}\n"
    question_text += f"B) {current_test['option_b']}\n"
    question_text += f"C) {current_test['option_c']}\n"
    question_text += f"D) {current_test['option_d']}"
    
    # Create answer keyboard
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="A", callback_data="answer_A"),
            InlineKeyboardButton(text="B", callback_data="answer_B"),
        ],
        [
            InlineKeyboardButton(text="C", callback_data="answer_C"),
            InlineKeyboardButton(text="D", callback_data="answer_D"),
        ]
    ])
    
    await message.edit_text(question_text, reply_markup=keyboard)

@router.callback_query(F.data.startswith("answer_"), StateFilter(TestStates.taking_test))
async def process_test_answer(callback: CallbackQuery, state: FSMContext):
    """Handle test answer"""
    user_id = callback.from_user.id
    answer = callback.data.split("_")[1]
    user = await db.get_user(user_id)
    
    if user_id not in user_test_sessions:
        await callback.answer("Test session expired")
        await state.clear()
        return
    
    session = user_test_sessions[user_id]
    current_test = session['tests'][session['current_question']]
    
    # Check if answer is correct
    is_correct = answer == current_test['correct_answer']
    if is_correct:
        session['correct_answers'] += 1
    
    session['user_answers'].append({
        'question': current_test['question'],
        'user_answer': answer,
        'correct_answer': current_test['correct_answer'],
        'is_correct': is_correct
    })
    
    # Move to next question or finish test
    session['current_question'] += 1
    
    if session['current_question'] < len(session['tests']):
        # Show feedback and next question
        feedback = get_text('correct_answer', user['language']) if is_correct else \
                  get_text('wrong_answer', user['language'], answer=current_test['correct_answer'])
        
        await callback.message.edit_text(feedback)
        await asyncio.sleep(1.5)  # Brief pause to show feedback
        await send_test_question(callback.message, user_id, user['language'])
    else:
        # Test finished
        await finish_test(callback.message, user_id, user['language'])
        await state.clear()
    
    await callback.answer()

async def finish_test(message: Message, user_id: int, language: str):
    """Finish test and show results"""
    session = user_test_sessions[user_id]
    total_questions = len(session['tests'])
    correct_answers = session['correct_answers']
    percentage = int((correct_answers / total_questions) * 100)
    
    # Calculate points (10 points per correct answer)
    points = correct_answers * 10
    await db.add_points(user_id, points)
    
    # Show results
    result_text = get_text('test_result', language,
                          correct=correct_answers,
                          total=total_questions,
                          percentage=percentage,
                          points=points)
    
    await message.edit_text(result_text)
    
    # Clean up session
    del user_test_sessions[user_id]

@router.message(Command("top"))
async def cmd_top(message: Message):
    """Handle /top command"""
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please start with /start")
        return
    
    leaderboard = await db.get_leaderboard(10)
    
    if not leaderboard:
        await message.answer("No users in leaderboard yet")
        return
    
    leaderboard_text = f"🏆 {get_text('leaderboard_title', user['language'])}\n\n"
    
    for i, player in enumerate(leaderboard, 1):
        name = player['first_name'] or player['username'] or f"User{player['telegram_id']}"
        leaderboard_text += get_text('leaderboard_entry', user['language'],
                                   position=i, name=name, 
                                   points=player['points'], level=player['level']) + "\n"
    
    # Add user's stats
    leaderboard_text += f"\n{get_text('your_stats', user['language'], points=user['points'], level=user['level'])}"
    
    await message.answer(leaderboard_text)

@router.message(F.text.in_([
    "🏆 Рейтинг", "🏆 Рейтинг", "🏆 Leaderboard"
]))
async def btn_top(message: Message):
    """Handle leaderboard button"""
    await cmd_top(message)

@router.message(Command("quests"))
async def cmd_quests(message: Message):
    """Handle /quests command"""
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please start with /start")
        return
    
    quests = await db.get_active_quests(user['language'])
    
    if not quests:
        await message.answer(get_text('no_quests', user['language']))
        return
    
    quests_text = f"{get_text('quests_title', user['language'])}\n\n"
    
    for quest in quests:
        quests_text += get_text('quest_entry', user['language'],
                               title=quest['title'],
                               description=quest['description'],
                               reward=quest['reward_points']) + "\n\n"
    
    await message.answer(quests_text)

@router.message(F.text.in_([
    "🎯 Квесты", "🎯 Квесттер", "🎯 Quests"
]))
async def btn_quests(message: Message):
    """Handle quests button"""
    await cmd_quests(message)

@router.message(Command("help"))
async def cmd_help(message: Message):
    """Handle /help command"""
    user = await db.get_user(message.from_user.id)
    language = user['language'] if user else 'ru'
    
    await message.answer(get_text('help_text', language))

@router.message(F.text.in_([
    "❓ Помощь", "❓ Көмек", "❓ Help"
]))
async def btn_help(message: Message):
    """Handle help button"""
    await cmd_help(message)

@router.message(Command("videos"))
async def cmd_videos(message: Message):
    """Handle /videos command"""
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please start with /start")
        return
    
    await message.answer(
        get_text('choose_material_subject', user['language']),
        reply_markup=get_subjects_keyboard(user['language'])
    )

@router.message(F.text.in_([
    "🎥 Видеоуроки", "🎥 Видеосабақтар", "🎥 Video Lessons"
]))
async def btn_videos(message: Message):
    """Handle videos button"""
    await cmd_videos(message)

@router.message(Command("materials"))
async def cmd_materials(message: Message):
    """Handle /materials command"""
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please start with /start")
        return
    
    await message.answer(
        get_text('choose_material_subject', user['language']),
        reply_markup=get_subjects_keyboard(user['language'])
    )

@router.message(F.text.in_([
    "📖 Материалы", "📖 Материалдар", "📖 Materials"
]))
async def btn_materials(message: Message):
    """Handle materials button"""
    await cmd_materials(message)

@router.callback_query(F.data.startswith("subject_"))
async def process_materials_subject(callback: CallbackQuery):
    """Handle subject selection for materials"""
    subject = callback.data.split("_")[1]
    user = await db.get_user(callback.from_user.id)
    
    materials = await db.get_materials_by_subject(subject, user['language'])
    
    if not materials:
        await callback.message.edit_text(get_text('no_materials', user['language']))
        await callback.answer()
        return
    
    materials_text = f"📖 {get_text('materials_title', user['language'])} - {subject.title()}\n\n"
    
    for material in materials:
        materials_text += f"📝 **{material['title']}**\n"
        if material['description']:
            materials_text += f"📄 {material['description']}\n"
        materials_text += f"🔗 {material['url']}\n\n"
    
    await callback.message.edit_text(materials_text, parse_mode="Markdown")
    await callback.answer()

# Advanced Admin Commands
@router.message(Command("admin"))
async def cmd_admin(message: Message):
    """Handle /admin command - Advanced Admin Panel"""
    if not advanced_admin.is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав администратора")
        return
    
    await message.answer(
        "🔧 **Расширенная админ-панель ЕНТ бота**\n\nВыберите действие:",
        reply_markup=advanced_admin.get_main_admin_keyboard(),
        parse_mode="Markdown"
    )

@router.message(Command("broadcast"))
async def cmd_broadcast(message: Message, state: FSMContext):
    """Handle /broadcast command"""
    if not admin_manager.is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав администратора")
        return
    
    # Extract message text after command
    text_parts = message.text.split(' ', 1)
    if len(text_parts) < 2:
        await message.answer("📢 Использование: /broadcast <текст сообщения>")
        return
    
    broadcast_text = text_parts[1]
    await message.answer("📤 Отправляю сообщение всем пользователям...")
    
    result = await admin_manager.send_mass_notification(broadcast_text, message.from_user.id)
    
    await message.answer(
        f"✅ Массовая рассылка завершена!\n"
        f"📊 Успешно отправлено: {result['success']}\n"
        f"❌ Ошибок: {result['errors']}"
    )

@router.message(Command("stats"))
async def cmd_stats(message: Message):
    """Handle /stats command"""
    if not admin_manager.is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав администратора")
        return
    
    stats = await admin_manager.get_user_stats()
    
    stats_text = f"""📊 **Статистика бота:**

👥 Всего пользователей: {stats['total_users']}
🎯 Активных пользователей: {stats['active_users']}
📝 Всего тестов пройдено: {stats['total_tests']}

🌐 **Распределение по языкам:**
"""
    
    for lang_stat in stats['language_stats']:
        lang_name = {'ru': 'Русский', 'kz': 'Қазақша', 'en': 'English'}.get(lang_stat['language'], lang_stat['language'])
        stats_text += f"• {lang_name}: {lang_stat['count']} чел.\n"
    
    await message.answer(stats_text, parse_mode="Markdown")

@router.callback_query(F.data == "admin_broadcast")
async def admin_broadcast_callback(callback: CallbackQuery, state: FSMContext):
    """Handle admin broadcast callback"""
    if not admin_manager.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    await callback.message.edit_text("📢 Введите текст для массовой рассылки:")
    await state.set_state(AdminStates.waiting_for_broadcast)
    await callback.answer()

@router.message(StateFilter(AdminStates.waiting_for_broadcast))
async def process_broadcast_text(message: Message, state: FSMContext):
    """Process broadcast message text"""
    await message.answer("📤 Отправляю сообщение всем пользователям...")
    
    result = await admin_manager.send_mass_notification(message.text, message.from_user.id)
    
    await message.answer(
        f"✅ Массовая рассылка завершена!\n"
        f"📊 Успешно отправлено: {result['success']}\n"
        f"❌ Ошибок: {result['errors']}"
    )
    await state.clear()

@router.callback_query(F.data == "admin_stats")
async def admin_stats_callback(callback: CallbackQuery):
    """Handle admin stats callback"""
    if not admin_manager.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    stats = await admin_manager.get_user_stats()
    
    stats_text = f"""📊 **Статистика бота:**

👥 Всего пользователей: {stats['total_users']}
🎯 Активных пользователей: {stats['active_users']}
📝 Всего тестов пройдено: {stats['total_tests']}

🌐 **Распределение по языкам:**
"""
    
    for lang_stat in stats['language_stats']:
        lang_name = {'ru': 'Русский', 'kz': 'Қазақша', 'en': 'English'}.get(lang_stat['language'], lang_stat['language'])
        stats_text += f"• {lang_name}: {lang_stat['count']} чел.\n"
    
    await callback.message.edit_text(stats_text, parse_mode="Markdown")
    await callback.answer()

@router.message(Command("admin_help"))
async def cmd_admin_help(message: Message):
    """Handle /admin_help command"""
    if not advanced_admin.is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав администратора")
        return
    
    await message.answer(ADVANCED_ADMIN_HELP, parse_mode="Markdown")

# Advanced Admin Panel Callbacks
@router.callback_query(F.data == "admin_main")
async def admin_main_callback(callback: CallbackQuery):
    """Return to main admin panel"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    await callback.message.edit_text(
        "🔧 **Расширенная админ-панель ЕНТ бота**\n\nВыберите действие:",
        reply_markup=advanced_admin.get_main_admin_keyboard(),
        parse_mode="Markdown"
    )
    await callback.answer()

@router.callback_query(F.data == "admin_schedule_manage")
async def admin_schedule_manage_callback(callback: CallbackQuery):
    """Handle schedule management"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    try:
        schedule = await db.get_schedule()
        schedule_text = advanced_admin.format_schedule_display(schedule)
        keyboard = advanced_admin.get_schedule_management_keyboard_with_delete(schedule)
        
        await callback.message.edit_text(
            f"🗑️ **Управление расписанием - Удаление**\n\n{schedule_text}\n\n💡 Нажмите на запись, чтобы удалить её:",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
        await callback.answer()
    except Exception as e:
        print(f"Error in schedule management: {e}")
        await callback.answer("❌ Ошибка при загрузке расписания")
        await callback.message.edit_text(
            "❌ **Ошибка при загрузке расписания**\n\nПопробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
            ]),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "admin_schedule_manage_delete")
async def admin_schedule_manage_delete_callback(callback: CallbackQuery):
    """Show schedule with delete options"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    try:
        schedule = await db.get_schedule()
        schedule_text = advanced_admin.format_schedule_display(schedule)
        keyboard = advanced_admin.get_schedule_management_keyboard_with_delete(schedule)
        
        await callback.message.edit_text(
            f"🗑️ **Управление расписанием - Удаление**\n\n{schedule_text}\n\n💡 Нажмите на запись, чтобы удалить её:",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
        await callback.answer()
    except Exception as e:
        print(f"Error in schedule delete management: {e}")
        await callback.answer("❌ Ошибка при загрузке расписания")
        await callback.message.edit_text(
            "❌ **Ошибка при загрузке расписания**\n\nПопробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
            ]),
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("admin_delete_schedule_"))
async def admin_delete_schedule_callback(callback: CallbackQuery):
    """Delete specific schedule entry"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    try:
        schedule_id = int(callback.data.split("_")[-1])
        
        # Delete from database
        deleted = await db.delete_schedule(schedule_id)
        
        if deleted:
            await callback.answer("✅ Запись удалена!")
            # Refresh the schedule view
            schedule = await db.get_schedule()
            schedule_text = advanced_admin.format_schedule_display(schedule)
            keyboard = advanced_admin.get_schedule_management_keyboard_with_delete(schedule)
            
            await callback.message.edit_text(
                f"🗑️ **Управление расписанием - Удаление**\n\n{schedule_text}\n\n💡 Нажмите на запись, чтобы удалить её:",
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        else:
            await callback.answer("❌ Ошибка при удалении")
    except Exception as e:
        print(f"Error deleting schedule entry: {e}")
        await callback.answer("❌ Ошибка при удалении")

@router.callback_query(F.data == "admin_schedule_add")
async def admin_schedule_add_callback(callback: CallbackQuery, state: FSMContext):
    """Start adding new schedule entry"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    await callback.message.edit_text(
        "📅 **Добавление нового занятия**\n\nВыберите день недели:",
        reply_markup=advanced_admin.get_days_keyboard()
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_day)
    await callback.answer()

@router.callback_query(F.data.startswith("day_"), StateFilter(AdvancedAdminStates.waiting_for_schedule_day))
async def admin_schedule_day_selected(callback: CallbackQuery, state: FSMContext):
    """Handle day selection for schedule"""
    day_num = int(callback.data.split("_")[1])
    days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    
    await state.update_data(day_of_week=day_num)
    
    await callback.message.edit_text(
        f"📅 День: **{days[day_num]}**\n\n⏰ Выберите время начала занятия:",
        reply_markup=advanced_admin.get_quick_time_keyboard(),
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_time_start)
    await callback.answer()

@router.callback_query(F.data.startswith("time_"), StateFilter(AdvancedAdminStates.waiting_for_schedule_time_start))
async def admin_schedule_time_start_selected(callback: CallbackQuery, state: FSMContext):
    """Handle time start selection from buttons"""
    time_data = callback.data.split("_")[1]
    
    if time_data == "custom":
        await callback.message.edit_text(
            "⏰ Введите время начала занятия вручную (например: 09:00):"
        )
        await callback.answer()
        return
    
    time_start = time_data
    await state.update_data(time_start=time_start)
    
    await callback.message.edit_text(
        f"⏰ Время начала: **{time_start}**\n\n⏰ Выберите время окончания или пропустите:",
        reply_markup=advanced_admin.get_quick_time_keyboard(),
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_time_end)
    await callback.answer()

@router.message(StateFilter(AdvancedAdminStates.waiting_for_schedule_time_start))
async def admin_schedule_time_start_entered(message: Message, state: FSMContext):
    """Handle time start input (manual entry)"""
    time_start = message.text.strip()
    await state.update_data(time_start=time_start)
    
    await message.answer(
        f"⏰ Время начала: **{time_start}**\n\n⏰ Выберите время окончания или введите вручную (или отправьте '-' если не нужно):",
        reply_markup=advanced_admin.get_quick_time_keyboard(),
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_time_end)

@router.callback_query(F.data.startswith("time_"), StateFilter(AdvancedAdminStates.waiting_for_schedule_time_end))
async def admin_schedule_time_end_selected(callback: CallbackQuery, state: FSMContext):
    """Handle time end selection from buttons"""
    time_data = callback.data.split("_")[1]
    
    if time_data == "custom":
        await callback.message.edit_text(
            "⏰ Введите время окончания занятия вручную (например: 10:30) или отправьте '-' если не нужно:"
        )
        await callback.answer()
        return
    elif time_data == "skip":
        time_end = None
        await state.update_data(time_end=time_end)
        
        await callback.message.edit_text(
            "⏭️ **Время окончания пропущено**\n\n📚 **Выберите предмет:**",
            reply_markup=advanced_admin.get_subjects_keyboard(),
            parse_mode="Markdown"
        )
        await state.set_state(AdvancedAdminStates.waiting_for_schedule_subject)
        await callback.answer()
        return
    
    time_end = time_data
    await state.update_data(time_end=time_end)
    
    await callback.message.edit_text(
        f"⏰ Время окончания: **{time_end}**\n\n📚 **Выберите предмет:**",
        reply_markup=advanced_admin.get_subjects_keyboard(),
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_subject)
    await callback.answer()

@router.message(StateFilter(AdvancedAdminStates.waiting_for_schedule_time_end))
async def admin_schedule_time_end_entered(message: Message, state: FSMContext):
    """Handle time end input (manual entry)"""
    time_end = message.text.strip() if message.text.strip() != '-' else None
    await state.update_data(time_end=time_end)
    
    await message.answer(
        "📚 **Выберите предмет:**",
        reply_markup=advanced_admin.get_subjects_keyboard(),
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_subject)

@router.callback_query(F.data.startswith("admin_subject_"), StateFilter(AdvancedAdminStates.waiting_for_schedule_subject))
async def admin_schedule_subject_selected(callback: CallbackQuery, state: FSMContext):
    """Handle subject selection for schedule"""
    subject = callback.data.split("_")[2]  # admin_subject_physics -> physics
    subject_names = {'physics': 'Физика', 'mathematics': 'Математика'}
    
    await state.update_data(subject=subject)
    
    await callback.message.edit_text(
        f"📚 Предмет: **{subject_names.get(subject, subject)}**\n\n📝 Введите тему занятия (или отправьте '-' если не нужно):",
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_topic)
    await callback.answer()

@router.message(StateFilter(AdvancedAdminStates.waiting_for_schedule_topic))
async def admin_schedule_topic_entered(message: Message, state: FSMContext):
    """Handle topic input"""
    topic = message.text.strip() if message.text.strip() != '-' else ""
    await state.update_data(topic=topic)
    
    await message.answer(
        "👨‍🏫 Введите имя преподавателя (или отправьте '-' если не нужно):",
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_teacher)

@router.message(StateFilter(AdvancedAdminStates.waiting_for_schedule_teacher))
async def admin_schedule_teacher_entered(message: Message, state: FSMContext):
    """Handle teacher input"""
    teacher = message.text.strip() if message.text.strip() != '-' else ""
    await state.update_data(teacher=teacher)
    
    await message.answer(
        "🏫 Введите номер кабинета (или отправьте '-' если не нужно):",
        parse_mode="Markdown"
    )
    await state.set_state(AdvancedAdminStates.waiting_for_schedule_classroom)

@router.message(StateFilter(AdvancedAdminStates.waiting_for_schedule_classroom))
async def admin_schedule_classroom_entered(message: Message, state: FSMContext):
    """Handle classroom input and save schedule entry"""
    classroom = message.text.strip() if message.text.strip() != '-' else ""
    
    # Get all data
    data = await state.get_data()
    
    # Save to database with empty description
    await advanced_admin.add_schedule_entry(
        day_of_week=data['day_of_week'],
        time_start=data['time_start'],
        time_end=data.get('time_end'),
        subject=data['subject'],
        topic=data['topic'],
        teacher=data['teacher'],
        classroom=classroom,
        description=""  # Always empty
    )
    
    # Format confirmation
    days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    subject_names = {'physics': 'Физика', 'mathematics': 'Математика'}
    
    confirmation = f"""✅ **Занятие успешно добавлено!**

📅 День: {days[data['day_of_week']]}
⏰ Время: {data['time_start']}"""
    
    if data.get('time_end'):
        confirmation += f" - {data['time_end']}"
    
    confirmation += f"\n📚 Предмет: {subject_names.get(data['subject'], data['subject'])}"
    
    if data['topic']:
        confirmation += f"\n📝 Тема: {data['topic']}"
    if data['teacher']:
        confirmation += f"\n👨‍🏫 Преподаватель: {data['teacher']}"
    if classroom:
        confirmation += f"\n🏫 Кабинет: {classroom}"
    
    back_keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📅 Управление расписанием", callback_data="admin_schedule_manage")],
        [InlineKeyboardButton(text="🔧 Главная панель", callback_data="admin_main")]
    ])
    
    await message.answer(
        confirmation,
        reply_markup=back_keyboard,
        parse_mode="Markdown"
    )
    await state.clear()



@router.callback_query(F.data == "admin_stats")
async def admin_detailed_stats_callback(callback: CallbackQuery):
    """Show detailed statistics"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    try:
        stats = await advanced_admin.get_user_statistics()
        stats_text = advanced_admin.format_statistics(stats)
        
        back_keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
        ])
        
        await callback.message.edit_text(
            stats_text,
            reply_markup=back_keyboard,
            parse_mode="Markdown"
        )
        await callback.answer()
    except Exception as e:
        print(f"Error in admin stats: {e}")
        await callback.answer("❌ Ошибка при получении статистики")
        await callback.message.edit_text(
            "❌ **Ошибка при получении статистики**\n\nПопробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
            ]),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "admin_users")
async def admin_users_callback(callback: CallbackQuery):
    """Show users management"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    try:
        users = await advanced_admin.get_all_users_list()
        
        users_text = "👥 **Список всех пользователей:**\n\n"
        
        for i, user in enumerate(users[:20], 1):  # Show first 20 users
            name = user['first_name'] or user['username'] or f"User{user['telegram_id']}"
            lang_flag = {'ru': '🇷🇺', 'kz': '🇰🇿', 'en': '🇬🇧'}.get(user['language'], '🌐')
            users_text += f"{i}. {name} {lang_flag}\n"
            users_text += f"   ID: {user['telegram_id']} | Очки: {user['points']} | Уровень: {user['level']}\n\n"
        
        if len(users) > 20:
            users_text += f"... и еще {len(users) - 20} пользователей"
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
        ])
        
        await callback.message.edit_text(
            users_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
        await callback.answer()
    except Exception as e:
        print(f"Error in admin users: {e}")
        await callback.answer("❌ Ошибка при загрузке пользователей")
        await callback.message.edit_text(
            "❌ **Ошибка при загрузке пользователей**\n\nПопробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_main")]
            ]),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "admin_add_material")
async def admin_add_material_callback(callback: CallbackQuery):
    """Add material placeholder"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    await callback.answer("🚧 В разработке")
    await callback.message.edit_text(
        "🚧 **Добавление материалов**\n\nДанная функция находится в разработке.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_materials")]
        ]),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "admin_add_test")
async def admin_add_test_callback(callback: CallbackQuery):
    """Add test placeholder"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    await callback.answer("🚧 В разработке")
    await callback.message.edit_text(
        "🚧 **Добавление тестов**\n\nДанная функция находится в разработке.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_tests")]
        ]),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "admin_add_quest")
async def admin_add_quest_callback(callback: CallbackQuery):
    """Add quest placeholder"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    await callback.answer("🚧 В разработке")
    await callback.message.edit_text(
        "🚧 **Добавление квестов**\n\nДанная функция находится в разработке.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_quests")]
        ]),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "admin_schedule_view")
async def admin_schedule_view_callback(callback: CallbackQuery):
    """View current schedule"""
    if not advanced_admin.is_admin(callback.from_user.id):
        await callback.answer("❌ Нет прав доступа")
        return
    
    try:
        schedule = await db.get_schedule()
        schedule_text = advanced_admin.format_schedule_display(schedule)
        
        back_keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_schedule")]
        ])
        
        await callback.message.edit_text(
            schedule_text,
            reply_markup=back_keyboard,
            parse_mode="Markdown"
        )
        await callback.answer()
    except Exception as e:
        print(f"Error viewing schedule: {e}")
        await callback.answer("❌ Ошибка при загрузке расписания")
        await callback.message.edit_text(
            "❌ **Ошибка при загрузке расписания**\n\nПопробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ Назад", callback_data="admin_schedule")]
            ]),
            parse_mode="Markdown"
        )

@router.message(F.text == "🔧 Админ-панель")
async def btn_admin_panel(message: Message):
    """Handle admin panel button"""
    if not advanced_admin.is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав администратора")
        return
    
    await message.answer(
        "🔧 **Расширенная админ-панель ЕНТ бота**\n\nВыберите действие:",
        reply_markup=advanced_admin.get_main_admin_keyboard(),
        parse_mode="Markdown"
    )

# Register router
dp.include_router(router)

async def main():
    """Main function to run the bot"""
    # Initialize database
    await db.init_db()
    
    # Start polling
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
