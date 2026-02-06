import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isMasterAccount, isLoading } = useAuth();

  // Master account or admin has full access
  if (isLoading) {
    return null; // Parent ProtectedRoute already handles loading
  }

  if (!isAdmin && !isMasterAccount) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
