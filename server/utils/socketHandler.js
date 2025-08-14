const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ent_app_secret_key_2024';

function socketHandler(io) {
  // Middleware для аутентификации WebSocket соединений
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Токен не предоставлен'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.get(
        'SELECT * FROM users WHERE telegram_id = ?',
        [decoded.telegram_id]
      );

      if (!user) {
        return next(new Error('Пользователь не найден'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Недействительный токен'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Пользователь подключен: ${socket.user.name} (${socket.user.role})`);

    // Присоединяем к комнате по роли
    socket.join(socket.user.role);
    
    // Присоединяем к комнате класса (для учеников)
    if (socket.user.class) {
      socket.join(`class_${socket.user.class}`);
    }

    // Обработка отправки сообщений в реальном времени
    socket.on('send_message', async (data) => {
      try {
        const { recipient_id, content, type = 'text' } = data;

        // Сохраняем сообщение в базу
        const result = await db.run(`
          INSERT INTO messages (sender_id, recipient_id, content, type)
          VALUES (?, ?, ?, ?)
        `, [socket.user.id, recipient_id, content, type]);

        // Отправляем получателю
        const recipientSockets = await io.in(`user_${recipient_id}`).fetchSockets();
        if (recipientSockets.length > 0) {
          io.to(`user_${recipient_id}`).emit('new_message', {
            id: result.id,
            sender_id: socket.user.id,
            sender_name: socket.user.name,
            sender_surname: socket.user.surname,
            content,
            type,
            sent_at: new Date().toISOString()
          });
        }

        socket.emit('message_sent', { success: true, messageId: result.id });

      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        socket.emit('message_error', { error: 'Ошибка отправки сообщения' });
      }
    });

    // Обработка массовых уведомлений (только для учителей)
    socket.on('broadcast_message', async (data) => {
      try {
        if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Недостаточно прав' });
        }

        const { content, target_group, type = 'text' } = data;

        let targetRoom = 'student';
        if (target_group && target_group !== 'all') {
          targetRoom = `class_${target_group}`;
        }

        // Отправляем уведомление всем в целевой группе
        io.to(targetRoom).emit('broadcast_notification', {
          sender_name: socket.user.name,
          sender_surname: socket.user.surname,
          content,
          type,
          sent_at: new Date().toISOString()
        });

        socket.emit('broadcast_sent', { success: true });

      } catch (error) {
        console.error('Ошибка массовой рассылки:', error);
        socket.emit('broadcast_error', { error: 'Ошибка массовой рассылки' });
      }
    });

    // Обновление прогресса в реальном времени
    socket.on('progress_update', async (data) => {
      try {
        const { material_id, progress_percentage } = data;

        // Уведомляем учителей об обновлении прогресса
        io.to('teacher').emit('student_progress_update', {
          student_id: socket.user.id,
          student_name: `${socket.user.name} ${socket.user.surname}`,
          material_id,
          progress_percentage,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Ошибка обновления прогресса:', error);
      }
    });

    // Обновление материалов в реальном времени
    socket.on('material_created', async (data) => {
      try {
        if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Недостаточно прав для создания материалов' });
        }

        const { material } = data;
        console.log('📡 Broadcasting new material to all students:', material.title);

        // Отправляем новый материал всем ученикам
        io.to('student').emit('new_material', {
          material,
          teacher_name: `${socket.user.name} ${socket.user.surname}`,
          timestamp: new Date().toISOString()
        });

        // Также отправляем другим учителям
        socket.broadcast.to('teacher').emit('material_updated', {
          material,
          action: 'created',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Ошибка трансляции нового материала:', error);
      }
    });

    socket.on('material_updated', async (data) => {
      try {
        if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Недостаточно прав для обновления материалов' });
        }

        const { material } = data;
        console.log('📡 Broadcasting updated material to all students:', material.title);

        // Отправляем обновленный материал всем ученикам
        io.to('student').emit('material_updated', {
          material,
          teacher_name: `${socket.user.name} ${socket.user.surname}`,
          timestamp: new Date().toISOString()
        });

        // Также отправляем другим учителям
        socket.broadcast.to('teacher').emit('material_updated', {
          material,
          action: 'updated',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Ошибка трансляции обновленного материала:', error);
      }
    });

    socket.on('material_deleted', async (data) => {
      try {
        if (socket.user.role !== 'teacher' && socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Недостаточно прав для удаления материалов' });
        }

        const { materialId, materialTitle } = data;
        console.log('📡 Broadcasting material deletion to all students:', materialTitle);

        // Уведомляем всех учеников об удалении материала
        io.to('student').emit('material_deleted', {
          materialId,
          materialTitle,
          teacher_name: `${socket.user.name} ${socket.user.surname}`,
          timestamp: new Date().toISOString()
        });

        // Также отправляем другим учителям
        socket.broadcast.to('teacher').emit('material_updated', {
          materialId,
          action: 'deleted',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Ошибка трансляции удаления материала:', error);
      }
    });

    // Присоединение к персональной комнате
    socket.join(`user_${socket.user.id}`);

    // Обработка отключения
    socket.on('disconnect', () => {
      console.log(`Пользователь отключен: ${socket.user.name}`);
    });

    // Отправка уведомления о подключении
    socket.emit('connected', {
      message: 'Подключение установлено',
      user: {
        id: socket.user.id,
        name: socket.user.name,
        role: socket.user.role
      }
    });
  });

  // Функция для отправки системных уведомлений
  io.sendSystemNotification = async (targetRole, message) => {
    io.to(targetRole).emit('system_notification', {
      message,
      timestamp: new Date().toISOString()
    });
  };

  // Функция для отправки уведомлений о днях рождения
  io.sendBirthdayNotification = async (userId, message) => {
    io.to(`user_${userId}`).emit('birthday_notification', {
      message,
      timestamp: new Date().toISOString(),
      special: true
    });
  };

  return io;
}

module.exports = socketHandler;
