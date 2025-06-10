import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setInitialLoad(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!initialLoad && !isLoading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, toast, initialLoad]);

  return { isLoading, user, isAuthenticated };
}
