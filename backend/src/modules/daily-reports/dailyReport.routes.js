import { Router } from 'express';
import * as dailyReportController from './dailyReport.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createDailyReportSchema, managerNoteSchema } from './dailyReport.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createDailyReportSchema), dailyReportController.create);
router.get('/', dailyReportController.list);
router.get('/:id', dailyReportController.getById);
router.patch('/:id/note', requireRole('manager', 'admin'), validate(managerNoteSchema), dailyReportController.addNote);

export default router;
