import { Department } from './department.model.js';
import { Employee } from '../employees/employee.model.js';
import { Task } from '../tasks/task.model.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../../utils/pagination.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

export async function listDepartments({ query }) {
  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 50,
    allowedSortFields: ['name', 'code', 'createdAt', 'status'],
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  });

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
  }

  const [items, total] = await Promise.all([
    Department.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('managerId', 'firstName lastName email jobTitle avatarUrl')
      .lean(),
    Department.countDocuments(filter),
  ]);

  const deptIds = items.map((d) => d._id);
  const [empCounts, taskCounts] = await Promise.all([
    Employee.aggregate([
      { $match: { departmentId: { $in: deptIds } } },
      { $group: { _id: '$departmentId', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
    ]),
    Task.aggregate([
      { $match: { departmentId: { $in: deptIds }, isArchived: false } },
      { $group: { _id: '$departmentId', total: { $sum: 1 } } },
    ]),
  ]);

  const empMap = new Map(empCounts.map((c) => [String(c._id), c]));
  const taskMap = new Map(taskCounts.map((c) => [String(c._id), c.total]));

  const enriched = items.map((dept) => ({
    ...dept,
    employeeCount: empMap.get(String(dept._id))?.total || 0,
    activeEmployeeCount: empMap.get(String(dept._id))?.active || 0,
    activeTaskCount: taskMap.get(String(dept._id)) || 0,
  }));

  return { items: enriched, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getDepartmentById(departmentId) {
  const dept = await Department.findById(departmentId)
    .populate('managerId', 'firstName lastName email jobTitle avatarUrl')
    .lean();

  if (!dept) throw AppError.notFound('Department not found');

  const [employees, tasks] = await Promise.all([
    Employee.find({ departmentId: dept._id })
      .populate('userId', 'role isActive')
      .populate('managerId', 'firstName lastName')
      .sort({ firstName: 1 })
      .lean(),
    Task.find({ departmentId: dept._id, isArchived: false })
      .sort({ dueDate: 1 })
      .limit(20)
      .lean(),
  ]);

  return {
    ...dept,
    employees: employees.map((e) => ({
      ...e,
      fullName: `${e.firstName} ${e.lastName}`.trim(),
      role: e.userId?.role || 'employee',
    })),
    employeeCount: employees.length,
    tasks,
  };
}

export async function createDepartment({ payload, actorUser, actorEmployee, ipAddress }) {
  const department = await Department.create(payload);

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'department.create',
    entityType: 'department',
    entityId: department._id,
    summary: `Created department "${department.name}" (${department.code})`,
    ipAddress,
  });

  return Department.findById(department._id).populate('managerId', 'firstName lastName email jobTitle');
}

export async function updateDepartment({ departmentId, payload, actorUser, actorEmployee, ipAddress }) {
  const department = await Department.findById(departmentId);
  if (!department) throw AppError.notFound('Department not found');

  Object.assign(department, payload);
  await department.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'department.update',
    entityType: 'department',
    entityId: department._id,
    summary: `Updated department "${department.name}"`,
    ipAddress,
  });

  return Department.findById(department._id).populate('managerId', 'firstName lastName email jobTitle');
}

export async function deactivateDepartment({ departmentId, actorUser, actorEmployee, ipAddress }) {
  const department = await Department.findById(departmentId);
  if (!department) throw AppError.notFound('Department not found');

  department.status = 'inactive';
  await department.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'department.deactivate',
    entityType: 'department',
    entityId: department._id,
    summary: `Deactivated department "${department.name}"`,
    ipAddress,
  });

  return department;
}
