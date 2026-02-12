import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';

// Routes that require premium subscription
const PREMIUM_ROUTES = [
  '/relatorios',
  '/fidelidade',
  '/descontos',
  '/integracoes',
  '/notificacoes',
];

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
  const { isPremium, isLoading: subLoading } = useSubscription();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOrganization) {
    if (!profile?.organization_id) {
      return <Navigate to="/onboarding" replace />;
    }

    // Block premium routes when subscription expired (only after sub loaded)
    if (!subLoading && !isPremium && PREMIUM_ROUTES.includes(location.pathname)) {
      return <Navigate to="/dashboard?upgrade=true" replace />;
    }
  } else {
    if (profile?.organization_id && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
