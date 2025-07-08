
# MuscleCRM - Gym Management System

A comprehensive CRM system for gym management with MongoDB backend.

## Project Structure

- `src/` - Frontend React application
- `server/` - Backend Node.js API

## Setup Instructions

### Backend Setup

1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Start the server: `npm run dev`

### Frontend Setup

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

## Environment Variables

### Backend (server/.env)
```
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/MuscleCRM
JWT_SECRET=your_jwt_secret_key_here
```

### Frontend (.env.development)
```
VITE_API_URL=http://localhost:5001/api
```

## API Routes

### Authentication
- POST /api/auth/signup - Register a new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/profile - Get user profile
- PUT /api/auth/profile - Update user profile

### Members
- GET /api/members - Get all members
- GET /api/members/:id - Get single member
- POST /api/members - Create new member
- PUT /api/members/:id - Update member
- DELETE /api/members/:id - Delete member

### Staff
- GET /api/staff - Get all staff
- GET /api/staff/:id - Get single staff member
- POST /api/staff - Create new staff member
- PUT /api/staff/:id - Update staff member
- DELETE /api/staff/:id - Delete staff member

### Attendance
- GET /api/attendance - Get all attendance records
- POST /api/attendance/check-in - Check-in a member
- PUT /api/attendance/check-out/:id - Check-out a member
- GET /api/attendance/active - Get active (checked-in) members
- GET /api/attendance/range - Get attendance by date range
