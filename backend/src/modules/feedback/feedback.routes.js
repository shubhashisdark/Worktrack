import { Router } from 'express';
import * as feedbackController from './feedback.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createFeedbackSchema } from './feedback.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', feedbackController.list);
router.post('/', requireRole('manager', 'admin'), validate(createFeedbackSchema), feedbackController.create);

export default router;
