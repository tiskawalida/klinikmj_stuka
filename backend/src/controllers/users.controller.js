const { User } = require('../models');
const bcrypt = require('bcryptjs');

// GET /api/users
const getAll = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// GET /api/users/:id
const getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// POST /api/users
const create = async (req, res, next) => {
  try {
    const { username, email, password, role, fullName, phone, address } = req.body;
    if (!username || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'Username, email, password, dan role wajib diisi.' });
    const user = await User.create({ username, email, password, role, fullName, phone, address });
    const { password: _, ...userObj } = user.toJSON();
    res.status(201).json({ success: true, message: 'Pengguna berhasil ditambahkan.', data: userObj });
  } catch (err) { next(err); }
};

// PUT /api/users/:id
const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    const { password, ...rest } = req.body;
    if (password) rest.password = password;
    await user.update(rest);
    const { password: _, ...userObj } = user.toJSON();
    res.json({ success: true, message: 'Pengguna berhasil diperbarui.', data: userObj });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id
const remove = async (req, res, next) => {
  try {
    if (req.params.id == req.user.id)
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri.' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    await user.update({ isActive: false });
    res.json({ success: true, message: 'Pengguna berhasil dinonaktifkan.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
