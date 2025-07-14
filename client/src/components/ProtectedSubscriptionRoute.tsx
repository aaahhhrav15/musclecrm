import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '@/lib/axios';

const ProtectedSubscriptionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      location.pathname.startsWith('/subscriptions') ||
      location.pathname.startsWith('/dashboard/settings')
    ) {
      setLoading(false);
      return;
    }

    axiosInstance.get('/gym/info')
      .then(res => {
        if (res.data && res.data.subscriptionActive === false) {
          navigate('/subscriptions', { replace: true });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <div className="text-lg font-semibold text-gray-700">Checking subscription status...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedSubscriptionRoute; 