import React, { useState } from 'react';

const SearchFilter = ({ transactions, onFilteredTransactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterBy, sortBy, sortOrder);
  };

  const handleFilterChange = (e) => {
    const filter = e.target.value;
    setFilterBy(filter);
    applyFilters(searchTerm, filter, sortBy, sortOrder);
  };

  const handleSortChange = (e) => {
    const sort = e.target.value;
    setSortBy(sort);
    applyFilters(searchTerm, filterBy, sort, sortOrder);
  };

  const handleSortOrderChange = (e) => {
    const order = e.target.value;
    setSortOrder(order);
    applyFilters(searchTerm, filterBy, sortBy, order);
  };

  const applyFilters = (term, filter, sort, order) => {
    let filtered = [...transactions];

    // Apply search filter
    if (term) {
      filtered = filtered.filter(tx => 
        tx.department.toLowerCase().includes(term) ||
        tx.vendor.toLowerCase().includes(term) ||
        tx.description.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => {
        switch (filter) {
          case 'department':
            return tx.department.toLowerCase().includes(term);
          case 'vendor':
            return tx.vendor.toLowerCase().includes(term);
          case 'high-amount':
            return tx.amount > 1000;
          case 'recent':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(tx.date || tx.timestamp) > weekAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sort) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        case 'vendor':
          aValue = a.vendor.toLowerCase();
          bValue = b.vendor.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.date || a.timestamp);
          bValue = new Date(b.date || b.timestamp);
          break;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    onFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBy('all');
    setSortBy('date');
    setSortOrder('desc');
    onFilteredTransactions(transactions);
  };

  return (
    <div className="search-filter">
      <h2>Search & Filter Transactions</h2>
      
      <div className="filter-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search by department, vendor, or description..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filterBy">Filter by:</label>
          <select
            id="filterBy"
            value={filterBy}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Transactions</option>
            <option value="department">Department</option>
            <option value="vendor">Vendor</option>
            <option value="high-amount">High Amount (>$1000)</option>
            <option value="recent">Recent (Last 7 days)</option>
          </select>
        </div>

        <div className="sort-group">
          <label htmlFor="sortBy">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="department">Department</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <div className="order-group">
          <label htmlFor="sortOrder">Order:</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={handleSortOrderChange}
            className="order-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <button onClick={clearFilters} className="clear-btn">
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilter;
