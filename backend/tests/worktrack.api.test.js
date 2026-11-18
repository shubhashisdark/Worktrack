import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/seed.js';
import { Employee } from '../src/modules/employees/employee.model.js';

let mongoServer;
let app;

let adminAgent;
let managerAgent;
let employeeAgent;
let otherEmployeeAgent;

let seededEmployees = {};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await seedDatabase({ reset: true });

  app = createApp();

  adminAgent = request.agent(app);
  managerAgent = request.agent(app);
  employeeAgent = request.agent(app);
  otherEmployeeAgent = request.agent(app);

  const emps = await Employee.find().lean();
  for (const e of emps) {
    seededEmployees[e.email] = e;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('WorkTrack API — Auth, Workflows & Security', () => {
  describe('1. Authentication & Session Security', () => {
    it('blocks unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'employee@worktrack.io', password: 'WrongPassword1' });
      expect(res.status).toBe(401);
    });

    it('logs in Admin, Manager, and Employees with HttpOnly cookies', async () => {
      const rAdmin = await adminAgent
        .post('/api/v1/auth/login')
        .send({ email: 'admin@worktrack.io', password: 'WorkTrack@123' });
      expect(rAdmin.status).toBe(200);
      expect(rAdmin.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(rAdmin.body.data.user.role).toBe('admin');

      const rManager = await managerAgent
        .post('/api/v1/auth/login')
        .send({ email: 'manager@worktrack.io', password: 'WorkTrack@123' });
      expect(rManager.status).toBe(200);
      expect(rManager.body.data.user.role).toBe('manager');

      const rEmp = await employeeAgent
        .post('/api/v1/auth/login')
        .send({ email: 'employee@worktrack.io', password: 'WorkTrack@123' });
      expect(rEmp.status).toBe(200);
      expect(rEmp.body.data.user.role).toBe('employee');

      const rOther = await otherEmployeeAgent
        .post('/api/v1/auth/login')
        .send({ email: 'marcus.chen@worktrack.io', password: 'WorkTrack@123' });
      expect(rOther.status).toBe(200);
      expect(rOther.body.data.user.role).toBe('employee');
    });

    it('supports forgot-password and reset-password flow', async () => {
      const forgot = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'priya.sharma@worktrack.io' });
      expect(forgot.status).toBe(200);
      const token = forgot.body.data.devResetToken;
      expect(token).toBeTruthy();

      const reset = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, password: 'NewPassword@123' });
      expect(reset.status).toBe(200);

      const loginNew = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'priya.sharma@worktrack.io', password: 'NewPassword@123' });
      expect(loginNew.status).toBe(200);
    });
  });

  describe('2. RBAC & Cross-Scope Security Boundaries', () => {
    it('prevents Employee from listing directory or accessing another employee profile', async () => {
      const listRes = await employeeAgent.get('/api/v1/employees');
      expect(listRes.status).toBe(403);

      const otherEmp = seededEmployees['marcus.chen@worktrack.io'];
      const profileRes = await employeeAgent.get(`/api/v1/employees/${otherEmp._id}`);
      expect(profileRes.status).toBe(403);
    });

    it('prevents Employee from performing Manager or Admin actions', async () => {
      const createTaskRes = await employeeAgent.post('/api/v1/tasks').send({
        title: 'Unauthorized Task',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(createTaskRes.status).toBe(403);

      const adminDashRes = await employeeAgent.get('/api/v1/dashboard/admin');
      expect(adminDashRes.status).toBe(403);

      const roleUpdateRes = await employeeAgent
        .patch('/api/v1/settings/roles/employee')
        .send({ permissions: { 'tasks:manage_all': true } });
      expect(roleUpdateRes.status).toBe(403);
    });

    it('prevents Manager from accessing or assigning tasks to employees outside their team', async () => {
      // Marcus Chen belongs to Product Design under Claire Bennett, NOT Engineering Manager David Kowalski
      const marcus = seededEmployees['marcus.chen@worktrack.io'];

      const profileRes = await managerAgent.get(`/api/v1/employees/${marcus._id}`);
      expect(profileRes.status).toBe(403);

      const assignRes = await managerAgent.post('/api/v1/tasks').send({
        title: 'Cross-team task attempt',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assigneeIds: [String(marcus._id)],
      });
      expect(assignRes.status).toBe(403);
    });

    it('rejects malformed input with 400 validation error', async () => {
      const badLeave = await employeeAgent.post('/api/v1/leave-requests').send({
        leaveType: 'annual',
        startDate: '2026-12-10',
        endDate: '2026-12-05',
        reason: 'Bad range',
      });
      expect(badLeave.status).toBe(400);
    });
  });

  describe('3. Full Task, Deliverable & Approval Lifecycle', () => {
    let createdTaskId;
    let approvalId;

    it('Manager creates and assigns a task to a team member', async () => {
      const maya = seededEmployees['employee@worktrack.io'];
      const res = await managerAgent.post('/api/v1/tasks').send({
        title: 'Build CSV Export Utility for Reports',
        description: 'Support downloading team task and attendance summaries as CSV.',
        priority: 'high',
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
        assigneeIds: [String(maya._id)],
      });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('assigned');
      createdTaskId = res.body.data._id;
    });

    it('Employee updates progress and submits a deliverable', async () => {
      const progRes = await employeeAgent
        .patch(`/api/v1/tasks/${createdTaskId}/progress`)
        .send({ progress: 60, note: 'Implemented core CSV serializer' });
      expect(progRes.status).toBe(200);
      expect(progRes.body.data.status).toBe('in_progress');
      expect(progRes.body.data.progress).toBe(60);

      const submitRes = await employeeAgent
        .post(`/api/v1/tasks/${createdTaskId}/deliverables`)
        .send({
          notes: 'Completed CSV export with UTF-8 BOM and unit tests.',
          externalLinks: [{ label: 'PR #201', url: 'https://github.com/worktrack/app/pull/201' }],
        });
      expect(submitRes.status).toBe(201);
      expect(submitRes.body.data.deliverable.version).toBe(1);
      approvalId = submitRes.body.data.approval._id;
    });

    it('Manager requests revision, Employee resubmits v2, and Manager approves', async () => {
      const revRes = await managerAgent
        .post(`/api/v1/approvals/${approvalId}/request-revision`)
        .send({ comments: 'Please escape commas inside cell values.' });
      expect(revRes.status).toBe(200);
      expect(revRes.body.data.decision).toBe('revision_requested');

      const resubmitRes = await employeeAgent
        .post(`/api/v1/tasks/${createdTaskId}/deliverables`)
        .send({ notes: 'Added RFC-4180 quoting and comma escaping.' });
      expect(resubmitRes.status).toBe(201);
      expect(resubmitRes.body.data.deliverable.version).toBe(2);
      const secondApprovalId = resubmitRes.body.data.approval._id;

      const approveRes = await managerAgent
        .post(`/api/v1/approvals/${secondApprovalId}/approve`)
        .send({ comments: 'Clean fix. Approved!' });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.decision).toBe('approved');

      const taskCheck = await employeeAgent.get(`/api/v1/tasks/${createdTaskId}`);
      expect(taskCheck.body.data.status).toBe('approved');
    });
  });

  describe('4. Attendance, Leave & Daily Report Workflows', () => {
    it('supports check-in, blocks duplicate check-in, and records check-out duration', async () => {
      const ci = await employeeAgent.post('/api/v1/attendance/check-in').send({ notes: 'Starting shift' });
      expect(ci.status).toBe(201);

      const dup = await employeeAgent.post('/api/v1/attendance/check-in').send({});
      expect(dup.status).toBe(409);

      const co = await employeeAgent.post('/api/v1/attendance/check-out').send({ notes: 'Done for the day' });
      expect(co.status).toBe(200);
      expect(co.body.data.checkOutAt).toBeTruthy();
    });

    it('supports leave application, overlap blocking, and manager approval', async () => {
      const apply = await employeeAgent.post('/api/v1/leave-requests').send({
        leaveType: 'casual',
        startDate: '2026-12-15',
        endDate: '2026-12-16',
        reason: 'Personal errand in town',
      });
      expect(apply.status).toBe(201);
      expect(apply.body.data.totalDays).toBe(2);
      const leaveId = apply.body.data._id;

      const overlap = await employeeAgent.post('/api/v1/leave-requests').send({
        leaveType: 'casual',
        startDate: '2026-12-16',
        endDate: '2026-12-17',
        reason: 'Overlapping request test',
      });
      expect(overlap.status).toBe(409);

      const approve = await managerAgent
        .patch(`/api/v1/leave-requests/${leaveId}/approve`)
        .send({ decisionNotes: 'Enjoy your time off' });
      expect(approve.status).toBe(200);
      expect(approve.body.data.status).toBe('approved');
    });

    it('allows Employee daily report submission and Manager note review', async () => {
      const dr = await employeeAgent.post('/api/v1/daily-reports').send({
        completedWork: 'Completed CSV export utility and merged PR #201.',
        ongoingWork: 'Reviewing dashboard accessibility.',
        blockers: 'None',
        nextDayPlan: 'Start Q4 performance view refinements.',
        hoursWorked: 8,
      });
      expect(dr.status).toBe(201);

      const note = await managerAgent
        .patch(`/api/v1/daily-reports/${dr.body.data._id}/note`)
        .send({ managerNote: 'Great progress today!' });
      expect(note.status).toBe(200);
      expect(note.body.data.managerNote).toBe('Great progress today!');
    });
  });

  describe('5. Admin Management, Dashboards & Performance Analytics', () => {
    it('Admin creates department, adds employee, and reads distinct dashboards', async () => {
      const deptRes = await adminAgent.post('/api/v1/departments').send({
        name: 'Security',
        code: 'SEC',
        description: 'Application & infrastructure security',
      });
      expect(deptRes.status).toBe(201);

      const empRes = await adminAgent.post('/api/v1/employees').send({
        firstName: 'Jordan',
        lastName: 'Hayes',
        email: 'jordan.hayes@worktrack.io',
        jobTitle: 'Security Engineer',
        role: 'employee',
        departmentId: deptRes.body.data._id,
      });
      expect(empRes.status).toBe(201);

      const [empDash, mgrDash, admDash, myPerf, teamPerf] = await Promise.all([
        employeeAgent.get('/api/v1/dashboard/employee'),
        managerAgent.get('/api/v1/dashboard/manager'),
        adminAgent.get('/api/v1/dashboard/admin'),
        employeeAgent.get('/api/v1/performance/me'),
        managerAgent.get('/api/v1/performance/team'),
      ]);

      expect(empDash.status).toBe(200);
      expect(empDash.body.data.metrics).toBeDefined();

      expect(mgrDash.status).toBe(200);
      expect(Array.isArray(mgrDash.body.data.workload)).toBe(true);

      expect(admDash.status).toBe(200);
      expect(admDash.body.data.metrics.totalEmployees).toBeGreaterThanOrEqual(8);

      expect(myPerf.status).toBe(200);
      expect(myPerf.body.data.metrics.taskCompletionRate).toBeGreaterThanOrEqual(0);

      expect(teamPerf.status).toBe(200);
      expect(teamPerf.body.data.members.length).toBeGreaterThanOrEqual(3);
    });

    it('logs out cleanly', async () => {
      const res = await employeeAgent.post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      const after = await employeeAgent.get('/api/v1/auth/me');
      expect(after.status).toBe(401);
    });
  });
});
