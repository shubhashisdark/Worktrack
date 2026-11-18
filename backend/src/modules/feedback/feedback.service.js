import { Feedback } from './feedback.model.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { getManagedEmployeeIds } from '../../utils/scope.js';
import { createNotification } from '../notifications/notification.service.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

export async function createFeedback({ payload, actorUser, actorEmployee, ipAddress }) {
  if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    if (!managedIds.includes(String(payload.employeeId))) {
      throw AppError.forbidden('You can only give feedback to members of your own team');
    }
  }

  const fb = await Feedback.create({
    employeeId: payload.employeeId,
    managerId: actorEmployee._id,
    taskId: payload.taskId || null,
    category: payload.category || 'general',
    rating: payload.rating,
    comment: payload.comment,
  });

  await createNotification({
    recipientEmployeeId: payload.employeeId,
    type: 'feedback_received',
    title: `New feedback from ${actorEmployee.fullName}`,
    message: `${payload.category.replace('_', ' ')} (${payload.rating}/5): ${payload.comment.slice(0, 120)}`,
    entityType: 'feedback',
    entityId: fb._id,
    actionUrl: '/employee/feedback',
  });

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'feedback.create',
    entityType: 'feedback',
    entityId: fb._id,
    summary: `Provided ${payload.rating}/5 feedback (${payload.category})`,
    ipAddress,
  });

  return Feedback.findById(fb._id)
    .populate('employeeId', 'firstName lastName email jobTitle avatarUrl')
    .populate('managerId', 'firstName lastName email jobTitle avatarUrl')
    .populate('taskId', 'taskCode title');
}

export async function listFeedback({ query, actorUser, actorEmployee }) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = {};

  if (actorUser.role === 'employee') {
    filter.employeeId = actorEmployee?._id;
  } else if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    if (query.employeeId) {
      if (!managedIds.includes(String(query.employeeId))) {
        throw AppError.forbidden('You can only view feedback for your own team');
      }
      filter.employeeId = query.employeeId;
    } else {
      filter.$or = [{ managerId: actorEmployee?._id }, { employeeId: { $in: managedIds } }];
    }
  } else if (actorUser.role === 'admin' && query.employeeId) {
    filter.employeeId = query.employeeId;
  }

  if (query.category) filter.category = query.category;

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'firstName lastName email jobTitle avatarUrl employeeCode')
      .populate('managerId', 'firstName lastName email jobTitle avatarUrl')
      .populate('taskId', 'taskCode title')
      .lean(),
    Feedback.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}
