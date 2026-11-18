import { Router } from 'express';
import * as taskController from './task.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateProgressSchema,
  addCommentSchema,
  submitDeliverableSchema,
} from './task.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', taskController.list);
router.post(
  '/',
  requireRole('manager', 'admin'),
  uploadMiddleware.array('attachments', 5),
  (req, _res, next) => {
    if (typeof req.body.assigneeIds === 'string') {
      try { req.body.assigneeIds = JSON.parse(req.body.assigneeIds); } catch { req.body.assigneeIds = []; }
    }
    if (typeof req.body.tags === 'string') {
      try { req.body.tags = JSON.parse(req.body.tags); } catch { req.body.tags = []; }
    }
    next();
  },
  validate(createTaskSchema),
  taskController.create
);
router.get('/:id', taskController.getById);
router.patch(
  '/:id',
  requireRole('manager', 'admin'),
  uploadMiddleware.array('attachments', 5),
  validate(updateTaskSchema),
  taskController.update
);
router.delete('/:id', requireRole('manager', 'admin'), taskController.archive);
router.post('/:id/assign', requireRole('manager', 'admin'), validate(assignTaskSchema), taskController.assign);
router.patch('/:id/progress', validate(updateProgressSchema), taskController.updateProgress);
router.post('/:id/comments', validate(addCommentSchema), taskController.addComment);
router.post(
  '/:id/deliverables',
  uploadMiddleware.array('files', 5),
  validate(submitDeliverableSchema),
  taskController.submitDeliverable
);
router.get('/:id/deliverables', taskController.listDeliverables);

export default router;
