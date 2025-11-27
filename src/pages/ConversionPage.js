import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import './ConversionPage.css';

function ConversionPage({ user, updateUser, addNotification }) {
  const [convertAmount, setConvertAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('cati');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawMemo, setWithdrawMemo] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('');
  const [activeTab, setActiveTab] = useState('convert');
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get VIP tier for conversion rate
  const [vipTier, setVipTier] = useState(null);

  useEffect(() => {
    loadVIPTier();
    loadTransactionHistory();
    loadWithdrawalRequests();
  }, [user.userId, user.vipLevel]);

  const loadVIPTier = async () => {
    try {
      const tier = await db.getUserTier(user.vipLevel);
      setVipTier(tier);
    } catch (error) {
      console.error('Error loading VIP tier:', error);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const history = await db.getConversionHistory(user.userId, 20);
      setTransactionHistory(history);
    } catch (error) {
      console.error('Error loading transaction history:', error);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await db.getWithdrawalRequests();
      const userRequests = requests.filter(r => r.user_id === user.userId);
      setWithdrawalRequests(userRequests);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    }
  };

  const CONVERSION_RATES = {
    ton: vipTier?.conversion_rate || 10000,
    cati: vipTier?.conversion_rate || 10000,
    usdt: vipTier?.conversion_rate || 10000
  };

  const MIN_WITHDRAW = {
    ton: 0.1,
    cati: 10,
    usdt: 5
  };

  const NETWORK_OPTIONS = {
    ton: ['TON Mainnet'],
    cati: ['TON Mainnet', 'BEP20 (BSC)', 'ERC20 (Ethereum)'],
    usdt: ['TRC20 (Tron)', 'ERC20 (Ethereum)', 'BEP20 (BSC)', 'TON Mainnet']
  };

  const NETWORK_FEES = {
    'TON Mainnet': 0.05,
    'BEP20 (BSC)': 0.5,
    'ERC20 (Ethereum)': 1.0,
    'TRC20 (Tron)': 1.0
  };

  const handleConvert = async (e) => {
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

    const minPoints = 1000;
    if (points < minPoints) {
      addNotification(`Minimum conversion is ${minPoints.toLocaleString()} points`, 'error');
      return;
    }
    
    const cryptoAmount = points / CONVERSION_RATES[selectedCurrency];
    
    try {
      setLoading(true);

      // Update points in database
      await db.updateUser(user.userId, {
        points: user.points - points,
        vipLevel: user.vipLevel,
        exp: user.exp,
        completedTasks: user.completedTasks,
        dayStreak: user.dayStreak,
        lastClaim: user.lastClaim
      });
      
      // Update crypto balance in database
      const newBalance = user.balance[selectedCurrency] + cryptoAmount;
      await db.updateBalance(user.userId, selectedCurrency, newBalance);

      // Record conversion in history
      await db.recordConversion(user.userId, {
        points: points,
        currency: selectedCurrency.toUpperCase(),
        amount: cryptoAmount,
        rate: CONVERSION_RATES[selectedCurrency]
      });

      // Log activity
      await db.logActivity(user.userId, {
        type: 'conversion',
        description: `Converted ${points.toLocaleString()} points to ${cryptoAmount.toFixed(4)} ${selectedCurrency.toUpperCase()}`,
        pointsChange: -points
      });
      
      // Update local state
      updateUser({
        points: user.points - points,
        balance: {
          ...user.balance,
          [selectedCurrency]: newBalance
        }
      });
      
      addNotification(`Successfully converted ${points.toLocaleString()} points to ${cryptoAmount.toFixed(4)} ${selectedCurrency.toUpperCase()}!`, 'success');
      setConvertAmount('');
      
      // Reload transaction history
      await loadTransactionHistory();
    } catch (error) {
      console.error('Error converting points:', error);
      addNotification('Failed to convert points. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (amount < MIN_WITHDRAW[selectedCurrency]) {
      addNotification(`Minimum withdrawal is ${MIN_WITHDRAW[selectedCurrency]} ${selectedCurrency.toUpperCase()}`, 'error');
      return;
    }
    
    if (amount > user.balance[selectedCurrency]) {
      addNotification(`Insufficient ${selectedCurrency.toUpperCase()} balance`, 'error');
      return;
    }
    
    if (!withdrawAddress.trim()) {
      addNotification('Please enter a wallet address', 'error');
      return;
    }

    if (!withdrawNetwork) {
      addNotification('Please select a network', 'error');
      return;
    }

    // Validate address format based on network
    if (!validateAddress(withdrawAddress, withdrawNetwork)) {
      addNotification('Invalid wallet address format for selected network', 'error');
      return;
    }
    
    try {
      setLoading(true);

      // Create withdrawal request in database
      const requestId = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const networkFee = NETWORK_FEES[withdrawNetwork] || 0;
      const netAmount = amount - networkFee;

      await db.createWithdrawalRequest({
        id: requestId,
        user_id: user.userId,
        username: user.username,
        currency: selectedCurrency,
        amount: amount,
        wallet_address: withdrawAddress,
        network: withdrawNetwork,
        memo: withdrawMemo || null,
        network_fee: networkFee,
        net_amount: netAmount,
        status: 'pending'
      });
      
      // Update crypto balance in database
      const newBalance = user.balance[selectedCurrency] - amount;
      await db.updateBalance(user.userId, selectedCurrency, newBalance);

      // Log activity
      await db.logActivity(user.userId, {
        type: 'withdrawal_request',
        description: `Requested withdrawal of ${amount} ${selectedCurrency.toUpperCase()} via ${withdrawNetwork}`,
        pointsChange: 0
      });
      
      // Update local state
      updateUser({
        balance: {
          ...user.balance,
          [selectedCurrency]: newBalance
        }
      });
      
      addNotification(`Withdrawal request submitted! Request ID: ${requestId}`, 'success');
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawMemo('');
      setWithdrawNetwork('');

      // Reload withdrawal requests
      await loadWithdrawalRequests();
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      addNotification('Failed to submit withdrawal request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = (address, network) => {
    // Basic validation - can be enhanced
    if (!address || address.length < 10) return false;

    if (network.includes('TON')) {
      return address.startsWith('EQ') || address.startsWith('UQ');
    }
    if (network.includes('BEP20') || network.includes('ERC20')) {
      return address.startsWith('0x') && address.length === 42;
    }
    if (network.includes('TRC20')) {
      return address.startsWith('T') && address.length === 34;
    }
    return true;
  };

  const calculateCrypto = (points) => {
    return points ? (points / CONVERSION_RATES[selectedCurrency]).toFixed(6) : '0';
  };

  const calculatePoints = (crypto) => {
    return crypto ? (crypto * CONVERSION_RATES[selectedCurrency]).toLocaleString() : '0';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'completed': return '#2196f3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="conversion-page">
      <div className="page-header">
        <h1 className="page-title">💰 Convert & Withdraw</h1>
        <p className="page-subtitle">Convert points to crypto and withdraw to your wallet</p>
      </div>

      {/* Balance Overview */}
      <div className="balance-overview">
        <div className="balance-card-conv points">
          <div className="balance-icon">💎</div>
          <div className="balance-info">
            <span className="balance-label">Available Points</span>
            <span className="balance-value">{user.points.toLocaleString()}</span>
          </div>
        </div>
        <div className="balance-card-conv ton">
          <div className="balance-icon">💎</div>
          <div className="balance-info">
            <span className="balance-label">TON Balance</span>
            <span className="balance-value">{user.balance.ton.toFixed(6)}</span>
          </div>
        </div>
        <div className="balance-card-conv cati">
          <div className="balance-icon">🐱</div>
          <div className="balance-info">
            <span className="balance-label">CATI Balance</span>
            <span className="balance-value">{user.balance.cati.toFixed(6)}</span>
          </div>
        </div>
        <div className="balance-card-conv usdt">
          <div className="balance-icon">💵</div>
          <div className="balance-info">
            <span className="balance-label">USDT Balance</span>
            <span className="balance-value">{user.balance.usdt.toFixed(6)}</span>
          </div>
        </div>
      </div>

      {/* VIP Conversion Rate Info */}
      <div className="rate-info">
        <h3>📊 Your Conversion Rate {vipTier && `(${vipTier.tier_name} ${vipTier.tier_icon})`}</h3>
        <p className="rate-text">1 {selectedCurrency.toUpperCase()} = {CONVERSION_RATES[selectedCurrency].toLocaleString()} Points</p>
        <p className="rate-subtext">
          {vipTier && vipTier.tier_name !== 'Bronze' && 
            `You get ${((1 - CONVERSION_RATES[selectedCurrency] / 10000) * 100).toFixed(0)}% better rate as ${vipTier.tier_name} member!`
          }
        </p>
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
          💸 Withdraw Crypto
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Transaction History
        </button>
      </div>

      {/* Convert Tab */}
      {activeTab === 'convert' && (
        <div className="tab-content">
          <form onSubmit={handleConvert} className="conversion-form">
            <div className="form-group">
              <label>Select Cryptocurrency</label>
              <select 
                value={selectedCurrency} 
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="currency-select"
              >
                <option value="ton">💎 TON (Toncoin)</option>
                <option value="cati">🐱 CATI (Catizen)</option>
                <option value="usdt">💵 USDT (Tether)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Points to Convert</label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="Enter points amount"
                min="1000"
                step="1"
                disabled={loading}
              />
              <div className="conversion-preview">
                <span>You will receive:</span>
                <span className="preview-amount">{calculateCrypto(convertAmount)} {selectedCurrency.toUpperCase()}</span>
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setConvertAmount('10000')} disabled={loading}>10K</button>
              <button type="button" onClick={() => setConvertAmount('50000')} disabled={loading}>50K</button>
              <button type="button" onClick={() => setConvertAmount('100000')} disabled={loading}>100K</button>
              <button type="button" onClick={() => setConvertAmount(user.points.toString())} disabled={loading}>Max</button>
            </div>

            <button type="submit" className="submit-btn convert-btn" disabled={loading}>
              {loading ? '⏳ Converting...' : '🔄 Convert to Crypto'}
            </button>
          </form>

          <div className="info-box">
            <h4>ℹ️ Conversion Info</h4>
            <ul>
              <li>✅ Instant conversion</li>
              <li>✅ No conversion fees</li>
              <li>✅ Minimum: 1,000 points</li>
              <li>✅ Better rates for VIP members</li>
              <li>✅ Converted crypto appears immediately</li>
            </ul>
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="tab-content">
          <form onSubmit={handleWithdraw} className="conversion-form withdrawal-form">
            <div className="form-group">
              <label>Select Cryptocurrency</label>
              <select 
                value={selectedCurrency} 
                onChange={(e) => {
                  setSelectedCurrency(e.target.value);
                  setWithdrawNetwork('');
                }}
                className="currency-select"
                disabled={loading}
              >
                <option value="ton">💎 TON (Toncoin)</option>
                <option value="cati">🐱 CATI (Catizen)</option>
                <option value="usdt">💵 USDT (Tether)</option>
              </select>
              <span className="form-hint">Available: {user.balance[selectedCurrency].toFixed(6)} {selectedCurrency.toUpperCase()}</span>
            </div>

            <div className="form-group">
              <label>Withdrawal Amount</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Min: ${MIN_WITHDRAW[selectedCurrency]} ${selectedCurrency.toUpperCase()}`}
                min={MIN_WITHDRAW[selectedCurrency]}
                step="0.000001"
                disabled={loading}
              />
              <div className="conversion-preview">
                <span>Equivalent to:</span>
                <span className="preview-amount">{calculatePoints(withdrawAmount)} Points</span>
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setWithdrawAmount(MIN_WITHDRAW[selectedCurrency].toString())} disabled={loading}>Min</button>
              <button type="button" onClick={() => setWithdrawAmount((user.balance[selectedCurrency] * 0.25).toFixed(6))} disabled={loading}>25%</button>
              <button type="button" onClick={() => setWithdrawAmount((user.balance[selectedCurrency] * 0.5).toFixed(6))} disabled={loading}>50%</button>
              <button type="button" onClick={() => setWithdrawAmount(user.balance[selectedCurrency].toFixed(6))} disabled={loading}>Max</button>
            </div>

            <div className="form-group">
              <label>Select Network</label>
              <select 
                value={withdrawNetwork} 
                onChange={(e) => setWithdrawNetwork(e.target.value)}
                className="network-select"
                disabled={loading}
                required
              >
                <option value="">Choose network...</option>
                {NETWORK_OPTIONS[selectedCurrency].map(network => (
                  <option key={network} value={network}>
                    {network} (Fee: {NETWORK_FEES[network] || 0} {selectedCurrency.toUpperCase()})
                  </option>
                ))}
              </select>
              <span className="form-hint">⚠️ Make sure to select the correct network</span>
            </div>

            <div className="form-group">
              <label>Wallet Address</label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder={`Enter your ${selectedCurrency.toUpperCase()} wallet address`}
                disabled={loading}
                required
              />
              <span className="form-hint">⚠️ Double-check your address. Transactions cannot be reversed!</span>
            </div>

            {(selectedCurrency === 'ton' || withdrawNetwork.includes('TON')) && (
              <div className="form-group">
                <label>Memo/Tag (Optional)</label>
                <input
                  type="text"
                  value={withdrawMemo}
                  onChange={(e) => setWithdrawMemo(e.target.value)}
                  placeholder="Enter memo if required by exchange"
                  disabled={loading}
                />
                <span className="form-hint">Some exchanges require a memo/tag</span>
              </div>
            )}

            {withdrawNetwork && withdrawAmount && (
              <div className="withdrawal-summary">
                <h4>📋 Withdrawal Summary</h4>
                <div className="summary-row">
                  <span>Amount:</span>
                  <span>{withdrawAmount} {selectedCurrency.toUpperCase()}</span>
                </div>
                <div className="summary-row">
                  <span>Network Fee:</span>
                  <span>-{NETWORK_FEES[withdrawNetwork] || 0} {selectedCurrency.toUpperCase()}</span>
                </div>
                <div className="summary-row total">
                  <span>You will receive:</span>
                  <span>{(parseFloat(withdrawAmount) - (NETWORK_FEES[withdrawNetwork] || 0)).toFixed(6)} {selectedCurrency.toUpperCase()}</span>
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn withdraw-btn" disabled={loading}>
              {loading ? '⏳ Processing...' : '💸 Request Withdrawal'}
            </button>
          </form>

          <div className="info-box warning">
            <h4>⚠️ Important Withdrawal Information</h4>
            <ul>
              <li>🔒 All withdrawals are manually reviewed for security</li>
              <li>⏱️ Processing time: 24-48 hours</li>
              <li>💰 Minimum withdrawal: {MIN_WITHDRAW[selectedCurrency]} {selectedCurrency.toUpperCase()}</li>
              <li>🌐 Network fees are deducted from withdrawal amount</li>
              <li>✅ Verify your wallet address and network carefully</li>
              <li>📧 You'll receive notifications about your withdrawal status</li>
              <li>❌ Transactions cannot be reversed once processed</li>
            </ul>
          </div>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'history' && (
        <div className="tab-content">
          <div className="history-section">
            <h3>🔄 Conversion History</h3>
            {transactionHistory.length > 0 ? (
              <div className="history-list">
                {transactionHistory.map((tx) => (
                  <div key={tx.id} className="history-item conversion">
                    <div className="history-icon">🔄</div>
                    <div className="history-details">
                      <div className="history-title">
                        Points Conversion
                      </div>
                      <div className="history-info">
                        {tx.points_converted.toLocaleString()} points → {tx.amount_received.toFixed(6)} {tx.currency}
                      </div>
                      <div className="history-date">{formatDate(tx.created_at)}</div>
                    </div>
                    <div className="history-amount success">
                      +{tx.amount_received.toFixed(6)} {tx.currency}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No conversion history yet</p>
                <span>Your conversions will appear here</span>
              </div>
            )}
          </div>

          <div className="history-section">
            <h3>💸 Withdrawal Requests</h3>
            {withdrawalRequests.length > 0 ? (
              <div className="history-list">
                {withdrawalRequests.map((req) => (
                  <div key={req.id} className="history-item withdrawal">
                    <div className="history-icon" style={{ color: getStatusColor(req.status) }}>
                      {getStatusIcon(req.status)}
                    </div>
                    <div className="history-details">
                      <div className="history-title">
                        Withdrawal Request
                        <span className="request-id">#{req.id}</span>
                      </div>
                      <div className="history-info">
                        {req.amount} {req.currency.toUpperCase()} via {req.network || 'N/A'}
                      </div>
                      <div className="history-address">
                        To: {req.wallet_address.substring(0, 10)}...{req.wallet_address.substring(req.wallet_address.length - 6)}
                      </div>
                      <div className="history-date">{formatDate(req.request_date)}</div>
                    </div>
                    <div className="history-status">
                      <span 
                        className={`status-badge ${req.status}`}
                        style={{ backgroundColor: getStatusColor(req.status) }}
                      >
                        {req.status.toUpperCase()}
                      </span>
                      {req.status === 'completed' && req.processed_date && (
                        <div className="processed-date">
                          Completed: {formatDate(req.processed_date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No withdrawal requests yet</p>
                <span>Your withdrawal requests will appear here</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversionPage;
