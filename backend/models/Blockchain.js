const crypto = require('crypto');

class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 2; 
    this.pendingTransactions = [];
    this.miningReward = 100; 
    this.blockSize = 10; 
    this.nodes = new Set();
    this.consensusThreshold = 0.51;
  }

  createGenesisBlock() {
    const genesisTransaction = {
      department: 'Genesis',
      vendor: 'System',
      amount: 0,
      description: 'Genesis block - initial blockchain state',
      timestamp: new Date(),
      transactionHash: crypto.createHash('sha256').update('genesis').digest('hex')
    };

    const genesisBlock = {
      index: 0,
      timestamp: new Date(),
      transactions: [genesisTransaction],
      previousHash: '0',
      nonce: 0,
      difficulty: this.difficulty,
      blockSize: 1,
      miningTime: 0
    };

    genesisBlock.merkleRoot = this.calculateMerkleRoot(genesisBlock.transactions);
    genesisBlock.hash = this.calculateBlockHash(genesisBlock);

    return genesisBlock;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

 
  addTransaction(transaction) {

    if (!transaction.department || !transaction.vendor || !transaction.amount || !transaction.description) {
      throw new Error('Invalid transaction: missing required fields');
    }

    if (transaction.amount < 0) {
      throw new Error('Invalid transaction: amount cannot be negative');
    }

   
    transaction.transactionHash = this.calculateTransactionHash(transaction);
    transaction.timestamp = new Date();

    this.pendingTransactions.push(transaction);
    console.log(`Transaction added to pending pool: ${transaction.transactionHash}`);
    
    return transaction;
  }

  
  calculateTransactionHash(transaction) {
    const data = transaction.department + transaction.vendor + transaction.amount + 
                 transaction.description;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  
  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) {
      return crypto.createHash('sha256').update('').digest('hex');
    }
    
    let hashes = transactions.map(tx => tx.transactionHash);
    
    while (hashes.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        const combined = left + right;
        nextLevel.push(crypto.createHash('sha256').update(combined).digest('hex'));
      }
      hashes = nextLevel;
    }
    
    return hashes[0];
  }

  calculateBlockHash(block) {
    const data = block.index + block.previousHash + block.timestamp + 
                 JSON.stringify(block.transactions) + block.nonce + block.merkleRoot;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async minePendingTransactions(miningRewardAddress = 'miner') {
    if (this.pendingTransactions.length === 0) {
      console.log('No pending transactions to mine');
      return null;
    }

    const rewardTransaction = {
      department: 'Mining',
      vendor: miningRewardAddress,
      amount: this.miningReward,
      description: `Mining reward for block ${this.chain.length}`,
      timestamp: new Date()
    };
    rewardTransaction.transactionHash = this.calculateTransactionHash(rewardTransaction);


    const transactionsToMine = this.pendingTransactions.splice(0, this.blockSize);
    transactionsToMine.unshift(rewardTransaction); 

   
    const newBlock = {
      index: this.chain.length,
      timestamp: new Date(),
      transactions: transactionsToMine,
      previousHash: this.getLatestBlock().hash,
      nonce: 0,
      difficulty: this.difficulty,
      blockSize: transactionsToMine.length
    };


    this.mineBlock(newBlock);

    this.chain.push(newBlock);
    
    console.log(`Block ${newBlock.index} added to blockchain`);
    console.log(`Mining reward: ${this.miningReward} to ${miningRewardAddress}`);
    
    
    this.adjustDifficulty(newBlock);

    return newBlock;
  }


  mineBlock(block) {
    const startTime = Date.now();
    block.merkleRoot = this.calculateMerkleRoot(block.transactions);
    block.hash = this.calculateBlockHash(block);
    
    const target = Array(block.difficulty + 1).join("0");
    
    console.log(`Mining block ${block.index} with difficulty ${block.difficulty}...`);
    
    while (block.hash.substring(0, block.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateBlockHash(block);
      
      
      if (block.nonce > 1000000) {
        console.log('Mining timeout - using current hash');
        break;
      }
    }
    
    block.miningTime = Date.now() - startTime;
    console.log(`Block ${block.index} mined: ${block.hash} (${block.miningTime}ms, nonce: ${block.nonce})`);
    
    return block.hash;
  }

  
  adjustDifficulty(block) {
    const targetMiningTime = 10000; // 10 seconds target
    const actualMiningTime = block.miningTime;

    if (actualMiningTime < targetMiningTime / 2) {
      this.difficulty++;
      console.log(`Difficulty increased to ${this.difficulty}`);
    } else if (actualMiningTime > targetMiningTime * 2) {
      this.difficulty = Math.max(1, this.difficulty - 1);
      console.log(`Difficulty decreased to ${this.difficulty}`);
    }
  }

  
  isChainValid() {
    
    if (this.chain.length === 0) {
      return false;
    }

   
    const genesisBlock = this.chain[0];
    if (genesisBlock.index !== 0 || genesisBlock.previousHash !== '0') {
      console.log('Invalid genesis block');
      return false;
    }

   
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

     
      if (currentBlock.index !== i) {
        console.log(`Invalid block index at position ${i}`);
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(`Invalid previous hash link at block ${i}`);
        return false;
      }

     
      if (!this.isBlockValid(currentBlock)) {
        console.log(`Invalid block at position ${i}`);
        return false;
      }

     
      const target = Array(currentBlock.difficulty + 1).join("0");
      if (currentBlock.hash.substring(0, currentBlock.difficulty) !== target) {
        console.log(`Block ${i} hash does not meet difficulty requirement`);
        return false;
      }
    }

    return true;
  }

  
  getBalance(department) {
    let balance = 0;
    
    for (let block of this.chain) {
      for (let transaction of block.transactions) {
        if (transaction.department === department) {
          balance += transaction.amount;
        }
      }
    }
    
    return balance;
  }


  getTransactionsForDepartment(department) {
    const transactions = [];
    
    for (let block of this.chain) {
      for (let transaction of block.transactions) {
        if (transaction.department === department) {
          transactions.push({
            ...transaction.toObject(),
            blockIndex: block.index,
            blockHash: block.hash,
            blockTimestamp: block.timestamp
          });
        }
      }
    }
    
    return transactions;
  }


  addNode(nodeUrl) {
    this.nodes.add(nodeUrl);
    console.log(`Node added: ${nodeUrl}`);
  }

 
  getNodes() {
    return Array.from(this.nodes);
  }

  // Replace chain with a longer valid chain (consensus)
  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log('Received chain is not longer than current chain');
      return false;
    }

    if (!this.isValidChain(newChain)) {
      console.log('Received chain is invalid');
      return false;
    }

    console.log('Replacing current chain with new chain');
    this.chain = newChain;
    return true;
  }

  // Validate a single block
  isBlockValid(block) {
    // Check if hash is valid
    if (block.hash !== this.calculateBlockHash(block)) {
      console.log(`Invalid hash for block ${block.index}`);
      return false;
    }
    
    // Check if Merkle root is valid
    if (block.merkleRoot !== this.calculateMerkleRoot(block.transactions)) {
      console.log(`Invalid Merkle root for block ${block.index}`);
      return false;
    }
    
    // Check if transactions are valid
    for (let tx of block.transactions) {
      if (!tx.transactionHash || tx.transactionHash !== this.calculateTransactionHash(tx)) {
        console.log(`Invalid transaction hash in block ${block.index}`);
        return false;
      }
    }
    
    return true;
  }

  // Validate a chain (static method)
  isValidChain(chain) {
    if (chain.length === 0) return false;

    // Check genesis block
    const genesisBlock = chain[0];
    if (genesisBlock.index !== 0 || genesisBlock.previousHash !== '0') {
      return false;
    }

    // Validate each block
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      if (currentBlock.index !== i) return false;
      if (currentBlock.previousHash !== previousBlock.hash) return false;
      if (!this.isBlockValid(currentBlock)) return false;

      const target = Array(currentBlock.difficulty + 1).join("0");
      if (currentBlock.hash.substring(0, currentBlock.difficulty) !== target) {
        return false;
      }
    }

    return true;
  }

  // Get blockchain statistics
  getStats() {
    const totalTransactions = this.chain.reduce((sum, block) => sum + block.transactions.length, 0);
    const totalMiningTime = this.chain.reduce((sum, block) => sum + block.miningTime, 0);
    const averageMiningTime = this.chain.length > 0 ? totalMiningTime / this.chain.length : 0;

    return {
      chainLength: this.chain.length,
      totalTransactions,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      averageMiningTime,
      totalMiningTime,
      nodes: this.nodes.size,
      isValid: this.isChainValid()
    };
  }

  // Get block by index
  getBlock(index) {
    return this.chain[index] || null;
  }

  // Get block by hash
  getBlockByHash(hash) {
    return this.chain.find(block => block.hash === hash) || null;
  }

  // Get recent blocks
  getRecentBlocks(count = 10) {
    return this.chain.slice(-count);
  }
}

module.exports = Blockchain;
