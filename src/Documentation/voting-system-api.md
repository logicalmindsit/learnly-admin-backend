# BOS Voting System API Documentation

## Overview
The BOS Voting System allows BOS Controllers to create voting polls and both BOS Controllers and BOS Members to vote on them. Polls have time-based restrictions and various configuration options.

## Base URL
All endpoints are prefixed with your base API URL.

## Authentication
All endpoints require JWT authentication token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Voting Poll
**POST** `/create-poll`

**Role Required:** `boscontroller`

**Request Body:**
```json
{
  "title": "Board of Studies Meeting Agenda Approval",
  "description": "Vote on the proposed agenda for the upcoming BOS meeting scheduled for next week.",
  "options": [
    "Approve the agenda as proposed",
    "Approve with modifications",
    "Reject the agenda",
    "Postpone decision"
  ],
  "start_date": "2025-07-23T09:00:00Z",
  "end_date": "2025-07-25T17:00:00Z",
  "eligible_voters": ["boscontroller", "bosmembers"],
  "is_anonymous": false,
  "allow_multiple_votes": false,
  "settings": {
    "require_comments": false,
    "show_results_before_end": false,
    "auto_close_on_end_date": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Voting poll created successfully",
  "data": {
    "poll_id": "POLL172172345612345",
    "title": "Board of Studies Meeting Agenda Approval",
    "status": "draft",
    "created_by": {
      "admin_id": "60f1b2b3c4d5e6f7g8h9i0j1",
      "name": "Dr. John Smith",
      "role": "boscontroller"
    },
    "start_date": "2025-07-23T09:00:00Z",
    "end_date": "2025-07-25T17:00:00Z"
  }
}
```

### 2. Get All Voting Polls
**GET** `/polls`

**Query Parameters:**
- `status` (optional): Filter by poll status (`draft`, `active`, `completed`, `cancelled`)
- `created_by` (optional): Filter by creator's admin ID

**Response:**
```json
{
  "success": true,
  "message": "Voting polls retrieved successfully",
  "data": [
    {
      "poll_id": "POLL172172345612345",
      "title": "Board of Studies Meeting Agenda Approval",
      "status": "active",
      "total_votes": 5,
      "created_by": {
        "name": "Dr. John Smith",
        "role": "boscontroller"
      },
      "start_date": "2025-07-23T09:00:00Z",
      "end_date": "2025-07-25T17:00:00Z"
    }
  ],
  "count": 1
}
```

### 3. Get Voting Poll by ID
**GET** `/poll/:id`

**Response:**
```json
{
  "success": true,
  "message": "Voting poll retrieved successfully",
  "data": {
    "poll_id": "POLL172172345612345",
    "title": "Board of Studies Meeting Agenda Approval",
    "description": "Vote on the proposed agenda for the upcoming BOS meeting...",
    "options": [
      "Approve the agenda as proposed",
      "Approve with modifications",
      "Reject the agenda",
      "Postpone decision"
    ],
    "status": "active",
    "total_votes": 5,
    "results": [
      {
        "option": "Approve the agenda as proposed",
        "vote_count": 3,
        "percentage": 60
      },
      {
        "option": "Approve with modifications",
        "vote_count": 2,
        "percentage": 40
      }
    ]
  }
}
```

### 4. Cast Vote
**POST** `/poll/:poll_id/vote`

**Role Required:** `boscontroller` or `bosmembers`

**Request Body:**
```json
{
  "option_selected": "Approve the agenda as proposed",
  "comment": "The agenda looks comprehensive and well-structured."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "poll_id": "POLL172172345612345",
    "option_selected": "Approve the agenda as proposed",
    "voted_at": "2025-07-23T10:30:00Z"
  }
}
```

### 5. Get Voting Results
**GET** `/poll/:poll_id/results`

**Response:**
```json
{
  "success": true,
  "message": "Voting results retrieved successfully",
  "data": {
    "poll_id": "POLL172172345612345",
    "title": "Board of Studies Meeting Agenda Approval",
    "status": "completed",
    "total_votes": 8,
    "results": [
      {
        "option": "Approve the agenda as proposed",
        "vote_count": 5,
        "percentage": 62
      },
      {
        "option": "Approve with modifications",
        "vote_count": 2,
        "percentage": 25
      },
      {
        "option": "Reject the agenda",
        "vote_count": 1,
        "percentage": 13
      }
    ],
    "voting_period": {
      "start_date": "2025-07-23T09:00:00Z",
      "end_date": "2025-07-25T17:00:00Z"
    },
    "votes": [
      {
        "voter_name": "Dr. John Smith",
        "voter_role": "boscontroller",
        "option_selected": "Approve the agenda as proposed",
        "voted_at": "2025-07-23T10:30:00Z",
        "comment": "Well structured agenda"
      }
    ]
  }
}
```

### 6. Get Active Polls
**GET** `/active-polls`

**Role Required:** `boscontroller` or `bosmembers`

**Response:**
```json
{
  "success": true,
  "message": "Active polls retrieved successfully",
  "data": [
    {
      "poll_id": "POLL172172345612345",
      "title": "Board of Studies Meeting Agenda Approval",
      "description": "Vote on the proposed agenda...",
      "options": ["Option 1", "Option 2"],
      "end_date": "2025-07-25T17:00:00Z",
      "user_has_voted": false,
      "can_vote": true
    }
  ],
  "count": 1
}
```

### 7. Update Voting Poll
**PUT** `/poll/:poll_id`

**Role Required:** `boscontroller`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "active"
}
```

### 8. Delete Voting Poll
**DELETE** `/poll/:poll_id`

**Role Required:** `boscontroller`

**Note:** Can only delete polls with no votes cast.

### 9. Get Poll Statistics
**GET** `/statistics`

**Role Required:** `boscontroller`

**Response:**
```json
{
  "success": true,
  "message": "Poll statistics retrieved successfully",
  "data": {
    "total_polls": 15,
    "active_polls": 3,
    "completed_polls": 10,
    "status_breakdown": [
      {
        "_id": "active",
        "count": 3,
        "total_votes": 45
      },
      {
        "_id": "completed",
        "count": 10,
        "total_votes": 180
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token not found"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only BOS Controllers can create voting polls"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Voting poll not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating voting poll",
  "error": "Detailed error message"
}
```

## Poll Status Flow

1. **draft** - Newly created poll, not yet started
2. **active** - Poll is currently accepting votes
3. **completed** - Poll has ended (automatically or manually)
4. **cancelled** - Poll was cancelled before completion

## Security Features

- **Role-based access control**: Only `boscontroller` can create/manage polls
- **Time-based restrictions**: Polls automatically activate/close based on dates
- **Vote integrity**: Prevents duplicate voting (unless specifically allowed)
- **Anonymous voting**: Optional feature to hide voter identities
- **IP tracking**: Records IP addresses for audit purposes

## Automatic Features

- **Status Updates**: Polls automatically change status based on start/end dates
- **Result Calculation**: Vote counts and percentages are automatically calculated
- **Deadline Monitoring**: System checks for upcoming deadlines and can send notifications

## Usage Examples

### Creating a Simple Yes/No Poll
```json
{
  "title": "Approve New Course Proposal",
  "description": "Should we approve the new Data Science course proposal?",
  "options": ["Yes", "No"],
  "start_date": "2025-07-23T09:00:00Z",
  "end_date": "2025-07-24T17:00:00Z",
  "eligible_voters": ["boscontroller", "bosmembers"]
}
```

### Creating an Anonymous Poll
```json
{
  "title": "Faculty Performance Evaluation",
  "description": "Rate the overall faculty performance this semester",
  "options": ["Excellent", "Good", "Average", "Needs Improvement"],
  "start_date": "2025-07-23T09:00:00Z",
  "end_date": "2025-07-30T17:00:00Z",
  "is_anonymous": true,
  "eligible_voters": ["bosmembers"]
}
```
