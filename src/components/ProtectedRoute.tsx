import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrganization?: boolean;
  adminOnly?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireOrganization = true,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has organization when required
  if (requireOrganization) {
    if (!profile?.organization_id) {
      return <Navigate to="/onboarding" replace />;
    }
  } else {
    // For onboarding page - redirect to dashboard if user already has organization
    if (profile?.organization_id && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check admin access
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
