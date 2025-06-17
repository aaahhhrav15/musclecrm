require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
// const membersRoutes = require('./routes/members');
const staffRoutes = require('./routes/staff');
const attendanceRoutes = require('./routes/attendance');
const invoicesRoutes = require('./routes/invoices');
const bookingsRoutes = require('./routes/bookings');
const customersRoutes = require('./routes/customers');
const notificationsRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const workoutPlansRoutes = require('./routes/workoutPlans');
const trainersRouter = require('./routes/trainers');
const classSchedulesRouter = require('./routes/classSchedules');
const membershipPlansRoutes = require('./routes/membershipPlans');
const nutritionPlansRoutes = require('./routes/nutritionPlans');
const eventWorkshopsRoutes = require('./routes/eventWorkshops');
const waiverFormsRoutes = require('./routes/waiverForms');
const communicationsRoutes = require('./routes/communications');
const gymRoutes = require('./routes/gym');
const healthAssessmentRoutes = require('./routes/healthAssessments');
const retailSalesRoutes = require('./routes/retailSales');
const transactionsRoutes = require('./routes/transactions');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB connected successfully...');
  })
  .catch(err => {
    console.error('MongoDB  error:', err);
    process.exit(1); // Exit if we can't connect to the database
  });

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the public directory
app.use('/waiver-forms', express.static(path.join(__dirname, 'public/waiver-forms'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename=gym-waiver-form.pdf');
    }
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory
app.use('/', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers for all static files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    
    // Set cache control headers
    res.set('Cache-Control', 'public, max-age=31536000');
    
    // Set content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') {
      res.set('Content-Type', 'image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.set('Content-Type', 'image/jpeg');
    } else if (ext === '.gif') {
      res.set('Content-Type', 'image/gif');
    } else if (ext === '.webp') {
      res.set('Content-Type', 'image/webp');
    }
  }
}));

// Add a specific route for serving logo files
app.get('/uploads/logos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'logos', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Logo not found');
  }

  // Set appropriate headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  res.set('Cache-Control', 'public, max-age=31536000');

  // Set content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') {
    res.set('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.set('Content-Type', 'image/jpeg');
  } else if (ext === '.gif') {
    res.set('Content-Type', 'image/gif');
  } else if (ext === '.webp') {
    res.set('Content-Type', 'image/webp');
  }

  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gym', gymRoutes);
// app.use('/api/gym/members', membersRoutes);
app.use('/api/gym/staff', staffRoutes);
app.use('/api/gym/attendance', attendanceRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/workout-plans', workoutPlansRoutes);
app.use('/api/trainers', trainersRouter);
app.use('/api/gym/class-schedules', classSchedulesRouter);
app.use('/api/gym/membership-plans', membershipPlansRoutes);
app.use('/api/nutrition-plans', nutritionPlansRoutes);
app.use('/api/events-workshops', eventWorkshopsRoutes);
app.use('/api/waiver-forms', waiverFormsRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/gym/health-assessments', healthAssessmentRoutes);
app.use('/api/gym/retail-sales', retailSalesRoutes);
app.use('/api/transactions', transactionsRoutes);

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
