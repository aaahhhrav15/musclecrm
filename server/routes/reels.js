const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const s3Service = require('../services/s3Service');
const Reel = require('../models/Reel');

// Multer config for video uploads (max 200MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
    if (allowed.includes(file.mimetype.toLowerCase())) return cb(null, true);
    return cb(new Error('Invalid file type. Only MP4, MOV, WEBM, MKV videos are allowed.'), false);
  }
});

// Create/upload a reel
router.post('/', auth, upload.single('reel'), async (req, res) => {
  try {
    const { caption = '' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Reel video file is required' });
    }
    if (!req.user?.gymId) {
      return res.status(400).json({ success: false, message: 'User is not associated with a gym' });
    }

    const uploadResult = await s3Service.uploadVideo(req.file.buffer, req.file.originalname, 'reels');

    const reel = await Reel.create({
      caption,
      s3Key: uploadResult.key,
      gymId: req.user.gymId
    });

    return res.status(201).json({ success: true, data: reel });
  } catch (error) {
    console.error('Error creating reel:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// List reels for current gym (treat gymId as uploader scope)
router.get('/mine', auth, async (req, res) => {
  try {
    const reels = await Reel.find({ gymId: req.user.gymId })
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: reels });
  } catch (error) {
    console.error('Error fetching reels:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List all reels in my gym (optional filter by customerId)
router.get('/', auth, async (req, res) => {
  try {
    const reels = await Reel.find({ gymId: req.user.gymId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: reels });
  } catch (error) {
    console.error('Error fetching reels:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

// Delete a reel (and its S3 object)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid reel id' });
    }
    const reel = await Reel.findOne({ _id: id, gymId: req.user.gymId });
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }
    // delete from S3 (best-effort)
    await s3Service.deleteImage(reel.s3Key).catch(() => {});
    await Reel.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reel:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


