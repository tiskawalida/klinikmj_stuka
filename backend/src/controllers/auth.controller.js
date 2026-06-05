const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });

    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan.' });

    await user.update({ lastLogin: new Date() });
    const token = generateToken(user);

    await AuditLog.create({
      userId: user.id, username: user.username, role: user.role,
      action: 'LOGIN', target: '/api/auth/login',
      detail: `Login berhasil dari IP: ${req.ip}`,
      ipAddress: req.ip, userAgent: req.headers['user-agent'], statusCode: 200,
    });

    res.json({
      success: true, message: 'Login berhasil.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, fullName: user.fullName },
    });
  } catch (err) { next(err); }
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, phone, address } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Username, email, dan password wajib diisi.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter.' });

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(409).json({ success: false, message: 'Username sudah digunakan.' });
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    const user = await User.create({ username, email, password, fullName, phone, address, role: 'Pasien' });
    const token = generateToken(user);
    res.status(201).json({
      success: true, message: 'Registrasi berhasil.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, fullName: user.fullName },
    });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  await AuditLog.create({
    userId: req.user?.id, username: req.user?.username, role: req.user?.role,
    action: 'LOGOUT', target: '/api/auth/logout', ipAddress: req.ip, statusCode: 200,
  });
  res.json({ success: true, message: 'Logout berhasil.' });
};

module.exports = { login, register, getMe, logout };
