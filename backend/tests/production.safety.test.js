import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import { bootstrapProduction } from '../src/seed/bootstrapProduction.js';
import { seedDatabase } from '../src/seed/seed.js';
import { User } from '../src/modules/users/user.model.js';
import { Task } from '../src/modules/tasks/task.model.js';
import { Department } from '../src/modules/departments/department.model.js';

let mongoServer;
let app;
let adminAgent;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
  adminAgent = request.agent(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('WorkTrack Production Readiness & Safety Suite', () => {
  it('bootstraps a completely clean production DB with zero demo data', async () => {
    const res = await bootstrapProduction({
      clean: true,
      organizationName: 'Acme Corp',
      adminEmail: 'ceo@acmecorp.com',
      adminPassword: 'ProdAdminPassword#99',
      adminFirstName: 'Alex',
      adminLastName: 'Morgan',
    });

    expect(res.created).toBe(true);
    expect(res.email).toBe('ceo@acmecorp.com');
    expect(await User.countDocuments()).toBe(1);
    expect(await Task.countDocuments()).toBe(0);
    expect(await Department.countDocuments()).toBe(0);
  });

  it('reports healthy database status on GET /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe('connected');
  });

  it('blocks NoSQL operator injection attempts on login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $ne: '' }, password: { $ne: '' } });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('handles fresh empty-DB dashboards, performance & list endpoints without NaN or errors', async () => {
    const login = await adminAgent
      .post('/api/v1/auth/login')
      .send({ email: 'ceo@acmecorp.com', password: 'ProdAdminPassword#99' });
    expect(login.status).toBe(200);

    const endpoints = [
      '/api/v1/dashboard/admin',
      '/api/v1/dashboard/manager',
      '/api/v1/dashboard/employee',
      '/api/v1/performance/me',
      '/api/v1/performance/team',
      '/api/v1/reports',
      '/api/v1/tasks',
      '/api/v1/approvals',
      '/api/v1/attendance',
      '/api/v1/attendance/history',
      '/api/v1/leave-requests',
      '/api/v1/daily-reports',
      '/api/v1/feedback',
      '/api/v1/notifications',
      '/api/v1/activity-logs',
      '/api/v1/settings/organization',
      '/api/v1/settings/roles',
    ];

    for (const ep of endpoints) {
      const r = await adminAgent.get(ep);
      expect(r.status, `Failed endpoint ${ep}`).toBe(200);
      expect(r.body.success).toBe(true);
      expect(JSON.stringify(r.body)).not.toContain('NaN');
    }
  });

  it('never assigns hardcoded demo passwords when creating an employee without a password', async () => {
    const createRes = await adminAgent.post('/api/v1/employees').send({
      firstName: 'Sam',
      lastName: 'Taylor',
      email: 'sam.taylor@acmecorp.com',
      jobTitle: 'Operations Analyst',
      role: 'employee',
    });
    expect(createRes.status).toBe(201);

    const badLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sam.taylor@acmecorp.com', password: 'WorkTrack@123' });
    expect(badLogin.status).toBe(401);
  });

  it('refuses to run demo seedDatabase() when NODE_ENV is production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    await expect(seedDatabase({ reset: true })).rejects.toThrow(/production/i);
    process.env.NODE_ENV = prev;
  });
});
