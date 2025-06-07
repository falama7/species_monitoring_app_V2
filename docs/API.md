# Species Monitoring API Documentation

## Overview

The Species Monitoring API is a RESTful service that provides endpoints for managing wildlife observation data, projects, species information, and user management.

**Base URL:** `http://localhost:5000/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "observer|researcher|admin"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "string",
    "created_at": "datetime"
  },
  "access_token": "string",
  "refresh_token": "string"
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { "..." },
  "access_token": "string",
  "refresh_token": "string"
}
```

#### Get Profile
```http
GET /auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "string",
    "is_active": "boolean",
    "created_at": "datetime",
    "last_login": "datetime"
  }
}
```

#### Update Profile
```http
PUT /auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string"
}
```

#### Change Password
```http
POST /auth/change-password
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

## Projects

### List Projects
```http
GET /projects?page=1&per_page=20&search=string&status=active
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `search` (optional): Search term for project name/description
- `status` (optional): Filter by status (active, completed, paused, cancelled)

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "location": "string",
      "start_date": "date",
      "end_date": "date",
      "status": "string",
      "created_by": {
        "id": "uuid",
        "first_name": "string",
        "last_name": "string"
      },
      "members_count": "integer",
      "observations_count": "integer",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": "integer",
  "pages": "integer",
  "current_page": "integer",
  "per_page": "integer"
}
```

### Create Project
```http
POST /projects
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "location": "string",
  "start_date": "date",
  "end_date": "date",
  "status": "active|completed|paused|cancelled"
}
```

### Get Project
```http
GET /projects/{project_id}
```

**Headers:** `Authorization: Bearer <token>`

### Update Project
```http
PUT /projects/{project_id}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as Create Project

### Delete Project
```http
DELETE /projects/{project_id}
```

**Headers:** `Authorization: Bearer <token>`

### Project Members

#### Get Project Members
```http
GET /projects/{project_id}/members
```

#### Add Project Member
```http
POST /projects/{project_id}/members
```

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

#### Remove Project Member
```http
DELETE /projects/{project_id}/members/{user_id}
```

## Species

### List Species
```http
GET /species?page=1&per_page=50&search=string&family=string&conservation_status=string
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `search` (optional): Search in scientific/common names
- `family` (optional): Filter by family
- `conservation_status` (optional): Filter by IUCN status

**Response:**
```json
{
  "species": [
    {
      "id": "uuid",
      "scientific_name": "string",
      "common_name": "string",
      "family": "string",
      "genus": "string",
      "species_code": "string",
      "conservation_status": "LC|NT|VU|EN|CR|EW|EX",
      "description": "string",
      "habitat": "string",
      "image_url": "string",
      "created_at": "datetime"
    }
  ],
  "total": "integer",
  "pages": "integer",
  "current_page": "integer",
  "per_page": "integer"
}
```

### Create Species
```http
POST /species
```

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Researcher or Admin

**Request Body:**
```json
{
  "scientific_name": "string",
  "common_name": "string",
  "family": "string",
  "genus": "string",
  "species_code": "string",
  "conservation_status": "LC|NT|VU|EN|CR|EW|EX",
  "description": "string",
  "habitat": "string",
  "image_url": "string"
}
```

### Get Species
```http
GET /species/{species_id}
```

### Update Species
```http
PUT /species/{species_id}
```

**Permissions:** Researcher or Admin

### Get Families
```http
GET /species/families
```

**Response:**
```json
{
  "families": ["string", "string", ...]
}
```

### Get Conservation Statuses
```http
GET /species/conservation-statuses
```

**Response:**
```json
{
  "conservation_statuses": [
    {
      "code": "LC",
      "name": "Least Concern"
    },
    ...
  ]
}
```

## Observations

### List Observations
```http
GET /observations?page=1&per_page=20&project_id=uuid&species_id=uuid&start_date=date&end_date=date
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `project_id` (optional): Filter by project
- `species_id` (optional): Filter by species
- `start_date` (optional): Filter observations from date (YYYY-MM-DD)
- `end_date` (optional): Filter observations to date (YYYY-MM-DD)

**Response:**
```json
{
  "observations": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "species": {
        "id": "uuid",
        "scientific_name": "string",
        "common_name": "string",
        "conservation_status": "string"
      },
      "observer": {
        "id": "uuid",
        "first_name": "string",
        "last_name": "string"
      },
      "observation_date": "datetime",
      "latitude": "float",
      "longitude": "float",
      "location_name": "string",
      "count": "integer",
      "behavior": "string",
      "habitat_description": "string",
      "weather_conditions": "string",
      "notes": "string",
      "image_urls": ["string"],
      "audio_urls": ["string"],
      "accuracy": "float",
      "altitude": "float",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": "integer",
  "pages": "integer",
  "current_page": "integer",
  "per_page": "integer"
}
```

### Create Observation
```http
POST /observations
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "project_id": "uuid",
  "species_id": "uuid",
  "observation_date": "datetime",
  "latitude": "float",
  "longitude": "float",
  "location_name": "string",
  "count": "integer",
  "behavior": "string",
  "habitat_description": "string",
  "weather_conditions": "string",
  "notes": "string",
  "image_urls": ["string"],
  "audio_urls": ["string"],
  "accuracy": "float",
  "altitude": "float"
}
```

### Get Observation
```http
GET /observations/{observation_id}
```

### Update Observation
```http
PUT /observations/{observation_id}
```

**Permissions:** Observation creator or Admin

### Delete Observation
```http
DELETE /observations/{observation_id}
```

**Permissions:** Observation creator or Admin

### Export Observations
```http
GET /observations/export?project_id=uuid&format=csv
```

**Query Parameters:**
- `project_id` (required): Project to export
- `format` (optional): Export format (csv, excel)

**Response:**
```json
{
  "message": "Export started",
  "task_id": "string"
}
```

## File Uploads

### Upload Image
```http
POST /uploads/image
```

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: Image file (PNG, JPG, JPEG, GIF, WEBP)

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "file_url": "string",
  "filename": "string"
}
```

### Upload Audio
```http
POST /uploads/audio
```

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: Audio file (MP3, WAV, OGG, AAC, M4A)

**Response:**
```json
{
  "message": "Audio uploaded successfully",
  "file_url": "string",
  "filename": "string"
}
```

### Get Uploaded Files
```http
GET /uploads/images/{filename}
GET /uploads/audio/{filename}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **Upload endpoints**: 10 requests per minute
- **Other endpoints**: 100 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Pagination information is included in response metadata.

## Data Formats

- **Dates**: ISO 8601 format (YYYY-MM-DD)
- **Datetimes**: ISO 8601 format with timezone (YYYY-MM-DDTHH:MM:SSZ)
- **Coordinates**: Decimal degrees (latitude: -90 to 90, longitude: -180 to 180)
- **UUIDs**: Standard UUID v4 format

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "Species Monitoring API is running"
}
```