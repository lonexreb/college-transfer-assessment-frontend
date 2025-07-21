export interface Institution {
  id: string;
  name: string;
  state: string;
  type: string;
  enrollmentSize: string;
}

export interface AssessmentCriteria {
  id: string;
  name: string;
  description: string;
  defaultWeight: number;
}

export interface Assessment {
  id: string;
  name: string;
  targetInstitution: Institution;
  competitors: Institution[];
  criteria: { [key: string]: number };
  scores: { [institutionId: string]: { [criteriaId: string]: number } };
  overallScores: { [institutionId: string]: number };
  createdAt: string;
  status: 'draft' | 'completed';
}

export const mockInstitutions: Institution[] = [
  { id: '1', name: 'University of California, Los Angeles', state: 'California', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '2', name: 'Stanford University', state: 'California', type: 'Private', enrollmentSize: 'Medium (10,000-30,000)' },
  { id: '3', name: 'Harvard University', state: 'Massachusetts', type: 'Private', enrollmentSize: 'Medium (10,000-30,000)' },
  { id: '4', name: 'University of Texas at Austin', state: 'Texas', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '5', name: 'Arizona State University', state: 'Arizona', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '6', name: 'University of Michigan', state: 'Michigan', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '7', name: 'New York University', state: 'New York', type: 'Private', enrollmentSize: 'Large (30,000+)' },
  { id: '8', name: 'University of Florida', state: 'Florida', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '9', name: 'Northwestern University', state: 'Illinois', type: 'Private', enrollmentSize: 'Medium (10,000-30,000)' },
  { id: '10', name: 'University of Washington', state: 'Washington', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '11', name: 'Georgia Institute of Technology', state: 'Georgia', type: 'Public', enrollmentSize: 'Medium (10,000-30,000)' },
  { id: '12', name: 'University of Southern California', state: 'California', type: 'Private', enrollmentSize: 'Large (30,000+)' },
  { id: '13', name: 'University of North Carolina at Chapel Hill', state: 'North Carolina', type: 'Public', enrollmentSize: 'Large (30,000+)' },
  { id: '14', name: 'Duke University', state: 'North Carolina', type: 'Private', enrollmentSize: 'Medium (10,000-30,000)' },
  { id: '15', name: 'University of Virginia', state: 'Virginia', type: 'Public', enrollmentSize: 'Medium (10,000-30,000)' },
];

export const assessmentCriteria: AssessmentCriteria[] = [
  {
    id: 'navigation',
    name: 'Transfer Navigation',
    description: 'Ease of finding transfer information on the website',
    defaultWeight: 20
  },
  {
    id: 'landing_pages',
    name: 'Landing Pages',
    description: 'Quality and comprehensiveness of transfer-specific pages',
    defaultWeight: 15
  },
  {
    id: 'evaluation_tools',
    name: 'Evaluation Tools',
    description: 'Availability of course equivalency and credit evaluation tools',
    defaultWeight: 25
  },
  {
    id: 'articulation_agreements',
    name: 'Articulation Agreements',
    description: 'Number and accessibility of articulation agreements',
    defaultWeight: 20
  },
  {
    id: 'support_resources',
    name: 'Support Resources',
    description: 'Transfer counseling and support services offered',
    defaultWeight: 10
  },
  {
    id: 'application_process',
    name: 'Application Process',
    description: 'Clarity and simplicity of transfer application process',
    defaultWeight: 10
  }
];

// Generate mock scores for institutions
const generateMockScores = () => {
  const scores: { [institutionId: string]: { [criteriaId: string]: number } } = {};
  const overallScores: { [institutionId: string]: number } = {};
  
  mockInstitutions.forEach(institution => {
    scores[institution.id] = {};
    let totalScore = 0;
    
    assessmentCriteria.forEach(criteria => {
      // Generate realistic scores (1-5 scale, slightly skewed toward higher scores)
      const score = Math.min(5, Math.max(1, Math.round((Math.random() * 3 + 2) * 10) / 10));
      scores[institution.id][criteria.id] = score;
      totalScore += score * (criteria.defaultWeight / 100);
    });
    
    overallScores[institution.id] = Math.round(totalScore * 10) / 10;
  });
  
  return { scores, overallScores };
};

const { scores: mockScores, overallScores: mockOverallScores } = generateMockScores();

export const mockAssessments: Assessment[] = [
  {
    id: '1',
    name: 'California Universities Comparison',
    targetInstitution: mockInstitutions[0], // UCLA
    competitors: [mockInstitutions[1], mockInstitutions[11]], // Stanford, USC
    criteria: {
      navigation: 20,
      landing_pages: 15,
      evaluation_tools: 25,
      articulation_agreements: 20,
      support_resources: 10,
      application_process: 10
    },
    scores: mockScores,
    overallScores: mockOverallScores,
    createdAt: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    name: 'East Coast Elite Comparison',
    targetInstitution: mockInstitutions[2], // Harvard
    competitors: [mockInstitutions[8], mockInstitutions[13]], // Northwestern, Duke
    criteria: {
      navigation: 25,
      landing_pages: 20,
      evaluation_tools: 20,
      articulation_agreements: 15,
      support_resources: 10,
      application_process: 10
    },
    scores: mockScores,
    overallScores: mockOverallScores,
    createdAt: '2024-01-10T14:20:00Z',
    status: 'completed'
  },
  {
    id: '3',
    name: 'Public Universities Analysis',
    targetInstitution: mockInstitutions[3], // UT Austin
    competitors: [mockInstitutions[4], mockInstitutions[5], mockInstitutions[7]], // ASU, Michigan, UF
    criteria: {
      navigation: 15,
      landing_pages: 15,
      evaluation_tools: 30,
      articulation_agreements: 25,
      support_resources: 10,
      application_process: 5
    },
    scores: mockScores,
    overallScores: mockOverallScores,
    createdAt: '2024-01-08T09:15:00Z',
    status: 'draft'
  }
];