import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, FileText, TrendingUp, Plus, Eye, LogOut, User } from "lucide-react";
import { mockAssessments } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const completedAssessments = mockAssessments.filter(a => a.status === 'completed');
  const draftAssessments = mockAssessments.filter(a => a.status === 'draft');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateAssessment = () => {
    navigate('/assessment/new');
  };

  const handleViewAssessment = (assessmentId: string, status: string) => {
    if (status === 'completed') {
      navigate(`/report/${assessmentId}`);
    } else {
      navigate('/assessment/new'); // In a real app, this would continue the specific assessment
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transfer Friendliness Assessment</h1>
              <p className="text-muted-foreground mt-2">
                Compare and analyze college transfer credit policies
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{currentUser?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreateAssessment} className="bg-primary hover:bg-primary-hover">
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/comparison')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare Schools
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold text-foreground">{mockAssessments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{completedAssessments.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-foreground">{draftAssessments.length}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Institutions</p>
                  <p className="text-2xl font-bold text-foreground">15</p>
                </div>
                <Users className="w-8 h-8 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>
              View and manage your transfer friendliness assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{assessment.name}</h3>
                      <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                        {assessment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Target: {assessment.targetInstitution.name}</span>
                      <span>•</span>
                      <span>{assessment.competitors.length} competitors</span>
                      <span>•</span>
                      <span>Created {formatDate(assessment.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessment.status === 'completed' && (
                      <div className="text-right mr-4">
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                        <p className="text-lg font-bold text-primary">
                          {assessment.overallScores[assessment.targetInstitution.id]}/5.0
                        </p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewAssessment(assessment.id, assessment.status)}
                    >
                      {assessment.status === 'completed' ? 'View Report' : 'Continue'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;