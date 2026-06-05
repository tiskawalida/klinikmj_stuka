const { AuditLog } = require('../models');

const auditLogger = async (req, res, next) => {
  const originalEnd = res.end.bind(res);
  res.end = async function (...args) {
    try {
      await AuditLog.create({
        userId: req.user?.id || null,
        username: req.user?.username || 'anonymous',
        role: req.user?.role || null,
        action: `${req.method} ${req.originalUrl}`,
        target: req.originalUrl,
        detail: JSON.stringify({ body: req.body, params: req.params }),
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
      });
    } catch (_) {
      // Silent fail — jangan sampai audit logger mengganggu response
    }
    originalEnd(...args);
  };
  next();
};

module.exports = { auditLogger };
