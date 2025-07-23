
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, X, Loader2, TrendingUp, Users, DollarSign, GraduationCap, FileText } from "lucide-react";
import InstitutionSearch from "./InstitutionSearch";
import { Institution } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface SchoolData {
  name: string;
  city: string;
  state: string;
  ownership: string;
  student_size: number;
  admission_rate: number;
  in_state_tuition: number;
  out_of_state_tuition: number;
  median_earnings_10yr: number;
}

interface ComparisonWeights {
  transfer_navigation: number;
  landing_pages: number;
  evaluation_tools: number;
  articulation_agreements: number;
  support_resources: number;
  application_process: number;
}

interface ComparisonResponse {
  schools_data: SchoolData[];
  ai_report: string;
}

const ComparisonTool = () => {
  const navigate = useNavigate();
  const [selectedSchools, setSelectedSchools] = useState<(Institution | null)[]>([null, null, null]);
  const [weights, setWeights] = useState<ComparisonWeights>({
    transfer_navigation: 20,
    landing_pages: 15,
    evaluation_tools: 25,
    articulation_agreements: 10,
    support_resources: 20,
    application_process: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);
  const [presentationResult, setPresentationResult] = useState<{
    presentation_id: string;
    path: string;
    edit_path: string;
  } | null>(null);

  // Load assessment config from wizard if available and start streaming
  useEffect(() => {
    const storedConfig = sessionStorage.getItem('assessmentConfig');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        // Clear the stored config after loading
        sessionStorage.removeItem('assessmentConfig');
        
        // Set the schools and weights from the config
        const newSelectedSchools = config.schoolNames.map((name: string, index: number) => ({
          id: `config-${index}`,
          name: name,
          state: 'Unknown',
          type: 'Unknown',
          enrollmentSize: 'Unknown'
        }));
        
        // Pad with nulls to match the expected array length
        while (newSelectedSchools.length < 3) {
          newSelectedSchools.push(null);
        }
        
        setSelectedSchools(newSelectedSchools);
        setWeights(config.weights);
        
        // Automatically start the comparison
        handleStreamingCompare(config.schoolNames, config.weights);
        
      } catch (error) {
        console.error('Failed to parse stored assessment config:', error);
      }
    }
  }, []);

  const handleStreamingCompare = async (schoolNames: string[], compareWeights: ComparisonWeights) => {
    setIsLoading(true);
    setError(null);
    setComparisonResult({ schools_data: [], ai_report: '' });

    try {
      const requestBody = {
        schools: schoolNames,
        weights: compareWeights
      };
      
      console.log('Making streaming POST request:', requestBody);
      
      const response = await fetch('https://45d6fae9-a922-432b-b45b-6bf3e63633ed-00-1253eg8epuixe.picard.replit.dev/api/compare-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming response error:', errorText);
        throw new Error(`Failed to start streaming: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch(data.type) {
                case 'schools_data':
                  console.log('Schools data received:', data.data);
                  setComparisonResult(prev => ({
                    ...prev,
                    schools_data: data.data
                  }));
                  break;
                  
                case 'ai_chunk':
                  console.log('AI chunk received:', data.data);
                  setComparisonResult(prev => ({
                    ...prev,
                    ai_report: prev.ai_report + data.data
                  }));
                  break;
                  
                case 'complete':
                  console.log('Stream complete');
                  setIsLoading(false);
                  break;
                  
                default:
                  console.log('Unknown data type:', data.type);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Streaming comparison error:', error);
      setError('Failed to compare schools. Please try again.');
      setIsLoading(false);
    }
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const handleSchoolChange = (index: number, institution: Institution | null) => {
    setSelectedSchools(prev => 
      prev.map((school, i) => i === index ? institution : school)
    );
  };

  const handleWeightChange = (key: keyof ComparisonWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
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

    const schoolNames = validSchools.map(school => school!.name);
    await handleStreamingCompare(schoolNames, weights);
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

  const handleGeneratePresentation = async () => {
    if (!comparisonResult || !comparisonResult.ai_report) {
      setError("No comparison results available for presentation generation");
      return;
    }

    setIsGeneratingPresentation(true);
    setError(null);
    setPresentationResult(null);

    try {
      const formData = new FormData();
      formData.append('prompt', `School Comparison Analysis: ${comparisonResult.ai_report}`);
      formData.append('n_slides', '8');
      formData.append('language', 'English');
      formData.append('theme', 'light');
      formData.append('export_as', 'pptx');

      const response = await fetch('https://45d6fae9-a922-432b-b45b-6bf3e63633ed-00-1253eg8epuixe.picard.replit.dev/api/v1/ppt/generate/presentation', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate presentation: ${response.status}`);
      }

      const result = await response.json();
      setPresentationResult(result);

    } catch (error) {
      console.error('Presentation generation error:', error);
      setError('Failed to generate presentation. Please try again.');
    } finally {
      setIsGeneratingPresentation(false);
    }
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

            {/* Assessment Weights */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assessment Weights</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adjust the importance of each criteria (Total: {totalWeight}%)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </Label>
                      <span className="text-sm text-muted-foreground">{value}%</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => handleWeightChange(key as keyof ComparisonWeights, Number(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                ))}
                
                <Separator />
                
                <div className="text-center">
                  <Button
                    onClick={handleCompare}
                    disabled={isLoading || selectedSchools.filter(Boolean).length < 2}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Comparing Schools...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Compare Schools
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
                            <TableHead>Type</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Admission Rate</TableHead>
                            <TableHead>In-State Tuition</TableHead>
                            <TableHead>Out-of-State Tuition</TableHead>
                            <TableHead>Median Earnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonResult.schools_data.map((school, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div>
                                  {school.name}
                                  {index === 0 && (
                                    <Badge variant="default" className="ml-2 text-xs">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{school.city}, {school.state}</TableCell>
                              <TableCell>{school.ownership}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {formatStudentSize(school.student_size)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3" />
                                  {formatPercentage(school.admission_rate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(school.in_state_tuition)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(school.out_of_state_tuition)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(school.median_earnings_10yr)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis Report */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>AI Analysis Report</CardTitle>
                      <div className="flex gap-2">
                        {comparisonResult && comparisonResult.ai_report && !presentationResult && (
                          <Button
                            onClick={handleGeneratePresentation}
                            disabled={isGeneratingPresentation}
                            variant="outline"
                            size="sm"
                          >
                            {isGeneratingPresentation ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Presentation
                              </>
                            )}
                          </Button>
                        )}
                        
                        {presentationResult && (
                          <Button
                            onClick={() => window.open(`http://tramway.proxy.rlwy.net:38813${presentationResult.edit_path}`, '_blank')}
                            variant="default"
                            size="sm"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Presentation
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none text-foreground">
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-medium mb-2 text-foreground">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-foreground leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 text-foreground">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-3 text-foreground">{children}</ol>,
                          li: ({children}) => <li className="mb-1 text-foreground">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                          em: ({children}) => <em className="italic text-foreground">{children}</em>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-border pl-4 italic mb-3 text-muted-foreground">{children}</blockquote>,
                          code: ({inline, children}) => inline ? 
                            <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code> :
                            <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto mb-3">{children}</code>
                        }}
                      >
                        {comparisonResult.ai_report || 'Generating analysis...'}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ready to Compare Schools
                  </h3>
                  <p className="text-muted-foreground">
                    Select at least 2 schools and click "Compare Schools" to see detailed analysis
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
