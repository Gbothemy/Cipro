import React, { useState, useEffect, useCallback } from 'react';
import { db, supabase } from '../db/supabase';
import SEOHead from '../components/SEOHead';
import { formatBalance } from '../utils/formatBalance';
import LuckyDrawPayment from '../components/LuckyDrawPayment';

function LuckyDrawPage({ user, updateUser, addNotification }) {
  const [isDrawActive, setIsDrawActive] = useState(false);
  const [countdownData, setCountdownData] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [userTickets, setUserTickets] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPrizePool, setCurrentPrizePool] = useState({
    cipro: 50000,
    usdt: 20,
    vipUpgrade: true
  });
  const [winners, setWinners] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userWinnings, setUserWinnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTicketQuantity, setSelectedTicketQuantity] = useState(1);
  const [userPayments, setUserPayments] = useState([]);

  useEffect(() => {
    checkDrawStatus();
    loadUserTickets();
    loadPrizePool();
    loadRecentWinners();
    loadUserPayments();
    
    // Update timer every second
    const timer = setInterval(checkDrawStatus, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkDrawStatus = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    
    // Draw is active from Friday (5) to Sunday (0)
    const isActive = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    setIsDrawActive(isActive);
    
    if (isActive) {
      // Calculate time until draw ends (Sunday 11:59 PM)
      const endOfSunday = new Date(now);
      const daysUntilSunday = dayOfWeek === 0 ? 0 : (7 - dayOfWeek);
      endOfSunday.setDate(now.getDate() + daysUntilSunday);
      endOfSunday.setHours(23, 59, 59, 999);
      
      const timeLeft = endOfSunday - now;
      setCountdownData(getCountdownData(timeLeft));
    } else {
      // Calculate time until next Friday
      const nextFriday = new Date(now);
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      if (daysUntilFriday === 0 && now.getHours() >= 0) {
        nextFriday.setDate(now.getDate() + 7);
      } else {
        nextFriday.setDate(now.getDate() + daysUntilFriday);
      }
      nextFriday.setHours(0, 0, 0, 0);
      
      const timeLeft = nextFriday - now;
      setCountdownData(getCountdownData(timeLeft));
    }
  }, []);

  const getCountdownData = (milliseconds) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  const loadUserTickets = async () => {
    try {
      const tickets = await db.getUserLuckyDrawTickets(user.userId);
      setUserTickets(tickets);
    } catch (error) {
      console.error('Error loading user tickets:', error);
    }
  };

  const loadPrizePool = async () => {
    try {
      const pool = await db.getCurrentPrizePool();
      setCurrentPrizePool(pool);
      setTotalTickets(pool.totalTickets || 0);
    } catch (error) {
      console.error('Error loading prize pool:', error);
    }
  };

  const loadRecentWinners = async () => {
    try {
      const recentWinners = await db.getRecentLuckyDrawWinners(10);
      setWinners(recentWinners);
    } catch (error) {
      console.error('Error loading recent winners:', error);
    }
  };

  const loadUserPayments = async () => {
    try {
      const payments = await db.getUserLuckyDrawPayments(user.userId);
      setUserPayments(payments);
    } catch (error) {
      console.error('Error loading user payments:', error);
    }
  };

  const handleBuyTickets = (quantity) => {
    setSelectedTicketQuantity(quantity);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentModal(false);
    addNotification(result.message, 'success');
    
    // Reload user payments to show the new pending payment
    await loadUserPayments();
  };

  const buyTickets = async (quantity) => {
    const ticketPrice = 2; // $2 USDT per ticket
    const totalCost = quantity * ticketPrice;
    
    if (user.balance.usdt < totalCost) {
      addNotification(`Insufficient USDT! You need $${totalCost.toFixed(2)} USDT to buy ${quantity} ticket${quantity > 1 ? 's' : ''}.`, 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Deduct USDT and add tickets
      await db.buyLuckyDrawTickets(user.userId, quantity, totalCost);
      
      // Update local state - deduct USDT from balance
      updateUser({
        balance: {
          ...user.balance,
          usdt: user.balance.usdt - totalCost
        }
      });
      
      // Reload data
      await loadUserTickets();
      await loadPrizePool();
      
      addNotification(`🎫 Successfully bought ${quantity} ticket${quantity > 1 ? 's' : ''} for $${totalCost.toFixed(2)} USDT!`, 'success');
    } catch (error) {
      console.error('Error buying tickets:', error);
      addNotification('Failed to buy tickets. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const participateInDraw = async () => {
    if (userTickets === 0) {
      addNotification('You need at least 1 ticket to participate in the draw!', 'error');
      return;
    }
    
    setIsDrawing(true);
    try {
      // Simulate draw animation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if user won (simulate 0.1% win chance)
      const winChance = Math.random();
      const won = winChance < 0.001; // 0.1% chance to win
      
      if (won) {
        const winnings = {
          cipro: 50000,
          usdt: 20,
          vipUpgrade: true
        };
        
        setUserWinnings(winnings);
        
        // Update user balance and VIP level
        const newVipLevel = Math.min(user.vipLevel + 1, 10); // Max VIP level 10
        updateUser({
          balance: {
            ...user.balance,
            usdt: user.balance.usdt + winnings.usdt
          },
          points: user.points + winnings.cipro,
          vipLevel: newVipLevel
        });
        
        addNotification(`🎉 Congratulations! You won 50,000 Cipro, $20 USDT, and VIP Level ${newVipLevel}!`, 'success');
      } else {
        addNotification('Better luck next time! Thanks for participating.', 'info');
      }
      
      setShowResults(true);
      await loadRecentWinners();
    } catch (error) {
      console.error('Error participating in draw:', error);
      addNotification('Error participating in draw. Please try again.', 'error');
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <SEOHead 
        title="🎰 Lucky Draw - Win Big Every Weekend | Cipro"
        description="Join our weekend Lucky Draw! Buy tickets with Cipro points and win amazing cryptocurrency prizes. Draw runs Friday to Sunday every week."
        keywords="lucky draw, cryptocurrency lottery, weekend prizes, SOL ETH USDT USDC rewards, crypto gambling, blockchain lottery"
      />

      {/* Header Section */}
      <div className="bg-gradient-primary text-white p-6 mb-6 rounded-2xl shadow-primary-lg overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-white rounded-full transform scale-150 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 text-center container">
          <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center justify-center gap-3">
            🎰 Weekend Lucky Draw
          </h1>
          <p className="text-lg mb-4 opacity-90 font-medium">
            Buy tickets and win amazing cryptocurrency prizes every weekend!
          </p>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide shadow-lg backdrop-blur-sm border-2 border-white/30 ${
            isDrawActive 
              ? 'bg-success-color/20 text-success-light animate-pulse' 
              : 'bg-error-color/20 text-error-light'
          }`}>
            {isDrawActive ? '🟢 DRAW ACTIVE' : '🔴 DRAW CLOSED'}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Countdown Timer */}
        <div className="card mb-6">
          <div className="card-body text-center">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center justify-center gap-2">
              {isDrawActive ? '⏰ Draw Ends In' : '⏳ Next Draw Starts In'}
            </h2>
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {[
                { value: countdownData.days, label: 'Days' },
                { value: countdownData.hours, label: 'Hours' },
                { value: countdownData.minutes, label: 'Minutes' },
                { value: countdownData.seconds, label: 'Seconds' }
              ].map((unit, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 hover:border-primary transition hover:-translate-y-1">
                  <div className="text-2xl font-black text-primary font-mono">{unit.value}</div>
                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mt-1">{unit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 mb-6">
          {/* Prize Pool Section */}
          <div className="card card-hover">
            <div className="card-body">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                💰 Prize Pool
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { currency: 'Cipro', amount: currentPrizePool.cipro.toLocaleString(), color: 'text-primary' },
                  { currency: 'USDT', amount: `$${currentPrizePool.usdt.toFixed(2)}`, color: 'text-success' },
                  { currency: 'VIP Upgrade', amount: 'Next Tier', color: 'text-warning' }
                ].map((prize, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 text-center border-2 border-gray-200 hover:border-primary transition hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary transform scale-x-0 transition-transform hover:scale-x-100"></div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">{prize.currency}</div>
                    <div className={`text-lg font-bold font-mono ${prize.color}`}>{prize.amount}</div>
                  </div>
                ))}
              </div>
              
              {/* User Stats */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: userTickets, label: 'Your Tickets' },
                    { value: totalTickets.toLocaleString(), label: 'Total Tickets' },
                    { value: totalTickets > 0 ? 'Active' : 'Waiting', label: 'Draw Status' }
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition hover:-translate-y-1">
                      <div className="text-lg font-bold text-primary font-mono">{stat.value}</div>
                      <div className="text-xs text-gray-600 font-medium mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Section */}
          <div className="card card-hover">
            <div className="card-body">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                🎫 Buy Tickets
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border-2 border-gray-200 text-center">
                <p className="text-lg font-semibold text-gray-800 m-0">1 Ticket = $2.00 USDT</p>
              </div>
              
              {isDrawActive ? (
                <>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {[
                      { quantity: 1, cost: 2 },
                      { quantity: 5, cost: 10 },
                      { quantity: 10, cost: 20 }
                    ].map((option, index) => (
                      <button 
                        key={index}
                        className="btn btn-primary btn-lg ripple-effect"
                        onClick={() => handleBuyTickets(option.quantity)}
                        disabled={loading}
                      >
                        <div className="text-center">
                          <div>{loading ? '⏳ Processing...' : `🎫 Buy ${option.quantity} Ticket${option.quantity > 1 ? 's' : ''}`}</div>
                          <small className="block text-sm opacity-90 mt-1">${option.cost.toFixed(2)} USD</small>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Draw Participation */}
                  {userTickets > 0 && (
                    <div className="bg-success text-white rounded-2xl p-6 text-center shadow-lg">
                      <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
                        🎲 Ready to Draw?
                      </h3>
                      <p className="mb-2 opacity-95">You have {userTickets} ticket{userTickets > 1 ? 's' : ''}</p>
                      <p className="mb-4 opacity-95">Good luck! 🍀</p>
                      
                      {!showResults ? (
                        <button 
                          className="btn btn-secondary btn-lg"
                          onClick={participateInDraw}
                          disabled={isDrawing}
                        >
                          {isDrawing ? (
                            <div className="flex items-center gap-3">
                              <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                              Drawing...
                            </div>
                          ) : (
                            '🎰 Participate in Draw'
                          )}
                        </button>
                      ) : (
                        <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm border-2 border-white/30">
                          {userWinnings ? (
                            <div>
                              <h3 className="text-lg font-bold mb-3">🎉 Congratulations! You Won!</h3>
                              <div className="flex flex-wrap gap-3 justify-center">
                                <div className="bg-white/20 px-4 py-2 rounded-full font-semibold backdrop-blur-sm border border-white/30">
                                  💎 {userWinnings.cipro.toLocaleString()} Cipro
                                </div>
                                <div className="bg-white/20 px-4 py-2 rounded-full font-semibold backdrop-blur-sm border border-white/30">
                                  💵 ${userWinnings.usdt.toFixed(2)} USDT
                                </div>
                                <div className="bg-white/20 px-4 py-2 rounded-full font-semibold backdrop-blur-sm border border-white/30">
                                  ⭐ VIP Level Upgrade
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-lg mb-2">Better luck next time!</h3>
                              <p>Thanks for participating in the Lucky Draw.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
                    🔒 Ticket Sales Closed
                  </h3>
                  <p>Come back during the weekend to buy tickets!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Payment History */}
        {userPayments.length > 0 && (
          <div className="card card-hover mb-6">
            <div className="card-body">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                💳 Your Payment History
              </h2>
              <div className="space-y-3">
                {userPayments.slice(0, 5).map((payment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {payment.ticket_quantity} Ticket{payment.ticket_quantity > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${payment.amount} {payment.currency} • {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        payment.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status === 'approved' ? '✅ Approved' : 
                         payment.status === 'rejected' ? '❌ Rejected' : 
                         '⏳ Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Winners */}
        <div className="card card-hover">
          <div className="card-body">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
              🏆 Recent Winners
            </h2>
            {winners.length > 0 ? (
              <div className="grid gap-3">
                {winners.map((winner, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center border-2 border-gray-200 hover:border-primary transition hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary transform scale-x-0 transition-transform hover:scale-x-100"></div>
                    <div className="text-center md:text-left mb-3 md:mb-0">
                      <div className="font-bold text-gray-800 text-sm mb-1">
                        {winner.username || `Player ${winner.user_id.slice(-4)}`}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {new Date(winner.draw_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-center md:text-right text-success font-bold text-sm font-mono">
                      {winner.sol_won > 0 && `◎ ${formatBalance(winner.sol_won)} SOL`}
                      {winner.eth_won > 0 && ` Ξ ${formatBalance(winner.eth_won)} ETH`}
                      {winner.usdt_won > 0 && ` 💵 ${formatBalance(winner.usdt_won)} USDT`}
                      {winner.usdc_won > 0 && ` 💵 ${formatBalance(winner.usdc_won)} USDC`}
                      {winner.points_won > 0 && ` 💎 ${winner.points_won.toLocaleString()} Cipro`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
                  🎯 No Winners Yet
                </h3>
                <p>Be the first to win big in our Lucky Draw!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <LuckyDrawPayment
          user={user}
          ticketQuantity={selectedTicketQuantity}
          totalCost={selectedTicketQuantity * 2}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

export default LuckyDrawPage;