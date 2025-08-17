# Results API Documentation

## Overview
The Results API allows external applications to post results content with images, descriptions, and weight data to the MuscleCRM system. This API is designed for mobile applications and third-party integrations.

## Base URL
```
https://your-api-domain.com/api/v1/results
```

## Authentication
All API requests require an API key to be included in the request headers.

### Headers
```
X-API-Key: your_api_key_here
Content-Type: application/json
```

## API Endpoints

### 1. Create Results Post

**Endpoint:** `POST /api/v1/results`

**Description:** Create a new results post with description, image, and weight.

**Request Body:**
```json
{
  "description": "Grilled sandwich for lunch.",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "customerId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "gymId": "6878c6c15571b7b830c9f3a1",
  "weight": 72
}
```

**Parameters:**
- `description` (string, required): Post description (max 1000 characters)
- `imageBase64` (string, required): Base64 encoded image (max 5MB)
- `customerId` (string, required): Customer ID who is posting
- `gymId` (string, required): Gym ID where the post is being created
- `weight` (number, required): Weight value (0-1000)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Results post created successfully",
  "data": {
    "postId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Grilled sandwich for lunch.",
    "weight": 72,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 - Missing required fields
{
  "success": false,
  "error": "Description, image, customerId, gymId, and weight are required",
  "code": "MISSING_REQUIRED_FIELDS"
}

// 400 - Invalid weight
{
  "success": false,
  "error": "Weight must be a number between 0 and 1000.",
  "code": "INVALID_WEIGHT"
}

// 400 - Customer not found
{
  "success": false,
  "error": "Customer not found or does not belong to this gym",
  "code": "CUSTOMER_NOT_FOUND"
}

// 400 - Invalid image
{
  "success": false,
  "error": "Image size too large. Maximum size is 5MB.",
  "code": "INVALID_IMAGE"
}

// 401 - Invalid API key
{
  "success": false,
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}

// 429 - Rate limit exceeded
{
  "success": false,
  "error": "Rate limit exceeded. Too many requests per hour.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### 2. Get Results Posts

**Endpoint:** `GET /api/v1/results`

**Description:** Retrieve results posts with pagination and filtering.

**Query Parameters:**
- `gymId` (string, required): Gym ID to fetch posts from
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Posts per page (default: 10, max: 50)
- `customerId` (string, optional): Filter by customer ID
- `sortBy` (string, optional): Sort field (default: "createdAt")
- `sortOrder` (string, optional): Sort order "asc" or "desc" (default: "desc")

**Example Request:**
```
GET /api/v1/results?gymId=6878c6c15571b7b830c9f3a1&page=1&limit=10&customerId=64f8a1b2c3d4e5f6a7b8c9d0&sortBy=createdAt&sortOrder=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "description": "Grilled sandwich for lunch.",
        "weight": 72,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "userId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 3. Get Specific Results Post

**Endpoint:** `GET /api/v1/results/:id`

**Description:** Retrieve a specific results post by ID.

**Query Parameters:**
- `gymId` (string, required): Gym ID to fetch post from

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "gymId": "64f8a1b2c3d4e5f6a7b8c9d2",
    "userId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "description": "Grilled sandwich for lunch.",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "weight": 72,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Results Post

**Endpoint:** `PUT /api/v1/results/:id`

**Description:** Update an existing results post.

**Query Parameters:**
- `gymId` (string, required): Gym ID to update post in

**Request Body:**
```json
{
  "description": "Updated description",
  "weight": 75
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Results post updated successfully",
  "data": {
    "postId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Updated description",
    "weight": 75,
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

### 5. Delete Results Post

**Endpoint:** `DELETE /api/v1/results/:id`

**Description:** Delete a results post permanently.

**Query Parameters:**
- `gymId` (string, required): Gym ID to delete post from

**Success Response (200):**
```json
{
  "success": true,
  "message": "Results post deleted successfully"
}
```

## Image Requirements

### Supported Formats
- JPEG/JPG
- PNG
- WebP

### Size Limits
- Maximum file size: 5MB
- Recommended dimensions: 1080x1080 pixels

### Base64 Format
Images must be provided as base64 strings with the following format:
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

## Weight Requirements

### Validation Rules
- Must be a number
- Range: 0 to 1000
- No decimal places required (can be integer or float)

### Examples
```json
{
  "weight": 72,      // Valid
  "weight": 72.5,    // Valid
  "weight": 0,       // Valid
  "weight": 1000     // Valid
}
```

## Rate Limiting

API requests are rate-limited based on your API key configuration:
- Default: 100 requests per hour
- Default: 1000 requests per day

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642233600
```

## Error Codes

| Code | Description |
|------|-------------|
| `API_KEY_MISSING` | API key not provided |
| `INVALID_API_KEY` | Invalid or expired API key |
| `API_KEY_EXPIRED` | API key has expired |
| `GYM_INACTIVE` | Associated gym is not active |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `MISSING_REQUIRED_FIELDS` | Required fields missing |
| `DESCRIPTION_TOO_LONG` | Description exceeds 1000 characters |
| `INVALID_WEIGHT` | Weight is not a valid number or out of range |
| `INVALID_IMAGE` | Invalid image format or size |
| `POST_NOT_FOUND` | Results post not found |
| `AUTH_REQUIRED` | Authentication required |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions |
| `INTERNAL_ERROR` | Internal server error |

## Getting Started

### 1. Obtain API Key
Contact the gym owner to generate an API key for your application.

### 2. Test the API
```bash
curl -X POST https://your-api-domain.com/api/v1/results \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test post",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "customerId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "gymId": "6878c6c15571b7b830c9f3a1",
    "weight": 72
  }'
```

### 3. Mobile App Integration Example

**JavaScript/React Native:**
```javascript
const uploadResultsPost = async (description, imageBase64, customerId, gymId, weight) => {
  try {
    const response = await fetch('https://your-api-domain.com/api/v1/results', {
      method: 'POST',
      headers: {
        'X-API-Key': 'your_api_key_here',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        imageBase64,
        customerId,
        gymId,
        weight
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Post created:', result.data);
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

**Swift (iOS):**
```swift
func uploadResultsPost(description: String, imageBase64: String, customerId: String, gymId: String, weight: Double) async throws -> [String: Any] {
    let url = URL(string: "https://your-api-domain.com/api/v1/results")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("your_api_key_here", forHTTPHeaderField: "X-API-Key")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
        "description": description,
        "imageBase64": imageBase64,
        "customerId": customerId,
        "gymId": gymId,
        "weight": weight
    ]
    
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let result = try JSONSerialization.jsonObject(with: data) as! [String: Any]
    
    if result["success"] as? Bool == true {
        return result["data"] as! [String: Any]
    } else {
        throw NSError(domain: "APIError", code: 0, userInfo: [NSLocalizedDescriptionKey: result["error"] as? String ?? "Unknown error"])
    }
}
```

## Support

For API support and questions, contact the gym owner or refer to the MuscleCRM documentation.
