
# DegreeSight System Context - Complete Platform Overview

## Platform Overview
DegreeSight is a comprehensive college comparison and transfer credit analysis platform built with React, TypeScript, and Firebase. It helps users compare colleges based on transfer friendliness and various academic criteria using AI-powered analysis.

## Core Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** with custom design system
- **Shadcn/ui** component library
- **React Router** for navigation
- **Firebase** for authentication and data storage
- **Radix UI** primitives for accessibility

### Backend Integration
- **Primary Backend**: `https://degree-works-backend-hydrabeans.replit.app`
- **Firebase Firestore** for data persistence
- **Firebase Authentication** for user management
- **Real-time data streaming** for AI report generation

## Key Features & Workflows

### 1. Authentication System
- Firebase-based authentication with email/password
- Admin role management with backend verification
- Protected routes requiring authentication
- Automatic admin status checking via API calls

### 2. Institution Search & Selection
- **Component**: `InstitutionSearch.tsx`
- **API Endpoint**: `/api/search` (POST)
- **Functionality**: 
  - Real-time search with 500ms debounce
  - Converts backend school data to standardized Institution format
  - Supports excluding already selected institutions
  - Handles enrollment size categorization (Small <5K, Medium 5K-30K, Large 30K+)

### 3. Assessment Creation Wizard
- **Component**: `AssessmentWizard.tsx`
- **3-Step Process**:
  1. **Institution Selection**: Target institution + up to 3 competitors
  2. **Weight Configuration**: Customize criteria importance (must total 100%)
  3. **Review & Generate**: Final review before API submission

### 4. Comparison Tool & AI Analysis
- **Component**: `ComparisonTool.tsx`
- **API Endpoint**: `/api/v1/comparison/stream` (POST)
- **Process**:
  - Sends school names and weights to backend
  - Receives streamed AI analysis in real-time
  - Stores complete comparison data in Firestore
  - Supports regeneration and data persistence

### 5. Assessment Criteria System
Located in `mockData.ts`, includes:
- **Transfer Credit Acceptance** (25% default weight)
- **Academic Support Services** (20% default weight)
- **Application Process Efficiency** (15% default weight)
- **Cost and Financial Aid** (15% default weight)
- **Campus Resources** (10% default weight)
- **Student Life and Integration** (10% default weight)
- **Academic Flexibility** (5% default weight)

### 6. Presentation Generation
- **API Endpoint**: `/api/v1/ppt/generate-presentation` (POST)
- Converts comparison data into PowerPoint presentations
- Supports presentation listing and management

### 7. Admin Dashboard
- **Component**: `Dashboard.tsx`
- **Admin Features**:
  - View all user comparisons across the platform
  - Monitor platform statistics (total comparisons, unique institutions, weekly activity)
  - Presentation management
  - User management capabilities

### 8. Chatbot Integration
- **Component**: `Chatbot.tsx`
- **Position**: Bottom-right corner, collapsible
- **RAG Connection**: Interfaces with backend for contextual responses
- **Features**: 
  - Minimizable interface
  - Message history
  - Loading states for AI responses

## Data Flow Architecture

### 1. Institution Search Flow
```
User Input → Debounced Search → Backend API → Data Transformation → UI Display
```

### 2. Assessment Creation Flow
```
Wizard Step 1 (Institutions) → Step 2 (Weights) → Step 3 (Review) → API Submission → Navigation to Comparison Tool
```

### 3. AI Analysis Flow
```
Comparison Request → Streaming API → Real-time UI Updates → Firestore Storage → Report Display
```

### 4. Data Persistence Flow
```
User Actions → Session Storage (temporary) → Firestore (permanent) → Dashboard Display
```

## Technical Implementation Details

### State Management
- React hooks for local component state
- Session storage for cross-component data transfer
- Firestore for persistent data storage
- No global state management library (Redux/Zustand) used

### API Integration Patterns
- POST requests for data submission
- Streaming responses for AI analysis
- Error handling with user-friendly fallbacks
- Loading states throughout the application

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

### Security Considerations
- Firebase Authentication for user verification
- Admin role verification via backend API
- Protected routes preventing unauthorized access
- Secure API endpoints with authentication headers

## File Structure Organization

### Components Hierarchy
- **ui/**: Reusable UI components (buttons, cards, inputs, etc.)
- **Primary Components**: Feature-specific components (Dashboard, Chatbot, etc.)
- **Pages**: Route-level components
- **Contexts**: React context providers (Auth)
- **Data**: Mock data and type definitions
- **Lib**: Utility functions and external service configurations

### Routing Structure
- `/` - Main dashboard (protected)
- `/assessment/new` - Assessment creation wizard (protected)
- `/comparison` - Comparison tool and AI analysis (protected)
- `/report/:id` - Individual report viewing (protected)
- Catch-all redirect to dashboard for unknown routes

## User Experience Flow

### New User Journey
1. **Authentication**: Login/signup via Firebase
2. **Dashboard**: Overview of platform capabilities
3. **Create Assessment**: 3-step wizard for setup
4. **AI Analysis**: Real-time streaming comparison
5. **Results Review**: Comprehensive report with insights
6. **Presentation**: Optional PowerPoint generation

### Returning User Journey
1. **Dashboard**: View previous comparisons and statistics
2. **Quick Actions**: Create new assessments or view existing ones
3. **Admin Functions**: (If admin) Platform management and oversight

## Integration Points

### External Services
- **College Data API**: Real-time institution search
- **AI Analysis Service**: Streaming comparison generation
- **Presentation Service**: PowerPoint generation
- **Firebase Services**: Auth, Firestore, hosting

### Data Formats
- **Institution Object**: Standardized format with id, name, state, type, enrollmentSize
- **Comparison Object**: Schools array, weights object, AI report, metadata
- **Assessment Criteria**: ID-based system with configurable weights

This platform serves as a comprehensive solution for college transfer analysis, combining real-time data, AI-powered insights, and user-friendly interfaces to help students make informed educational decisions.
