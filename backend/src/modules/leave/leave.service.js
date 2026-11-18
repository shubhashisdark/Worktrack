import { LeaveRequest } from './leaveRequest.model.js';
import { Employee } from '../employees/employee.model.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { getManagedEmployeeIds } from '../../utils/scope.js';
import { createNotification } from '../notifications/notification.service.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

function calculateDaysInclusive(start, end) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  return Math.floor((e - s) / msPerDay) + 1;
}

export async function createLeaveRequest({ payload, actorUser, actorEmployee, ipAddress }) {
  if (!actorEmployee) throw AppError.badRequest('Employee profile is required');

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw AppError.badRequest('Invalid start or end date');
  }
  if (endDate < startDate) {
    throw AppError.badRequest('End date cannot be earlier than start date');
  }

  const totalDays = calculateDaysInclusive(startDate, endDate);
  if (totalDays > 60) {
    throw AppError.badRequest('Single leave request cannot exceed 60 days');
  }

  // Prevent overlapping pending/approved leave requests
  const overlap = await LeaveRequest.findOne({
    employeeId: actorEmployee._id,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });
  if (overlap) {
    throw AppError.conflict('You already have a pending or approved leave request overlapping these dates');
  }

  // Check leave balance for tracked types
  if (['annual', 'sick', 'casual'].includes(payload.leaveType)) {
    const remaining = actorEmployee.leaveBalances?.[payload.leaveType] ?? 0;
    if (totalDays > remaining) {
      throw AppError.badRequest(
        `Insufficient ${payload.leaveType} leave balance (${remaining} day(s) remaining, requested ${totalDays})`
      );
    }
  }

  const leave = await LeaveRequest.create({
    employeeId: actorEmployee._id,
    leaveType: payload.leaveType,
    startDate,
    endDate,
    totalDays,
    reason: payload.reason,
    status: 'pending',
  });

  const managerId = actorEmployee.managerId?._id || actorEmployee.managerId;
  if (managerId) {
    await createNotification({
      recipientEmployeeId: managerId,
      type: 'leave_submitted',
      title: `Leave request from ${actorEmployee.fullName}`,
      message: `${payload.leaveType} leave (${totalDays} day${totalDays > 1 ? 's' : ''}) requested.`,
      entityType: 'leaveRequest',
      entityId: leave._id,
      actionUrl: '/manager/leave',
    });
  }

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'leave.apply',
    entityType: 'leaveRequest',
    entityId: leave._id,
    summary: `Applied for ${totalDays} day(s) of ${payload.leaveType} leave`,
    ipAddress,
  });

  return LeaveRequest.findById(leave._id).populate('employeeId', 'firstName lastName email employeeCode jobTitle');
}

export async function listLeaveRequests({ query, actorUser, actorEmployee }) {
  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 20,
    allowedSortFields: ['createdAt', 'startDate', 'status', 'leaveType'],
  });

  const filter = {};

  if (actorUser.role === 'employee' || query.mine === 'true') {
    filter.employeeId = actorEmployee?._id;
  } else if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    filter.employeeId = { $in: managedIds };
  } else if (actorUser.role === 'admin' && query.employeeId) {
    filter.employeeId = query.employeeId;
  }

  if (query.status) filter.status = query.status;
  if (query.leaveType) filter.leaveType = query.leaveType;

  const [items, total] = await Promise.all([
    LeaveRequest.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName email employeeCode jobTitle departmentId leaveBalances avatarUrl',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .populate('reviewerId', 'firstName lastName email')
      .lean(),
    LeaveRequest.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

async function assertLeaveReviewAccess(leave, actorUser, actorEmployee) {
  if (actorUser.role === 'admin') return;
  if (actorUser.role !== 'manager') {
    throw AppError.forbidden('Only managers or administrators can review leave requests');
  }
  const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
  if (!managedIds.includes(String(leave.employeeId))) {
    throw AppError.forbidden('You can only review leave requests from your own team');
  }
}

export async function reviewLeaveRequest({ leaveId, status, decisionNotes, actorUser, actorEmployee, ipAddress }) {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) throw AppError.notFound('Leave request not found');

  await assertLeaveReviewAccess(leave, actorUser, actorEmployee);

  if (leave.status !== 'pending') {
    throw AppError.badRequest(`Leave request has already been ${leave.status}`);
  }

  leave.status = status;
  leave.reviewerId = actorEmployee?._id || null;
  leave.reviewedAt = new Date();
  leave.decisionNotes = decisionNotes || '';
  await leave.save();

  if (status === 'approved' && ['annual', 'sick', 'casual'].includes(leave.leaveType)) {
    const emp = await Employee.findById(leave.employeeId);
    if (emp && emp.leaveBalances) {
      emp.leaveBalances[leave.leaveType] = Math.max(0, (emp.leaveBalances[leave.leaveType] || 0) - leave.totalDays);
      await emp.save();
    }
  }

  await createNotification({
    recipientEmployeeId: leave.employeeId,
    type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
    title: `Leave request ${status}`,
    message:
      decisionNotes ||
      `Your ${leave.leaveType} leave request (${leave.totalDays} day(s)) was ${status} by ${actorEmployee?.fullName || 'your manager'}.`,
    entityType: 'leaveRequest',
    entityId: leave._id,
    actionUrl: '/employee/leave',
  });

  await logActivity({
    actorUser,
    actorEmployee,
    action: `leave.${status}`,
    entityType: 'leaveRequest',
    entityId: leave._id,
    summary: `${status === 'approved' ? 'Approved' : 'Rejected'} ${leave.leaveType} leave request (${leave.totalDays}d)`,
    ipAddress,
  });

  return LeaveRequest.findById(leave._id)
    .populate('employeeId', 'firstName lastName email employeeCode jobTitle')
    .populate('reviewerId', 'firstName lastName email');
}

export async function cancelLeaveRequest({ leaveId, actorUser, actorEmployee, ipAddress }) {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) throw AppError.notFound('Leave request not found');

  if (String(leave.employeeId) !== String(actorEmployee?._id) && actorUser.role !== 'admin') {
    throw AppError.forbidden('You can only cancel your own leave requests');
  }
  if (leave.status !== 'pending') {
    throw AppError.badRequest('Only pending leave requests can be cancelled');
  }

  leave.status = 'cancelled';
  await leave.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'leave.cancel',
    entityType: 'leaveRequest',
    entityId: leave._id,
    summary: `Cancelled pending ${leave.leaveType} leave request`,
    ipAddress,
  });

  return leave;
}
