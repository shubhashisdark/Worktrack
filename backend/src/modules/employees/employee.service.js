import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Employee } from './employee.model.js';
import { User } from '../users/user.model.js';
import { Department } from '../departments/department.model.js';
import { TaskAssignment } from '../tasks/taskAssignment.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { getOrganizationSettings } from '../settings/settings.service.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../../utils/pagination.js';
import { getManagedEmployeeIds, canAccessEmployee } from '../../utils/scope.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

async function generateEmployeeCode() {
  const count = await Employee.countDocuments();
  let num = count + 101;
  while (await Employee.exists({ employeeCode: `WT-${num}` })) {
    num += 1;
  }
  return `WT-${num}`;
}

export async function listEmployees({ query, actorUser, actorEmployee }) {
  if (actorUser.role === 'employee') {
    throw AppError.forbidden('Employees cannot list the organization directory');
  }

  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 20,
    allowedSortFields: ['createdAt', 'firstName', 'lastName', 'employeeCode', 'hireDate', 'status'],
  });

  const filter = {};

  if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    filter._id = { $in: managedIds };
  }

  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.managerId) filter.managerId = query.managerId;
  if (query.status) filter.status = query.status;
  if (query.employmentType) filter.employmentType = query.employmentType;

  if (query.role) {
    const usersWithRole = await User.find({ role: query.role }).select('_id').lean();
    filter.userId = { $in: usersWithRole.map((u) => u._id) };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { employeeCode: regex },
      { jobTitle: regex },
    ];
  }

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email role isActive lastLoginAt')
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email jobTitle')
      .lean(),
    Employee.countDocuments(filter),
  ]);

  const employeeIds = items.map((e) => e._id);
  const todayStr = new Date().toISOString().slice(0, 10);

  const [activeTaskAgg, todayAttList, directReportAgg] = await Promise.all([
    TaskAssignment.aggregate([
      { $match: { employeeId: { $in: employeeIds }, status: { $in: ['assigned', 'in_progress', 'revision_requested'] } } },
      { $group: { _id: '$employeeId', count: { $sum: 1 } } },
    ]),
    Attendance.find({ employeeId: { $in: employeeIds }, date: todayStr }).lean(),
    Employee.aggregate([
      { $match: { managerId: { $in: employeeIds } } },
      { $group: { _id: '$managerId', count: { $sum: 1 } } },
    ]),
  ]);

  const taskMap = new Map(activeTaskAgg.map((r) => [String(r._id), r.count]));
  const attMap = new Map(todayAttList.map((a) => [String(a.employeeId), a]));
  const reportsMap = new Map(directReportAgg.map((r) => [String(r._id), r.count]));

  const enriched = items.map((emp) => ({
    ...emp,
    fullName: `${emp.firstName} ${emp.lastName}`.trim(),
    role: emp.userId?.role || 'employee',
    isActive: emp.userId?.isActive ?? emp.status === 'active',
    activeTasksCount: taskMap.get(String(emp._id)) || 0,
    todayAttendance: attMap.get(String(emp._id)) || null,
    directReportsCount: reportsMap.get(String(emp._id)) || 0,
  }));

  return { items: enriched, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getEmployeeById({ employeeId, actorUser, actorEmployee }) {
  const allowed = await canAccessEmployee(actorUser, actorEmployee, employeeId);
  if (!allowed) {
    throw AppError.forbidden('You do not have permission to view this employee profile');
  }

  const emp = await Employee.findById(employeeId)
    .populate('userId', 'email role isActive lastLoginAt notificationPrefs')
    .populate('departmentId', 'name code managerId')
    .populate('managerId', 'firstName lastName email jobTitle avatarUrl')
    .lean();

  if (!emp) {
    throw AppError.notFound('Employee not found');
  }

  const [taskSummary, recentAttendance, directReports] = await Promise.all([
    TaskAssignment.aggregate([
      { $match: { employeeId: emp._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Attendance.find({ employeeId: emp._id }).sort({ date: -1 }).limit(10).lean(),
    Employee.find({ managerId: emp._id }).select('firstName lastName email jobTitle status').lean(),
  ]);

  const counts = Object.fromEntries(taskSummary.map((s) => [s._id, s.count]));

  return {
    ...emp,
    fullName: `${emp.firstName} ${emp.lastName}`.trim(),
    role: emp.userId?.role || 'employee',
    isActive: emp.userId?.isActive ?? true,
    taskStats: {
      assigned: counts.assigned || 0,
      in_progress: counts.in_progress || 0,
      submitted: counts.submitted || 0,
      revision_requested: counts.revision_requested || 0,
      approved: counts.approved || 0,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    },
    recentAttendance,
    directReports,
  };
}

export async function createEmployee({ payload, actorUser, actorEmployee, ipAddress }) {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('An account with this email already exists');
  }

  if (payload.departmentId) {
    const dept = await Department.findById(payload.departmentId);
    if (!dept) throw AppError.badRequest('Selected department does not exist');
  }

  if (payload.managerId) {
    const mgr = await Employee.findById(payload.managerId);
    if (!mgr) throw AppError.badRequest('Selected manager does not exist');
  }

  const orgSettings = await getOrganizationSettings();
  const rawPassword = payload.password || crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const user = await User.create({
    email: payload.email.toLowerCase(),
    passwordHash,
    role: payload.role || 'employee',
    isActive: payload.status !== 'inactive',
  });

  const employeeCode = payload.employeeCode || (await generateEmployeeCode());

  const employee = await Employee.create({
    userId: user._id,
    employeeCode,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    phone: payload.phone || '',
    jobTitle: payload.jobTitle,
    departmentId: payload.departmentId || null,
    managerId: payload.managerId || null,
    employmentType: payload.employmentType || 'full_time',
    status: payload.status || 'active',
    hireDate: payload.hireDate ? new Date(payload.hireDate) : new Date(),
    location: payload.location || 'Remote',
    leaveBalances: {
      annual: orgSettings.defaultLeaveQuotas?.annual ?? 18,
      sick: orgSettings.defaultLeaveQuotas?.sick ?? 10,
      casual: orgSettings.defaultLeaveQuotas?.casual ?? 6,
    },
  });

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'employee.create',
    entityType: 'employee',
    entityId: employee._id,
    summary: `Added employee ${employee.fullName} (${employee.employeeCode}) as ${user.role}`,
    ipAddress,
  });

  return Employee.findById(employee._id)
    .populate('userId', 'email role isActive')
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName email jobTitle');
}

export async function updateEmployee({ employeeId, payload, actorUser, actorEmployee, ipAddress }) {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw AppError.notFound('Employee not found');

  const isSelf = actorEmployee && String(actorEmployee._id) === String(employee._id);

  if (actorUser.role !== 'admin') {
    if (!isSelf) {
      throw AppError.forbidden('You do not have permission to update this employee');
    }
    // Non-admins can only update limited personal profile fields
    const selfAllowed = ['firstName', 'lastName', 'phone', 'location', 'avatarUrl'];
    for (const key of selfAllowed) {
      if (payload[key] !== undefined) employee[key] = payload[key];
    }
    await employee.save();
    return Employee.findById(employee._id)
      .populate('userId', 'email role isActive')
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email jobTitle');
  }

  // Admin full update
  if (payload.managerId && String(payload.managerId) === String(employee._id)) {
    throw AppError.badRequest('An employee cannot be their own manager');
  }

  const fields = [
    'firstName',
    'lastName',
    'phone',
    'avatarUrl',
    'jobTitle',
    'departmentId',
    'managerId',
    'employmentType',
    'status',
    'location',
  ];
  for (const key of fields) {
    if (payload[key] !== undefined) employee[key] = payload[key];
  }
  if (payload.hireDate) employee.hireDate = new Date(payload.hireDate);
  if (payload.leaveBalances) {
    employee.leaveBalances = { ...employee.leaveBalances.toObject(), ...payload.leaveBalances };
  }

  await employee.save();

  if (payload.role || payload.status) {
    const userUpdate = {};
    if (payload.role) userUpdate.role = payload.role;
    if (payload.status) userUpdate.isActive = payload.status !== 'inactive';
    await User.findByIdAndUpdate(employee.userId, userUpdate);
  }

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'employee.update',
    entityType: 'employee',
    entityId: employee._id,
    summary: `Updated employee profile for ${employee.fullName}`,
    ipAddress,
  });

  return Employee.findById(employee._id)
    .populate('userId', 'email role isActive')
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName email jobTitle');
}

export async function deactivateEmployee({ employeeId, actorUser, actorEmployee, ipAddress }) {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw AppError.notFound('Employee not found');

  if (actorEmployee && String(actorEmployee._id) === String(employee._id)) {
    throw AppError.badRequest('You cannot deactivate your own admin account');
  }

  employee.status = 'inactive';
  await employee.save();
  await User.findByIdAndUpdate(employee.userId, { isActive: false });

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'employee.deactivate',
    entityType: 'employee',
    entityId: employee._id,
    summary: `Deactivated employee ${employee.fullName} (${employee.employeeCode})`,
    ipAddress,
  });

  return employee;
}

export async function bulkUpdateEmployeeStatus({ employeeIds, status, actorUser, actorEmployee, ipAddress }) {
  const employees = await Employee.find({ _id: { $in: employeeIds } });
  const filtered = employees.filter((e) => !actorEmployee || String(e._id) !== String(actorEmployee._id));
  const ids = filtered.map((e) => e._id);
  const userIds = filtered.map((e) => e.userId);

  await Promise.all([
    Employee.updateMany({ _id: { $in: ids } }, { status }),
    User.updateMany({ _id: { $in: userIds } }, { isActive: status === 'active' }),
  ]);

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'employee.bulk_status',
    entityType: 'employee',
    summary: `Updated ${ids.length} employee(s) to ${status}`,
    ipAddress,
  });

  return { updatedCount: ids.length, status };
}
