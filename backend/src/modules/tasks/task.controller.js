import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as taskService from './task.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await taskService.listTasks({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById({
    taskId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: task });
});

export const create = asyncHandler(async (req, res) => {
  // Support multipart form-data where arrays may arrive as JSON strings
  const payload = { ...req.body };
  if (typeof payload.assigneeIds === 'string') {
    try {
      payload.assigneeIds = JSON.parse(payload.assigneeIds);
    } catch {
      payload.assigneeIds = payload.assigneeIds ? [payload.assigneeIds] : [];
    }
  }
  if (typeof payload.tags === 'string') {
    try {
      payload.tags = JSON.parse(payload.tags);
    } catch {
      payload.tags = payload.tags ? payload.tags.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  }

  const task = await taskService.createTask({
    payload,
    files: req.files || [],
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: task, message: 'Task created successfully' });
});

export const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    taskId: req.params.id,
    payload: req.body,
    files: req.files || [],
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: task, message: 'Task updated successfully' });
});

export const archive = asyncHandler(async (req, res) => {
  const task = await taskService.archiveTask({
    taskId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: task, message: 'Task archived successfully' });
});

export const assign = asyncHandler(async (req, res) => {
  const task = await taskService.assignEmployeesToTask({
    taskId: req.params.id,
    employeeIds: req.body.employeeIds,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: task, message: 'Task assigned successfully' });
});

export const updateProgress = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskProgress({
    taskId: req.params.id,
    progress: req.body.progress,
    note: req.body.note,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: task, message: 'Progress updated' });
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await taskService.addTaskComment({
    taskId: req.params.id,
    message: req.body.message,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { statusCode: 201, data: comment, message: 'Comment added' });
});

export const submitDeliverable = asyncHandler(async (req, res) => {
  const result = await taskService.submitDeliverable({
    taskId: req.params.id,
    payload: req.body,
    files: req.files || [],
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: result, message: 'Deliverable submitted for review' });
});

export const listDeliverables = asyncHandler(async (req, res) => {
  const items = await taskService.listTaskDeliverables({
    taskId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items });
});

export const listApprovals = asyncHandler(async (req, res) => {
  const { items, meta } = await taskService.listApprovals({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});

export const getApproval = asyncHandler(async (req, res) => {
  const item = await taskService.getApprovalById({
    approvalId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: item });
});

export const approveSubmission = asyncHandler(async (req, res) => {
  const item = await taskService.reviewApproval({
    approvalId: req.params.id,
    decision: 'approved',
    comments: req.body.comments,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: item, message: 'Submission approved' });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const item = await taskService.reviewApproval({
    approvalId: req.params.id,
    decision: 'revision_requested',
    comments: req.body.comments,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: item, message: 'Revision requested' });
});
