import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as attendanceService from './attendance.service.js';

export const checkIn = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkIn({
    actorUser: req.user,
    actorEmployee: req.employee,
    notes: req.body.notes,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: record, message: 'Checked in successfully' });
});

export const checkOut = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkOut({
    actorUser: req.user,
    actorEmployee: req.employee,
    notes: req.body.notes,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: record, message: 'Checked out successfully' });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await attendanceService.listAttendance({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});

export const history = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendanceHistory({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: result });
});

export const adjust = asyncHandler(async (req, res) => {
  const record = await attendanceService.adjustAttendance({
    attendanceId: req.params.id,
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: record, message: 'Attendance record updated' });
});
