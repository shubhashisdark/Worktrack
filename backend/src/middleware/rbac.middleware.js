import { AppError } from '../utils/AppError.js';

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to access this resource'));
    }
    return next();
  };
}

export function requirePermission(permissionKey) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (req.user.role === 'admin') return next();
    if (!req.permissions?.[permissionKey]) {
      return next(AppError.forbidden(`Missing required permission: ${permissionKey}`));
    }
    return next();
  };
}
