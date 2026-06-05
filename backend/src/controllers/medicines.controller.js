const { Op } = require('sequelize');
const { Medicine, Supplier } = require('../models');
const path = require('path');
const fs = require('fs');

// GET /api/medicines
const getAll = async (req, res, next) => {
  try {
    const { search, category, sortBy = 'name', order = 'ASC', page = 1, limit = 20 } = req.query;
    const where = { isActive: true };
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category) where.category = category;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Medicine.findAndCountAll({
      where, include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
      order: [[sortBy, order]], limit: parseInt(limit), offset,
    });
    res.json({ success: true, data: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

// GET /api/medicines/:id
const getById = async (req, res, next) => {
  try {
    const med = await Medicine.findByPk(req.params.id, {
      include: [{ model: Supplier, as: 'supplier' }],
    });
    if (!med) return res.status(404).json({ success: false, message: 'Obat tidak ditemukan.' });
    res.json({ success: true, data: med });
  } catch (err) { next(err); }
};

// POST /api/medicines
const create = async (req, res, next) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const med = await Medicine.create({ ...req.body, imageUrl });
    res.status(201).json({ success: true, message: 'Obat berhasil ditambahkan.', data: med });
  } catch (err) { next(err); }
};

// PUT /api/medicines/:id
const update = async (req, res, next) => {
  try {
    const med = await Medicine.findByPk(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: 'Obat tidak ditemukan.' });
    if (req.file) req.body.imageUrl = `/uploads/${req.file.filename}`;
    await med.update(req.body);
    res.json({ success: true, message: 'Obat berhasil diperbarui.', data: med });
  } catch (err) { next(err); }
};

// DELETE /api/medicines/:id
const remove = async (req, res, next) => {
  try {
    const med = await Medicine.findByPk(req.params.id);
    if (!med) return res.status(404).json({ success: false, message: 'Obat tidak ditemukan.' });
    await med.update({ isActive: false }); // Soft delete
    res.json({ success: true, message: 'Obat berhasil dihapus.' });
  } catch (err) { next(err); }
};

// POST /api/medicines/batch-import  (CSV parallel processing)
const batchImport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File CSV diperlukan.' });
    const results = [];
    const errors = [];
    const content = fs.readFileSync(req.file.path, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Proses paralel menggunakan Promise.all
    const promises = lines.slice(1).map(async (line, idx) => {
      try {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i]; });
        const med = await Medicine.create({
          name: obj.name || obj.nama,
          category: obj.category || obj.kategori || 'Obat Bebas',
          price: parseFloat(obj.price || obj.harga) || 0,
          stock: parseInt(obj.stock || obj.stok) || 0,
          minStock: parseInt(obj.minStock || obj.stok_minimum) || 10,
          unit: obj.unit || obj.satuan || 'tablet',
          expiredDate: obj.expiredDate || obj.tanggal_kadaluarsa || null,
          description: obj.description || obj.deskripsi || null,
        });
        results.push(med.name);
      } catch (e) {
        errors.push({ row: idx + 2, error: e.message });
      }
    });

    await Promise.all(promises);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: `Import selesai: ${results.length} berhasil, ${errors.length} gagal.`, results, errors });
  } catch (err) { next(err); }
};

// GET /api/medicines/low-stock
const getLowStock = async (req, res, next) => {
  try {
    const { sequelize } = require('../models');
    const meds = await Medicine.findAll({
      where: { isActive: true, [Op.and]: sequelize.literal('stock <= minStock') },
    });
    res.json({ success: true, data: meds });
  } catch (err) { next(err); }
};

// GET /api/medicines/expiring  (FIFO - obat mendekati kadaluarsa)
const getExpiring = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);
    const meds = await Medicine.findAll({
      where: {
        isActive: true,
        expiredDate: { [Op.between]: [today.toISOString().split('T')[0], targetDate.toISOString().split('T')[0]] },
      },
      order: [['expiredDate', 'ASC']],
    });
    res.json({ success: true, data: meds });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, batchImport, getLowStock, getExpiring };
