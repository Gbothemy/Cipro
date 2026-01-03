import React, { useState } from 'react';
import { db } from '../db/supabase';

function LuckyDrawPayment({ user, onPaymentSuccess, onClose, ticketQuantity, totalCost }) {
  const [paymentMethod, setPaymentMethod] = useState('usdt');
  const [walletAddress, setWalletAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Method, 2: Payment, 3: Confirmation

  const paymentMethods = {
    usdt: {
      name: 'USDT (TRC-20)',
      address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt',
      network: 'Tron (TRC-20)',
      icon: '💵',
      minAmount: 2
    },
    usdc: {
      name: 'USDC (ERC-20)',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
      network: 'Ethereum (ERC-20)',
      icon: '💰',
      minAmount: 2
    },
    sol: {
      name: 'Solana (SOL)',
      address: 'DQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt123456789',
      network: 'Solana Network',
      icon: '◎',
      minAmount: 0.01
    }
  };

  const selectedMethod = paymentMethods[paymentMethod];

  const handlePaymentSubmit = async () => {
    if (!walletAddress || !transactionHash) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment request
      const paymentData = {
        id: `LD-${Date.now()}-${user.userId.slice(-4)}`,
        user_id: user.userId,
        username: user.username,
        payment_type: 'lucky_draw_tickets',
        currency: paymentMethod.toUpperCase(),
        amount: totalCost,
        ticket_quantity: ticketQuantity,
        wallet_address: walletAddress,
        transaction_hash: transactionHash,
        network: selectedMethod.network,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Submit payment for manual verification
      const result = await db.createLuckyDrawPayment(paymentData);
      
      if (result.success) {
        setStep(3);
        // Notify user of successful submission
        setTimeout(() => {
          onPaymentSuccess({
            paymentId: paymentData.id,
            message: 'Payment submitted for verification. You will receive your tickets once payment is confirmed.'
          });
        }, 2000);
      } else {
        throw new Error('Failed to submit payment');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      alert('Failed to submit payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 50000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          maxWidth: '28rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              🎫 Buy Lucky Draw Tickets
            </h2>
            <button 
              onClick={onClose}
              style={{
                color: '#6b7280',
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Order Summary */}
          <div style={{ 
            backgroundColor: '#f9fafb', 
            borderRadius: '0.5rem', 
            padding: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem', fontSize: '1rem' }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{ticketQuantity} Lucky Draw Ticket{ticketQuantity > 1 ? 's' : ''}</span>
              <span style={{ fontWeight: 'bold' }}>${totalCost.toFixed(2)} USD</span>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Select Cryptocurrency</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(paymentMethods).map(([key, method]) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: paymentMethod === key ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      backgroundColor: paymentMethod === key ? '#eff6ff' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{method.icon}</span>
                      <div>
                        <div style={{ fontWeight: '600' }}>{method.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{method.network}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue with {selectedMethod.name}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                style={{
                  color: '#3b82f6',
                  marginBottom: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ← Back to cryptocurrency selection
              </button>
              
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Pay with {selectedMethod.name}
              </h3>

              {/* Payment Instructions */}
              <div style={{ 
                backgroundColor: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <h4 style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Payment Instructions:</h4>
                <ol style={{ fontSize: '0.875rem', color: '#78350f', margin: 0, paddingLeft: '1rem' }}>
                  <li style={{ marginBottom: '0.25rem' }}>1. Send exactly <strong>${totalCost.toFixed(2)} USD</strong> worth of {selectedMethod.name} to the address below</li>
                  <li style={{ marginBottom: '0.25rem' }}>2. Copy the transaction hash after sending</li>
                  <li style={{ marginBottom: '0.25rem' }}>3. Paste it in the form below</li>
                  <li>4. We'll verify and credit your tickets within 24 hours</li>
                </ol>
              </div>

              {/* Payment Address */}
              <div style={{ 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Payment Address:</span>
                  <button
                    onClick={() => copyToClipboard(selectedMethod.address)}
                    style={{
                      color: '#3b82f6',
                      fontSize: '0.875rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '0.75rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #d1d5db', 
                  fontFamily: 'monospace', 
                  fontSize: '0.875rem', 
                  wordBreak: 'break-all' 
                }}>
                  {selectedMethod.address}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Network: {selectedMethod.network}
                </div>
              </div>

              {/* Payment Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Your Wallet Address (for verification)
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your wallet address"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Transaction Hash
                  </label>
                  <input
                    type="text"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash after payment"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing || !walletAddress || !transactionHash}
                  style={{
                    width: '100%',
                    backgroundColor: isProcessing || !walletAddress || !transactionHash ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isProcessing || !walletAddress || !transactionHash ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProcessing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <div style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting Payment...
                    </div>
                  ) : (
                    'Submit Payment for Verification'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.75rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669', marginBottom: '1rem' }}>
                Payment Submitted Successfully!
              </h3>
              <div style={{ 
                backgroundColor: '#ecfdf5', 
                border: '1px solid #10b981', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <p style={{ color: '#047857', margin: 0 }}>
                  Your payment has been submitted for verification. You will receive your 
                  {ticketQuantity} Lucky Draw ticket{ticketQuantity > 1 ? 's' : ''} once 
                  the payment is confirmed (usually within 24 hours).
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                You can check your payment status in the payment history section below.
              </p>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LuckyDrawPayment;