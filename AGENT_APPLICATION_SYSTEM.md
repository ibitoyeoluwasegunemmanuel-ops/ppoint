# Agent Application System - ppoint.africa

## Overview

The Agent Application System is a complete backend and frontend solution for managing agent applications on the ppoint.africa platform. It allows users to apply as agents, admins to review applications, and provides a public leaderboard of approved agents.

## System Architecture

### Database Schema

**Table: `agent_applications`**
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (references user_profiles)
- name: VARCHAR(255) - Full name of applicant
- email: VARCHAR(255) - Contact email
- phone: VARCHAR(20) - Contact phone
- country: VARCHAR(100) - Country of residence
- state: VARCHAR(100) - State/Province
- experience: INTEGER - Years of experience
- references: TEXT - References (comma-separated)
- documents: JSONB - Array of document filenames
- status: VARCHAR(50) - pending/approved/rejected
- score: INTEGER - Application score (0-100)
- applied_date: TIMESTAMP - Application submission date
- created_at: TIMESTAMP - Record creation date
- reviewed_by: VARCHAR(255) - Admin name who reviewed
- review_date: TIMESTAMP - Review date
- notes: TEXT - Admin notes on application
```

**Indexes:**
- `idx_agent_applications_status` - For filtering by status
- `idx_agent_applications_user_id` - For user lookups
- `idx_agent_applications_country` - For geographic filtering
- `idx_agent_applications_applied_date` - For sorting by date

## Backend Components

### 1. Model: `/backend/src/models/AgentApplication.js`

Handles all database operations:

**Key Methods:**
- `create(data)` - Create new application
- `findById(id)` - Get application by ID
- `findByUserId(userId)` - Get user's applications
- `findAll(filters)` - Get all applications with optional filters
- `updateReview(id, reviewData)` - Update status and review info
- `countByStatus(status)` - Count applications by status
- `generateScore(application)` - Calculate application score (0-100)

**Scoring Algorithm:**
- Experience: 0-40 points (5 points per year, max 40)
- References: 0-30 points (10 points per reference, max 30)
- Documents: 0-30 points (10 points per document, max 30)

### 2. Service: `/backend/src/services/agentApplicationService.js`

Business logic layer:

**Key Methods:**
- `submitApplication(userData)` - Submit new application with validation
- `reviewApplication(id, approvalData)` - Approve/reject application
- `getApplications(filters)` - Get applications with scores
- `getApplication(id)` - Get single application with score
- `getUserApplications(userId)` - Get user's applications
- `getStatistics()` - Get stats (pending/approved/rejected counts)
- `generateMockData()` - Create 6 mock applications for testing

**Mock Data Generated:**
- 3 Pending applications (various experience levels)
- 2 Approved applications (high scores)
- 1 Rejected application

### 3. Routes: `/backend/src/routes/agentApplicationRoutes.js`

REST API endpoints:

```
POST   /api/agent-applications
       Create new application
       Body: { name, email, phone, country, state, experience, references, documents }

GET    /api/agent-applications
       List all applications (admin)
       Query params: ?status=pending|approved|rejected, ?country=Nigeria, ?state=Lagos

GET    /api/agent-applications/stats
       Get application statistics
       Response: { pending, approved, rejected, total }

GET    /api/agent-applications/:id
       Get single application by ID

GET    /api/agent-applications/user/:userId
       Get user's applications

PATCH  /api/agent-applications/:id/approve
       Approve application
       Body: { reviewedBy, notes }

PATCH  /api/agent-applications/:id/reject
       Reject application
       Body: { reviewedBy, notes }

POST   /api/agent-applications/mock/generate
       Generate mock data (dev only)
```

## Frontend Components

### 1. Main Component: `/frontend/src/pages/WebDashboardPage.jsx`

**AgentsView Function** - Displays agent information:

**Features:**
- Statistics cards showing total agents, approved, pending counts
- Error handling with retry button
- Loading skeleton cards during fetch
- Top approved agents leaderboard (sorted by score)
- Pending applications list with quick stats
- "Apply as Agent" button

**API Calls:**
```javascript
// Fetch statistics
GET /api/agent-applications/stats

// Fetch approved agents
GET /api/agent-applications?status=approved

// Fetch pending applications
GET /api/agent-applications?status=pending
```

**Loading States:**
- Skeleton cards for statistics (4 cards)
- Skeleton rows for agent list (3 rows)
- Skeleton rows for pending applications (2 rows)

### 2. Application Modal: `ApplicationModal` Component

**Features:**
- Form validation (name, email, phone required)
- Country/state selection
- Years of experience selector (0-20+)
- References textarea (one per line)
- Document upload mock UI
- Loading state with spinner
- Success state with confirmation
- Error handling with user-friendly messages

**Form Fields:**
```
- Name (required, text)
- Email (required, email)
- Phone (required, tel)
- Country (required, select)
- State/Province (required, text)
- Experience (required, select)
- References (optional, textarea)
- Documents (optional, mock file upload)
```

**Styling:**
- Dark theme matching ppoint.africa design
- Smooth animations (fadeIn, slideUp)
- Yellow accent color (#FFC72C)
- Green success color (#34D399)
- Red error color (#F87171)

## UI/UX Features

### Loading States
- Skeleton loaders with pulse animation
- Show realistic placeholder content while fetching

### Error Handling
- User-friendly error messages
- Retry button for failed requests
- Error card with clear visual distinction

### Toast Notifications
- Success feedback on application submission
- Auto-dismiss after 3 seconds
- Bottom-right corner positioning

### Animations
- Fade-in for modals and overlays
- Slide-up for modal content
- Pulse animation for skeleton loaders
- Slide-in for toast notifications
- Hover effects on interactive elements

### Responsive Design
- Grid-based layouts
- Mobile-friendly form inputs
- Scrollable content areas
- Proper spacing and typography

## Setup & Initialization

### 1. Database Setup

The `agent_applications` table is automatically created via the schema.sql file. To manually initialize:

```bash
npm run init:db
```

This runs the database initialization including the schema.sql file which creates the agent_applications table.

### 2. Mock Data Generation

To populate with test data (development only):

```bash
curl -X POST http://localhost:3000/api/agent-applications/mock/generate
```

Response:
```json
{
  "status": "success",
  "success": true,
  "message": "Mock data generated",
  "data": {
    "count": 6,
    "applications": [...]
  }
}
```

### 3. Backend Server

Start the backend server:

```bash
cd backend
npm install
npm start
```

Server runs on `http://localhost:3000`

### 4. Frontend Development

Start the frontend dev server:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Response Examples

### Create Application

**Request:**
```bash
POST /api/agent-applications
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+234803456789",
  "country": "Nigeria",
  "state": "Lagos",
  "experience": 5,
  "references": "Lagos Chamber of Commerce\nLocal Business Association",
  "documents": ["license.pdf"]
}
```

**Response:**
```json
{
  "status": "success",
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "id": 1,
    "userId": null,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+234803456789",
    "country": "Nigeria",
    "state": "Lagos",
    "experience": 5,
    "references": "Lagos Chamber of Commerce\nLocal Business Association",
    "documents": ["license.pdf"],
    "status": "pending",
    "score": 50,
    "createdAt": "2026-05-25T10:30:00.000Z",
    "appliedDate": "2026-05-25T10:30:00.000Z",
    "reviewedBy": null,
    "reviewDate": null,
    "notes": null
  }
}
```

### Get Statistics

**Request:**
```bash
GET /api/agent-applications/stats
```

**Response:**
```json
{
  "status": "success",
  "success": true,
  "message": "Statistics retrieved",
  "data": {
    "pending": 3,
    "approved": 2,
    "rejected": 1,
    "total": 6
  }
}
```

### Get Approved Agents

**Request:**
```bash
GET /api/agent-applications?status=approved
```

**Response:**
```json
{
  "status": "success",
  "success": true,
  "message": "Applications retrieved",
  "data": [
    {
      "id": 4,
      "name": "Emmanuel Okonkwo",
      "email": "emmanuel@example.com",
      "country": "Nigeria",
      "state": "Anambra",
      "experience": 7,
      "score": 70,
      "status": "approved",
      "appliedDate": "2026-05-20T10:00:00.000Z",
      "reviewedBy": "admin@ppoint.africa",
      "reviewDate": "2026-05-21T15:00:00.000Z"
    },
    ...
  ]
}
```

## Error Handling

### Validation Errors

```json
{
  "status": "error",
  "success": false,
  "message": "Name, email, and phone are required"
}
```

### Not Found

```json
{
  "status": "error",
  "success": false,
  "message": "Application not found"
}
```

### Server Error

```json
{
  "status": "error",
  "success": false,
  "message": "Failed to submit application"
}
```

## Performance Optimizations

1. **Database Indexes** - Fast lookups by status, user, country, and date
2. **Skeleton Loaders** - Show content while fetching instead of spinners
3. **Connection Pooling** - PostgreSQL connection pool for efficient resource use
4. **Error Boundaries** - Graceful error handling without crashes
5. **Lazy Loading** - Modal only loads when opened

## Security Considerations

1. **CORS Protection** - Only allowed origins can access the API
2. **Rate Limiting** - 100 requests per 15 minutes per IP
3. **Input Validation** - All inputs validated before database insert
4. **Helmet.js** - HTTP security headers
5. **SQL Injection Prevention** - Parameterized queries throughout

## Testing

### Manual Testing Checklist

- [ ] Submit application with all fields
- [ ] Submit application with minimal fields
- [ ] View approved agents leaderboard
- [ ] View pending applications list
- [ ] Check application score calculation
- [ ] Test error states (invalid email, etc.)
- [ ] Test loading states
- [ ] Test toast notifications
- [ ] Approve application as admin
- [ ] Reject application as admin

### API Testing

```bash
# Create application
curl -X POST http://localhost:3000/api/agent-applications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+234803456789",
    "country": "Nigeria",
    "state": "Lagos",
    "experience": 3,
    "references": "Test Ref"
  }'

# Get statistics
curl http://localhost:3000/api/agent-applications/stats

# Get approved agents
curl "http://localhost:3000/api/agent-applications?status=approved"

# Approve application
curl -X PATCH http://localhost:3000/api/agent-applications/1/approve \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy": "admin@ppoint.africa", "notes": "Good applicant"}'
```

## Environment Variables

Backend requires:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ppoint
DB_USER=postgres
DB_PASSWORD=password
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
USE_IN_MEMORY_DB=false
INIT_DB_ON_START=true
```

## File Structure

```
/home/user/ppoint/
├── backend/src/
│   ├── models/
│   │   └── AgentApplication.js
│   ├── routes/
│   │   └── agentApplicationRoutes.js
│   ├── services/
│   │   └── agentApplicationService.js
│   ├── scripts/
│   │   └── initAgentApplicationsTable.js
│   └── app.js
├── frontend/src/
│   └── pages/
│       └── WebDashboardPage.jsx
└── database/
    └── schema.sql
```

## Future Enhancements

1. **Email Notifications** - Send application status updates
2. **Document Upload** - Real file upload to cloud storage
3. **Advanced Scoring** - Machine learning-based scoring
4. **Application Tracking** - Track application through review stages
5. **Export Functionality** - Export applications to CSV/PDF
6. **Dashboard Analytics** - Charts and metrics for admin panel
7. **Bulk Operations** - Batch approve/reject applications
8. **Activity Logging** - Track all admin actions
9. **Two-Factor Authentication** - Enhanced security
10. **API Rate Limiting by User** - Different limits by tier

## Support

For issues or questions, contact the ppoint.africa development team.
