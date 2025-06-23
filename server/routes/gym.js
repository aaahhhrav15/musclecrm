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

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 }); // Set full permissions
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

    // Check if gym with same name already exists
    const existingGym = await Gym.findOne({ name });
    if (existingGym) {
      return res.status(400).json({ success: false, message: 'Gym with this name already exists' });
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

    res.status(201).json({
      success: true,
      gym,
      message: 'Gym registered successfully'
    });
  } catch (error) {
    console.error('Gym registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering gym' });
  }
});

// Apply both auth and gymAuth middleware to all routes below
router.use(auth);
router.use(gymAuth);

// Get gym information
router.get('/info', async (req, res) => {
  try {
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Convert the gym object to a plain object
    const gymData = gym.toObject();

    // Do NOT modify gymData.logo; return as-is (Base64 string or null)

    res.json({ success: true, gym: gymData });
  } catch (error) {
    console.error('Error fetching gym info:', error);
    res.status(500).json({ success: false, message: 'Error fetching gym information' });
  }
});

// Update gym information
router.put('/info', async (req, res) => {
  try {
    // First find the gym
    const gym = await Gym.findById(req.gymId);
    
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Update the fields
    if (req.body.name) gym.name = req.body.name;
    if (req.body.contactInfo) {
      gym.contactInfo = {
        ...gym.contactInfo,
        ...req.body.contactInfo
      };
    }
    if (req.body.address) {
      gym.address = {
        ...gym.address,
        ...req.body.address
      };
    }

    // Save the gym to trigger the pre-save middleware
    await gym.save();
    
    res.json({ success: true, gym });
  } catch (error) {
    console.error('Error updating gym info:', error);
    res.status(500).json({ success: false, message: 'Error updating gym information' });
  }
});

// Upload gym logo
router.put('/logo', auth, gymAuth, upload.single('logo'), async (req, res) => {
  try {
    console.log('Received logo upload request');
    console.log('Gym ID from auth:', req.gymId);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Enforce 5MB size limit
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({ message: 'Logo file size exceeds 5MB limit' });
    }

    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      console.log('Gym not found:', req.gymId);
      return res.status(404).json({ message: 'Gym not found' });
    }

    // Convert file buffer to Base64 string with MIME type
    const base64Logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update gym with new logo (Base64 string)
    gym.logo = base64Logo;
    await gym.save();
    console.log('Gym updated with new logo (Base64)');

    res.json({ 
      message: 'Logo uploaded successfully', 
      logo: base64Logo 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ 
      message: 'Error uploading logo', 
      error: error.message 
    });
  }
});

// Delete gym logo
router.delete('/logo', auth, gymAuth, async (req, res) => {
  try {
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }

    // Remove logo from gym (set to null)
    gym.logo = null;
    await gym.save();

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Error deleting logo', error: error.message });
  }
});

// Generate PDF route - Visually Appealing Single Page Design
router.get('/generate-pdf', auth, gymAuth, async (req, res) => {
  try {
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=gym-attendance-qr.pdf');

    // Pipe the PDF to the response
    doc.pipe(res);

    // Define vibrant color palette
    const colors = {
      primary: '#1e293b',      // Slate 800
      secondary: '#475569',    // Slate 600
      accent: '#3b82f6',       // Blue 500
      accent2: '#06b6d4',      // Cyan 500
      light: '#f1f5f9',        // Slate 100
      white: '#ffffff',
      text: '#334155',         // Slate 700
      textLight: '#64748b',    // Slate 500
      border: '#cbd5e1',       // Slate 300
      gradient1: '#3b82f6',    // Blue 500
      gradient2: '#1d4ed8',    // Blue 700
      shadow: '#0f172a20'      // Translucent dark
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // === BACKGROUND DESIGN ===
    // Main background
    doc.rect(0, 0, pageWidth, pageHeight)
       .fillColor(colors.light)
       .fill();

    // Decorative elements
    // Top wave-like shape
    doc.moveTo(0, 0)
       .lineTo(pageWidth, 0)
       .lineTo(pageWidth, 120)
       .quadraticCurveTo(pageWidth/2, 80, 0, 120)
       .closePath()
       .fillColor(colors.gradient1)
       .fill();

    // Bottom decorative shape
    doc.moveTo(0, pageHeight - 80)
       .quadraticCurveTo(pageWidth/2, pageHeight - 120, pageWidth, pageHeight - 80)
       .lineTo(pageWidth, pageHeight)
       .lineTo(0, pageHeight)
       .closePath()
       .fillColor(colors.gradient2)
       .fill();

    // Floating circles for visual interest
    doc.circle(pageWidth - 60, 60, 25)
       .fillColor('#ffffff20')
       .fill();
    
    doc.circle(50, pageHeight - 50, 20)
       .fillColor('#ffffff15')
       .fill();

    doc.circle(pageWidth - 30, pageHeight - 30, 15)
       .fillColor('#ffffff25')
       .fill();

    // === LOGO SECTION ===
    let currentY = 40;
    const logoAreaHeight = 100;
    const logoMaxWidth = pageWidth - 80;
    const logoMaxHeight = 80;
    
    let hasLogo = false;
    let logoBuffer = null;
    let logoDimensions = { width: 0, height: 0 };

    // Process logo if available
    if (gym.logo && typeof gym.logo === 'string' && gym.logo.startsWith('data:image/')) {
      try {
        // Extract base64 data from data URL
        const base64Data = gym.logo.split(',')[1];
        logoBuffer = Buffer.from(base64Data, 'base64');
        // Use sharp to get dimensions
        const metadata = await sharp(logoBuffer).metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;
        const aspectRatio = originalWidth / originalHeight;
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
        // Resize logo buffer for PDF
        logoBuffer = await sharp(logoBuffer)
          .png()
          .resize(Math.round(logoDimensions.width), Math.round(logoDimensions.height), {
            fit: 'inside',
            withoutEnlargement: true
          })
          .toBuffer();
        hasLogo = true;
      } catch (error) {
        console.error('Error processing base64 logo:', error);
        hasLogo = false;
      }
    }

    // Draw logo or elegant placeholder
    if (hasLogo && logoBuffer) {
      const logoX = (pageWidth - logoDimensions.width) / 2;
      const logoY = currentY + (logoAreaHeight - logoDimensions.height) / 2;
      
      // Logo background with soft shadow
      doc.rect(logoX - 10, logoY - 10, logoDimensions.width + 20, logoDimensions.height + 20)
         .fillColor(colors.shadow)
         .fill();
      
      doc.rect(logoX - 8, logoY - 8, logoDimensions.width + 16, logoDimensions.height + 16)
         .fillColor(colors.white)
         .fill();
      
      doc.image(logoBuffer, logoX, logoY, { 
        width: logoDimensions.width, 
        height: logoDimensions.height
      });
    } else {
      // Stylish placeholder
      const placeholderSize = 70;
      const placeholderX = (pageWidth - placeholderSize) / 2;
      const placeholderY = currentY + (logoAreaHeight - placeholderSize) / 2;
      
      // Gradient background
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2)
         .fillColor(colors.white)
         .fill();
      
      doc.circle(placeholderX + placeholderSize/2, placeholderY + placeholderSize/2, placeholderSize/2 - 5)
         .fillColor(colors.accent)
         .fill();
      
      // Icon
      doc.fillColor(colors.white)
         .fontSize(26)
         .font('Helvetica-Bold')
         .text('GYM', placeholderX + placeholderSize/2 - 20, placeholderY + placeholderSize/2 - 10);
    }

    currentY += logoAreaHeight + 20;

    // === GYM NAME WITH STYLE ===
    // Background card for gym name
    const nameCardHeight = 80;
    const nameCardWidth = pageWidth - 60;
    const nameCardX = 30;
    
    // Card shadow
    doc.rect(nameCardX + 3, currentY + 3, nameCardWidth, nameCardHeight)
       .fillColor(colors.shadow)
       .fill();
    
    // Main card
    doc.rect(nameCardX, currentY, nameCardWidth, nameCardHeight)
       .fillColor(colors.white)
       .fill();
    
    // Accent line
    doc.rect(nameCardX, currentY, nameCardWidth, 4)
       .fillColor(colors.accent)
       .fill();

    doc.fillColor(colors.primary)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(gym.name, nameCardX + 20, currentY + 25, {
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

    // === QR CODE SECTION WITH MODERN DESIGN ===
    const qrCodeData = `https://web-production-6057.up.railway.app/mark_attendance/${gym.gymCode}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: colors.primary,
        light: colors.white
      }
    });

    const qrSize = 200;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Modern QR container with gradient border
    const containerPadding = 25;
    const containerSize = qrSize + (containerPadding * 2);
    const containerX = (pageWidth - containerSize) / 2;
    
    // Outer glow
    doc.circle(containerX + containerSize/2, currentY + containerSize/2, containerSize/2 + 15)
       .fillColor('#3b82f620')
       .fill();
    
    // Main container
    doc.rect(containerX, currentY, containerSize, containerSize)
       .fillColor(colors.white)
       .fill();
    
    // Gradient border effect
    doc.rect(containerX, currentY, containerSize, 3)
       .fillColor(colors.accent)
       .fill();
    
    doc.rect(containerX, currentY + containerSize - 3, containerSize, 3)
       .fillColor(colors.accent2)
       .fill();
    
    // QR Code
    doc.image(qrCodeBuffer, qrX, currentY + containerPadding, { 
      width: qrSize, 
      height: qrSize
    });

    currentY += containerSize + 25;

    // === STYLISH GYM CODE DISPLAY ===
    const codeContainerWidth = 280;
    const codeContainerX = (pageWidth - codeContainerWidth) / 2;
    const codeContainerHeight = 55;
    
    // Gradient background
    doc.rect(codeContainerX, currentY, codeContainerWidth, codeContainerHeight)
       .fillColor(colors.primary)
       .fill();
    
    // Highlight effect
    doc.rect(codeContainerX, currentY, codeContainerWidth, 2)
       .fillColor(colors.accent2)
       .fill();

    // Code text
    doc.fillColor('#ffffff80')
       .fontSize(12)
       .font('Helvetica')
       .text('Gym Code', codeContainerX, currentY + 12, {
         width: codeContainerWidth,
         align: 'center'
       });

    doc.fillColor(colors.white)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(gym.gymCode, codeContainerX, currentY + 28, {
         width: codeContainerWidth,
         align: 'center'
       });

    currentY += codeContainerHeight + 20;

    // === SCAN INSTRUCTION ===
    doc.fillColor(colors.text)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Scan to Mark Attendance', 40, currentY, {
         width: pageWidth - 80,
         align: 'center'
       });

    // === FOOTER WITH MODERN TOUCH ===
    const footerY = pageHeight - 60;
    
    doc.fillColor('#ffffff80')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Smart Gym Management System', 40, footerY + 10, {
         width: pageWidth - 80,
         align: 'center'
       });

    doc.fillColor('#ffffff60')
       .fontSize(9)
       .font('Helvetica')
       .text('Streamlining fitness experiences with technology', 40, footerY + 25, {
         width: pageWidth - 80,
         align: 'center'
       });

    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

module.exports = router;