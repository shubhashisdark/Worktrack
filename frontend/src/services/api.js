import { apiClient } from './apiClient';

const unwrap = (promise) => promise.then((res) => res.data);

export const authApi = {
  login: (payload) => unwrap(apiClient.post('/auth/login', payload)),
  logout: () => unwrap(apiClient.post('/auth/logout')),
  me: () => unwrap(apiClient.get('/auth/me')),
  forgotPassword: (payload) => unwrap(apiClient.post('/auth/forgot-password', payload)),
  resetPassword: (payload) => unwrap(apiClient.post('/auth/reset-password', payload)),
  changePassword: (payload) => unwrap(apiClient.patch('/auth/change-password', payload)),
  updatePreferences: (payload) => unwrap(apiClient.patch('/auth/preferences', payload)),
};

export const dashboardApi = {
  employee: () => unwrap(apiClient.get('/dashboard/employee')),
  manager: () => unwrap(apiClient.get('/dashboard/manager')),
  admin: () => unwrap(apiClient.get('/dashboard/admin')),
};

export const employeeApi = {
  list: (params) => unwrap(apiClient.get('/employees', { params })),
  getById: (id) => unwrap(apiClient.get(`/employees/${id}`)),
  create: (payload) => unwrap(apiClient.post('/employees', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/employees/${id}`, payload)),
  deactivate: (id) => unwrap(apiClient.delete(`/employees/${id}`)),
  bulkStatus: (payload) => unwrap(apiClient.patch('/employees/bulk-status', payload)),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return unwrap(
      apiClient.post(`/employees/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};

export const departmentApi = {
  list: (params) => unwrap(apiClient.get('/departments', { params })),
  getById: (id) => unwrap(apiClient.get(`/departments/${id}`)),
  create: (payload) => unwrap(apiClient.post('/departments', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/departments/${id}`, payload)),
  deactivate: (id) => unwrap(apiClient.delete(`/departments/${id}`)),
};

export const taskApi = {
  list: (params) => unwrap(apiClient.get('/tasks', { params })),
  getById: (id) => unwrap(apiClient.get(`/tasks/${id}`)),
  create: (payload, files = []) => {
    if (files.length > 0) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          fd.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
        }
      });
      files.forEach((f) => fd.append('attachments', f));
      return unwrap(apiClient.post('/tasks', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
    }
    return unwrap(apiClient.post('/tasks', payload));
  },
  update: (id, payload) => unwrap(apiClient.patch(`/tasks/${id}`, payload)),
  archive: (id) => unwrap(apiClient.delete(`/tasks/${id}`)),
  assign: (id, employeeIds) => unwrap(apiClient.post(`/tasks/${id}/assign`, { employeeIds })),
  updateProgress: (id, payload) => unwrap(apiClient.patch(`/tasks/${id}/progress`, payload)),
  addComment: (id, message) => unwrap(apiClient.post(`/tasks/${id}/comments`, { message })),
  listDeliverables: (id) => unwrap(apiClient.get(`/tasks/${id}/deliverables`)),
  submitDeliverable: (id, { notes, externalLinks = [], files = [] }) => {
    const fd = new FormData();
    fd.append('notes', notes || '');
    fd.append('externalLinks', JSON.stringify(externalLinks));
    files.forEach((f) => fd.append('files', f));
    return unwrap(
      apiClient.post(`/tasks/${id}/deliverables`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};

export const approvalApi = {
  list: (params) => unwrap(apiClient.get('/approvals', { params })),
  getById: (id) => unwrap(apiClient.get(`/approvals/${id}`)),
  approve: (id, comments = '') => unwrap(apiClient.post(`/approvals/${id}/approve`, { comments })),
  requestRevision: (id, comments) => unwrap(apiClient.post(`/approvals/${id}/request-revision`, { comments })),
};

export const attendanceApi = {
  checkIn: (notes = '') => unwrap(apiClient.post('/attendance/check-in', { notes })),
  checkOut: (notes = '') => unwrap(apiClient.post('/attendance/check-out', { notes })),
  list: (params) => unwrap(apiClient.get('/attendance', { params })),
  history: (params) => unwrap(apiClient.get('/attendance/history', { params })),
  adjust: (id, payload) => unwrap(apiClient.patch(`/attendance/${id}`, payload)),
};

export const leaveApi = {
  create: (payload) => unwrap(apiClient.post('/leave-requests', payload)),
  list: (params) => unwrap(apiClient.get('/leave-requests', { params })),
  approve: (id, decisionNotes = '') => unwrap(apiClient.patch(`/leave-requests/${id}/approve`, { decisionNotes })),
  reject: (id, decisionNotes) => unwrap(apiClient.patch(`/leave-requests/${id}/reject`, { decisionNotes })),
  cancel: (id) => unwrap(apiClient.patch(`/leave-requests/${id}/cancel`)),
};

export const dailyReportApi = {
  create: (payload) => unwrap(apiClient.post('/daily-reports', payload)),
  list: (params) => unwrap(apiClient.get('/daily-reports', { params })),
  getById: (id) => unwrap(apiClient.get(`/daily-reports/${id}`)),
  addNote: (id, managerNote) => unwrap(apiClient.patch(`/daily-reports/${id}/note`, { managerNote })),
};

export const feedbackApi = {
  list: (params) => unwrap(apiClient.get('/feedback', { params })),
  create: (payload) => unwrap(apiClient.post('/feedback', payload)),
};

export const performanceApi = {
  me: () => unwrap(apiClient.get('/performance/me')),
  team: (params) => unwrap(apiClient.get('/performance/team', { params })),
  employee: (id) => unwrap(apiClient.get(`/performance/employee/${id}`)),
};

export const reportsApi = {
  get: (params) => unwrap(apiClient.get('/reports', { params })),
};

export const notificationApi = {
  list: (params) => unwrap(apiClient.get('/notifications', { params })),
  markRead: (id) => unwrap(apiClient.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(apiClient.patch('/notifications/read-all')),
};

export const activityLogApi = {
  list: (params) => unwrap(apiClient.get('/activity-logs', { params })),
};

export const settingsApi = {
  getOrganization: () => unwrap(apiClient.get('/settings/organization')),
  updateOrganization: (payload) => unwrap(apiClient.patch('/settings/organization', payload)),
  listRoles: () => unwrap(apiClient.get('/settings/roles')),
  updateRole: (role, permissions) => unwrap(apiClient.patch(`/settings/roles/${role}`, { permissions })),
};
