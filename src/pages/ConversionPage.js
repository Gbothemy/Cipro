'use client';

import React, { useState } from 'react';
import './ConversionPage.css';

function ConversionPage({ user, updateUser, addNotification }) {
  const [convertAmount, setConvertAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [activeTab, setActiveTab] = useState('convert');

  const CONVERSION_RATE = 10000; // 1 CATI = 10,000 points
  const MIN_WITHDRAW = 100; // Minimum 100 CATI to withdraw

  const handleConvert = (e) => {
    e.preventDefault();
    
    const points = parseFloat(convertAmount);
    
    if (!points || points <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (points > user.points) {
      addNotification('Insufficient points', 'error');
      return;
    }
    
    const catiAmount = points / CONVERSION_RATE;
    
    updateUser({
      points: user.points - points,
      balance: {
        ...user.balance,
        cati: user.balance.cati + catiAmount
      }
    });
    
    addNotification(`Successfully converted ${points.toLocaleString()} points to ${catiAmount.toFixed(4)} CATI!`, 'success');
    setConvertAmount('');
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (amount < MIN_WITHDRAW) {
      addNotification(`Minimum withdrawal is ${MIN_WITHDRAW} CATI`, 'error');
      return;
    }
    
    if (amount > user.balance.cati) {
      addNotification('Insufficient CATI balance', 'error');
      return;
    }
    
    if (!withdrawAddress.trim()) {
      addNotification('Please enter a wallet address', 'error');
      return;
    }
    
    // Simulate withdrawal (in production, this would call an API)
    updateUser({
      balance: {
        ...user.balance,
        cati: user.balance.cati - amount
      }
    });
    
    addNotification(`Withdrawal request submitted! ${amount} CATI will be sent to your wallet within 24 hours.`, 'success');
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const calculateCati = (points) => {
    return points ? (points / CONVERSION_RATE).toFixed(4) : '0';
  };

  const calculatePoints = (cati) => {
    return cati ? (cati * CONVERSION_RATE).toLocaleString() : '0';
  };

  return (
    <div className="conversion-page">
      <div className="page-header">
        <h1 className="page-title">Convert & Withdraw</h1>
        <p className="page-subtitle">Convert points to CATI and withdraw to your wallet</p>
      </div>

      {/* Balance Overview */}
      <div className="balance-overview">
        <div className="balance-card-conv">
          <div className="balance-icon">💎</div>
          <div className="balance-info">
            <span className="balance-label">Available Points</span>
            <span className="balance-value">{user.points.toLocaleString()}</span>
          </div>
        </div>
        <div className="balance-card-conv">
          <div className="balance-icon">🐱</div>
          <div className="balance-info">
            <span className="balance-label">CATI Balance</span>
            <span className="balance-value">{user.balance.cati.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Conversion Rate Info */}
      <div className="rate-info">
        <h3>📊 Conversion Rate</h3>
        <p className="rate-text">1 CATI = {CONVERSION_RATE.toLocaleString()} Points</p>
        <p className="rate-subtext">Convert your earned points to CATI cryptocurrency</p>
      </div>

      {/* Tabs */}
      <div className="conversion-tabs">
        <button 
          className={`tab-btn ${activeTab === 'convert' ? 'active' : ''}`}
          onClick={() => setActiveTab('convert')}
        >
          🔄 Convert Points
        </button>
        <button 
          className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          💸 Withdraw CATI
        </button>
      </div>

      {/* Convert Tab */}
      {activeTab === 'convert' && (
        <div className="tab-content">
          <form onSubmit={handleConvert} className="conversion-form">
            <div className="form-group">
              <label>Points to Convert</label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="Enter points amount"
                min="0"
                step="1"
              />
              <div className="conversion-preview">
                <span>You will receive:</span>
                <span className="preview-amount">{calculateCati(convertAmount)} CATI</span>
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setConvertAmount('10000')}>10K</button>
              <button type="button" onClick={() => setConvertAmount('50000')}>50K</button>
              <button type="button" onClick={() => setConvertAmount('100000')}>100K</button>
              <button type="button" onClick={() => setConvertAmount(user.points.toString())}>Max</button>
            </div>

            <button type="submit" className="submit-btn convert-btn">
              🔄 Convert to CATI
            </button>
          </form>

          <div className="info-box">
            <h4>ℹ️ Conversion Info</h4>
            <ul>
              <li>Instant conversion</li>
              <li>No fees</li>
              <li>Minimum: 1,000 points (0.1 CATI)</li>
              <li>Converted CATI appears immediately in your balance</li>
            </ul>
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="tab-content">
          <form onSubmit={handleWithdraw} className="conversion-form">
            <div className="form-group">
              <label>CATI Amount</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter CATI amount"
                min={MIN_WITHDRAW}
                step="0.0001"
              />
              <div className="conversion-preview">
                <span>Equivalent to:</span>
                <span className="preview-amount">{calculatePoints(withdrawAmount)} Points</span>
              </div>
            </div>

            <div className="form-group">
              <label>Wallet Address</label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="Enter your CATI wallet address"
              />
              <span className="form-hint">Make sure the address is correct. Transactions cannot be reversed.</span>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setWithdrawAmount('100')}>100</button>
              <button type="button" onClick={() => setWithdrawAmount('500')}>500</button>
              <button type="button" onClick={() => setWithdrawAmount('1000')}>1000</button>
              <button type="button" onClick={() => setWithdrawAmount(user.balance.cati.toString())}>Max</button>
            </div>

            <button type="submit" className="submit-btn withdraw-btn">
              💸 Request Withdrawal
            </button>
          </form>

          <div className="info-box warning">
            <h4>⚠️ Withdrawal Info</h4>
            <ul>
              <li>Minimum withdrawal: {MIN_WITHDRAW} CATI</li>
              <li>Processing time: 24-48 hours</li>
              <li>Network fee: 0.5 CATI (deducted from withdrawal)</li>
              <li>Double-check your wallet address</li>
              <li>Withdrawals are processed manually for security</li>
            </ul>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>📜 Recent Transactions</h3>
        <div className="history-list">
          <div className="history-item empty">
            <p>No transactions yet</p>
            <span>Your conversion and withdrawal history will appear here</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversionPage;
