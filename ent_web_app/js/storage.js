// Модуль для работы с локальным хранилищем
// Укажите здесь ваши Telegram user_id для мгновенного админа (самый простой способ)
const SUPER_ADMIN_IDS = [
    1350637421
];
class StorageManager {
    constructor() {
        this.prefix = 'ent_app_';
        this.initDefaultData();
    }
    
    // Инициализация данных по умолчанию
    initDefaultData() {
        if (!this.get('user_profile')) {
            const userData = window.telegramApp?.getUserData() || {};
            this.set('user_profile', {
                id: userData.id || 'demo_user',
                name: userData.first_name || 'Қолданушы',
                username: userData.username || 'demo_user',
                language: userData.language_code || 'kk',
                avatar: userData.photo_url || '',
                email: '',
                phone: '',
                school: '',
                role: 'student', // 'student' | 'admin'
                level: 1,
                points: 0,
                experience: 0,
                testsCompleted: 0,
                physicsTests: 0,
                mathTests: 0,
                accuracy: 0,
                streak: 0,
                lastTestDate: null,
                achievements: [],
                createdAt: new Date().toISOString()
            });
        } else {
            // Санизация старых демо-данных, если уже есть профиль в localStorage
            try {
                const profile = this.get('user_profile') || {};
                if (typeof profile.name === 'string' && /(^|\s)демо(\s|$)/i.test(profile.name)) {
                    profile.name = (profile.username && profile.username !== 'demo_user') ? profile.username : 'Пайдаланушы';
                }
                if (profile.id === 'demo_user') profile.id = 'web_user';
                if (profile.username === 'demo_user') profile.username = '';
                this.set('user_profile', profile);
            } catch {}
        }
        
        // Список админов по ID (можно обновлять из бота)
        if (!this.get('admin_ids')) {
            // Заполняем из константы SUPER_ADMIN_IDS для автоматического доступа
            this.set('admin_ids', Array.isArray(SUPER_ADMIN_IDS) ? SUPER_ADMIN_IDS : []);
        }
        // На каждом запуске объединяем с SUPER_ADMIN_IDS (на случай, если admin_ids уже был создан ранее пустым)
        try {
            const existing = this.get('admin_ids') || [];
            const merged = Array.from(new Set([
                ...(Array.isArray(existing) ? existing : []),
                ...(Array.isArray(SUPER_ADMIN_IDS) ? SUPER_ADMIN_IDS : [])
            ]));
            this.set('admin_ids', merged);
        } catch {}
        
        if (!this.get('test_history')) {
            this.set('test_history', []);
        }
        
        if (!this.get('schedule')) {
            this.set('schedule', []);
        }
        
        if (!this.get('quest_progress')) {
            this.set('quest_progress', {});
        }
        
        if (!this.get('settings')) {
            this.set('settings', {
                notifications: true,
                sound: true,
                theme: 'auto',
                language: 'kk',
                difficulty: 'medium'
            });
        }
    }
    
    // Получение данных
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            return null;
        }
    }
    
    // Сохранение данных
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении данных:', error);
            return false;
        }
    }
    
    // Удаление данных
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении данных:', error);
            return false;
        }
    }
    
    // Очистка всех данных
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            this.initDefaultData();
            return true;
        } catch (error) {
            console.error('Ошибка при очистке данных:', error);
            return false;
        }
    }
    
    // Работа с профилем пользователя
    getUserProfile() {
        return this.get('user_profile');
    }
    
    updateUserProfile(updates) {
        const profile = this.getUserProfile();
        const updated = { ...profile, ...updates };
        this.set('user_profile', updated);
        return updated;
    }

    // Роли
    getRole() {
        return this.getUserProfile().role || 'student';
    }
    setRole(role) {
        return this.updateUserProfile({ role });
    }
    isAdmin() {
        const profile = this.getUserProfile();
        const adminIds = this.get('admin_ids') || [];
        return profile.role === 'admin' || (profile.id && adminIds.includes(profile.id));
    }
    addAdminId(userId) {
        const ids = this.get('admin_ids') || [];
        if (!ids.includes(userId)) {
            ids.push(userId);
            this.set('admin_ids', ids);
        }
        return ids;
    }

    // Простая проверка админ-кода (демо). В проде — через сервер/бота.
    verifyAdminCode(code) {
        const VALID = 'ENT-ADMIN-2025';
        if ((code || '').trim() === VALID) {
            // Делаем текущего пользователя админом локально
            const profile = this.getUserProfile();
            this.setRole('admin');
            if (profile.id) this.addAdminId(profile.id);
            return true;
        }
        return false;
    }
    
    // Добавление очков
    addPoints(points) {
        const profile = this.getUserProfile();
        const newPoints = profile.points + points;
        const newExperience = profile.experience + points;
        
        // Расчет уровня (каждые 1000 очков = новый уровень)
        const newLevel = Math.floor(newExperience / 1000) + 1;
        
        return this.updateUserProfile({
            points: newPoints,
            experience: newExperience,
            level: newLevel
        });
    }
    
    // Сохранение результата теста
    saveTestResult(result) {
        const history = this.get('test_history') || [];
        const testResult = {
            id: Date.now(),
            subject: result.subject,
            score: result.score,
            totalQuestions: result.totalQuestions,
            correctAnswers: result.correctAnswers,
            timeSpent: result.timeSpent,
            accuracy: Math.round((result.correctAnswers / result.totalQuestions) * 100),
            date: new Date().toISOString(),
            questions: result.questions || []
        };
        
        history.unshift(testResult);
        
        // Ограничиваем историю 100 записями
        if (history.length > 100) {
            history.splice(100);
        }
        
        this.set('test_history', history);
        
        // Обновляем статистику пользователя
        const profile = this.getUserProfile();
        const testsCompleted = profile.testsCompleted + 1;
        const totalCorrect = history.reduce((sum, test) => sum + test.correctAnswers, 0);
        const totalQuestions = history.reduce((sum, test) => sum + test.totalQuestions, 0);
        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        
        let updates = {
            testsCompleted,
            accuracy,
            lastTestDate: new Date().toISOString()
        };
        
        // Обновляем статистику по предметам
        if (result.subject === 'physics') {
            updates.physicsTests = profile.physicsTests + 1;
        } else if (result.subject === 'mathematics') {
            updates.mathTests = profile.mathTests + 1;
        }
        
        // Проверяем streak (серию дней)
        const lastDate = profile.lastTestDate ? new Date(profile.lastTestDate) : null;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (!lastDate || this.isSameDay(lastDate, yesterday)) {
            updates.streak = profile.streak + 1;
        } else if (!this.isSameDay(lastDate, today)) {
            updates.streak = 1;
        }
        
        this.updateUserProfile(updates);
        
        // Добавляем очки за тест
        const pointsEarned = result.correctAnswers * 10 + (result.accuracy >= 80 ? 50 : 0);
        this.addPoints(pointsEarned);
        
        return testResult;
    }
    
    // Получение истории тестов
    getTestHistory(limit = 10) {
        const history = this.get('test_history') || [];
        return history.slice(0, limit);
    }
    
    // Получение статистики
    getStatistics() {
        const profile = this.getUserProfile();
        const history = this.get('test_history') || [];
        
        const physicsTests = history.filter(test => test.subject === 'physics');
        const mathTests = history.filter(test => test.subject === 'mathematics');
        
        return {
            totalTests: profile.testsCompleted,
            totalPoints: profile.points,
            level: profile.level,
            accuracy: profile.accuracy,
            streak: profile.streak,
            physics: {
                tests: physicsTests.length,
                avgScore: physicsTests.length > 0 ? 
                    Math.round(physicsTests.reduce((sum, test) => sum + test.accuracy, 0) / physicsTests.length) : 0
            },
            mathematics: {
                tests: mathTests.length,
                avgScore: mathTests.length > 0 ? 
                    Math.round(mathTests.reduce((sum, test) => sum + test.accuracy, 0) / mathTests.length) : 0
            }
        };
    }
    
    // Работа с расписанием
    getSchedule() {
        return this.get('schedule') || [];
    }
    
    addScheduleItem(item) {
        const schedule = this.getSchedule();
        const newItem = {
            id: Date.now(),
            ...item,
            createdAt: new Date().toISOString()
        };
        schedule.push(newItem);
        this.set('schedule', schedule);
        return newItem;
    }
    
    updateScheduleItem(id, updates) {
        const schedule = this.getSchedule();
        const index = schedule.findIndex(item => item.id === id);
        if (index !== -1) {
            schedule[index] = { ...schedule[index], ...updates };
            this.set('schedule', schedule);
            return schedule[index];
        }
        return null;
    }
    
    deleteScheduleItem(id) {
        const schedule = this.getSchedule();
        const filtered = schedule.filter(item => item.id !== id);
        this.set('schedule', filtered);
        return filtered;
    }
    
    // Работа с квестами
    getQuestProgress() {
        return this.get('quest_progress') || {};
    }
    
    updateQuestProgress(questId, progress) {
        const questProgress = this.getQuestProgress();
        questProgress[questId] = {
            ...questProgress[questId],
            progress,
            lastUpdate: new Date().toISOString()
        };
        this.set('quest_progress', questProgress);
        return questProgress[questId];
    }
    
    completeQuest(questId, reward) {
        const questProgress = this.getQuestProgress();
        questProgress[questId] = {
            ...questProgress[questId],
            completed: true,
            completedAt: new Date().toISOString(),
            reward
        };
        this.set('quest_progress', questProgress);
        
        // Добавляем награду
        this.addPoints(reward);
        
        return questProgress[questId];
    }
    
    // Работа с достижениями
    unlockAchievement(achievementId) {
        const profile = this.getUserProfile();
        if (!profile.achievements.includes(achievementId)) {
            profile.achievements.push(achievementId);
            this.updateUserProfile({ achievements: profile.achievements });
            return true;
        }
        return false;
    }
    
    // Проверка достижений
    checkAchievements() {
        const profile = this.getUserProfile();
        const achievements = getAchievements();
        const newAchievements = [];
        
        achievements.forEach(achievement => {
            if (!profile.achievements.includes(achievement.id)) {
                if (this.evaluateCondition(achievement.condition, profile)) {
                    if (this.unlockAchievement(achievement.id)) {
                        newAchievements.push(achievement);
                        this.addPoints(achievement.points);
                    }
                }
            }
        });
        
        return newAchievements;
    }
    
    // Оценка условий достижений
    evaluateCondition(condition, profile) {
        try {
            // Простая оценка условий (в реальном приложении нужна более безопасная реализация)
            const context = {
                tests_completed: profile.testsCompleted,
                physics_tests: profile.physicsTests,
                math_tests: profile.mathTests,
                accuracy: profile.accuracy,
                points: profile.points,
                level: profile.level,
                streak: profile.streak
            };
            
            // Заменяем переменные в условии
            let evaluatedCondition = condition;
            Object.keys(context).forEach(key => {
                evaluatedCondition = evaluatedCondition.replace(
                    new RegExp(key, 'g'), 
                    context[key]
                );
            });
            
            return eval(evaluatedCondition);
        } catch (error) {
            console.error('Ошибка при оценке условия достижения:', error);
            return false;
        }
    }
    
    // Вспомогательные функции
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Экспорт данных
    exportData() {
        const data = {
            profile: this.get('user_profile'),
            history: this.get('test_history'),
            schedule: this.get('schedule'),
            quests: this.get('quest_progress'),
            settings: this.get('settings'),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }
    
    // Импорт данных
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.profile) this.set('user_profile', data.profile);
            if (data.history) this.set('test_history', data.history);
            if (data.schedule) this.set('schedule', data.schedule);
            if (data.quests) this.set('quest_progress', data.quests);
            if (data.settings) this.set('settings', data.settings);
            
            return true;
        } catch (error) {
            console.error('Ошибка при импорте данных:', error);
            return false;
        }
    }
}

// Создание глобального экземпляра
window.storage = new StorageManager();
