const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/users.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(verifyToken, roleGuard('Admin'));
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
