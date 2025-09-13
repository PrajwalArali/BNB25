const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['budget', 'transaction', 'general']
  },
  targetId: {
    type: String,
    required: true
  },
  targetName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['suggestion', 'issue', 'praise', 'question']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  user: {
    type: String,
    default: 'Anonymous User'
  },
  votes: {
    type: Number,
    default: 0
  },
  replies: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    user: {
      type: String,
      default: 'Anonymous User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

feedbackSchema.index({ type: 1, targetId: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
