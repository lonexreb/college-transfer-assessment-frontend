import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Download, Star, TrendingUp, Users, MapPin, ArrowLeft } from "lucide-react";
import { mockAssessments, assessmentCriteria } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

const ReportDisplay = () => {
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  
  // Using the first completed assessment as example
  const assessment = mockAssessments.find(a => a.status === 'completed') || mockAssessments[0];
  const allInstitutions = [assessment.targetInstitution, ...assessment.competitors].filter(Boolean);

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-success";
    if (score >= 3.5) return "text-primary";
    if (score >= 2.5) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 4.5) return "default";
    if (score >= 3.5) return "secondary";
    return "outline";
  };

  const renderScoreGauge = (score: number, size = "large") => {
    const percentage = (score / 5) * 100;
    const isLarge = size === "large";
    
    return (
      <div className={`relative ${isLarge ? 'w-24 h-24' : 'w-16 h-16'}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${isLarge ? 'text-lg' : 'text-sm'} ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
    );
  };

  const handleShare = () => {
    // Generate magic link logic would go here
    const magicLink = `https://assessment.example.com/report/${assessment.id}?token=abc123`;
    navigator.clipboard.writeText(magicLink);
    setShareDialogOpen(false);
    // Show toast notification
  };

  const handleExport = () => {
    // Export logic would go here
    console.log('Exporting report...');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{assessment.name}</h1>
              <p className="text-muted-foreground mt-1">
                Assessment completed on {new Date(assessment.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Assessment Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter email address..."
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleShare} className="w-full">
                      Generate Magic Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Executive Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allInstitutions.map((institution) => (
                <div key={institution.id} className="text-center">
                  <div className="flex justify-center mb-3">
                    {renderScoreGauge(assessment.overallScores[institution.id])}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{institution.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{institution.state}</span>
                  </div>
                  <Badge variant={getScoreBadgeVariant(assessment.overallScores[institution.id])}>
                    {institution.id === assessment.targetInstitution.id ? 'Target' : 'Competitor'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Detailed Assessment Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Criteria</TableHead>
                    <TableHead className="text-center">Weight</TableHead>
                    {allInstitutions.map((institution) => (
                      <TableHead key={institution.id} className="text-center min-w-[120px]">
                        {institution.name.length > 20 
                          ? `${institution.name.substring(0, 20)}...` 
                          : institution.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{criteria.name}</div>
                          <div className="text-sm text-muted-foreground">{criteria.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{assessment.criteria[criteria.id]}%</Badge>
                      </TableCell>
                      {allInstitutions.map((institution) => (
                        <TableCell key={institution.id} className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            {renderScoreGauge(assessment.scores[institution.id][criteria.id], "small")}
                            <span className={`text-sm font-medium ${getScoreColor(assessment.scores[institution.id][criteria.id])}`}>
                              {assessment.scores[institution.id][criteria.id]}/5.0
                            </span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Institution Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {allInstitutions.map((institution) => (
                <div key={institution.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{institution.name}</h3>
                      <Badge variant={institution.id === assessment.targetInstitution.id ? "default" : "outline"}>
                        {institution.id === assessment.targetInstitution.id ? 'Target' : 'Competitor'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${getScoreColor(assessment.overallScores[institution.id])}`}>
                        {assessment.overallScores[institution.id]}
                      </span>
                      <span className="text-sm text-muted-foreground">/5.0</span>
                    </div>
                  </div>
                  <Progress 
                    value={(assessment.overallScores[institution.id] / 5) * 100} 
                    className="h-3"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">State:</span>
                      <span className="ml-2 text-foreground">{institution.state}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 text-foreground">{institution.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="ml-2 text-foreground">{institution.enrollmentSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="grid gap-4">
                <div className="p-4 bg-primary-light rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Highest Performing Area</h4>
                  <p className="text-muted-foreground">
                    Transfer Navigation shows the strongest performance across all assessed institutions, 
                    indicating well-designed user pathways for transfer students.
                  </p>
                </div>
                <div className="p-4 bg-accent rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Area for Improvement</h4>
                  <p className="text-muted-foreground">
                    Evaluation Tools scored lowest on average, suggesting opportunities to invest in 
                    better course equivalency and credit evaluation systems.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Competitive Position</h4>
                  <p className="text-muted-foreground">
                    {assessment.targetInstitution.name} ranks {
                      allInstitutions
                        .sort((a, b) => assessment.overallScores[b.id] - assessment.overallScores[a.id])
                        .findIndex(inst => inst.id === assessment.targetInstitution.id) + 1
                    } out of {allInstitutions.length} institutions in overall transfer friendliness.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportDisplay;