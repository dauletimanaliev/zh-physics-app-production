// Service Worker для ҰБТ веб-приложения
const CACHE_NAME = 'ent-app-v1.0.1';
const STATIC_CACHE = 'ent-static-v1.0.1';
const DYNAMIC_CACHE = 'ent-dynamic-v1.0.1';

// Файлы для кэширования
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/data.js',
    '/js/telegram.js',
    '/js/storage.js',
    '/js/notifications.js',
    '/js/components.js',
    '/js/screens.js',
    '/js/app.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://telegram.org/js/telegram-web-app.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Установка');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Кэширование статических файлов');
                return cache.addAll(STATIC_FILES);
            })
            .catch(error => {
                console.error('Service Worker: Ошибка кэширования:', error);
            })
    );
    
    // Принудительно активируем новый Service Worker
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Активация');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Удаляем старые кэши
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Берем контроль над всеми клиентами
    self.clients.claim();
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Игнорируем запросы к Telegram API и другим внешним API
    if (url.origin !== location.origin && 
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('cdnjs.cloudflare.com') &&
        !url.hostname.includes('telegram.org')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(response => {
                // Возвращаем кэшированную версию если есть
                if (response) {
                    console.log('Service Worker: Загрузка из кэша:', request.url);
                    return response;
                }
                
                // Иначе делаем сетевой запрос
                return fetch(request)
                    .then(fetchResponse => {
                        // Проверяем валидность ответа
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }
                        
                        // Клонируем ответ для кэширования
                        const responseToCache = fetchResponse.clone();
                        
                        // Кэшируем динамические ресурсы
                        if (shouldCache(request)) {
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    console.log('Service Worker: Кэширование динамического ресурса:', request.url);
                                    cache.put(request, responseToCache);
                                });
                        }
                        
                        return fetchResponse;
                    })
                    .catch(error => {
                        console.log('Service Worker: Сетевой запрос не удался:', request.url);
                        
                        // Возвращаем оффлайн страницу для HTML запросов
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        // Возвращаем пустой ответ для других ресурсов
                        return new Response('', {
                            status: 408,
                            statusText: 'Нет подключения к интернету'
                        });
                    });
            })
    );
});

// Проверка, нужно ли кэшировать запрос
function shouldCache(request) {
    const url = new URL(request.url);
    
    // Кэшируем только GET запросы
    if (request.method !== 'GET') {
        return false;
    }
    
    // Не кэшируем API запросы
    if (url.pathname.startsWith('/api/')) {
        return false;
    }
    
    // Кэшируем статические ресурсы
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    const hasStaticExtension = staticExtensions.some(ext => url.pathname.endsWith(ext));
    
    if (hasStaticExtension) {
        return true;
    }
    
    // Кэшируем HTML страницы
    if (request.destination === 'document') {
        return true;
    }
    
    return false;
}

// Обработка сообщений от клиента
self.addEventListener('message', event => {
    const { data } = event;
    
    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'UPDATE_CACHE':
            updateCache().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

// Очистка всех кэшей
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker: Все кэши очищены');
}

// Обновление кэша
async function updateCache() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_FILES);
        console.log('Service Worker: Кэш обновлен');
    } catch (error) {
        console.error('Service Worker: Ошибка обновления кэша:', error);
    }
}

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: data.data,
        actions: [
            {
                action: 'open',
                title: 'Ашу',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Жабу',
                icon: '/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Если приложение уже открыто, фокусируемся на нем
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Иначе открываем новое окно
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Обработка синхронизации в фоне (для будущего использования)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Фоновая синхронизация
async function doBackgroundSync() {
    try {
        // Здесь можно добавить логику синхронизации данных
        console.log('Service Worker: Фоновая синхронизация выполнена');
    } catch (error) {
        console.error('Service Worker: Ошибка фоновой синхронизации:', error);
    }
}

// Логирование ошибок
self.addEventListener('error', event => {
    console.error('Service Worker: Ошибка:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Необработанное отклонение промиса:', event.reason);
});

console.log('Service Worker: Скрипт загружен');
