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

const AdminManager = () => {
  const { currentUser, isAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = 'https://45d6fae9-a922-432b-b45b-6bf3e63633ed-00-1253eg8epuixe.picard.replit.dev';

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

  useEffect(() => {
    if (isAdmin && currentUser) {
      fetchAdmins();
    }
  }, [isAdmin, currentUser]);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newAdminEmail.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add admin');
      }

      setMessage({ type: 'success', text: 'Admin added successfully' });
      setNewAdminEmail('');
      await fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove admin');
      }

      setMessage({ type: 'success', text: 'Admin removed successfully' });
      await fetchAdmins();
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
              onClick={fetchAdmins} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManager;