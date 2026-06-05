const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionItem = sequelize.define('TransactionItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  transactionId: { type: DataTypes.INTEGER, allowNull: false },
  medicineId: { type: DataTypes.INTEGER, allowNull: false },
  medicineName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  pricePerUnit: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, { tableName: 'transaction_items' });

module.exports = TransactionItem;
