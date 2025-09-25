require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

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
const analyticsRoutes = require('./routes/analytics');
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
const expensesRoutes = require('./routes/expenses');
const leadsRouter = require('./routes/leads');
const personalTrainingRoutes = require('./routes/personalTraining');
const paymentRoutes = require('./routes/payment');
const subscriptionPlansRoutes = require('./routes/subscriptionPlans');
const contactRoutes = require('./routes/contact');
const productsRoutes = require('./routes/products');
const accountabilitiesRoutes = require('./routes/accountabilities');
const resultsRoutes = require('./routes/results');
const reelsRoutes = require('./routes/reels');

const auth = require('./middleware/auth');
const checkSubscription = require('./middleware/checkSubscription');

const app = express();

app.use(morgan('dev'));

// Increase payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173', 
      'https://www.musclecrm.com',
      'https://musclecrm.com',
      'http://musclecrm-frontend.s3-website.ap-south-1.amazonaws.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true
})
  .then(() => {
    console.log('MongoDB connected successfully...');
  })
  .catch(err => {
    console.error('MongoDB  error:', err);
    process.exit(1); // Exit if we can't connect to the database
  });

// Middleware
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

// Register contact route BEFORE global auth/subscription middleware
app.use('/api/contact', contactRoutes);

// Global authentication middleware for all /api routes except auth and subscription
app.use((req, res, next) => {
  const excluded = [
    '/api/auth',
    '/api/subscription-plans',
    '/api/subscriptions',
    '/api/contact',
  ];
  if (excluded.some(path => req.path.startsWith(path))) {
    return next();
  }
  return auth(req, res, next);
});

// Global subscription check middleware (after auth)
app.use((req, res, next) => {
  const excluded = [
    '/api/auth',
    '/api/subscription-plans',
    '/api/subscriptions',
    '/api/payment',            // Allow payment endpoints
    '/api/gym',                // Allow gym info/settings
    '/api/gym/',               // Allow gym info/settings (trailing slash)
    '/api/gym/settings',       // If you have a settings endpoint
    '/api/gym/info',           // If you have a gym info endpoint
    '/api/dashboard/settings', // If you have a dashboard settings endpoint
    '/api/contact',            // Allow contact endpoint
  ];
  if (excluded.some(path => req.path.startsWith(path))) {
    return next();
  }
  return checkSubscription(req, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gym', gymRoutes);
// app.use('/api/gym/members', membersRoutes);
app.use('/api/gym/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/gym/expenses', expensesRoutes);
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
app.use('/api/leads', leadsRouter);
app.use('/api/personal-training', personalTrainingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription-plans', subscriptionPlansRoutes);
app.use('/api/gym/products', productsRoutes);
app.use('/api/gym/accountabilities', accountabilitiesRoutes);
app.use('/api/gym/results', resultsRoutes);
app.use('/api/reels', reelsRoutes);


// Root route
app.get('/', (req, res) => {
  res.send('MuscleCRM API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation: Origin not allowed'
    });
  }
  
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong on the server' 
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
