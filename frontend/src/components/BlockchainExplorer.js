import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LinkOutlined, 
  CheckCircle, 
  CancelOutlined, 
  Close 
} from '@mui/icons-material';

const BlockchainExplorer = () => {
  const [blockchain, setBlockchain] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [miningStatus, setMiningStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchBlockchainData = async () => {
    try {
      const [blockchainResponse, miningResponse] = await Promise.all([
        axios.get('/api/blockchain/explorer'),
        axios.get('/api/blockchain/mining/status')
      ]);
      
      setBlockchain(blockchainResponse.data);
      setMiningStatus(miningResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      setError('Failed to load blockchain data');
      setLoading(false);
    }
  };

  const getBlockDetails = async (index) => {
    try {
      const response = await axios.get(`/api/blockchain/block/${index}/details`);
      setSelectedBlock(response.data);
    } catch (error) {
      console.error('Error fetching block details:', error);
    }
  };

  const forceMine = async () => {
    try {
      await axios.post('/api/blockchain/mining/mine');
      fetchBlockchainData(); 
    } catch (error) {
      console.error('Error mining block:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 2) return '#27ae60';
    if (difficulty <= 4) return '#f39c12';
    return '#e74c3c';
  };

  const formatHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="blockchain-explorer">
        <div className="loading">Loading blockchain data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blockchain-explorer">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="blockchain-explorer">
      <div className="explorer-header">
        <h2><LinkOutlined /> Blockchain Explorer</h2>
        <p>Real-time blockchain monitoring and analysis</p>
      </div>

      {/* Blockchain Statistics */}
      <div className="blockchain-stats">
        <h3>Blockchain Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Chain Length</h4>
            <p className="stat-value">{blockchain.stats.chainLength}</p>
          </div>
          <div className="stat-card">
            <h4>Total Transactions</h4>
            <p className="stat-value">{blockchain.stats.totalTransactions}</p>
          </div>
          <div className="stat-card">
            <h4>Pending Transactions</h4>
            <p className="stat-value">{blockchain.pendingTransactions}</p>
          </div>
          <div className="stat-card">
            <h4>Current Difficulty</h4>
            <p className="stat-value" style={{ color: getDifficultyColor(blockchain.stats.difficulty) }}>
              {blockchain.stats.difficulty}
            </p>
          </div>
          <div className="stat-card">
            <h4>Network Nodes</h4>
            <p className="stat-value">{blockchain.nodes}</p>
          </div>
          <div className="stat-card">
            <h4>Chain Valid</h4>
            <p className="stat-value" style={{ color: blockchain.stats.isValid ? '#27ae60' : '#e74c3c' }}>
              {blockchain.stats.isValid ? <CheckCircle /> : <CancelOutlined />}
            </p>
          </div>
        </div>
      </div>

      {/* Mining Status */}
      <div className="mining-status">
        <h3>Mining Status</h3>
        <div className="mining-info">
          <div className="mining-indicator">
            <span className={`mining-dot ${miningStatus.isMining ? 'active' : 'inactive'}`}></span>
            <span>{miningStatus.isMining ? 'Mining Active' : 'Mining Inactive'}</span>
          </div>
          <div className="mining-details">
            <p>Pending Transactions: {miningStatus.pendingTransactions}</p>
            <p>Difficulty: {miningStatus.difficulty}</p>
            {miningStatus.latestBlock && (
              <p>Latest Block: #{miningStatus.latestBlock.index}</p>
            )}
          </div>
          <button 
            className="mine-btn"
            onClick={forceMine}
            disabled={miningStatus.pendingTransactions === 0}
          >
            Force Mine Block
          </button>
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="recent-blocks">
        <h3>Recent Blocks</h3>
        <div className="blocks-list">
          {blockchain.recentBlocks.map((block, index) => (
            <div 
              key={block.index} 
              className="block-card"
              onClick={() => getBlockDetails(block.index)}
            >
              <div className="block-header">
                <span className="block-index">#{block.index}</span>
                <span className="block-hash">{formatHash(block.hash)}</span>
              </div>
              <div className="block-details">
                <p>Transactions: {block.transactionCount}</p>
                <p>Difficulty: <span style={{ color: getDifficultyColor(block.difficulty) }}>
                  {block.difficulty}
                </span></p>
                <p>Mining Time: {block.miningTime}ms</p>
                <p>Time: {formatTime(block.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block Details Modal */}
      {selectedBlock && (
        <div className="block-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Block #{selectedBlock.index} Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedBlock(null)}
              >
                <Close />
              </button>
            </div>
            
            <div className="block-details-content">
              <div className="detail-section">
                <h4>Block Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Index:</label>
                    <span>{selectedBlock.index}</span>
                  </div>
                  <div className="detail-item">
                    <label>Hash:</label>
                    <span className="hash-value">{selectedBlock.hash}</span>
                  </div>
                  <div className="detail-item">
                    <label>Previous Hash:</label>
                    <span className="hash-value">{selectedBlock.previousHash}</span>
                  </div>
                  <div className="detail-item">
                    <label>Timestamp:</label>
                    <span>{formatTime(selectedBlock.timestamp)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Nonce:</label>
                    <span>{selectedBlock.nonce}</span>
                  </div>
                  <div className="detail-item">
                    <label>Difficulty:</label>
                    <span style={{ color: getDifficultyColor(selectedBlock.difficulty) }}>
                      {selectedBlock.difficulty}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Mining Time:</label>
                    <span>{selectedBlock.miningTime}ms</span>
                  </div>
                  <div className="detail-item">
                    <label>Merkle Root:</label>
                    <span className="hash-value">{formatHash(selectedBlock.merkleRoot)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Transactions ({selectedBlock.transactions.length})</h4>
                <div className="transactions-list">
                  {selectedBlock.transactions.map((tx, index) => (
                    <div key={index} className="transaction-item">
                      <div className="tx-header">
                        <span className="tx-hash">{formatHash(tx.transactionHash)}</span>
                        <span className="tx-amount">${tx.amount.toLocaleString()}</span>
                      </div>
                      <div className="tx-details">
                        <p><strong>Department:</strong> {tx.department}</p>
                        <p><strong>Vendor:</strong> {tx.vendor}</p>
                        <p><strong>Description:</strong> {tx.description}</p>
                        <p><strong>Time:</strong> {formatTime(tx.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainExplorer;
