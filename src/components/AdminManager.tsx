
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Shield, UserPlus, UserMinus, RefreshCw } from 'lucide-react';

interface User {
  uid: string;
  email: string;
  customClaims: { admin?: boolean };
}

const AdminManager = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const functions = getFunctions();
  const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
  const removeAdminClaim = httpsCallable(functions, 'removeAdminClaim');
  const listUsers = httpsCallable(functions, 'listUsers');

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const result = await listUsers();
      setUsers((result.data as any).users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleSetAdmin = async (uid: string) => {
    setLoading(true);
    try {
      await setAdminClaim({ uid });
      setMessage({ type: 'success', text: 'Admin privileges granted successfully' });
      await fetchUsers();
    } catch (error) {
      console.error('Error setting admin claim:', error);
      setMessage({ type: 'error', text: 'Failed to grant admin privileges' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (uid: string) => {
    setLoading(true);
    try {
      await removeAdminClaim({ uid });
      setMessage({ type: 'success', text: 'Admin privileges removed successfully' });
      await fetchUsers();
    } catch (error) {
      console.error('Error removing admin claim:', error);
      setMessage({ type: 'error', text: 'Failed to remove admin privileges' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You need admin privileges to access user management.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={fetchUsers} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Users
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">All Users</h3>
            {users.length === 0 ? (
              <p className="text-muted-foreground">No users found</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div 
                    key={user.uid} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        UID: {user.uid}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.customClaims?.admin ? (
                        <>
                          <Badge variant="default">Admin</Badge>
                          {user.uid !== currentUser?.uid && (
                            <Button
                              onClick={() => handleRemoveAdmin(user.uid)}
                              disabled={loading}
                              variant="destructive"
                              size="sm"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Remove Admin
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={() => handleSetAdmin(user.uid)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManager;
