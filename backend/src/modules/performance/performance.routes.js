import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import * as performanceService from './performance.service.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const data = await performanceService.getMyPerformance(req.employee);
    return sendSuccess(res, { data });
  })
);

router.get(
  '/team',
  requireRole('manager', 'admin'),
  asyncHandler(async (req, res) => {
    const data = await performanceService.getTeamPerformance({
      query: req.query,
      actorUser: req.user,
      actorEmployee: req.employee,
    });
    return sendSuccess(res, { data });
  })
);

router.get(
  '/employee/:id',
  requireRole('manager', 'admin'),
  asyncHandler(async (req, res) => {
    const data = await performanceService.getEmployeePerformance({
      employeeId: req.params.id,
      actorUser: req.user,
      actorEmployee: req.employee,
    });
    return sendSuccess(res, { data });
  })
);

export default router;
