const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: String,
  content: String,
  excerpt: String,
  author: {
    id: String,
    name: String,
  },
  category: String,
  image: String,
  date: String,
  tags: [String],
  slug: { type: String, unique: true },
});

module.exports = mongoose.model('MeeraAIBlog', BlogSchema);

