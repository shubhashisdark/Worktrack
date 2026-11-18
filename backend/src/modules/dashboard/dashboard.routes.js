import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import * as dashboardService from './dashboard.service.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/employee',
  asyncHandler(async (req, res) => {
    const data = await dashboardService.getEmployeeDashboard(req.user, req.employee);
    return sendSuccess(res, { data });
  })
);

router.get(
  '/manager',
  requireRole('manager', 'admin'),
  asyncHandler(async (req, res) => {
    const data = await dashboardService.getManagerDashboard(req.employee);
    return sendSuccess(res, { data });
  })
);

router.get(
  '/admin',
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const data = await dashboardService.getAdminDashboard();
    return sendSuccess(res, { data });
  })
);

export default router;
