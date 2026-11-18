import { Notification } from './notification.model.js';
import { Employee } from '../employees/employee.model.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';

export async function createNotification({
  recipientUserId,
  recipientEmployeeId,
  type = 'system',
  title,
  message,
  entityType = null,
  entityId = null,
  actionUrl = '',
}) {
  let userId = recipientUserId;
  if (!userId && recipientEmployeeId) {
    const emp = await Employee.findById(recipientEmployeeId).select('userId').lean();
    userId = emp?.userId;
  }
  if (!userId) return null;

  return Notification.create({
    recipientUserId: userId,
    type,
    title,
    message,
    entityType,
    entityId,
    actionUrl,
  });
}

export async function listNotifications(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = { recipientUserId: userId };
  if (query.unreadOnly === 'true' || query.isRead === 'false') {
    filter.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientUserId: userId, isRead: false }),
  ]);

  return {
    items,
    unreadCount,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientUserId: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    throw AppError.notFound('Notification not found');
  }
  return notification;
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany(
    { recipientUserId: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { markedAll: true };
}
