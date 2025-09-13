import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DescriptionOutlined, 
  AnalyticsOutlined, 
  AccountBalanceWalletOutlined, 
  WarningAmberOutlined, 
  ChatBubbleOutlineOutlined, 
  LinkOutlined 
} from '@mui/icons-material';
import { useUser, useAuth } from '@clerk/clerk-react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ValidationSection from './ValidationSection';
import SearchFilter from './SearchFilter';
import AnalyticsDashboard from './AnalyticsDashboard';
import BudgetTracker from './BudgetTracker';
import AnomalyDetector from './AnomalyDetector';
import CommunityFeedback from './CommunityFeedback';
import NotificationSystem from './NotificationSystem';
import BlockchainExplorer from './BlockchainExplorer';
import ChatbotWidget from './ChatbotWidget';
import '../App.css';

function MainApp() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [budgets, setBudgets] = useState({
    'IT': 50000,
    'Marketing': 30000,
    'Operations': 40000,
    'HR': 20000,
    'Finance': 15000
  });
  const [anomalies, setAnomalies] = useState([]);

  // Check if user is admin based on email or metadata
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress?.includes('admin') || 
                  user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    if (isLoaded && user) {
      fetchTransactions();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      // Get all transactions from the blockchain
      const response = await axios.get('/api/blockchain/chain');
      const blockchain = response.data;
      
      // Extract all transactions from all blocks
      const allTransactions = [];
      blockchain.chain.forEach(block => {
        block.transactions.forEach(tx => {
          allTransactions.push({
            ...tx,
            _id: tx.transactionHash,
            date: tx.timestamp,
            blockIndex: block.index,
            blockHash: block.hash
          });
        });
      });
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTransactionAdded = (newTransaction) => {
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    setFilteredTransactions(updatedTransactions);
  };

  const handleFilteredTransactions = (filtered) => {
    setFilteredTransactions(filtered);
  };

  const handleAnomaliesDetected = (detectedAnomalies) => {
    setAnomalies(detectedAnomalies);
  };

  const handleBudgetUpdate = (updatedBudgets) => {
    setBudgets(updatedBudgets);
  };

  const handleNotificationRead = (notificationId) => {
    // Handle notification read event
    console.log('Notification read:', notificationId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transactions':
        return (
          <>
            {isAdmin && <TransactionForm onTransactionAdded={handleTransactionAdded} />}
            {!isAdmin && (
              <div className="admin-only-message">
                <h3>Admin Access Required</h3>
                <p>Only administrators can add new transactions. Please contact your system administrator.</p>
              </div>
            )}
            <ValidationSection />
            <SearchFilter 
              transactions={transactions} 
              onFilteredTransactions={handleFilteredTransactions} 
            />
            <TransactionList transactions={filteredTransactions} />
          </>
        );
      case 'analytics':
        return <AnalyticsDashboard transactions={transactions} />;
      case 'budget':
        return (
          <BudgetTracker 
            transactions={transactions} 
            budgets={budgets}
            onBudgetUpdate={handleBudgetUpdate}
          />
        );
      case 'anomaly':
        return (
          <AnomalyDetector 
            transactions={transactions} 
            budgets={budgets}
            onAnomaliesDetected={handleAnomaliesDetected}
          />
        );
      case 'feedback':
        return (
          <CommunityFeedback 
            transactions={transactions} 
            budgets={budgets}
          />
        );
      case 'blockchain':
        return <BlockchainExplorer />;
      default:
        return null;
    }
  };

  if (!isLoaded) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Ledger System</h1>
            <p>K.R Circle Ambedkar Veedhi</p>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
            <button onClick={() => signOut()} className="sign-out-btn">Sign Out</button>
          </div>
        </div>
        <NotificationSystem 
          anomalies={anomalies}
          onNotificationRead={handleNotificationRead}
        />
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <DescriptionOutlined /> Transactions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <AnalyticsOutlined /> Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <AccountBalanceWalletOutlined /> Budget Tracker
        </button>
        <button 
          className={`tab-btn ${activeTab === 'anomaly' ? 'active' : ''}`}
          onClick={() => setActiveTab('anomaly')}
        >
          <WarningAmberOutlined /> Anomaly Detection
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <ChatBubbleOutlineOutlined /> Community Feedback
        </button>
        <button 
          className={`tab-btn ${activeTab === 'blockchain' ? 'active' : ''}`}
          onClick={() => setActiveTab('blockchain')}
        >
          <LinkOutlined /> Blockchain Explorer
        </button>
      </nav>

      <div className="container">
        {renderTabContent()}
      </div>
      
      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}

export default MainApp;
