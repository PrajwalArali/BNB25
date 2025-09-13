import React, { useState, useEffect } from 'react';
import { 
  LightbulbOutlined, 
  BugReportOutlined, 
  ThumbUpOutlined, 
  HelpOutlineOutlined, 
  ChatBubbleOutlineOutlined,
  VisibilityOutlined,
  Star,
  ThumbDownOutlined,
  Close
} from '@mui/icons-material';
//import axios from 'axios';

const CommunityFeedback = ({ transactions, budgets }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({
    type: 'budget',
    targetId: '',
    targetName: '',
    comment: '',
    rating: 5,
    category: 'suggestion'
  });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load existing feedbacks (in a real app, this would come from an API)
  useEffect(() => {
    // Simulate loading feedbacks from localStorage for demo
    const savedFeedbacks = localStorage.getItem('communityFeedbacks');
    if (savedFeedbacks) {
      setFeedbacks(JSON.parse(savedFeedbacks));
    }
  }, []);

  const saveFeedbacks = (updatedFeedbacks) => {
    localStorage.setItem('communityFeedbacks', JSON.stringify(updatedFeedbacks));
    setFeedbacks(updatedFeedbacks);
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    
    if (!newFeedback.comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    const feedback = {
      id: Date.now().toString(),
      ...newFeedback,
      timestamp: new Date().toISOString(),
      user: 'Anonymous User', 
      votes: 0,
      replies: []
    };

    const updatedFeedbacks = [feedback, ...feedbacks];
    saveFeedbacks(updatedFeedbacks);
    
   
    setNewFeedback({
      type: 'budget',
      targetId: '',
      targetName: '',
      comment: '',
      rating: 5,
      category: 'suggestion'
    });
    setShowFeedbackForm(false);
    setSelectedItem(null);
    
    alert('Thank you for your feedback!');
  };

  const handleVote = (feedbackId, voteType) => {
    const updatedFeedbacks = feedbacks.map(feedback => {
      if (feedback.id === feedbackId) {
        return {
          ...feedback,
          votes: feedback.votes + (voteType === 'up' ? 1 : -1)
        };
      }
      return feedback;
    });
    saveFeedbacks(updatedFeedbacks);
  };

  const handleReply = (feedbackId, replyText) => {
    if (!replyText.trim()) return;

    const reply = {
      id: Date.now().toString(),
      text: replyText,
      user: 'Anonymous User',
      timestamp: new Date().toISOString()
    };

    const updatedFeedbacks = feedbacks.map(feedback => {
      if (feedback.id === feedbackId) {
        return {
          ...feedback,
          replies: [...feedback.replies, reply]
        };
      }
      return feedback;
    });
    saveFeedbacks(updatedFeedbacks);
  };

  const openFeedbackForm = (type, targetId, targetName) => {
    setNewFeedback({
      type,
      targetId,
      targetName,
      comment: '',
      rating: 5,
      category: 'suggestion'
    });
    setSelectedItem({ type, targetId, targetName });
    setShowFeedbackForm(true);
  };

  const getFeedbackForItem = (type, targetId) => {
    return feedbacks.filter(f => f.type === type && f.targetId === targetId);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'suggestion': return <LightbulbOutlined />;
      case 'issue': return <BugReportOutlined />;
      case 'praise': return <ThumbUpOutlined />;
      case 'question': return <HelpOutlineOutlined />;
      default: return <ChatBubbleOutlineOutlined />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'suggestion': return '#3498db';
      case 'issue': return '#e74c3c';
      case 'praise': return '#27ae60';
      case 'question': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="community-feedback">
      <div className="feedback-header">
        <h2><ChatBubbleOutlineOutlined /> Community Feedback System</h2>
        <p>Share your thoughts and suggestions on budget items and transactions</p>
      </div>

      {/* Budget Items with Feedback Buttons */}
      <div className="feedback-targets">
        <h3>Budget Items</h3>
        <div className="budget-feedback-grid">
          {Object.entries(budgets).map(([department, budget]) => {
            const itemFeedbacks = getFeedbackForItem('budget', department);
            return (
              <div key={department} className="feedback-target-card">
                <div className="target-info">
                  <h4>{department}</h4>
                  <p>Budget: ${budget.toLocaleString()}</p>
                  <span className="feedback-count">
                    {itemFeedbacks.length} feedback{itemFeedbacks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="feedback-actions">
                  <button 
                    className="feedback-btn"
                    onClick={() => openFeedbackForm('budget', department, department)}
                  >
                    <ChatBubbleOutlineOutlined /> Leave Feedback
                  </button>
                  {itemFeedbacks.length > 0 && (
                    <button 
                      className="view-feedback-btn"
                      onClick={() => {
                        const element = document.getElementById(`feedback-${department}`);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <VisibilityOutlined /> View ({itemFeedbacks.length})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions with Feedback */}
      <div className="transaction-feedback">
        <h3>Recent Transactions</h3>
        <div className="transaction-feedback-list">
          {transactions.slice(0, 5).map(transaction => {
            const itemFeedbacks = getFeedbackForItem('transaction', transaction._id);
            return (
              <div key={transaction._id} className="transaction-feedback-item">
                <div className="transaction-info">
                  <span className="tx-department">{transaction.department}</span>
                  <span className="tx-vendor">{transaction.vendor}</span>
                  <span className="tx-amount">${transaction.amount.toLocaleString()}</span>
                </div>
                <div className="transaction-feedback-actions">
                  <button 
                    className="feedback-btn small"
                    onClick={() => openFeedbackForm('transaction', transaction._id, `${transaction.department} - ${transaction.vendor}`)}
                  >
                    <ChatBubbleOutlineOutlined />
                  </button>
                  {itemFeedbacks.length > 0 && (
                    <span className="feedback-indicator">
                      {itemFeedbacks.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="feedback-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Leave Feedback</h3>
              <button 
                className="close-btn"
                onClick={() => setShowFeedbackForm(false)}
              >
                <Close />
              </button>
            </div>
            
            <form onSubmit={handleSubmitFeedback}>
              <div className="form-group">
                <label>Target: {selectedItem?.targetName}</label>
              </div>
              
              <div className="form-group">
                <label>Category:</label>
                <select
                  value={newFeedback.category}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="suggestion">Suggestion</option>
                  <option value="issue">Issue</option>
                  <option value="praise">Praise</option>
                  <option value="question">Question</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rating (1-5):</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= newFeedback.rating ? 'active' : ''}`}
                      onClick={() => setNewFeedback(prev => ({ ...prev, rating: star }))}
                    >
                      <Star />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Comment:</label>
                <textarea
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowFeedbackForm(false)}>
                  Cancel
                </button>
                <button type="submit">Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Feedbacks Display */}
      <div className="all-feedbacks">
        <h3>Community Feedbacks ({feedbacks.length})</h3>
        {feedbacks.length === 0 ? (
          <p className="no-feedback">No feedback yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="feedbacks-list">
            {feedbacks.map(feedback => (
              <div key={feedback.id} className="feedback-card" id={`feedback-${feedback.targetId}`}>
                <div className="feedback-header">
                  <div className="feedback-meta">
                    <span 
                      className="category-badge"
                      style={{ backgroundColor: getCategoryColor(feedback.category) }}
                    >
                      {getCategoryIcon(feedback.category)} {feedback.category}
                    </span>
                    <span className="feedback-target">
                      {feedback.type}: {feedback.targetName}
                    </span>
                    <span className="feedback-time">
                      {new Date(feedback.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="feedback-rating">
                    {Array(feedback.rating).fill(0).map((_, i) => <Star key={i} />)}
                  </div>
                </div>
                
                <div className="feedback-content">
                  <p>{feedback.comment}</p>
                </div>

                <div className="feedback-actions">
                  <div className="vote-buttons">
                    <button 
                      className="vote-btn up"
                      onClick={() => handleVote(feedback.id, 'up')}
                    >
                      <ThumbUpOutlined /> {feedback.votes > 0 ? feedback.votes : ''}
                    </button>
                    <button 
                      className="vote-btn down"
                      onClick={() => handleVote(feedback.id, 'down')}
                    >
                      <ThumbDownOutlined /> {feedback.votes < 0 ? Math.abs(feedback.votes) : ''}
                    </button>
                  </div>
                  <span className="feedback-user">by {feedback.user}</span>
                </div>

                {/* Replies */}
                {feedback.replies.length > 0 && (
                  <div className="feedback-replies">
                    <h5>Replies ({feedback.replies.length})</h5>
                    {feedback.replies.map(reply => (
                      <div key={reply.id} className="reply">
                        <p>{reply.text}</p>
                        <span className="reply-meta">
                          by {reply.user} • {new Date(reply.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Reply */}
                <div className="add-reply">
                  <input
                    type="text"
                    placeholder="Add a reply..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleReply(feedback.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityFeedback;
