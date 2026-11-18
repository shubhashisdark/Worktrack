import { Attendance } from './attendance.model.js';
import { Employee } from '../employees/employee.model.js';
import { getOrganizationSettings } from '../settings/settings.service.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { getManagedEmployeeIds, canAccessEmployee } from '../../utils/scope.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

function getTodayDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function isLateCheckIn(checkInDate, workStartTime = '09:00', lateThresholdMinutes = 15) {
  const [hours, minutes] = workStartTime.split(':').map(Number);
  const threshold = new Date(checkInDate);
  threshold.setUTCHours(hours || 9, (minutes || 0) + (lateThresholdMinutes || 15), 0, 0);
  return checkInDate.getTime() > threshold.getTime();
}

export async function checkIn({ actorUser, actorEmployee, notes, ipAddress }) {
  if (!actorEmployee) throw AppError.badRequest('No employee profile linked to this account');

  const now = new Date();
  const today = getTodayDateString(now);

  const existing = await Attendance.findOne({ employeeId: actorEmployee._id, date: today });
  if (existing) {
    throw AppError.conflict('You have already checked in today');
  }

  const settings = await getOrganizationSettings();
  const late = isLateCheckIn(now, settings.workStartTime, settings.lateThresholdMinutes);

  const record = await Attendance.create({
    employeeId: actorEmployee._id,
    date: today,
    checkInAt: now,
    status: late ? 'late' : 'present',
    notes: notes || '',
  });

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'attendance.check_in',
    entityType: 'attendance',
    entityId: record._id,
    summary: `${actorEmployee.fullName} checked in (${record.status})`,
    ipAddress,
  });

  return record;
}

export async function checkOut({ actorUser, actorEmployee, notes, ipAddress }) {
  if (!actorEmployee) throw AppError.badRequest('No employee profile linked to this account');

  const now = new Date();
  const today = getTodayDateString(now);

  const record = await Attendance.findOne({ employeeId: actorEmployee._id, date: today });
  if (!record) {
    throw AppError.badRequest('You must check in before checking out');
  }
  if (record.checkOutAt) {
    throw AppError.conflict('You have already checked out today');
  }

  const diffMs = Math.max(0, now.getTime() - new Date(record.checkInAt).getTime());
  const workingMinutes = Math.round(diffMs / 60000);

  record.checkOutAt = now;
  record.workingMinutes = workingMinutes;
  if (notes) {
    record.notes = record.notes ? `${record.notes} | ${notes}` : notes;
  }
  if (workingMinutes < 240 && record.status === 'present') {
    record.status = 'half_day';
  }
  await record.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'attendance.check_out',
    entityType: 'attendance',
    entityId: record._id,
    summary: `${actorEmployee.fullName} checked out (${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m)`,
    ipAddress,
  });

  return record;
}

export async function listAttendance({ query, actorUser, actorEmployee }) {
  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 25,
    allowedSortFields: ['date', 'checkInAt', 'workingMinutes', 'status'],
    defaultSortBy: 'date',
    defaultSortOrder: 'desc',
  });

  const filter = {};

  if (actorUser.role === 'employee') {
    filter.employeeId = actorEmployee?._id;
  } else if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    if (query.employeeId) {
      if (!managedIds.includes(String(query.employeeId)) && String(query.employeeId) !== String(actorEmployee?._id)) {
        throw AppError.forbidden('You can only view attendance for your own team');
      }
      filter.employeeId = query.employeeId;
    } else {
      filter.employeeId = { $in: managedIds };
    }
  } else if (actorUser.role === 'admin') {
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: query.departmentId }).select('_id').lean();
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }
  }

  if (query.date) {
    filter.date = query.date;
  } else if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }

  if (query.status) filter.status = query.status;
  if (query.missingCheckout === 'true') {
    const today = getTodayDateString();
    filter.checkOutAt = null;
    filter.date = { $lt: today };
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName email employeeCode jobTitle departmentId avatarUrl',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  const today = getTodayDateString();
  const normalized = items.map((rec) => ({
    ...rec,
    isMissingCheckout: !rec.checkOutAt && rec.date < today,
  }));

  return { items: normalized, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getAttendanceHistory({ query, actorUser, actorEmployee }) {
  const targetEmployeeId = query.employeeId || actorEmployee?._id;
  const allowed = await canAccessEmployee(actorUser, actorEmployee, targetEmployeeId);
  if (!allowed) {
    throw AppError.forbidden('You cannot access this employee’s attendance history');
  }

  const now = new Date();
  const month = query.month || now.toISOString().slice(0, 7); // YYYY-MM
  const startStr = `${month}-01`;
  const endStr = `${month}-31`;

  const today = getTodayDateString(now);

  const [todayRecord, monthRecords] = await Promise.all([
    Attendance.findOne({ employeeId: targetEmployeeId, date: today }).lean(),
    Attendance.find({
      employeeId: targetEmployeeId,
      date: { $gte: startStr, $lte: endStr },
    })
      .sort({ date: -1 })
      .lean(),
  ]);

  const totalMinutes = monthRecords.reduce((sum, r) => sum + (r.workingMinutes || 0), 0);
  const summary = {
    month,
    daysLogged: monthRecords.length,
    presentDays: monthRecords.filter((r) => r.status === 'present').length,
    lateDays: monthRecords.filter((r) => r.status === 'late').length,
    halfDays: monthRecords.filter((r) => r.status === 'half_day').length,
    missingCheckouts: monthRecords.filter((r) => !r.checkOutAt && r.date < today).length,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    avgHoursPerDay: monthRecords.length ? Number((totalMinutes / 60 / monthRecords.length).toFixed(1)) : 0,
  };

  return {
    today: todayRecord,
    records: monthRecords,
    summary,
  };
}

export async function adjustAttendance({ attendanceId, payload, actorUser, actorEmployee, ipAddress }) {
  const record = await Attendance.findById(attendanceId);
  if (!record) throw AppError.notFound('Attendance record not found');

  const allowed = await canAccessEmployee(actorUser, actorEmployee, record.employeeId);
  if (!allowed || actorUser.role === 'employee') {
    throw AppError.forbidden('You do not have permission to adjust this attendance record');
  }

  if (payload.checkOutAt) {
    const checkOutDate = new Date(payload.checkOutAt);
    if (checkOutDate <= new Date(record.checkInAt)) {
      throw AppError.badRequest('Check-out time must be after check-in time');
    }
    record.checkOutAt = checkOutDate;
    record.workingMinutes = Math.round((checkOutDate.getTime() - new Date(record.checkInAt).getTime()) / 60000);
    if (record.status === 'missing_checkout') record.status = 'present';
  }
  if (payload.status) record.status = payload.status;
  if (payload.notes !== undefined) record.notes = payload.notes;
  record.adjustedBy = actorEmployee?._id || null;
  await record.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'attendance.adjust',
    entityType: 'attendance',
    entityId: record._id,
    summary: `Adjusted attendance record for ${record.date}`,
    ipAddress,
  });

  return record;
}
