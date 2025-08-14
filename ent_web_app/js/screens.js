// Модуль управления экранами
class ScreenManager {
    constructor() {
        this.currentScreen = 'loading';
        this.screenHistory = [];
        this.screens = {};
        this.testGame = null;
        
        this.initScreens();
    }
    
    // Инициализация экранов
    initScreens() {
        this.screens = {
            loading: new LoadingScreen(),
            main: new MainScreen(),
            tests: new TestsScreen(),
            schedule: new ScheduleScreen(),
            materials: new MaterialsScreen(),
            leaderboard: new LeaderboardScreen(),
            quests: new QuestsScreen(),
            profile: new ProfileScreen()
        };
    }
    
    // Показать экран
    showScreen(screenName, data = null) {
        if (!this.screens[screenName]) {
            console.error('Экран не найден:', screenName);
            return;
        }

        // Админ-панель отключена в этом приложении
        if (screenName === 'admin') {
            window.notifications?.info('Админ панелі өшірілген');
            return;
        }
        
        // Скрываем текущий экран
        if (this.currentScreen) {
            const currentScreenElement = document.getElementById(`${this.currentScreen}-screen`);
            if (currentScreenElement) {
                currentScreenElement.classList.remove('active');
            }
            
            // Вызываем onHide для текущего экрана
            if (this.screens[this.currentScreen] && this.screens[this.currentScreen].onHide) {
                this.screens[this.currentScreen].onHide();
            }
        }
        
        // Добавляем в историю
        if (this.currentScreen && this.currentScreen !== screenName) {
            this.screenHistory.push(this.currentScreen);
        }
        
        // Показываем новый экран
        const screenElement = document.getElementById(`${screenName}-screen`);
        if (screenElement) {
            screenElement.classList.add('active');
        }
        
        // Обновляем навигацию
        this.updateNavigation(screenName);
        
        // Вызываем onShow для нового экрана
        if (this.screens[screenName] && this.screens[screenName].onShow) {
            this.screens[screenName].onShow(data);
        }
        
        this.currentScreen = screenName;
        
        // Обновляем Telegram кнопки
        this.updateTelegramButtons(screenName);
    }
    
    // Возврат к предыдущему экрану
    goBack() {
        if (this.screenHistory.length > 0) {
            const previousScreen = this.screenHistory.pop();
            this.showScreen(previousScreen);
        } else {
            this.showScreen('main');
        }
    }
    
    // Обновление навигации
    updateNavigation(screenName) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-screen') === screenName) {
                item.classList.add('active');
            }
        });
    }
    
    // Обновление кнопок Telegram
    updateTelegramButtons(screenName) {
        if (!window.telegramApp?.isRunningInTelegram()) return;
        
        if (screenName === 'main') {
            window.telegramApp.hideMainButton();
            window.telegramApp.hideBackButton();
        } else {
            window.telegramApp.showBackButton();
            window.telegramApp.showMainButton();
        }
    }
}

// Базовый класс экрана
class BaseScreen {
    constructor(screenId) {
        this.screenId = screenId;
        this.element = document.getElementById(`${screenId}-screen`);
    }
    
    onShow(data) {
        // Переопределяется в дочерних классах
    }
    
    onHide() {
        // Переопределяется в дочерних классах
    }
}

// Экран загрузки
class LoadingScreen extends BaseScreen {
    constructor() {
        super('loading');
    }
    
    onShow() {
        // Проверяем готовность всех компонентов
        this.checkAppReady();
    }
    
    checkAppReady() {
        // Упрощенная проверка - просто переходим к главному экрану
        setTimeout(() => {
            if (window.app && window.app.showScreen) {
                window.app.showScreen('main');
            } else {
                // Fallback - показываем главный экран напрямую
                document.getElementById('loading-screen').classList.remove('active');
                document.getElementById('main-screen').classList.add('active');
            }
        }, 1000);
    }
}

// Главный экран
class MainScreen extends BaseScreen {
    constructor() {
        super('main');
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Обработчики для карточек функций
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const feature = card.getAttribute('data-feature');
                if (feature) {
                    window.app.showScreen(feature);
                }
            });
        });
    }
    
    onShow() {
        this.updateUserStats();
        this.updateAchievements();
    }
    
    updateUserStats() {
        const profile = window.storage.getUserProfile();
        const stats = window.storage.getStatistics();
        
        // Обновляем элементы интерфейса
        const userNameEl = document.getElementById('user-name');
        const userLevelEl = document.getElementById('user-level');
        const userAvatarEl = document.querySelector('.nav-user .user-avatar');
        const userPointsEl = document.getElementById('user-points');
        const userRankEl = document.getElementById('user-rank');
        const testsCompletedEl = document.getElementById('tests-completed');
        const streakDaysEl = document.getElementById('streak-days');
        
        if (userNameEl) userNameEl.textContent = profile.name;
        if (userLevelEl) userLevelEl.textContent = `${profile.level} деңгей`;
        if (userAvatarEl) {
            if (profile.avatar && profile.avatar.length > 0) {
                userAvatarEl.innerHTML = `<img src="${profile.avatar}" alt="Аватар">`;
            } else {
                userAvatarEl.textContent = '👤';
            }
        }
        if (userPointsEl) userPointsEl.textContent = profile.points;
        if (userRankEl) userRankEl.textContent = this.calculateRank(profile.points);
        if (testsCompletedEl) testsCompletedEl.textContent = profile.testsCompleted;
        if (streakDaysEl) streakDaysEl.textContent = profile.streak;
    }
    
    updateAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;
        
        const profile = window.storage.getUserProfile();
        const recentAchievements = profile.achievements.slice(-3);
        
        if (recentAchievements.length === 0) {
            achievementsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <p>Әлі жетістіктер жоқ</p>
                    <p>Тест тапсырып, жетістіктер жинаңыз!</p>
                </div>
            `;
            return;
        }
        
        achievementsList.innerHTML = '';
        const achievements = getAchievements();
        
        recentAchievements.forEach(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            if (achievement) {
                const item = document.createElement('div');
                item.className = 'achievement-item';
                item.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                    </div>
                    <div class="achievement-time">Жақында</div>
                `;
                achievementsList.appendChild(item);
            }
        });
    }
    
    calculateRank(points) {
        // Простая система рангов
        if (points >= 10000) return 'Мастер';
        if (points >= 5000) return 'Эксперт';
        if (points >= 2000) return 'Жетілген';
        if (points >= 1000) return 'Дәстүрлі';
        if (points >= 500) return 'Жаңадан бастаған';
        return 'Бастаушы';
    }
}

// Экран тестирования
class TestsScreen extends BaseScreen {
    constructor() {
        super('tests');
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Обработчики для выбора предмета
        const subjectCards = document.querySelectorAll('.subject-card');
        subjectCards.forEach(card => {
            card.addEventListener('click', () => {
                const subject = card.getAttribute('data-subject');
                if (subject) {
                    this.startTest(subject);
                }
            });
        });
    }
    
    onShow() {
        this.showSubjectSelection();
        this.updateSubjectStats();
    }
    
    showSubjectSelection() {
        const subjectSelection = document.getElementById('subject-selection');
        const testGame = document.getElementById('test-game');
        
        if (subjectSelection) subjectSelection.style.display = 'block';
        if (testGame) testGame.style.display = 'none';
    }
    
    updateSubjectStats() {
        const stats = getSubjectStats();
        
        // Обновляем статистику по физике
        const physicsCard = document.querySelector('[data-subject="physics"]');
        if (physicsCard) {
            const statsEl = physicsCard.querySelector('.subject-stats span');
            if (statsEl) {
                statsEl.textContent = `${stats.physics.total} сұрақ`;
            }
        }
        
        // Обновляем статистику по математике
        const mathCard = document.querySelector('[data-subject="mathematics"]');
        if (mathCard) {
            const statsEl = mathCard.querySelector('.subject-stats span');
            if (statsEl) {
                statsEl.textContent = `${stats.mathematics.total} сұрақ`;
            }
        }
    }
    
    startTest(subject) {
        const subjectSelection = document.getElementById('subject-selection');
        const testGameContainer = document.getElementById('test-game');
        
        if (subjectSelection) subjectSelection.style.display = 'none';
        if (testGameContainer) testGameContainer.style.display = 'block';
        
        // Создаем игру
        this.testGame = new TestGame(subject, testGameContainer);
        this.testGame.start();
    }
    
    onHide() {
        if (this.testGame) {
            this.testGame.cleanup();
            this.testGame = null;
        }
    }
}

// Экран расписания
class ScheduleScreen extends BaseScreen {
    constructor() {
        super('schedule');
        this.initEventListeners();
    }
    
    initEventListeners() {
        const addBtn = document.getElementById('add-schedule-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddScheduleForm();
            });
        }
    }
    
    onShow() {
        this.loadSchedule();
    }
    
    loadSchedule() {
        const calendar = document.getElementById('schedule-calendar');
        if (!calendar) return;
        
        const scheduleData = window.storage.getSchedule();
        
        if (scheduleData.length === 0) {
            calendar.innerHTML = window.components.createEmptyState(
                '📅',
                'Расписание пусто',
                'Добавьте первое занятие в ваше расписание',
                {
                    text: 'Добавить занятие',
                    onClick: 'window.app.screens.schedule.showAddScheduleForm()'
                }
            ).outerHTML;
            return;
        }
        
        calendar.innerHTML = '';
        const scheduleCalendar = window.components.createScheduleCalendar(scheduleData);
        calendar.appendChild(scheduleCalendar);
    }
    
    showAddScheduleForm() {
        const form = window.components.createScheduleForm();
        
        window.components.createModal('Жаңа сабақ қосу', form.outerHTML, [
            {
                text: 'Болдырмау',
                class: 'btn-secondary'
            },
            {
                text: 'Сақтау',
                class: 'btn-primary',
                onClick: () => this.saveScheduleItem()
            }
        ]);
    }
    
    saveScheduleItem() {
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
        
        const scheduleItem = {
            subject,
            dayOfWeek,
            startTime,
            endTime,
            classroom,
            description
        };
        
        window.storage.addScheduleItem(scheduleItem);
        window.notifications.success('Сабақ сәтті қосылды');
        this.loadSchedule();
    }
    
    editScheduleItem(id) {
        // Реализация редактирования
        console.log('Edit schedule item:', id);
    }
    
    deleteScheduleItem(id) {
        window.components.createModal(
            'Сабақты жою',
            'Бұл сабақты жоюға сенімдісіз бе?',
            [
                {
                    text: 'Болдырмау',
                    class: 'btn-secondary'
                },
                {
                    text: 'Жою',
                    class: 'btn-danger',
                    onClick: () => {
                        window.storage.deleteScheduleItem(id);
                        window.notifications.success('Сабақ жойылды');
                        this.loadSchedule();
                    }
                }
            ]
        );
    }
}

// Экран материалов
class MaterialsScreen extends BaseScreen {
    constructor() {
        super('materials');
    }
    
    onShow() {
        this.loadMaterials();
    }
    
    loadMaterials() {
        const content = document.getElementById('materials-content');
        if (!content) return;
        
        // Показать загрузчик
        content.innerHTML = '';
        const loader = window.components.createLoader('YouTube-тан материалдар жүктелуде...');
        content.appendChild(loader);

        // Попытка загрузить ролики с YouTube канала @zhomarts без API ключа
        // Шаг 1: Получить channelId из страницы канала через лёгкий текстовый прокси
        const channelHandleUrl = 'https://r.jina.ai/http://www.youtube.com/@zhomarts';

        const loadFromYouTube = async () => {
            try {
                const handleRes = await fetch(channelHandleUrl, { cache: 'no-store' });
                const handleText = await handleRes.text();
                const m = handleText.match(/\"channelId\":\"(UC[^"]+)\"/);
                const channelId = m && m[1] ? m[1] : null;

                if (!channelId) throw new Error('channelId not found');

                // Шаг 2: Загрузить RSS ленту канала и распарсить
                const feedUrl = `https://r.jina.ai/http://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
                const feedRes = await fetch(feedUrl, { cache: 'no-store' });
                const feedText = await feedRes.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(feedText, 'application/xml');
                const entries = Array.from(xml.getElementsByTagName('entry'));

                // Соберём карточки видео (ограничим, например, 30)
                const videos = entries.slice(0, 30).map(entry => {
                    const title = entry.getElementsByTagName('title')[0]?.textContent || 'Видео';
                    const id = entry.getElementsByTagName('yt:videoId')[0]?.textContent || '';
                    const description = entry.getElementsByTagName('media:description')[0]?.textContent || '';
                    return {
                        id, // будет использоваться как YouTube videoId
                        type: 'video',
                        title,
                        description,
                        topic: 'YouTube',
                        difficulty: 1,
                        duration: ''
                    };
                });

                // Данные
                const mathMaterials = getMaterialsBySubject('mathematics');
                const all = [...videos.map(v => ({ ...v, subject: 'physics' })), ...mathMaterials.map(m => ({ ...m, subject: 'mathematics' }))];

                // Рендер тулбара и грид
                content.innerHTML = `
                    <div class="materials-toolbar">
                        <input id="materials-search" class="form-control" placeholder="Іздеу: атауы не тақырыбы" />
                        <div class="filters" id="subject-filters">
                            <button class="btn btn-chip active" data-filter="all">Барлығы</button>
                            <button class="btn btn-chip" data-filter="physics">Физика</button>
                            <button class="btn btn-chip" data-filter="mathematics">Математика</button>
                            <a class="btn btn-chip" id="channel-link" href="https://www.youtube.com/@zhomarts/videos" target="_blank" rel="noopener">Каналға көшу</a>
                        </div>
                        <div class="filters" id="type-filters">
                            <button class="btn btn-chip active" data-type="all">Барлығы</button>
                            <button class="btn btn-chip" data-type="video">Бейне</button>
                            <button class="btn btn-chip" data-type="document">Құжаттар</button>
                            <button class="btn btn-chip" data-type="task">Есептер</button>
                        </div>
                    </div>
                    <div class="materials-grid" id="materials-grid"></div>
                `;

                const grid = document.getElementById('materials-grid');

                const render = (items) => {
                    grid.innerHTML = '';
                    items.forEach(item => {
                        const card = window.components.createMaterialCard(item);
                        grid.appendChild(card);
                    });
                };

                // Инициализация
                let currentFilter = 'all';
                let typeFilter = 'all';
                let query = '';
                const apply = () => {
                    const q = query.trim().toLowerCase();
                    const filtered = all.filter(x => {
                        const f = currentFilter === 'all' || x.subject === currentFilter;
                        // Нормализуем тип: по умолчанию документ, если явно не указано
                        const normType = (x.type || (x.pages ? 'document' : 'video')).toLowerCase();
                        const t = typeFilter === 'all' || normType === typeFilter || (typeFilter === 'task' && (x.category === 'task' || /есеп/i.test(x.title || '')));
                        const text = `${x.title || ''} ${x.description || ''} ${x.topic || ''}`.toLowerCase();
                        const s = q.length === 0 || text.includes(q);
                        return f && t && s;
                    });
                    render(filtered);
                };

                // События
                const search = document.getElementById('materials-search');
                search.addEventListener('input', (e) => { query = e.target.value || ''; apply(); });
                content.querySelectorAll('#subject-filters .btn-chip').forEach(btn => {
                    btn.addEventListener('click', () => {
                        content.querySelectorAll('#subject-filters .btn-chip').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentFilter = btn.dataset.filter;
                        apply();
                    });
                });

                content.querySelectorAll('#type-filters .btn-chip').forEach(btn => {
                    btn.addEventListener('click', () => {
                        content.querySelectorAll('#type-filters .btn-chip').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        typeFilter = btn.dataset.type;
                        apply();
                    });
                });

                apply();
            } catch (err) {
                console.warn('YouTube load failed, fallback to local materials:', err);

                // Фолбэк: используем локальные материалы, но в том же современном UI
                const physicsMaterials = getMaterialsBySubject('physics').map(m => ({...m, subject: 'physics'}));
                const mathMaterials = getMaterialsBySubject('mathematics').map(m => ({...m, subject: 'mathematics'}));
                const all = [...physicsMaterials, ...mathMaterials];

                content.innerHTML = `
                    <div class="materials-toolbar">
                        <input id="materials-search" class="form-control" placeholder="Іздеу: атауы не тақырыбы" />
                        <div class="filters" id="subject-filters">
                            <button class="btn btn-chip active" data-filter="all">Барлығы</button>
                            <button class="btn btn-chip" data-filter="physics">Физика</button>
                            <button class="btn btn-chip" data-filter="mathematics">Математика</button>
                            <a class="btn btn-chip" id="channel-link" href="https://www.youtube.com/@zhomarts/videos" target="_blank" rel="noopener">Каналға көшу</a>
                        </div>
                        <div class="filters" id="type-filters">
                            <button class="btn btn-chip active" data-type="all">Барлығы</button>
                            <button class="btn btn-chip" data-type="video">Бейне</button>
                            <button class="btn btn-chip" data-type="document">Құжаттар</button>
                            <button class="btn btn-chip" data-type="task">Есептер</button>
                        </div>
                    </div>
                    <div class="materials-grid" id="materials-grid"></div>
                `;

                const grid = document.getElementById('materials-grid');
                const render = (items) => {
                    grid.innerHTML = '';
                    items.forEach(item => grid.appendChild(window.components.createMaterialCard(item)));
                };

                let currentFilter = 'all';
                let typeFilter = 'all';
                let query = '';
                const apply = () => {
                    const q = query.trim().toLowerCase();
                    const filtered = all.filter(x => {
                        const f = currentFilter === 'all' || x.subject === currentFilter;
                        const normType = (x.type || (x.pages ? 'document' : 'video')).toLowerCase();
                        const t = typeFilter === 'all' || normType === typeFilter || (typeFilter === 'task' && (x.category === 'task' || /есеп/i.test(x.title || '')));
                        const text = `${x.title || ''} ${x.description || ''} ${x.topic || ''}`.toLowerCase();
                        const s = q.length === 0 || text.includes(q);
                        return f && t && s;
                    });
                    render(filtered);
                };

                document.getElementById('materials-search').addEventListener('input', (e) => { query = e.target.value || ''; apply(); });
                content.querySelectorAll('#subject-filters .btn-chip').forEach(btn => {
                    btn.addEventListener('click', () => {
                        content.querySelectorAll('#subject-filters .btn-chip').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentFilter = btn.dataset.filter;
                        apply();
                    });
                });
                content.querySelectorAll('#type-filters .btn-chip').forEach(btn => {
                    btn.addEventListener('click', () => {
                        content.querySelectorAll('#type-filters .btn-chip').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        typeFilter = btn.dataset.type;
                        apply();
                    });
                });

                apply();
            }
        };

        loadFromYouTube();
    }
    
    openMaterial(id) {
        window.notifications.info('Материал ашылуда...');
        // Здесь будет логика открытия материала
    }
}

// Экран рейтинга
class LeaderboardScreen extends BaseScreen {
    constructor() {
        super('leaderboard');
    }
    
    onShow() {
        this.loadLeaderboard();
    }
    
    loadLeaderboard() {
        const content = document.getElementById('leaderboard-content');
        if (!content) return;
        
        // Генерируем демо-данные рейтинга
        const leaderboardData = this.generateDemoLeaderboard();
        
        content.innerHTML = '<div class="leaderboard-list"></div>';
        const list = content.querySelector('.leaderboard-list');
        
        leaderboardData.forEach((user, index) => {
            const item = window.components.createLeaderboardItem(user, index + 1);
            list.appendChild(item);
        });
    }
    
    generateDemoLeaderboard() {
        const me = window.storage.getUserProfile();
        const meEntry = {
            name: me.name,
            level: me.level,
            points: me.points,
            testsCompleted: me.testsCompleted,
            avatar: me.avatar || '',
            isCurrentUser: true,
            id: 'me'
        };

        // Демо-участники для визуализации списка (в будущем заменить на реальные данные)
        const demoNames = ['Айбек', 'Аружан', 'Ернар', 'Динара', 'Елдос', 'Сандуғаш', 'Нұржан', 'Аружан М.', 'Руслан', 'Мерей', 'Іңкәр', 'Даурен', 'Әлия', 'Нұрислам'];
        const others = demoNames.map((n, i) => ({
            id: 'u' + i,
            name: n,
            level: Math.max(1, (me.level || 1) - 1 + Math.round(Math.random()*2)),
            points: Math.max(0, (me.points || 0) + (Math.round(Math.random()*400) - 200)),
            testsCompleted: Math.floor(Math.random()*15),
            avatar: '',
            isCurrentUser: false
        }));

        // Собираем, сортируем по очкам по убыванию
        const all = [meEntry, ...others].sort((a,b) => (b.points||0) - (a.points||0));
        return all;
    }
}

// Экран квестов
class QuestsScreen extends BaseScreen {
    constructor() {
        super('quests');
    }
    
    onShow() {
        this.loadQuests();
        this.updateAvailablePoints();
    }
    
    loadQuests() {
        const content = document.getElementById('quests-content');
        if (!content) return;
        
        const quests = getActiveQuests();
        const questProgress = window.storage.getQuestProgress();
        
        content.innerHTML = '<div class="quests-list"></div>';
        const list = content.querySelector('.quests-list');
        
        quests.forEach(quest => {
            const progress = questProgress[quest.id];
            const item = window.components.createQuestItem(quest, progress);
            list.appendChild(item);
        });
    }
    
    updateAvailablePoints() {
        const pointsEl = document.getElementById('available-quest-points');
        if (!pointsEl) return;
        
        const quests = getActiveQuests();
        const questProgress = window.storage.getQuestProgress();
        
        const availablePoints = quests.reduce((total, quest) => {
            const progress = questProgress[quest.id];
            if (!progress || !progress.completed) {
                return total + quest.reward;
            }
            return total;
        }, 0);
        
        pointsEl.textContent = `${availablePoints} ұпай қол жетімді`;
    }
}

// Экран профиля
class ProfileScreen extends BaseScreen {
    constructor() {
        super('profile');
    }
    
    onShow() {
        this.loadProfile();
        this.bindEvents();
    }
    
    loadProfile() {
        const profile = window.storage.getUserProfile();
        const stats = window.storage.getStatistics();
        
        // Поля отображения
        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const roleEl = document.getElementById('profile-role');
        const levelTextEl = document.getElementById('level-text');
        const levelBarEl = document.getElementById('level-progress-bar');
        const testsEl = document.getElementById('stats-tests');
        const accEl = document.getElementById('stats-accuracy');
        const rankEl = document.getElementById('stats-rank');
        
        if (avatarEl) {
            const fallbackSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" rx="80" fill="%232563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="72" fill="white">👤</text></svg>');
            avatarEl.src = profile.avatar && profile.avatar.length > 0 ? profile.avatar : `data:image/svg+xml;utf8,${fallbackSvg}`;
        }
        if (nameEl) nameEl.textContent = profile.name || 'Пайдаланушы';
        if (emailEl) emailEl.textContent = profile.email || '';
        if (roleEl) roleEl.textContent = 'Рөлі: Оқушы';
        if (levelTextEl) levelTextEl.textContent = `${profile.level} деңгей`;
        if (levelBarEl) {
            const progress = Math.min(99, (profile.experience % 1000) / 10);
            levelBarEl.style.width = progress + '%';
        }
        if (testsEl) testsEl.textContent = stats.totalTests;
        if (accEl) accEl.textContent = `${stats.accuracy}%`;
        if (rankEl) rankEl.textContent = this.calculateRank(profile.points || 0);
        
        // Заполняем форму редактирования
        const editName = document.getElementById('edit-name');
        const editEmail = document.getElementById('edit-email');
        const editPhone = document.getElementById('edit-phone');
        const editSchool = document.getElementById('edit-school');
        if (editName) editName.value = profile.name || '';
        if (editEmail) editEmail.value = profile.email || '';
        if (editPhone) editPhone.value = profile.phone || '';
        if (editSchool) editSchool.value = profile.school || '';
    }
    
    bindEvents() {
        const editBtn = document.getElementById('edit-profile-btn');
        const form = document.getElementById('edit-profile-form');
        const container = document.querySelector('.profile-container');
        const saveBtn = document.getElementById('save-profile');
        const cancelBtn = document.getElementById('cancel-edit-profile');
        const avatarUpload = document.getElementById('avatar-upload');
        
        if (editBtn && form && container) {
            editBtn.onclick = () => {
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
                container.style.display = form.style.display === 'none' ? 'block' : 'none';
            };
        }
        if (cancelBtn && form && container) {
            cancelBtn.onclick = () => {
                form.style.display = 'none';
                container.style.display = 'block';
            };
        }
        if (saveBtn) {
            saveBtn.onclick = () => {
                const name = (document.getElementById('edit-name')?.value || '').trim();
                const email = (document.getElementById('edit-email')?.value || '').trim();
                const phone = (document.getElementById('edit-phone')?.value || '').trim();
                const school = (document.getElementById('edit-school')?.value || '').trim();
                
                window.storage.updateUserProfile({ name, email, phone, school });
                window.notifications?.success('Профиль сәтті сақталды');
                this.loadProfile();
                if (form && container) {
                    form.style.display = 'none';
                    container.style.display = 'block';
                }
            };
        }
        if (avatarUpload) {
            avatarUpload.onchange = (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result;
                    window.storage.updateUserProfile({ avatar: dataUrl });
                    this.loadProfile();
                    window.notifications?.success('Аватар жаңартылды');
                };
                reader.readAsDataURL(file);
            };
        }
    }
    
    calculateRank(points) {
        // Простая ранговая система
        if (points >= 5000) return 'S';
        if (points >= 3000) return 'A';
        if (points >= 1500) return 'B';
        if (points >= 700) return 'C';
        return 'D';
    }
}

// Создание глобального экземпляра
window.screenManager = new ScreenManager();
