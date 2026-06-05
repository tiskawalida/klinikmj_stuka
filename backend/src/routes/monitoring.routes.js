const router = require('express').Router();
const { getResources, getErrorLogs, resolveError, getAuditLogs } = require('../controllers/monitoring.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(verifyToken, roleGuard('Admin'));
router.get('/resources', getResources);
router.get('/error-logs', getErrorLogs);
router.patch('/error-logs/:id/resolve', resolveError);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
