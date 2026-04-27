'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const CRYPTO_INFO = {
  sol: { 
    name: 'Solana', 
    icon: '◎', 
    color: '#14F195',
    network: 'Solana Mainnet',
    walletAddress: '7zZ4cE3CqtA1p8ZVweBRTUesWr9PZ8GYidmnMFUar5Xi',
    minDeposit: 0.01,
  },
  eth: { 
    name: 'Ethereum', 
    icon: 'Ξ', 
    color: '#627EEA',
    network: 'Ethereum Mainnet (ERC-20)',
    walletAddress: '0x84e44cbb161dce433e3dad575cd6b055dbc71009',
    minDeposit: 0.001,
  },
  usdt: { 
    name: 'Tether', 
    icon: '₮', 
    color: '#26A17B',
    network: 'Ethereum (ERC-20)',
    walletAddress: '0x84e44cbb161dce433e3dad575cd6b055dbc71009',
    minDeposit: 5,
  },
  usdc: { 
    name: 'USD Coin', 
    icon: '$', 
    color: '#2775CA',
    network: 'Ethereum (ERC-20)',
    walletAddress: '0x84e44cbb161dce433e3dad575cd6b055dbc71009',
    minDeposit: 5,
  },
};

export default function DepositPage() {
  const { user, addNotification } = useStore();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      loadDepositHistory();
    }
  }, [user?.userId]);

  const loadDepositHistory = async () => {
    try {
      const history = await db.getDepositRequests(user.userId);
      setDeposits(history);
    } catch (error) {
      console.error('Error loading deposit history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    addNotification({
      type: 'success',
      title: 'Copied!',
      message: 'Wallet address copied to clipboard',
    });
  };

  const handleSubmitDeposit = async () => {
    // Validation
    if (!selectedCrypto) {
      addNotification({
        type: 'error',
        title: 'No Crypto Selected',
        message: 'Please select a cryptocurrency first',
      });
      return;
    }

    if (!amount || amount.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Missing Amount',
        message: 'Please enter the amount you sent',
      });
      return;
    }

    if (!txHash || txHash.trim() === '') {
      addNotification({
        type: 'error',
        title: 'Missing Transaction Hash',
        message: 'Please enter your transaction hash',
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      addNotification({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount',
      });
      return;
    }

    const minDeposit = CRYPTO_INFO[selectedCrypto].minDeposit;

    if (depositAmount < minDeposit) {
      addNotification({
        type: 'error',
        title: 'Amount Too Low',
        message: `Minimum deposit is ${minDeposit} ${selectedCrypto.toUpperCase()}`,
      });
      return;
    }

    setSubmitting(true);
    try {
      // Submit deposit request to backend for verification
      const result = await db.createDepositRequest({
        userId: user.userId,
        currency: selectedCrypto,
        amount: depositAmount,
        txHash: txHash.trim(),
        walletAddress: CRYPTO_INFO[selectedCrypto].walletAddress,
        status: 'pending',
      });

      console.log('Deposit request created:', result);

      addNotification({
        type: 'success',
        title: '✅ Deposit Submitted!',
        message: 'Your deposit is being verified. This usually takes 5-15 minutes.',
      });

      // Reset form
      setAmount('');
      setTxHash('');
      setSelectedCrypto(null);
      
      // Reload deposit history
      loadDepositHistory();
    } catch (error) {
      console.error('Deposit submission error:', error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit deposit request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Deposit Crypto</h1>
        <p className="text-muted mt-1">Add funds to your account to purchase VIP subscriptions and lucky draw tickets</p>
      </div>

      {/* Important Notice */}
      <div className="card p-5 mb-6" style={{ background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)' }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-white mb-2">Important Information</h3>
            <ul className="text-xs text-muted flex-col gap-2">
              <li>• Only deposited funds can be used for VIP subscriptions and lucky draw tickets</li>
              <li>• Earned funds from games cannot be used for purchases</li>
              <li>• Deposits are verified manually and take 5-15 minutes</li>
              <li>• Make sure to send to the correct wallet address and network</li>
              <li>• Save your transaction hash for verification</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Select Cryptocurrency */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">1. Select Cryptocurrency</h3>
        <div className="grid gap-3">
          {Object.entries(CRYPTO_INFO).map(([currency, info]) => (
            <button
              key={currency}
              onClick={() => setSelectedCrypto(currency)}
              className={selectedCrypto === currency ? 'btn btn-primary flex items-center justify-between p-4' : 'btn flex items-center justify-between p-4'}
              style={{ 
                borderRadius: '0.75rem',
                background: selectedCrypto === currency ? undefined : 'rgba(255,255,255,0.05)',
                border: selectedCrypto === currency ? '2px solid rgba(102,126,234,0.5)' : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.5rem', color: info.color }}>{info.icon}</span>
                <div className="text-left">
                  <p className="font-semibold text-white">{info.name}</p>
                  <p className="text-xs text-dim">Min: {info.minDeposit} {currency.toUpperCase()}</p>
                </div>
              </div>
              {selectedCrypto === currency && <span className="text-success">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Instructions */}
      {selectedCrypto && (
        <>
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">2. Send {CRYPTO_INFO[selectedCrypto].name}</h3>
            
            <div className="mb-4">
              <p className="text-xs text-dim mb-2">Network</p>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-sm text-white">{CRYPTO_INFO[selectedCrypto].network}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-dim mb-2">Wallet Address</p>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', wordBreak: 'break-all' }}>
                  <p className="text-sm text-white font-mono">{CRYPTO_INFO[selectedCrypto].walletAddress}</p>
                </div>
                <button
                  onClick={() => handleCopyAddress(CRYPTO_INFO[selectedCrypto].walletAddress)}
                  className="btn btn-primary px-4"
                  style={{ borderRadius: '0.75rem' }}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-xs text-success">
                💡 Send {CRYPTO_INFO[selectedCrypto].name} to the address above. Make sure you're using the correct network!
              </p>
            </div>
          </div>

          {/* Submit Deposit */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">3. Submit Deposit Confirmation</h3>
            
            <div className="mb-4">
              <label className="text-xs text-dim mb-2 block">Amount Sent</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: ${CRYPTO_INFO[selectedCrypto].minDeposit}`}
                className="input"
                step="0.0001"
                min={CRYPTO_INFO[selectedCrypto].minDeposit}
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-dim mb-2 block">Transaction Hash (TxID)</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter your transaction hash"
                className="input font-mono"
              />
              <p className="text-xs text-dim mt-1">
                Find this in your wallet after sending the transaction
              </p>
            </div>

            <button
              onClick={handleSubmitDeposit}
              disabled={submitting || !amount || !txHash}
              className="btn btn-primary btn-full py-4"
            >
              {submitting ? '⏳ Submitting...' : '✅ Submit Deposit'}
            </button>
          </div>
        </>
      )}

      {/* Deposit History */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Recent Deposits</h3>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm text-muted">Your deposit history will appear here</p>
            <p className="text-xs text-dim mt-2">Pending deposits are verified within 5-15 minutes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th className="text-left text-xs text-dim font-medium pb-3">Date</th>
                  <th className="text-left text-xs text-dim font-medium pb-3">Currency</th>
                  <th className="text-left text-xs text-dim font-medium pb-3">Amount</th>
                  <th className="text-left text-xs text-dim font-medium pb-3">TX Hash</th>
                  <th className="text-left text-xs text-dim font-medium pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-3 text-sm text-muted">
                      {new Date(deposit.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-medium text-white" style={{ textTransform: 'uppercase' }}>
                        {CRYPTO_INFO[deposit.currency]?.icon} {deposit.currency}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium text-white">
                      {Number(deposit.amount).toFixed(deposit.currency === 'sol' ? 4 : 2)}
                    </td>
                    <td className="py-3 text-xs text-muted font-mono" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deposit.tx_hash}
                    </td>
                    <td className="py-3">
                      <span className={`badge text-xs ${
                        deposit.status === 'approved' ? 'badge-success' :
                        deposit.status === 'rejected' ? 'badge-error' :
                        'badge-warning'
                      }`}>
                        {deposit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="card p-6 mt-6">
        <h3 className="font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">How long does verification take?</p>
            <p className="text-xs text-dim">Deposits are usually verified within 5-15 minutes. During high traffic, it may take up to 1 hour.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">What if I sent to the wrong address?</p>
            <p className="text-xs text-dim">Always double-check the wallet address before sending. Transactions on blockchain are irreversible.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">Can I use earned funds for purchases?</p>
            <p className="text-xs text-dim">No, only deposited funds can be used for VIP subscriptions and lucky draw tickets. Earned funds can be withdrawn.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">What networks are supported?</p>
            <p className="text-xs text-dim">SOL (Solana), ETH (Ethereum ERC-20), USDT (ERC-20/TRC-20), USDC (ERC-20/Solana). Always check the network before sending!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
