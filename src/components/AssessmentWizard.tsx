import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, CheckCircle, Users, BarChart3, Loader2, AlertCircle } from "lucide-react";
import InstitutionSearch from "./InstitutionSearch";
import WeightSlider from "./WeightSlider";
import { Institution, assessmentCriteria } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

interface AssessmentWizardState {
  targetInstitution: Institution | null;
  competitors: (Institution | null)[];
  weights: { [key: string]: number };
}

const AssessmentWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [state, setState] = useState<AssessmentWizardState>({
    targetInstitution: null,
    competitors: [null, null, null],
    weights: assessmentCriteria.reduce((acc, criteria) => ({
      ...acc,
      [criteria.id]: criteria.defaultWeight
    }), {})
  });

  const totalWeight = useMemo(() => {
    return Object.values(state.weights).reduce((sum, weight) => sum + weight, 0);
  }, [state.weights]);

  const isStep1Valid = state.targetInstitution !== null;
  const isStep2Valid = totalWeight === 100;
  const hasAnyCompetitors = state.competitors.some(comp => comp !== null);

  const selectedInstitutionIds = [
    state.targetInstitution?.id,
    ...state.competitors.map(comp => comp?.id)
  ].filter(Boolean) as string[];

  const handleTargetChange = (institution: Institution | null) => {
    setState(prev => ({ ...prev, targetInstitution: institution }));
  };

  const handleCompetitorChange = (index: number, institution: Institution | null) => {
    setState(prev => ({
      ...prev,
      competitors: prev.competitors.map((comp, i) => i === index ? institution : comp)
    }));
  };

  const handleWeightChange = (criteriaId: string, weight: number) => {
    setState(prev => ({
      ...prev,
      weights: { ...prev.weights, [criteriaId]: weight }
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare the data for the API call
      const competitorNames = state.competitors
        .filter(comp => comp !== null)
        .map(comp => comp!.name);

      const requestBody = {
        primary_college: state.targetInstitution?.name,
        competitor_colleges: competitorNames
      };

      console.log('Generating assessment with:', requestBody);

      const response = await fetch('https://45d6fae9-a922-432b-b45b-6bf3e63633ed-00-1253eg8epuixe.picard.replit.dev/api/transfer-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Assessment API error:', errorText);
        throw new Error(`Failed to generate assessment: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Assessment response:', data);
      
      // Store the result in sessionStorage so we can access it on the comparison page
      sessionStorage.setItem('assessmentResult', JSON.stringify({
        ...data,
        targetInstitution: state.targetInstitution,
        competitors: state.competitors.filter(comp => comp !== null),
        weights: state.weights
      }));

      // Navigate to comparison tool to show results
      navigate('/comparison');
      
    } catch (error) {
      console.error('Assessment generation error:', error);
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Select Target Institution</h3>
        <p className="text-muted-foreground mb-4">
          Choose the primary institution you want to assess for transfer friendliness.
        </p>
        <InstitutionSearch
          value={state.targetInstitution}
          onChange={handleTargetChange}
          label="Target Institution"
          placeholder="Search for your target institution..."
        />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Select Competitors (Optional)</h3>
        <p className="text-muted-foreground mb-4">
          Choose up to 3 competitor institutions to compare against your target.
        </p>
        <div className="space-y-4">
          {state.competitors.map((competitor, index) => (
            <InstitutionSearch
              key={index}
              value={competitor}
              onChange={(institution) => handleCompetitorChange(index, institution)}
              label={`Competitor ${index + 1}`}
              placeholder={`Search for competitor ${index + 1}...`}
              excludeIds={selectedInstitutionIds}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Configure Assessment Weights</h3>
        <p className="text-muted-foreground mb-4">
          Adjust the importance of each criteria. Weights must total 100%.
        </p>
      </div>

      <div className="bg-muted rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Total Weight</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${totalWeight === 100 ? 'text-success' : 'text-destructive'}`}>
              {totalWeight}%
            </span>
            {totalWeight === 100 ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>
        <Progress value={totalWeight} className="h-2" />
        {totalWeight !== 100 && (
          <p className="text-xs text-destructive mt-2">
            {totalWeight > 100 ? 'Reduce weights by' : 'Add'} {Math.abs(totalWeight - 100)}% to reach 100%
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {assessmentCriteria.map((criteria) => (
          <WeightSlider
            key={criteria.id}
            criteria={criteria}
            value={state.weights[criteria.id]}
            onChange={(weight) => handleWeightChange(criteria.id, weight)}
          />
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Review Assessment Configuration</h3>
        <p className="text-muted-foreground mb-4">
          Review your selections before generating the assessment report.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Institutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">Target</Badge>
              <span className="font-medium text-foreground">{state.targetInstitution?.name}</span>
            </div>
          </div>

          {hasAnyCompetitors && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Competitors:</p>
              <div className="space-y-2">
                {state.competitors
                  .filter(comp => comp !== null)
                  .map((competitor, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">Competitor {index + 1}</Badge>
                      <span className="text-foreground">{competitor?.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {assessmentCriteria.map((criteria) => (
              <div key={criteria.id} className="flex items-center justify-between">
                <span className="text-foreground">{criteria.name}</span>
                <Badge variant="secondary">{state.weights[criteria.id]}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { number: 1, title: 'Select Institutions', isValid: isStep1Valid },
    { number: 2, title: 'Configure Weights', isValid: isStep2Valid },
    { number: 3, title: 'Review & Generate', isValid: true }
  ];

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
          <h1 className="text-2xl font-bold text-foreground mt-4">Create New Assessment</h1>
          <p className="text-muted-foreground mt-1">
            Follow the steps below to create a comprehensive transfer friendliness assessment
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-px w-12 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                className="bg-primary hover:bg-primary-hover"
              >
                Generate Assessment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentWizard;