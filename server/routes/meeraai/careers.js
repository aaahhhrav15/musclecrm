const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const s3Service = require('../../services/s3Service');
const router = express.Router();

// Configure multer for file uploads (resumes) - using memory storage for S3 upload
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory to upload to S3
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || 
                     file.mimetype === 'application/msword' || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
    }
  }
});

// Configure nodemailer with SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MEERAAI_SMTP_HOST || process.env.SMTP_HOST,
  port: process.env.MEERAAI_SMTP_PORT || process.env.SMTP_PORT,
  secure: process.env.MEERAAI_SMTP_PORT === '465' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.MEERAAI_SMTP_USER || process.env.SMTP_USER,
    pass: process.env.MEERAAI_SMTP_PASSWORD || process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Verify SMTP connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('MeeraAI SMTP Connection Error:', error);
  } else {
    console.log('MeeraAI SMTP Server is ready to take our messages');
  }
});

// Job application endpoint
router.post('/apply', upload.single('resume'), async (req, res, next) => {
  let s3Key = null; // Track S3 key for cleanup

  try {
    const {
      name,
      email,
      phone,
      experience,
      currentCompany,
      expectedSalary,
      noticePeriod,
      position
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const contactEmail = process.env.MEERAAI_CONTACT_EMAIL || process.env.CONTACT_EMAIL;
    const smtpUser = process.env.MEERAAI_SMTP_USER || process.env.SMTP_USER;

    if (!contactEmail || !smtpUser) {
      return res.status(500).json({ 
        error: 'Email configuration is missing. Please contact the administrator.' 
      });
    }

    // Upload resume to S3
    let uploadResult;
    try {
      uploadResult = await s3Service.uploadDocument(
        req.file.buffer,
        req.file.originalname,
        'meeraai/resumes'
      );
      s3Key = uploadResult.key;
      console.log('Resume uploaded to S3:', uploadResult.url);
    } catch (s3Error) {
      console.error('Error uploading resume to S3:', s3Error);
      // Continue with email even if S3 upload fails, but log the error
    }

    // Prepare email attachment using the file buffer
    const attachment = {
      filename: req.file.originalname,
      content: req.file.buffer,
      contentType: req.file.mimetype
    };

    // Email content
    const mailOptions = {
      from: `"MeeraAI Careers" <${smtpUser}>`,
      to: contactEmail,
      subject: `New Job Application: ${position}`,
      html: `
        <h2>New Job Application Received</h2>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Experience:</strong> ${experience} years</p>
        <p><strong>Current Company:</strong> ${currentCompany || 'N/A'}</p>
        <p><strong>Expected Salary:</strong> ${expectedSalary || 'N/A'}</p>
        <p><strong>Notice Period:</strong> ${noticePeriod || 'N/A'} days</p>
        ${uploadResult ? `<p><strong>Resume S3 URL:</strong> <a href="${uploadResult.url}">View Resume</a></p>` : ''}
      `,
      attachments: [attachment]
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to applicant
    const confirmationMailOptions = {
      from: `"MeeraAI Careers" <${smtpUser}>`,
      to: email,
      subject: 'Application Received - MeeraAI Tech Solutions',
      html: `
        <h2>Thank you for your application!</h2>
        <p>Dear ${name},</p>
        <p>We have received your application for the ${position} position at MeeraAI Tech Solutions.</p>
        <p>Our team will review your application and get back to you soon.</p>
        <p>Best regards,<br>MeeraAI Tech Solutions Team</p>
      `
    };

    await transporter.sendMail(confirmationMailOptions);

    // Resume is stored on S3 and will be retained for archival/backup purposes
    // A cleanup job can be set up later to delete resumes older than a retention period (e.g., 90 days)
    if (s3Key) {
      console.log('Resume stored on S3 for archival:', uploadResult?.url);
    }

    res.status(200).json({ 
      message: 'Application submitted successfully',
      resumeUrl: uploadResult?.url // Return S3 URL for reference
    });
  } catch (error) {
    console.error('Error processing application:', error);
    
    // Clean up S3 file if upload was successful but email failed
    // (to avoid storing resumes that weren't successfully processed)
    if (s3Key) {
      try {
        await s3Service.deleteDocument(s3Key);
        console.log('Resume cleaned up from S3 due to processing error');
      } catch (deleteError) {
        console.error('Error cleaning up resume from S3:', deleteError);
      }
    }
    
    // Send a more specific error message to the client
    if (error.code === 'ESOCKET' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ 
        error: 'Unable to connect to email server. Please try again later.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to process application' });
  }
});

// Multer error handler middleware (must be after routes, with 4 parameters)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size too large. Maximum size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Only one file is allowed.' 
      });
    }
    return res.status(400).json({ 
      error: `Upload error: ${err.message}` 
    });
  }
  // Handle file filter errors
  if (err && err.message && err.message.includes('Only PDF, DOC, and DOCX')) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  // Pass other errors to Express error handler
  next(err);
});

module.exports = router;

