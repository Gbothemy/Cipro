import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import './ConversionPage.css';

function ConversionPage({ user, updateUser, addNotification }) {
  const [convertAmount, setConvertAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('usdt');
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

  // Conversion rates based on real crypto prices (Updated Nov 2025)
  // Base: 10,000 points = $1 USD (1 USDT or 1 USDC)
  // SOL ≈ $140 → 1,400,000 points = 1 SOL
  // ETH ≈ $3,300 → 33,000,000 points = 1 ETH
  // USDT = $1 → 10,000 points = 1 USDT
  // USDC = $1 → 10,000 points = 1 USDC
  
  const BASE_CONVERSION_RATES = {
    sol: 1400000,    // 1 SOL = $140 = 1,400,000 points
    eth: 33000000,   // 1 ETH = $3,300 = 33,000,000 points
    usdt: 10000,     // 1 USDT = $1 = 10,000 points
    usdc: 10000      // 1 USDC = $1 = 10,000 points
  };

  // Apply VIP tier discount if available
  const CONVERSION_RATES = {
    sol: vipTier?.conversion_rate ? Math.floor(BASE_CONVERSION_RATES.sol * (vipTier.conversion_rate / 10000)) : BASE_CONVERSION_RATES.sol,
    eth: vipTier?.conversion_rate ? Math.floor(BASE_CONVERSION_RATES.eth * (vipTier.conversion_rate / 10000)) : BASE_CONVERSION_RATES.eth,
    usdt: vipTier?.conversion_rate || BASE_CONVERSION_RATES.usdt,
    usdc: vipTier?.conversion_rate || BASE_CONVERSION_RATES.usdc
  };

  // Minimum withdrawal amounts based on real crypto values
  // SOL ≈ $140 → 0.1 SOL = $14 minimum
  // ETH ≈ $3,300 → 0.005 ETH = $16.50 minimum  
  // USDT = $1 → $15 minimum
  // USDC = $1 → $15 minimum
  const MIN_WITHDRAW = {
    sol: 0.1,      // ~$14 (reasonable for Solana network fees)
    eth: 0.005,    // ~$16.50 (covers Ethereum gas fees)
    usdt: 15,      // $15 minimum
    usdc: 15       // $15 minimum
  };

  const NETWORK_OPTIONS = {
    sol: ['Solana Mainnet'],
    eth: ['Ethereum Mainnet', 'Arbitrum', 'Optimism', 'Polygon', 'BSC (BEP20)'],
    usdt: ['TRC20 (Tron)', 'ERC20 (Ethereum)', 'BEP20 (BSC)', 'Polygon', 'Solana', 'Arbitrum'],
    usdc: ['Ethereum Mainnet', 'Solana (SPL)', 'Polygon', 'Arbitrum', 'Optimism', 'BSC (BEP20)']
  };

  // Network fees based on current blockchain costs
  const NETWORK_FEES = {
    'Solana Mainnet': 0.001,    // ~$0.14 (typical SOL transfer)
    'Solana (SPL)': 0.002,      // ~$0.28 (SPL token transfer)
    'Ethereum Mainnet': 0.002,  // ~$6.60 (varies with gas)
    'Arbitrum': 0.0005,         // ~$1.65 (L2 cheaper)
    'Optimism': 0.1,
    'Polygon': 0.1,
    'BSC (BEP20)': 0.8,
    'TRC20 (Tron)': 1.0,
    'ERC20 (Ethereum)': 5.0
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
    
    // Calculate 10% company fee
    const companyFeePoints = Math.floor(points * 0.10);
    const userReceivesPoints = points - companyFeePoints;
    const userReceivesCrypto = userReceivesPoints / CONVERSION_RATES[selectedCurrency];
    const companyReceivesCrypto = companyFeePoints / CONVERSION_RATES[selectedCurrency];
    
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
      
      // Update crypto balance in database (user gets 90%)
      const newBalance = user.balance[selectedCurrency] + userReceivesCrypto;
      await db.updateBalance(user.userId, selectedCurrency, newBalance);

      // Record company revenue (10% fee)
      await db.recordRevenue({
        user_id: user.userId,
        type: 'conversion_fee',
        source: selectedCurrency,
        amount: companyReceivesCrypto,
        feePercentage: 10,
        originalAmount: cryptoAmount,
        description: `10% conversion fee from ${points.toLocaleString()} points to ${selectedCurrency.toUpperCase()}`
      });

      // Record conversion in history
      await db.recordConversion(user.userId, {
        points: points,
        currency: selectedCurrency.toUpperCase(),
        amount: userReceivesCrypto,
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
      
      addNotification(`Successfully converted ${points.toLocaleString()} points to ${userReceivesCrypto.toFixed(6)} ${selectedCurrency.toUpperCase()} (10% platform fee applied)`, 'success');
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

      // Calculate fees
      const networkFee = NETWORK_FEES[withdrawNetwork] || 0;
      const companyFee = amount * 0.05; // 5% company fee
      const totalFees = networkFee + companyFee;
      const netAmount = amount - totalFees;

      // Create withdrawal request in database
      const requestId = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
        company_fee: companyFee,
        net_amount: netAmount,
        status: 'pending'
      });

      // Record company revenue (5% withdrawal fee)
      await db.recordRevenue({
        user_id: user.userId,
        type: 'withdrawal_fee',
        source: selectedCurrency,
        amount: companyFee,
        feePercentage: 5,
        originalAmount: amount,
        description: `5% withdrawal fee from ${amount} ${selectedCurrency.toUpperCase()} withdrawal`
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

    if (network.includes('Solana') || network.includes('SPL')) {
      // Solana addresses are Base58, 32-44 characters
      return address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
    }
    if (network.includes('Ethereum') || network.includes('BEP20') || network.includes('Arbitrum') || network.includes('Optimism') || network.includes('Polygon')) {
      // EVM addresses start with 0x and are 42 characters
      return address.startsWith('0x') && address.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    if (network.includes('TRC20')) {
      // Tron addresses start with T and are 34 characters
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
        <div className="balance-card-conv sol">
          <div className="balance-icon">◎</div>
          <div className="balance-info">
            <span className="balance-label">SOL Balance</span>
            <span className="balance-value">{user.balance.sol.toFixed(6)}</span>
          </div>
        </div>
        <div className="balance-card-conv eth">
          <div className="balance-icon">Ξ</div>
          <div className="balance-info">
            <span className="balance-label">ETH Balance</span>
            <span className="balance-value">{user.balance.eth.toFixed(6)}</span>
          </div>
        </div>
        <div className="balance-card-conv usdt">
          <div className="balance-icon">💵</div>
          <div className="balance-info">
            <span className="balance-label">USDT Balance</span>
            <span className="balance-value">{user.balance.usdt.toFixed(6)}</span>
          </div>
        </div>
        <div className="balance-card-conv usdc">
          <div className="balance-icon">💵</div>
          <div className="balance-info">
            <span className="balance-label">USDC Balance</span>
            <span className="balance-value">{user.balance.usdc.toFixed(6)}</span>
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
                <option value="sol">◎ SOL (Solana)</option>
                <option value="eth">Ξ ETH (Ethereum)</option>
                <option value="usdt">💵 USDT (Tether) - Main</option>
                <option value="usdc">💵 USDC (USD Coin)</option>
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
                <option value="sol">◎ SOL (Solana)</option>
                <option value="eth">Ξ ETH (Ethereum)</option>
                <option value="usdt">💵 USDT (Tether) - Main</option>
                <option value="usdc">💵 USDC (USD Coin)</option>
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
                <div className="summary-row">
                  <span>Platform Fee (5%):</span>
                  <span>-{(parseFloat(withdrawAmount) * 0.05).toFixed(6)} {selectedCurrency.toUpperCase()}</span>
                </div>
                <div className="summary-row total">
                  <span>You will receive:</span>
                  <span>{(parseFloat(withdrawAmount) - (NETWORK_FEES[withdrawNetwork] || 0) - (parseFloat(withdrawAmount) * 0.05)).toFixed(6)} {selectedCurrency.toUpperCase()}</span>
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
