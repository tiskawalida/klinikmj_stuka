/**
 * roleGuard - Middleware factory untuk proteksi rute berbasis peran
 * @param  {...string} roles - Daftar peran yang diizinkan
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya ${roles.join(', ')} yang dapat mengakses fitur ini.`,
      });
    }
    next();
  };
};

module.exports = { roleGuard };
