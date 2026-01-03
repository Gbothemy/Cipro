import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';

function LuckyDrawAdmin({ addNotification }) {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [filter]);

  const loadPayments = async () => {
    try {
      const filterStatus = filter === 'all' ? null : filter;
      const paymentsData = await db.getAllLuckyDrawPayments(filterStatus, 100);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
      addNotification('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await db.getLuckyDrawStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    setProcessingPayment(paymentId);
    try {
      const result = await db.updateLuckyDrawPaymentStatus(
        paymentId, 
        action, 
        'admin' // processed_by
      );

      if (result.success) {
        addNotification(
          `Payment ${action === 'approved' ? 'approved' : 'rejected'} successfully!`, 
          action === 'approved' ? 'success' : 'info'
        );
        await loadPayments();
        await loadStats();
      } else {
        throw new Error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      addNotification(`Failed to ${action} payment`, 'error');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount, currency) => {
    return `$${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPayments || 0}</div>
          <div className="text-sm text-gray-600">Total Payments</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.approvedPayments || 0}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-primary">${(stats.totalRevenue || 0).toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Payments', count: stats.totalPayments },
              { key: 'pending', label: 'Pending', count: stats.pendingPayments },
              { key: 'approved', label: 'Approved', count: stats.approvedPayments },
              { key: 'rejected', label: 'Rejected', count: stats.rejectedPayments }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count || 0})
              </button>
            ))}
          </nav>
        </div>

        {/* Payments List */}
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium mb-2">No payments found</h3>
              <p>No {filter === 'all' ? '' : filter} payments to display.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {payment.username} ({payment.user_id.slice(-6)})
                        </h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <div className="font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Tickets:</span>
                          <div className="font-medium">{payment.ticket_quantity}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Network:</span>
                          <div className="font-medium">{payment.network}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <div className="font-medium">{formatDate(payment.created_at)}</div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <span className="text-gray-500 text-sm">Wallet Address:</span>
                          <div className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
                            {payment.wallet_address}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">Transaction Hash:</span>
                          <div className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
                            {payment.transaction_hash}
                          </div>
                        </div>
                      </div>
                    </div>

                    {payment.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'approved')}
                          disabled={processingPayment === payment.id}
                          className="btn btn-success btn-sm"
                        >
                          {processingPayment === payment.id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                              Processing...
                            </div>
                          ) : (
                            '✅ Approve'
                          )}
                        </button>
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'rejected')}
                          disabled={processingPayment === payment.id}
                          className="btn btn-error btn-sm"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}

                    {payment.status !== 'pending' && payment.processed_date && (
                      <div className="text-sm text-gray-500 ml-4">
                        Processed: {formatDate(payment.processed_date)}
                        {payment.processed_by && <div>By: {payment.processed_by}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LuckyDrawAdmin;