import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../db/supabase';
import SEOHead from '../components/SEOHead';
import { formatBalance } from '../utils/formatBalance';
import './LuckyDrawPage.css';

function LuckyDrawPage({ user, updateUser, addNotification }) {
  const [isDrawActive, setIsDrawActive] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [timeUntilEnd, setTimeUntilEnd] = useState('');
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
  const [ticketAnimation, setTicketAnimation] = useState(false);

  useEffect(() => {
    checkDrawStatus();
    loadUserTickets();
    loadPrizePool();
    loadRecentWinners();
    
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
      setTimeUntilEnd(formatTimeRemaining(timeLeft));
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
      setTimeUntilNext(formatTimeRemaining(timeLeft));
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

  const formatTimeRemaining = (milliseconds) => {
    const { days, hours, minutes, seconds } = getCountdownData(milliseconds);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
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

  const buyTickets = async (quantity) => {
    const ticketPrice = 2; // $2 USDT per ticket
    const totalCost = quantity * ticketPrice;
    
    if (user.balance.usdt < totalCost) {
      addNotification(`Insufficient USDT! You need $${totalCost.toFixed(2)} USDT to buy ${quantity} ticket${quantity > 1 ? 's' : ''}.`, 'error');
      return;
    }
    
    setLoading(true);
    setTicketAnimation(true);
    
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
      setTimeout(() => setTicketAnimation(false), 1000);
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

  const getWinChance = () => {
    return "0.1"; // Fixed 0.1% win chance for all participants
  };

  return (
    <div className="lucky-draw-page">
      <SEOHead 
        title="🎰 Lucky Draw - Win Big Every Weekend | Cipro"
        description="Join our weekend Lucky Draw! Buy tickets with Cipro points and win amazing cryptocurrency prizes. Draw runs Friday to Sunday every week."
        keywords="lucky draw, cryptocurrency lottery, weekend prizes, SOL ETH USDT USDC rewards, crypto gambling, blockchain lottery"
      />

      {/* Header Section */}
      <div className="lucky-draw-header">
        <div className="header-content">
          <h1 className="lucky-draw-title">
            🎰 Weekend Lucky Draw
          </h1>
          <p className="lucky-draw-subtitle">
            Buy tickets and win amazing cryptocurrency prizes every weekend!
          </p>
          
          <div className={`draw-status ${isDrawActive ? 'status-active' : 'status-closed'}`}>
            {isDrawActive ? '🟢 DRAW ACTIVE' : '🔴 DRAW CLOSED'}
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="lucky-draw-container">
        <div className="countdown-timer">
          <h2 className="countdown-title">
            {isDrawActive ? '⏰ Draw Ends In' : '⏳ Next Draw Starts In'}
          </h2>
          <div className="countdown-display">
            <div className="countdown-unit">
              <span className="countdown-number">{countdownData.days}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdownData.hours}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdownData.minutes}</span>
              <span className="countdown-label">Minutes</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdownData.seconds}</span>
              <span className="countdown-label">Seconds</span>
            </div>
          </div>
        </div>

        <div className="main-content">
        {/* Prize Pool Section */}
        <div className="prize-pool-section">
          <h2 className="section-title">💰 Prize Pool</h2>
          <div className="prize-pool-grid">
            <div className="prize-item">
              <div className="prize-currency">Cipro</div>
              <div className="prize-amount">{currentPrizePool.cipro.toLocaleString()}</div>
            </div>
            <div className="prize-item">
              <div className="prize-currency">USDT</div>
              <div className="prize-amount">${currentPrizePool.usdt.toFixed(2)}</div>
            </div>
            <div className="prize-item">
              <div className="prize-currency">VIP Upgrade</div>
              <div className="prize-amount">Next Tier</div>
            </div>
          </div>
          
          {/* User Stats */}
          <div className="user-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{userTickets}</span>
                <span className="stat-label">Your Tickets</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{totalTickets.toLocaleString()}</span>
                <span className="stat-label">Total Tickets</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{getWinChance()}%</span>
                <span className="stat-label">Win Chance</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">${user.balance.usdt.toFixed(2)}</span>
                <span className="stat-label">Your USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Section */}
        <div className="ticket-section">
          <h2 className="section-title">🎫 Buy Tickets</h2>
          <div className="ticket-purchase">
            <div className="ticket-price-info">
              <p>1 Ticket = $2.00 USDT</p>
            </div>
            
            {isDrawActive ? (
              <>
                <div className="ticket-options">
                  <button 
                    className="ticket-option" 
                    onClick={() => buyTickets(1)}
                    disabled={loading || user.balance.usdt < 2}
                  >
                    {loading ? '⏳ Processing...' : '🎫 Buy 1 Ticket'}
                    <small>$2.00 USDT</small>
                  </button>
                  <button 
                    className="ticket-option" 
                    onClick={() => buyTickets(5)}
                    disabled={loading || user.balance.usdt < 10}
                  >
                    {loading ? '⏳ Processing...' : '🎫 Buy 5 Tickets'}
                    <small>$10.00 USDT</small>
                  </button>
                  <button 
                    className="ticket-option" 
                    onClick={() => buyTickets(10)}
                    disabled={loading || user.balance.usdt < 20}
                  >
                    {loading ? '⏳ Processing...' : '🎫 Buy 10 Tickets'}
                    <small>$20.00 USDT</small>
                  </button>
                </div>

                {/* Draw Participation */}
                {userTickets > 0 && (
                  <div className="draw-participation">
                    <h3>🎲 Ready to Draw?</h3>
                    <p>You have {userTickets} ticket{userTickets > 1 ? 's' : ''}</p>
                    <p>Win chance: {getWinChance()}%</p>
                    
                    {!showResults ? (
                      <button 
                        className="participate-btn"
                        onClick={participateInDraw}
                        disabled={isDrawing}
                      >
                        {isDrawing ? (
                          <>
                            <div className="spinner" style={{ display: 'inline-block', marginRight: '10px', width: '20px', height: '20px' }}></div>
                            Drawing...
                          </>
                        ) : (
                          '🎰 Participate in Draw'
                        )}
                      </button>
                    ) : (
                      <div className="draw-results">
                        {userWinnings ? (
                          <div className="winner-result">
                            <h3>🎉 Congratulations! You Won!</h3>
                            <div className="winnings">
                              <div>💎 {userWinnings.cipro.toLocaleString()} Cipro</div>
                              <div>💵 ${userWinnings.usdt.toFixed(2)} USDT</div>
                              <div>⭐ VIP Level Upgrade</div>
                            </div>
                          </div>
                        ) : (
                          <div className="no-win-result">
                            <h3>Better luck next time!</h3>
                            <p>Thanks for participating in the Lucky Draw.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="draw-closed-state">
                <h3>🔒 Ticket Sales Closed</h3>
                <p>Come back during the weekend to buy tickets!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Winners */}
      <div className="winners-section">
        <h2 className="section-title">🏆 Recent Winners</h2>
        {winners.length > 0 ? (
          <div className="winners-list">
            {winners.map((winner, index) => (
              <div key={index} className="winner-item">
                <div className="winner-info">
                  <div className="winner-name">{winner.username || `Player ${winner.user_id.slice(-4)}`}</div>
                  <div className="winner-date">{new Date(winner.draw_date).toLocaleDateString()}</div>
                </div>
                <div className="winner-prize">
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
          <div className="no-winners">
            <h3>🎯 No Winners Yet</h3>
            <p>Be the first to win big in our Lucky Draw!</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default LuckyDrawPage;