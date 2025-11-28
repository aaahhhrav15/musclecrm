import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      setInitialLoad(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!initialLoad && !loading && !isAuthenticated) {
      // Only redirect if not on a protected page (e.g., not on /dashboard, /customers, etc.)
      const protectedPaths = ['/dashboard', '/customers', '/membership-plans', '/trainers', '/class-schedules', '/nutrition-plans', '/events-workshops', '/waiver-forms', '/member-communications', '/health-assessments'];
      const isProtectedPage = protectedPaths.some(path => window.location.pathname.includes(path));
      if (!isProtectedPage) {
        toast({
          title: "Authentication required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        navigate(redirectTo);
      }
    }
  }, [isAuthenticated, loading, navigate, redirectTo, toast, initialLoad]);

  return { isLoading: loading, user, isAuthenticated };
}
