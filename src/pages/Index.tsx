
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index: React.FC = () => {
  // Redirect directly to the dashboard bypassing auth for now
  return <Navigate to="/dashboard" replace />;
};

export default Index;
