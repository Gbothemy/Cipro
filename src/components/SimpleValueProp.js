import React from 'react';

function SimpleValueProp() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '40px 20px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>How Cipro Works</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.8 }}>
        Simple gaming, real rewards. No complex systems.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎮</div>
          <h3>Play Games</h3>
          <p>4 fun games, 20-100 points each</p>
        </div>
        
        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
          <h3>Complete Tasks</h3>
          <p>Daily challenges for bonus points</p>
        </div>
        
        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💳</div>
          <h3>Cash Out</h3>
          <p>10,000 points = $1 USD in crypto</p>
        </div>
      </div>
      
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '15px' }}>
        <h3 style={{ marginBottom: '15px' }}>💰 Realistic Earnings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
          <div>
            <strong>Casual Player (30 min/day)</strong><br />
            <span style={{ color: '#4facfe' }}>$2-5/week</span>
          </div>
          <div>
            <strong>Active Player (1 hour/day)</strong><br />
            <span style={{ color: '#4facfe' }}>$5-15/week</span>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', opacity: 0.7, fontStyle: 'italic' }}>
          *Earnings depend on game performance and daily participation
        </p>
      </div>
    </div>
  );
}

export default SimpleValueProp;
