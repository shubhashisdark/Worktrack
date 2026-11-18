import mongoose from 'mongoose';

export const DEFAULT_ROLE_PERMISSIONS = {
  employee: {
    'tasks:read_own': true,
    'tasks:update_progress': true,
    'deliverables:submit': true,
    'attendance:check_in_out': true,
    'leave:apply': true,
    'daily_reports:create': true,
    'performance:read_own': true,
    'feedback:read_own': true,
  },
  manager: {
    'team:read': true,
    'tasks:create': true,
    'tasks:edit': true,
    'tasks:assign': true,
    'tasks:archive': true,
    'approvals:review': true,
    'attendance:read_team': true,
    'attendance:adjust_team': true,
    'leave:review_team': true,
    'daily_reports:read_team': true,
    'feedback:create': true,
    'performance:read_team': true,
    'reports:export_team': true,
  },
  admin: {
    'employees:manage': true,
    'departments:manage': true,
    'managers:manage': true,
    'roles:manage': true,
    'tasks:manage_all': true,
    'attendance:manage_all': true,
    'leave:manage_all': true,
    'performance:read_all': true,
    'activity_logs:read': true,
    'settings:manage': true,
  },
};

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      required: true,
      unique: true,
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: () => ({}),
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
