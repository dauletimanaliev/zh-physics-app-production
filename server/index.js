const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const materialsRoutes = require('./routes/materials');
const messagesRoutes = require('./routes/messages');
const scheduleRoutes = require('./routes/schedule');
const analyticsRoutes = require('./routes/analytics');

const { initDatabase } = require('./models/database');
const { authenticateToken } = require('./middleware/auth');
const socketHandler = require('./utils/socketHandler');
const { initializeAdmin } = require('./utils/initAdmin');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3008',
    'https://physics-mini-app-v3.windsurf.build',
    'https://physics-mini-app-final.windsurf.build',
    /\.windsurf\.build$/,
    /\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/messages', authenticateToken, messagesRoutes);
app.use('/api/schedule', authenticateToken, scheduleRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO handling
socketHandler(io);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ База данных инициализирована');
    
    // Инициализируем администратора
    await initializeAdmin();
    
    server.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 Telegram Mini App: http://localhost:${PORT}`);
      console.log(`👤 Админ ID: 1350637421`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
