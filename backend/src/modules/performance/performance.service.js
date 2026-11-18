import { TaskAssignment } from '../tasks/taskAssignment.model.js';
import { Approval } from '../tasks/approval.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { Feedback } from '../feedback/feedback.model.js';
import { Employee } from '../employees/employee.model.js';
import { getOrganizationSettings } from '../settings/settings.service.js';
import { getManagedEmployeeIds, canAccessEmployee } from '../../utils/scope.js';
import { AppError } from '../../utils/AppError.js';

function getLastNMonthsKeys(n = 6) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

export async function calculateEmployeePerformance(employeeId, weightsOverride = null) {
  const [settings, assignments, approvals, attendanceRecords, feedbackList] = await Promise.all([
    weightsOverride ? Promise.resolve({ performanceWeights: weightsOverride }) : getOrganizationSettings(),
    TaskAssignment.find({ employeeId }).populate('taskId', 'dueDate title priority status').lean(),
    Approval.find({ submittedBy: employeeId, decision: { $in: ['approved', 'revision_requested'] } }).lean(),
    Attendance.find({
      employeeId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
    }).lean(),
    Feedback.find({ employeeId }).sort({ createdAt: -1 }).lean(),
  ]);

  const weights = settings.performanceWeights || {
    taskCompletion: 30,
    onTimeCompletion: 25,
    approvalRate: 20,
    attendanceRate: 15,
    feedbackRating: 10,
  };

  const totalTasks = assignments.length;
  const approvedAssignments = assignments.filter((a) => a.status === 'approved');
  const taskCompletionRate = totalTasks > 0 ? Math.round((approvedAssignments.length / totalTasks) * 100) : 0;

  const onTimeCount = approvedAssignments.filter((a) => {
    if (!a.completedAt || !a.taskId?.dueDate) return true;
    return new Date(a.completedAt) <= new Date(a.taskId.dueDate);
  }).length;
  const onTimeCompletionRate =
    approvedAssignments.length > 0 ? Math.round((onTimeCount / approvedAssignments.length) * 100) : 0;

  const approvedDecisions = approvals.filter((a) => a.decision === 'approved').length;
  const approvalRate = approvals.length > 0 ? Math.round((approvedDecisions / approvals.length) * 100) : 0;

  // Approximate 22 working days in a 30-day window
  const expectedWorkingDays = 22;
  const presentDays = attendanceRecords.filter((r) => ['present', 'late', 'half_day'].includes(r.status)).length;
  const attendanceRate = Math.min(100, Math.round((presentDays / expectedWorkingDays) * 100));

  const avgFeedbackRating =
    feedbackList.length > 0
      ? Number((feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(2))
      : 0;
  const feedbackPercent = avgFeedbackRating > 0 ? Math.round((avgFeedbackRating / 5) * 100) : 0;

  // Weighted composite using only metrics with data if some categories are empty, or full weighted formula
  const compositeScore = Math.round(
    (taskCompletionRate * weights.taskCompletion +
      onTimeCompletionRate * weights.onTimeCompletion +
      approvalRate * weights.approvalRate +
      attendanceRate * weights.attendanceRate +
      feedbackPercent * weights.feedbackRating) /
      100
  );

  // 6-month trend of completed tasks & attendance days
  const monthKeys = getLastNMonthsKeys(6);
  const trend = monthKeys.map((month) => {
    const completed = approvedAssignments.filter(
      (a) => a.completedAt && new Date(a.completedAt).toISOString().slice(0, 7) === month
    ).length;
    const assigned = assignments.filter(
      (a) => a.assignedAt && new Date(a.assignedAt).toISOString().slice(0, 7) === month
    ).length;
    return { month, assigned, completed };
  });

  return {
    compositeScore,
    weights,
    metrics: {
      taskCompletionRate,
      onTimeCompletionRate,
      approvalRate,
      attendanceRate,
      avgFeedbackRating,
      feedbackPercent,
    },
    counts: {
      totalTasks,
      completedTasks: approvedAssignments.length,
      inProgressTasks: assignments.filter((a) => ['assigned', 'in_progress', 'revision_requested'].includes(a.status)).length,
      pendingReviewTasks: assignments.filter((a) => a.status === 'submitted').length,
      onTimeTasks: onTimeCount,
      totalReviews: approvals.length,
      approvedReviews: approvedDecisions,
      attendanceDaysLast30d: presentDays,
      feedbackCount: feedbackList.length,
    },
    trend,
  };
}

export async function getMyPerformance(actorEmployee) {
  if (!actorEmployee) throw AppError.badRequest('Employee profile is required');
  const perf = await calculateEmployeePerformance(actorEmployee._id);
  const recentFeedback = await Feedback.find({ employeeId: actorEmployee._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('managerId', 'firstName lastName jobTitle')
    .populate('taskId', 'taskCode title')
    .lean();

  return {
    employee: {
      _id: actorEmployee._id,
      fullName: actorEmployee.fullName,
      jobTitle: actorEmployee.jobTitle,
      employeeCode: actorEmployee.employeeCode,
    },
    ...perf,
    recentFeedback,
  };
}

export async function getEmployeePerformance({ employeeId, actorUser, actorEmployee }) {
  const allowed = await canAccessEmployee(actorUser, actorEmployee, employeeId);
  if (!allowed) {
    throw AppError.forbidden('You do not have permission to view this employee’s performance');
  }

  const emp = await Employee.findById(employeeId)
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName')
    .lean();
  if (!emp) throw AppError.notFound('Employee not found');

  const [perf, recentFeedback] = await Promise.all([
    calculateEmployeePerformance(emp._id),
    Feedback.find({ employeeId: emp._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('managerId', 'firstName lastName jobTitle')
      .populate('taskId', 'taskCode title')
      .lean(),
  ]);

  return {
    employee: { ...emp, fullName: `${emp.firstName} ${emp.lastName}`.trim() },
    ...perf,
    recentFeedback,
  };
}

export async function getTeamPerformance({ query, actorUser, actorEmployee }) {
  const settings = await getOrganizationSettings();
  const filter = { status: { $ne: 'inactive' } };

  if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    filter._id = { $in: managedIds };
  } else if (actorUser.role === 'admin' && query.departmentId) {
    filter.departmentId = query.departmentId;
  }

  const employees = await Employee.find(filter)
    .populate('departmentId', 'name code')
    .sort({ firstName: 1 })
    .lean();

  const members = await Promise.all(
    employees.map(async (emp) => {
      const perf = await calculateEmployeePerformance(emp._id, settings.performanceWeights);
      return {
        employee: {
          _id: emp._id,
          employeeCode: emp.employeeCode,
          fullName: `${emp.firstName} ${emp.lastName}`.trim(),
          email: emp.email,
          jobTitle: emp.jobTitle,
          department: emp.departmentId,
          avatarUrl: emp.avatarUrl,
        },
        compositeScore: perf.compositeScore,
        metrics: perf.metrics,
        counts: perf.counts,
      };
    })
  );

  const avg = (fn) =>
    members.length > 0 ? Math.round(members.reduce((sum, m) => sum + fn(m), 0) / members.length) : 0;

  return {
    weights: settings.performanceWeights,
    summary: {
      employeeCount: members.length,
      avgCompositeScore: avg((m) => m.compositeScore),
      avgTaskCompletionRate: avg((m) => m.metrics.taskCompletionRate),
      avgOnTimeRate: avg((m) => m.metrics.onTimeCompletionRate),
      avgApprovalRate: avg((m) => m.metrics.approvalRate),
      avgAttendanceRate: avg((m) => m.metrics.attendanceRate),
    },
    members: members.sort((a, b) => b.compositeScore - a.compositeScore),
  };
}
