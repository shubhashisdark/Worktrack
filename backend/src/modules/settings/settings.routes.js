import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateOrgSettingsSchema, updateRolePermissionsSchema } from './settings.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/organization', settingsController.getOrganization);
router.patch('/organization', requireRole('admin'), validate(updateOrgSettingsSchema), settingsController.updateOrganization);
router.get('/roles', requireRole('admin'), settingsController.listRoles);
router.patch('/roles/:role', requireRole('admin'), validate(updateRolePermissionsSchema), settingsController.updateRole);

export default router;
