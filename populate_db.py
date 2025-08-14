import asyncio
import aiosqlite
import random
from datetime import datetime, timedelta
from database import Database

async def populate_database():
    """Populate database with realistic test data"""
    db_path = "ent_bot.db"
    
    # Initialize database with proper schema
    db_instance = Database(db_path)
    await db_instance.init_db()
    print("✅ Database schema initialized")
    
    async with aiosqlite.connect(db_path) as db:
        # Clear existing data (tables should exist now)
        try:
            await db.execute("DELETE FROM users")
            await db.execute("DELETE FROM materials") 
            await db.execute("DELETE FROM tests")
            await db.execute("DELETE FROM quests")
            await db.execute("DELETE FROM schedule")
            await db.execute("DELETE FROM user_progress")
            print("🧹 Cleared existing data")
        except Exception as e:
            print(f"Note: {e} (this is normal for new database)")
        
        # Add realistic users (students and teachers) - realistic class size
        students = [
            (1001, "aidar_k", "Айдар", "Касымов", "ru", random.randint(800, 2500), random.randint(3, 12)),
            (1002, "aliya_m", "Алия", "Мухамедова", "kz", random.randint(600, 2200), random.randint(2, 10)),
            (1003, "daniiar_s", "Данияр", "Сарсенов", "ru", random.randint(1200, 3000), random.randint(5, 15)),
            (1004, "aigul_n", "Айгуль", "Нурланова", "kz", random.randint(900, 2400), random.randint(4, 11)),
            (1005, "arman_t", "Арман", "Токтаров", "ru", random.randint(700, 2000), random.randint(3, 9)),
            (1006, "amina_b", "Амина", "Бекова", "kz", random.randint(1100, 2800), random.randint(6, 13)),
            (1007, "nurlan_k", "Нурлан", "Калиев", "ru", random.randint(850, 2300), random.randint(4, 10)),
            (1008, "aida_zh", "Аида", "Жанбекова", "kz", random.randint(950, 2600), random.randint(5, 12)),
            (1009, "bauyrzhan_a", "Бауыржан", "Алимов", "kz", random.randint(1300, 2900), random.randint(7, 14)),
            (1010, "diana_s", "Диана", "Сулейменова", "ru", random.randint(800, 2100), random.randint(3, 8)),
            (1011, "erlan_m", "Ерлан", "Мусаев", "kz", random.randint(1000, 2700), random.randint(5, 11)),
            (1012, "gulnara_k", "Гульнара", "Кенжебаева", "ru", random.randint(750, 2200), random.randint(4, 9)),
            (1013, "islam_b", "Ислам", "Байтенов", "kz", random.randint(1150, 2500), random.randint(6, 12)),
            (1014, "kamila_t", "Камила", "Темирова", "ru", random.randint(900, 2400), random.randint(4, 10)),
            (1015, "madina_a", "Мадина", "Абдуллаева", "kz", random.randint(1250, 2800), random.randint(7, 13)),
            (1016, "askar_zh", "Асқар", "Жұмабеков", "kz", random.randint(950, 2300), random.randint(5, 10)),
            (1017, "zhanel_s", "Жанель", "Сапарова", "ru", random.randint(1100, 2600), random.randint(6, 12)),
            (1018, "timur_a", "Тимур", "Ахметов", "kz", random.randint(800, 2200), random.randint(4, 9)),
            (1019, "samal_k", "Самал", "Қасымова", "kz", random.randint(1200, 2700), random.randint(7, 13)),
            (1020, "ruslan_b", "Руслан", "Бейсенов", "ru", random.randint(900, 2400), random.randint(5, 11)),
            (1021, "aizhan_t", "Айжан", "Төлеуова", "kz", random.randint(1050, 2500), random.randint(6, 12)),
            (1022, "damir_n", "Дамир", "Нұрғалиев", "kz", random.randint(850, 2300), random.randint(4, 10)),
            (1023, "laura_m", "Лаура", "Мұратова", "ru", random.randint(1150, 2600), random.randint(7, 14)),
            (1024, "adil_s", "Әділ", "Сейітов", "kz", random.randint(950, 2400), random.randint(5, 11)),
            (1025, "assel_k", "Әсел", "Қайратова", "kz", random.randint(1000, 2500), random.randint(6, 12)),
        ]
        
        teachers = [
            (2001, "teacher_physics", "Асем", "Ибрагимова", "ru", 5000, 20),
            (2002, "director_school", "Марат", "Сейтказиев", "kz", 6000, 25),
        ]
        
        # Insert users
        for user_data in students + teachers:
            telegram_id, username, first_name, last_name, language, points, level = user_data
            await db.execute("""
                INSERT INTO users (telegram_id, username, first_name, last_name, language, points, level, registration_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (telegram_id, username, first_name, last_name, language, points, level, datetime.now().isoformat()))
        
        # Add physics materials
        materials = [
            ("Физика", "Механика", "video", "Основы кинематики", "https://youtube.com/watch?v=mechanics1", "Изучение движения тел", "ru"),
            ("Физика", "Механика", "pdf", "Законы Ньютона", "https://example.com/newton.pdf", "Три закона механики", "ru"),
            ("Физика", "Термодинамика", "video", "Первый закон термодинамики", "https://youtube.com/watch?v=thermo1", "Закон сохранения энергии", "ru"),
            ("Физика", "Электричество", "video", "Закон Ома", "https://youtube.com/watch?v=ohm1", "Основы электрических цепей", "ru"),
            ("Физика", "Оптика", "pdf", "Законы отражения и преломления", "https://example.com/optics.pdf", "Геометрическая оптика", "ru"),
            ("Физика", "Атомная физика", "video", "Строение атома", "https://youtube.com/watch?v=atom1", "Модель атома Бора", "ru"),
        ]
        
        for material in materials:
            await db.execute("""
                INSERT INTO materials (subject, topic, type, title, url, description, language)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, material)
        
        # Add physics tests
        tests = [
            ("Физика", "Что такое скорость?", "Изменение координаты", "Изменение времени", "Изменение положения в единицу времени", "Изменение ускорения", "C", "Скорость - это изменение положения в единицу времени", "ru"),
            ("Физика", "Первый закон Ньютона гласит:", "Тело движется равномерно", "Тело покоится или движется равномерно при отсутствии сил", "Сила равна массе на ускорение", "Действие равно противодействию", "B", "Закон инерции", "ru"),
            ("Физика", "Единица измерения силы:", "Ньютон", "Джоуль", "Ватт", "Паскаль", "A", "Сила измеряется в ньютонах", "ru"),
            ("Физика", "Закон Ома для участка цепи:", "U = I * R", "P = U * I", "A = U / R", "R = U + I", "A", "Напряжение равно произведению тока на сопротивление", "ru"),
            ("Физика", "Что такое частота волны?", "Длина волны", "Количество колебаний в секунду", "Скорость волны", "Амплитуда колебаний", "B", "Частота - количество колебаний в единицу времени", "ru"),
        ]
        
        for test in tests:
            await db.execute("""
                INSERT INTO tests (subject, question, option_a, option_b, option_c, option_d, correct_answer, explanation, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, test)
        
        # Add quests
        quests = [
            ("Ежедневный тест", "Пройди один тест по физике", 50, "daily", 1, datetime.now().date(), (datetime.now() + timedelta(days=1)).date(), 1, "ru"),
            ("Изучи механику", "Просмотри 3 видео по механике", 100, "video", 3, datetime.now().date(), (datetime.now() + timedelta(days=7)).date(), 1, "ru"),
            ("Мастер физики", "Набери 1000 баллов", 200, "points", 1000, datetime.now().date(), (datetime.now() + timedelta(days=30)).date(), 1, "ru"),
            ("Недельный марафон", "Пройди 10 тестов за неделю", 150, "test", 10, datetime.now().date(), (datetime.now() + timedelta(days=7)).date(), 1, "ru"),
        ]
        
        for quest in quests:
            await db.execute("""
                INSERT INTO quests (title, description, reward_points, quest_type, target_count, start_date, end_date, is_active, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, quest)
        
        # Add schedule
        schedule_items = [
            (0, "09:00", "09:45", "Физика", "Механика", "Асем Ибрагимова", "Каб. 201", "Урок по кинематике", 1),
            (0, "10:00", "10:45", "Физика", "Механика", "Асем Ибрагимова", "Каб. 201", "Решение задач", 1),
            (1, "09:00", "09:45", "Физика", "Термодинамика", "Асем Ибрагимова", "Каб. 201", "Первый закон термодинамики", 1),
            (2, "11:00", "11:45", "Физика", "Электричество", "Асем Ибрагимова", "Каб. 201", "Закон Ома", 1),
            (3, "14:00", "14:45", "Физика", "Оптика", "Асем Ибрагимова", "Каб. 201", "Законы отражения", 1),
            (4, "10:00", "10:45", "Физика", "Атомная физика", "Асем Ибрагимова", "Каб. 201", "Строение атома", 1),
        ]
        
        for schedule_item in schedule_items:
            await db.execute("""
                INSERT INTO schedule (day_of_week, time_start, time_end, subject, topic, teacher, classroom, description, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, schedule_item)
        
        # Add user progress (test completions, material views, etc.)
        for student in students:
            telegram_id = student[0]
            # Add some random test completions
            for _ in range(random.randint(5, 15)):
                test_id = random.randint(1, 5)
                score = random.randint(60, 100)
                completed_at = datetime.now() - timedelta(days=random.randint(1, 30))
                await db.execute("""
                    INSERT INTO user_progress (user_id, test_id, progress_type, completed_at, score)
                    VALUES (?, ?, 'test', ?, ?)
                """, (telegram_id, test_id, completed_at.isoformat(), score))
            
            # Add some material views
            for _ in range(random.randint(3, 8)):
                material_id = random.randint(1, 6)
                viewed_at = datetime.now() - timedelta(days=random.randint(1, 20))
                await db.execute("""
                    INSERT INTO user_progress (user_id, material_id, progress_type, completed_at)
                    VALUES (?, ?, 'material', ?)
                """, (telegram_id, material_id, viewed_at.isoformat()))
        
        await db.commit()
        print("✅ Database populated with realistic test data!")
        
        # Show some stats
        async with db.execute("SELECT COUNT(*) FROM users") as cursor:
            user_count = await cursor.fetchone()
            print(f"👥 Users: {user_count[0]}")
        
        async with db.execute("SELECT COUNT(*) FROM tests") as cursor:
            test_count = await cursor.fetchone()
            print(f"📝 Tests: {test_count[0]}")
        
        async with db.execute("SELECT COUNT(*) FROM materials") as cursor:
            material_count = await cursor.fetchone()
            print(f"📚 Materials: {material_count[0]}")
        
        async with db.execute("SELECT COUNT(*) FROM user_progress") as cursor:
            progress_count = await cursor.fetchone()
            print(f"📊 Progress entries: {progress_count[0]}")

if __name__ == "__main__":
    asyncio.run(populate_database())
