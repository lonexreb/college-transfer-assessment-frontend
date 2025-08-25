import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show the auth page
  if (!currentUser) {
    return <AuthPage />;
  }

  // If user exists but email is not verified, the Login component will handle the verification flow
  if (!currentUser.emailVerified) {
    return <AuthPage />;
  }

  // User is authenticated and verified, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;