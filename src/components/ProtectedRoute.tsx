
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser } = useAuth();

  return currentUser ? <>{children}</> : <AuthPage />;
};

export default ProtectedRoute;
