# DegreeSight Website Navigation Guide

## Main Navigation Flow

### Dashboard (`/`)
- Main entry point after login
- Shows overview of platform capabilities
- Quick access to create new assessments
- View previous comparisons and statistics

### Assessment Creation (`/assessment/new`)
- 3-step wizard process:
  1. **Institution Selection**: Choose target institution + up to 3 competitors
  2. **Weight Configuration**: Adjust criteria importance (must total 100%)
  3. **Review & Generate**: Final review before creating assessment

### Comparison Tool (`/comparison`)
- Real-time AI analysis and streaming results
- Interactive comparison between selected institutions
- Save and view detailed assessment reports

### Individual Reports (`/report/:id`)
- View specific assessment results
- Detailed breakdown of transfer friendliness analysis
- Export and presentation options

## Key Navigation Components

### Institution Search
- Real-time search with debounce
- Filter and select colleges/universities
- Exclude already selected institutions

### Assessment Criteria
- Transfer Credit Acceptance (25% default)
- Academic Support Services (20% default)  
- Application Process Efficiency (15% default)
- Cost and Financial Aid (15% default)
- Campus Resources (10% default)
- Student Life and Integration (10% default)
- Academic Flexibility (5% default)

### Chatbot Assistant
- Bottom-right corner chatbot
- Context-aware help for navigation and features
- Minimizable interface

## User Flow
1. Login → Dashboard
2. Create Assessment → 3-step wizard → AI Analysis
3. View Results → Reports and presentations
4. Admin users see additional platform management options

All routes require authentication. Unknown routes redirect to dashboard.