import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Employee } from '../modules/employees/employee.model.js';
import { Department } from '../modules/departments/department.model.js';
import { Task } from '../modules/tasks/task.model.js';
import { TaskAssignment } from '../modules/tasks/taskAssignment.model.js';
import { TaskUpdate } from '../modules/tasks/taskUpdate.model.js';
import { Deliverable } from '../modules/tasks/deliverable.model.js';
import { Approval } from '../modules/tasks/approval.model.js';
import { Attendance } from '../modules/attendance/attendance.model.js';
import { LeaveRequest } from '../modules/leave/leaveRequest.model.js';
import { DailyReport } from '../modules/daily-reports/dailyReport.model.js';
import { Feedback } from '../modules/feedback/feedback.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { ActivityLog } from '../modules/activity-logs/activityLog.model.js';
import { OrganizationSettings } from '../modules/settings/organizationSettings.model.js';
import { RolePermission, DEFAULT_ROLE_PERMISSIONS } from '../modules/settings/rolePermission.model.js';

export async function ensureCoreDefaults(organizationName = 'WorkTrack') {
  const existingSettings = await OrganizationSettings.findOne({ key: 'default' });
  if (!existingSettings) {
    await OrganizationSettings.create({
      key: 'default',
      organizationName,
      timezone: 'UTC',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateThresholdMinutes: 15,
    });
  }

  for (const role of ['employee', 'manager', 'admin']) {
    const existingRole = await RolePermission.findOne({ role });
    if (!existingRole) {
      await RolePermission.create({
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
      });
    }
  }
}

export async function purgeDemoData() {
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    Task.deleteMany({}),
    TaskAssignment.deleteMany({}),
    TaskUpdate.deleteMany({}),
    Deliverable.deleteMany({}),
    Approval.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    DailyReport.deleteMany({}),
    Feedback.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
    OrganizationSettings.deleteMany({}),
    RolePermission.deleteMany({}),
  ]);
}

export async function bootstrapProduction({
  clean = false,
  organizationName = process.env.ORGANIZATION_NAME || 'WorkTrack',
  adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@worktrack.io',
  adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMe@12345',
  adminFirstName = process.env.INITIAL_ADMIN_FIRST_NAME || 'System',
  adminLastName = process.env.INITIAL_ADMIN_LAST_NAME || 'Administrator',
} = {}) {
  if (clean) {
    await purgeDemoData();
  }

  await ensureCoreDefaults(organizationName);

  const normalizedEmail = adminEmail.toLowerCase().trim();
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return { created: false, email: existingAdmin.email };
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: 'admin',
    isActive: true,
  });

  await Employee.create({
    userId: user._id,
    employeeCode: 'WT-001',
    firstName: adminFirstName,
    lastName: adminLastName,
    email: normalizedEmail,
    jobTitle: 'Organization Administrator',
    employmentType: 'full_time',
    status: 'active',
    location: 'Headquarters',
    hireDate: new Date(),
  });

  return { created: true, email: normalizedEmail };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const clean = process.argv.includes('--clean');
  connectDB()
    .then(() => bootstrapProduction({ clean }))
    .then((res) => {
      console.log(
        res.created
          ? `[BOOTSTRAP] Production database initialized cleanly. Admin account created: ${res.email}`
          : `[BOOTSTRAP] Admin already exists (${res.email}). Core defaults verified.`
      );
      return disconnectDB();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[BOOTSTRAP] Failed:', err);
      process.exit(1);
    });
}
