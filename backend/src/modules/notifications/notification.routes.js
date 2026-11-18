import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as notificationService from './notification.service.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await notificationService.listNotifications(req.user._id, req.query);
    return sendSuccess(res, {
      data: { items: result.items, unreadCount: result.unreadCount },
      meta: result.meta,
    });
  })
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllNotificationsRead(req.user._id);
    return sendSuccess(res, { message: 'All notifications marked as read' });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const item = await notificationService.markNotificationRead(req.user._id, req.params.id);
    return sendSuccess(res, { data: item, message: 'Notification marked as read' });
  })
);

export default router;
