-- Physics Mini App Database Schema
-- PostgreSQL Database for scalable backend

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (teachers and students)
CREATE TABLE users (
    telegram_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    language VARCHAR(10) DEFAULT 'ru',
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    school VARCHAR(200),
    grade VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Materials table (educational content)
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'video', 'pdf', 'interactive')),
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    duration INTEGER DEFAULT 15, -- in minutes
    is_published BOOLEAN DEFAULT false,
    author_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
    tags TEXT, -- comma-separated tags
    attachments TEXT, -- JSON string with file attachments
    video_url TEXT,
    pdf_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tests table
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    time_limit INTEGER DEFAULT 30, -- in minutes
    total_questions INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    author_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test questions (stored as JSON for flexibility)
CREATE TABLE test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),
    options JSONB, -- JSON array of answer options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE user_progress (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    tests_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0.00,
    level_id INTEGER DEFAULT 1,
    xp_points INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test results
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken INTEGER, -- in seconds
    answers JSONB, -- JSON object with question_id: user_answer pairs
    completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, test_id) -- One result per user per test
);

-- User achievements
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_type, achievement_name)
);

-- User bookmarks for materials
CREATE TABLE user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, material_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_materials_published ON materials(is_published);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_author ON materials(author_id);
CREATE INDEX idx_materials_created_at ON materials(created_at);
CREATE INDEX idx_tests_published ON tests(is_published);
CREATE INDEX idx_tests_subject ON tests(subject);
CREATE INDEX idx_tests_author ON tests(author_id);
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_test ON test_results(test_id);
CREATE INDEX idx_test_results_completed_at ON test_results(completed_at);
CREATE INDEX idx_user_progress_points ON user_progress(total_points);
CREATE INDEX idx_user_progress_streak ON user_progress(current_streak);

-- Insert sample data for testing
INSERT INTO users (telegram_id, first_name, last_name, birth_date, language, role, school, grade) VALUES
('111333', 'Учитель', 'Физики', '1985-01-01', 'ru', 'teacher', 'Школа №1', NULL),
('111444', 'Студент', 'Тестовый', '2005-01-01', 'ru', 'student', 'Школа №1', '11'),
('111555', 'Админ', 'Системы', '1980-01-01', 'ru', 'admin', 'Школа №1', NULL);

-- Insert sample materials
INSERT INTO materials (title, description, content, type, category, difficulty, duration, is_published, author_id, tags) VALUES
('Механика: Основы кинематики', 'Изучение движения тел без учета причин движения', 'Кинематика изучает движение тел в пространстве и времени...', 'text', 'mechanics', 'easy', 20, true, '111333', 'механика,кинематика,движение'),
('Электричество и магнетизм', 'Основы электромагнитных явлений', 'Электричество и магнетизм - фундаментальные явления природы...', 'text', 'electricity', 'medium', 25, true, '111333', 'электричество,магнетизм,поле'),
('Термодинамика: Законы тепла', 'Изучение тепловых процессов и энергии', 'Термодинамика изучает тепловые процессы и превращения энергии...', 'text', 'thermodynamics', 'medium', 30, true, '111333', 'термодинамика,тепло,энергия');

-- Insert sample test
INSERT INTO tests (title, description, subject, difficulty, time_limit, total_questions, is_published, author_id) VALUES
('Основы механики', 'Тест по основам механики и кинематики', 'Физика', 'easy', 30, 5, true, '111333');

-- Insert sample test questions
INSERT INTO test_questions (test_id, question_text, question_type, options, correct_answer, explanation, points, order_index) VALUES
(1, 'Что изучает кинематика?', 'multiple_choice', '["Движение тел", "Причины движения", "Силы", "Энергию"]', 'Движение тел', 'Кинематика изучает движение тел в пространстве и времени', 1, 1),
(1, 'Скорость - это векторная величина?', 'true_false', '["Да", "Нет"]', 'Да', 'Скорость имеет направление, поэтому это векторная величина', 1, 2),
(1, 'Единица измерения скорости в СИ?', 'multiple_choice', '["м/с", "км/ч", "м/мин", "см/с"]', 'м/с', 'В системе СИ скорость измеряется в метрах в секунду', 1, 3),
(1, 'Ускорение показывает изменение скорости?', 'true_false', '["Да", "Нет"]', 'Да', 'Ускорение - это изменение скорости за единицу времени', 1, 4),
(1, 'Формула для равномерного движения?', 'multiple_choice', '["s = vt", "s = at²", "v = at", "F = ma"]', 's = vt', 'При равномерном движении путь равен произведению скорости на время', 1, 5);

-- Insert sample user progress
INSERT INTO user_progress (user_id, total_points, tests_completed, current_streak, max_streak, avg_score, level_id, xp_points) VALUES
('111444', 150, 3, 5, 7, 85.50, 2, 150);

-- Insert sample test result
INSERT INTO test_results (user_id, test_id, score, max_score, percentage, time_taken, answers) VALUES
('111444', 1, 4, 5, 80.00, 1200, '{"1": "Движение тел", "2": "Да", "3": "м/с", "4": "Да", "5": "s = vt"}');

-- Insert sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description) VALUES
('111444', 'first_test', 'Первый тест', 'Прошел свой первый тест'),
('111444', 'streak_5', 'Серия 5', 'Решил 5 тестов подряд');

COMMIT;
