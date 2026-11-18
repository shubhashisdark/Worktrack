import { Task } from './task.model.js';
import { TaskAssignment } from './taskAssignment.model.js';
import { TaskUpdate } from './taskUpdate.model.js';
import { Deliverable } from './deliverable.model.js';
import { Approval } from './approval.model.js';
import { Employee } from '../employees/employee.model.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../../utils/pagination.js';
import { getManagedEmployeeIds } from '../../utils/scope.js';
import { uploadFiles } from '../../utils/storage.js';
import { createNotification } from '../notifications/notification.service.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

async function generateTaskCode() {
  const count = await Task.countDocuments();
  let num = count + 1001;
  while (await Task.exists({ taskCode: `TSK-${num}` })) {
    num += 1;
  }
  return `TSK-${num}`;
}

export async function syncTaskStatus(taskId) {
  const task = await Task.findById(taskId);
  if (!task || task.isArchived) return task;

  const assignments = await TaskAssignment.find({ taskId }).lean();
  if (assignments.length === 0) {
    task.status = 'created';
  } else {
    const statuses = assignments.map((a) => a.status);
    if (statuses.every((s) => s === 'approved')) {
      task.status = 'approved';
    } else if (statuses.includes('revision_requested')) {
      task.status = 'revision_requested';
    } else if (statuses.includes('submitted')) {
      task.status = 'submitted';
    } else if (statuses.includes('in_progress')) {
      task.status = 'in_progress';
    } else {
      task.status = 'assigned';
    }
  }
  await task.save();
  return task;
}

async function assertTaskAccess(task, actorUser, actorEmployee) {
  if (!task) throw AppError.notFound('Task not found');
  if (actorUser.role === 'admin') return;

  if (actorUser.role === 'employee') {
    const assigned = await TaskAssignment.exists({ taskId: task._id, employeeId: actorEmployee?._id });
    if (!assigned) {
      throw AppError.forbidden('You do not have access to this task');
    }
    return;
  }

  if (actorUser.role === 'manager') {
    if (actorEmployee && String(task.createdBy) === String(actorEmployee._id)) return;
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    const hasTeamAssignee = await TaskAssignment.exists({
      taskId: task._id,
      employeeId: { $in: managedIds },
    });
    const isOwnAssigned = await TaskAssignment.exists({
      taskId: task._id,
      employeeId: actorEmployee?._id,
    });
    if (!hasTeamAssignee && !isOwnAssigned) {
      throw AppError.forbidden('You do not have access to this task');
    }
  }
}

export async function listTasks({ query, actorUser, actorEmployee }) {
  const { page, limit, skip, sort } = parsePagination(query, {
    defaultLimit: 20,
    allowedSortFields: ['createdAt', 'dueDate', 'priority', 'status', 'title'],
    defaultSortBy: 'dueDate',
    defaultSortOrder: 'asc',
  });

  const filter = { isArchived: query.includeArchived === 'true' ? { $in: [true, false] } : false };
  if (query.status === 'archived') {
    filter.isArchived = true;
  } else if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) filter.priority = query.priority;
  if (query.departmentId) filter.departmentId = query.departmentId;

  if (query.overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $nin: ['approved', 'archived'] };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { taskCode: regex }];
  }

  // Scope tasks by role
  if (actorUser.role === 'employee') {
    const assignmentFilter = { employeeId: actorEmployee?._id };
    if (query.assignmentStatus) assignmentFilter.status = query.assignmentStatus;
    const myAssignments = await TaskAssignment.find(assignmentFilter).select('taskId').lean();
    filter._id = { $in: myAssignments.map((a) => a.taskId) };
  } else if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    const assigneeFilter = query.assigneeId
      ? { employeeId: managedIds.includes(String(query.assigneeId)) ? query.assigneeId : null }
      : { employeeId: { $in: [...managedIds, actorEmployee?._id] } };
    const teamAssignments = await TaskAssignment.find(assigneeFilter).select('taskId').lean();
    const taskIds = teamAssignments.map((a) => a.taskId);

    if (query.assigneeId) {
      filter._id = { $in: taskIds };
    } else {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [{ createdBy: actorEmployee?._id }, { _id: { $in: taskIds } }],
        },
      ];
    }
  } else if (actorUser.role === 'admin' && query.assigneeId) {
    const empAssignments = await TaskAssignment.find({ employeeId: query.assigneeId }).select('taskId').lean();
    filter._id = { $in: empAssignments.map((a) => a.taskId) };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName email jobTitle avatarUrl')
      .populate('departmentId', 'name code')
      .lean(),
    Task.countDocuments(filter),
  ]);

  const taskIds = tasks.map((t) => t._id);
  const assignments = await TaskAssignment.find({ taskId: { $in: taskIds } })
    .populate('employeeId', 'firstName lastName email jobTitle avatarUrl employeeCode')
    .lean();

  const assignMap = new Map();
  for (const a of assignments) {
    const key = String(a.taskId);
    if (!assignMap.has(key)) assignMap.set(key, []);
    assignMap.get(key).push(a);
  }

  const items = tasks.map((task) => {
    const taskAssignees = assignMap.get(String(task._id)) || [];
    const myAssignment = actorEmployee
      ? taskAssignees.find((a) => String(a.employeeId?._id) === String(actorEmployee._id)) || null
      : null;
    const avgProgress =
      taskAssignees.length > 0
        ? Math.round(taskAssignees.reduce((acc, a) => acc + (a.progress || 0), 0) / taskAssignees.length)
        : 0;
    const isOverdue = !task.isArchived && task.status !== 'approved' && new Date(task.dueDate) < new Date();
    return {
      ...task,
      assignments: taskAssignees,
      myAssignment,
      progress: myAssignment ? myAssignment.progress : avgProgress,
      isOverdue,
    };
  });

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getTaskById({ taskId, actorUser, actorEmployee }) {
  const task = await Task.findById(taskId)
    .populate('createdBy', 'firstName lastName email jobTitle avatarUrl')
    .populate('departmentId', 'name code');

  await assertTaskAccess(task, actorUser, actorEmployee);

  const [assignments, updates, deliverables, approvals] = await Promise.all([
    TaskAssignment.find({ taskId: task._id })
      .populate('employeeId', 'firstName lastName email jobTitle avatarUrl employeeCode')
      .populate('assignedBy', 'firstName lastName')
      .lean(),
    TaskUpdate.find({ taskId: task._id })
      .sort({ createdAt: -1 })
      .populate('authorId', 'firstName lastName email jobTitle avatarUrl')
      .lean(),
    Deliverable.find({ taskId: task._id })
      .sort({ version: -1, createdAt: -1 })
      .populate('submittedBy', 'firstName lastName email avatarUrl')
      .lean(),
    Approval.find({ taskId: task._id })
      .sort({ createdAt: -1 })
      .populate('reviewerId', 'firstName lastName email')
      .populate('submittedBy', 'firstName lastName email')
      .lean(),
  ]);

  const myAssignment = actorEmployee
    ? assignments.find((a) => String(a.employeeId?._id) === String(actorEmployee._id)) || null
    : null;

  const avgProgress =
    assignments.length > 0
      ? Math.round(assignments.reduce((sum, a) => sum + (a.progress || 0), 0) / assignments.length)
      : 0;

  return {
    ...task.toObject(),
    assignments,
    myAssignment,
    progress: myAssignment ? myAssignment.progress : avgProgress,
    updates,
    deliverables,
    approvals,
    isOverdue: !task.isArchived && task.status !== 'approved' && new Date(task.dueDate) < new Date(),
  };
}

export async function createTask({ payload, files = [], actorUser, actorEmployee, ipAddress }) {
  const taskCode = await generateTaskCode();
  const uploadedAttachments = files.length > 0 ? await uploadFiles(files, 'worktrack/tasks') : [];

  const assigneeIds = Array.isArray(payload.assigneeIds) ? [...new Set(payload.assigneeIds)] : [];

  if (actorUser.role === 'manager' && assigneeIds.length > 0) {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    for (const empId of assigneeIds) {
      if (!managedIds.includes(String(empId))) {
        throw AppError.forbidden('Managers can only assign tasks to members of their own team');
      }
    }
  }

  const task = await Task.create({
    taskCode,
    title: payload.title,
    description: payload.description || '',
    createdBy: actorEmployee._id,
    departmentId: payload.departmentId || actorEmployee.departmentId?._id || actorEmployee.departmentId || null,
    priority: payload.priority || 'medium',
    status: assigneeIds.length > 0 ? 'assigned' : 'created',
    dueDate: new Date(payload.dueDate),
    attachments: uploadedAttachments,
    tags: payload.tags || [],
  });

  if (assigneeIds.length > 0) {
    await assignEmployeesToTask({
      taskId: task._id,
      employeeIds: assigneeIds,
      actorUser,
      actorEmployee,
      ipAddress,
      skipActivityLog: true,
    });
  }

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'task.create',
    entityType: 'task',
    entityId: task._id,
    summary: `Created task "${task.title}" (${task.taskCode})`,
    ipAddress,
  });

  return getTaskById({ taskId: task._id, actorUser, actorEmployee });
}

export async function updateTask({ taskId, payload, files = [], actorUser, actorEmployee, ipAddress }) {
  const task = await Task.findById(taskId);
  await assertTaskAccess(task, actorUser, actorEmployee);

  if (actorUser.role === 'employee') {
    throw AppError.forbidden('Employees cannot edit task definitions');
  }

  const editableFields = ['title', 'description', 'priority', 'departmentId', 'tags', 'isArchived'];
  for (const field of editableFields) {
    if (payload[field] !== undefined) task[field] = payload[field];
  }
  if (payload.dueDate) task.dueDate = new Date(payload.dueDate);
  if (payload.isArchived) task.status = 'archived';

  if (files.length > 0) {
    const newFiles = await uploadFiles(files, 'worktrack/tasks');
    task.attachments = [...task.attachments, ...newFiles].slice(0, 10);
  }

  await task.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'task.update',
    entityType: 'task',
    entityId: task._id,
    summary: `Updated task "${task.title}" (${task.taskCode})`,
    ipAddress,
  });

  return getTaskById({ taskId: task._id, actorUser, actorEmployee });
}

export async function archiveTask({ taskId, actorUser, actorEmployee, ipAddress }) {
  const task = await Task.findById(taskId);
  await assertTaskAccess(task, actorUser, actorEmployee);

  task.isArchived = true;
  task.status = 'archived';
  await task.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'task.archive',
    entityType: 'task',
    entityId: task._id,
    summary: `Archived task "${task.title}" (${task.taskCode})`,
    ipAddress,
  });

  return task;
}

export async function assignEmployeesToTask({ taskId, employeeIds, actorUser, actorEmployee, ipAddress, skipActivityLog = false }) {
  const task = await Task.findById(taskId);
  if (!task) throw AppError.notFound('Task not found');

  if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    for (const empId of employeeIds) {
      if (!managedIds.includes(String(empId))) {
        throw AppError.forbidden('Managers can only assign tasks to their own team members');
      }
    }
  }

  const employees = await Employee.find({ _id: { $in: employeeIds } });
  if (employees.length === 0) {
    throw AppError.badRequest('No valid employees found for assignment');
  }

  const createdAssignments = [];
  for (const emp of employees) {
    const existing = await TaskAssignment.findOne({ taskId: task._id, employeeId: emp._id });
    if (existing) continue;

    const assignment = await TaskAssignment.create({
      taskId: task._id,
      employeeId: emp._id,
      assignedBy: actorEmployee._id,
      status: 'assigned',
      progress: 0,
    });
    createdAssignments.push(assignment);

    await TaskUpdate.create({
      taskId: task._id,
      assignmentId: assignment._id,
      authorId: actorEmployee._id,
      type: 'assignment',
      message: `Assigned task to ${emp.fullName}`,
      newStatus: 'assigned',
    });

    await createNotification({
      recipientUserId: emp.userId,
      type: 'task_assigned',
      title: `New task assigned: ${task.title}`,
      message: `${actorEmployee.fullName} assigned "${task.title}" (${task.taskCode}) to you.`,
      entityType: 'task',
      entityId: task._id,
      actionUrl: `/employee/tasks/${task._id}`,
    });
  }

  await syncTaskStatus(task._id);

  if (!skipActivityLog) {
    await logActivity({
      actorUser,
      actorEmployee,
      action: 'task.assign',
      entityType: 'task',
      entityId: task._id,
      summary: `Assigned "${task.title}" to ${employees.map((e) => e.fullName).join(', ')}`,
      ipAddress,
    });
  }

  return getTaskById({ taskId: task._id, actorUser, actorEmployee });
}

export async function updateTaskProgress({ taskId, progress, note, actorUser, actorEmployee, ipAddress }) {
  const assignment = await TaskAssignment.findOne({ taskId, employeeId: actorEmployee?._id });
  if (!assignment) {
    throw AppError.forbidden('You are not assigned to this task');
  }
  if (assignment.status === 'approved') {
    throw AppError.badRequest('Approved tasks cannot be modified');
  }

  const previousProgress = assignment.progress;
  const previousStatus = assignment.status;

  assignment.progress = progress;
  if (['assigned', 'revision_requested'].includes(assignment.status) && progress > 0) {
    assignment.status = 'in_progress';
    if (!assignment.startedAt) assignment.startedAt = new Date();
  }
  await assignment.save();

  await TaskUpdate.create({
    taskId,
    assignmentId: assignment._id,
    authorId: actorEmployee._id,
    type: 'progress',
    message: note || `Updated progress from ${previousProgress}% to ${progress}%`,
    previousProgress,
    newProgress: progress,
    previousStatus,
    newStatus: assignment.status,
  });

  await syncTaskStatus(taskId);

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'task.progress',
    entityType: 'task',
    entityId: taskId,
    summary: `Updated task progress to ${progress}%`,
    ipAddress,
  });

  return getTaskById({ taskId, actorUser, actorEmployee });
}

export async function addTaskComment({ taskId, message, actorUser, actorEmployee }) {
  const task = await Task.findById(taskId);
  await assertTaskAccess(task, actorUser, actorEmployee);

  const update = await TaskUpdate.create({
    taskId: task._id,
    authorId: actorEmployee._id,
    type: 'comment',
    message,
  });

  return TaskUpdate.findById(update._id).populate('authorId', 'firstName lastName email jobTitle avatarUrl');
}

export async function submitDeliverable({ taskId, payload, files = [], actorUser, actorEmployee, ipAddress }) {
  const task = await Task.findById(taskId).populate('createdBy', 'userId firstName lastName');
  if (!task) throw AppError.notFound('Task not found');

  const assignment = await TaskAssignment.findOne({ taskId: task._id, employeeId: actorEmployee?._id });
  if (!assignment) {
    throw AppError.forbidden('You are not assigned to this task');
  }
  if (assignment.status === 'approved') {
    throw AppError.badRequest('This task has already been approved');
  }

  const uploadedFiles = files.length > 0 ? await uploadFiles(files, 'worktrack/deliverables') : [];
  const externalLinks = Array.isArray(payload.externalLinks) ? payload.externalLinks : [];

  if (uploadedFiles.length === 0 && externalLinks.length === 0 && !payload.notes?.trim()) {
    throw AppError.badRequest('Please provide deliverable files, external links, or submission notes');
  }

  const lastDeliverable = await Deliverable.findOne({ assignmentId: assignment._id }).sort({ version: -1 }).lean();
  const nextVersion = (lastDeliverable?.version || 0) + 1;

  const deliverable = await Deliverable.create({
    taskId: task._id,
    assignmentId: assignment._id,
    submittedBy: actorEmployee._id,
    version: nextVersion,
    notes: payload.notes || '',
    files: uploadedFiles,
    externalLinks,
    status: 'pending_review',
    submittedAt: new Date(),
  });

  const previousStatus = assignment.status;
  assignment.status = 'submitted';
  assignment.progress = 100;
  assignment.submittedAt = new Date();
  await assignment.save();

  const reviewerEmployeeId = actorEmployee.managerId?._id || actorEmployee.managerId || task.createdBy?._id || null;

  const approval = await Approval.create({
    deliverableId: deliverable._id,
    taskId: task._id,
    assignmentId: assignment._id,
    submittedBy: actorEmployee._id,
    reviewerId: reviewerEmployeeId,
    decision: 'pending',
  });

  await TaskUpdate.create({
    taskId: task._id,
    assignmentId: assignment._id,
    authorId: actorEmployee._id,
    type: 'submission',
    message: `Submitted deliverable v${nextVersion}${payload.notes ? `: ${payload.notes}` : ''}`,
    previousStatus,
    newStatus: 'submitted',
    newProgress: 100,
  });

  await syncTaskStatus(task._id);

  // Notify reviewer / task creator
  const notifyEmployeeId = reviewerEmployeeId || task.createdBy?._id;
  if (notifyEmployeeId) {
    await createNotification({
      recipientEmployeeId: notifyEmployeeId,
      type: 'task_submitted',
      title: `Deliverable submitted: ${task.title}`,
      message: `${actorEmployee.fullName} submitted v${nextVersion} for review.`,
      entityType: 'approval',
      entityId: approval._id,
      actionUrl: `/manager/approvals/${approval._id}`,
    });
  }

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'deliverable.submit',
    entityType: 'deliverable',
    entityId: deliverable._id,
    summary: `Submitted deliverable v${nextVersion} for "${task.title}"`,
    ipAddress,
  });

  return { deliverable, approval };
}

export async function listTaskDeliverables({ taskId, actorUser, actorEmployee }) {
  const task = await Task.findById(taskId);
  await assertTaskAccess(task, actorUser, actorEmployee);

  return Deliverable.find({ taskId: task._id })
    .sort({ version: -1, createdAt: -1 })
    .populate('submittedBy', 'firstName lastName email avatarUrl')
    .lean();
}

export async function listApprovals({ query, actorUser, actorEmployee }) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const filter = {};

  if (query.decision) filter.decision = query.decision;

  if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    const createdTasks = await Task.find({ createdBy: actorEmployee?._id }).select('_id').lean();
    filter.$or = [
      { submittedBy: { $in: managedIds } },
      { reviewerId: actorEmployee?._id },
      { taskId: { $in: createdTasks.map((t) => t._id) } },
    ];
  } else if (actorUser.role === 'employee') {
    filter.submittedBy = actorEmployee?._id;
  }

  const [items, total] = await Promise.all([
    Approval.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('taskId', 'taskCode title priority dueDate status')
      .populate('deliverableId')
      .populate('submittedBy', 'firstName lastName email jobTitle avatarUrl employeeCode')
      .populate('reviewerId', 'firstName lastName email')
      .lean(),
    Approval.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getApprovalById({ approvalId, actorUser, actorEmployee }) {
  const approval = await Approval.findById(approvalId)
    .populate('taskId')
    .populate('deliverableId')
    .populate('assignmentId')
    .populate('submittedBy', 'firstName lastName email jobTitle avatarUrl employeeCode')
    .populate('reviewerId', 'firstName lastName email')
    .lean();

  if (!approval) throw AppError.notFound('Approval submission not found');

  if (actorUser.role === 'manager') {
    const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
    const isTeamSubmitter = managedIds.includes(String(approval.submittedBy?._id));
    const isTaskCreator = String(approval.taskId?.createdBy) === String(actorEmployee?._id);
    const isAssignedReviewer = String(approval.reviewerId?._id) === String(actorEmployee?._id);
    if (!isTeamSubmitter && !isTaskCreator && !isAssignedReviewer) {
      throw AppError.forbidden('You are not authorized to review this submission');
    }
  } else if (actorUser.role === 'employee') {
    if (String(approval.submittedBy?._id) !== String(actorEmployee?._id)) {
      throw AppError.forbidden('You do not have access to this submission');
    }
  }

  const history = await Deliverable.find({ assignmentId: approval.assignmentId?._id })
    .sort({ version: -1 })
    .lean();

  return { ...approval, versionHistory: history };
}

async function assertReviewerAuthorization(approval, actorUser, actorEmployee) {
  if (actorUser.role === 'admin') return;
  if (actorUser.role !== 'manager') {
    throw AppError.forbidden('Only managers or administrators can review submissions');
  }
  const managedIds = await getManagedEmployeeIds(actorEmployee?._id);
  const task = await Task.findById(approval.taskId).lean();
  const isTeamSubmitter = managedIds.includes(String(approval.submittedBy));
  const isTaskCreator = task && String(task.createdBy) === String(actorEmployee?._id);
  if (!isTeamSubmitter && !isTaskCreator) {
    throw AppError.forbidden('You can only review submissions from your own team');
  }
}

export async function reviewApproval({ approvalId, decision, comments, actorUser, actorEmployee, ipAddress }) {
  const approval = await Approval.findById(approvalId);
  if (!approval) throw AppError.notFound('Approval record not found');

  await assertReviewerAuthorization(approval, actorUser, actorEmployee);

  if (approval.decision !== 'pending') {
    throw AppError.badRequest(`This submission has already been marked as "${approval.decision}"`);
  }

  approval.decision = decision;
  approval.comments = comments || '';
  approval.reviewerId = actorEmployee._id;
  approval.reviewedAt = new Date();
  await approval.save();

  const deliverable = await Deliverable.findByIdAndUpdate(
    approval.deliverableId,
    { status: decision },
    { new: true }
  );

  const assignment = await TaskAssignment.findById(approval.assignmentId);
  const previousStatus = assignment.status;
  assignment.status = decision === 'approved' ? 'approved' : 'revision_requested';
  if (decision === 'approved') {
    assignment.progress = 100;
    assignment.completedAt = new Date();
  } else {
    assignment.progress = Math.min(assignment.progress, 80);
  }
  await assignment.save();

  await TaskUpdate.create({
    taskId: approval.taskId,
    assignmentId: assignment._id,
    authorId: actorEmployee._id,
    type: 'review',
    message:
      decision === 'approved'
        ? `Approved deliverable v${deliverable?.version || 1}${comments ? `: ${comments}` : ''}`
        : `Requested revision on v${deliverable?.version || 1}: ${comments}`,
    previousStatus,
    newStatus: assignment.status,
  });

  await syncTaskStatus(approval.taskId);

  const task = await Task.findById(approval.taskId).lean();
  await createNotification({
    recipientEmployeeId: approval.submittedBy,
    type: decision === 'approved' ? 'task_approved' : 'revision_requested',
    title: decision === 'approved' ? `Task approved: ${task?.title}` : `Revision requested: ${task?.title}`,
    message:
      comments ||
      (decision === 'approved'
        ? `${actorEmployee.fullName} approved your deliverable.`
        : `${actorEmployee.fullName} requested revisions on your deliverable.`),
    entityType: 'task',
    entityId: approval.taskId,
    actionUrl: `/employee/tasks/${approval.taskId}`,
  });

  await logActivity({
    actorUser,
    actorEmployee,
    action: decision === 'approved' ? 'approval.approve' : 'approval.request_revision',
    entityType: 'approval',
    entityId: approval._id,
    summary: `${decision === 'approved' ? 'Approved' : 'Requested revision for'} "${task?.title || 'task'}"`,
    ipAddress,
  });

  return getApprovalById({ approvalId: approval._id, actorUser, actorEmployee });
}
