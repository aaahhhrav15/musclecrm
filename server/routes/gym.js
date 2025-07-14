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

// Utility function to check if gym subscription is active
function isSubscriptionActive(gym) {
  if (!gym.subscriptionEndDate) return false;
  return new Date(gym.subscriptionEndDate) >= new Date();
}

// **OPTIMIZED: Get gym information with caching**
// Get gym information without caching
router.get('/info', async (req, res) => {
  try {
    const gymId = req.gymId;
    // Always fetch fresh data from the database
    const gym = await Gym.findById(gymId).lean();
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }
    res.json({ success: true, gym, subscriptionActive: isSubscriptionActive(gym) });
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
router.put('/info', upload.single('logo'), handleMulterError, async (req, res) => {
  try {
    const gymId = req.gymId;
    const { name, contactInfo, address } = req.body;
    const logoFile = req.file;

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

    // Parse JSON strings if they come as strings
    let parsedContactInfo = contactInfo;
    let parsedAddress = address;
    
    if (typeof contactInfo === 'string') {
      try {
        parsedContactInfo = JSON.parse(contactInfo);
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid contact info format' 
        });
      }
    }
    
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid address format' 
        });
      }
    }

    // **OPTIMIZATION: Build update object**
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (parsedContactInfo) updateData.contactInfo = parsedContactInfo;
    if (parsedAddress) updateData.address = parsedAddress;

    // Handle logo upload if provided
    if (logoFile) {
      try {
        console.log('Processing logo file:', logoFile.originalname, logoFile.mimetype, logoFile.size);
        
        // Process the uploaded image with better error handling
        const processedImageBuffer = await sharp(logoFile.buffer)
          .resize(300, 300, { 
            fit: 'inside', 
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png({ quality: 90 })
          .toBuffer();

        console.log('Image processed successfully, buffer size:', processedImageBuffer.length);
        
        // Convert to base64
        const base64Logo = `data:image/png;base64,${processedImageBuffer.toString('base64')}`;
        updateData.logo = base64Logo;
        
        console.log('Base64 logo created, length:', base64Logo.length);
      } catch (error) {
        console.error('Error processing logo:', error);
        return res.status(400).json({ 
          success: false, 
          message: 'Error processing logo image: ' + error.message 
        });
      }
    }

    // Handle logo removal if requested
    if (req.body.removeLogo === 'true') {
      updateData.logo = null;
    }

    // **OPTIMIZATION: Update gym with lean query**
    const updatedGym = await Gym.findByIdAndUpdate(
      gymId, 
      updateData, 
      { new: true, lean: true }
    );

    if (!updatedGym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }

    // **OPTIMIZATION: Clear cache and update**
    clearGymCache(gymId);
    gymCache.set(getGymCacheKey(gymId), {
      data: updatedGym,
      timestamp: Date.now()
    });

    res.json({ 
      success: true, 
      gym: updatedGym,
      message: 'Gym information updated successfully'
    });
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
      console.log('Processing logo file:', req.file.originalname, req.file.mimetype, req.file.size);
      
      // **OPTIMIZATION: Enhanced image processing with Sharp**
      const processedImageBuffer = await sharp(req.file.buffer)
        .resize(512, 512, { 
          fit: 'inside', 
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ 
          quality: 90,
          compressionLevel: 6
        })
        .toBuffer();

      console.log('Image processed successfully, buffer size:', processedImageBuffer.length);

      // Convert to base64 with optimized MIME type
      const base64Logo = `data:image/png;base64,${processedImageBuffer.toString('base64')}`;
      
      console.log('Base64 logo created, length:', base64Logo.length);

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

// **OPTIMIZED: Generate PDF with fresh data and no caching**
router.get('/generate-pdf', async (req, res) => {
  try {
    const gymId = req.gymId;
    
    // Always fetch fresh gym data - no caching for QR generation
    const gym = await Gym.findById(gymId).lean();
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }

    // Create PDF document
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

    // Set response headers for inline PDF viewing with no caching
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${gym.name.replace(/[^a-zA-Z0-9]/g, '_')}_qr_code.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Aesthetic but sober color palette
    const colors = {
      primary: '#1f2937',      // Dark gray instead of bright blue
      secondary: '#6b7280',    // Medium gray
      accent: '#4f46e5',       // Subtle indigo
      light: '#f9fafb',        // Very light gray background
      white: '#ffffff',
      text: '#374151',         // Dark gray text
      textLight: '#9ca3af',    // Light gray text
      border: '#e5e7eb',       // Light border
      shadow: '#00000015'      // Very subtle shadow
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Clean background with subtle texture
    doc.rect(0, 0, pageWidth, pageHeight)
       .fillColor(colors.light)
       .fill();

    // Blue header area
    doc.rect(0, 0, pageWidth, 120)
       .fillColor(colors.accent)
       .fill();

    // Very subtle top border line
    doc.rect(0, 115, pageWidth, 5)
       .fillColor(colors.accent)
       .fill();

    // Minimal decorative elements - only bottom dots (removed top right dot)
    const dots = [
      { x: 60, y: pageHeight - 60, r: 6, alpha: 0.08 },
      { x: pageWidth - 40, y: pageHeight - 40, r: 4, alpha: 0.12 }
    ];

    dots.forEach(dot => {
      doc.circle(dot.x, dot.y, dot.r)
         .fillColor(`${colors.accent}${Math.round(dot.alpha * 255).toString(16).padStart(2, '0')}`)
         .fill();
    });

    // Logo section with clean design
    let currentY = 40;
    const logoAreaHeight = 100;
    const logoMaxWidth = Math.min(pageWidth - 100, 280);
    const logoMaxHeight = 80;
    
    let hasLogo = false;
    let logoBuffer = null;
    let logoDimensions = { width: 0, height: 0 };

    // Logo processing (same as before but with cleaner styling)
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

    // Draw logo or clean placeholder
    if (hasLogo && logoBuffer) {
      const logoX = (pageWidth - logoDimensions.width) / 2;
      const logoY = currentY + (logoAreaHeight - logoDimensions.height) / 2;
      
      // Clean logo background - minimal shadow
      doc.rect(logoX - 8, logoY - 8, logoDimensions.width + 16, logoDimensions.height + 16)
         .fillColor(colors.shadow)
         .fill();
      
      doc.rect(logoX - 6, logoY - 6, logoDimensions.width + 12, logoDimensions.height + 12)
         .fillColor(colors.white)
         .fill();
      
      doc.image(logoBuffer, logoX, logoY, { 
        width: logoDimensions.width, 
        height: logoDimensions.height
      });
    } else {
      // Clean placeholder design
      const placeholderSize = 70;
      const placeholderX = (pageWidth - placeholderSize) / 2;
      const placeholderY = currentY + (logoAreaHeight - placeholderSize) / 2;
      
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2)
         .fillColor(colors.white)
         .fill();
      
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2 - 6)
         .fillColor(colors.accent)
         .fill();
      
      // Simple gym icon
      doc.fillColor(colors.white)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('GYM', placeholderX + placeholderSize/2 - 18, placeholderY + placeholderSize/2 - 8);
    }

    currentY += logoAreaHeight + 20;

    // Gym name section with clean card design
    const nameCardHeight = 80;
    const nameCardWidth = pageWidth - 60;
    const nameCardX = 30;
    
    // Subtle shadow
    doc.rect(nameCardX + 2, currentY + 2, nameCardWidth, nameCardHeight)
       .fillColor(colors.shadow)
       .fill();
    
    // Clean white card
    doc.rect(nameCardX, currentY, nameCardWidth, nameCardHeight)
       .fillColor(colors.white)
       .fill();
    
    // Minimal accent line - thinner and more subtle
    doc.rect(nameCardX, currentY, nameCardWidth, 3)
       .fillColor(colors.accent)
       .fill();

    // Clean typography
    doc.fillColor(colors.primary)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(gym.name || 'Gym Name', nameCardX + 20, currentY + 20, {
         width: nameCardWidth - 40,
         align: 'center'
       });

    doc.fillColor(colors.textLight)
       .fontSize(14)
       .font('Helvetica')
       .text('Digital Attendance System', nameCardX + 20, currentY + 50, {
         width: nameCardWidth - 40,
         align: 'center'
       });

    currentY += nameCardHeight + 30;

    // QR Code section with clean modern design
    const qrCodeData = `https://web-production-6057.up.railway.app/mark_attendance/${gym.gymCode}?t=${Date.now()}`;
    
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 220,
      color: {
        dark: colors.primary,
        light: colors.white
      }
    });

    const qrSize = 220;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Clean QR container
    const containerPadding = 25;
    const containerSize = qrSize + (containerPadding * 2);
    const containerX = (pageWidth - containerSize) / 2;
    
    // Subtle outer glow
    doc.circle(containerX + containerSize/2, currentY + containerSize/2, containerSize/2 + 12)
       .fillColor(`${colors.accent}08`)
       .fill();
    
    // Clean white container
    doc.rect(containerX, currentY, containerSize, containerSize)
       .fillColor(colors.white)
       .fill();
    
    // Minimal border - very thin and subtle
    doc.rect(containerX, currentY, containerSize, 2)
       .fillColor(colors.accent)
       .fill();
    
    doc.rect(containerX, currentY + containerSize - 2, containerSize, 2)
       .fillColor(colors.accent)
       .fill();
    
    // QR Code
    doc.image(qrCodeBuffer, qrX, currentY + containerPadding, { 
      width: qrSize, 
      height: qrSize
    });

    currentY += containerSize + 25;

    // Clean gym code display
    const codeContainerWidth = 280;
    const codeContainerX = (pageWidth - codeContainerWidth) / 2;
    const codeContainerHeight = 60;
    
    // Clean container
    doc.rect(codeContainerX, currentY, codeContainerWidth, codeContainerHeight)
       .fillColor(colors.primary)
       .fill();
    
    // Subtle highlight
    doc.rect(codeContainerX, currentY, codeContainerWidth, 2)
       .fillColor(colors.accent)
       .fill();

    // Clean typography
    doc.fillColor('#ffffff80')
       .fontSize(12)
       .font('Helvetica')
       .text('GYM CODE', codeContainerX, currentY + 15, {
         width: codeContainerWidth,
         align: 'center'
       });

    doc.fillColor(colors.white)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(gym.gymCode || 'GYM001', codeContainerX, currentY + 32, {
         width: codeContainerWidth,
         align: 'center'
       });

    currentY += codeContainerHeight + 25;

    // Clean instruction text
    doc.fillColor(colors.text)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Scan to Mark Attendance', 50, currentY, {
         width: pageWidth - 100,
         align: 'center'
       });

    currentY += 25;

    doc.fillColor(colors.textLight)
       .fontSize(11)
       .font('Helvetica')
       .text('Point your camera at the QR code above or use any QR scanner app', 50, currentY, {
         width: pageWidth - 100,
         align: 'center'
       });

    // Blue footer
    const footerY = pageHeight - 70;
    
    // Blue footer background
    doc.rect(0, footerY - 5, pageWidth, 75)
       .fillColor(colors.accent)
       .fill();
    
    doc.fillColor(colors.white)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Smart Gym Management System', 50, footerY + 10, {
         width: pageWidth - 100,
         align: 'center'
       });

    doc.fillColor('#ffffff90')
       .fontSize(9)
       .font('Helvetica')
       .text('Streamlining fitness experiences with technology', 50, footerY + 25, {
         width: pageWidth - 100,
         align: 'center'
       });

    // Generation timestamp
    doc.fillColor('#ffffff70')
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