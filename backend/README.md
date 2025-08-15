# Physics Mini App Backend

Масштабируемый backend API для Physics Mini App с PostgreSQL базой данных.

## 🚀 Возможности

- **Полноценная база данных PostgreSQL** для хранения пользователей, материалов, тестов
- **RESTful API** для всех операций CRUD
- **Автоматическая синхронизация** материалов между устройствами
- **Leaderboard** с реальными данными
- **Система тестирования** с результатами
- **Прогресс пользователей** и достижения
- **Масштабируемость** под тысячи пользователей

## 📊 Структура базы данных

- `users` - пользователи (студенты, учителя, админы)
- `materials` - учебные материалы
- `tests` - тесты и вопросы
- `user_progress` - прогресс пользователей
- `test_results` - результаты тестов
- `user_achievements` - достижения
- `user_bookmarks` - закладки материалов

## 🛠️ Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных
```bash
# Создать базу данных PostgreSQL
createdb physics_app

# Применить схему
npm run setup-db
```

### 3. Настройка окружения
```bash
cp .env.example .env
# Отредактировать .env с вашими настройками
```

### 4. Запуск сервера
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Пользователи
- `POST /api/users` - Создать пользователя
- `GET /api/users/:telegram_id` - Получить пользователя
- `PUT /api/users/:telegram_id` - Обновить пользователя
- `DELETE /api/users/:telegram_id` - Удалить пользователя
- `GET /api/users` - Получить всех пользователей

### Материалы
- `POST /api/materials` - Создать материал
- `GET /api/materials` - Получить опубликованные материалы
- `GET /api/materials/teacher/:teacher_id` - Получить материалы учителя
- `PUT /api/materials/:id` - Обновить материал
- `DELETE /api/materials/:id` - Удалить материал

### Leaderboard
- `GET /api/leaderboard` - Получить рейтинг пользователей

### Прогресс
- `GET /api/users/:user_id/progress` - Получить прогресс пользователя
- `PUT /api/users/:user_id/progress` - Обновить прогресс пользователя

## 🌐 Деплой

### Railway
```bash
railway login
railway link
railway up
```

### Render
1. Подключить GitHub репозиторий
2. Выбрать `backend` как root directory
3. Настроить переменные окружения
4. Деплой автоматически

### Docker
```bash
docker build -t physics-backend .
docker run -p 5000:5000 physics-backend
```

## 🔧 Переменные окружения

- `DATABASE_URL` - URL PostgreSQL базы данных
- `PORT` - Порт сервера (по умолчанию 5000)
- `NODE_ENV` - Окружение (development/production)
- `CORS_ORIGINS` - Разрешенные домены для CORS

## 📈 Масштабирование

Backend готов к масштабированию:
- Индексы для быстрых запросов
- Пагинация для больших списков
- Кеширование (Redis готов к подключению)
- Горизонтальное масштабирование

## 🔒 Безопасность

- CORS защита
- Валидация входных данных
- Защита от SQL инъекций (параметризованные запросы)
- Готовность к JWT аутентификации

## 🚀 Готово к продакшену!

Backend полностью готов к деплою и может обслуживать тысячи пользователей одновременно.
