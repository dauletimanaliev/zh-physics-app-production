// Модуль уведомлений
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.init();
    }
    
    init() {
        // Создаем контейнер для уведомлений если его нет
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }
    
    // Показать уведомление
    show(message, type = 'info', duration = null) {
        const notification = this.createNotification(message, type, duration);
        this.addNotification(notification);
        return notification.id;
    }
    
    // Показать успешное уведомление
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }
    
    // Показать уведомление об ошибке
    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }
    
    // Показать предупреждение
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }
    
    // Показать информационное уведомление
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }
    
    // Создание элемента уведомления
    createNotification(message, type, duration) {
        const id = 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const notification = {
            id,
            message,
            type,
            duration: duration || this.defaultDuration,
            element: null,
            timeout: null
        };
        
        // Создаем DOM элемент
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.setAttribute('data-id', id);
        
        // Иконки для разных типов
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icons[type] || icons.info}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="window.notifications.hide('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress">
                <div class="notification-progress-bar"></div>
            </div>
        `;
        
        notification.element = element;
        
        return notification;
    }
    
    // Добавление уведомления в контейнер
    addNotification(notification) {
        // Удаляем старые уведомления если их слишком много
        while (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotificationElement(oldest);
        }
        
        // Добавляем новое уведомление
        this.notifications.push(notification);
        this.container.appendChild(notification.element);
        
        // Анимация появления
        requestAnimationFrame(() => {
            notification.element.classList.add('notification-show');
        });
        
        // Запускаем прогресс-бар
        this.startProgressBar(notification);
        
        // Автоматическое скрытие
        if (notification.duration > 0) {
            notification.timeout = setTimeout(() => {
                this.hide(notification.id);
            }, notification.duration);
        }
        
        // Вибрация для Telegram
        if (window.telegramApp?.isRunningInTelegram()) {
            const hapticType = notification.type === 'error' ? 'notification' : 'impact';
            window.telegramApp.hapticFeedback(hapticType, 'light');
        }
    }
    
    // Запуск прогресс-бара
    startProgressBar(notification) {
        if (notification.duration <= 0) return;
        
        const progressBar = notification.element.querySelector('.notification-progress-bar');
        if (progressBar) {
            progressBar.style.animationDuration = `${notification.duration}ms`;
            progressBar.classList.add('notification-progress-active');
        }
    }
    
    // Скрытие уведомления
    hide(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;
        
        // Очищаем таймер
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }
        
        // Анимация скрытия
        notification.element.classList.add('notification-hide');
        
        setTimeout(() => {
            this.removeNotificationElement(notification);
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }
    
    // Удаление элемента уведомления
    removeNotificationElement(notification) {
        if (notification.element && notification.element.parentNode) {
            notification.element.parentNode.removeChild(notification.element);
        }
    }
    
    // Скрытие всех уведомлений
    hideAll() {
        this.notifications.forEach(notification => {
            this.hide(notification.id);
        });
    }
    
    // Показать уведомление о достижении
    showAchievement(achievement) {
        const message = `
            <div class="achievement-notification">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">Жаңа жетістік!</div>
                    <div class="achievement-name">${achievement.title}</div>
                    <div class="achievement-points">+${achievement.points} ұпай</div>
                </div>
            </div>
        `;
        
        return this.show(message, 'success', 7000);
    }
    
    // Показать уведомление о завершении квеста
    showQuestComplete(quest) {
        const message = `
            <div class="quest-notification">
                <div class="quest-icon">${quest.icon}</div>
                <div class="quest-info">
                    <div class="quest-title">Тапсырма орындалды!</div>
                    <div class="quest-name">${quest.title}</div>
                    <div class="quest-reward">+${quest.reward} ұпай</div>
                </div>
            </div>
        `;
        
        return this.show(message, 'success', 6000);
    }
    
    // Показать уведомление о повышении уровня
    showLevelUp(newLevel) {
        const message = `
            <div class="level-notification">
                <div class="level-icon">🎉</div>
                <div class="level-info">
                    <div class="level-title">Деңгей көтерілді!</div>
                    <div class="level-number">Деңгей ${newLevel}</div>
                </div>
            </div>
        `;
        
        return this.show(message, 'success', 5000);
    }
    
    // Показать уведомление о результате теста
    showTestResult(result) {
        const accuracy = Math.round((result.correctAnswers / result.totalQuestions) * 100);
        let type = 'info';
        let icon = '📊';
        
        if (accuracy >= 90) {
            type = 'success';
            icon = '🏆';
        } else if (accuracy >= 70) {
            type = 'success';
            icon = '👍';
        } else if (accuracy >= 50) {
            type = 'warning';
            icon = '📈';
        } else {
            type = 'error';
            icon = '📉';
        }
        
        const message = `
            <div class="test-result-notification">
                <div class="test-icon">${icon}</div>
                <div class="test-info">
                    <div class="test-title">Тест аяқталды</div>
                    <div class="test-score">${result.correctAnswers}/${result.totalQuestions} дұрыс (${accuracy}%)</div>
                </div>
            </div>
        `;
        
        return this.show(message, type, 6000);
    }
    
    // Показать напоминание
    showReminder(title, message) {
        const reminderMessage = `
            <div class="reminder-notification">
                <div class="reminder-icon">🔔</div>
                <div class="reminder-info">
                    <div class="reminder-title">${title}</div>
                    <div class="reminder-message">${message}</div>
                </div>
            </div>
        `;
        
        return this.show(reminderMessage, 'info', 8000);
    }
    
    // Показать уведомление о подключении к интернету
    showConnectionStatus(isOnline) {
        const message = isOnline ? 
            'Интернет қосылымы қалпына келтірілді' : 
            'Интернет қосылымы жоқ';
        
        const type = isOnline ? 'success' : 'warning';
        
        return this.show(message, type, 3000);
    }
    
    // Показать уведомление о сохранении
    showSaveStatus(success = true) {
        const message = success ? 
            'Деректер сақталды' : 
            'Деректерді сақтау кезінде қате орын алды';
        
        const type = success ? 'success' : 'error';
        
        return this.show(message, type, 2000);
    }
}

// Дополнительные стили для уведомлений
const notificationStyles = `
.notification {
    position: relative;
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    margin-bottom: 0.5rem;
    overflow: hidden;
    transform: translateX(100%);
    transition: all 0.3s ease-in-out;
    max-width: 400px;
    border-left: 4px solid var(--primary-color);
}

.notification-show {
    transform: translateX(0);
}

.notification-hide {
    transform: translateX(100%);
    opacity: 0;
}

.notification-success {
    border-left-color: var(--success-color);
}

.notification-error {
    border-left-color: var(--danger-color);
}

.notification-warning {
    border-left-color: var(--warning-color);
}

.notification-content {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 0.75rem;
}

.notification-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.notification-message {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--text-primary);
}

.notification-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: var(--transition);
    flex-shrink: 0;
}

.notification-close:hover {
    background: var(--gray-100);
    color: var(--text-primary);
}

.notification-progress {
    height: 3px;
    background: var(--gray-200);
    overflow: hidden;
}

.notification-progress-bar {
    height: 100%;
    background: var(--primary-color);
    width: 100%;
    transform: translateX(-100%);
}

.notification-progress-active {
    animation: notificationProgress linear forwards;
}

@keyframes notificationProgress {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

/* Специальные стили для уведомлений */
.achievement-notification,
.quest-notification,
.level-notification,
.test-result-notification,
.reminder-notification {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.achievement-notification .achievement-icon,
.quest-notification .quest-icon,
.level-notification .level-icon,
.test-result-notification .test-icon,
.reminder-notification .reminder-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

.achievement-notification .achievement-info,
.quest-notification .quest-info,
.level-notification .level-info,
.test-result-notification .test-info,
.reminder-notification .reminder-info {
    flex: 1;
}

.achievement-title,
.quest-title,
.level-title,
.test-title,
.reminder-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.achievement-name,
.quest-name,
.level-number,
.test-score,
.reminder-message {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.achievement-points,
.quest-reward {
    font-size: 0.75rem;
    color: var(--success-color);
    font-weight: 500;
}
`;

// Добавляем стили в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Создание глобального экземпляра
window.notifications = new NotificationManager();
