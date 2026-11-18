import { Router } from 'express';
import * as leaveController from './leave.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createLeaveSchema, approveLeaveSchema, rejectLeaveSchema } from './leave.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createLeaveSchema), leaveController.create);
router.get('/', leaveController.list);
router.patch('/:id/approve', requireRole('manager', 'admin'), validate(approveLeaveSchema), leaveController.approve);
router.patch('/:id/reject', requireRole('manager', 'admin'), validate(rejectLeaveSchema), leaveController.reject);
router.patch('/:id/cancel', leaveController.cancel);

export default router;
