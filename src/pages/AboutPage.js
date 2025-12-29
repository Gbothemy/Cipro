import React from 'react';
import SEOHead from '../components/SEOHead';
import './AboutPage.css';

function AboutPage() {
  const teamMembers = [
    {
      name: 'Alex Chen',
      role: 'Founder & CEO',
      avatar: '👨‍💼',
      description: 'Blockchain enthusiast with 8+ years in cryptocurrency and gaming.'
    },
    {
      name: 'Sarah Johnson',
      role: 'CTO',
      avatar: '👩‍💻',
      description: 'Full-stack developer specializing in Web3 and gaming platforms.'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Game Designer',
      avatar: '🎮',
      description: 'Creative game designer with expertise in engaging user experiences.'
    },
    {
      name: 'Emma Wilson',
      role: 'Community Manager',
      avatar: '👩‍🎨',
      description: 'Building and nurturing our amazing community of players.'
    }
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Platform Launch',
      description: 'Cipro officially launches with 4 games and cryptocurrency rewards.',
      icon: '🚀'
    },
    {
      year: '2024',
      title: 'VIP System',
      description: 'Introduced VIP tiers with enhanced benefits and subscription model.',
      icon: '💎'
    },
    {
      year: '2024',
      title: 'Multi-Crypto Support',
      description: 'Added support for SOL, ETH, USDT, and USDC rewards.',
      icon: '🪙'
    },
    {
      year: '2024',
      title: 'Mobile Optimization',
      description: 'Fully optimized platform for mobile gaming experience.',
      icon: '📱'
    }
  ];

  const stats = [
    { label: 'Active Players', value: '10,000+', icon: '👥' },
    { label: 'Games Available', value: '4+', icon: '🎮' },
    { label: 'Crypto Distributed', value: '$50,000+', icon: '💰' },
    { label: 'Countries Served', value: '50+', icon: '🌍' }
  ];

  return (
    <div className="about-page">
      <SEOHead 
        title="About Cipro - Leading Cryptocurrency Gaming Platform"
        description="Learn about Cipro's mission to democratize cryptocurrency through gaming. Discover our story, team, and vision for the future of crypto gaming. Join 15,000+ players worldwide!"
        keywords="about cipro, cryptocurrency gaming company, crypto gaming platform, blockchain gaming, crypto rewards platform, play to earn company, cryptocurrency team"
        url="https://www.ciprohub.site/about"
      />
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="hero-content">
            <h1>🎮 About Cipro</h1>
            <p className="hero-subtitle">
              The future of gaming meets cryptocurrency. Play, earn, and grow with the most 
              rewarding gaming platform in the blockchain space.
            </p>
          </div>
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="mission-section">
          <div className="section-header">
            <h2>🎯 Our Mission</h2>
            <p>Democratizing cryptocurrency through gaming</p>
          </div>
          <div className="mission-content">
            <div className="mission-card">
              <div className="mission-icon">🎮</div>
              <h3>Fun-First Gaming</h3>
              <p>
                We believe earning cryptocurrency should be enjoyable. Our games are designed 
                to be engaging and entertaining, not just profitable.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🌍</div>
              <h3>Global Accessibility</h3>
              <p>
                Making cryptocurrency accessible to everyone, regardless of their technical 
                knowledge or financial background.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🔒</div>
              <h3>Security First</h3>
              <p>
                Your security is our priority. We implement the highest standards of 
                security and transparency in all our operations.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="story-section">
          <div className="section-header">
            <h2>📖 Our Story</h2>
            <p>How Cipro came to be</p>
          </div>
          <div className="story-content">
            <div className="story-text">
              <p>
                Cipro was born from a simple idea: what if earning cryptocurrency could be as 
                fun as playing your favorite games? Our founders, passionate about both gaming 
                and blockchain technology, saw an opportunity to bridge these two worlds.
              </p>
              <p>
                Starting in 2024, we set out to create a platform that would make cryptocurrency 
                accessible to everyone through engaging gameplay. We wanted to remove the barriers 
                that prevent people from entering the crypto space - technical complexity, high 
                entry costs, and intimidating interfaces.
              </p>
              <p>
                Today, Cipro serves thousands of players worldwide, offering a safe, fun, and 
                rewarding way to earn real cryptocurrency. We're just getting started on our 
                mission to democratize access to digital assets through gaming.
              </p>
            </div>
            <div className="story-image">
              <div className="story-graphic">
                <div className="graphic-element">🎮</div>
                <div className="graphic-element">💎</div>
                <div className="graphic-element">🚀</div>
                <div className="graphic-element">🌟</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="timeline-section">
          <div className="section-header">
            <h2>🗓️ Our Journey</h2>
            <p>Key milestones in Cipro's development</p>
          </div>
          <div className="timeline">
            {milestones.map((milestone, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-icon">{milestone.icon}</div>
                <div className="timeline-content">
                  <div className="timeline-year">{milestone.year}</div>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="team-section">
          <div className="section-header">
            <h2>👥 Meet Our Team</h2>
            <p>The passionate people behind Cipro</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card">
                <div className="team-avatar">{member.avatar}</div>
                <h3>{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <p>{member.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="values-section">
          <div className="section-header">
            <h2>💡 Our Values</h2>
            <p>What drives us every day</p>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🎯</div>
              <h3>Transparency</h3>
              <p>We believe in open communication and honest practices in everything we do.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Community</h3>
              <p>Our players are at the heart of everything we do. We listen, learn, and grow together.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🚀</div>
              <h3>Innovation</h3>
              <p>We're constantly pushing boundaries to create new and exciting ways to earn crypto.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚖️</div>
              <h3>Fairness</h3>
              <p>Every player deserves equal opportunities to succeed and earn rewards.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔐</div>
              <h3>Security</h3>
              <p>Protecting our users' assets and data is our highest priority.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>Growth</h3>
              <p>We're committed to continuous improvement and sustainable growth.</p>
            </div>
          </div>
        </div>

        {/* Future Section */}
        <div className="future-section">
          <div className="section-header">
            <h2>🔮 The Future</h2>
            <p>What's coming next for Cipro</p>
          </div>
          <div className="future-content">
            <div className="future-roadmap">
              <div className="roadmap-item">
                <div className="roadmap-icon">🎮</div>
                <h3>More Games</h3>
                <p>Expanding our game library with new and exciting challenges.</p>
              </div>
              <div className="roadmap-item">
                <div className="roadmap-icon">🪙</div>
                <h3>New Cryptocurrencies</h3>
                <p>Adding support for more popular cryptocurrencies and tokens.</p>
              </div>
              <div className="roadmap-item">
                <div className="roadmap-icon">📱</div>
                <h3>Mobile App</h3>
                <p>Native mobile applications for iOS and Android platforms.</p>
              </div>
              <div className="roadmap-item">
                <div className="roadmap-icon">🏆</div>
                <h3>Tournaments</h3>
                <p>Competitive gaming tournaments with bigger cryptocurrency prizes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <div className="cta-content">
            <h2>🚀 Join the Cipro Revolution</h2>
            <p>
              Ready to start earning cryptocurrency through gaming? Join thousands of players 
              who are already building their crypto portfolios with Cipro.
            </p>
            <div className="cta-buttons">
              <a href="/login" className="cta-btn primary">
                🎮 Start Playing
              </a>
              <a href="/support" className="cta-btn secondary">
                📧 Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;