const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getAll, getById, create, update, remove, batchImport, getLowStock, getExpiring } = require('../controllers/medicines.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Multer config — image upload
const imageStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `med-${Date.now()}${path.extname(file.originalname)}`),
});
const csvStorage = multer.diskStorage({
  destination: 'uploads/temp/',
  filename: (req, file, cb) => cb(null, `import-${Date.now()}.csv`),
});
const uploadImage = multer({ storage: imageStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCsv = multer({ storage: csvStorage });

router.get('/', verifyToken, getAll);
router.get('/low-stock', verifyToken, roleGuard('Admin', 'Apoteker'), getLowStock);
router.get('/expiring', verifyToken, roleGuard('Admin', 'Apoteker'), getExpiring);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, roleGuard('Admin', 'Apoteker'), uploadImage.single('image'), create);
router.put('/:id', verifyToken, roleGuard('Admin', 'Apoteker'), uploadImage.single('image'), update);
router.delete('/:id', verifyToken, roleGuard('Admin', 'Apoteker'), remove);
router.post('/batch-import', verifyToken, roleGuard('Admin', 'Apoteker'), uploadCsv.single('file'), batchImport);

module.exports = router;
