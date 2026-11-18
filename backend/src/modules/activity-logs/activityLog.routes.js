import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { listActivityLogs } from './activityLog.service.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requireRole('manager', 'admin'),
  asyncHandler(async (req, res) => {
    const { items, meta } = await listActivityLogs({
      query: req.query,
      actorUser: req.user,
      actorEmployee: req.employee,
    });
    return sendSuccess(res, { data: items, meta });
  })
);

export default router;
