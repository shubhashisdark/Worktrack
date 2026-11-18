# WorkTrack — UI/UX Design System Specification

WorkTrack is designed as a calm, restrained, high-density enterprise SaaS platform inspired by **Linear**, **Notion**, **Asana**, **Stripe Dashboard**, and **Vercel**—prioritizing clarity, scanability, and daily operational efficiency over decorative elements.

---

## 1. Color System

| Role | Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| Canvas Background | `--bg-canvas` | `#F8F9FB` | Application shell background |
| Surface | `--bg-surface` | `#FFFFFF` | Tables, panels, sidebar, modals, drawers |
| Subtle Surface | `--bg-subtle` | `#F1F3F6` | Table headers, hover fills, neutral pills |
| Border | `--border-default` | `#E8EAED` | Hairline `1px` borders, dividers, table rules |
| Primary Text | `--text-primary` | `#202124` | Headings, body copy, primary table cells |
| Secondary Text | `--text-secondary` | `#747B87` | Form labels, table headers, metadata, helper text |
| Primary Action | `--action-primary` | `#3867D6` | Primary buttons, active navigation state, focus rings |
| Primary Hover | `--action-primary-hover` | `#2D55B8` | Primary button hover |
| Primary Soft Tint | `--action-primary-soft` | `#EEF2FC` | Active nav background, selected rows |
| Success | `status-success` | `#1E7E5A` / `#ECF7F2` | Approved, Present, Completed, Active |
| Warning | `status-warning` | `#B26B00` / `#FDF6E9` | Pending Review, Late, Medium Priority |
| Danger | `status-danger` | `#C0392B` / `#FDEEEC` | Overdue, Revision Needed, Rejected, Urgent/High Priority |
| Neutral | `status-neutral` | `#5F6672` / `#F1F3F6` | Draft, Archived, Inactive, Low Priority |

---

## 2. Typography (`Inter`)

| Style | Size / Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- |
| Page Heading | `20px / 28px` | `600` (`-0.015em`) | Top-level view titles (`PageHeader`) |
| Section Heading | `14px–15px / 22px` | `600` | Panel & modal headers (`PanelHeader`) |
| Body Text | `14px / 20px` | `400` | Narrative descriptions, reports, feedback |
| Table Cell | `13px / 18px` | `400` / `500` | Enterprise data tables |
| Table Header / Helper | `12px / 16px` | `500` / `400` | Column headers, timestamps, field hints |
| Form Label | `13px / 18px` | `500` | Input labels |
| Button | `13px / 18px` | `500` | Interactive controls |
| Status / Priority Badge | `12px / 16px` | `500` | Semantic pills (`StatusBadge`) |

---

## 3. Layout & Responsive Grid

- **Desktop (`>=1024px`)**: Fixed `240px` collapsible sidebar (`64px` icon rail when collapsed), `56px` sticky top bar, max content width `1280px` with `24px` padding.
- **Tablet (`768px–1023px`)**: Collapsible icon rail sidebar, horizontally scrollable tables, 2-column form grids.
- **Mobile (`<768px`)**: Slide-over navigation drawer, single-column stacked layouts, compact top bar, accessible touch targets.
- **Elevation & Radius**: `8px–10px` component corner radius; `1px solid #E8EAED` borders on static panels; subtle elevation shadows reserved exclusively for popovers, modals, and drawers.

---

## 4. Reusable Component Library

- **Primitives (`src/components/ui/`)**: `Button`, `Input`, `Textarea`, `Select`, `FormField`, `Modal`, `Drawer`, `Badge`, `StatusBadge`, `Avatar`, `Panel`, `PanelHeader`, `Switch`, `TabsBar`, `ProgressBar`.
- **Enterprise Patterns (`src/components/common/`)**: `PageHeader`, `MetricStrip`, `DataTable` (search, sorting, filters, pagination, bulk selection, empty/loading/error states), `LoadingSkeleton`, `PageSkeleton`, `EmptyState`, `ErrorState`, `ConfirmDialog`.
- **Domain Modals & Drawers (`src/components/modals/`)**:
  - `TaskFormModal` (Create / Edit Task)
  - `TaskDetailsDrawer` (Contextual inspection)
  - `SubmitDeliverableModal` (File upload + external links + notes)
  - `ReviewSubmissionDrawer`, `ApproveConfirmModal`, `RequestRevisionModal`
  - `EmployeeFormModal`, `DepartmentFormModal`, `ApplyLeaveModal`, `GiveFeedbackModal`
  - `NotificationPanelDrawer`

---

## 5. Mandatory UX States

Every major view handles all 7 enterprise UX states:
1. **Default** — Populated live data from `/api/v1`.
2. **Loading** — `PageSkeleton` / table row pulse skeletons.
3. **Empty** — `EmptyState` with clear contextual guidance and primary CTA.
4. **Error** — `ErrorState` with actionable retry trigger and inline API validation messages.
5. **Success** — Non-intrusive `sonner` toast confirmation.
6. **Disabled** — Clear opacity and non-interactive states on locked or submitting buttons/fields.
7. **Permission Denied** — Dedicated `ForbiddenPage` (`403`) enforced by both frontend `ProtectedRoute` and backend RBAC middleware.
