import { Router } from 'express';
import * as attendanceController from './attendance.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { checkInSchema, checkOutSchema, adjustAttendanceSchema } from './attendance.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);
router.get('/', attendanceController.list);
router.get('/history', attendanceController.history);
router.patch('/:id', requireRole('manager', 'admin'), validate(adjustAttendanceSchema), attendanceController.adjust);

export default router;
