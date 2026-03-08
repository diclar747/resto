import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { getRoleDefaultPath } from '../utils/role-routing';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  // Admin bypasses all role checks
  if (user.role === 'admin') return <>{children}</>;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDefaultPath(user.role)} replace />;
  }

  return <>{children}</>;
}
