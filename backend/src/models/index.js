const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Supplier = require('./Supplier');
const Medicine = require('./Medicine');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');
const AuditLog = require('./AuditLog');
const ErrorLog = require('./ErrorLog');

// Associations
Supplier.hasMany(Medicine, { foreignKey: 'supplierId', as: 'medicines' });
Medicine.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transactionId', as: 'items' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

Medicine.hasMany(TransactionItem, { foreignKey: 'medicineId', as: 'transactionItems' });
TransactionItem.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Category,
  Supplier,
  Medicine,
  Transaction,
  TransactionItem,
  AuditLog,
  ErrorLog,
};
