const { ErrorLog } = require('../models');

const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const severity = statusCode >= 500 ? 'critical' : statusCode >= 400 ? 'warning' : 'info';

  try {
    await ErrorLog.create({
      severity,
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      method: req.method,
      userId: req.user?.id || null,
    });
  } catch (_) {
    // Silent fail
  }

  console.error(`[${severity.toUpperCase()}] ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
