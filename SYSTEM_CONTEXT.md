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

## Website Navigation

The site has a clean navigation structure:

1. **Dashboard (/)** - Main landing page showing overview cards and recent activity
2. **Assessment Wizard (/assessment/new)** - Step-by-step process to create transfer assessments
3. **Comparison Tool (/comparison)** - View and analyze assessment results
4. **Authentication (/auth)** - Login/signup page

The dashboard contains tabs for:
- Overview: Statistics and recent comparisons
- Presentations: AI presentation generation tool
- Admin: User management (admin-only)

## Key User Flows

### Creating a Presentation
1. Navigate to Dashboard → Click "Presentations" tab
2. In the "Generate New Presentation" section:
   - Enter topic/prompt in the text area
   - Set number of slides (1-20)
   - Choose language (English, Spanish, French, German, Chinese)
   - Select theme (Light, Dark, Colorful, Minimal)
   - Pick export format (PowerPoint .pptx or PDF)
3. Click "Generate Presentation" button
4. Wait for AI generation to complete
5. View generated presentations in the list below
6. Click "View" to open presentation in external editor
7. Click "Details" to see full information
8. Use "Delete" to remove presentations

### Adding Admin Users
1. Must be logged in as an existing admin
2. Navigate to Dashboard → Click "Admin" tab
3. In the "Admin User Management" section:
   - Enter email address in the input field
   - Click "Add Admin" button
4. New admin appears in the admin users list
5. Use "Remove" button to revoke admin access (cannot remove yourself)
6. Click "Refresh" to update the admin list

### Creating Transfer Assessments
1. From Dashboard, click "Create New Assessment"
2. **Step 1**: Select target institution and up to 3 competitors
3. **Step 2**: Configure assessment weights (must total 100%)
4. **Step 3**: Review selections and generate assessment
5. Results appear in Comparison Tool with AI-generated analysis