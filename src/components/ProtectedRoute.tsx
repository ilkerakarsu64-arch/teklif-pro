import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Lock, AlertCircle, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof import('../types').UserPermissions;
  requiredPermissions?: (keyof import('../types').UserPermissions)[];
  requiredRole?: import('../types').UserRole | import('../types').UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  fallback
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Oturum yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <AccessDeniedFallback
        title="Bu Sayfaya Erişim Yetkiniz Yok"
        message={`Bu işlem için "${requiredPermission}" yetkisi gerekiyor.`}
        icon={Lock}
      />
    );
  }

  if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
    return fallback || (
      <AccessDeniedFallback
        title="Bu Sayfaya Erişim Yetkiniz Yok"
        message={`Bu işlem için şu yetkilerden birine sahip olmanız gerekiyor: ${requiredPermissions.join(', ')}`}
        icon={ShieldAlert}
      />
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <AccessDeniedFallback
        title="Bu Sayfaya Erişim Yetkiniz Yok"
        message={`Bu sayfa sadece ${Array.isArray(requiredRole) ? requiredRole.join(' veya ') : requiredRole} rolüne sahip kullanıcılar içindir.`}
        icon={ShieldAlert}
      />
    );
  }

  return <>{children}</>;
}

interface AccessDeniedFallbackProps {
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

function AccessDeniedFallback({ title, message, icon: Icon }: AccessDeniedFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-center">
          <Icon className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Bu sayfaya erişim izniniz bulunmuyor.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
        >
          Geri Dön
        </button>
      </div>
    </div>
  );
}

interface HasPermissionProps {
  children: ReactNode;
  permission?: keyof import('../types').UserPermissions;
  permissions?: (keyof import('../types').UserPermissions)[];
  role?: import('../types').UserRole | import('../types').UserRole[];
  fallback?: ReactNode;
}

export function HasPermission({
  children,
  permission,
  permissions,
  role,
  fallback = null
}: HasPermissionProps) {
  const { hasPermission, hasAnyPermission, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && !hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function HasRole({ children, role, fallback = null }: { children: ReactNode; role: import('../types').UserRole | import('../types').UserRole[]; fallback?: ReactNode }) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) return null;
  if (!hasRole(role)) return <>{fallback}</>;

  return <>{children}</>;
}

export function HasAnyRole({ children, roles, fallback = null }: { children: ReactNode; roles: import('../types').UserRole[]; fallback?: ReactNode }) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) return null;
  if (!roles.some(r => hasRole(r))) return <>{fallback}</>;

  return <>{children}</>;
}