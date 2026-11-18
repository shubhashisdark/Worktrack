import { DailyReport } from './dailyReport.model.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../../utils/pagination.js';
import { getManagedEmployeeIds, canAccessEmployee } from '../../utils/scope.js';
import { createNotification } from '../notifications/notification.service.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

export async function createOrUpdateDailyReport({ payload, actorUser, actorEmployee, ipAddress }) {
  if (!actorEmployee) throw AppError.badRequest('Employee profile is required');

  const date = payload.date || new Date().toISOString().slice(0, 10);

  const report = await DailyReport.findOneAndUpdate(
    { employeeId: actorEmployee._id, date },
    {
      employeeId: actorEmployee._id,
      date,
      completedWork: payload.completedWork,
      ongoingWork: payload.ongoingWork || '',
      blockers: payload.blockers || '',
      nextDayPlan: payload.nextDayPlan || '',
      relatedTaskIds: payload.relatedTaskIds || [],
      hoursWorked: payload.hoursWorked ?? 8,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'daily_report.submit',
    entityType: 'dailyReport',
    entityId: report._id,
    summary: `Submitted daily work report for ${date}`,
    ipAddress,
  });

  return DailyReport.findById(report._id)
    .populate('employeeId', 'firstName lastName email employeeCode jobTitle avatarUrl')
    .populate('relatedTaskIds', 'taskCode title status');
}

export async function listDailyReports({ query, actorUser, actorEmployee }) {
  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 20,
    allowedSortFields: ['date', 'createdAt', 'hoursWorked'],
    defaultSortBy: 'date',
    defaultSortOrder: 'desc',
  });

  const filter = {};

  if (actorUser.role === 'employee' || query.mine === 'true') {
    filter.employeeId = actorEmployee?._id;
  } else if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    if (query.employeeId) {
      if (!managedIds.includes(String(query.employeeId))) {
        throw AppError.forbidden('You can only view daily reports for your own team');
      }
      filter.employeeId = query.employeeId;
    } else {
      filter.employeeId = { $in: managedIds };
    }
  } else if (actorUser.role === 'admin' && query.employeeId) {
    filter.employeeId = query.employeeId;
  }

  if (query.date) {
    filter.date = query.date;
  } else if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }

  if (query.hasBlockers === 'true') {
    filter.blockers = { $nin: ['', null] };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ completedWork: regex }, { ongoingWork: regex }, { blockers: regex }, { nextDayPlan: regex }];
  }

  const [items, total] = await Promise.all([
    DailyReport.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName email employeeCode jobTitle departmentId avatarUrl',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .populate('relatedTaskIds', 'taskCode title status')
      .populate('reviewedBy', 'firstName lastName')
      .lean(),
    DailyReport.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getDailyReportById({ reportId, actorUser, actorEmployee }) {
  const report = await DailyReport.findById(reportId)
    .populate({
      path: 'employeeId',
      select: 'firstName lastName email employeeCode jobTitle departmentId avatarUrl',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .populate('relatedTaskIds', 'taskCode title status priority dueDate')
    .populate('reviewedBy', 'firstName lastName email')
    .lean();

  if (!report) throw AppError.notFound('Daily report not found');

  const allowed = await canAccessEmployee(actorUser, actorEmployee, report.employeeId?._id);
  if (!allowed) {
    throw AppError.forbidden('You do not have permission to view this daily report');
  }

  return report;
}

export async function addManagerNote({ reportId, managerNote, actorUser, actorEmployee, ipAddress }) {
  const report = await DailyReport.findById(reportId);
  if (!report) throw AppError.notFound('Daily report not found');

  const allowed = await canAccessEmployee(actorUser, actorEmployee, report.employeeId);
  if (!allowed || actorUser.role === 'employee') {
    throw AppError.forbidden('You do not have permission to review this daily report');
  }

  report.managerNote = managerNote;
  report.reviewedBy = actorEmployee?._id || null;
  report.reviewedAt = new Date();
  await report.save();

  await createNotification({
    recipientEmployeeId: report.employeeId,
    type: 'daily_report_reviewed',
    title: `Manager commented on your daily report (${report.date})`,
    message: managerNote.slice(0, 140),
    entityType: 'dailyReport',
    entityId: report._id,
    actionUrl: `/employee/daily-reports/${report._id}`,
  });

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'daily_report.review',
    entityType: 'dailyReport',
    entityId: report._id,
    summary: `Reviewed daily report for ${report.date}`,
    ipAddress,
  });

  return getDailyReportById({ reportId: report._id, actorUser, actorEmployee });
}
