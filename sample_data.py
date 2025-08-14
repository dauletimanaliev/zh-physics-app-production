"""
Script to populate the database with sample data for testing
"""
import asyncio
from database import Database

async def populate_sample_data():
    """Add sample data to the database"""
    db = Database()
    await db.init_db()
    
    # Sample tests data
    sample_tests = [
        # Physics tests (Russian)
        {
            'subject': 'physics',
            'question': 'Какая формула описывает закон Ома?',
            'option_a': 'U = I * R',
            'option_b': 'P = U * I',
            'option_c': 'F = m * a',
            'option_d': 'E = m * c²',
            'correct_answer': 'A',
            'explanation': 'Закон Ома: напряжение равно произведению тока на сопротивление',
            'language': 'ru'
        },
        {
            'subject': 'physics',
            'question': 'Единица измерения силы в СИ:',
            'option_a': 'Джоуль',
            'option_b': 'Ньютон',
            'option_c': 'Ватт',
            'option_d': 'Паскаль',
            'correct_answer': 'B',
            'explanation': 'Ньютон - единица измерения силы в системе СИ',
            'language': 'ru'
        },
        
        # Mathematics tests (Russian)
        {
            'subject': 'mathematics',
            'question': 'Чему равна производная функции f(x) = x²?',
            'option_a': '2x',
            'option_b': 'x',
            'option_c': '2',
            'option_d': 'x²',
            'correct_answer': 'A',
            'explanation': 'Производная степенной функции x^n равна n*x^(n-1)',
            'language': 'ru'
        },
        {
            'subject': 'mathematics',
            'question': 'Решите уравнение: 2x + 5 = 11',
            'option_a': 'x = 2',
            'option_b': 'x = 3',
            'option_c': 'x = 4',
            'option_d': 'x = 5',
            'correct_answer': 'B',
            'explanation': '2x = 11 - 5 = 6, следовательно x = 3',
            'language': 'ru'
        },
        
        # Chemistry tests (Russian)
        {
            'subject': 'chemistry',
            'question': 'Какой элемент имеет химический символ O?',
            'option_a': 'Олово',
            'option_b': 'Осмий',
            'option_c': 'Кислород',
            'option_d': 'Золото',
            'correct_answer': 'C',
            'explanation': 'O - химический символ кислорода (Oxygen)',
            'language': 'ru'
        },
        
        # Physics tests (Kazakh)
        {
            'subject': 'physics',
            'question': 'Ом заңының формуласы қандай?',
            'option_a': 'U = I * R',
            'option_b': 'P = U * I',
            'option_c': 'F = m * a',
            'option_d': 'E = m * c²',
            'correct_answer': 'A',
            'explanation': 'Ом заңы: кернеу ток пен кедергінің көбейтіндісіне тең',
            'language': 'kz'
        },
        
        # Mathematics tests (Kazakh)
        {
            'subject': 'mathematics',
            'question': 'f(x) = x² функциясының туындысы неге тең?',
            'option_a': '2x',
            'option_b': 'x',
            'option_c': '2',
            'option_d': 'x²',
            'correct_answer': 'A',
            'explanation': 'Дәрежелік функцияның туындысы x^n = n*x^(n-1)',
            'language': 'kz'
        },
        
        # Physics tests (English)
        {
            'subject': 'physics',
            'question': 'What is the formula for Ohm\'s law?',
            'option_a': 'U = I * R',
            'option_b': 'P = U * I',
            'option_c': 'F = m * a',
            'option_d': 'E = m * c²',
            'correct_answer': 'A',
            'explanation': 'Ohm\'s law: voltage equals current times resistance',
            'language': 'en'
        }
    ]
    
    # Insert tests
    async with db.db_path and aiosqlite.connect(db.db_path) as conn:
        for test in sample_tests:
            await conn.execute("""
                INSERT INTO tests (subject, question, option_a, option_b, option_c, option_d, 
                                 correct_answer, explanation, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                test['subject'], test['question'], test['option_a'], test['option_b'],
                test['option_c'], test['option_d'], test['correct_answer'],
                test['explanation'], test['language']
            ))
        await conn.commit()
    
    # Sample materials - Physics and Mathematics only
    sample_materials = [
        {
            'subject': 'physics',
            'topic': 'Механика',
            'type': 'video',
            'title': 'Физика - Подготовка к ЕНТ',
            'url': 'https://www.youtube.com/watch?v=Om8HXEecOLA&t=241s',
            'description': 'Полный курс физики для подготовки к ЕНТ. Механика, динамика, кинематика',
            'language': 'ru'
        },
        {
            'subject': 'physics',
            'topic': 'Электричество',
            'type': 'video',
            'title': 'Законы электричества',
            'url': 'https://www.youtube.com/watch?v=Om8HXEecOLA&t=241s',
            'description': 'Закон Ома, электрические цепи, сопротивление',
            'language': 'ru'
        },
        {
            'subject': 'mathematics',
            'topic': 'Алгебра',
            'type': 'video',
            'title': 'Алгебра - Решение уравнений',
            'url': 'https://www.youtube.com/watch?v=Om8HXEecOLA&t=241s',
            'description': 'Квадратные уравнения, системы уравнений, неравенства',
            'language': 'ru'
        },
        {
            'subject': 'mathematics',
            'topic': 'Геометрия',
            'type': 'video',
            'title': 'Геометрия - Планиметрия',
            'url': 'https://www.youtube.com/watch?v=Om8HXEecOLA&t=241s',
            'description': 'Треугольники, четырехугольники, окружности',
            'language': 'ru'
        },
        # Kazakh versions
        {
            'subject': 'physics',
            'topic': 'Механика',
            'type': 'video',
            'title': 'Физика - ҰБТ дайындық',
            'url': 'https://www.youtube.com/watch?v=Om8HXEecOLA&t=241s',
            'description': 'ҰБТ-ға дайындалу үшін физика курсы. Механика, динамика, кинематика',
            'language': 'kz'
        },
        {
            'subject': 'mathematics',
            'topic': 'Алгебра',
            'type': 'video',
            'title': 'Математика - Теңдеулер шешу',
            'url': 'https://www.youtube.com/watch?v=Om8HXEecOLA&t=241s',
            'description': 'Квадрат теңдеулер, теңдеулер жүйесі, теңсіздіктер',
            'language': 'kz'
        }
    ]
    
    # Insert materials
    async with aiosqlite.connect(db.db_path) as conn:
        for material in sample_materials:
            await conn.execute("""
                INSERT INTO materials (subject, topic, type, title, url, description, language)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                material['subject'], material['topic'], material['type'],
                material['title'], material['url'], material['description'],
                material['language']
            ))
        await conn.commit()
    
    # Sample schedule - updated for new schema with time_start, time_end, classroom
    sample_schedule = [
        {'day_of_week': 0, 'time_start': '09:00', 'time_end': '09:50', 'subject': 'Математика', 'topic': 'Алгебра', 'teacher': 'Иванов И.И.', 'classroom': '101'},
        {'day_of_week': 0, 'time_start': '10:30', 'time_end': '11:20', 'subject': 'Физика', 'topic': 'Механика', 'teacher': 'Петров П.П.', 'classroom': '205'},
        {'day_of_week': 1, 'time_start': '09:00', 'time_end': '09:50', 'subject': 'Физика', 'topic': 'Электричество', 'teacher': 'Петров П.П.', 'classroom': '205'},
        {'day_of_week': 1, 'time_start': '10:30', 'time_end': '11:20', 'subject': 'Математика', 'topic': 'Геометрия', 'teacher': 'Иванов И.И.', 'classroom': '101'},
        {'day_of_week': 2, 'time_start': '09:00', 'time_end': '09:50', 'subject': 'Физика', 'topic': 'Оптика', 'teacher': 'Петров П.П.', 'classroom': '205'},
        {'day_of_week': 3, 'time_start': '09:00', 'time_end': '09:50', 'subject': 'Математика', 'topic': 'Тригонометрия', 'teacher': 'Иванов И.И.', 'classroom': '101'},
        {'day_of_week': 4, 'time_start': '09:00', 'time_end': '09:50', 'subject': 'Физика', 'topic': 'Термодинамика', 'teacher': 'Петров П.П.', 'classroom': '205'},
    ]
    
    # Insert schedule
    async with aiosqlite.connect(db.db_path) as conn:
        for item in sample_schedule:
            await conn.execute("""
                INSERT INTO schedule (day_of_week, time_start, time_end, subject, topic, teacher, classroom)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                item['day_of_week'], item['time_start'], item['time_end'], 
                item['subject'], item['topic'], item['teacher'], item['classroom']
            ))
        await conn.commit()
    
    # Sample quests
    sample_quests = [
        {
            'title': 'Недельный марафон',
            'description': 'Пройдите 5 тестов по любым предметам',
            'reward_points': 100,
            'quest_type': 'test',
            'target_count': 5,
            'language': 'ru'
        },
        {
            'title': 'Знаток физики',
            'description': 'Пройдите 3 теста по физике с результатом 80%+',
            'reward_points': 150,
            'quest_type': 'test',
            'target_count': 3,
            'language': 'ru'
        },
        {
            'title': 'Апталық марафон',
            'description': 'Кез келген пәннен 5 тест тапсырыңыз',
            'reward_points': 100,
            'quest_type': 'test',
            'target_count': 5,
            'language': 'kz'
        }
    ]
    
    # Insert quests
    async with aiosqlite.connect(db.db_path) as conn:
        for quest in sample_quests:
            await conn.execute("""
                INSERT INTO quests (title, description, reward_points, quest_type, 
                                  target_count, language)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                quest['title'], quest['description'], quest['reward_points'],
                quest['quest_type'], quest['target_count'], quest['language']
            ))
        await conn.commit()
    
    print("✅ Sample data has been successfully added to the database!")

if __name__ == "__main__":
    import aiosqlite
    asyncio.run(populate_sample_data())
