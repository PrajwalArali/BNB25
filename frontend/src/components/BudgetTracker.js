import React, { useState, useMemo } from 'react';
import { TrendingUpOutlined } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BudgetTracker = ({ transactions, budgets: initialBudgets, onBudgetUpdate }) => {
  const [budgets, setBudgets] = useState(() => {
    // Use provided budgets or default ones
    return initialBudgets || {
      'IT': 50000,
      'Marketing': 30000,
      'Operations': 40000,
      'HR': 20000,
      'Finance': 15000
    };
  });

  const [newBudget, setNewBudget] = useState({ department: '', amount: '' });

  const budgetAnalysis = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {};
    }

    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentMonthTransactions = transactions.filter(tx => 
      new Date(tx.date || tx.timestamp).toISOString().substring(0, 7) === currentMonth
    );

    const spendingByDepartment = {};
    currentMonthTransactions.forEach(tx => {
      spendingByDepartment[tx.department] = (spendingByDepartment[tx.department] || 0) + tx.amount;
    });

    const analysis = {};
    Object.keys(budgets).forEach(dept => {
      const budget = budgets[dept];
      const spent = spendingByDepartment[dept] || 0;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      
      analysis[dept] = {
        budget,
        spent,
        remaining,
        percentage,
        status: percentage >= 90 ? 'over' : percentage >= 75 ? 'warning' : 'good'
      };
    });

    return analysis;
  }, [transactions, budgets]);

  const handleAddBudget = (e) => {
    e.preventDefault();
    if (newBudget.department && newBudget.amount > 0) {
      const updatedBudgets = {
        ...budgets,
        [newBudget.department]: parseFloat(newBudget.amount)
      };
      setBudgets(updatedBudgets);
      onBudgetUpdate?.(updatedBudgets);
      setNewBudget({ department: '', amount: '' });
    }
  };

  const handleUpdateBudget = (department, amount) => {
    const updatedBudgets = {
      ...budgets,
      [department]: parseFloat(amount)
    };
    setBudgets(updatedBudgets);
    onBudgetUpdate?.(updatedBudgets);
  };

  const budgetChartData = {
    labels: Object.keys(budgetAnalysis),
    datasets: [
      {
        label: 'Budget',
        data: Object.values(budgetAnalysis).map(item => item.budget),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1
      },
      {
        label: 'Spent',
        data: Object.values(budgetAnalysis).map(item => item.spent),
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Budget vs Actual Spending'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'over': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'good': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'over': return 'Over Budget';
      case 'warning': return 'Near Limit';
      case 'good': return 'On Track';
      default: return 'Unknown';
    }
  };

  return (
    <div className="budget-tracker">
      <div className="budget-header">
        <h2><TrendingUpOutlined /> Budget Tracker</h2>
        <p>Monitor spending against department budgets</p>
      </div>

      <div className="budget-form">
        <h3>Add/Update Budget</h3>
        <form onSubmit={handleAddBudget}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Department name"
              value={newBudget.department}
              onChange={(e) => setNewBudget(prev => ({ ...prev, department: e.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Budget amount"
              value={newBudget.amount}
              onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
              min="0"
              step="0.01"
              required
            />
            <button type="submit">Add Budget</button>
          </div>
        </form>
      </div>

      <div className="budget-overview">
        <h3>Budget Overview</h3>
        <div className="budget-chart">
          {Object.keys(budgetAnalysis).length > 0 ? (
            <Bar data={budgetChartData} options={chartOptions} />
          ) : (
            <p className="no-data">No budget data available</p>
          )}
        </div>
      </div>

      <div className="budget-details">
        <h3>Department Budget Details</h3>
        <div className="budget-cards">
          {Object.entries(budgetAnalysis).map(([department, data]) => (
            <div key={department} className={`budget-card ${data.status}`}>
              <div className="budget-card-header">
                <h4>{department}</h4>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(data.status) }}
                >
                  {getStatusText(data.status)}
                </span>
              </div>
              
              <div className="budget-metrics">
                <div className="metric">
                  <label>Budget:</label>
                  <span>${data.budget.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <label>Spent:</label>
                  <span>${data.spent.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <label>Remaining:</label>
                  <span className={data.remaining < 0 ? 'negative' : 'positive'}>
                    ${data.remaining.toLocaleString()}
                  </span>
                </div>
                <div className="metric">
                  <label>Usage:</label>
                  <span>{data.percentage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min(data.percentage, 100)}%`,
                    backgroundColor: getStatusColor(data.status)
                  }}
                ></div>
              </div>

              <div className="budget-actions">
                <input
                  type="number"
                  placeholder="Update budget"
                  min="0"
                  step="0.01"
                  onBlur={(e) => {
                    if (e.target.value > 0) {
                      handleUpdateBudget(department, e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="budget-insights">
        <h3><TrendingUpOutlined /> Budget Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Total Budget</h4>
            <p>${Object.values(budgetAnalysis).reduce((sum, item) => sum + item.budget, 0).toLocaleString()}</p>
          </div>
          <div className="insight-card">
            <h4>Total Spent</h4>
            <p>${Object.values(budgetAnalysis).reduce((sum, item) => sum + item.spent, 0).toLocaleString()}</p>
          </div>
          <div className="insight-card">
            <h4>Departments Over Budget</h4>
            <p>{Object.values(budgetAnalysis).filter(item => item.status === 'over').length}</p>
          </div>
          <div className="insight-card">
            <h4>Average Usage</h4>
            <p>
              {Object.values(budgetAnalysis).length > 0 
                ? (Object.values(budgetAnalysis).reduce((sum, item) => sum + item.percentage, 0) / Object.values(budgetAnalysis).length).toFixed(1)
                : 0
              }%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;
