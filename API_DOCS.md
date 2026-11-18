# WorkTrack — REST API Documentation (`/api/v1`)

Base URL: `/api/v1`

## Response Envelopes

### Success
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
  "message": "Optional status message"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED",
    "message": "Human-readable description",
    "details": [{ "path": "field", "message": "Validation error" }]
  }
}
```

## Authentication & Authorization
- Authentication uses signed JWT stored in an `HttpOnly`, `SameSite=Lax` (`None; Secure` in production) cookie (`worktrack_token`), with optional `Authorization: Bearer <token>` support.
- Every protected route validates the JWT and role/team scope on the backend:
  - **Employee**: Self records and assigned tasks only.
  - **Manager**: Direct reports (`employee.managerId === manager._id`) and members of departments where `department.managerId === manager._id`.
  - **Admin**: Organization-wide access.

---

## Endpoints

### Authentication (`/auth`)
- `POST /auth/login` — Sign in with email & password (rate-limited).
- `POST /auth/logout` — Clear session cookie and log sign-out.
- `GET /auth/me` — Return current user, employee profile, and active permissions.
- `POST /auth/forgot-password` — Issue 15-minute SHA-256 hashed reset token.
- `POST /auth/reset-password` — Reset password using valid token.
- `PATCH /auth/change-password` — Update authenticated user's password.
- `PATCH /auth/preferences` — Update notification preferences.

### Dashboards (`/dashboard`)
- `GET /dashboard/employee` — Personal KPIs, today's attendance, deadlines, pending approvals, feedback, activity.
- `GET /dashboard/manager` — Team KPIs, workload distribution, pending submissions, team attendance, activity.
- `GET /dashboard/admin` — Org KPIs, department distribution, attendance overview, recent audit logs.

### Employees (`/employees`)
- `GET /employees` *(Manager, Admin)* — Paginated directory (`search`, `departmentId`, `role`, `status`, `page`, `limit`, `sortBy`, `sortOrder`).
- `GET /employees/:id` *(Self, Team Manager, Admin)* — Detailed employee profile & task stats.
- `POST /employees` *(Admin)* — Create User + Employee profile.
- `PATCH /employees/:id` *(Admin full / Self contact fields)* — Update employee.
- `POST /employees/:id/avatar` *(Self, Admin)* — Upload avatar image (`multipart/form-data`, field `avatar`).
- `PATCH /employees/bulk-status` *(Admin)* — Bulk activate/deactivate employees.
- `DELETE /employees/:id` *(Admin)* — Soft-deactivate employee & user account.

### Departments (`/departments`)
- `GET /departments` — List departments with member & active task counts.
- `GET /departments/:id` *(Manager, Admin)* — Department details, roster, and active tasks.
- `POST /departments` *(Admin)* — Create department.
- `PATCH /departments/:id` *(Admin)* — Update department or assign manager.
- `DELETE /departments/:id` *(Admin)* — Deactivate department.

### Tasks (`/tasks`) & Approvals (`/approvals`)
- `GET /tasks` — Role-scoped task list (`search`, `status`, `priority`, `departmentId`, `assigneeId`, `overdue`, `assignmentStatus`).
- `GET /tasks/:id` — Full task details, assignments, updates, deliverables, and approvals.
- `POST /tasks` *(Manager, Admin)* — Create task (JSON or multipart with `attachments`).
- `PATCH /tasks/:id` *(Manager, Admin)* — Edit task details or archive.
- `DELETE /tasks/:id` *(Manager, Admin)* — Archive task.
- `POST /tasks/:id/assign` *(Manager team-scoped, Admin)* — Assign task to employee(s).
- `PATCH /tasks/:id/progress` *(Assigned Employee)* — Update progress (`0–100`) with optional note.
- `POST /tasks/:id/comments` — Add task comment.
- `POST /tasks/:id/deliverables` *(Assigned Employee)* — Upload deliverable files (`files`), external links, and notes (`→ submitted`).
- `GET /tasks/:id/deliverables` — List versioned deliverables.
- `GET /approvals` — Role-scoped submission queue (`decision=pending|approved|revision_requested`).
- `GET /approvals/:id` — Detailed submission & version history.
- `POST /approvals/:id/approve` *(Team Manager, Admin)* — Approve deliverable & complete assignment.
- `POST /approvals/:id/request-revision` *(Team Manager, Admin)* — Request revision with required feedback.

### Attendance (`/attendance`)
- `POST /attendance/check-in` — Record check-in (prevents duplicate same-day check-in; flags `late` via org settings).
- `POST /attendance/check-out` — Record check-out & compute `workingMinutes`.
- `GET /attendance` — Role-scoped attendance list (`date`, `from`, `to`, `status`, `missingCheckout`, `departmentId`).
- `GET /attendance/history` — Monthly attendance records, today's record, and summary (`month=YYYY-MM`).
- `PATCH /attendance/:id` *(Team Manager, Admin)* — Adjust check-out time / status / notes.

### Leave Requests (`/leave-requests`)
- `POST /leave-requests` — Submit leave (validates date range, blocks overlapping requests, verifies balance).
- `GET /leave-requests` — Role-scoped leave list (`status`, `leaveType`, `mine`).
- `PATCH /leave-requests/:id/approve` *(Team Manager, Admin)* — Approve leave & deduct balance.
- `PATCH /leave-requests/:id/reject` *(Team Manager, Admin)* — Reject leave with required reason.
- `PATCH /leave-requests/:id/cancel` *(Owner)* — Cancel pending request.

### Daily Reports (`/daily-reports`) & Feedback (`/feedback`)
- `POST /daily-reports` — Submit or update daily work report (unique per employee/date).
- `GET /daily-reports` — Role-scoped daily report log (`date`, `hasBlockers`, `search`, `mine`).
- `GET /daily-reports/:id` — Daily report details.
- `PATCH /daily-reports/:id/note` *(Team Manager, Admin)* — Add manager review note.
- `POST /feedback` *(Team Manager, Admin)* — Post structured employee feedback (rating 1–5 + category).
- `GET /feedback` — Role-scoped feedback list.

### Performance (`/performance`), Reports (`/reports`), Notifications, Activity Logs & Settings
- `GET /performance/me` — Personal 5-metric transparent breakdown + 6-month trend.
- `GET /performance/team` *(Manager, Admin)* — Team/department performance comparison.
- `GET /performance/employee/:id` *(Team Manager, Admin)* — Individual employee performance deep dive.
- `GET /reports` *(Manager, Admin)* — Task, attendance, and leave summary analytics.
- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- `GET /activity-logs` *(Manager, Admin)* — Filterable audit trail.
- `GET /settings/organization`, `PATCH /settings/organization` *(Admin)*.
- `GET /settings/roles` *(Admin)*, `PATCH /settings/roles/:role` *(Admin)*.
