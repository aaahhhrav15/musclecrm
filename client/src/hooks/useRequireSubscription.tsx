import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '@/lib/axios';

export function useRequireSubscription() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't check on the subscriptions or settings page
    if (
      location.pathname.startsWith('/subscriptions') ||
      location.pathname.startsWith('/dashboard/settings')
    ) {
      return;
    }

    axiosInstance.get('/gym/info')
      .then(res => {
        if (res.data && res.data.subscriptionActive === false) {
          navigate('/subscriptions', { replace: true });
        }
      })
      .catch(() => {
        // Optionally handle error
      });
  }, [navigate, location.pathname]);
} 