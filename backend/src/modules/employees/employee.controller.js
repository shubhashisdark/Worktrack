import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as employeeService from './employee.service.js';
import { uploadFile } from '../../utils/storage.js';
import { AppError } from '../../utils/AppError.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await employeeService.listEmployees({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById({
    employeeId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: employee });
});

export const create = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee({
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: employee, message: 'Employee created successfully' });
});

export const update = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee({
    employeeId: req.params.id,
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: employee, message: 'Employee updated successfully' });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('Avatar image file is required');
  const uploaded = await uploadFile(req.file, 'worktrack/avatars');
  const employee = await employeeService.updateEmployee({
    employeeId: req.params.id,
    payload: { avatarUrl: uploaded.url },
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: employee, message: 'Avatar updated successfully' });
});

export const deactivate = asyncHandler(async (req, res) => {
  const employee = await employeeService.deactivateEmployee({
    employeeId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: employee, message: 'Employee deactivated successfully' });
});

export const bulkStatus = asyncHandler(async (req, res) => {
  const result = await employeeService.bulkUpdateEmployeeStatus({
    ...req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: result, message: 'Employee statuses updated' });
});
