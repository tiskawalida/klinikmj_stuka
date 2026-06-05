require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize } = require('./models');
const { setupStockSocket } = require('./socket/stockSocket');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
['uploads', 'uploads/resep', 'uploads/temp'].forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
setupStockSocket(io);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database terhubung.');
    await sequelize.sync({ alter: true });
    console.log('✅ Model tersinkronisasi.');

    server.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📡 Socket.io aktif`);
    });
  } catch (err) {
    console.error('❌ Gagal memulai server:', err);
    process.exit(1);
  }
};

start();
