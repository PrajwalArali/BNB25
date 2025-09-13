const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type, targetId, category, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (targetId) filter.targetId = targetId;
    if (category) filter.category = category;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Feedback.countDocuments(filter);
    
    res.json({
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/target/:type/:targetId', async (req, res) => {
  try {
    const { type, targetId } = req.params;
    
    const feedbacks = await Feedback.find({ type, targetId })
      .sort({ createdAt: -1 });
    
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, targetId, targetName, category, rating, comment, user } = req.body;
    

    if (!type || !targetId || !targetName || !category || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Missing required fields: type, targetId, targetName, category, rating, comment' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    const feedback = new Feedback({
      type,
      targetId,
      targetName,
      category,
      rating,
      comment,
      user: user || 'Anonymous User'
    });
    
    const savedFeedback = await feedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    
    if (!voteType || !['up', 'down'].includes(voteType)) {
      return res.status(400).json({ 
        message: 'Vote type must be "up" or "down"' 
      });
    }
    
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    const voteChange = voteType === 'up' ? 1 : -1;
    feedback.votes += voteChange;
    
    const updatedFeedback = await feedback.save();
    res.json(updatedFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, user } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        message: 'Reply text is required' 
      });
    }
    
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    const reply = {
      text: text.trim(),
      user: user || 'Anonymous User',
      timestamp: new Date()
    };
    
    feedback.replies.push(reply);
    const updatedFeedback = await feedback.save();
    
    res.json(updatedFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'resolved', 'archived'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be "active", "resolved", or "archived"' 
      });
    }
    
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    feedback.status = status;
    const updatedFeedback = await feedback.save();
    
    res.json(updatedFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalVotes: { $sum: '$votes' },
          categoryCounts: {
            $push: {
              category: '$category',
              rating: '$rating'
            }
          }
        }
      }
    ]);
    
    
    const categoryStats = {};
    if (stats.length > 0) {
      stats[0].categoryCounts.forEach(item => {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = { count: 0, totalRating: 0 };
        }
        categoryStats[item.category].count++;
        categoryStats[item.category].totalRating += item.rating;
      });
      
    
      Object.keys(categoryStats).forEach(category => {
        categoryStats[category].averageRating = 
          categoryStats[category].totalRating / categoryStats[category].count;
      });
    }
    
    res.json({
      totalFeedbacks: stats[0]?.totalFeedbacks || 0,
      averageRating: stats[0]?.averageRating || 0,
      totalVotes: stats[0]?.totalVotes || 0,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
