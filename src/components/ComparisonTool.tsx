
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, X, Loader2, TrendingUp, Users, DollarSign, GraduationCap } from "lucide-react";
import InstitutionSearch from "./InstitutionSearch";
import { Institution } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

interface SchoolData {
  name: string;
  city: string;
  state: string;
  website: string;
  ownership: string;
  student_size: number;
  in_state_tuition: number;
  out_of_state_tuition: number;
}

interface ComparisonResponse {
  primary_college: SchoolData;
  competitor_colleges: SchoolData[];
  tfa_report: string;
}

const ComparisonTool = () => {
  const navigate = useNavigate();
  const [selectedSchools, setSelectedSchools] = useState<(Institution | null)[]>([null, null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load assessment results from wizard if available
  useEffect(() => {
    const storedResult = sessionStorage.getItem('assessmentResult');
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        setComparisonResult(parsedResult);
        // Clear the stored result after loading
        sessionStorage.removeItem('assessmentResult');
      } catch (error) {
        console.error('Failed to parse stored assessment result:', error);
      }
    }
  }, []);

  const handleSchoolChange = (index: number, institution: Institution | null) => {
    setSelectedSchools(prev => 
      prev.map((school, i) => i === index ? institution : school)
    );
  };

  

  const addSchoolSlot = () => {
    if (selectedSchools.length < 5) {
      setSelectedSchools(prev => [...prev, null]);
    }
  };

  const removeSchoolSlot = (index: number) => {
    if (selectedSchools.length > 2) {
      setSelectedSchools(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getSelectedSchoolIds = () => {
    return selectedSchools
      .filter(school => school !== null)
      .map(school => school!.id);
  };

  const handleCompare = async () => {
    const validSchools = selectedSchools.filter(school => school !== null);
    
    if (validSchools.length < 2) {
      setError("Please select at least 2 schools to compare");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const primarySchool = validSchools[0]!.name;
      const competitorSchools = validSchools.slice(1).map(school => school!.name);
      
      const requestBody = {
        primary_college: primarySchool,
        competitor_colleges: competitorSchools
      };
      
      console.log('Making POST request to transfer assessment:', requestBody);
      
      const response = await fetch('https://45d6fae9-a922-432b-b45b-6bf3e63633ed-00-1253eg8epuixe.picard.replit.dev/api/transfer-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to compare schools: ${response.status} ${errorText}`);
      }

      const data: ComparisonResponse = await response.json();
      console.log('Comparison response:', data);
      setComparisonResult(data);
    } catch (error) {
      console.error('Comparison error:', error);
      setError('Failed to compare schools. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatStudentSize = (size: number) => {
    return new Intl.NumberFormat('en-US').format(size);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
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
          <h1 className="text-2xl font-bold text-foreground mt-4">School Comparison Tool</h1>
          <p className="text-muted-foreground mt-1">
            Compare multiple schools with weighted assessment criteria
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - School Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select Schools to Compare</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The first school will be used as the primary reference point
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSchools.map((school, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <InstitutionSearch
                        value={school}
                        onChange={(institution) => handleSchoolChange(index, institution)}
                        placeholder={`Select school ${index + 1}...`}
                        label={index === 0 ? "Primary School" : `Comparison School ${index}`}
                        excludeIds={getSelectedSchoolIds()}
                      />
                    </div>
                    {index > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSchoolSlot(index)}
                        className="mt-6 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {selectedSchools.length < 5 && (
                  <Button
                    variant="outline"
                    onClick={addSchoolSlot}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another School
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Transfer Assessment</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate a comprehensive transfer friendliness assessment
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Button
                    onClick={handleCompare}
                    disabled={isLoading || selectedSchools.filter(Boolean).length < 2}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Assessment...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Generate Assessment
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {comparisonResult ? (
              <div className="space-y-6">
                {/* School Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>School Comparison Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>School</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>In-State Tuition</TableHead>
                            <TableHead>Out-of-State Tuition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Primary College */}
                          <TableRow>
                            <TableCell className="font-medium">
                              <div>
                                {comparisonResult.primary_college.name}
                                <Badge variant="default" className="ml-2 text-xs">
                                  Primary
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{comparisonResult.primary_college.city}, {comparisonResult.primary_college.state}</TableCell>
                            <TableCell>
                              <a 
                                href={comparisonResult.primary_college.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Visit Website
                              </a>
                            </TableCell>
                            <TableCell>{comparisonResult.primary_college.ownership}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {comparisonResult.primary_college.student_size ? formatStudentSize(comparisonResult.primary_college.student_size) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {comparisonResult.primary_college.in_state_tuition ? formatCurrency(comparisonResult.primary_college.in_state_tuition) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {comparisonResult.primary_college.out_of_state_tuition ? formatCurrency(comparisonResult.primary_college.out_of_state_tuition) : 'N/A'}
                              </div>
                            </TableCell>
                          </TableRow>
                          {/* Competitor Colleges */}
                          {comparisonResult.competitor_colleges.map((school, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div>
                                  {school.name}
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Competitor {index + 1}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{school.city}, {school.state}</TableCell>
                              <TableCell>
                                <a 
                                  href={school.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Visit Website
                                </a>
                              </TableCell>
                              <TableCell>{school.ownership}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {school.student_size ? formatStudentSize(school.student_size) : 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {school.in_state_tuition ? formatCurrency(school.in_state_tuition) : 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {school.out_of_state_tuition ? formatCurrency(school.out_of_state_tuition) : 'N/A'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Transfer Friendliness Assessment Report */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Friendliness Assessment Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-foreground">
                        {comparisonResult.tfa_report}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ready to Generate Assessment
                  </h3>
                  <p className="text-muted-foreground">
                    Select at least 2 schools and click "Generate Assessment" to see detailed transfer friendliness analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTool;
