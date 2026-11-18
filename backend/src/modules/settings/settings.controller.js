import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as settingsService from './settings.service.js';

export const getOrganization = asyncHandler(async (_req, res) => {
  const settings = await settingsService.getOrganizationSettings();
  return sendSuccess(res, { data: settings });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateOrganizationSettings(req.body, req.user, req.employee, req.ip);
  return sendSuccess(res, { data: settings, message: 'Organization settings updated' });
});

export const listRoles = asyncHandler(async (_req, res) => {
  const roles = await settingsService.listRolePermissions();
  return sendSuccess(res, { data: roles });
});

export const updateRole = asyncHandler(async (req, res) => {
  const updated = await settingsService.updateRolePermissions(
    req.params.role,
    req.body.permissions,
    req.user,
    req.employee,
    req.ip
  );
  return sendSuccess(res, { data: updated, message: `Permissions updated for ${req.params.role}` });
});
