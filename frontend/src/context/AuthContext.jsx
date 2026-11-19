import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res?.data?.token) {
        try {
          localStorage.setItem('worktrack_token', res.data.token);
        } catch {}
      }
      setUser(res.data.user);
      setEmployee(res.data.employee);
      setPermissions(res.data.permissions || {});
    } catch {
      try {
        localStorage.removeItem('worktrack_token');
      } catch {}
      setUser(null);
      setEmployee(null);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res?.data?.token) {
      try {
        localStorage.setItem('worktrack_token', res.data.token);
      } catch {}
    }
    setUser(res.data.user);
    setEmployee(res.data.employee);
    setPermissions(res.data.permissions || {});
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      try {
        localStorage.removeItem('worktrack_token');
      } catch {}
      setUser(null);
      setEmployee(null);
      setPermissions({});
    }
  };

  const getHomePath = (roleOverride) => {
    const r = roleOverride || user?.role;
    if (r === 'admin') return '/admin/dashboard';
    if (r === 'manager') return '/manager/dashboard';
    return '/employee/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        permissions,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshMe,
        getHomePath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
