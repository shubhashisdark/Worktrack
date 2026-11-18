import { Router } from 'express';
import * as employeeController from './employee.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema, bulkStatusSchema } from './employee.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole('manager', 'admin'), employeeController.list);
router.post('/', requireRole('admin'), validate(createEmployeeSchema), employeeController.create);
router.patch('/bulk-status', requireRole('admin'), validate(bulkStatusSchema), employeeController.bulkStatus);
router.get('/:id', employeeController.getById);
router.patch('/:id', validate(updateEmployeeSchema), employeeController.update);
router.post('/:id/avatar', uploadMiddleware.single('avatar'), employeeController.uploadAvatar);
router.delete('/:id', requireRole('admin'), employeeController.deactivate);

export default router;
