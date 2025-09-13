require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const blockchainRoutes = require('./routes/blockchain');
const feedbackRoutes = require('./routes/feedback');
const chatbotRoutes = require('./routes/chatbot');
const { authenticateToken } = require('./middleware/auth');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/blockchain', blockchainRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chatbot', chatbotRoutes);


// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blockchain-based Financial Ledger API',
    version: '2.0.0',
    features: ['Proof of Work', 'Distributed Consensus', 'Merkle Trees', 'Mining']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});