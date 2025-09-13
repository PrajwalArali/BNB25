const express = require('express');
const axios = require('axios');
const router = express.Router();

// Hugging Face Inference API endpoint for conversational models
const HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

// Simple context-aware responses for financial ledger queries
const getContextualResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Financial ledger specific responses
  if (lowerMessage.includes('transaction') || lowerMessage.includes('ledger')) {
    return "I can help you with transaction management! You can add new transactions, view transaction history, and analyze your financial data through the various tabs in this application.";
  }
  
  if (lowerMessage.includes('blockchain') || lowerMessage.includes('block')) {
    return "This ledger system uses blockchain-inspired technology for secure transaction recording. Each transaction is cryptographically secured and linked to previous transactions.";
  }
  
  if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
    return "The Budget Tracker tab helps you monitor spending against your allocated budgets. You can set budgets for different categories and track your expenses.";
  }
  
  if (lowerMessage.includes('analytics') || lowerMessage.includes('report')) {
    return "The Analytics Dashboard provides insights into your transaction patterns, spending trends, and financial summaries with interactive charts.";
  }
  
  if (lowerMessage.includes('anomaly') || lowerMessage.includes('unusual')) {
    return "The Anomaly Detection feature identifies unusual spending patterns or transactions that might need your attention.";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I'm here to help you navigate this financial ledger system! You can ask me about transactions, budgets, analytics, blockchain features, or any other aspect of the application.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your AI assistant for this blockchain-based financial ledger system. How can I help you today?";
  }
  
  return null; // Let Hugging Face handle other queries
};

// Chatbot endpoint
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    // First, check for contextual responses
    const contextualResponse = getContextualResponse(message);
    if (contextualResponse) {
      return res.json({
        success: true,
        payload: {
          text: contextualResponse,
          source: 'contextual'
        }
      });
    }

    // For other queries, use Hugging Face API
    try {
      const response = await axios.post(HF_API_URL, {
        inputs: message,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          do_sample: true
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN || 'hf_demo'}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      let botResponse = 'I understand you\'re asking about something. Could you please rephrase your question or ask about transactions, budgets, analytics, or blockchain features?';
      
      if (response.data && response.data.generated_text) {
        botResponse = response.data.generated_text;
      } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        botResponse = response.data[0].generated_text || botResponse;
      }

      res.json({
        success: true,
        payload: {
          text: botResponse,
          source: 'huggingface'
        }
      });

    } catch (hfError) {
      console.log('Hugging Face API error:', hfError.message);
      
      // Fallback response when HF API is not available
      const fallbackResponse = "I'm here to help you with your financial ledger system. You can ask me about transactions, budgets, analytics, blockchain features, or how to use this application.";
      
      res.json({
        success: true,
        payload: {
          text: fallbackResponse,
          source: 'fallback'
        }
      });
    }

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'chatbot',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;