const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const sharp = require('sharp');

// **OPTIMIZATION: In-memory cache for gym data**
const gymCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for gym data

// Helper function to get cache key
const getGymCacheKey = (gymId) => `gym_${gymId}`;

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Clear cache when gym is modified
const clearGymCache = (gymId) => {
  gymCache.delete(getGymCacheKey(gymId));
};

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
}

// **OPTIMIZATION: Improved multer configuration with better error handling**
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files with specific MIME types
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

// **OPTIMIZATION: Centralized error handler for multer**
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many files. Only one file is allowed.' 
      });
    }
  }
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  next(err);
};

// Register a new gym (no auth required)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      address,
      contactInfo,
      operatingHours,
      facilities,
      membershipTypes
    } = req.body;

    // **OPTIMIZATION: Validate required fields**
    if (!name || !contactInfo?.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gym name and email are required' 
      });
    }

    // **OPTIMIZATION: Check for existing gym using lean query**
    const existingGym = await Gym.findOne({ name }).lean();
    if (existingGym) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gym with this name already exists' 
      });
    }

    // Create new gym
    const gym = new Gym({
      name,
      address,
      contactInfo,
      operatingHours,
      facilities,
      membershipTypes
    });

    await gym.save();

    // **OPTIMIZATION: Cache the new gym data**
    gymCache.set(getGymCacheKey(gym._id), {
      data: gym,
      timestamp: Date.now()
    });

    res.status(201).json({
      success: true,
      gym,
      message: 'Gym registered successfully'
    });
  } catch (error) {
    console.error('Gym registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering gym',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Apply both auth and gymAuth middleware to all routes below
router.use(auth);
router.use(gymAuth);

// **OPTIMIZED: Get gym information with caching**
router.get('/info', async (req, res) => {
  try {
    const gymId = req.gymId;
    const cacheKey = getGymCacheKey(gymId);
    const cachedData = gymCache.get(cacheKey);

    // Return cached data if valid
    if (isCacheValid(cachedData)) {
      return res.json({ success: true, gym: cachedData.data });
    }

    // **OPTIMIZATION: Use lean query for better performance**
    const gym = await Gym.findById(gymId).lean();
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }

    // Cache the result
    gymCache.set(cacheKey, {
      data: gym,
      timestamp: Date.now()
    });

    res.json({ success: true, gym });
  } catch (error) {
    console.error('Error fetching gym info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching gym information',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// **OPTIMIZED: Update gym information with validation and caching**
router.put('/info', async (req, res) => {
  try {
    const gymId = req.gymId;
    const { name, contactInfo, address } = req.body;

    // **OPTIMIZATION: Validate input data**
    if (name && typeof name !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid gym name format' 
      });
    }

    if (contactInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Clear cache before update
    clearGymCache(gymId);

    // Find gym first
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }

    // **OPTIMIZATION: Build update object dynamically**
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (contactInfo) {
      updateData.contactInfo = {
        ...gym.contactInfo,
        ...contactInfo
      };
    }
    if (address) {
      updateData.address = {
        ...gym.address,
        ...address
      };
    }

    // **OPTIMIZATION: Use findByIdAndUpdate for atomic operation**
    const updatedGym = await Gym.findByIdAndUpdate(
      gymId,
      updateData,
      { new: true, runValidators: true }
    );

    // Cache the updated data
    gymCache.set(getGymCacheKey(gymId), {
      data: updatedGym,
      timestamp: Date.now()
    });
    
    res.json({ success: true, gym: updatedGym });
  } catch (error) {
    console.error('Error updating gym info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating gym information',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// **OPTIMIZED: Upload gym logo with enhanced processing**
router.put('/logo', upload.single('logo'), handleMulterError, async (req, res) => {
  try {
    const gymId = req.gymId;

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // **OPTIMIZATION: Additional file validation**
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    // Clear cache before update
    clearGymCache(gymId);

    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }

    try {
      // **OPTIMIZATION: Enhanced image processing with Sharp**
      const processedImageBuffer = await sharp(req.file.buffer)
        .resize(512, 512, { 
          fit: 'inside', 
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .jpeg({ 
          quality: 85, 
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer();

      // Convert to base64 with optimized MIME type
      const base64Logo = `data:image/jpeg;base64,${processedImageBuffer.toString('base64')}`;

      // **OPTIMIZATION: Update only the logo field**
      await Gym.findByIdAndUpdate(gymId, { logo: base64Logo });

      // Update cache
      gym.logo = base64Logo;
      gymCache.set(getGymCacheKey(gymId), {
        data: gym,
        timestamp: Date.now()
      });

      res.json({ 
        success: true,
        message: 'Logo uploaded successfully', 
        logo: base64Logo 
      });
    } catch (imageError) {
      console.error('Image processing error:', imageError);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid image file or corrupted data' 
      });
    }
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading logo',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// **OPTIMIZED: Delete gym logo with cache management**
router.delete('/logo', async (req, res) => {
  try {
    const gymId = req.gymId;

    // Clear cache before update
    clearGymCache(gymId);

    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }

    // **OPTIMIZATION: Direct update operation**
    await Gym.findByIdAndUpdate(gymId, { logo: null });

    res.json({ success: true, message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting logo',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// **OPTIMIZED: Generate PDF with enhanced design and caching**
router.get('/generate-pdf', async (req, res) => {
  try {
    const gymId = req.gymId;
    let gym;

    // Try to get gym from cache first
    const cacheKey = getGymCacheKey(gymId);
    const cachedData = gymCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      gym = cachedData.data;
    } else {
      gym = await Gym.findById(gymId).lean();
      if (!gym) {
        return res.status(404).json({ 
          success: false, 
          message: 'Gym not found' 
        });
      }
      // Cache the gym data
      gymCache.set(cacheKey, {
        data: gym,
        timestamp: Date.now()
      });
    }

    // **OPTIMIZATION: Stream PDF directly to response**
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: {
        Title: `${gym.name} - QR Code`,
        Author: 'Gym Management System',
        Subject: 'Attendance QR Code',
        Creator: 'Smart Gym System'
      }
    });

    // Set response headers for inline PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${gym.name.replace(/[^a-zA-Z0-9]/g, '_')}_qr_code.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // **OPTIMIZATION: Enhanced color palette and design**
    const colors = {
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#3b82f6',
      accent2: '#06b6d4',
      light: '#f8fafc',
      white: '#ffffff',
      text: '#334155',
      textLight: '#64748b',
      border: '#e2e8f0',
      gradient1: '#3b82f6',
      gradient2: '#1d4ed8',
      shadow: '#0f172a20',
      success: '#10b981',
      warning: '#f59e0b'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // **ENHANCED BACKGROUND DESIGN**
    // Main background with subtle gradient
    doc.rect(0, 0, pageWidth, pageHeight)
       .fillColor(colors.light)
       .fill();

    // Modern geometric background elements
    doc.moveTo(0, 0)
       .lineTo(pageWidth, 0)
       .lineTo(pageWidth, 140)
       .quadraticCurveTo(pageWidth * 0.7, 100, pageWidth * 0.3, 120)
       .quadraticCurveTo(pageWidth * 0.1, 130, 0, 140)
       .closePath()
       .fillColor(colors.gradient1)
       .fill();

    // Bottom decorative wave
    doc.moveTo(0, pageHeight - 100)
       .quadraticCurveTo(pageWidth * 0.3, pageHeight - 140, pageWidth * 0.7, pageHeight - 120)
       .quadraticCurveTo(pageWidth * 0.9, pageHeight - 110, pageWidth, pageHeight - 100)
       .lineTo(pageWidth, pageHeight)
       .lineTo(0, pageHeight)
       .closePath()
       .fillColor(colors.gradient2)
       .fill();

    // Decorative circles with better positioning
    const circles = [
      { x: pageWidth - 80, y: 80, r: 30, alpha: 0.15 },
      { x: 60, y: pageHeight - 60, r: 25, alpha: 0.10 },
      { x: pageWidth - 40, y: pageHeight - 40, r: 18, alpha: 0.20 },
      { x: pageWidth * 0.15, y: pageHeight * 0.3, r: 15, alpha: 0.08 },
      { x: pageWidth * 0.85, y: pageHeight * 0.7, r: 20, alpha: 0.12 }
    ];

    circles.forEach(circle => {
      doc.circle(circle.x, circle.y, circle.r)
         .fillColor(`${colors.white}${Math.round(circle.alpha * 255).toString(16).padStart(2, '0')}`)
         .fill();
    });

    // **ENHANCED LOGO SECTION**
    let currentY = 50;
    const logoAreaHeight = 120;
    const logoMaxWidth = Math.min(pageWidth - 100, 300);
    const logoMaxHeight = 100;
    
    let hasLogo = false;
    let logoBuffer = null;
    let logoDimensions = { width: 0, height: 0 };

    // **OPTIMIZATION: Better logo processing**
    if (gym.logo && typeof gym.logo === 'string' && gym.logo.startsWith('data:image/')) {
      try {
        const base64Data = gym.logo.split(',')[1];
        logoBuffer = Buffer.from(base64Data, 'base64');
        
        const metadata = await sharp(logoBuffer).metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;
        const aspectRatio = originalWidth / originalHeight;
        
        // Calculate optimal dimensions
        if (aspectRatio > 1) {
          logoDimensions.width = Math.min(logoMaxWidth, originalWidth);
          logoDimensions.height = logoDimensions.width / aspectRatio;
          if (logoDimensions.height > logoMaxHeight) {
            logoDimensions.height = logoMaxHeight;
            logoDimensions.width = logoDimensions.height * aspectRatio;
          }
        } else {
          logoDimensions.height = Math.min(logoMaxHeight, originalHeight);
          logoDimensions.width = logoDimensions.height * aspectRatio;
          if (logoDimensions.width > logoMaxWidth) {
            logoDimensions.width = logoMaxWidth;
            logoDimensions.height = logoDimensions.width / aspectRatio;
          }
        }
        
        // Process logo for PDF
        logoBuffer = await sharp(logoBuffer)
          .png()
          .resize(Math.round(logoDimensions.width), Math.round(logoDimensions.height), {
            fit: 'inside',
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toBuffer();
        hasLogo = true;
      } catch (error) {
        console.error('Error processing logo for PDF:', error);
        hasLogo = false;
      }
    }

    // Draw logo or enhanced placeholder
    if (hasLogo && logoBuffer) {
      const logoX = (pageWidth - logoDimensions.width) / 2;
      const logoY = currentY + (logoAreaHeight - logoDimensions.height) / 2;
      
      // Enhanced logo background with glow effect
      doc.circle(logoX + logoDimensions.width/2, logoY + logoDimensions.height/2, Math.max(logoDimensions.width, logoDimensions.height)/2 + 20)
         .fillColor(`${colors.accent}10`)
         .fill();
      
      doc.rect(logoX - 12, logoY - 12, logoDimensions.width + 24, logoDimensions.height + 24)
         .fillColor(colors.shadow)
         .fill();
      
      doc.rect(logoX - 10, logoY - 10, logoDimensions.width + 20, logoDimensions.height + 20)
         .fillColor(colors.white)
         .fill();
      
      doc.image(logoBuffer, logoX, logoY, { 
        width: logoDimensions.width, 
        height: logoDimensions.height
      });
    } else {
      // Enhanced placeholder design
      const placeholderSize = 90;
      const placeholderX = (pageWidth - placeholderSize) / 2;
      const placeholderY = currentY + (logoAreaHeight - placeholderSize) / 2;
      
      // Gradient background
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2 + 10)
         .fillColor(`${colors.accent}20`)
         .fill();
      
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2)
         .fillColor(colors.white)
         .fill();
      
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2 - 8)
         .fillColor(colors.accent)
         .fill();
      
      // Modern gym icon
      doc.fillColor(colors.white)
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('GYM', placeholderX + placeholderSize/2 - 25, placeholderY + placeholderSize/2 - 12);
    }

    currentY += logoAreaHeight + 25;

    // **ENHANCED GYM NAME SECTION**
    const nameCardHeight = 90;
    const nameCardWidth = pageWidth - 80;
    const nameCardX = 40;
    
    // Multi-layer shadow effect
    doc.rect(nameCardX + 6, currentY + 6, nameCardWidth, nameCardHeight)
       .fillColor(`${colors.shadow}40`)
       .fill();
    
    doc.rect(nameCardX + 3, currentY + 3, nameCardWidth, nameCardHeight)
       .fillColor(`${colors.shadow}20`)
       .fill();
    
    // Main card with rounded corners effect
    doc.rect(nameCardX, currentY, nameCardWidth, nameCardHeight)
       .fillColor(colors.white)
       .fill();
    
    // Gradient accent line
    doc.rect(nameCardX, currentY, nameCardWidth, 6)
       .fillColor(colors.accent)
       .fill();
    
    doc.rect(nameCardX, currentY, nameCardWidth/2, 6)
       .fillColor(colors.accent2)
       .fill();

    // Gym name with better typography
    doc.fillColor(colors.primary)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(gym.name || 'Gym Name', nameCardX + 25, currentY + 20, {
         width: nameCardWidth - 50,
         align: 'center'
       });

    doc.fillColor(colors.textLight)
       .fontSize(16)
       .font('Helvetica')
       .text('Digital Attendance System', nameCardX + 25, currentY + 55, {
         width: nameCardWidth - 50,
         align: 'center'
       });

    currentY += nameCardHeight + 35;

    // **ENHANCED QR CODE SECTION**
    const qrCodeData = `https://web-production-6057.up.railway.app/mark_attendance/${gym.gymCode}`;
    
    // **OPTIMIZATION: Better QR code generation**
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 240,
      color: {
        dark: colors.primary,
        light: colors.white
      }
    });

    const qrSize = 240;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Modern QR container with enhanced styling
    const containerPadding = 30;
    const containerSize = qrSize + (containerPadding * 2);
    const containerX = (pageWidth - containerSize) / 2;
    
    // Multi-layer glow effect
    doc.circle(containerX + containerSize/2, currentY + containerSize/2, containerSize/2 + 25)
       .fillColor(`${colors.accent}15`)
       .fill();
    
    doc.circle(containerX + containerSize/2, currentY + containerSize/2, containerSize/2 + 15)
       .fillColor(`${colors.accent}10`)
       .fill();
    
    // Main container with shadow
    doc.rect(containerX + 3, currentY + 3, containerSize, containerSize)
       .fillColor(colors.shadow)
       .fill();
    
    doc.rect(containerX, currentY, containerSize, containerSize)
       .fillColor(colors.white)
       .fill();
    
    // Enhanced border with corner accents
    const borderWidth = 4;
    const cornerSize = 20;
    
    // Top border with gradient effect
    doc.rect(containerX, currentY, containerSize, borderWidth)
       .fillColor(colors.accent)
       .fill();
    
    // Bottom border
    doc.rect(containerX, currentY + containerSize - borderWidth, containerSize, borderWidth)
       .fillColor(colors.accent2)
       .fill();
    
    // Corner accents
    doc.rect(containerX, currentY, cornerSize, cornerSize)
       .fillColor(colors.accent)
       .fill();
    
    doc.rect(containerX + containerSize - cornerSize, currentY, cornerSize, cornerSize)
       .fillColor(colors.accent)
       .fill();
    
    // QR Code
    doc.image(qrCodeBuffer, qrX, currentY + containerPadding, { 
      width: qrSize, 
      height: qrSize
    });

    currentY += containerSize + 30;

    // **ENHANCED GYM CODE DISPLAY**
    const codeContainerWidth = 320;
    const codeContainerX = (pageWidth - codeContainerWidth) / 2;
    const codeContainerHeight = 65;
    
    // Shadow and main container
    doc.rect(codeContainerX + 3, currentY + 3, codeContainerWidth, codeContainerHeight)
       .fillColor(colors.shadow)
       .fill();
    
    doc.rect(codeContainerX, currentY, codeContainerWidth, codeContainerHeight)
       .fillColor(colors.primary)
       .fill();
    
    // Gradient highlight
    doc.rect(codeContainerX, currentY, codeContainerWidth, 3)
       .fillColor(colors.accent2)
       .fill();
    
    doc.rect(codeContainerX, currentY, codeContainerWidth/3, 3)
       .fillColor(colors.success)
       .fill();

    // Code text with better spacing
    doc.fillColor('#ffffff60')
       .fontSize(14)
       .font('Helvetica')
       .text('GYM CODE', codeContainerX, currentY + 15, {
         width: codeContainerWidth,
         align: 'center'
       });

    doc.fillColor(colors.white)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(gym.gymCode || 'GYM001', codeContainerX, currentY + 35, {
         width: codeContainerWidth,
         align: 'center'
       });

    currentY += codeContainerHeight + 25;

    // **ENHANCED INSTRUCTIONS**
    doc.fillColor(colors.text)
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('Scan to Mark Attendance', 50, currentY, {
         width: pageWidth - 100,
         align: 'center'
       });

    currentY += 30;

    // Additional instructions
    doc.fillColor(colors.textLight)
       .fontSize(12)
       .font('Helvetica')
       .text('Point your camera at the QR code above or use any QR scanner app', 50, currentY, {
         width: pageWidth - 100,
         align: 'center'
       });

    // **ENHANCED FOOTER**
    const footerY = pageHeight - 80;
    
    // Footer background
    doc.rect(0, footerY - 10, pageWidth, 90)
       .fillColor(`${colors.primary}95`)
       .fill();
    
    doc.fillColor('#ffffff90')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Smart Gym Management System', 50, footerY + 5, {
         width: pageWidth - 100,
         align: 'center'
       });

    doc.fillColor('#ffffff70')
       .fontSize(10)
       .font('Helvetica')
       .text('Streamlining fitness experiences with technology', 50, footerY + 22, {
         width: pageWidth - 100,
         align: 'center'
       });

    // Add generation timestamp
    doc.fillColor('#ffffff50')
       .fontSize(8)
       .font('Helvetica')
       .text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 40, {
         width: pageWidth - 100,
         align: 'center'
       });

    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Error generating PDF',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
});

// **NEW: Health check endpoint**
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Gym service is healthy',
    timestamp: new Date().toISOString(),
    cache_size: gymCache.size
  });
});

// **NEW: Clear cache endpoint for development**
router.delete('/cache', async (req, res) => {
  try {
    gymCache.clear();
    res.json({ 
      success: true, 
      message: 'Gym cache cleared successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error clearing cache' 
    });
  }
});

module.exports = router;