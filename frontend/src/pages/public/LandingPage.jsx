import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Lock,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WorkTrackLogo } from '@/layouts/PortalShell';
import { Button } from '@/components/ui/Button';
import { Badge, ProgressBar } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';

const PREVIEW_TABS = {
  employee: {
    label: 'Employee Portal',
    heading: 'Good day, Maya',
    subheading: 'Personal workspace · 4 active assignments',
    metrics: [
      { label: 'Assigned', value: '4' },
      { label: 'In Progress', value: '2' },
      { label: 'Pending Review', value: '1', tone: 'warning' },
      { label: 'Approved', value: '14', tone: 'success' },
    ],
    rows: [
      {
        code: 'TSK-1001',
        title: 'Implement OAuth2 SSO login flow & session refresh',
        meta: 'Due Nov 21 · High',
        status: 'In Progress',
        tone: 'info',
        progress: 65,
      },
      {
        code: 'TSK-1002',
        title: 'Audit data table pagination & server-side sorting',
        meta: 'Submitted v1 · 3h ago',
        status: 'Pending Review',
        tone: 'warning',
        progress: 100,
      },
      {
        code: 'TSK-1008',
        title: 'Finalize keyboard navigation across task drawers',
        meta: 'Due Nov 25 · Medium',
        status: 'Assigned',
        tone: 'neutral',
        progress: 20,
      },
    ],
    sidebar: ['Overview', 'My Tasks', 'Daily Reports', 'Attendance', 'Leave Requests', 'My Performance'],
    activeNav: 'Overview',
  },
  manager: {
    label: 'Manager Portal',
    heading: 'Team Overview',
    subheading: 'Engineering · 6 direct reports · 2 submissions awaiting review',
    metrics: [
      { label: 'Team Size', value: '6' },
      { label: 'Active Tasks', value: '11' },
      { label: 'Pending Approvals', value: '2', tone: 'warning' },
      { label: 'On-Time Rate', value: '94%', tone: 'success' },
    ],
    rows: [
      {
        code: 'TSK-1002',
        title: 'Audit data table pagination & server-side sorting',
        meta: 'Maya Lin · Deliverable v1',
        status: 'Needs Review',
        tone: 'warning',
        progress: 100,
      },
      {
        code: 'TSK-1003',
        title: 'Optimize MongoDB indexes for reporting queries',
        meta: 'Daniel Park · Approved',
        status: 'Approved',
        tone: 'success',
        progress: 100,
      },
      {
        code: 'TSK-1004',
        title: 'E2E regression tests for leave approval workflow',
        meta: 'Priya Sharma · Overdue 1d',
        status: 'Attention',
        tone: 'danger',
        progress: 35,
      },
    ],
    sidebar: ['Overview', 'Team Members', 'Task Management', 'Task Approvals', 'Attendance', 'Performance'],
    activeNav: 'Task Approvals',
  },
  admin: {
    label: 'Admin Portal',
    heading: 'Organization Overview',
    subheading: 'WorkTrack Enterprise · 3 active departments · 92% attendance today',
    metrics: [
      { label: 'Active Employees', value: '48' },
      { label: 'Departments', value: '5' },
      { label: 'Org Tasks', value: '126' },
      { label: 'Attendance Today', value: '92%', tone: 'success' },
    ],
    rows: [
      {
        code: 'ENG',
        title: 'Engineering · Lead: David Kowalski',
        meta: '22 members · 48 active tasks',
        status: 'Active',
        tone: 'success',
        progress: 88,
      },
      {
        code: 'DES',
        title: 'Product Design · Lead: Claire Bennett',
        meta: '10 members · 19 active tasks',
        status: 'Active',
        tone: 'success',
        progress: 92,
      },
      {
        code: 'OPS',
        title: 'Operations · Lead: Elena Rostova',
        meta: '16 members · 27 active tasks',
        status: 'Active',
        tone: 'success',
        progress: 84,
      },
    ],
    sidebar: ['Overview', 'Employees', 'Departments', 'Roles & Permissions', 'Activity Logs', 'Settings'],
    activeNav: 'Overview',
  },
};

const CAPABILITIES = [
  {
    icon: ClipboardCheck,
    title: 'Structured Task Lifecycle',
    description:
      'Move work cleanly from assignment to progress tracking, versioned deliverables, and explicit manager sign-off.',
  },
  {
    icon: CheckCircle2,
    title: 'Focused Approval Queues',
    description:
      'Review attached files and external links in a contextual drawer. Approve work or request targeted revisions with clear feedback.',
  },
  {
    icon: Clock,
    title: 'Daily Attendance & Hours',
    description:
      'One-click check-in and check-out with automatic working duration calculation, late detection, and monthly calendar visibility.',
  },
  {
    icon: CalendarDays,
    title: 'Leave Requests & Balances',
    description:
      'Automatic date-overlap validation, tracked leave quotas, and streamlined manager approval with audit-ready decision notes.',
  },
  {
    icon: FileText,
    title: 'Daily Work Reports',
    description:
      'Structured end-of-day updates capturing completed work, active items, blockers, and next-day plans without status-meeting overhead.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Performance Metrics',
    description:
      'Evaluate performance using five configurable, visible factors—completion, timeliness, approvals, attendance, and manager feedback.',
  },
];

const ROLE_PORTALS = [
  {
    role: 'Employee',
    badge: 'Focused Execution',
    summary: 'A distraction-free daily workspace for individual contributors.',
    points: [
      'Check in/out and track monthly attendance',
      'Update task progress and upload versioned deliverables',
      'Submit daily work reports and leave requests',
      'Inspect transparent personal performance metrics and feedback',
    ],
  },
  {
    role: 'Manager',
    badge: 'Team Oversight',
    summary: 'Scoped strictly to direct reports and managed departments.',
    points: [
      'Create, assign, and monitor team tasks and workload balance',
      'Review deliverable submissions and request revisions',
      'Approve leave requests and resolve missing check-outs',
      'Compare team performance and export CSV summaries',
    ],
  },
  {
    role: 'Administrator',
    badge: 'Org Governance',
    summary: 'Centralized control across employees, departments, and policy.',
    points: [
      'Manage employee directory, departments, and reporting lines',
      'Configure role permissions and performance formula weights',
      'Oversee organization-wide tasks, attendance, and leave',
      'Inspect filterable security and workflow activity logs',
    ],
  },
];

const LIFECYCLE_STEPS = [
  { step: '01', title: 'Assign', detail: 'Define scope, priority, deadline, and assignees.' },
  { step: '02', title: 'Execute', detail: 'Employees log progress updates and daily reports.' },
  { step: '03', title: 'Submit', detail: 'Upload versioned files and links for review.' },
  { step: '04', title: 'Approve', detail: 'Managers approve or request clear revisions.' },
  { step: '05', title: 'Measure', detail: 'Metrics feed directly into transparent performance.' },
];

export function LandingPage() {
  const { isAuthenticated, getHomePath } = useAuth();
  const [activePreview, setActivePreview] = useState('manager');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const preview = PREVIEW_TABS[activePreview];

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#202124]">
      {/* Minimal Sticky Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#E8EAED] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1160px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="focus:outline-none">
            <WorkTrackLogo />
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-[#5F6672] md:flex">
            <a href="#capabilities" className="transition-colors hover:text-[#202124]">
              Capabilities
            </a>
            <a href="#portals" className="transition-colors hover:text-[#202124]">
              Portals
            </a>
            <a href="#workflow" className="transition-colors hover:text-[#202124]">
              Workflow
            </a>
            <a href="#security" className="transition-colors hover:text-[#202124]">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={getHomePath()}>
                <Button size="sm">
                  Open Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="sm">
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5F6672] hover:bg-[#F1F3F6] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E8EAED] bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col space-y-1 text-[13px] font-medium text-[#5F6672]">
              {[
                { href: '#capabilities', label: 'Capabilities' },
                { href: '#portals', label: 'Portals' },
                { href: '#workflow', label: 'Workflow' },
                { href: '#security', label: 'Security' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-2.5 py-2 hover:bg-[#F8F9FB] hover:text-[#202124]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="border-b border-[#E8EAED] bg-white">
          <div className="mx-auto max-w-[1160px] px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
            <div className="mx-auto max-w-[680px] text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E8EAED] bg-[#F8F9FB] px-3 py-1 text-[12px] font-medium text-[#5F6672]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3867D6]" />
                Employee Management &amp; Task Performance Platform
              </div>

              <h1 className="text-[32px] font-semibold leading-[1.18] tracking-[-0.025em] text-[#202124] sm:text-[42px]">
                Calm operational clarity for every employee, manager, and admin.
              </h1>

              <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.6] text-[#747B87]">
                WorkTrack brings task assignments, deliverable approvals, attendance, leave management, and
                transparent performance tracking into one structured workspace built for daily work.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                <Link to={isAuthenticated ? getHomePath() : '/login'}>
                  <Button size="lg">
                    {isAuthenticated ? 'Go to your workspace' : 'Sign in to workspace'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#preview">
                  <Button variant="secondary" size="lg">
                    Explore portals
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-[12px] text-[#747B87]">
                Role-based access across Employee, Manager, and Administrator portals.
              </p>
            </div>

            {/* Interactive Role-Switched Product Frame */}
            <div id="preview" className="mt-12">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-[#747B87]">
                  Interactive workspace preview
                </span>
                <div className="inline-flex rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] p-0.5">
                  {Object.entries(PREVIEW_TABS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActivePreview(key)}
                      className={cn(
                        'rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors',
                        activePreview === key
                          ? 'bg-white text-[#202124] shadow-xs'
                          : 'text-[#747B87] hover:text-[#202124]'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[12px] border border-[#E8EAED] bg-[#F8F9FB] shadow-popover">
                {/* Browser Chrome Bar */}
                <div className="flex items-center justify-between border-b border-[#E8EAED] bg-white px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E2E5EA]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E2E5EA]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E2E5EA]" />
                  </div>
                  <div className="rounded-md border border-[#E8EAED] bg-[#F8F9FB] px-3 py-0.5 text-[11px] text-[#747B87]">
                    app.worktrack.io/{activePreview}/dashboard
                  </div>
                  <div className="text-[11px] font-medium text-[#747B87]">{preview.label}</div>
                </div>

                {/* App Shell Preview */}
                <div className="grid grid-cols-1 md:grid-cols-12">
                  {/* Mock Sidebar */}
                  <div className="hidden border-r border-[#E8EAED] bg-white p-3 md:col-span-3 md:block">
                    <div className="mb-3 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-[#747B87]">
                      {preview.label}
                    </div>
                    <div className="space-y-0.5">
                      {preview.sidebar.map((nav) => (
                        <div
                          key={nav}
                          className={cn(
                            'rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium',
                            nav === preview.activeNav
                              ? 'bg-[#EEF2FC] text-[#3867D6]'
                              : 'text-[#5F6672]'
                          )}
                        >
                          {nav}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Content */}
                  <div className="space-y-4 p-4 sm:p-5 md:col-span-9">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[16px] font-semibold text-[#202124]">{preview.heading}</div>
                        <div className="text-[12px] text-[#747B87]">{preview.subheading}</div>
                      </div>
                      <Link to={isAuthenticated ? getHomePath() : '/login'}>
                        <Button size="sm" variant="secondary">
                          {isAuthenticated ? 'Open portal' : 'Sign in'}
                        </Button>
                      </Link>
                    </div>

                    {/* Preview Metric Strip */}
                    <div className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-[#E8EAED] bg-white divide-y sm:grid-cols-4 sm:divide-y-0 sm:divide-x divide-[#E8EAED]">
                      {preview.metrics.map((m) => (
                        <div key={m.label} className="px-3.5 py-2.5">
                          <div className="text-[11px] font-medium text-[#747B87]">{m.label}</div>
                          <div
                            className={cn(
                              'mt-0.5 text-[18px] font-semibold tabular-nums',
                              m.tone === 'success'
                                ? 'text-[#1E7E5A]'
                                : m.tone === 'warning'
                                ? 'text-[#B26B00]'
                                : 'text-[#202124]'
                            )}
                          >
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preview Table Rows */}
                    <div className="overflow-hidden rounded-[8px] border border-[#E8EAED] bg-white divide-y divide-[#E8EAED]">
                      {preview.rows.map((row) => (
                        <div
                          key={row.code}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[13px]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-[#747B87]">{row.code}</span>
                              <span className="truncate font-medium text-[#202124]">{row.title}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-[#747B87]">{row.meta}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden w-24 sm:block">
                              <ProgressBar value={row.progress} />
                            </div>
                            <Badge tone={row.tone}>{row.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section id="capabilities" className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6">
          <div className="max-w-[560px]">
            <div className="text-[12px] font-medium uppercase tracking-wider text-[#3867D6]">
              Core Capabilities
            </div>
            <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em] text-[#202124]">
              Everything required to run daily operations—nothing unnecessary.
            </h2>
            <p className="mt-2 text-[14px] text-[#747B87]">
              Designed for clarity across non-technical teams while giving managers and administrators real
              operational control.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-[10px] border border-[#E8EAED] bg-white sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className={cn(
                    'border-[#E8EAED] p-6',
                    idx >= 1 && 'border-t sm:border-t-0',
                    idx >= 2 && 'sm:border-t lg:border-t-0',
                    idx >= 3 && 'lg:border-t',
                    idx % 2 === 1 && 'sm:border-l lg:border-l-0',
                    idx % 3 !== 0 && 'lg:border-l'
                  )}
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#E8EAED] bg-[#F8F9FB] text-[#3867D6]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#202124]">{cap.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-[#747B87]">{cap.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Three Role-Based Portals */}
        <section id="portals" className="border-y border-[#E8EAED] bg-white">
          <div className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6">
            <div className="max-w-[580px]">
              <div className="text-[12px] font-medium uppercase tracking-wider text-[#3867D6]">
                Role-Based Architecture
              </div>
              <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em] text-[#202124]">
                Three dedicated portals tailored to how each role works.
              </h2>
              <p className="mt-2 text-[14px] text-[#747B87]">
                Not one bloated dashboard with hidden tabs—every role gets a distinct layout, navigation, and
                server-verified data scope.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {ROLE_PORTALS.map((portal) => (
                <div
                  key={portal.role}
                  className="flex flex-col justify-between rounded-[10px] border border-[#E8EAED] bg-[#F8F9FB] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-[#202124]">{portal.role} Portal</h3>
                      <Badge tone="neutral">{portal.badge}</Badge>
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#747B87]">{portal.summary}</p>
                    <ul className="mt-4 space-y-2 border-t border-[#E8EAED] pt-4 text-[13px] text-[#202124]">
                      {portal.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1E7E5A]" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 pt-2">
                    <Link to="/login" className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3867D6] hover:underline">
                      Sign in as {portal.role}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Task Lifecycle Workflow */}
        <section id="workflow" className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6">
          <div className="max-w-[540px]">
            <div className="text-[12px] font-medium uppercase tracking-wider text-[#3867D6]">
              Accountable Workflow
            </div>
            <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em] text-[#202124]">
              From assignment to verified approval in five clear stages.
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LIFECYCLE_STEPS.map((item) => (
              <div key={item.step} className="rounded-[10px] border border-[#E8EAED] bg-white p-4">
                <div className="font-mono text-[11px] font-semibold text-[#3867D6]">{item.step}</div>
                <div className="mt-1.5 text-[14px] font-semibold text-[#202124]">{item.title}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#747B87]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security & Governance Band */}
        <section id="security" className="mx-auto max-w-[1160px] px-4 pb-16 sm:px-6">
          <div className="rounded-[10px] border border-[#E8EAED] bg-white p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-wider text-[#3867D6]">
                  Security &amp; Governance
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.015em] text-[#202124]">
                  Permissions enforced at the API layer, not just the UI.
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#202124]">
                    <Lock className="h-3.5 w-3.5 text-[#3867D6]" />
                    HttpOnly JWT Auth
                  </div>
                  <p className="text-[12px] text-[#747B87]">
                    Bcrypt password hashing, secure session cookies, and rate-limited login endpoints.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#202124]">
                    <Users className="h-3.5 w-3.5 text-[#3867D6]" />
                    Strict Team Scoping
                  </div>
                  <p className="text-[12px] text-[#747B87]">
                    Managers only access authorized direct reports and managed department records.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#202124]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#3867D6]" />
                    Full Audit Trail
                  </div>
                  <p className="text-[12px] text-[#747B87]">
                    Every approval, role update, and employee change is logged for administrator review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-[#E8EAED] bg-white">
          <div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-4 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-[#202124]">
                Ready to bring clarity to daily operations?
              </h2>
              <p className="mt-0.5 text-[13px] text-[#747B87]">
                Sign in with your organization account to access your Employee, Manager, or Admin workspace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={isAuthenticated ? getHomePath() : '/login'}>
                <Button size="lg">
                  {isAuthenticated ? 'Open Dashboard' : 'Sign in to WorkTrack'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#E8EAED] bg-[#F8F9FB]">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] text-[#747B87] sm:px-6">
          <WorkTrackLogo />
          <div>Employee Management &amp; Task Performance Platform</div>
        </div>
      </footer>
    </div>
  );
}
