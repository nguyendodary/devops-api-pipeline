const { Router } = require('express');
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  uuidParamSchema,
  updateUserSchema,
  paginationSchema,
} = require('../controllers/validators');

const router = Router();

router.use(authenticate);

router.get('/', validate(paginationSchema), userController.getAll);
router.get('/:id', validate(uuidParamSchema), userController.getById);
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(uuidParamSchema),
  validate(updateUserSchema),
  userController.update,
);
router.delete('/:id', authorize('ADMIN'), validate(uuidParamSchema), userController.delete);

module.exports = router;
