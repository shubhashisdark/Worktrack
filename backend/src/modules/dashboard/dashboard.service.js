import { Employee } from '../employees/employee.model.js';
import { Department } from '../departments/department.model.js';
import { Task } from '../tasks/task.model.js';
import { TaskAssignment } from '../tasks/taskAssignment.model.js';
import { Approval } from '../tasks/approval.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leave/leaveRequest.model.js';
import { Feedback } from '../feedback/feedback.model.js';
import { ActivityLog } from '../activity-logs/activityLog.model.js';
import { DailyReport } from '../daily-reports/dailyReport.model.js';
import { getManagedEmployeeIds } from '../../utils/scope.js';

export async function getEmployeeDashboard(actorUser, actorEmployee) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [todayAttendance, myAssignments, pendingApprovals, recentFeedback, recentActivity, todayReport] =
    await Promise.all([
      Attendance.findOne({ employeeId: actorEmployee._id, date: today }).lean(),
      TaskAssignment.find({ employeeId: actorEmployee._id })
        .populate({
          path: 'taskId',
          populate: { path: 'createdBy', select: 'firstName lastName jobTitle' },
        })
        .sort({ updatedAt: -1 })
        .lean(),
      Approval.find({ submittedBy: actorEmployee._id, decision: 'pending' })
        .populate('taskId', 'taskCode title dueDate priority')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Feedback.find({ employeeId: actorEmployee._id })
        .populate('managerId', 'firstName lastName jobTitle avatarUrl')
        .populate('taskId', 'taskCode title')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      ActivityLog.find({ actorUserId: actorUser._id }).sort({ createdAt: -1 }).limit(8).lean(),
      DailyReport.findOne({ employeeId: actorEmployee._id, date: today }).lean(),
    ]);

  const activeAssignments = myAssignments.filter((a) => a.taskId && !a.taskId.isArchived);

  const metrics = {
    assignedTasks: activeAssignments.filter((a) => a.status === 'assigned').length,
    inProgressTasks: activeAssignments.filter((a) => ['in_progress', 'revision_requested'].includes(a.status)).length,
    pendingApprovalTasks: activeAssignments.filter((a) => a.status === 'submitted').length,
    completedTasks: activeAssignments.filter((a) => a.status === 'approved').length,
    overdueTasks: activeAssignments.filter(
      (a) => a.status !== 'approved' && a.taskId?.dueDate && new Date(a.taskId.dueDate) < now
    ).length,
    totalTasks: activeAssignments.length,
  };

  const upcomingDeadlines = activeAssignments
    .filter((a) => a.status !== 'approved' && a.taskId?.dueDate && new Date(a.taskId.dueDate) <= nextWeek)
    .sort((a, b) => new Date(a.taskId.dueDate) - new Date(b.taskId.dueDate))
    .slice(0, 6);

  const assignedTasksList = activeAssignments
    .filter((a) => a.status !== 'approved')
    .sort((a, b) => new Date(a.taskId.dueDate) - new Date(b.taskId.dueDate))
    .slice(0, 6);

  return {
    today,
    todayAttendance,
    hasSubmittedDailyReportToday: Boolean(todayReport),
    metrics,
    assignedTasks: assignedTasksList,
    upcomingDeadlines,
    pendingApprovals,
    recentFeedback,
    recentActivity,
  };
}

export async function getManagerDashboard(actorEmployee) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const managedIds = await getManagedEmployeeIds(actorEmployee._id);

  const [teamMembers, teamAssignments, pendingApprovals, todayAttendance, pendingLeave, recentActivity] =
    await Promise.all([
      Employee.find({ _id: { $in: managedIds } })
        .select('firstName lastName email jobTitle status avatarUrl employeeCode')
        .lean(),
      TaskAssignment.find({ employeeId: { $in: managedIds } })
        .populate('taskId', 'taskCode title priority dueDate status isArchived')
        .populate('employeeId', 'firstName lastName jobTitle avatarUrl')
        .lean(),
      Approval.find({ submittedBy: { $in: managedIds }, decision: 'pending' })
        .populate('taskId', 'taskCode title priority dueDate')
        .populate('deliverableId', 'version notes submittedAt files')
        .populate('submittedBy', 'firstName lastName jobTitle avatarUrl')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Attendance.find({ employeeId: { $in: managedIds }, date: today })
        .populate('employeeId', 'firstName lastName jobTitle avatarUrl')
        .lean(),
      LeaveRequest.find({ employeeId: { $in: managedIds }, status: 'pending' })
        .populate('employeeId', 'firstName lastName jobTitle')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ActivityLog.find({ actorEmployeeId: { $in: [...managedIds, actorEmployee._id] } })
        .populate('actorEmployeeId', 'firstName lastName jobTitle')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

  const activeAssignments = teamAssignments.filter((a) => a.taskId && !a.taskId.isArchived);

  const workloadByMember = teamMembers.map((member) => {
    const memberTasks = activeAssignments.filter((a) => String(a.employeeId?._id) === String(member._id));
    const active = memberTasks.filter((a) => ['assigned', 'in_progress', 'revision_requested'].includes(a.status)).length;
    const submitted = memberTasks.filter((a) => a.status === 'submitted').length;
    const completed = memberTasks.filter((a) => a.status === 'approved').length;
    const overdue = memberTasks.filter(
      (a) => a.status !== 'approved' && a.taskId?.dueDate && new Date(a.taskId.dueDate) < now
    ).length;
    return {
      employeeId: member._id,
      name: `${member.firstName} ${member.lastName}`.trim(),
      jobTitle: member.jobTitle,
      active,
      submitted,
      completed,
      overdue,
      total: active + submitted + completed,
    };
  });

  const attCheckedInIds = new Set(todayAttendance.map((a) => String(a.employeeId?._id)));

  return {
    today,
    metrics: {
      teamSize: teamMembers.length,
      activeTasks: activeAssignments.filter((a) => ['assigned', 'in_progress', 'revision_requested'].includes(a.status)).length,
      completedTasks: activeAssignments.filter((a) => a.status === 'approved').length,
      overdueTasks: activeAssignments.filter(
        (a) => a.status !== 'approved' && a.taskId?.dueDate && new Date(a.taskId.dueDate) < now
      ).length,
      pendingApprovals: pendingApprovals.length,
      pendingLeaveRequests: pendingLeave.length,
    },
    attendanceOverview: {
      present: todayAttendance.filter((a) => a.status === 'present').length,
      late: todayAttendance.filter((a) => a.status === 'late').length,
      checkedOut: todayAttendance.filter((a) => Boolean(a.checkOutAt)).length,
      notCheckedIn: teamMembers.filter((m) => !attCheckedInIds.has(String(m._id))).length,
      records: todayAttendance,
    },
    workload: workloadByMember,
    recentSubmissions: pendingApprovals,
    pendingLeave,
    recentActivity,
  };
}

export async function getAdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const [
    totalEmployees,
    activeEmployees,
    departments,
    tasks,
    pendingApprovals,
    todayAttendance,
    pendingLeaves,
    recentActivity,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Department.find({ status: 'active' }).populate('managerId', 'firstName lastName').lean(),
    Task.find({ isArchived: false }).select('status priority dueDate departmentId').lean(),
    Approval.countDocuments({ decision: 'pending' }),
    Attendance.find({ date: today }).lean(),
    LeaveRequest.countDocuments({ status: 'pending' }),
    ActivityLog.find()
      .populate('actorEmployeeId', 'firstName lastName email jobTitle')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
  ]);

  const empByDeptAgg = await Employee.aggregate([
    { $match: { status: { $ne: 'inactive' } } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
  ]);
  const empByDeptMap = new Map(empByDeptAgg.map((r) => [String(r._id), r.count]));

  const departmentDistribution = departments.map((d) => ({
    _id: d._id,
    name: d.name,
    code: d.code,
    managerName: d.managerId ? `${d.managerId.firstName} ${d.managerId.lastName}` : 'Unassigned',
    employeeCount: empByDeptMap.get(String(d._id)) || 0,
    activeTasks: tasks.filter((t) => String(t.departmentId) === String(d._id) && t.status !== 'approved').length,
  }));

  return {
    today,
    metrics: {
      totalEmployees,
      activeEmployees,
      activeDepartments: departments.length,
      totalTasks: tasks.length,
      activeTasks: tasks.filter((t) => !['approved', 'archived'].includes(t.status)).length,
      completedTasks: tasks.filter((t) => t.status === 'approved').length,
      overdueTasks: tasks.filter((t) => t.status !== 'approved' && new Date(t.dueDate) < now).length,
      pendingApprovals,
      pendingLeaves,
    },
    attendanceOverview: {
      checkedIn: todayAttendance.length,
      present: todayAttendance.filter((a) => a.status === 'present').length,
      late: todayAttendance.filter((a) => a.status === 'late').length,
      checkedOut: todayAttendance.filter((a) => Boolean(a.checkOutAt)).length,
      attendanceRate: activeEmployees > 0 ? Math.round((todayAttendance.length / activeEmployees) * 100) : 0,
    },
    departmentDistribution,
    recentActivity,
  };
}
