export const TASK_STATUS_META = {
  created: { label: 'Created', tone: 'neutral' },
  assigned: { label: 'Assigned', tone: 'info' },
  in_progress: { label: 'In Progress', tone: 'info' },
  submitted: { label: 'Pending Review', tone: 'warning' },
  revision_requested: { label: 'Revision Needed', tone: 'danger' },
  approved: { label: 'Approved', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const PRIORITY_META = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'danger' },
  urgent: { label: 'Urgent', tone: 'danger' },
};

export const ATTENDANCE_STATUS_META = {
  present: { label: 'Present', tone: 'success' },
  late: { label: 'Late', tone: 'warning' },
  half_day: { label: 'Half Day', tone: 'warning' },
  absent: { label: 'Absent', tone: 'danger' },
  on_leave: { label: 'On Leave', tone: 'info' },
  missing_checkout: { label: 'Missing Checkout', tone: 'danger' },
};

export const LEAVE_STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const APPROVAL_STATUS_META = {
  pending: { label: 'Pending Review', tone: 'warning' },
  pending_review: { label: 'Pending Review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  revision_requested: { label: 'Revision Requested', tone: 'danger' },
};

export const EMPLOYEE_STATUS_META = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  on_leave: { label: 'On Leave', tone: 'warning' },
};

export const ROLE_META = {
  employee: { label: 'Employee', tone: 'neutral' },
  manager: { label: 'Manager', tone: 'info' },
  admin: { label: 'Administrator', tone: 'warning' },
};

export const TONE_CLASSES = {
  success: 'bg-[#ECF7F2] text-[#1E7E5A] border-[#CDEADC]',
  warning: 'bg-[#FDF6E9] text-[#B26B00] border-[#F5DFB6]',
  danger: 'bg-[#FDEEEC] text-[#C0392B] border-[#F7CFCB]',
  info: 'bg-[#EEF2FC] text-[#3867D6] border-[#D3DFF9]',
  neutral: 'bg-[#F1F3F6] text-[#5F6672] border-[#E2E5EA]',
};
