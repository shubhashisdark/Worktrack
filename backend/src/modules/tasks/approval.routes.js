import { Router } from 'express';
import * as taskController from './task.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { reviewApprovalSchema, requestRevisionSchema } from './task.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', taskController.listApprovals);
router.get('/:id', taskController.getApproval);
router.post('/:id/approve', requireRole('manager', 'admin'), validate(reviewApprovalSchema), taskController.approveSubmission);
router.post('/:id/request-revision', requireRole('manager', 'admin'), validate(requestRevisionSchema), taskController.requestRevision);

export default router;
