import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';

import { AuthLayout } from '@/layouts/AuthLayout';
import { EmployeeLayout } from '@/layouts/EmployeeLayout';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import { LandingPage } from '@/pages/public/LandingPage';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/pages/auth/AuthPages';
import { AccountSettingsPage, ForbiddenPage, NotFoundPage, NotificationsPage, ProfilePage } from '@/pages/shared/SystemPages';
import { TaskDetailPage } from '@/pages/shared/TaskDetailPage';

import { EmployeeDashboardPage } from '@/pages/employee/EmployeeDashboardPage';
import { EmployeeTasksPage } from '@/pages/employee/EmployeeTasksPage';
import { CreateDailyReportPage, DailyReportDetailPage, EmployeeDailyReportsPage } from '@/pages/employee/EmployeeDailyReportsPage';
import { EmployeeAttendancePage } from '@/pages/employee/EmployeeAttendancePage';
import { EmployeeLeavePage } from '@/pages/employee/EmployeeLeavePage';
import { EmployeeFeedbackPage, EmployeePerformancePage } from '@/pages/employee/EmployeePerformanceFeedbackPage';

import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { ManagerEmployeeDetailPage, ManagerTeamPage } from '@/pages/manager/ManagerTeamPage';
import { ManagerApprovalsPage, ManagerReviewDetailPage, ManagerTasksPage } from '@/pages/manager/ManagerTasksPage';
import { LeaveApprovalsPage, ManagerDailyReportsPage, TeamAttendancePage } from '@/pages/manager/ManagerAttendanceLeavePage';
import { EmployeePerformanceDetailPage, ManagerReportsPage, TeamPerformancePage } from '@/pages/manager/ManagerPerformanceReportsPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage';
import { AdminDepartmentDetailPage, AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage';
import { AdminActivityLogsPage, AdminOrgSettingsPage, AdminRolesPage } from '@/pages/admin/AdminRolesSettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Authentication */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Employee Portal */}
      <Route element={<ProtectedRoute allowedRoles={['employee', 'manager', 'admin']} />}>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboardPage />} />
          <Route path="tasks" element={<EmployeeTasksPage />} />
          <Route path="tasks/history" element={<EmployeeTasksPage historyOnly />} />
          <Route path="tasks/:id" element={<TaskDetailPage rolePrefix="employee" />} />
          <Route path="daily-reports" element={<EmployeeDailyReportsPage />} />
          <Route path="daily-reports/new" element={<CreateDailyReportPage />} />
          <Route path="daily-reports/:id" element={<DailyReportDetailPage backPath="/employee/daily-reports" />} />
          <Route path="attendance" element={<EmployeeAttendancePage />} />
          <Route path="attendance/calendar" element={<EmployeeAttendancePage calendarView />} />
          <Route path="leave" element={<EmployeeLeavePage />} />
          <Route path="leave/history" element={<EmployeeLeavePage historyOnly />} />
          <Route path="feedback" element={<EmployeeFeedbackPage />} />
          <Route path="performance" element={<EmployeePerformancePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<AccountSettingsPage title="Account Settings" />} />
        </Route>
      </Route>

      {/* Manager Portal */}
      <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="team" element={<ManagerTeamPage />} />
          <Route path="team/:id" element={<ManagerEmployeeDetailPage rolePrefix="manager" />} />
          <Route path="tasks" element={<ManagerTasksPage rolePrefix="manager" title="Task Management" />} />
          <Route path="tasks/:id" element={<TaskDetailPage rolePrefix="manager" />} />
          <Route path="approvals" element={<ManagerApprovalsPage />} />
          <Route path="approvals/:id" element={<ManagerReviewDetailPage />} />
          <Route path="attendance" element={<TeamAttendancePage />} />
          <Route path="leave" element={<LeaveApprovalsPage />} />
          <Route path="daily-reports" element={<ManagerDailyReportsPage />} />
          <Route path="performance" element={<TeamPerformancePage rolePrefix="manager" title="Team Performance" />} />
          <Route path="performance/:id" element={<EmployeePerformanceDetailPage rolePrefix="manager" />} />
          <Route path="reports" element={<ManagerReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<AccountSettingsPage title="Manager Settings" />} />
        </Route>
      </Route>

      {/* Admin Portal */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="employees/:id" element={<ManagerEmployeeDetailPage rolePrefix="admin" />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route path="departments/:id" element={<AdminDepartmentDetailPage />} />
          <Route path="managers" element={<AdminEmployeesPage managersOnly />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="tasks" element={<ManagerTasksPage rolePrefix="admin" title="All Organization Tasks" />} />
          <Route path="tasks/:id" element={<TaskDetailPage rolePrefix="admin" />} />
          <Route
            path="attendance"
            element={
              <TeamAttendancePage
                title="Attendance Management"
                subtitle="Organization-wide daily attendance records, late check-ins, and checkout adjustments."
              />
            }
          />
          <Route
            path="leave"
            element={
              <LeaveApprovalsPage
                title="Leave Management"
                subtitle="Review and oversee leave requests across all departments."
              />
            }
          />
          <Route path="performance" element={<TeamPerformancePage rolePrefix="admin" title="Performance Reports" />} />
          <Route path="performance/:id" element={<EmployeePerformanceDetailPage rolePrefix="admin" />} />
          <Route path="activity-logs" element={<AdminActivityLogsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<AdminOrgSettingsPage />} />
          <Route
            path="profile"
            element={
              <div className="space-y-6">
                <ProfilePage />
                <AccountSettingsPage title="Security & Preferences" />
              </div>
            }
          />
        </Route>
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
