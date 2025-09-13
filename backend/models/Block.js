const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    trim: true
  },
  vendor: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  transactionHash: {
    type: String,
    required: true
  }
}, { _id: false });

const blockSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  transactions: [transactionSchema],
  hash: {
    type: String,
    required: true,
    unique: true
  },
  previousHash: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: true,
    default: 0
  },
  difficulty: {
    type: Number,
    required: true,
    default: 2
  },
  merkleRoot: {
    type: String,
    required: true
  },
  blockSize: {
    type: Number,
    required: true
  },
  miningTime: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

blockSchema.methods.calculateHash = function() {
  const data = this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce + (this.merkleRoot || '');
  return crypto.createHash('sha256').update(data).digest('hex');
};

blockSchema.methods.calculateMerkleRoot = function() {
  if (this.transactions.length === 0) {
    return crypto.createHash('sha256').update('').digest('hex');
  }
  
  let hashes = this.transactions.map(tx => tx.transactionHash);
  
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
};

blockSchema.methods.mineBlock = function(difficulty) {
  const startTime = Date.now();
  this.difficulty = difficulty;
  this.merkleRoot = this.calculateMerkleRoot();
  
  const target = Array(difficulty + 1).join("0");
  
  console.log(`Mining block ${this.index} with difficulty ${difficulty}...`);
  
  while (this.hash.substring(0, difficulty) !== target) {
    this.nonce++;
    this.hash = this.calculateHash();
    

    if (this.nonce > 1000000) {
      console.log('Mining timeout - using current hash');
      break;
    }
  }
  
  this.miningTime = Date.now() - startTime;
  console.log(`Block ${this.index} mined: ${this.hash} (${this.miningTime}ms, nonce: ${this.nonce})`);
  
  return this.hash;
};

blockSchema.methods.isValid = function() {

  if (this.hash !== this.calculateHash()) {
    console.log(`Invalid hash for block ${this.index}`);
    return false;
  }

  if (this.merkleRoot !== this.calculateMerkleRoot()) {
    console.log(`Invalid Merkle root for block ${this.index}`);
    return false;
  }
  
  for (let tx of this.transactions) {
    if (!tx.transactionHash || tx.transactionHash !== this.calculateTransactionHash(tx)) {
      console.log(`Invalid transaction hash in block ${this.index}`);
      return false;
    }
  }
  
  return true;
};

blockSchema.methods.calculateTransactionHash = function(transaction) {
  const data = transaction.department + transaction.vendor + transaction.amount + 
               transaction.description + transaction.timestamp;
  return crypto.createHash('sha256').update(data).digest('hex');
};

blockSchema.index({ index: 1 });
blockSchema.index({ hash: 1 });
blockSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Block', blockSchema);
