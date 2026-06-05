const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ErrorLog = sequelize.define('ErrorLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  severity: {
    type: DataTypes.ENUM('critical', 'warning', 'info'),
    allowNull: false,
    defaultValue: 'info',
  },
  message: { type: DataTypes.TEXT, allowNull: false },
  stack: { type: DataTypes.TEXT, allowNull: true },
  route: { type: DataTypes.STRING, allowNull: true },
  method: { type: DataTypes.STRING, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
  resolvedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'error_logs' });

module.exports = ErrorLog;
