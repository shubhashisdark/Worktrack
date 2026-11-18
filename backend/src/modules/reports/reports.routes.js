import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { generateReports } from './reports.service.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requireRole('manager', 'admin'),
  asyncHandler(async (req, res) => {
    const data = await generateReports({
      query: req.query,
      actorUser: req.user,
      actorEmployee: req.employee,
    });
    return sendSuccess(res, { data });
  })
);

export default router;
