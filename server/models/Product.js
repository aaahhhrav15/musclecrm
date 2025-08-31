const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String, // S3 URL for the product image
    required: true
  },
  overview: {
    type: String,
    default: ''
  },
  keyBenefits: {
    type: [String],
    default: []
  },
  fastFacts: {
    type: String,
    default: ''
  },
  usage: {
    type: String,
    default: ''
  },
  marketedBy: {
    type: String,
    default: ''
  },
  manufacturedBy: {
    type: String,
    default: ''
  },
  disclaimer: {
    type: String,
    default: ''
  },
  storage: {
    type: String,
    default: ''
  },
  shelfLife: {
    type: String,
    default: ''
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  }
}, {
  timestamps: true
});

productSchema.index({ gymId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);


