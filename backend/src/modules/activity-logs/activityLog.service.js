import { ActivityLog } from './activityLog.model.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../../utils/pagination.js';
import { getManagedEmployeeIds } from '../../utils/scope.js';

export async function logActivity({
  actorUser,
  actorEmployee = null,
  action,
  entityType,
  entityId = null,
  summary,
  metadata = {},
  ipAddress = '',
}) {
  if (!actorUser) return null;
  try {
    return await ActivityLog.create({
      actorUserId: actorUser._id,
      actorEmployeeId: actorEmployee?._id || null,
      actorRole: actorUser.role,
      action,
      entityType,
      entityId,
      summary,
      metadata,
      ipAddress,
    });
  } catch {
    return null;
  }
}

export async function listActivityLogs({ query, actorUser, actorEmployee }) {
  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 25,
    allowedSortFields: ['createdAt', 'action', 'entityType', 'actorRole'],
  });

  const filter = {};
  if (actorUser.role === 'manager' && actorEmployee) {
    const teamIds = await getManagedEmployeeIds(actorEmployee._id);
    filter.actorEmployeeId = { $in: [...teamIds, actorEmployee._id] };
  } else if (actorUser.role === 'employee' && actorEmployee) {
    filter.actorUserId = actorUser._id;
  }

  if (query.entityType) filter.entityType = query.entityType;
  if (query.actorRole) filter.actorRole = query.actorRole;
  if (query.action) filter.action = new RegExp(escapeRegex(query.action), 'i');
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ summary: regex }, { action: regex }, { entityType: regex }];
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('actorEmployeeId', 'firstName lastName email jobTitle avatarUrl')
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}
