import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authRateLimiter } from '../../middleware/rateLimit.middleware.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updatePreferencesSchema,
} from './auth.validation.js';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.patch('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.patch('/preferences', requireAuth, validate(updatePreferencesSchema), authController.updatePreferences);

export default router;
