import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { PasswordInput } from '@/components/ui/FormControls';
import { PortalShell } from '@/layouts/PortalShell';
import { LoginPage } from '@/pages/auth/AuthPages';
import { LandingPage } from '@/pages/public/LandingPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  notificationApi: {
    list: vi.fn().mockResolvedValue({ data: { items: [], unreadCount: 0 } }),
  },
}));

import { useAuth } from '@/context/AuthContext';

describe('WorkTrack Frontend Core Components & Guards', () => {
  it('validates login form inputs and shows inline errors', async () => {
    useAuth.mockReturnValue({
      login: vi.fn(),
      getHomePath: () => '/employee/dashboard',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/enter a valid work email/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Ensure no demo account shortcuts leak into production login UI
    expect(screen.queryByText(/quick demo accounts/i)).not.toBeInTheDocument();
  });

  it('renders DataTable empty, error, and populated states properly', () => {
    const columns = [
      { key: 'code', header: 'Code' },
      { key: 'title', header: 'Title' },
    ];

    const { rerender } = render(
      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No tasks yet"
        emptyDescription="Assigned work will show up here."
      />
    );
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();

    rerender(
      <DataTable
        columns={columns}
        data={[]}
        error="Network timeout"
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Network timeout')).toBeInTheDocument();

    rerender(
      <DataTable
        columns={columns}
        data={[{ _id: '1', code: 'TSK-1001', title: 'Audit RBAC routes' }]}
      />
    );
    expect(screen.getByText('TSK-1001')).toBeInTheDocument();
    expect(screen.getByText('Audit RBAC routes')).toBeInTheDocument();
  });

  it('shows 403 Permission Denied when an Employee visits an Admin-only route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { role: 'employee', email: 'employee@worktrack.io' },
      getHomePath: () => '/employee/dashboard',
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<div>Admin Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/permission denied \(403\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret')).not.toBeInTheDocument();
  });

  it('renders LandingPage and switches interactive portal previews', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      getHomePath: () => '/employee/dashboard',
    });

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/calm operational clarity/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Admin Portal' }));
    expect(screen.getByText('Organization Overview')).toBeInTheDocument();
  });

  it('toggles password visibility with the show/hide eye button', () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles sidebar collapse on/off and persists preference', () => {
    localStorage.clear();
    useAuth.mockReturnValue({
      user: { role: 'admin', email: 'admin@worktrack.io' },
      employee: { fullName: 'System Administrator' },
      logout: vi.fn(),
    });

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route
              element={
                <PortalShell
                  portalLabel="Admin Portal"
                  navItems={[{ label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard }]}
                  profilePath="/admin/profile"
                  settingsPath="/admin/settings"
                  notificationsPath="/admin/notifications"
                />
              }
            >
              <Route path="/admin/dashboard" element={<div>Dashboard Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const collapseButtons = screen.getAllByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseButtons[0]);
    expect(localStorage.getItem('worktrack_sidebar_collapsed')).toBe('true');

    const expandButtons = screen.getAllByRole('button', { name: /expand sidebar/i });
    fireEvent.click(expandButtons[0]);
    expect(localStorage.getItem('worktrack_sidebar_collapsed')).toBe('false');
  });
});
