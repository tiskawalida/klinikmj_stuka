const router = require('express').Router();
const multer = require('multer');
const { checkout, getAll, getById, updateStatus } = require('../controllers/transactions.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const resepStorage = multer.diskStorage({
  destination: 'uploads/resep/',
  filename: (req, file, cb) => cb(null, `resep-${Date.now()}-${file.originalname}`),
});
const uploadResep = multer({ storage: resepStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/checkout', verifyToken, roleGuard('Kasir', 'Pasien'), uploadResep.single('resep'), (req, res, next) => {
  if (req.file) req.body.resepImageUrl = `/uploads/resep/${req.file.filename}`;
  next();
}, checkout);

router.get('/', verifyToken, roleGuard('Admin', 'Kasir', 'Pasien'), getAll);
router.get('/:id', verifyToken, roleGuard('Admin', 'Kasir', 'Pasien'), getById);
router.patch('/:id/status', verifyToken, roleGuard('Admin', 'Kasir'), updateStatus);

module.exports = router;
