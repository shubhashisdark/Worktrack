import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { Employee } from '../modules/employees/employee.model.js';
import { RolePermission, DEFAULT_ROLE_PERMISSIONS } from '../modules/settings/rolePermission.model.js';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(req, _res, next) {
  try {
    let token = req.cookies?.[env.cookieName];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication required. Please sign in.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      return next(AppError.unauthorized('Session expired or invalid. Please sign in again.'));
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return next(AppError.unauthorized('Account is inactive or no longer exists.'));
    }

    const employee = await Employee.findOne({ userId: user._id })
      .populate('departmentId', 'name code managerId')
      .populate('managerId', 'firstName lastName email jobTitle avatarUrl');

    const rolePermDoc = await RolePermission.findOne({ role: user.role }).lean();
    const permissions = rolePermDoc?.permissions
      ? Object.fromEntries(Object.entries(rolePermDoc.permissions))
      : { ...(DEFAULT_ROLE_PERMISSIONS[user.role] || {}) };

    req.user = user;
    req.employee = employee;
    req.permissions = permissions;
    next();
  } catch (err) {
    next(err);
  }
}
