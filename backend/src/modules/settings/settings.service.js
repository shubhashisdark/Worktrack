import { OrganizationSettings } from './organizationSettings.model.js';
import { RolePermission, DEFAULT_ROLE_PERMISSIONS } from './rolePermission.model.js';
import { AppError } from '../../utils/AppError.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

export async function getOrganizationSettings() {
  let settings = await OrganizationSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await OrganizationSettings.create({ key: 'default' });
  }
  return settings;
}

export async function updateOrganizationSettings(payload, actorUser, actorEmployee, ipAddress) {
  const settings = await getOrganizationSettings();
  Object.assign(settings, payload);
  await settings.save();

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'settings.update_organization',
    entityType: 'organizationSettings',
    entityId: settings._id,
    summary: `Updated organization settings (${settings.organizationName})`,
    ipAddress,
  });

  return settings;
}

export async function listRolePermissions() {
  const roles = ['employee', 'manager', 'admin'];
  const existing = await RolePermission.find().lean();
  const map = new Map(existing.map((doc) => [doc.role, doc]));

  const result = [];
  for (const role of roles) {
    if (!map.has(role)) {
      const created = await RolePermission.create({
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
      });
      result.push({
        role: created.role,
        permissions: Object.fromEntries(created.permissions.entries()),
        updatedAt: created.updatedAt,
      });
    } else {
      const doc = map.get(role);
      result.push({
        role: doc.role,
        permissions: doc.permissions || DEFAULT_ROLE_PERMISSIONS[role],
        updatedAt: doc.updatedAt,
      });
    }
  }
  return result;
}

export async function updateRolePermissions(role, permissions, actorUser, actorEmployee, ipAddress) {
  if (!['employee', 'manager', 'admin'].includes(role)) {
    throw AppError.badRequest('Invalid role');
  }
  const updated = await RolePermission.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: actorUser._id },
    { upsert: true, new: true }
  );

  await logActivity({
    actorUser,
    actorEmployee,
    action: 'settings.update_role_permissions',
    entityType: 'rolePermission',
    entityId: updated._id,
    summary: `Updated permissions for role "${role}"`,
    ipAddress,
  });

  return {
    role: updated.role,
    permissions: Object.fromEntries(updated.permissions.entries()),
    updatedAt: updated.updatedAt,
  };
}
