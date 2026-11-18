import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ForbiddenPage } from '@/pages/shared/SystemPages';

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="flex items-center gap-2.5 text-[13px] text-[#747B87]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3867D6] border-t-transparent" />
          Loading WorkTrack...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading, getHomePath } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#3867D6] border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getHomePath()} replace />;
  }

  return <Outlet />;
}

export function RootRedirect() {
  const { isAuthenticated, loading, getHomePath } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? getHomePath() : '/login'} replace />;
}
