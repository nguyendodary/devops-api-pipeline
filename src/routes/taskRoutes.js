const { Router } = require('express');
const taskController = require('../controllers/taskController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  uuidParamSchema,
  createTaskSchema,
  updateTaskSchema,
  taskFilterSchema,
} = require('../controllers/validators');

const router = Router();

router.use(authenticate);

router.get('/', validate(taskFilterSchema), taskController.getAll);
router.get('/:id', validate(uuidParamSchema), taskController.getById);
router.post('/', validate(createTaskSchema), taskController.create);
router.patch('/:id', validate(uuidParamSchema), validate(updateTaskSchema), taskController.update);
router.delete('/:id', validate(uuidParamSchema), taskController.delete);

module.exports = router;
