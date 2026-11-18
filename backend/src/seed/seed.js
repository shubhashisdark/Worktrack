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

export async function seedDatabase({ reset = false } = {}) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run demo seed script in production. Use "npm run bootstrap:prod" instead.');
  }
  if (reset) {
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

  await OrganizationSettings.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      organizationName: 'WorkTrack Enterprise',
      timezone: 'UTC',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateThresholdMinutes: 15,
    },
    { upsert: true, new: true }
  );

  for (const role of ['employee', 'manager', 'admin']) {
    await RolePermission.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }

  const passwordHash = await bcrypt.hash('WorkTrack@123', 10);

  // Create Departments
  const [engDept, designDept, opsDept] = await Department.create([
    { name: 'Engineering', code: 'ENG', description: 'Core product engineering & platform infrastructure' },
    { name: 'Product Design', code: 'DES', description: 'UX architecture, research, and design systems' },
    { name: 'Operations', code: 'OPS', description: 'Customer operations, QA, and business workflows' },
  ]);

  // Create Users
  const [adminUser, engMgrUser, desMgrUser, emp1User, emp2User, emp3User, emp4User] = await User.create([
    { email: 'admin@worktrack.io', passwordHash, role: 'admin' },
    { email: 'manager@worktrack.io', passwordHash, role: 'manager' },
    { email: 'claire.bennett@worktrack.io', passwordHash, role: 'manager' },
    { email: 'employee@worktrack.io', passwordHash, role: 'employee' },
    { email: 'daniel.park@worktrack.io', passwordHash, role: 'employee' },
    { email: 'priya.sharma@worktrack.io', passwordHash, role: 'employee' },
    { email: 'marcus.chen@worktrack.io', passwordHash, role: 'employee' },
  ]);

  // Create Employees
  const adminEmp = await Employee.create({
    userId: adminUser._id,
    employeeCode: 'WT-100',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'admin@worktrack.io',
    phone: '+1 (415) 555-0100',
    jobTitle: 'VP of People & Operations',
    departmentId: opsDept._id,
    location: 'San Francisco, CA',
    hireDate: new Date('2022-03-15'),
  });

  const engMgrEmp = await Employee.create({
    userId: engMgrUser._id,
    employeeCode: 'WT-101',
    firstName: 'David',
    lastName: 'Kowalski',
    email: 'manager@worktrack.io',
    phone: '+1 (415) 555-0101',
    jobTitle: 'Engineering Manager',
    departmentId: engDept._id,
    managerId: adminEmp._id,
    location: 'New York, NY',
    hireDate: new Date('2022-08-01'),
  });

  const desMgrEmp = await Employee.create({
    userId: desMgrUser._id,
    employeeCode: 'WT-102',
    firstName: 'Claire',
    lastName: 'Bennett',
    email: 'claire.bennett@worktrack.io',
    phone: '+1 (415) 555-0102',
    jobTitle: 'Design Director',
    departmentId: designDept._id,
    managerId: adminEmp._id,
    location: 'Austin, TX',
    hireDate: new Date('2023-01-10'),
  });

  engDept.managerId = engMgrEmp._id;
  desMgrEmp && (designDept.managerId = desMgrEmp._id);
  opsDept.managerId = adminEmp._id;
  await Promise.all([engDept.save(), designDept.save(), opsDept.save()]);

  const [emp1, emp2, emp3, emp4] = await Employee.create([
    {
      userId: emp1User._id,
      employeeCode: 'WT-103',
      firstName: 'Maya',
      lastName: 'Lin',
      email: 'employee@worktrack.io',
      phone: '+1 (415) 555-0103',
      jobTitle: 'Senior Frontend Engineer',
      departmentId: engDept._id,
      managerId: engMgrEmp._id,
      location: 'Seattle, WA',
      hireDate: new Date('2023-05-12'),
    },
    {
      userId: emp2User._id,
      employeeCode: 'WT-104',
      firstName: 'Daniel',
      lastName: 'Park',
      email: 'daniel.park@worktrack.io',
      phone: '+1 (415) 555-0104',
      jobTitle: 'Backend Engineer',
      departmentId: engDept._id,
      managerId: engMgrEmp._id,
      location: 'Chicago, IL',
      hireDate: new Date('2023-09-01'),
    },
    {
      userId: emp3User._id,
      employeeCode: 'WT-105',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@worktrack.io',
      phone: '+1 (415) 555-0105',
      jobTitle: 'QA Automation Engineer',
      departmentId: engDept._id,
      managerId: engMgrEmp._id,
      location: 'Remote',
      hireDate: new Date('2024-01-15'),
    },
    {
      userId: emp4User._id,
      employeeCode: 'WT-106',
      firstName: 'Marcus',
      lastName: 'Chen',
      email: 'marcus.chen@worktrack.io',
      phone: '+1 (415) 555-0106',
      jobTitle: 'Product Designer',
      departmentId: designDept._id,
      managerId: desMgrEmp._id,
      location: 'San Francisco, CA',
      hireDate: new Date('2024-02-20'),
    },
  ]);

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Create Realistic Tasks & Assignments
  const [task1, task2, task3, task4, task5] = await Task.create([
    {
      taskCode: 'TSK-1001',
      title: 'Implement OAuth2 SSO login flow & session refresh',
      description: 'Integrate enterprise SAML/OAuth2 sign-in with secure HttpOnly cookie rotation and fallback error states.',
      createdBy: engMgrEmp._id,
      departmentId: engDept._id,
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(now.getTime() + 3 * dayMs),
      tags: ['auth', 'security'],
    },
    {
      taskCode: 'TSK-1002',
      title: 'Audit data table pagination & server-side sorting',
      description: 'Verify consistent query parameters, keyboard navigation, and empty states across employee and task tables.',
      createdBy: engMgrEmp._id,
      departmentId: engDept._id,
      priority: 'medium',
      status: 'submitted',
      dueDate: new Date(now.getTime() + 1 * dayMs),
      tags: ['frontend', 'tables'],
    },
    {
      taskCode: 'TSK-1003',
      title: 'Optimize MongoDB indexes for attendance & reporting queries',
      description: 'Add compound indexes on employeeId+date and benchmark 30-day team performance aggregation.',
      createdBy: engMgrEmp._id,
      departmentId: engDept._id,
      priority: 'urgent',
      status: 'approved',
      dueDate: new Date(now.getTime() - 2 * dayMs),
      tags: ['database', 'performance'],
    },
    {
      taskCode: 'TSK-1004',
      title: 'Write E2E regression tests for leave approval workflow',
      description: 'Cover leave overlap validation, balance deduction, and manager rejection notes.',
      createdBy: engMgrEmp._id,
      departmentId: engDept._id,
      priority: 'high',
      status: 'assigned',
      dueDate: new Date(now.getTime() - 1 * dayMs), // Overdue example
      tags: ['qa', 'leave'],
    },
    {
      taskCode: 'TSK-1005',
      title: 'Finalize Q4 design system component tokens',
      description: 'Document spacing scale, semantic badges, and responsive drawer patterns for engineering handoff.',
      createdBy: desMgrEmp._id,
      departmentId: designDept._id,
      priority: 'medium',
      status: 'in_progress',
      dueDate: new Date(now.getTime() + 5 * dayMs),
      tags: ['design-system'],
    },
  ]);

  const [a1, a2, a3, a4, a5] = await TaskAssignment.create([
    {
      taskId: task1._id,
      employeeId: emp1._id,
      assignedBy: engMgrEmp._id,
      status: 'in_progress',
      progress: 65,
      startedAt: new Date(now.getTime() - 2 * dayMs),
    },
    {
      taskId: task2._id,
      employeeId: emp1._id,
      assignedBy: engMgrEmp._id,
      status: 'submitted',
      progress: 100,
      startedAt: new Date(now.getTime() - 4 * dayMs),
      submittedAt: new Date(now.getTime() - 3 * 3600 * 1000),
    },
    {
      taskId: task3._id,
      employeeId: emp2._id,
      assignedBy: engMgrEmp._id,
      status: 'approved',
      progress: 100,
      startedAt: new Date(now.getTime() - 6 * dayMs),
      submittedAt: new Date(now.getTime() - 3 * dayMs),
      completedAt: new Date(now.getTime() - 2.5 * dayMs),
    },
    {
      taskId: task4._id,
      employeeId: emp3._id,
      assignedBy: engMgrEmp._id,
      status: 'assigned',
      progress: 15,
    },
    {
      taskId: task5._id,
      employeeId: emp4._id,
      assignedBy: desMgrEmp._id,
      status: 'in_progress',
      progress: 50,
      startedAt: new Date(now.getTime() - 1 * dayMs),
    },
  ]);

  // Deliverable + Approval records
  const delivPending = await Deliverable.create({
    taskId: task2._id,
    assignmentId: a2._id,
    submittedBy: emp1._id,
    version: 1,
    notes: 'Completed pagination audit across all tables, unified query params, and verified responsive scroll behavior.',
    externalLinks: [{ label: 'Pull Request #142', url: 'https://github.com/worktrack/app/pull/142' }],
    status: 'pending_review',
    submittedAt: new Date(now.getTime() - 3 * 3600 * 1000),
  });

  await Approval.create({
    deliverableId: delivPending._id,
    taskId: task2._id,
    assignmentId: a2._id,
    submittedBy: emp1._id,
    reviewerId: engMgrEmp._id,
    decision: 'pending',
  });

  const delivApproved = await Deliverable.create({
    taskId: task3._id,
    assignmentId: a3._id,
    submittedBy: emp2._id,
    version: 1,
    notes: 'Added compound indexes and reduced p95 reporting query time from 420ms to 38ms.',
    externalLinks: [{ label: 'Benchmark Report', url: 'https://docs.worktrack.local/benchmarks/q4' }],
    status: 'approved',
    submittedAt: new Date(now.getTime() - 3 * dayMs),
  });

  await Approval.create({
    deliverableId: delivApproved._id,
    taskId: task3._id,
    assignmentId: a3._id,
    submittedBy: emp2._id,
    reviewerId: engMgrEmp._id,
    decision: 'approved',
    comments: 'Solid benchmark numbers and clean migration. Approved.',
    reviewedAt: new Date(now.getTime() - 2.5 * dayMs),
  });

  await TaskUpdate.create([
    {
      taskId: task1._id,
      assignmentId: a1._id,
      authorId: emp1._id,
      type: 'progress',
      message: 'Completed token validation middleware; finalizing UI error banners.',
      previousProgress: 40,
      newProgress: 65,
      newStatus: 'in_progress',
    },
    {
      taskId: task2._id,
      assignmentId: a2._id,
      authorId: emp1._id,
      type: 'submission',
      message: 'Submitted deliverable v1 for manager review.',
      previousStatus: 'in_progress',
      newStatus: 'submitted',
    },
  ]);

  // Seed last 5 days of Attendance
  const attendanceDocs = [];
  for (let i = 1; i <= 5; i += 1) {
    const d = new Date(now.getTime() - i * dayMs);
    const dateStr = d.toISOString().slice(0, 10);
    for (const emp of [emp1, emp2, emp3, emp4, engMgrEmp]) {
      const checkIn = new Date(`${dateStr}T09:0${i % 4}:00.000Z`);
      const checkOut = new Date(`${dateStr}T17:45:00.000Z`);
      attendanceDocs.push({
        employeeId: emp._id,
        date: dateStr,
        checkInAt: checkIn,
        checkOutAt: checkOut,
        workingMinutes: Math.round((checkOut - checkIn) / 60000),
        status: i === 3 && emp._id === emp2._id ? 'late' : 'present',
      });
    }
  }
  await Attendance.insertMany(attendanceDocs);

  // Leave Requests
  await LeaveRequest.create([
    {
      employeeId: emp1._id,
      leaveType: 'annual',
      startDate: new Date(now.getTime() + 10 * dayMs),
      endDate: new Date(now.getTime() + 12 * dayMs),
      totalDays: 3,
      reason: 'Family travel planned for next week.',
      status: 'pending',
    },
    {
      employeeId: emp2._id,
      leaveType: 'sick',
      startDate: new Date(now.getTime() - 8 * dayMs),
      endDate: new Date(now.getTime() - 7 * dayMs),
      totalDays: 2,
      reason: 'Medical appointment and recovery.',
      status: 'approved',
      reviewerId: engMgrEmp._id,
      reviewedAt: new Date(now.getTime() - 9 * dayMs),
      decisionNotes: 'Approved. Feel better soon.',
    },
  ]);

  // Daily Reports
  const yesterdayStr = new Date(now.getTime() - dayMs).toISOString().slice(0, 10);
  await DailyReport.create([
    {
      employeeId: emp1._id,
      date: yesterdayStr,
      completedWork: 'Finished pagination audit across Employee Directory and Task Management tables.',
      ongoingWork: 'Wiring OAuth2 callback error handling on the login view.',
      blockers: 'Awaiting staging redirect URI confirmation from IT.',
      nextDayPlan: 'Submit PR for OAuth2 flow and address any review comments on TSK-1002.',
      relatedTaskIds: [task1._id, task2._id],
      hoursWorked: 8,
    },
    {
      employeeId: emp2._id,
      date: yesterdayStr,
      completedWork: 'Deployed MongoDB compound indexes to staging and captured explain plans.',
      ongoingWork: 'Drafting API latency monitoring guide.',
      blockers: '',
      nextDayPlan: 'Support QA team with leave workflow test fixtures.',
      relatedTaskIds: [task3._id],
      hoursWorked: 8.5,
      managerNote: 'Great work on the index tuning!',
      reviewedBy: engMgrEmp._id,
      reviewedAt: now,
    },
  ]);

  // Feedback
  await Feedback.create([
    {
      employeeId: emp1._id,
      managerId: engMgrEmp._id,
      taskId: task2._id,
      category: 'recognition',
      rating: 5,
      comment: 'Consistently clean UI architecture and thorough edge-case coverage across all table views.',
    },
    {
      employeeId: emp2._id,
      managerId: engMgrEmp._id,
      taskId: task3._id,
      category: 'performance',
      rating: 5,
      comment: 'Delivered measurable database speedups ahead of deadline with clear documentation.',
    },
  ]);

  // Notifications
  await Notification.create([
    {
      recipientUserId: emp1User._id,
      type: 'task_assigned',
      title: 'New task assigned: Implement OAuth2 SSO login flow',
      message: 'David Kowalski assigned TSK-1001 to you.',
      entityType: 'task',
      entityId: task1._id,
      actionUrl: `/employee/tasks/${task1._id}`,
    },
    {
      recipientUserId: engMgrUser._id,
      type: 'task_submitted',
      title: 'Deliverable submitted: Audit data table pagination',
      message: 'Maya Lin submitted v1 for your review.',
      entityType: 'approval',
      actionUrl: '/manager/approvals',
    },
    {
      recipientUserId: engMgrUser._id,
      type: 'leave_submitted',
      title: 'Leave request from Maya Lin',
      message: 'Annual leave (3 days) awaiting approval.',
      entityType: 'leaveRequest',
      actionUrl: '/manager/leave',
    },
  ]);

  // Activity Logs
  await ActivityLog.create([
    {
      actorUserId: adminUser._id,
      actorEmployeeId: adminEmp._id,
      actorRole: 'admin',
      action: 'department.create',
      entityType: 'department',
      entityId: engDept._id,
      summary: 'Initialized Engineering, Product Design, and Operations departments',
    },
    {
      actorUserId: engMgrUser._id,
      actorEmployeeId: engMgrEmp._id,
      actorRole: 'manager',
      action: 'approval.approve',
      entityType: 'approval',
      summary: 'Approved "Optimize MongoDB indexes" submitted by Daniel Park',
    },
    {
      actorUserId: emp1User._id,
      actorEmployeeId: emp1._id,
      actorRole: 'employee',
      action: 'deliverable.submit',
      entityType: 'deliverable',
      entityId: delivPending._id,
      summary: 'Submitted deliverable v1 for "Audit data table pagination & server-side sorting"',
    },
  ]);

  console.log('[SEED] WorkTrack demo data seeded successfully.');
  console.log('  Admin:    admin@worktrack.io / WorkTrack@123');
  console.log('  Manager:  manager@worktrack.io / WorkTrack@123');
  console.log('  Employee: employee@worktrack.io / WorkTrack@123');
}

export async function seedDatabaseIfEmpty() {
  const count = await User.countDocuments();
  if (count === 0) {
    await seedDatabase({ reset: false });
  }
}

// Run directly via `npm run seed`
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  connectDB()
    .then(() => seedDatabase({ reset: true }))
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Failed:', err);
      process.exit(1);
    });
}
