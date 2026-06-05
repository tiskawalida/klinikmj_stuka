const { Medicine } = require('../models');
const { Op } = require('sequelize');

const setupStockSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Cek stok & expiry setiap 60 detik (real-time monitoring)
  setInterval(async () => {
    try {
      const lowStock = await Medicine.findAll({
        where: { isActive: true, stock: { [Op.lte]: 10 } },
        attributes: ['id', 'name', 'stock', 'minStock'],
      });
      if (lowStock.length > 0) {
        io.emit('low-stock-alert', {
          type: 'warning',
          message: `${lowStock.length} obat stok kritis!`,
          items: lowStock,
          timestamp: new Date(),
        });
      }

      // Cek kadaluarsa 30 hari ke depan
      const today = new Date();
      const target = new Date();
      target.setDate(today.getDate() + 30);
      const expiring = await Medicine.findAll({
        where: {
          isActive: true,
          expiredDate: { [Op.between]: [today.toISOString().split('T')[0], target.toISOString().split('T')[0]] },
        },
        attributes: ['id', 'name', 'expiredDate'],
      });
      if (expiring.length > 0) {
        io.emit('expiry-alert', {
          type: 'danger',
          message: `${expiring.length} obat mendekati kadaluarsa dalam 30 hari!`,
          items: expiring,
          timestamp: new Date(),
        });
      }
    } catch (_) {}
  }, 60000);
};

module.exports = { setupStockSocket };
