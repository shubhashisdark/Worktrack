import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as departmentService from './department.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await departmentService.listDepartments({ query: req.query });
  return sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  return sendSuccess(res, { data: department });
});

export const create = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment({
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: department, message: 'Department created successfully' });
});

export const update = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment({
    departmentId: req.params.id,
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: department, message: 'Department updated successfully' });
});

export const deactivate = asyncHandler(async (req, res) => {
  const department = await departmentService.deactivateDepartment({
    departmentId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: department, message: 'Department deactivated successfully' });
});
