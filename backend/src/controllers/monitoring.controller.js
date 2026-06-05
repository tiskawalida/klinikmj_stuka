const os = require('os');
const { AuditLog, ErrorLog, User, Transaction, Medicine, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/monitoring/resources
const getResources = async (req, res, next) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return (((total - idle) / total) * 100).toFixed(1);
    });

    // Quick DB stats
    const [userCount, medCount, trxCount] = await Promise.all([
      User.count(), Medicine.count({ where: { isActive: true } }),
      Transaction.count({ where: { createdAt: { [Op.gte]: new Date(new Date() - 86400000) } } }),
    ]);

    res.json({
      success: true, data: {
        server: { platform: os.platform(), hostname: os.hostname(), uptime: Math.floor(os.uptime()) },
        memory: { total: totalMem, free: freeMem, used: usedMem, percentage: ((usedMem / totalMem) * 100).toFixed(1) },
        cpu: { count: cpus.length, model: cpus[0]?.model, avgUsage: (cpuUsage.reduce((a, b) => a + parseFloat(b), 0) / cpuUsage.length).toFixed(1) },
        process: { pid: process.pid, memoryUsage: process.memoryUsage(), uptime: Math.floor(process.uptime()) },
        stats: { userCount, medCount, trxToday: trxCount },
      },
    });
  } catch (err) { next(err); }
};

// GET /api/monitoring/error-logs
const getErrorLogs = async (req, res, next) => {
  try {
    const { severity, resolved, page = 1, limit = 20 } = req.query;
    const where = {};
    if (severity) where.severity = severity;
    if (resolved !== undefined) where.resolved = resolved === 'true';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await ErrorLog.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset });
    res.json({ success: true, data: rows, total: count });
  } catch (err) { next(err); }
};

// PATCH /api/monitoring/error-logs/:id/resolve
const resolveError = async (req, res, next) => {
  try {
    const log = await ErrorLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log tidak ditemukan.' });
    await log.update({ resolved: true, resolvedAt: new Date() });
    res.json({ success: true, message: 'Error log ditandai selesai.' });
  } catch (err) { next(err); }
};

// GET /api/monitoring/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: parseInt(limit), offset });
    res.json({ success: true, data: rows, total: count });
  } catch (err) { next(err); }
};

module.exports = { getResources, getErrorLogs, resolveError, getAuditLogs };
