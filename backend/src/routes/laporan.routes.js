const router = require('express').Router();
const { getPenjualan, getStokKritis, getKadaluarsa, exportPdf } = require('../controllers/laporan.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(verifyToken, roleGuard('Admin', 'Apoteker'));
router.get('/penjualan', getPenjualan);
router.get('/stok-kritis', getStokKritis);
router.get('/kadaluarsa', getKadaluarsa);
router.get('/export-pdf', exportPdf);

module.exports = router;
