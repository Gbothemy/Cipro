import React, { useState } from 'react';
import { COMPANY_WALLETS, generatePaymentLink, generateQRData } from '../config/walletConfig';
import './DepositModal.css';

function DepositModal({ isOpen, onClose, user, addNotification, subscriptionTier = null, billingCycle = 'monthly' }) {
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  
  // If subscription tier is provided, set the amount automatically
  const isSubscription = subscriptionTier !== null;
  const subscriptionAmount = isSubscription 
    ? (billingCycle === 'yearly' ? subscriptionTier.priceYearly : subscriptionTier.price)
    : null;

  if (!isOpen) return null;

  const wallet = COMPANY_WALLETS[selectedCurrency];
  const paymentLink = generatePaymentLink(selectedCurrency, amount);
  const qrData = generateQRData(selectedCurrency, amount);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    addNotification('Wallet address copied to clipboard!', 'success');
  };

  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      addNotification('Payment link copied to clipboard!', 'success');
    }
  };

  const handleOpenTrustWallet = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank');
    }
  };

  const handleSubmitDeposit = async () => {
    if (!amount || parseFloat(amount) < wallet.minDeposit) {
      addNotification(`Minimum deposit is ${wallet.minDeposit} ${selectedCurrency}`, 'error');
      return;
    }

    // In production, this would create a deposit record in the database
    addNotification(`Deposit request created! Send ${amount} ${selectedCurrency} to the address shown.`, 'info');
    
    // TODO: Create deposit record in database
    // await db.createDepositRequest({
    //   user_id: user.userId,
    //   currency: selectedCurrency,
    //   amount: parseFloat(amount),
    //   wallet_address: wallet.address,
    //   status: 'pending'
    // });
  };

  return (
    <div className="deposit-modal-overlay" onClick={onClose}>
      <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isSubscription ? '💎 VIP Subscription Payment' : '💰 Deposit Funds'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Subscription Info */}
          {isSubscription && (
            <div className="subscription-info-card">
              <div className="sub-header">
                <span className="sub-icon">{subscriptionTier.icon}</span>
                <div>
                  <h3>{subscriptionTier.name} Tier</h3>
                  <p>Levels {subscriptionTier.levelRange}</p>
                </div>
              </div>
              <div className="sub-details">
                <div className="sub-row">
                  <span>Billing Cycle:</span>
                  <strong>{billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</strong>
                </div>
                <div className="sub-row">
                  <span>Amount:</span>
                  <strong className="amount-highlight">${subscriptionAmount} USD</strong>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="sub-row savings">
                    <span>💰 You Save:</span>
                    <strong>${(subscriptionTier.price * 12 - subscriptionTier.priceYearly).toFixed(2)}/year</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Currency Selection */}
          <div className="form-group">
            <label>Select Payment Currency</label>
            <div className="currency-grid">
              {Object.entries(COMPANY_WALLETS).map(([key, info]) => (
                info.address && (
                  <button
                    key={key}
                    className={`currency-btn ${selectedCurrency === key ? 'active' : ''}`}
                    onClick={() => setSelectedCurrency(key)}
                  >
                    <span className="currency-icon">{info.icon}</span>
                    <span className="currency-name">{key}</span>
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Amount Input */}
          {!isSubscription && (
            <div className="form-group">
              <label>Amount (Optional)</label>
              <input
                type="number"
                placeholder={`Min: ${wallet.minDeposit} ${selectedCurrency}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={wallet.minDeposit}
                step="0.01"
              />
              <small>Minimum deposit: {wallet.minDeposit} {selectedCurrency}</small>
            </div>
          )}
          
          {isSubscription && (
            <div className="subscription-amount-display">
              <div className="amount-box">
                <span className="amount-label">Total Amount to Pay:</span>
                <span className="amount-value">${subscriptionAmount} USD</span>
                <small>≈ {subscriptionAmount} {selectedCurrency} (at current rate)</small>
              </div>
            </div>
          )}

          {/* Wallet Information */}
          <div className="wallet-info-card">
            <div className="info-row">
              <span className="label">Network:</span>
              <span className="value">{wallet.network}</span>
            </div>
            <div className="info-row">
              <span className="label">Confirmations:</span>
              <span className="value">{wallet.confirmations} blocks</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="wallet-address-section">
            <label>Deposit Address</label>
            <div className="address-box">
              <code>{wallet.address}</code>
              <button className="copy-btn" onClick={handleCopyAddress} title="Copy address">
                📋
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="qr-section">
            <button 
              className="show-qr-btn"
              onClick={() => setShowQR(!showQR)}
            >
              {showQR ? '📱 Hide QR Code' : '📱 Show QR Code'}
            </button>
            
            {showQR && (
              <div className="qr-code-container">
                <div className="qr-placeholder">
                  <p>QR Code</p>
                  <small>{wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}</small>
                  <p style={{fontSize: '12px', marginTop: '10px', color: '#666'}}>
                    Scan with your wallet app
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {wallet.trustWalletLink && (
              <>
                <button 
                  className="trust-wallet-btn"
                  onClick={handleOpenTrustWallet}
                >
                  <span>🔗</span>
                  Open in Trust Wallet
                </button>
                <button 
                  className="copy-link-btn"
                  onClick={handleCopyLink}
                >
                  📋 Copy Payment Link
                </button>
              </>
            )}
            <button 
              className="submit-btn"
              onClick={handleSubmitDeposit}
            >
              ✅ I've Sent the Payment
            </button>
          </div>

          {/* Important Notice */}
          <div className="notice-box">
            <h4>⚠️ Important Notice</h4>
            <ul>
              <li>Only send {selectedCurrency} to this address</li>
              <li>Sending other tokens may result in permanent loss</li>
              <li>Minimum deposit: {wallet.minDeposit} {selectedCurrency}</li>
              <li>Deposits require {wallet.confirmations} confirmations</li>
              <li>Processing time: 10-30 minutes after confirmations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepositModal;
