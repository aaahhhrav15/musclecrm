# MeeraAI Backend Integration

This document describes the integration of the MeeraAI backend service into the CRM server.

## Overview

The MeeraAI backend has been successfully integrated into the CRM server as a separate service that runs alongside the existing CRM functionality. The MeeraAI routes are accessible under the `/api/meeraai` prefix and are completely isolated from the CRM authentication and subscription middleware.

## Routes

All MeeraAI routes are available under the `/api/meeraai` prefix:

### Blogs
- `GET /api/meeraai/blogs` - Get all blogs
- `GET /api/meeraai/blogs/:slug` - Get blog by slug
- `POST /api/meeraai/blogs` - Create a new blog
- `PUT /api/meeraai/blogs/:id` - Update a blog
- `DELETE /api/meeraai/blogs/:id` - Delete a blog

### Positions
- `GET /api/meeraai/positions` - Get all positions
- `POST /api/meeraai/positions` - Create a new position
- `PUT /api/meeraai/positions/:id` - Update a position
- `DELETE /api/meeraai/positions/:id` - Delete a position

### Careers
- `POST /api/meeraai/careers/apply` - Submit a job application with resume upload

## File Structure

```
server/
├── models/
│   ├── MeeraAIBlog.js          # Blog model
│   └── MeeraAIPosition.js      # Position model
├── routes/
│   └── meeraai/
│       ├── blogs.js            # Blog routes
│       ├── positions.js        # Position routes
│       └── careers.js          # Career application route
└── uploads/
    └── meeraai/                # Resume uploads directory (created automatically)
```

## Environment Variables

The following environment variables can be used to configure MeeraAI-specific settings. If not set, the system will fall back to the CRM's SMTP settings:

### MeeraAI-Specific (Optional)
- `MEERAAI_SMTP_HOST` - SMTP host for MeeraAI emails
- `MEERAAI_SMTP_PORT` - SMTP port for MeeraAI emails
- `MEERAAI_SMTP_USER` - SMTP username for MeeraAI emails
- `MEERAAI_SMTP_PASSWORD` - SMTP password for MeeraAI emails
- `MEERAAI_CONTACT_EMAIL` - Email address to receive job applications

### Fallback to CRM Settings
If MeeraAI-specific environment variables are not set, the system will use:
- `SMTP_HOST` - SMTP host
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `CONTACT_EMAIL` - Contact email

## Authentication & Authorization

**Important**: All MeeraAI routes are excluded from:
- Authentication middleware (no JWT token required)
- Subscription check middleware (no subscription required)

This means the MeeraAI endpoints are publicly accessible, which is the intended behavior for a public-facing careers/blog website.

## File Uploads

### Resume Uploads
- **Storage**: AWS S3 (not local disk)
- **S3 Folder**: `meeraai/resumes/`
- **Allowed file types**: PDF, DOC, DOCX
- **Maximum file size**: 5MB
- **Upload method**: Files are stored in memory using `multer.memoryStorage()` and uploaded directly to S3

### File Handling
- Resumes are uploaded to AWS S3 immediately upon upload
- Files are retained on S3 for archival/backup purposes
- Email attachments use the in-memory buffer (no need to download from S3)
- If email sending fails, the S3 file is cleaned up to avoid storing unprocessed resumes
- A cleanup job can be set up later to delete resumes older than a retention period (e.g., 90 days)

### S3 Configuration
The following AWS environment variables are required:
- `AWS_REGION` - AWS region (e.g., `us-east-1`)
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_S3_BUCKET` - S3 bucket name

These are shared with the CRM service's S3 configuration.

## Email Configuration

The careers application endpoint sends two emails:
1. **Application Notification** - Sent to `MEERAAI_CONTACT_EMAIL` (or `CONTACT_EMAIL`)
   - Contains applicant details and attached resume
   
2. **Confirmation Email** - Sent to the applicant
   - Confirms receipt of application

## CORS Configuration

**Note**: You may need to update the CORS configuration in `server/index.js` to allow requests from your MeeraAI frontend domain.

Currently allowed origins:
- `http://localhost:5173`
- `https://www.musclecrm.com`
- `https://musclecrm.com`
- `http://musclecrm-frontend.s3-website.ap-south-1.amazonaws.com`

To add your MeeraAI frontend domain, update the `allowedOrigins` array in `server/index.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173', 
  'https://www.musclecrm.com',
  'https://musclecrm.com',
  'http://musclecrm-frontend.s3-website.ap-south-1.amazonaws.com',
  'https://your-meeraai-frontend-domain.com' // Add your MeeraAI frontend domain here
];
```

## Database Models

### MeeraAIBlog
- `title` - String
- `content` - String
- `excerpt` - String
- `author` - Object with `id` and `name`
- `category` - String
- `image` - String
- `date` - String
- `tags` - Array of Strings
- `slug` - String (unique)

### MeeraAIPosition
- `title` - String (required)
- `department` - String (required)
- `location` - String (required)
- `type` - String (required, enum: 'Full-time', 'Part-time', 'Contract', 'Internship')
- `description` - String (required)
- `detailedDescription` - String (required)
- `requirements` - Array of Strings
- `createdAt` - Date
- `updatedAt` - Date (automatically managed)

## Testing

### Test Blog Endpoints
```bash
# Get all blogs
curl http://localhost:5001/api/meeraai/blogs

# Create a blog
curl -X POST http://localhost:5001/api/meeraai/blogs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Blog",
    "content": "Blog content",
    "slug": "test-blog"
  }'
```

### Test Position Endpoints
```bash
# Get all positions
curl http://localhost:5001/api/meeraai/positions

# Create a position
curl -X POST http://localhost:5001/api/meeraai/positions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "department": "Engineering",
    "location": "Remote",
    "type": "Full-time",
    "description": "Job description",
    "detailedDescription": "Detailed description"
  }'
```

### Test Career Application
```bash
curl -X POST http://localhost:5001/api/meeraai/careers/apply \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "phone=1234567890" \
  -F "experience=5" \
  -F "position=Software Engineer" \
  -F "resume=@/path/to/resume.pdf"
```

## Migration from Standalone Server

If you were previously using the standalone MeeraAI server, update your frontend API endpoints:

**Old endpoints:**
- `/api/blogs` → **New:** `/api/meeraai/blogs`
- `/api/positions` → **New:** `/api/meeraai/positions`
- `/api/careers/apply` → **New:** `/api/meeraai/careers/apply`

## Notes

- The MeeraAI service shares the same MongoDB database as the CRM, but uses separate collections (MeeraAIBlogs, MeeraAIPositions)
- All MeeraAI routes are publicly accessible (no authentication required)
- File uploads are stored temporarily and cleaned up after processing
- Email configuration can be shared with CRM or configured separately using `MEERAAI_*` environment variables

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration in environment variables
2. Verify `MEERAAI_CONTACT_EMAIL` or `CONTACT_EMAIL` is set
3. Check server logs for SMTP connection errors
4. Verify SMTP credentials are correct

### File Upload Issues
1. Verify AWS S3 credentials are configured correctly (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET)
2. Check that the S3 bucket exists and has proper permissions
3. Verify file size is under 5MB
4. Check file type is PDF, DOC, or DOCX
5. Check server logs for multer errors or S3 upload errors
6. Verify IAM permissions allow PutObject and DeleteObject on the S3 bucket

### CORS Errors
1. Add your frontend domain to the `allowedOrigins` array in `server/index.js`
2. Verify the frontend is making requests to the correct origin
3. Check browser console for specific CORS error messages

