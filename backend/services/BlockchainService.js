const Blockchain = require('../models/Blockchain');
const Block = require('../models/Block');
const axios = require('axios');

class BlockchainService {
  constructor() {
    this.blockchain = new Blockchain();
    this.nodeUrl = process.env.NODE_URL || `http://localhost:${process.env.PORT || 5000}`;
    this.isMining = false;
    this.miningInterval = null;
    this.consensusInterval = null;
    this.initializeBlockchain();
  }

  // Initialize blockchain with genesis block if empty
  async initializeBlockchain() {
    try {
      // Check if blockchain exists in database
      const existingBlocks = await Block.find().sort({ index: 1 });
      
      if (existingBlocks.length === 0) {
        console.log('Initializing blockchain with genesis block...');
        const genesisBlock = this.blockchain.createGenesisBlock();
        await this.saveBlockToDatabase(genesisBlock);
        this.blockchain.chain = [genesisBlock];
      } else {
        console.log('Loading existing blockchain from database...');
        this.blockchain.chain = existingBlocks;
        console.log(`Loaded ${existingBlocks.length} blocks from database`);
      }

      // Start mining process
      this.startMining();
      
      // Start consensus process
      this.startConsensus();

      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Error initializing blockchain:', error);
    }
  }

  // Save block to database
  async saveBlockToDatabase(block) {
    try {
      const blockData = {
        index: block.index,
        timestamp: block.timestamp,
        transactions: block.transactions,
        hash: block.hash,
        previousHash: block.previousHash,
        nonce: block.nonce,
        difficulty: block.difficulty,
        merkleRoot: block.merkleRoot,
        blockSize: block.blockSize,
        miningTime: block.miningTime
      };

      const savedBlock = new Block(blockData);
      await savedBlock.save();
      console.log(`Block ${block.index} saved to database`);
    } catch (error) {
      console.error('Error saving block to database:', error);
      throw error;
    }
  }

  // Add transaction to pending pool
  addTransaction(transactionData) {
    try {
      const transaction = this.blockchain.addTransaction(transactionData);
      console.log(`Transaction added: ${transaction.transactionHash}`);
      return transaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  // Start mining process
  startMining() {
    if (this.isMining) return;

    this.isMining = true;
    console.log('Starting mining process...');

    this.miningInterval = setInterval(async () => {
      if (this.blockchain.pendingTransactions.length > 0) {
        try {
          console.log(`Mining ${this.blockchain.pendingTransactions.length} pending transactions...`);
          const newBlock = await this.blockchain.minePendingTransactions('node-' + this.nodeUrl);
          
          if (newBlock) {
            await this.saveBlockToDatabase(newBlock);
            console.log(`Block ${newBlock.index} mined and saved`);
            
            // Broadcast new block to other nodes
            await this.broadcastNewBlock(newBlock);
          }
        } catch (error) {
          console.error('Error during mining:', error);
        }
      }
    }, 5000); // Mine every 5 seconds if there are pending transactions
  }

  // Stop mining process
  stopMining() {
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
    this.isMining = false;
    console.log('Mining process stopped');
  }

  // Start consensus process
  startConsensus() {
    this.consensusInterval = setInterval(async () => {
      await this.resolveConflicts();
    }, 30000); // Run consensus every 30 seconds
  }

  // Stop consensus process
  stopConsensus() {
    if (this.consensusInterval) {
      clearInterval(this.consensusInterval);
      this.consensusInterval = null;
    }
  }

  // Broadcast new block to other nodes
  async broadcastNewBlock(block) {
    const blockData = {
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      hash: block.hash,
      previousHash: block.previousHash,
      nonce: block.nonce,
      difficulty: block.difficulty,
      merkleRoot: block.merkleRoot,
      blockSize: block.blockSize,
      miningTime: block.miningTime
    };

    const promises = this.blockchain.getNodes().map(async (nodeUrl) => {
      try {
        await axios.post(`${nodeUrl}/api/blockchain/receive-block`, blockData);
        console.log(`Block broadcasted to ${nodeUrl}`);
      } catch (error) {
        console.log(`Failed to broadcast to ${nodeUrl}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
  }

  // Receive block from another node
  async receiveBlock(blockData) {
    try {
      // Create a temporary block object for validation
      const block = {
        index: blockData.index,
        timestamp: blockData.timestamp,
        transactions: blockData.transactions,
        hash: blockData.hash,
        previousHash: blockData.previousHash,
        nonce: blockData.nonce,
        difficulty: blockData.difficulty,
        merkleRoot: blockData.merkleRoot,
        blockSize: blockData.blockSize,
        miningTime: blockData.miningTime,
        isValid: function() {
          // Basic validation
          if (!this.hash || !this.previousHash || !this.transactions) {
            return false;
          }
          return true;
        }
      };
      
      // Validate the block
      if (!block.isValid()) {
        console.log('Received invalid block');
        return false;
      }

      // Check if block already exists
      const existingBlock = await Block.findOne({ hash: block.hash });
      if (existingBlock) {
        console.log('Block already exists');
        return false;
      }

      // Check if it's the next block in sequence
      const latestBlock = this.blockchain.getLatestBlock();
      if (block.index !== latestBlock.index + 1) {
        console.log('Block index mismatch');
        return false;
      }

      if (block.previousHash !== latestBlock.hash) {
        console.log('Block previous hash mismatch');
        return false;
      }

      // Add block to chain
      this.blockchain.chain.push(blockData);
      await this.saveBlockToDatabase(blockData);
      
      console.log(`Block ${block.index} received and added to chain`);
      return true;
    } catch (error) {
      console.error('Error receiving block:', error);
      return false;
    }
  }

  // Resolve conflicts with other nodes
  async resolveConflicts() {
    const promises = this.blockchain.getNodes().map(async (nodeUrl) => {
      try {
        const response = await axios.get(`${nodeUrl}/api/blockchain/chain`);
        return response.data;
      } catch (error) {
        console.log(`Failed to get chain from ${nodeUrl}:`, error.message);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    const validChains = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (validChains.length === 0) return;

    // Find the longest valid chain
    let maxLength = this.blockchain.chain.length;
    let newChain = null;

    for (let chain of validChains) {
      if (chain.length > maxLength && this.blockchain.isValidChain(chain)) {
        maxLength = chain.length;
        newChain = chain;
      }
    }

    // Replace our chain if we found a longer valid one
    if (newChain) {
      console.log(`Replacing chain: ${this.blockchain.chain.length} -> ${newChain.length}`);
      this.blockchain.chain = newChain;
      
    
      await Block.deleteMany({});
      for (let blockData of newChain) {
        const block = new Block(blockData);
        await block.save();
      }
    }
  }


  addNode(nodeUrl) {
    this.blockchain.addNode(nodeUrl);
  }

  
  getBlockchain() {
    return {
      chain: this.blockchain.chain,
      pendingTransactions: this.blockchain.pendingTransactions,
      stats: this.blockchain.getStats(),
      nodes: this.blockchain.getNodes(),
      isMining: this.isMining
    };
  }

  
  getBlock(index) {
    return this.blockchain.getBlock(index);
  }

 
  getBlockByHash(hash) {
    return this.blockchain.getBlockByHash(hash);
  }


  getTransactionsForDepartment(department) {
    return this.blockchain.getTransactionsForDepartment(department);
  }


  getBalance(department) {
    return this.blockchain.getBalance(department);
  }


  validateChain() {
    return this.blockchain.isChainValid();
  }

  
  getMiningStatus() {
    return {
      isMining: this.isMining,
      pendingTransactions: this.blockchain.pendingTransactions.length,
      difficulty: this.blockchain.difficulty,
      latestBlock: this.blockchain.getLatestBlock()
    };
  }

 
  async forceMine() {
    if (this.blockchain.pendingTransactions.length === 0) {
      throw new Error('No pending transactions to mine');
    }

    const newBlock = await this.blockchain.minePendingTransactions('manual-miner');
    await this.saveBlockToDatabase(newBlock);
    await this.broadcastNewBlock(newBlock);
    
    return newBlock;
  }


  shutdown() {
    this.stopMining();
    this.stopConsensus();
    console.log('Blockchain service shutdown');
  }
}


const blockchainService = new BlockchainService();

module.exports = blockchainService;
