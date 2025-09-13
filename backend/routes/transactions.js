const express = require('express');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const router = express.Router();


const computeHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};


router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: 1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const { department, vendor, amount, description } = req.body;
    
    
    const previousTransaction = await Transaction.findOne().sort({ date: -1 });
    const previousHash = previousTransaction ? previousTransaction.hash : '0';
    
    
    const transactionData = `${department}${vendor}${amount}${description}${Date.now()}${previousHash}`;
    const hash = computeHash(transactionData);
    
    
    const newTransaction = new Transaction({
      department,
      vendor,
      amount,
      description,
      previousHash,
      hash
    });
    
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.get('/validate', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: 1 });
    
    if (transactions.length === 0) {
      return res.json({ valid: true, message: 'Ledger is empty' });
    }
    
    
    if (transactions[0].previousHash !== '0') {
      return res.json({ 
        valid: false, 
        message: 'Genesis block has invalid previous hash' 
      });
    }
    
    
    for (let i = 1; i < transactions.length; i++) {
      const currentTx = transactions[i];
      const previousTx = transactions[i - 1];
      
      
      if (currentTx.previousHash !== previousTx.hash) {
        return res.json({ 
          valid: false, 
          message: `Hash mismatch at transaction ${i + 1}` 
        });
      }
      
      
      const transactionData = `${currentTx.department}${currentTx.vendor}${currentTx.amount}${currentTx.description}${currentTx.date}${currentTx.previousHash}`;
      const recomputedHash = computeHash(transactionData);
      
      if (recomputedHash !== currentTx.hash) {
        return res.json({ 
          valid: false, 
          message: `Invalid hash at transaction ${i + 1}` 
        });
      }
    }
    
    res.json({ valid: true, message: 'Ledger is valid' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;