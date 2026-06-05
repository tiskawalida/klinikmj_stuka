const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
  paymentMethod: {
    type: DataTypes.ENUM('Tunai', 'Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit'),
    allowNull: false,
    defaultValue: 'Tunai',
  },
  amountPaid: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  changeAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('Pending', 'Dikonfirmasi', 'Diproses', 'Siap Diambil', 'Selesai', 'Dibatalkan'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  resepImageUrl: { type: DataTypes.STRING, allowNull: true },
  resepVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  processedBy: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'transactions' });

module.exports = Transaction;
