const express = require('express');
const blockchainService = require('../services/BlockchainService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get entire blockchain
router.get('/chain', (req, res) => {
  try {
    const blockchain = blockchainService.getBlockchain();
    res.json(blockchain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blockchain statistics
router.get('/stats', (req, res) => {
  try {
    const stats = blockchainService.getBlockchain().stats;
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific block by index
router.get('/block/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const block = blockchainService.getBlock(index);
    
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get block by hash
router.get('/block/hash/:hash', (req, res) => {
  try {
    const hash = req.params.hash;
    const block = blockchainService.getBlockByHash(hash);
    
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent blocks
router.get('/blocks/recent', (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    const blockchain = blockchainService.getBlockchain();
    const recentBlocks = blockchain.chain.slice(-count);
    
    res.json(recentBlocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new transaction (Admin only)
router.post('/transaction', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { department, vendor, amount, description } = req.body;
    
    if (!department || !vendor || !amount || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields: department, vendor, amount, description' 
      });
    }
    
    if (amount < 0) {
      return res.status(400).json({ 
        message: 'Amount cannot be negative' 
      });
    }
    
    const transaction = blockchainService.addTransaction({
      department,
      vendor,
      amount,
      description
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get pending transactions
router.get('/transactions/pending', (req, res) => {
  try {
    const blockchain = blockchainService.getBlockchain();
    res.json(blockchain.pendingTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions for a department
router.get('/transactions/department/:department', (req, res) => {
  try {
    const department = req.params.department;
    const transactions = blockchainService.getTransactionsForDepartment(department);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance for a department
router.get('/balance/:department', (req, res) => {
  try {
    const department = req.params.department;
    const balance = blockchainService.getBalance(department);
    res.json({ department, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get mining status
router.get('/mining/status', (req, res) => {
  try {
    const status = blockchainService.getMiningStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Force mine a block (for testing)
router.post('/mining/mine', async (req, res) => {
  try {
    const newBlock = await blockchainService.forceMine();
    res.json(newBlock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Validate blockchain
router.get('/validate', (req, res) => {
  try {
    const isValid = blockchainService.validateChain();
    res.json({ 
      valid: isValid, 
      message: isValid ? 'Blockchain is valid' : 'Blockchain is invalid' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new node to the network
router.post('/nodes/register', (req, res) => {
  try {
    const { nodeUrl } = req.body;
    
    if (!nodeUrl) {
      return res.status(400).json({ message: 'Node URL is required' });
    }
    
    blockchainService.addNode(nodeUrl);
    res.json({ 
      message: 'Node added successfully', 
      nodes: blockchainService.getBlockchain().nodes 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all nodes
router.get('/nodes', (req, res) => {
  try {
    const nodes = blockchainService.getBlockchain().nodes;
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Receive block from another node (for consensus)
router.post('/receive-block', async (req, res) => {
  try {
    const blockData = req.body;
    const success = await blockchainService.receiveBlock(blockData);
    
    if (success) {
      res.json({ message: 'Block received and added to chain' });
    } else {
      res.status(400).json({ message: 'Block rejected' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blockchain explorer data
router.get('/explorer', (req, res) => {
  try {
    const blockchain = blockchainService.getBlockchain();
    const stats = blockchain.stats;
    
    const explorerData = {
      stats,
      recentBlocks: blockchain.chain.slice(-5).map(block => ({
        index: block.index,
        hash: block.hash.substring(0, 16) + '...',
        timestamp: block.timestamp,
        transactionCount: block.transactions.length,
        difficulty: block.difficulty,
        miningTime: block.miningTime
      })),
      pendingTransactions: blockchain.pendingTransactions.length,
      nodes: blockchain.nodes.length,
      isMining: blockchainService.getMiningStatus().isMining
    };
    
    res.json(explorerData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detailed block information
router.get('/block/:index/details', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const block = blockchainService.getBlock(index);
    
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    
    const blockDetails = {
      index: block.index,
      timestamp: block.timestamp,
      hash: block.hash,
      previousHash: block.previousHash,
      nonce: block.nonce,
      difficulty: block.difficulty,
      merkleRoot: block.merkleRoot,
      blockSize: block.blockSize,
      miningTime: block.miningTime,
      transactions: block.transactions.map(tx => ({
        department: tx.department,
        vendor: tx.vendor,
        amount: tx.amount,
        description: tx.description,
        timestamp: tx.timestamp,
        transactionHash: tx.transactionHash.substring(0, 16) + '...'
      }))
    };
    
    res.json(blockDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
