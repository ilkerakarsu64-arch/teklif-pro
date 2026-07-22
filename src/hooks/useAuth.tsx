import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { getUserPermissions, getRoleLabel, getRoleBadgeStyle } from '../utils/auth';
import { verifyAccessToken, isTokenExpired, decodeToken } from '../utils/jwt.client';

interface AuthContextType {
  user: User | null;
  permissions: UserPermissions;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string, userData: User) => void;
  refreshSession: () => Promise<boolean>;
  hasPermission: (key: keyof UserPermissions) => boolean;
  hasAnyPermission: (keys: (keyof UserPermissions)[]) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'teklif_access_token';
const REFRESH_TOKEN_KEY = 'teklif_refresh_token';
const USER_KEY = 'teklif_user';
const TOKEN_EXPIRY_KEY = 'teklif_token_expiry';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(getUserPermissions('ADMIN'));

  const updatePermissions = useCallback((role: UserRole) => {
    setPermissions(getUserPermissions(role));
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!token || !refreshToken || !savedUser) {
        setIsLoading(false);
        return;
      }

      const payload = verifyAccessToken(token);
      if (payload && payload.sub) {
        const userData = JSON.parse(savedUser);
        if (userData.id === payload.sub) {
          setUser(userData);
          updatePermissions(userData.role);
        } else {
          await clearSession();
        }
      } else if (refreshToken) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          await clearSession();
        }
      } else {
        await clearSession();
      }
    } catch (err) {
      console.error('Session load error:', err);
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [updatePermissions]);

  const clearSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch {
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    setUser(null);
    setPermissions(getUserPermissions('ADMIN'));
  }, []);

  const storeSession = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + 15 * 60 * 1000).toString());
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        return { success: false, error: data.error || 'Giriş başarısız. Kullanıcı adı ve şifrenizi kontrol edin.' };
      }

      setUser(data.user);
      updatePermissions(data.user.role);
      storeSession(data.accessToken, data.refreshToken, data.user);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Sunucu bağlantı hatası: ' + (err.message || 'Lütfen sunucunun açık olduğundan emin olun.') };
    } finally {
      setIsLoading(false);
    }
  }, [storeSession, updatePermissions]);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await res.json();

      if (!res.ok || !data.accessToken) {
        return false;
      }

      localStorage.setItem(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
      localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + 15 * 60 * 1000).toString());

      return true;
    } catch {
      return false;
    }
  }, []);

  const hasPermission = useCallback((key: keyof UserPermissions) => {
    return permissions[key] === true;
  }, [permissions]);

  const hasAnyPermission = useCallback((keys: (keyof UserPermissions)[]) => {
    return keys.some(key => permissions[key] === true);
  }, [permissions]);

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      if (userData.role) {
        updatePermissions(userData.role);
      }
    }
  }, [user, updatePermissions]);

  const setSession = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    setUser(userData);
    updatePermissions(userData.role);
    storeSession(accessToken, refreshToken, userData);
  }, [storeSession, updatePermissions]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const value: AuthContextType = {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setSession,
    refreshSession,
    hasPermission,
    hasAnyPermission,
    hasRole,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, hasRole } = useAuth();
  return { permissions, hasPermission, hasAnyPermission, hasRole };
}

export function useUser() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  return { user, isAuthenticated, isLoading, updateUser };
}

export function useAuthActions() {
  const { login, logout, refreshSession } = useAuth();
  return { login, logout, refreshSession };
}

export { getRoleLabel, getRoleBadgeStyle } from '../utils/auth';