import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { Shield, UserPlus, UserMinus, RefreshCw, Trash2 } from 'lucide-react';

interface AdminUser {
  email: string;
  addedAt: string;
  addedBy: string;
}

interface PendingUser {
  email: string;
  uid: string;
  signupDate: string;
  emailVerified: boolean;
}

const AdminManager = () => {
  const { currentUser, isAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = 'https://degree-works-backend-hydrabeans.replit.app';

  const fetchAdmins = async () => {
    if (!isAdmin || !currentUser) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/list`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setMessage({ type: 'error', text: 'Failed to fetch admin list' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    if (!isAdmin || !currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/pending`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }

      const data = await response.json();
      setPendingUsers(data.pendingUsers || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch pending users' });
    }
  };

  useEffect(() => {
    if (isAdmin && currentUser) {
      fetchAdmins();
      fetchPendingUsers();
    }
  }, [isAdmin, currentUser]);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', newAdminEmail.trim());

      const response = await fetch(`${API_BASE}/api/admin/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add admin');
      }

      setMessage({ type: 'success', text: 'Admin added successfully' });
      setNewAdminEmail('');
      await fetchAdmins();
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (email: string) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch(`${API_BASE}/api/admin/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve user');
      }

      setMessage({ type: 'success', text: 'User approved successfully' });
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async (email: string) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch(`${API_BASE}/api/admin/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject user');
      }

      setMessage({ type: 'success', text: 'User rejected successfully' });
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch(`${API_BASE}/api/admin/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove admin');
      }

      setMessage({ type: 'success', text: 'Admin removed successfully' });
      await fetchAdmins();
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      setMessage({ type: 'error', text: error.message });
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
            <Input
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
            />
            <Button 
              onClick={handleAddAdmin} 
              disabled={loading || !newAdminEmail.trim()}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
            <Button 
              onClick={() => {
                fetchAdmins();
                fetchPendingUsers();
              }} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Pending User Approvals</h3>
              {pendingUsers.length === 0 ? (
                <p className="text-muted-foreground">No pending users</p>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map((user) => (
                    <div 
                      key={user.email} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Signed up on {new Date(user.signupDate).toLocaleDateString()}
                          {user.emailVerified ? 
                            <span className="text-green-600 ml-2">✓ Email verified</span> : 
                            <span className="text-amber-600 ml-2">⚠ Email not verified</span>
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Pending</Badge>
                        <Button
                          onClick={() => handleApproveUser(user.email)}
                          disabled={loading}
                          variant="default"
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectUser(user.email)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Admin Users</h3>
              {admins.length === 0 ? (
                <p className="text-muted-foreground">No admin users found</p>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div 
                      key={admin.email} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{admin.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Added on {new Date(admin.addedAt).toLocaleDateString()} by {admin.addedBy}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Admin</Badge>
                        {admin.email !== currentUser?.email && (
                          <Button
                            onClick={() => handleRemoveAdmin(admin.email)}
                            disabled={loading}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManager;