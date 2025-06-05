require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth');
const membersRoutes = require('./routes/members');
const staffRoutes = require('./routes/staff');
const attendanceRoutes = require('./routes/attendance');
const invoicesRoutes = require('./routes/invoices');
const bookingsRoutes = require('./routes/bookings');
const customersRoutes = require('./routes/customers');
const notificationsRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const workoutPlansRoutes = require('./routes/workoutPlans');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gym/members', membersRoutes);
app.use('/api/gym/staff', staffRoutes);
app.use('/api/gym/attendance', attendanceRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/workout-plans', workoutPlansRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('FlexCRM API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong on the server' 
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
