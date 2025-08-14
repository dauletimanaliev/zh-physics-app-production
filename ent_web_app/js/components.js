// Модуль переиспользуемых компонентов
class ComponentManager {
    constructor() {
        this.components = {};
    }
    
    // Создание модального окна
    createModal(title, content, buttons = []) {
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        
        // Очищаем и добавляем кнопки
        modalFooter.innerHTML = '';
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `btn ${button.class || 'btn-secondary'}`;
            btn.textContent = button.text;
            btn.onclick = () => {
                if (button.onClick) button.onClick();
                this.closeModal();
            };
            modalFooter.appendChild(btn);
        });
        
        // Показываем модальное окно
        overlay.classList.add('active');
        
        // Закрытие по клику на overlay
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        };
        
        return modal;
    }
    
    // Закрытие модального окна
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        overlay.classList.remove('active');
        // Очищаем содержимое, чтобы остановить воспроизведение iframes/видео
        if (modalBody) modalBody.innerHTML = '';
        if (modalFooter) modalFooter.innerHTML = '';
    }
    
    // Создание карточки теста
    createTestCard(test) {
        const card = document.createElement('div');
        card.className = 'test-card';
        card.innerHTML = `
            <div class="test-card-header">
                <div class="test-subject">${test.subject === 'physics' ? 'Физика' : 'Математика'}</div>
                <div class="test-date">${this.formatDate(test.date)}</div>
            </div>
            <div class="test-card-body">
                <div class="test-score">
                    <span class="score-number">${test.accuracy}%</span>
                    <span class="score-label">дәлдік</span>
                </div>
                <div class="test-details">
                    <div class="test-questions">${test.correctAnswers}/${test.totalQuestions} дұрыс</div>
                    <div class="test-time">${this.formatTime(test.timeSpent)}</div>
                </div>
            </div>
            <div class="test-card-footer">
                <button class="btn btn-secondary btn-sm" onclick="window.app.viewTestDetails('${test.id}')">
                    Толығырақ
                </button>
            </div>
        `;
        
        // Добавляем класс для цвета в зависимости от результата
        if (test.accuracy >= 90) {
            card.classList.add('test-excellent');
        } else if (test.accuracy >= 70) {
            card.classList.add('test-good');
        } else if (test.accuracy >= 50) {
            card.classList.add('test-average');
        } else {
            card.classList.add('test-poor');
        }
        
        return card;
    }
    
    // Создание элемента расписания
    createScheduleItem(item) {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        scheduleItem.innerHTML = `
            <div class="schedule-time">
                <div class="time-start">${item.startTime}</div>
                <div class="time-end">${item.endTime}</div>
            </div>
            <div class="schedule-content">
                <div class="schedule-subject">${item.subject}</div>
                <div class="schedule-classroom">${item.classroom}</div>
                ${item.description ? `<div class="schedule-description">${item.description}</div>` : ''}
            </div>
            <div class="schedule-actions">
                <button class="btn-icon" onclick="window.app.editScheduleItem('${item.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="window.app.deleteScheduleItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return scheduleItem;
    }
    
    // Создание карточки материала
    createMaterialCard(material) {
        const card = document.createElement('div');
        card.className = 'material-card';
        // YouTube превью, если это видео и id похож на videoId
        const isYouTube = material.type === 'video' && /^[A-Za-z0-9_-]{8,}$/.test(String(material.id || ''));
        const thumb = isYouTube ? `https://i.ytimg.com/vi/${material.id}/hqdefault.jpg` : '';
        const actionText = material.type === 'video' ? 'Көру' : 'Оқу';
        const durationText = material.type === 'video' ? (material.duration || '') : (material.pages ? material.pages + ' бет' : '');

        card.innerHTML = `
            <div class="material-media ${isYouTube ? 'with-thumb' : ''}" ${isYouTube ? `data-video-id="${material.id}"` : ''}>
                ${isYouTube ? `
                    <img class="material-thumb" src="${thumb}" alt="${material.title}" loading="lazy">
                    <div class="material-play" aria-label="Ойнату">▶</div>
                ` : `
                    <div class="material-icon">${material.type === 'video' ? '🎥' : '📄'}</div>
                `}
            </div>
            <div class="material-content">
                <h3 class="material-title">${material.title}</h3>
                ${material.description ? `<p class="material-description">${material.description}</p>` : ''}
                <div class="material-meta">
                    ${material.topic ? `<span class="material-topic">${material.topic}</span>` : ''}
                    ${durationText ? `<span class="material-duration">${durationText}</span>` : ''}
                    <span class="difficulty difficulty-${material.difficulty}">
                        ${this.getDifficultyText(material.difficulty)}
                    </span>
                </div>
            </div>
            <div class="material-actions">
                <button class="icon-pill" aria-label="${actionText}" data-open-id="${material.id}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        // Клик по медиа-области открывает видео (для YouTube)
        if (isYouTube) {
            const media = card.querySelector('.material-media');
            media?.addEventListener('click', () => {
                try { window.app.openMaterial(material.id); } catch (e) { console.warn(e); }
            }, { passive: true });
        }

        // Вся строка кликабельна
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Если клик по кнопке действия — не дублируем
            if ((e.target).closest?.('.icon-pill')) return;
            try { window.app.openMaterial(material.id); } catch (_) {}
        });

        // Кнопка действия (chevron)
        const actionBtn = card.querySelector('.icon-pill');
        actionBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            try { window.app.openMaterial(material.id); } catch (_) {}
        });

        return card;
    }
    
    // Создание элемента квеста
    createQuestItem(quest, progress = null) {
        const questItem = document.createElement('div');
        questItem.className = 'quest-item';
        
        const isCompleted = progress && progress.completed;
        const currentProgress = progress ? progress.progress || 0 : 0;
        const progressPercent = Math.min((currentProgress / quest.target) * 100, 100);
        
        questItem.innerHTML = `
            <div class="quest-icon">${quest.icon}</div>
            <div class="quest-content">
                <div class="quest-header">
                    <h3 class="quest-title">${quest.title}</h3>
                    <div class="quest-reward">+${quest.reward} ұпай</div>
                </div>
                <p class="quest-description">${quest.description}</p>
                <div class="quest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${currentProgress}/${quest.target}</div>
                </div>
            </div>
            <div class="quest-status">
                ${isCompleted ? 
                    '<span class="quest-completed">✅ Орындалды</span>' : 
                    '<span class="quest-active">🎯 Белсенді</span>'
                }
            </div>
        `;
        
        if (isCompleted) {
            questItem.classList.add('quest-completed');
        }
        
        return questItem;
    }
    
    // Создание элемента достижения
    createAchievementItem(achievement, unlocked = false) {
        const achievementItem = document.createElement('div');
        achievementItem.className = `achievement-item ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}`;
        
        achievementItem.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <h3 class="achievement-title">${achievement.title}</h3>
                <p class="achievement-description">${achievement.description}</p>
                <div class="achievement-points">+${achievement.points} ұпай</div>
            </div>
            <div class="achievement-status">
                ${unlocked ? '🏆' : '🔒'}
            </div>
        `;
        
        return achievementItem;
    }
    
    // Создание элемента рейтинга
    createLeaderboardItem(user, rank) {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.dataset.rank = String(rank);
        if (rank === 1 || rank === 2 || rank === 3) {
            item.classList.add('top');
            item.classList.add(`rank-${rank}`);
        }
        
        // Минималистичный вид: без медалей
        const rankDisplay = String(rank);

        const avatarHtml = (user.avatar && user.avatar.length > 0)
            ? `<img src="${user.avatar}" alt="Аватар">`
            : '👤';

        item.innerHTML = `
            <div class="rank-position" aria-label="Орны">${rankDisplay}</div>
            <div class="user-avatar">${avatarHtml}</div>
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-stats">
                    <span class="user-level">Деңгей ${user.level}</span>
                    <span class="user-tests">${user.testsCompleted} тест</span>
                </div>
            </div>
            <div class="user-points">${user.points.toLocaleString?.('ru-RU') || user.points} ұпай</div>
            <button class="icon-pill lb-chevron" aria-label="Ашу"><i class="fas fa-chevron-right"></i></button>
        `;
        
        // Выделяем текущего пользователя
        if (user.isCurrentUser) {
            item.classList.add('current-user');
        }
        
        // Иконка-экшен (на будущее)
        const ch = item.querySelector('.lb-chevron');
        ch?.addEventListener('click', (e) => { e.stopPropagation(); });
        return item;
    }
    
    // Создание календаря расписания
    createScheduleCalendar(scheduleData) {
        const calendar = document.createElement('div');
        calendar.className = 'schedule-calendar';
        
        const daysOfWeek = [
            'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 
            'Жұма', 'Сенбі', 'Жексенбі'
        ];

        // Группируем занятия по дням недели
        const byDay = Array.from({ length: 7 }, () => []);
        (scheduleData || []).forEach(item => {
            const d = Math.max(0, Math.min(6, Number(item.dayOfWeek) || 0));
            byDay[d].push(item);
        });

        // Рисуем сетку: 7 колонок по дням недели
        const grid = document.createElement('div');
        grid.className = 'schedule-grid';

        daysOfWeek.forEach((dayName, idx) => {
            const col = document.createElement('div');
            col.className = 'schedule-day-column';

            const header = document.createElement('div');
            header.className = 'schedule-day-header';
            header.textContent = dayName;
            col.appendChild(header);

            const list = document.createElement('div');
            list.className = 'schedule-day-list';

            // Сортировка по времени начала
            byDay[idx].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
            byDay[idx].forEach(item => {
                list.appendChild(this.createScheduleItem(item));
            });

            // Пустое состояние для дня
            if (byDay[idx].length === 0) {
                const empty = document.createElement('div');
                empty.className = 'schedule-day-empty';
                empty.textContent = 'Сабақ жоқ';
                list.appendChild(empty);
            }

            col.appendChild(list);
            grid.appendChild(col);
        });

        calendar.appendChild(grid);
        return calendar;
    }
    
    // Вспомогательные функции
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Бүгін';
        if (diffDays === 2) return 'Кеше';
        if (diffDays <= 7) return `${diffDays} күн бұрын`;
        
        return date.toLocaleDateString('kk-KZ');
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    getDifficultyText(difficulty) {
        const texts = {
            1: 'Оңай',
            2: 'Орташа',
            3: 'Қиын'
        };
        return texts[difficulty] || 'Орташа';
    }
    
    // Создание загрузочного индикатора
    createLoader(text = 'Жүктелуде...') {
        const loader = document.createElement('div');
        loader.className = 'loader-container';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-text">${text}</div>
        `;
        return loader;
    }
    
    // Создание пустого состояния
    createEmptyState(icon, title, description, actionButton = null) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let buttonHtml = '';
        if (actionButton) {
            buttonHtml = `
                <button class="btn btn-primary" onclick="${actionButton.onClick}">
                    ${actionButton.text}
                </button>
            `;
        }
        
        emptyState.innerHTML = `
            <div class="empty-icon">${icon}</div>
            <h3 class="empty-title">${title}</h3>
            <p class="empty-description">${description}</p>
            ${buttonHtml}
        `;
        
        return emptyState;
    }
}

// Дополнительные стили для компонентов
const componentStyles = `
/* Карточки тестов */
.test-card {
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow);
    border-left: 4px solid var(--gray-300);
}

.test-excellent { border-left-color: var(--success-color); }
.test-good { border-left-color: var(--primary-color); }
.test-average { border-left-color: var(--warning-color); }
.test-poor { border-left-color: var(--danger-color); }

.test-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.test-subject {
    font-weight: 600;
    color: var(--text-primary);
}

.test-date {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.test-card-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.test-score {
    text-align: center;
}

.score-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
}

.score-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.test-details {
    text-align: right;
}

.test-questions, .test-time {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
}

/* Элементы расписания */
.schedule-item {
    display: flex;
    align-items: center;
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: var(--shadow-sm);
}

.schedule-time {
    text-align: center;
    margin-right: 1rem;
    min-width: 80px;
}

.time-start {
    font-weight: 600;
    color: var(--text-primary);
}

.time-end {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.schedule-content {
    flex: 1;
}

.schedule-subject {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.schedule-classroom {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.schedule-description {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
}

.schedule-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-icon {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--border-radius);
    transition: var(--transition);
}

.btn-icon:hover {
    background: var(--gray-100);
    color: var(--text-primary);
}

/* Карточки материалов */
.material-card {
    display: flex;
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.material-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.material-icon {
    font-size: 2.5rem;
    margin-right: 1rem;
    flex-shrink: 0;
}

.material-content {
    flex: 1;
}

.material-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.material-description {
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    line-height: 1.5;
}

.material-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
}

.material-topic {
    color: var(--primary-color);
    font-weight: 500;
}

.material-duration {
    color: var(--text-secondary);
}

.material-actions {
    display: flex;
    align-items: center;
}

/* Элементы квестов */
.quest-item {
    display: flex;
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow);
}

.quest-item.quest-completed {
    opacity: 0.7;
    background: var(--gray-50);
}

.quest-icon {
    font-size: 2rem;
    margin-right: 1rem;
    flex-shrink: 0;
}

.quest-content {
    flex: 1;
}

.quest-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.quest-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
}

.quest-reward {
    font-size: 0.875rem;
    color: var(--success-color);
    font-weight: 500;
}

.quest-description {
    color: var(--text-secondary);
    margin-bottom: 1rem;
    line-height: 1.5;
}

.quest-progress {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: var(--gray-200);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    white-space: nowrap;
}

.quest-status {
    display: flex;
    align-items: center;
    margin-left: 1rem;
}

.quest-completed, .quest-active {
    font-size: 0.875rem;
    font-weight: 500;
}

.quest-completed {
    color: var(--success-color);
}

.quest-active {
    color: var(--primary-color);
}

/* Формы */
.schedule-form {
    max-width: 500px;
}

.form-group {
    margin-bottom: 1rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    transition: var(--transition);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Загрузчик */
.loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.loader-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--gray-200);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

.loader-text {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

/* Пустое состояние */
.empty-state {
    text-align: center;
    padding: 3rem 2rem;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.empty-description {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    line-height: 1.5;
}
`;

// Добавляем стили компонентов
const componentStyleSheet = document.createElement('style');
componentStyleSheet.textContent = componentStyles;
document.head.appendChild(componentStyleSheet);

// Создание глобального экземпляра
window.components = new ComponentManager();
