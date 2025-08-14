// Модуль интеграции с Telegram Web App
class TelegramWebApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isInTelegram = !!this.tg;
        this.user = null;
        this.theme = 'light';
        
        this.init();
    }
    
    init() {
        if (!this.isInTelegram) {
            console.log('Приложение запущено вне Telegram');
            return;
        }
        
        try {
            // Инициализация Telegram Web App
            this.tg.ready();
            this.tg.expand();
        } catch (error) {
            console.error('Ошибка инициализации Telegram Web App:', error);
            this.isInTelegram = false;
            return;
        }
        
        // Получение данных пользователя
        this.user = this.tg.initDataUnsafe?.user;
        
        // Настройка темы
        this.setupTheme();
        
        // Настройка кнопок
        this.setupButtons();
        
        // Обработчики событий
        this.setupEventHandlers();
        
        console.log('Telegram Web App инициализирован', {
            user: this.user,
            theme: this.theme
        });
    }
    
    setupTheme() {
        if (!this.isInTelegram) return;
        
        this.theme = this.tg.colorScheme || 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Применение цветов темы Telegram
        if (this.tg.themeParams) {
            const root = document.documentElement;
            const theme = this.tg.themeParams;
            
            if (theme.bg_color) {
                root.style.setProperty('--bg-primary', theme.bg_color);
            }
            if (theme.secondary_bg_color) {
                root.style.setProperty('--bg-secondary', theme.secondary_bg_color);
            }
            if (theme.text_color) {
                root.style.setProperty('--text-primary', theme.text_color);
            }
            if (theme.hint_color) {
                root.style.setProperty('--text-secondary', theme.hint_color);
            }
            if (theme.button_color) {
                root.style.setProperty('--primary-color', theme.button_color);
            }
            if (theme.button_text_color) {
                root.style.setProperty('--button-text-color', theme.button_text_color);
            }
        }
    }
    
    setupButtons() {
        if (!this.isInTelegram) return;
        
        // Главная кнопка
        this.tg.MainButton.setText('Басты мәзірге оралу');
        this.tg.MainButton.color = '#2563eb';
        this.tg.MainButton.textColor = '#ffffff';
        
        // Кнопка назад
        this.tg.BackButton.show();
    }
    
    setupEventHandlers() {
        if (!this.isInTelegram) return;
        
        // Обработчик главной кнопки
        this.tg.onEvent('mainButtonClicked', () => {
            this.onMainButtonClick();
        });
        
        // Обработчик кнопки назад
        this.tg.onEvent('backButtonClicked', () => {
            this.onBackButtonClick();
        });
        
        // Обработчик изменения темы
        this.tg.onEvent('themeChanged', () => {
            this.setupTheme();
        });
        
        // Обработчик изменения viewport
        this.tg.onEvent('viewportChanged', () => {
            this.onViewportChanged();
        });
    }
    
    onMainButtonClick() {
        // Возврат к главному экрану
        if (window.app) {
            window.app.showScreen('main');
        }
    }
    
    onBackButtonClick() {
        // Обработка кнопки назад
        if (window.app) {
            window.app.goBack();
        }
    }
    
    onViewportChanged() {
        // Обработка изменения размера viewport
        console.log('Viewport изменен:', {
            height: this.tg.viewportHeight,
            stableHeight: this.tg.viewportStableHeight
        });
    }
    
    // Управление главной кнопкой
    showMainButton(text = 'Басты мәзірге оралу', callback = null) {
        if (!this.isInTelegram) return;
        
        this.tg.MainButton.setText(text);
        this.tg.MainButton.show();
        
        if (callback) {
            this.mainButtonCallback = callback;
        }
    }
    
    hideMainButton() {
        if (!this.isInTelegram) return;
        this.tg.MainButton.hide();
    }
    
    // Управление кнопкой назад
    showBackButton() {
        if (!this.isInTelegram) return;
        this.tg.BackButton.show();
    }
    
    hideBackButton() {
        if (!this.isInTelegram) return;
        this.tg.BackButton.hide();
    }
    
    // Отправка данных в бот
    sendData(data) {
        if (!this.isInTelegram) {
            console.log('Данные для отправки в бот:', data);
            return;
        }
        
        this.tg.sendData(JSON.stringify(data));
    }
    
    // Показ всплывающего окна
    showAlert(message) {
        if (!this.isInTelegram) {
            alert(message);
            return;
        }
        
        this.tg.showAlert(message);
    }
    
    // Показ подтверждения
    showConfirm(message, callback) {
        if (!this.isInTelegram) {
            const result = confirm(message);
            if (callback) callback(result);
            return;
        }
        
        this.tg.showConfirm(message, callback);
    }
    
    // Показ всплывающего окна с кнопками
    showPopup(params) {
        if (!this.isInTelegram) {
            alert(params.message);
            return;
        }
        
        this.tg.showPopup(params);
    }
    
    // Вибрация
    hapticFeedback(type = 'impact', style = 'medium') {
        if (!this.isInTelegram) return;
        
        if (type === 'impact') {
            this.tg.HapticFeedback.impactOccurred(style);
        } else if (type === 'notification') {
            this.tg.HapticFeedback.notificationOccurred(style);
        } else if (type === 'selection') {
            this.tg.HapticFeedback.selectionChanged();
        }
    }
    
    // Закрытие приложения
    close() {
        if (!this.isInTelegram) {
            window.close();
            return;
        }
        
        this.tg.close();
    }
    
    // Получение данных пользователя
    getUserData() {
        if (!this.isInTelegram || !this.user) {
            return {
                id: 'demo_user',
                // Пусть имя подставится из приложения (Қолданушы)
                first_name: '',
                last_name: '',
                username: '',
                language_code: 'kk'
            };
        }
        
        return this.user;
    }

    // Удобные хелперы для ID
    getUserId() {
        const data = this.getUserData();
        return data?.id || null;
    }
    getChatId() {
        // В WebApp chat может быть доступен в initDataUnsafe.chat
        const chat = this.tg?.initDataUnsafe?.chat;
        return chat?.id || null;
    }
    
    // Получение языка пользователя
    getUserLanguage() {
        const userData = this.getUserData();
        return userData.language_code || 'kk';
    }
    
    // Проверка, запущено ли в Telegram
    isRunningInTelegram() {
        return this.isInTelegram;
    }
    
    // Получение информации о платформе
    getPlatform() {
        if (!this.isInTelegram) return 'web';
        return this.tg.platform;
    }
    
    // Получение версии Telegram
    getVersion() {
        if (!this.isInTelegram) return '0.0';
        return this.tg.version;
    }
    
    // Настройка заголовка
    setHeaderColor(color) {
        if (!this.isInTelegram) return;
        this.tg.setHeaderColor(color);
    }
    
    // Настройка цвета фона
    setBackgroundColor(color) {
        if (!this.isInTelegram) return;
        this.tg.setBackgroundColor(color);
    }
}

// Создание глобального экземпляра
window.telegramApp = new TelegramWebApp();
