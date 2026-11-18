import React from 'react';
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  Clock,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  User,
} from 'lucide-react';
import { PortalShell } from './PortalShell';

const EMPLOYEE_NAV = [
  { label: 'Overview', to: '/employee/dashboard', icon: LayoutDashboard, end: true },
  { label: 'My Tasks', to: '/employee/tasks', icon: CheckSquare },
  { label: 'Daily Reports', to: '/employee/daily-reports', icon: FileText },
  { label: 'Attendance', to: '/employee/attendance', icon: Clock },
  { label: 'Leave Requests', to: '/employee/leave', icon: CalendarDays },
  { label: 'Feedback', to: '/employee/feedback', icon: MessageSquare },
  { label: 'My Performance', to: '/employee/performance', icon: BarChart3 },
  { label: 'Notifications', to: '/employee/notifications', icon: Bell },
  { label: 'My Profile', to: '/employee/profile', icon: User },
  { label: 'Settings', to: '/employee/settings', icon: Settings },
];

export function EmployeeLayout() {
  return (
    <PortalShell
      portalLabel="Employee Portal"
      navItems={EMPLOYEE_NAV}
      profilePath="/employee/profile"
      settingsPath="/employee/settings"
      notificationsPath="/employee/notifications"
    />
  );
}
