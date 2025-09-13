import React, { useState, useEffect, useMemo } from 'react';
import { 
  WarningAmberOutlined, 
  WarningOutlined, 
  InfoOutlined, 
  BarChartOutlined,
  NotificationsActiveOutlined
} from '@mui/icons-material';
//import axios from 'axios';

const AnomalyDetector = ({ transactions, budgets }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alertThresholds, setAlertThresholds] = useState({
    budgetOverrun: 90, // Alert when 90% of budget is used
    unusualSpending: 200, // Alert when single transaction > $200
    rapidSpending: 5, // Alert when > 5 transactions in 1 hour
    weekendSpending: true // Alert for weekend transactions
  });

  // Detect anomalies in real-time
  const detectedAnomalies = useMemo(() => {
    if (!transactions || !budgets || transactions.length === 0) {
      return [];
    }

    const currentAnomalies = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
   // const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Budget Overrun Detection
    Object.entries(budgets).forEach(([department, budget]) => {
      const currentMonth = now.toISOString().substring(0, 7);
      const monthlySpending = transactions
        .filter(tx => 
          tx.department === department && 
          new Date(tx.date).toISOString().substring(0, 7) === currentMonth
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const percentage = (monthlySpending / budget) * 100;
      
      if (percentage >= alertThresholds.budgetOverrun) {
        currentAnomalies.push({
          id: `budget-overrun-${department}`,
          type: 'budget_overrun',
          severity: percentage >= 100 ? 'critical' : 'warning',
          department,
          message: `Budget overrun detected: ${department} has used ${percentage.toFixed(1)}% of budget ($${monthlySpending.toLocaleString()} / $${budget.toLocaleString()})`,
          amount: monthlySpending,
          budget,
          percentage,
          timestamp: now
        });
      }
    });

    // 2. Unusual Spending Detection
    transactions.forEach(tx => {
      if (tx.amount > alertThresholds.unusualSpending) {
        currentAnomalies.push({
          id: `unusual-spending-${tx._id || tx.transactionHash}`,
          type: 'unusual_spending',
          severity: tx.amount > 1000 ? 'critical' : 'warning',
          department: tx.department,
          vendor: tx.vendor,
          message: `Unusual spending detected: $${tx.amount.toLocaleString()} transaction to ${tx.vendor}`,
          amount: tx.amount,
          transaction: tx,
          timestamp: new Date(tx.date || tx.timestamp)
        });
      }
    });

    // 3. Rapid Spending Detection
    const recentTransactions = transactions.filter(tx => new Date(tx.date || tx.timestamp) > oneHourAgo);
    if (recentTransactions.length > alertThresholds.rapidSpending) {
      const totalRecent = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      currentAnomalies.push({
        id: `rapid-spending-${now.getTime()}`,
        type: 'rapid_spending',
        severity: 'warning',
        message: `Rapid spending detected: ${recentTransactions.length} transactions totaling $${totalRecent.toLocaleString()} in the last hour`,
        count: recentTransactions.length,
        totalAmount: totalRecent,
        transactions: recentTransactions,
        timestamp: now
      });
    }

    // 4. Weekend Spending Detection
    if (alertThresholds.weekendSpending) {
      const weekendTransactions = transactions.filter(tx => {
        const dayOfWeek = new Date(tx.date || tx.timestamp).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      });

      if (weekendTransactions.length > 0) {
        const weekendTotal = weekendTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        currentAnomalies.push({
          id: `weekend-spending-${now.getTime()}`,
          type: 'weekend_spending',
          severity: 'info',
          message: `Weekend spending detected: ${weekendTransactions.length} transactions totaling $${weekendTotal.toLocaleString()}`,
          count: weekendTransactions.length,
          totalAmount: weekendTotal,
          transactions: weekendTransactions,
          timestamp: now
        });
      }
    }

    // 5. Spending Pattern Anomalies
    const departmentSpending = {};
    transactions.forEach(tx => {
      if (!departmentSpending[tx.department]) {
        departmentSpending[tx.department] = [];
      }
      departmentSpending[tx.department].push(tx.amount);
    });

    Object.entries(departmentSpending).forEach(([dept, amounts]) => {
      if (amounts.length >= 3) {
        const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Check for transactions that are 2 standard deviations above mean
        amounts.forEach((amount, index) => {
          if (amount > avg + (2 * stdDev) && amount > 500) {
            const transaction = transactions.find(tx => tx.department === dept && tx.amount === amount);
            if (transaction) {
              currentAnomalies.push({
                id: `pattern-anomaly-${transaction._id || transaction.transactionHash}`,
                type: 'spending_pattern',
                severity: 'warning',
                department: dept,
                message: `Unusual spending pattern: $${amount.toLocaleString()} transaction is significantly above department average ($${avg.toFixed(2)})`,
                amount,
                average: avg,
                standardDeviation: stdDev,
                transaction,
                timestamp: new Date(transaction.date || transaction.timestamp)
              });
            }
          }
        });
      }
    });

    return currentAnomalies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions, budgets, alertThresholds]);

  // Update anomalies when detected
  useEffect(() => {
    if (isMonitoring) {
      setAnomalies(detectedAnomalies);
      
      // Create alerts for new anomalies
      const newAlerts = detectedAnomalies
        .filter(anomaly => 
          !alerts.some(alert => alert.id === anomaly.id)
        )
        .map(anomaly => ({
          ...anomaly,
          acknowledged: false,
          createdAt: new Date()
        }));
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev]);
        
        // Show browser notification for critical alerts
        newAlerts
          .filter(alert => alert.severity === 'critical')
          .forEach(alert => {
            if (Notification.permission === 'granted') {
              new Notification('Critical Budget Alert', {
                body: alert.message,
                icon: '/favicon.ico'
              });
            }
          });
      }
    }
  }, [detectedAnomalies, isMonitoring, alerts]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
          : alert
      )
    );
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

   
  // const getSeverityColor = (severity) => {
  //   switch (severity) {
  //     case 'critical': return '#e74c3c';
  //     case 'warning': return '#f39c12';
  //     case 'info': return '#3498db';
  //     default: return '#95a5a6';
  //   }
  // };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <WarningAmberOutlined />;
      case 'warning': return <WarningOutlined />;
      case 'info': return <InfoOutlined />;
      default: return <BarChartOutlined />;
    }
  };

  return (
    <div className="anomaly-detector">
      <div className="detector-header">
        <h2><NotificationsActiveOutlined /> Anomaly Detection System</h2>
        <div className="detector-controls">
          <label className="monitor-toggle">
            <input
              type="checkbox"
              checked={isMonitoring}
              onChange={(e) => setIsMonitoring(e.target.checked)}
            />
            Real-time Monitoring
          </label>
          <button 
            className="clear-alerts-btn"
            onClick={() => setAlerts([])}
          >
            Clear All Alerts
          </button>
        </div>
      </div>

      <div className="alert-thresholds">
        <h3>Alert Thresholds</h3>
        <div className="threshold-grid">
          <div className="threshold-item">
            <label>Budget Overrun Alert (%)</label>
            <input
              type="number"
              value={alertThresholds.budgetOverrun}
              onChange={(e) => setAlertThresholds(prev => ({
                ...prev,
                budgetOverrun: parseInt(e.target.value)
              }))}
              min="50"
              max="100"
            />
          </div>
          <div className="threshold-item">
            <label>Unusual Spending ($)</label>
            <input
              type="number"
              value={alertThresholds.unusualSpending}
              onChange={(e) => setAlertThresholds(prev => ({
                ...prev,
                unusualSpending: parseInt(e.target.value)
              }))}
              min="100"
            />
          </div>
          <div className="threshold-item">
            <label>Rapid Spending (transactions/hour)</label>
            <input
              type="number"
              value={alertThresholds.rapidSpending}
              onChange={(e) => setAlertThresholds(prev => ({
                ...prev,
                rapidSpending: parseInt(e.target.value)
              }))}
              min="1"
            />
          </div>
          <div className="threshold-item">
            <label>
              <input
                type="checkbox"
                checked={alertThresholds.weekendSpending}
                onChange={(e) => setAlertThresholds(prev => ({
                  ...prev,
                  weekendSpending: e.target.checked
                }))}
              />
              Weekend Spending Alerts
            </label>
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <h3>Active Alerts ({alerts.filter(a => !a.acknowledged).length})</h3>
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <p className="no-alerts">No alerts detected. System is running normally.</p>
          ) : (
            alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-card ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}
              >
                <div className="alert-header">
                  <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
                  <span className="alert-type">{alert.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-actions">
                  {!alert.acknowledged && (
                    <button 
                      className="acknowledge-btn"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button 
                    className="dismiss-btn"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="anomaly-stats">
        <h3>Detection Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Anomalies Detected</span>
            <span className="stat-value">{anomalies.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Critical Alerts</span>
            <span className="stat-value critical">
              {anomalies.filter(a => a.severity === 'critical').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Warning Alerts</span>
            <span className="stat-value warning">
              {anomalies.filter(a => a.severity === 'warning').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">System Status</span>
            <span className={`stat-value ${isMonitoring ? 'active' : 'inactive'}`}>
              {isMonitoring ? 'Monitoring' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetector;
