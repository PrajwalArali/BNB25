import React from 'react';

const TransactionList = ({ transactions }) => {
  return (
    <div className="transaction-list">
      <h2>Blockchain Transaction Ledger</h2>
      {transactions.length === 0 ? (
        <p>No transactions yet. Add one above!</p>
      ) : (
        <div className="transactions">
          {transactions.map((tx, index) => (
            <div key={tx._id || tx.transactionHash} className="transaction-card">
              <div className="tx-header">
                <span className="tx-number">#{index + 1}</span>
                <span className="tx-hash">
                  {tx.transactionHash ? tx.transactionHash.substring(0, 12) + '...' : 'N/A'}
                </span>
              </div>
              <div className="tx-details">
                <p><strong>Department:</strong> {tx.department}</p>
                <p><strong>Vendor:</strong> {tx.vendor}</p>
                <p><strong>Amount:</strong> ${parseFloat(tx.amount).toFixed(2)}</p>
                <p><strong>Description:</strong> {tx.description}</p>
                <p><strong>Date:</strong> {new Date(tx.date || tx.timestamp).toLocaleString()}</p>
                {tx.blockIndex !== undefined && (
                  <p><strong>Block:</strong> #{tx.blockIndex}</p>
                )}
              </div>
              <div className="tx-hash-details">
                <p><strong>Transaction Hash:</strong> {tx.transactionHash ? tx.transactionHash.substring(0, 16) + '...' : 'N/A'}</p>
                {tx.blockHash && (
                  <p><strong>Block Hash:</strong> {tx.blockHash.substring(0, 16)}...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;