const express = require('express');
const MeeraAIBlog = require('../../models/MeeraAIBlog');
const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await MeeraAIBlog.find().sort({ date: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await MeeraAIBlog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blog
router.post('/', async (req, res) => {
  try {
    const blog = new MeeraAIBlog({ 
      ...req.body, 
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update blog
router.put('/:id', async (req, res) => {
  try {
    const blog = await MeeraAIBlog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete blog
router.delete('/:id', async (req, res) => {
  try {
    await MeeraAIBlog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

