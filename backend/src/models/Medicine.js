const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medicine = sequelize.define('Medicine', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  genericName: { type: DataTypes.STRING, allowNull: true },
  category: {
    type: DataTypes.ENUM('Obat Resep', 'Obat Bebas', 'Obat Bebas Terbatas', 'Suplemen', 'Alat Kesehatan'),
    allowNull: false,
    defaultValue: 'Obat Bebas',
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  composition: { type: DataTypes.TEXT, allowNull: true },
  dosage: { type: DataTypes.STRING, allowNull: true },
  sideEffects: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  minStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'tablet' },
  expiredDate: { type: DataTypes.DATEONLY, allowNull: true },
  batchNumber: { type: DataTypes.STRING, allowNull: true },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
  supplierId: { type: DataTypes.INTEGER, allowNull: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'medicines' });

module.exports = Medicine;
