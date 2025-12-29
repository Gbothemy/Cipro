import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  
  // Hardcoded stats - not retrieved from database
  const stats = [
    { value: '100k+', label: 'Active Players' },
    { value: '$10k+', label: 'Rewards Paid' },
    { value: '500k+', label: 'Tasks Completed' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  const features = [
    {
      icon: '🎮',
      title: 'Play & Earn',
      description: 'Complete mining tasks and earn crypto rewards instantly'
    },
    {
      icon: '💰',
      title: 'Daily Airdrops',
      description: 'Claim free SOL, ETH, USDT, and USDC every 24 hours'
    },
    {
      icon: '👥',
      title: 'Refer Friends',
      description: 'Earn 10% commission from all your referrals'
    },
    {
      icon: '🏆',
      title: 'Compete',
      description: 'Climb the leaderboard and win exclusive rewards'
    },
    {
      icon: '🎁',
      title: 'Reward Packs',
      description: 'Unlock special packs with amazing prizes'
    },
    {
      icon: '⭐',
      title: 'VIP Levels',
      description: 'Level up and unlock premium benefits'
    }
  ];

  const cryptos = [
    { name: 'SOL', icon: '◎', color: '#14F195' },
    { name: 'ETH', icon: 'Ξ', color: '#627EEA' },
    { name: 'USDT', icon: '💵', color: '#26A17B' },
    { name: 'USDC', icon: '💵', color: '#2775CA' }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Cipro",
    "description": "Play games and earn real cryptocurrency rewards including SOL, ETH, USDT, and USDC",
    "url": "https://www.ciprohub.site",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free to play with premium VIP options"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Earn SOL cryptocurrency",
      "Earn ETH cryptocurrency", 
      "Earn USDT stablecoin",
      "Earn USDC stablecoin",
      "100,000+ games available",
      "Daily rewards and airdrops",
      "VIP membership tiers",
      "Referral program with 10% commission",
      "Mobile responsive design",
      "Secure wallet integration"
    ]
  };

  return (
    <div className="landing-page">
      <SEOHead 
        title="🎮 Cipro - Play Games, Earn Real Cryptocurrency | Free SOL, ETH, USDT, USDC Rewards"
        description="🚀 Join 100,000+ players earning real cryptocurrency by playing fun games! Earn SOL, ETH, USDT & USDC daily. Free to start, no investment required. Start earning crypto now!"
        keywords="earn cryptocurrency, play to earn games, free crypto, SOL rewards, ETH rewards, USDT rewards, USDC rewards, blockchain games, crypto gaming, cryptocurrency platform, earn bitcoin, free cryptocurrency, crypto airdrops, gaming rewards, play games earn money, cryptocurrency mining games, crypto faucet, earn crypto online, free crypto games, blockchain gaming platform, ciprohub, cipro gaming, crypto tasks, daily crypto rewards"
        url="https://www.ciprohub.site"
        structuredData={structuredData}
      />
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img 
              src="/ciprohub.png" 
              alt="Cipro" 
              className="logo-image-nav"
              onError={(e) => {
                // Fallback to text logo if image fails
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="logo-text-fallback" style={{ display: 'none' }}>
              <span className="logo-icon">💎</span>
              <span className="logo-text">Cipro</span>
            </div>
          </div>
          <div className="nav-buttons">
            <button onClick={() => navigate('/login')} className="nav-btn login-btn">
              Login
            </button>
            <button onClick={() => navigate('/login')} className="nav-btn signup-btn">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Earn Crypto Rewards
              <span className="gradient-text"> While Playing Games</span>
            </h1>
            <p className="hero-subtitle">
              Join thousands of players earning real cryptocurrency through fun mining games, 
              daily airdrops, and referral rewards. Start your journey today!
            </p>
            <div className="hero-buttons">
              <button onClick={() => navigate('/login')} className="cta-btn primary">
                🚀 Start Earning Now
              </button>
              <button onClick={() => navigate('/login')} className="cta-btn secondary">
                🎮 Try Demo
              </button>
            </div>
            <div className="crypto-badges">
              {cryptos.map(crypto => (
                <div key={crypto.name} className="crypto-badge" style={{ borderColor: crypto.color }}>
                  <span className="crypto-icon">{crypto.icon}</span>
                  <span className="crypto-name">{crypto.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card card-1">
              <div className="card-icon">💎</div>
              <div className="card-text">+150 Points</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🎁</div>
              <div className="card-text">Daily Reward</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🏆</div>
              <div className="card-text">Level Up!</div>
            </div>
            <div className="hero-emoji">🎮</div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Cipro?</h2>
            <p className="section-subtitle">
              Everything you need to start earning crypto rewards today
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="how-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📝</div>
              <h3>Sign Up Free</h3>
              <p>Create your account in seconds. No credit card required.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🎮</div>
              <h3>Play Games</h3>
              <p>Complete mining tasks and earn points through various games.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">💰</div>
              <h3>Earn Rewards</h3>
              <p>Convert points to crypto and withdraw to your wallet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Start Earning?</h2>
          <p className="cta-subtitle">
            Join thousands of players already earning crypto rewards
          </p>
          <button onClick={() => navigate('/login')} className="cta-btn large">
            🚀 Get Started Now - It's Free!
          </button>
          <p className="cta-note">No credit card required • Start earning in minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <img 
                  src="/ciprohub.png" 
                  alt="Cipro" 
                  className="logo-image-footer"
                  onError={(e) => {
                    // Fallback to text logo if image fails
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="logo-text-fallback" style={{ display: 'none' }}>
                  <span className="logo-icon">💎</span>
                  <span className="logo-text">Cipro</span>
                </div>
              </div>
              <p>Play games and earn cryptocurrency rewards</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how">How It Works</a>
                <a href="#rewards">Rewards</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <Link to="/about">About Us</Link>
                <Link to="/support">Contact</Link>
                <Link to="/faq">FAQ</Link>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
                <Link to="/support">Support</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Cipro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
