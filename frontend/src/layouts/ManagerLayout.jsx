import React from 'react';
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CheckSquare,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import { PortalShell } from './PortalShell';

const MANAGER_NAV = [
  { label: 'Overview', to: '/manager/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Team Members', to: '/manager/team', icon: Users },
  { label: 'Task Management', to: '/manager/tasks', icon: CheckSquare },
  { label: 'Task Approvals', to: '/manager/approvals', icon: ClipboardCheck },
  { label: 'Attendance', to: '/manager/attendance', icon: Clock },
  { label: 'Leave Requests', to: '/manager/leave', icon: CalendarCheck },
  { label: 'Daily Reports', to: '/manager/daily-reports', icon: FileText },
  { label: 'Performance', to: '/manager/performance', icon: BarChart3 },
  { label: 'Reports', to: '/manager/reports', icon: FileSpreadsheet },
  { label: 'Notifications', to: '/manager/notifications', icon: Bell },
  { label: 'Settings', to: '/manager/settings', icon: Settings },
];

export function ManagerLayout() {
  return (
    <PortalShell
      portalLabel="Manager Portal"
      navItems={MANAGER_NAV}
      profilePath="/manager/settings"
      settingsPath="/manager/settings"
      notificationsPath="/manager/notifications"
    />
  );
}
