# Agent Application API Documentation

## Base URL

```
Development: http://localhost:3000
Production: https://api.ppoint.africa
```

## Authentication

All endpoints use CORS protection. Frontend must be from allowed origins:
- http://localhost:5173
- http://localhost:5174
- http://127.0.0.1:5173
- https://ppoint.online
- https://www.ppoint.online

## Rate Limiting

- 100 requests per 15 minutes per IP
- X-RateLimit-* headers included in responses

## Endpoints

### 1. Submit Agent Application

Create a new agent application.

**Endpoint:** `POST /api/agent-applications`

**Authentication:** None required

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "phone": "string (required)",
  "country": "string (required)",
  "state": "string (required)",
  "experience": "number (required, 0-50)",
  "references": "string (optional, newline-separated)",
  "documents": "array (optional, filenames only)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/agent-applications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+234803456789",
    "country": "Nigeria",
    "state": "Lagos",
    "experience": 5,
    "references": "Company A\nCompany B",
    "documents": ["license.pdf"]
  }'
```

**Success Response (201 Created):**
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
    "references": "Company A\nCompany B",
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

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "success": false,
  "message": "Name, email, and phone are required"
}
```

**Validation Rules:**
- name: required, max 255 characters
- email: required, valid email format, unique
- phone: required, max 20 characters, unique
- country: required
- state: required
- experience: required, integer 0-50

---

### 2. Get All Applications

List all applications with optional filtering.

**Endpoint:** `GET /api/agent-applications`

**Authentication:** None (admin access in production)

**Query Parameters:**
```
status    : pending|approved|rejected (optional)
country   : Country name (optional)
state     : State/Province name (optional)
```

**Example Requests:**
```bash
# Get all applications
curl http://localhost:3000/api/agent-applications

# Get approved agents
curl "http://localhost:3000/api/agent-applications?status=approved"

# Get applications from Nigeria
curl "http://localhost:3000/api/agent-applications?country=Nigeria"

# Get pending applications from Lagos
curl "http://localhost:3000/api/agent-applications?status=pending&state=Lagos"
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "success": true,
  "message": "Applications retrieved",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+234803456789",
      "country": "Nigeria",
      "state": "Lagos",
      "experience": 5,
      "references": "Company A\nCompany B",
      "documents": ["license.pdf"],
      "status": "pending",
      "score": 50,
      "createdAt": "2026-05-25T10:30:00.000Z",
      "appliedDate": "2026-05-25T10:30:00.000Z",
      "reviewedBy": null,
      "reviewDate": null,
      "notes": null
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+234813456789",
      "country": "Nigeria",
      "state": "Abuja",
      "experience": 7,
      "score": 65,
      "status": "approved",
      "reviewedBy": "admin@ppoint.africa",
      "reviewDate": "2026-05-24T14:00:00.000Z",
      "notes": "Excellent applicant"
    }
  ]
}
```

---

### 3. Get Application Statistics

Get summary statistics about applications.

**Endpoint:** `GET /api/agent-applications/stats`

**Authentication:** None

**Example Request:**
```bash
curl http://localhost:3000/api/agent-applications/stats
```

**Success Response (200 OK):**
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

---

### 4. Get Single Application

Retrieve details of a specific application.

**Endpoint:** `GET /api/agent-applications/:id`

**Authentication:** None

**Path Parameters:**
- id: Application ID (required)

**Example Request:**
```bash
curl http://localhost:3000/api/agent-applications/1
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "success": true,
  "message": "Application retrieved",
  "data": {
    "id": 1,
    "userId": null,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+234803456789",
    "country": "Nigeria",
    "state": "Lagos",
    "experience": 5,
    "references": "Company A\nCompany B",
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

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "success": false,
  "message": "Application not found"
}
```

---

### 5. Get User Applications

Get all applications submitted by a specific user.

**Endpoint:** `GET /api/agent-applications/user/:userId`

**Authentication:** None

**Path Parameters:**
- userId: User ID (required)

**Example Request:**
```bash
curl http://localhost:3000/api/agent-applications/user/42
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "success": true,
  "message": "User applications retrieved",
  "data": [
    {
      "id": 1,
      "userId": 42,
      "name": "John Doe",
      "email": "john@example.com",
      "status": "pending",
      "score": 50,
      "appliedDate": "2026-05-25T10:30:00.000Z"
    },
    {
      "id": 3,
      "userId": 42,
      "name": "John Doe",
      "email": "john.alternate@example.com",
      "status": "approved",
      "score": 65,
      "appliedDate": "2026-05-20T08:15:00.000Z"
    }
  ]
}
```

---

### 6. Approve Application

Approve an agent application.

**Endpoint:** `PATCH /api/agent-applications/:id/approve`

**Authentication:** Admin only (in production)

**Path Parameters:**
- id: Application ID (required)

**Request Body:**
```json
{
  "reviewedBy": "string (required, admin name/email)",
  "notes": "string (optional, admin notes)"
}
```

**Example Request:**
```bash
curl -X PATCH http://localhost:3000/api/agent-applications/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedBy": "admin@ppoint.africa",
    "notes": "Excellent credentials and experience"
  }'
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+234803456789",
    "country": "Nigeria",
    "state": "Lagos",
    "experience": 5,
    "status": "approved",
    "score": 50,
    "reviewedBy": "admin@ppoint.africa",
    "reviewDate": "2026-05-25T12:00:00.000Z",
    "notes": "Excellent credentials and experience"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "success": false,
  "message": "Reviewed by is required"
}
```

---

### 7. Reject Application

Reject an agent application.

**Endpoint:** `PATCH /api/agent-applications/:id/reject`

**Authentication:** Admin only (in production)

**Path Parameters:**
- id: Application ID (required)

**Request Body:**
```json
{
  "reviewedBy": "string (required, admin name/email)",
  "notes": "string (optional, reason for rejection)"
}
```

**Example Request:**
```bash
curl -X PATCH http://localhost:3000/api/agent-applications/3/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedBy": "admin@ppoint.africa",
    "notes": "Insufficient experience and references"
  }'
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "id": 3,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+234813456789",
    "status": "rejected",
    "reviewedBy": "admin@ppoint.africa",
    "reviewDate": "2026-05-25T12:30:00.000Z",
    "notes": "Insufficient experience and references"
  }
}
```

---

### 8. Generate Mock Data (Development Only)

Generate sample applications for testing.

**Endpoint:** `POST /api/agent-applications/mock/generate`

**Authentication:** None (disabled in production)

**Restrictions:**
- Only available in development (NODE_ENV !== 'production')
- Creates 6 sample applications if none exist
- Idempotent - subsequent calls return existing count

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/agent-applications/mock/generate
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "success": true,
  "message": "Mock data generated",
  "data": {
    "count": 6,
    "applications": [
      {
        "id": 1,
        "name": "Adaeze Okafor",
        "email": "adaeze@example.com",
        "country": "Nigeria",
        "state": "Lagos",
        "experience": 5,
        "status": "pending",
        "score": 50
      },
      ...
    ]
  }
}
```

**Production Response (403 Forbidden):**
```json
{
  "status": "error",
  "success": false,
  "message": "This endpoint is not available in production"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation error |
| 403 | Forbidden - Access denied or not available |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Response Format

All responses follow this format:

**Success:**
```json
{
  "status": "success",
  "success": true,
  "message": "Human readable message",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "status": "error",
  "success": false,
  "message": "Error description"
}
```

---

## Scoring Algorithm

Application scores are calculated automatically (0-100):

**Experience (0-40 points):**
- 5 points per year of experience
- Maximum 40 points (8+ years = full marks)
- Example: 5 years = 25 points

**References (0-30 points):**
- 10 points per reference
- Maximum 30 points (3+ references = full marks)
- References counted by newlines
- Example: 2 references = 20 points

**Documents (0-30 points):**
- 10 points per document
- Maximum 30 points (3+ documents = full marks)
- Example: 2 documents = 20 points

**Total Calculation:**
```
Score = min(experience * 5, 40) + min(referenceCount * 10, 30) + min(documentCount * 10, 30)
Score Range: 0-100
```

---

## Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "Name, email, and phone are required" | Missing required fields | Provide all required fields |
| "Country and state are required" | Location not specified | Select country and state |
| "Experience is required" | Experience field missing | Enter years of experience |
| "Application not found" | Invalid application ID | Check the application ID |
| "Status must be 'approved' or 'rejected'" | Invalid status value | Use 'approved' or 'rejected' |
| "Reviewed by is required" | Admin name missing | Provide admin name/email |
| "This endpoint is not available in production" | Trying mock data in prod | Only available in development |

---

## Frontend Integration Examples

### React with Fetch

```javascript
// Submit application
const submitApplication = async (formData) => {
  try {
    const response = await fetch('/api/agent-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Get approved agents
const getApprovedAgents = async () => {
  const response = await fetch('/api/agent-applications?status=approved');
  const data = await response.json();
  return data.data || [];
};

// Get statistics
const getStats = async () => {
  const response = await fetch('/api/agent-applications/stats');
  const data = await response.json();
  return data.data;
};
```

---

## Testing with cURL

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
    "experience": 5,
    "references": "Ref 1\nRef 2"
  }'

# List all applications
curl http://localhost:3000/api/agent-applications

# Get statistics
curl http://localhost:3000/api/agent-applications/stats

# Get single application
curl http://localhost:3000/api/agent-applications/1

# Approve application
curl -X PATCH http://localhost:3000/api/agent-applications/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedBy": "admin@ppoint.africa",
    "notes": "Approved"
  }'

# Reject application
curl -X PATCH http://localhost:3000/api/agent-applications/1/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedBy": "admin@ppoint.africa",
    "notes": "Not qualified"
  }'

# Generate mock data
curl -X POST http://localhost:3000/api/agent-applications/mock/generate
```

---

## Pagination (Future)

Currently, all applications are returned. Future versions will support:

```
GET /api/agent-applications?page=1&limit=20&sort=applied_date&order=desc
```

---

## Sorting & Filtering (Future)

Future enhancements will support:

```
GET /api/agent-applications?sort=score&order=desc
GET /api/agent-applications?minExperience=5&maxScore=80
GET /api/agent-applications?search=John
```

---

## Webhooks (Future)

Plan to implement webhooks for:
- Application submitted
- Application approved
- Application rejected

```
POST /api/webhooks/agent-applications
```

---

## Rate Limit Headers

Response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1653123456
```

---

## CORS

Allowed origins (configurable in app.js):
- http://localhost:5173
- http://localhost:5174
- http://127.0.0.1:5173
- https://ppoint.online
- https://www.ppoint.online

---

## Support

For API issues:
- Check error messages for guidance
- Review response format
- Verify required fields
- Check CORS origin

Contact: api-support@ppoint.africa
