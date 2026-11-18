import { Task } from '../tasks/task.model.js';
import { TaskAssignment } from '../tasks/taskAssignment.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leave/leaveRequest.model.js';
import { Employee } from '../employees/employee.model.js';
import { Department } from '../departments/department.model.js';
import { getManagedEmployeeIds } from '../../utils/scope.js';

export async function generateReports({ query, actorUser, actorEmployee }) {
  let employeeIds = null;
  if (actorUser.role === 'manager') {
    employeeIds = await getManagedEmployeeIds(actorEmployee?._id);
  } else if (actorUser.role === 'admin' && query.departmentId) {
    const emps = await Employee.find({ departmentId: query.departmentId }).select('_id').lean();
    employeeIds = emps.map((e) => e._id);
  }

  const empMatch = employeeIds ? { employeeId: { $in: employeeIds } } : {};
  const fromDate = query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const toDate = query.to || new Date().toISOString().slice(0, 10);

  const [taskStatusAgg, taskPriorityAgg, attendanceAgg, leaveAgg, departments] = await Promise.all([
    TaskAssignment.aggregate([
      { $match: empMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { ...empMatch, date: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMinutes: { $sum: '$workingMinutes' },
        },
      },
    ]),
    LeaveRequest.aggregate([
      { $match: empMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
    ]),
    Department.find({ status: 'active' }).select('name code').lean(),
  ]);

  return {
    range: { from: fromDate, to: toDate },
    tasksByStatus: Object.fromEntries(taskStatusAgg.map((r) => [r._id, r.count])),
    tasksByPriority: Object.fromEntries(taskPriorityAgg.map((r) => [r._id, r.count])),
    attendanceSummary: attendanceAgg.map((r) => ({
      status: r._id,
      count: r.count,
      totalHours: Number(((r.totalMinutes || 0) / 60).toFixed(1)),
    })),
    leaveSummary: leaveAgg.map((r) => ({
      status: r._id,
      count: r.count,
      totalDays: r.totalDays,
    })),
    departments,
  };
}
