import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import './RevenueDashboard.css';

function RevenueDashboard({ user, addNotification }) {
  const [revenueStats, setRevenueStats] = useState({
    companyWallet: null,
    revenueTransactions: [],
    trafficRevenue: [],
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d, all
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, traffic, reports

  useEffect(() => {
    if (user?.isAdmin) {
      loadRevenueData();
    }
  }, [user, timeRange]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      let startDate = null;
      
      if (timeRange !== 'all') {
        startDate = new Date();
        const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
        startDate.setDate(startDate.getDate() - days);
      }

      // Load data
      const [companyWallet, revenueTransactions, trafficRevenue] = await Promise.all([
        db.getCompanyWallet(),
        db.getRevenueStats(startDate?.toISOString(), endDate.toISOString()),
        db.getTrafficRevenue(startDate?.toISOString(), endDate.toISOString())
      ]);

      // Calculate total revenue in USD
      const conversionRates = { sol: 100, eth: 2000, usdt: 1, usdc: 1 };
      const totalRevenue = revenueTransactions.reduce((sum, tx) => {
        const rate = conversionRates[tx.revenue_source] || 1;
        return sum + (parseFloat(tx.amount || 0) * rate);
      }, 0) + trafficRevenue.reduce((sum, tr) => sum + parseFloat(tr.estimated_revenue || 0), 0);

      setRevenueStats({
        companyWallet,
        revenueTransactions,
        trafficRevenue,
        totalRevenue
      });

      // Send notification if significant revenue milestone
      if (totalRevenue > 1000 && timeRange === '7d') {
        addNotification(`🎉 Revenue milestone: $${totalRevenue.toFixed(2)} in the last 7 days!`, 'success');
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
      addNotification('Error loading revenue data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatCrypto = (amount, symbol) => {
    return `${parseFloat(amount)} ${symbol.toUpperCase()}`;
  };

  const getRevenueByType = (type) => {
    const conversionRates = { sol: 100, eth: 2000, usdt: 1, usdc: 1 };
    return revenueStats.revenueTransactions
      .filter(tx => tx.transaction_type === type)
      .reduce((sum, tx) => {
        const rate = conversionRates[tx.revenue_source] || 1;
        return sum + (parseFloat(tx.amount || 0) * rate);
      }, 0);
  };

  const getTotalTrafficRevenue = () => {
    return revenueStats.trafficRevenue
      .reduce((sum, tr) => sum + parseFloat(tr.estimated_revenue || 0), 0);
  };

  const getRevenueGrowth = () => {
    if (revenueStats.trafficRevenue.length < 2) return 0;
    const sorted = [...revenueStats.trafficRevenue].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstHalfRevenue = firstHalf.reduce((sum, tr) => sum + parseFloat(tr.estimated_revenue || 0), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, tr) => sum + parseFloat(tr.estimated_revenue || 0), 0);
    
    if (firstHalfRevenue === 0) return 0;
    return ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange: timeRange,
      totalRevenue: revenueStats.totalRevenue,
      conversionFees: getRevenueByType('conversion_fee'),
      withdrawalFees: getRevenueByType('withdrawal_fee'),
      trafficRevenue: getTotalTrafficRevenue(),
      companyWallet: revenueStats.companyWallet,
      transactions: revenueStats.revenueTransactions,
      trafficStats: revenueStats.trafficRevenue
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${timeRange}-${Date.now()}.json`;
    a.click();
    
    addNotification('Revenue report exported successfully!', 'success');
  };

  if (!user?.isAdmin) {
    return (
      <div className="revenue-dashboard">
        <div className="access-denied">
          <h2>🔒 Access Denied</h2>
          <p>This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="revenue-dashboard">
        <div className="loading-state">
          <h2>📊 Loading Revenue Data...</h2>
        </div>
      </div>
    );
  }

  const conversionFees = getRevenueByType('conversion_fee');
  const withdrawalFees = getRevenueByType('withdrawal_fee');
  const trafficRevenue = getTotalTrafficRevenue();
  const revenueGrowth = getRevenueGrowth();

  return (
    <div className="revenue-dashboard">
      <div className="page-header">
        <h1 className="page-title">💰 Revenue Dashboard</h1>
        <p className="page-subtitle">Company revenue and financial analytics</p>
      </div>

      {/* Time Range Selector */}
      <div className="dashboard-controls">
        <div className="time-range-selector">
          <button 
            className={timeRange === '1d' ? 'active' : ''}
            onClick={() => setTimeRange('1d')}
          >
            24 Hours
          </button>
          <button 
            className={timeRange === '7d' ? 'active' : ''}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
        <button className="export-btn" onClick={exportReport}>
          📥 Export Report
        </button>
      </div>

      {/* Revenue Overview Cards */}
      <div className="revenue-overview">
        <div className="revenue-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(revenueStats.totalRevenue)}</div>
            <div className="card-label">Total Revenue</div>
            {revenueGrowth !== 0 && (
              <div className={`card-growth ${revenueGrowth > 0 ? 'positive' : 'negative'}`}>
                {revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
        
        <div className="revenue-card conversion">
          <div className="card-icon">🔄</div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(conversionFees)}</div>
            <div className="card-label">Conversion Fees (10%)</div>
            <div className="card-subtext">
              {revenueStats.revenueTransactions.filter(tx => tx.transaction_type === 'conversion_fee').length} transactions
            </div>
          </div>
        </div>
        
        <div className="revenue-card withdrawal">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(withdrawalFees)}</div>
            <div className="card-label">Withdrawal Fees (5%)</div>
            <div className="card-subtext">
              {revenueStats.revenueTransactions.filter(tx => tx.transaction_type === 'withdrawal_fee').length} transactions
            </div>
          </div>
        </div>
        
        <div className="revenue-card traffic">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(trafficRevenue)}</div>
            <div className="card-label">Ad Revenue</div>
            <div className="card-subtext">
              {revenueStats.trafficRevenue.reduce((sum, tr) => sum + tr.ad_clicks, 0)} clicks
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💳 Transactions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          🌐 Traffic
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Reports
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Company Wallet */}
          {revenueStats.companyWallet && (
            <div className="company-wallet">
              <h3>🏦 Company Wallet</h3>
              <div className="wallet-balances">
                <div className="balance-item">
                  <span className="balance-label">SOL:</span>
                  <span className="balance-value">{formatCrypto(revenueStats.companyWallet.sol_balance, 'SOL')}</span>
                  <span className="balance-usd">≈ {formatCurrency(revenueStats.companyWallet.sol_balance * 100)}</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">ETH:</span>
                  <span className="balance-value">{formatCrypto(revenueStats.companyWallet.eth_balance, 'ETH')}</span>
                  <span className="balance-usd">≈ {formatCurrency(revenueStats.companyWallet.eth_balance * 2000)}</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">USDT:</span>
                  <span className="balance-value">{formatCrypto(revenueStats.companyWallet.usdt_balance, 'USDT')}</span>
                  <span className="balance-usd">≈ {formatCurrency(revenueStats.companyWallet.usdt_balance)}</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">USDC:</span>
                  <span className="balance-value">{formatCrypto(revenueStats.companyWallet.usdc_balance, 'USDC')}</span>
                  <span className="balance-usd">≈ {formatCurrency(revenueStats.companyWallet.usdc_balance)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Chart */}
          <div className="revenue-chart">
            <h3>📈 Revenue Breakdown</h3>
            <div className="chart-container">
              <div className="pie-chart">
                <div 
                  className="pie-segment conversion" 
                  style={{ 
                    '--percentage': (conversionFees / revenueStats.totalRevenue * 100).toFixed(1) 
                  }}
                >
                  <span className="segment-label">
                    Conversion Fees<br/>
                    {formatCurrency(conversionFees)}<br/>
                    ({(conversionFees / revenueStats.totalRevenue * 100).toFixed(1)}%)
                  </span>
                </div>
                <div 
                  className="pie-segment withdrawal" 
                  style={{ 
                    '--percentage': (withdrawalFees / revenueStats.totalRevenue * 100).toFixed(1) 
                  }}
                >
                  <span className="segment-label">
                    Withdrawal Fees<br/>
                    {formatCurrency(withdrawalFees)}<br/>
                    ({(withdrawalFees / revenueStats.totalRevenue * 100).toFixed(1)}%)
                  </span>
                </div>
                <div 
                  className="pie-segment traffic" 
                  style={{ 
                    '--percentage': (trafficRevenue / revenueStats.totalRevenue * 100).toFixed(1) 
                  }}
                >
                  <span className="segment-label">
                    Ad Revenue<br/>
                    {formatCurrency(trafficRevenue)}<br/>
                    ({(trafficRevenue / revenueStats.totalRevenue * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color conversion"></span>
                  <span>Conversion Fees (10%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color withdrawal"></span>
                  <span>Withdrawal Fees (5%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color traffic"></span>
                  <span>Ad Revenue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="tab-content">
          <div className="recent-transactions">
            <h3>📋 Recent Revenue Transactions</h3>
            {revenueStats.revenueTransactions.length > 0 ? (
              <div className="transactions-list">
                {revenueStats.revenueTransactions.map((tx) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="transaction-icon">
                      {tx.transaction_type === 'conversion_fee' ? '🔄' : '💸'}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-type">
                        {tx.transaction_type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="transaction-description">{tx.description}</div>
                      <div className="transaction-date">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="transaction-amount">
                      +{formatCrypto(tx.amount, tx.revenue_source)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No revenue transactions yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traffic Tab */}
      {activeTab === 'traffic' && (
        <div className="tab-content">
          <div className="traffic-stats">
            <h3>📈 Traffic & Ad Revenue</h3>
            {revenueStats.trafficRevenue.length > 0 ? (
              <div className="traffic-list">
                {revenueStats.trafficRevenue.map((tr) => (
                  <div key={tr.id} className="traffic-item">
                    <div className="traffic-date">{tr.date}</div>
                    <div className="traffic-stats-grid">
                      <div className="stat">
                        <span className="stat-label">Page Views:</span>
                        <span className="stat-value">{tr.page_views.toLocaleString()}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Unique Visitors:</span>
                        <span className="stat-value">{tr.unique_visitors.toLocaleString()}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Ad Impressions:</span>
                        <span className="stat-value">{tr.ad_impressions.toLocaleString()}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Ad Clicks:</span>
                        <span className="stat-value">{tr.ad_clicks.toLocaleString()}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">CTR:</span>
                        <span className="stat-value">
                          {tr.ad_impressions > 0 ? ((tr.ad_clicks / tr.ad_impressions) * 100).toFixed(2) : 0}%
                        </span>
                      </div>
                      <div className="stat highlight">
                        <span className="stat-label">Revenue:</span>
                        <span className="stat-value">{formatCurrency(tr.estimated_revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No traffic data yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="tab-content">
          <div className="reports-section">
            <h3>📊 Revenue Reports</h3>
            
            <div className="report-summary">
              <h4>Summary for {timeRange === '1d' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'All Time'}</h4>
              
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Revenue:</span>
                  <span className="summary-value">{formatCurrency(revenueStats.totalRevenue)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Conversion Fees:</span>
                  <span className="summary-value">{formatCurrency(conversionFees)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Withdrawal Fees:</span>
                  <span className="summary-value">{formatCurrency(withdrawalFees)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Ad Revenue:</span>
                  <span className="summary-value">{formatCurrency(trafficRevenue)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Transactions:</span>
                  <span className="summary-value">{revenueStats.revenueTransactions.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Page Views:</span>
                  <span className="summary-value">
                    {revenueStats.trafficRevenue.reduce((sum, tr) => sum + tr.page_views, 0).toLocaleString()}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Ad Clicks:</span>
                  <span className="summary-value">
                    {revenueStats.trafficRevenue.reduce((sum, tr) => sum + tr.ad_clicks, 0).toLocaleString()}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Average Daily Revenue:</span>
                  <span className="summary-value">
                    {formatCurrency(revenueStats.trafficRevenue.length > 0 ? revenueStats.totalRevenue / revenueStats.trafficRevenue.length : 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button className="report-btn" onClick={exportReport}>
                📥 Export JSON Report
              </button>
              <button className="report-btn" onClick={() => window.print()}>
                🖨️ Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenueDashboard;
