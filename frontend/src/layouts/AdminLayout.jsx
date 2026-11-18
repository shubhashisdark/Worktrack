import React from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { PortalShell } from './PortalShell';

const ADMIN_NAV = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Employees', to: '/admin/employees', icon: Users },
  { label: 'Departments', to: '/admin/departments', icon: Building2 },
  { label: 'Managers', to: '/admin/managers', icon: UserCog },
  { label: 'Roles & Permissions', to: '/admin/roles', icon: Shield },
  { label: 'Tasks', to: '/admin/tasks', icon: CheckSquare },
  { label: 'Attendance', to: '/admin/attendance', icon: Clock },
  { label: 'Leave Management', to: '/admin/leave', icon: CalendarDays },
  { label: 'Performance Reports', to: '/admin/performance', icon: BarChart3 },
  { label: 'Activity Logs', to: '/admin/activity-logs', icon: Activity },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Organization Settings', to: '/admin/settings', icon: Settings },
  { label: 'My Profile', to: '/admin/profile', icon: User },
];

export function AdminLayout() {
  return (
    <PortalShell
      portalLabel="Admin Portal"
      navItems={ADMIN_NAV}
      profilePath="/admin/profile"
      settingsPath="/admin/settings"
      notificationsPath="/admin/notifications"
    />
  );
}
