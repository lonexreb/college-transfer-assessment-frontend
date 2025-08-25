import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading, isPending, isAdmin, logout } = useAuth();

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

  // If user is authenticated but not an admin (either pending or just not approved)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start gap-2 mb-4">
                <Mail className="h-4 w-4 mt-0.5" />
                <div>
                  {isPending ? (
                    <>
                      Your account is pending approval from an administrator. Please wait for approval before accessing the application.
                      {!currentUser.emailVerified && (
                        <span className="text-amber-600 block mt-2">Please also verify your email address.</span>
                      )}
                    </>
                  ) : (
                    "You need admin privileges to access this application. Please contact an administrator for access."
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Signed in as: {currentUser.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Logout
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // User is authenticated and has admin privileges, show the protected content
  return <>{children};
};

export default ProtectedRoute;