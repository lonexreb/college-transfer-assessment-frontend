import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, FileText, TrendingUp, Plus, Eye, LogOut, User, BarChart3, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface Comparison {
  id: string;
  schools: string[];
  weights: any;
  aiReport: string;
  schoolsData: any[];
  presentationResult?: any;
  createdAt: any;
  userId: string;
  userEmail: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInstitutions, setTotalInstitutions] = useState(0);

  useEffect(() => {
    const fetchComparisons = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        console.log("Fetching all comparisons (admin portal)");

        // Query all comparisons without user filtering
        const q = query(
          collection(db, "comparisons"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        console.log("Total documents found:", querySnapshot.size);

        const comparisonsData: Comparison[] = [];
        const institutionSet = new Set<string>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Processing document:", doc.id, data);
          comparisonsData.push({
            id: doc.id,
            schools: data.schools || [],
            weights: data.weights || {},
            aiReport: data.aiReport || "",
            schoolsData: data.schoolsData || [],
            presentationResult: data.presentationResult,
            createdAt: data.createdAt,
            userId: data.userId,
            userEmail: data.userEmail
          });

          // Add schools to institution set for counting unique institutions
          if (data.schools) {
            data.schools.forEach((school: string) => institutionSet.add(school));
          }
        });

        console.log("Final comparisons data:", comparisonsData);
        setComparisons(comparisonsData);
        setTotalInstitutions(institutionSet.size);
      } catch (error) {
        console.error("Error fetching comparisons:", error);

        // If the ordered query fails due to missing index, try without orderBy
        try {
          console.log("Trying query without orderBy...");
          const simpleQuery = query(collection(db, "comparisons"));

          const querySnapshot = await getDocs(simpleQuery);
          console.log("Simple query documents:", querySnapshot.size);

          const comparisonsData: Comparison[] = [];
          const institutionSet = new Set<string>();

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            comparisonsData.push({
              id: doc.id,
              schools: data.schools || [],
              weights: data.weights || {},
              aiReport: data.aiReport || "",
              schoolsData: data.schoolsData || [],
              presentationResult: data.presentationResult,
              createdAt: data.createdAt,
              userId: data.userId,
              userEmail: data.userEmail
            });

            if (data.schools) {
              data.schools.forEach((school: string) => institutionSet.add(school));
            }
          });

          // Sort by createdAt on client side
          comparisonsData.sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          });

          setComparisons(comparisonsData);
          setTotalInstitutions(institutionSet.size);
        } catch (simpleError) {
          console.error("Simple query also failed:", simpleError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [currentUser]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";

    // Handle Firestore timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    // Handle regular date string
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateAssessment = () => {
    navigate('/assessment/new');
  };

  const handleViewComparison = (comparison: Comparison) => {
    // Store the comparison data in sessionStorage for viewing
    sessionStorage.setItem('viewComparison', JSON.stringify(comparison));
    navigate('/comparison');
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
                  <p className="text-sm font-medium text-muted-foreground">Total Comparisons</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : comparisons.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">With Presentations</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : comparisons.filter(c => c.presentationResult).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent (7 days)</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                      comparisons.filter(c => {
                        const createdDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        return createdDate > sevenDaysAgo;
                      }).length
                    }
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalInstitutions}
                  </p>
                </div>
                <Users className="w-8 h-8 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Comparisons */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Comparisons</CardTitle>
            <CardDescription>
              View and manage your school comparison analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading comparisons...</span>
              </div>
            ) : comparisons.length === 0 ? (
              <div className="text-center p-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No comparisons yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first school comparison analysis
                </p>
                <Button onClick={handleCreateAssessment}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Comparison
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {comparisons.map((comparison) => (
                  <div key={comparison.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {comparison.schools.slice(0, 2).join(" vs ")}
                          {comparison.schools.length > 2 && ` +${comparison.schools.length - 2} more`}
                        </h3>
                        <Badge variant="default">
                          Completed
                        </Badge>
                        {comparison.presentationResult && (
                          <Badge variant="secondary">
                            Has Presentation
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{comparison.schools.length} schools compared</span>
                        <span>•</span>
                        <span>Created {formatDate(comparison.createdAt)}</span>
                        {comparison.presentationResult && (
                          <>
                            <span>•</span>
                            <span>Presentation ready</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewComparison(comparison)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Analysis
                      </Button>
                      {comparison.presentationResult && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`http://tramway.proxy.rlwy.net:38813${comparison.presentationResult.edit_path}`, '_blank')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Open Presentation
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;