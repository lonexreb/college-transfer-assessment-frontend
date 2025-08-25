import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading, isPending, isAdmin } = useAuth();

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

  // If user is pending approval, show pending message with limited access
  if (isPending && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto mb-8">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Your account is pending approval from an administrator. You have limited access until approved.
              {!currentUser.emailVerified && (
                <span className="text-amber-600">Please also verify your email address.</span>
              )}
            </AlertDescription>
          </Alert>
          {children}
        </div>
      </div>
    );
  }

  // User is authenticated and approved, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;