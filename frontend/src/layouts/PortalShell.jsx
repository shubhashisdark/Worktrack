import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowLeftRight,
  Bell,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationApi } from '@/services/api';
import { Avatar } from '@/components/ui/Primitives';
import { NotificationPanelDrawer } from '@/components/modals/NotificationDrawer';
import { cn } from '@/lib/utils';

const SIDEBAR_STORAGE_KEY = 'worktrack_sidebar_collapsed';

export function WorkTrackLogo({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#3867D6] text-white font-semibold text-[13px] tracking-tight">
        W
      </div>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#202124]">WorkTrack</span>
      )}
    </div>
  );
}

export function PortalShell({ portalLabel, navItems, profilePath, settingsPath, notificationsPath }) {
  const { user, employee, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcuts: Ctrl/Cmd+B toggles desktop sidebar; Escape closes mobile drawer
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'badge'],
    queryFn: () => notificationApi.list({ limit: 5, unreadOnly: 'true' }),
    refetchInterval: 45000,
  });

  const unreadCount = notifData?.data?.unreadCount || 0;
  const displayName = employee?.fullName || user?.email || 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const portalSwitchOptions =
    user?.role === 'admin'
      ? [
          { label: 'Admin Portal', to: '/admin/dashboard' },
          { label: 'Manager Portal', to: '/manager/dashboard' },
          { label: 'Employee Portal', to: '/employee/dashboard' },
        ]
      : user?.role === 'manager'
      ? [
          { label: 'Manager Portal', to: '/manager/dashboard' },
          { label: 'Employee Portal', to: '/employee/dashboard' },
        ]
      : [];

  const renderNav = (isMobile = false) => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-[#EEF2FC] text-[#3867D6]'
                  : 'text-[#5F6672] hover:bg-[#F1F3F6] hover:text-[#202124]',
                !isMobile && collapsed && 'justify-center px-2'
              )
            }
            title={!isMobile && collapsed ? item.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-[#202124]">
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 z-30 border-r border-[#E8EAED] bg-white transition-[width] duration-150',
          collapsed ? 'w-[64px]' : 'w-[240px]'
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center border-b border-[#E8EAED] px-4',
            collapsed ? 'justify-center px-2' : 'justify-between'
          )}
        >
          <WorkTrackLogo collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              title="Collapse sidebar (Ctrl+B)"
              className="rounded-md p-1.5 text-[#747B87] transition-colors hover:bg-[#F1F3F6] hover:text-[#202124]"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="border-b border-[#E8EAED] px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-[#747B87]">
            {portalLabel}
          </div>
        )}

        {renderNav(false)}

        <div className={cn('border-t border-[#E8EAED] p-2.5', collapsed && 'flex justify-center')}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            className={cn(
              'flex items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-[#747B87] transition-colors hover:bg-[#F1F3F6] hover:text-[#202124]',
              !collapsed && 'w-full'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-[#202124]/35" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 flex w-[260px] flex-col border-r border-[#E8EAED] bg-white shadow-modal">
            <div className="flex h-14 items-center justify-between border-b border-[#E8EAED] px-4">
              <WorkTrackLogo />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-[#747B87] hover:bg-[#F1F3F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-[#E8EAED] px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-[#747B87]">
              {portalLabel}
            </div>
            {renderNav(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-150',
          collapsed ? 'md:pl-[64px]' : 'md:pl-[240px]'
        )}
      >
        {/* Compact Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[#E8EAED] bg-white px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-[#5F6672] hover:bg-[#F1F3F6] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Sidebar Collapse Toggle (Always accessible on/off) */}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Show sidebar (Ctrl+B)' : 'Hide sidebar (Ctrl+B)'}
              className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E8EAED] bg-white text-[#5F6672] transition-colors hover:bg-[#F8F9FB] hover:text-[#202124]"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>

            <div className="text-[13px] font-medium text-[#747B87]">
              <span className="text-[#202124]">{portalLabel}</span>
              {employee?.departmentId?.name && (
                <span className="hidden sm:inline"> · {employee.departmentId.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label="Open notifications"
              title="Notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-[#5F6672] transition-colors hover:bg-[#F1F3F6] hover:text-[#202124]"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3867D6] px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 text-left transition-colors hover:border-[#E8EAED] hover:bg-[#F8F9FB] focus:outline-none"
                >
                  <Avatar name={displayName} src={employee?.avatarUrl} size="sm" />
                  <div className="hidden sm:block leading-tight">
                    <div className="text-[13px] font-medium text-[#202124]">{displayName}</div>
                    <div className="text-[11px] text-[#747B87] capitalize">{user?.role}</div>
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 w-56 rounded-[10px] border border-[#E8EAED] bg-white p-1.5 shadow-popover"
                >
                  <div className="border-b border-[#E8EAED] px-2.5 py-2 mb-1">
                    <div className="text-[13px] font-medium text-[#202124] truncate">{displayName}</div>
                    <div className="text-[12px] text-[#747B87] truncate">{user?.email}</div>
                  </div>
                  <DropdownMenu.Item
                    onSelect={() => navigate(profilePath)}
                    className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[13px] text-[#202124] outline-none hover:bg-[#F1F3F6]"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#747B87]" />
                    My Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => navigate(settingsPath)}
                    className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[13px] text-[#202124] outline-none hover:bg-[#F1F3F6]"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#747B87]" />
                    Settings
                  </DropdownMenu.Item>

                  {portalSwitchOptions.length > 0 && (
                    <>
                      <DropdownMenu.Separator className="my-1 h-px bg-[#E8EAED]" />
                      <div className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#9AA0A6]">
                        Switch Portal
                      </div>
                      {portalSwitchOptions.map((opt) => (
                        <DropdownMenu.Item
                          key={opt.to}
                          onSelect={() => navigate(opt.to)}
                          className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[13px] text-[#202124] outline-none hover:bg-[#F1F3F6]"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5 text-[#747B87]" />
                          {opt.label}
                        </DropdownMenu.Item>
                      ))}
                    </>
                  )}

                  <DropdownMenu.Separator className="my-1 h-px bg-[#E8EAED]" />
                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[13px] text-[#C0392B] outline-none hover:bg-[#FDEEEC]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page Container */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>

      <NotificationPanelDrawer
        open={notifOpen}
        onOpenChange={setNotifOpen}
        notificationsPath={notificationsPath}
      />
    </div>
  );
}
