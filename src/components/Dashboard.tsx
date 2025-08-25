import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Users, FileText, TrendingUp, Plus, Eye, LogOut, User, BarChart3, Shield, Clock } from "lucide-react";
import { mockAssessments } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import AdminManager from "@/components/AdminManager";
import PresentationManager from "@/components/PresentationManager";
import PromptManager from "./PromptManager";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Alert, AlertDescription } from "@/components/ui/alert";


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
  const { currentUser, logout, isAdmin, isPending } = useAuth();

  const handleCreateAssessment = () => {
    navigate('/assessment/new');
  };

  const handleViewComparison = (comparison: any) => {
    // Store the comparison data for viewing
    sessionStorage.setItem('viewComparison', JSON.stringify(comparison));
    navigate('/comparison');
  };
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInstitutions, setTotalInstitutions] = useState(0);
  const [presentationCount, setPresentationCount] = useState(0);
  const [weeklyComparisons, setWeeklyComparisons] = useState(0);

  const fetchPresentationCount = async () => {
    try {
      const response = await fetch('https://degree-works-backend-hydrabeans.replit.app/api/v1/ppt/list/presentations');
      if (response.ok) {
        const data = await response.json();
        setPresentationCount(data.presentations?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching presentation count:", error);
    }
  };

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
        let thisWeekComparisons = 0;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Processing document:", doc.id, data);

          const comparison = {
            id: doc.id,
            schools: data.schools || [],
            weights: data.weights || {},
            aiReport: data.aiReport || "",
            schoolsData: data.schoolsData || [],
            presentationResult: data.presentationResult,
            createdAt: data.createdAt,
            userId: data.userId,
            userEmail: data.userEmail
          };

          comparisonsData.push(comparison);

          // Count comparisons from this week
          if (data.createdAt) {
            const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            if (createdDate >= oneWeekAgo) {
              thisWeekComparisons++;
            }
          }

          // Add schools to institution set for counting unique institutions
          if (data.schools) {
            data.schools.forEach((school: string) => institutionSet.add(school));
          }
        });

        console.log("Final comparisons data:", comparisonsData);
        setComparisons(comparisonsData);
        setTotalInstitutions(institutionSet.size);
        setWeeklyComparisons(thisWeekComparisons);
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
          let thisWeekComparisons = 0;

          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const comparison = {
              id: doc.id,
              schools: data.schools || [],
              weights: data.weights || {},
              aiReport: data.aiReport || "",
              schoolsData: data.schoolsData || [],
              presentationResult: data.presentationResult,
              createdAt: data.createdAt,
              userId: data.userId,
              userEmail: data.userEmail
            };

            comparisonsData.push(comparison);

            // Count comparisons from this week
            if (data.createdAt) {
              const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
              if (createdDate >= oneWeekAgo) {
                thisWeekComparisons++;
              }
            }

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
          setWeeklyComparisons(thisWeekComparisons);
        } catch (simpleError) {
          console.error("Simple query also failed:", simpleError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
    fetchPresentationCount();
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="DegreeSight" className="h-8 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">DegreeSight Admin</h1>
                <p className="text-sm text-muted-foreground">College Comparison Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{currentUser?.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="presentations">Presentations</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="admin">Admin Management</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {isPending && !isAdmin && (
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your account is pending approval. You have limited access until an administrator approves your account.
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={isPending && !isAdmin ? "opacity-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comparisons</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isPending && !isAdmin ? "—" : comparisons.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {isPending && !isAdmin ? "Pending approval" : "Saved college comparisons"}
                  </p>
                </CardContent>
              </Card>

              <Card className={isPending && !isAdmin ? "opacity-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Institutions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isPending && !isAdmin ? "—" : totalInstitutions}</div>
                  <p className="text-xs text-muted-foreground">
                    {isPending && !isAdmin ? "Pending approval" : "Different schools compared"}
                  </p>
                </CardContent>
              </Card>

              <Card className={isPending && !isAdmin ? "opacity-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Presentations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isPending && !isAdmin ? "—" : presentationCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {isPending && !isAdmin ? "Pending approval" : "Generated presentations"}
                  </p>
                </CardContent>
              </Card>

              <Card className={isPending && !isAdmin ? "opacity-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isPending && !isAdmin ? "—" : weeklyComparisons}</div>
                  <p className="text-xs text-muted-foreground">
                    {isPending && !isAdmin ? "Pending approval" : "New comparisons created"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateAssessment}
                disabled={isPending && !isAdmin}
              >
                <Plus className="w-4 h-4" />
                New Comparison
              </Button>
            </div>

            {/* Recent Comparisons */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Comparisons</CardTitle>
                <CardDescription>
                  Latest college comparisons from all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading comparisons...</div>
                ) : comparisons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No comparisons yet</h3>
                    <p className="text-sm mb-4">
                      Get started by creating your first college comparison.
                    </p>
                    <Button onClick={handleCreateAssessment} disabled={isPending && !isAdmin}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Comparison
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comparisons.map((comparison) => (
                      <div
                        key={comparison.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium mb-1">
                            {comparison.schools.join(" vs ")}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span>
                              Created: {comparison.createdAt ? new Date(comparison.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                            </span>
                            {comparison.userEmail && (
                              <span>By: {comparison.userEmail}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {comparison.schools.length} schools
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comparison.aiReport && (
                            <Badge variant="outline">AI Report</Badge>
                          )}
                          {comparison.presentationResult && (
                            <Badge variant="secondary">Presentation</Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewComparison(comparison)}
                            disabled={isPending && !isAdmin}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presentations">
            <PresentationManager />
          </TabsContent>

          <TabsContent value="prompt">
            <PromptManager />
          </TabsContent>

          <TabsContent value="admin">
            <AdminManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;