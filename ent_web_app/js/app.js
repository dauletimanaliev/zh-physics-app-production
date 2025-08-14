// Основное приложение ҰБТ дайындығы
class ENTApp {
    constructor() {
        // Флаг для полного отключения админ-функций в SPA
        this.DISABLE_ADMIN = true;
        this.screenManager = null;
        this.isInitialized = false;
        this.currentTest = null;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Инициализация ҰБТ приложения...');
            
            // Ждем загрузки DOM
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Инициализируем компоненты
            this.initScreenManager();
            this.initEventListeners();
            // Админ-функции отключаем по флагу
            if (!this.DISABLE_ADMIN) {
                // Обработка dev-флага из URL для быстрой роли без консоли
                this.handleDevAdminFromURL();
                this.updateAdminUI();
                // Авто-открытие админки, если ID в списке админов
                this.autoOpenAdminIfAllowed();
            } else {
                // Гарантированно скрыть админ-карточки, если присутствуют
                try { this.updateAdminUI(); } catch {}
            }
            
            // Инициализируем Service Worker асинхронно (не блокируем запуск)
            this.initServiceWorker().catch(console.warn);
            
            // Проверяем достижения при запуске (не блокируем запуск)
            setTimeout(() => {
                try {
                    this.checkAchievements();
                } catch (error) {
                    console.warn('Ошибка проверки достижений:', error);
                }
            }, 1000);
            
            this.isInitialized = true;
            console.log('ҰБТ приложение успешно инициализировано');
            
            // Показываем главный экран
            setTimeout(() => {
                this.showScreen('main');
            }, 100);
            
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            // Fallback - показываем главный экран даже при ошибке
            setTimeout(() => {
                document.getElementById('loading-screen')?.classList.remove('active');
                document.getElementById('main-screen')?.classList.add('active');
            }, 500);
        }
    }

    // Быстрый dev-режим: ?admin=1 (или role=admin) включает админа; ?admin=0 (или role=student) выключает
    handleDevAdminFromURL() {
        if (this.DISABLE_ADMIN) return;
        try {
            const qs = new URLSearchParams(window.location.search || '');
            if (!qs.has('admin') && !qs.has('role')) return;
            const val = (qs.get('admin') ?? qs.get('role') ?? '').toString();
            const yes = /^(1|true|yes|admin)$/i.test(val);
            const no = /^(0|false|no|student)$/i.test(val);
            const isLocal = /^(localhost|127\.?0\.?0\.?1)(:\d+)?$/i.test(window.location.host);
            const tg = window.telegramApp;
            const uid = tg?.getUserId?.();
            const cid = tg?.getChatId?.();
            const allow = window.storage?.get('admin_ids') || [];

            const allowedByTelegram = !!tg?.isRunningInTelegram?.() && ((uid && allow.includes(uid)) || (cid && allow.includes(cid)));

            if (yes) {
                // Разрешаем включать admin только в безопасных случаях:
                // 1) В Telegram, если ID в allowlist
                // 2) В локальной среде (localhost) для разработки
                if (allowedByTelegram || isLocal) {
                    window.storage?.setRole?.('admin');
                    this.updateAdminUI();
                    setTimeout(() => this.showScreen('admin'), 150);
                } else {
                    console.warn('Игнорируем admin-флаг: не Telegram c allowlist и не локальная среда');
                }
            } else if (no) {
                window.storage?.setRole?.('student');
                this.updateAdminUI();
                setTimeout(() => this.showScreen('main'), 150);
            }

            // Убираем параметры из адресной строки, чтобы ссылку нельзя было переслать дальше
            try {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } catch {}
        } catch (e) {
            console.warn('handleDevAdminFromURL error:', e);
        }
    }
    
    initScreenManager() {
        this.screenManager = window.screenManager;
        
        // Делаем экраны доступными глобально для удобства
        this.screens = this.screenManager.screens;
    }
    
    initEventListeners() {
        // Навигация по экранам
        document.addEventListener('click', (e) => {
            const screenBtn = e.target.closest('[data-screen]');
            if (screenBtn) {
                const screenName = screenBtn.getAttribute('data-screen');
                this.showScreen(screenName);
            }
            
            const backBtn = e.target.closest('[data-back]');
            if (backBtn) {
                const backScreen = backBtn.getAttribute('data-back');
                if (backScreen) {
                    this.showScreen(backScreen);
                } else {
                    this.goBack();
                }
            }
        });
        
        // Закрытие модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.id === 'modal-close' || e.target.closest('#modal-close')) {
                window.components.closeModal();
            }
        });
        
        // Обработка онлайн/оффлайн статуса
        window.addEventListener('online', () => {
            window.notifications.showConnectionStatus(true);
        });
        
        window.addEventListener('offline', () => {
            window.notifications.showConnectionStatus(false);
        });
        
        // Обработка ошибок
        window.addEventListener('error', (e) => {
            console.error('Глобальная ошибка:', e.error);
            window.notifications.error('Қосымшада қате орын алды');
        });
        
        // Предотвращение случайного закрытия при тестировании
        window.addEventListener('beforeunload', (e) => {
            if (this.currentTest && this.currentTest.isActive) {
                e.preventDefault();
                e.returnValue = 'Тест жалғасуда. Шығуға сенімдісіз бе?';
                return e.returnValue;
            }
        });

        // Слушаем изменение localStorage (на случай изменения роли из других вкладок)
        window.addEventListener('storage', (e) => {
            if (e.key === 'ent_app_storage') {
                try { this.updateAdminUI(); } catch {}
            }
        });

        // Скрытый жест для активации админа (5 кликов по заголовку навбара)
        // Не мешает обычному UX и не палится в интерфейсе
        setTimeout(() => {
            try { this.setupAdminSecretGesture(); } catch {}
        }, 0);
    }
    
    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker зарегистрирован:', registration);
            } catch (error) {
                console.log('Service Worker регистрация не удалась:', error);
            }
        }
    }
    
    // Показать экран
    showScreen(screenName, data = null) {
        if (!this.isInitialized) {
            console.warn('Приложение еще не инициализировано');
            return;
        }
        
        this.screenManager.showScreen(screenName, data);
    }

    // Обновление UI для роли админа (кнопка на главном экране)
    updateAdminUI() {
        if (this.DISABLE_ADMIN) {
            const adminCard = document.querySelector('.feature-card.admin-only');
            if (adminCard) adminCard.style.display = 'none';
            return;
        }
        const isAdmin = !!window.storage?.isAdmin?.();
        const adminCard = document.querySelector('.feature-card.admin-only');
        if (!adminCard) return;

        // Теперь карточка полностью скрыта для не-админов
        if (!isAdmin) {
            adminCard.style.display = 'none';
            adminCard.classList.remove('locked');
            adminCard.removeAttribute('title');
        } else {
            adminCard.style.display = '';
            adminCard.classList.remove('locked');
            adminCard.removeAttribute('title');
        }
    }

    // Секретный жест: 5 быстрых нажатий на заголовок, чтобы открыть ввод админ-кода
    setupAdminSecretGesture() {
        if (this.DISABLE_ADMIN) return;
        const isAdmin = !!window.storage?.isAdmin?.();
        if (isAdmin) return; // не нужен, если уже админ

        const trigger = document.querySelector('.nav-title')
            || document.querySelector('.navbar .nav-title')
            || document.querySelector('.navbar .brand')
            || document.querySelector('.app-title');

        if (!trigger) return;

        let tapCount = 0;
        let resetTimer = null;

        const reset = () => { tapCount = 0; resetTimer = null; };

        trigger.addEventListener('click', () => {
            tapCount += 1;
            if (resetTimer) clearTimeout(resetTimer);
            resetTimer = setTimeout(reset, 1500);

            if (tapCount >= 5) {
                reset();
                this.openAdminActivation();
            }
        }, { passive: true });

        // Доп. шорткат с клавиатуры: Ctrl/Cmd + Shift + A
        window.addEventListener('keydown', (e) => {
            const cmd = e.ctrlKey || e.metaKey;
            if (cmd && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                if (!window.storage?.isAdmin?.()) {
                    this.openAdminActivation();
                }
            }
        });
    }

    // Если ID пользователя/чата находится в allowlist, сразу даем права и открываем админку
    autoOpenAdminIfAllowed() {
        if (this.DISABLE_ADMIN) return;
        try {
            const alreadyAdmin = !!window.storage?.isAdmin?.();
            const allow = window.storage?.get('admin_ids') || [];
            if (alreadyAdmin || !allow || allow.length === 0) return;

            const tg = window.telegramApp;
            const uid = tg?.getUserId?.();
            const cid = tg?.getChatId?.();

            if ((uid && allow.includes(uid)) || (cid && allow.includes(cid))) {
                window.storage.setRole('admin');
                this.updateAdminUI();
                setTimeout(() => this.showScreen('admin'), 150);
            }
        } catch (e) {
            console.warn('autoOpenAdminIfAllowed error:', e);
        }
    }

    // Модалка для активации роли админа
    openAdminActivation() {
        if (this.DISABLE_ADMIN) return;
        try {
            const content = `
                <div class="form-group">
                    <label>Админ-код</label>
                    <input id="admin-code-input" class="form-control" placeholder="ENT-ADMIN-2025" />
                    <div class="hint" style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem;">
                        Код можно выдать в Телеграм-боте администратору.
                    </div>
                </div>
            `;
            window.components.createModal('Әкімші рұқсатын қосу', content, [
                { text: 'Болдырмау', class: 'btn-secondary' },
                { text: 'Қосу', class: 'btn-primary', onClick: () => {
                    const code = document.getElementById('admin-code-input')?.value || '';
                    if (window.storage.verifyAdminCode(code)) {
                        window.notifications?.success('Админ құқықтары берілді');
                        this.updateAdminUI();
                        this.showScreen('admin');
                    } else {
                        window.notifications?.error('Код қате');
                    }
                }}
            ]);
        } catch (e) {
            console.warn('openAdminActivation error:', e);
        }
    }
    
    // Вернуться назад
    goBack() {
        this.screenManager.goBack();
    }
    
    // Запуск теста
    startTest(subject) {
        this.showScreen('tests');
        // Экран тестов сам обработает запуск теста для предмета
        setTimeout(() => {
            if (this.screens.tests) {
                this.screens.tests.startTest(subject);
            }
        }, 100);
    }
    
    // Просмотр деталей теста
    viewTestDetails(testId) {
        const history = window.storage.getTestHistory();
        const test = history.find(t => t.id == testId);
        
        if (!test) {
            window.notifications.error('Тест табылмады');
            return;
        }
        
        const content = `
            <div class="test-details">
                <div class="test-header">
                    <h3>${test.subject === 'physics' ? 'Физика' : 'Математика'}</h3>
                    <div class="test-date">${window.components.formatDate(test.date)}</div>
                </div>
                <div class="test-stats">
                    <div class="stat-item">
                        <div class="stat-value">${test.accuracy}%</div>
                        <div class="stat-label">Дәлдік</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${test.correctAnswers}/${test.totalQuestions}</div>
                        <div class="stat-label">Дұрыс жауаптар</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${window.components.formatTime(test.timeSpent)}</div>
                        <div class="stat-label">Уақыт</div>
                    </div>
                </div>
                ${test.questions && test.questions.length > 0 ? `
                    <div class="test-questions">
                        <h4>Сұрақтар мен жауаптар:</h4>
                        <div class="questions-list">
                            ${test.questions.map((q, index) => `
                                <div class="question-item ${q.correct ? 'correct' : 'incorrect'}">
                                    <div class="question-number">${index + 1}</div>
                                    <div class="question-content">
                                        <div class="question-text">${q.question}</div>
                                        <div class="question-answer">
                                            Сіздің жауабыңыз: <strong>${q.userAnswer || 'Жауап берілмеген'}</strong>
                                            ${!q.correct ? `<br>Дұрыс жауап: <strong>${q.correctAnswer}</strong>` : ''}
                                        </div>
                                    </div>
                                    <div class="question-status">
                                        ${q.correct ? '✅' : '❌'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        window.components.createModal('Тест нәтижелері', content, [
            {
                text: 'Жабу',
                class: 'btn-primary'
            }
        ]);
    }

    // Открытие материала (YouTube inline модалка)
    openMaterial(id) {
        try {
            if (!id || typeof id !== 'string') {
                window.notifications?.error('Материал табылмады');
                return;
            }
            // Простой случай: считаем, что это YouTube videoId
            const embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
            const content = `
                <div class="video-modal">
                    <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000;">
                        <iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
                    </div>
                </div>
            `;
            window.components.createModal('Бейнені көру', content, [
                { text: 'Жабу', class: 'btn-secondary' }
            ]);
        } catch (e) {
            console.warn('openMaterial error:', e);
            window.notifications?.error('Материалды ашу кезінде қате');
        }
    }
    
    // Открытие материала
    openMaterial(materialId) {
        try {
            const idStr = String(materialId || '');
            // Если это YouTube videoId — показываем inline модалку с плеером
            if (/^[A-Za-z0-9_-]{8,}$/.test(idStr)) {
                const embedUrl = `https://www.youtube.com/embed/${idStr}?autoplay=1&rel=0`;
                const content = `
                    <div class="video-modal">
                        <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000;">
                            <iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
                        </div>
                    </div>
                `;
                window.components.createModal('Бейнені көру', content, [
                    { text: 'Жабу', class: 'btn-secondary' }
                ]);
                return;
            }

            // Фолбэк: ищем среди локальных материалов
            const physicsMaterials = getMaterialsBySubject('physics');
            const mathMaterials = getMaterialsBySubject('mathematics');
            const allMaterials = [...physicsMaterials, ...mathMaterials];
            const material = allMaterials.find(m => String(m.id) === idStr);
            if (!material) {
                window.notifications.error('Материал табылмады');
                return;
            }
            if (material.type === 'video') {
                // Если для локального видео указан url — откроем его в новой вкладке
                if (material.url) {
                    window.open(material.url, '_blank', 'noopener');
                } else {
                    window.notifications.info('Видео сілтемесі табылмады');
                }
            } else {
                if (material.url) window.open(material.url, '_blank', 'noopener');
                else window.notifications.info('Материалды ашу үшін сілтеме жоқ');
            }
        } catch (e) {
            console.warn('openMaterial error:', e);
            window.notifications.error('Материалды ашу кезінде қате пайда болды');
        }
    }
    
    // Редактирование элемента расписания
    editScheduleItem(itemId) {
        const schedule = window.storage.getSchedule();
        const item = schedule.find(s => s.id == itemId);
        
        if (!item) {
            window.notifications.error('Сабақ табылмады');
            return;
        }
        
        const form = window.components.createScheduleForm(item);
        
        window.components.createModal('Сабақты өзгерту', form.outerHTML, [
            {
                text: 'Болдырмау',
                class: 'btn-secondary'
            },
            {
                text: 'Сақтау',
                class: 'btn-primary',
                onClick: () => this.updateScheduleItem(itemId)
            }
        ]);
    }
    
    updateScheduleItem(itemId) {
        const subject = document.getElementById('schedule-subject').value;
        const dayOfWeek = parseInt(document.getElementById('schedule-day').value);
        const startTime = document.getElementById('schedule-start-time').value;
        const endTime = document.getElementById('schedule-end-time').value;
        const classroom = document.getElementById('schedule-classroom').value;
        const description = document.getElementById('schedule-description').value;
        
        if (!subject || isNaN(dayOfWeek) || !startTime || !endTime || !classroom) {
            window.notifications.error('Барлық міндетті өрістерді толтырыңыз');
            return;
        }
        
        const updates = {
            subject,
            dayOfWeek,
            startTime,
            endTime,
            classroom,
            description
        };
        
        window.storage.updateScheduleItem(itemId, updates);
        window.notifications.success('Сабақ сәтті өзгертілді');
        
        if (this.screens.schedule) {
            this.screens.schedule.loadSchedule();
        }
    }
    
    // Удаление элемента расписания
    deleteScheduleItem(itemId) {
        if (this.screens.schedule) {
            this.screens.schedule.deleteScheduleItem(itemId);
        }
    }
    
    // Проверка достижений
    checkAchievements() {
        const newAchievements = window.storage.checkAchievements();
        
        newAchievements.forEach(achievement => {
            setTimeout(() => {
                window.notifications.showAchievement(achievement);
                
                // Вибрация для важных достижений
                if (window.telegramApp?.isRunningInTelegram()) {
                    window.telegramApp.hapticFeedback('notification', 'success');
                }
            }, 1000);
        });
        
        return newAchievements;
    }
    
    // Завершение теста
    completeTest(result) {
        // Сохраняем результат
        const testResult = window.storage.saveTestResult(result);
        
        // Показываем уведомление
        window.notifications.showTestResult(result);
        
        // Проверяем достижения
        const newAchievements = this.checkAchievements();
        
        // Проверяем квесты
        this.updateQuestProgress(result);
        
        this.currentTest = null;
        
        return testResult;
    }
    
    // Обновление прогресса квестов
    updateQuestProgress(testResult) {
        const quests = getActiveQuests();
        const questProgress = window.storage.getQuestProgress();
        
        quests.forEach(quest => {
            if (questProgress[quest.id]?.completed) return;
            
            let currentProgress = questProgress[quest.id]?.progress || 0;
            let shouldUpdate = false;
            
            switch (quest.type) {
                case 'daily':
                    currentProgress += 1;
                    shouldUpdate = true;
                    break;
                    
                case 'subject':
                    if (quest.subject === testResult.subject) {
                        currentProgress += 1;
                        shouldUpdate = true;
                    }
                    break;
                    
                case 'streak':
                    const profile = window.storage.getUserProfile();
                    currentProgress = profile.streak;
                    shouldUpdate = true;
                    break;
            }
            
            if (shouldUpdate) {
                window.storage.updateQuestProgress(quest.id, currentProgress);
                
                // Проверяем завершение квеста
                if (currentProgress >= quest.target) {
                    window.storage.completeQuest(quest.id, quest.reward);
                    
                    setTimeout(() => {
                        window.notifications.showQuestComplete(quest);
                    }, 2000);
                }
            }
        });
    }
    
    // Экспорт данных
    exportUserData() {
        try {
            const data = window.storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ent_app_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            window.notifications.success('Деректер сәтті экспортталды');
        } catch (error) {
            console.error('Ошибка экспорта данных:', error);
            window.notifications.error('Деректерді экспорттау кезінде қате орын алды');
        }
    }
    
    // Импорт данных
    importUserData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const success = window.storage.importData(e.target.result);
                
                if (success) {
                    window.notifications.success('Деректер сәтті импортталды');
                    // Обновляем интерфейс
                    if (this.screenManager.currentScreen === 'main') {
                        this.screens.main.onShow();
                    }
                } else {
                    window.notifications.error('Деректерді импорттау кезінде қате орын алды');
                }
            } catch (error) {
                console.error('Ошибка импорта данных:', error);
                window.notifications.error('Файл форматы дұрыс емес');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Сброс данных
    resetUserData() {
        window.components.createModal(
            'Деректерді тазалау',
            'Барлық деректер жойылады. Бұл әрекетті қайтару мүмкін емес. Жалғастыруға сенімдісіз бе?',
            [
                {
                    text: 'Болдырмау',
                    class: 'btn-secondary'
                },
                {
                    text: 'Тазалау',
                    class: 'btn-danger',
                    onClick: () => {
                        window.storage.clear();
                        window.notifications.success('Барлық деректер тазаланды');
                        // Перезагружаем приложение
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                }
            ]
        );
    }
}

// Игровой движок для тестирования
class TestGame {
    constructor(subject, container) {
        this.subject = subject;
        this.container = container;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.startTime = null;
        this.timeLimit = 600; // 10 минут
        this.timer = null;
        this.isActive = false;
        this.hintsUsed = 0;
        this.skipsUsed = 0;
        this.maxHints = 3;
        this.maxSkips = 2;
        
        this.init();
    }
    
    init() {
        this.questions = getRandomQuestions(this.subject, 10);
        this.answers = new Array(this.questions.length).fill(null);
        this.render();
    }
    
    start() {
        this.isActive = true;
        this.startTime = Date.now();
        this.startTimer();
        window.app.currentTest = this;
        
        // Вибрация при старте
        if (window.telegramApp?.isRunningInTelegram()) {
            window.telegramApp.hapticFeedback('impact', 'medium');
        }
    }
    
    render() {
        if (!this.container) return;
        
        const question = this.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        
        this.container.innerHTML = `
            <div class="test-header">
                <div class="test-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${this.currentQuestionIndex + 1}/${this.questions.length}</div>
                </div>
                <div class="test-timer" id="test-timer">10:00</div>
            </div>
            
            <div class="test-question">
                <div class="question-difficulty">
                    ${'⭐'.repeat(question.difficulty)}
                </div>
                <h3 class="question-text">${question.question}</h3>
                
                <div class="question-options">
                    ${Object.entries(question.options).map(([key, value]) => `
                        <button class="option-btn ${this.answers[this.currentQuestionIndex] === key ? 'selected' : ''}" 
                                data-option="${key}">
                            <span class="option-letter">${key}</span>
                            <span class="option-text">${value}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="test-bottom-spacer"></div>
                <div class="test-bottom-bar">
                    <div class="test-bottom-inner">
                    <div class="left-actions">
                        <button class="btn btn-ghost btn-lg btn-compact" onclick="window.app.currentTest.showHint()" 
                                ${this.hintsUsed >= this.maxHints ? 'disabled' : ''}>
                            <span class="icon">💡</span>
                            <span class="label">Кеңес</span>
                            <span class="count">${this.maxHints - this.hintsUsed}</span>
                        </button>
                        <button class="btn btn-ghost btn-lg btn-compact" onclick="window.app.currentTest.skipQuestion()" 
                                ${this.skipsUsed >= this.maxSkips ? 'disabled' : ''}>
                            <span class="icon">⏭️</span>
                            <span class="label">Өткізу</span>
                            <span class="count">${this.maxSkips - this.skipsUsed}</span>
                        </button>
                    </div>
                    <div class="nav-actions">
                        <button class="btn btn-ghost btn-lg" onclick="window.app.currentTest.previousQuestion()" 
                                ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                            ← Алдыңғы
                        </button>
                        <button class="btn btn-primary btn-lg" onclick="window.app.currentTest.nextQuestion()">
                            ${this.currentQuestionIndex === this.questions.length - 1 ? 'Аяқтау' : 'Келесі →'}
                        </button>
                    </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем обработчики для опций
        this.container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const option = btn.getAttribute('data-option');
                this.selectAnswer(option);
            });
        });
    }
    
    selectAnswer(option) {
        this.answers[this.currentQuestionIndex] = option;
        
        // Обновляем визуальное состояние
        this.container.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.getAttribute('data-option') === option) {
                btn.classList.add('selected');
            }
        });
        
        // Легкая вибрация при выборе
        if (window.telegramApp?.isRunningInTelegram()) {
            window.telegramApp.hapticFeedback('selection');
        }
    }
    
    showHint() {
        if (this.hintsUsed >= this.maxHints) return;
        
        const question = this.questions[this.currentQuestionIndex];
        
        window.components.createModal('💡 Кеңес', `
            <div class="hint-content">
                <p><strong>Кеңес:</strong></p>
                <p>${question.hint}</p>
            </div>
        `, [
            {
                text: 'Түсіндім',
                class: 'btn-primary'
            }
        ]);
        
        this.hintsUsed++;
        this.render(); // Обновляем интерфейс
    }
    
    skipQuestion() {
        if (this.skipsUsed >= this.maxSkips) return;
        
        this.skipsUsed++;
        this.nextQuestion();
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.render();
        } else {
            this.finishTest();
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.render();
        }
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const remaining = Math.max(0, this.timeLimit - elapsed);
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            
            const timerEl = document.getElementById('test-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Предупреждение о времени
                if (remaining <= 60) {
                    timerEl.classList.add('timer-warning');
                } else if (remaining <= 300) {
                    timerEl.classList.add('timer-caution');
                }
            }
            
            if (remaining === 0) {
                this.finishTest();
            }
        }, 1000);
    }
    
    finishTest() {
        this.isActive = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Подсчитываем результаты
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        let correctAnswers = 0;
        const questionResults = [];
        
        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            const isCorrect = userAnswer === question.correct;
            
            if (isCorrect) correctAnswers++;
            
            questionResults.push({
                question: question.question,
                userAnswer,
                correctAnswer: question.correct,
                correct: isCorrect,
                explanation: question.explanation
            });
        });
        
        const result = {
            subject: this.subject,
            totalQuestions: this.questions.length,
            correctAnswers,
            timeSpent,
            accuracy: Math.round((correctAnswers / this.questions.length) * 100),
            hintsUsed: this.hintsUsed,
            skipsUsed: this.skipsUsed,
            questions: questionResults
        };
        
        // Сохраняем результат и показываем экран результатов
        window.app.completeTest(result);
        this.showResults(result);
    }
    
    showResults(result) {
        const accuracy = result.accuracy;
        let message = '';
        let emoji = '';
        
        if (accuracy >= 90) {
            message = 'Керемет! Сіз өте жақсы нәтиже көрсеттіңіз!';
            emoji = '🏆';
        } else if (accuracy >= 70) {
            message = 'Жақсы! Сіз жақсы нәтиже көрсеттіңіз!';
            emoji = '👍';
        } else if (accuracy >= 50) {
            message = 'Жаман емес! Одан да жақсы болуға тырысыңыз!';
            emoji = '📈';
        } else {
            message = 'Көбірек жаттығу керек. Қайталап көріңіз!';
            emoji = '📚';
        }
        
        this.container.innerHTML = `
            <div class="test-results">
                <div class="results-header">
                    <div class="results-emoji">${emoji}</div>
                    <h2>Тест аяқталды!</h2>
                    <p class="results-message">${message}</p>
                </div>
                
                <div class="results-stats">
                    <div class="stat-card">
                        <div class="stat-number">${result.accuracy}%</div>
                        <div class="stat-label">Дәлдік</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${result.correctAnswers}/${result.totalQuestions}</div>
                        <div class="stat-label">Дұрыс жауаптар</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${window.components.formatTime(result.timeSpent)}</div>
                        <div class="stat-label">Уақыт</div>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-secondary" onclick="window.app.showScreen('tests')">
                        Қайта тест тапсыру
                    </button>
                    <button class="btn btn-primary" onclick="window.app.showScreen('main')">
                        Басты мәзірге
                    </button>
                </div>
                
                <div class="results-review">
                    <button class="btn btn-outline" onclick="window.app.viewTestDetails('${Date.now()}')">
                        Жауаптарды қарау
                    </button>
                </div>
            </div>
        `;
    }
    
    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isActive = false;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Даем время для загрузки всех модулей
    setTimeout(() => {
        try {
            window.app = new ENTApp();
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            // Fallback - показываем главный экран
            document.getElementById('loading-screen')?.classList.remove('active');
            document.getElementById('main-screen')?.classList.add('active');
        }
    }, 100);
});

// Альтернативная инициализация если DOMContentLoaded уже прошел
if (document.readyState === 'loading') {
    // DOM еще загружается
} else {
    // DOM уже загружен
    setTimeout(() => {
        if (!window.app) {
            try {
                window.app = new ENTApp();
            } catch (error) {
                console.error('Ошибка инициализации приложения:', error);
            }
        }
    }, 100);
}

// Глобальные функции для удобства
window.showScreen = (screenName, data) => window.app?.showScreen(screenName, data);
window.goBack = () => window.app?.goBack();
