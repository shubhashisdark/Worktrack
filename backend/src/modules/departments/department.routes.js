import { Router } from 'express';
import * as departmentController from './department.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from './department.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', departmentController.list);
router.get('/:id', requireRole('manager', 'admin'), departmentController.getById);
router.post('/', requireRole('admin'), validate(createDepartmentSchema), departmentController.create);
router.patch('/:id', requireRole('admin'), validate(updateDepartmentSchema), departmentController.update);
router.delete('/:id', requireRole('admin'), departmentController.deactivate);

export default router;
