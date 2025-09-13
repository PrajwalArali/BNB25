import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const TransactionForm = ({ onTransactionAdded }) => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    department: '',
    vendor: '',
    amount: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await axios.post('/api/blockchain/transaction', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      onTransactionAdded(response.data);
      setFormData({
        department: '',
        vendor: '',
        amount: '',
        description: ''
      });
      alert('Transaction added to pending pool! It will be mined into the next block.');
    } catch (error) {
      console.error('Error adding transaction:', error);
      if (error.response?.status === 403) {
        alert('Admin access required to add transactions.');
      } else {
        alert('Failed to add transaction. Please try again.');
      }
    }
  };

  return (
    <div className="transaction-form">
      <h2>Add New Transaction</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="department">Department:</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="vendor">Vendor:</label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Add Transaction</button>
      </form>
    </div>
  );
};

export default TransactionForm;