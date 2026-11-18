import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as leaveService from './leave.service.js';

export const create = asyncHandler(async (req, res) => {
  const leave = await leaveService.createLeaveRequest({
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: leave, message: 'Leave request submitted' });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await leaveService.listLeaveRequests({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});

export const approve = asyncHandler(async (req, res) => {
  const leave = await leaveService.reviewLeaveRequest({
    leaveId: req.params.id,
    status: 'approved',
    decisionNotes: req.body.decisionNotes,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: leave, message: 'Leave request approved' });
});

export const reject = asyncHandler(async (req, res) => {
  const leave = await leaveService.reviewLeaveRequest({
    leaveId: req.params.id,
    status: 'rejected',
    decisionNotes: req.body.decisionNotes,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: leave, message: 'Leave request rejected' });
});

export const cancel = asyncHandler(async (req, res) => {
  const leave = await leaveService.cancelLeaveRequest({
    leaveId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: leave, message: 'Leave request cancelled' });
});
