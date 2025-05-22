
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index: React.FC = () => {
  // Redirect directly to the dashboard or home page depending on auth status
  return <Navigate to="/dashboard" replace />;
};

export default Index;
