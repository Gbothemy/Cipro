import React, { useState } from 'react';
import './FAQPage.css';

function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestion, setOpenQuestion] = useState(null);

  const categories = [
    { id: 'general', name: 'General', icon: '❓' },
    { id: 'games', name: 'Games & Earning', icon: '🎮' },
    { id: 'crypto', name: 'Crypto & Conversion', icon: '💰' },
    { id: 'withdrawal', name: 'Withdrawals', icon: '💸' },
    { id: 'account', name: 'Account & Security', icon: '🔐' }
  ];

  const faqs = {
    general: [
      {
        question: 'What is Cipro?',
        answer: 'Cipro is a play-to-earn platform where you can play fun games, complete tasks, and earn real cryptocurrency rewards. Convert your points to SOL, ETH, USDT, or USDC and withdraw to your wallet.'
      },
      {
        question: 'Is Cipro free to use?',
        answer: 'Yes! Cipro is completely free to join and use. There are no subscription fees or hidden charges. You can start earning cryptocurrency immediately after signing up.'
      },
      {
        question: 'How do I get started?',
        answer: 'Simply click "Sign Up" on the homepage, create your account, and you\'ll be redirected to the Game Mining page where you can start playing games and earning points right away.'
      },
      {
        question: 'What cryptocurrencies can I earn?',
        answer: 'You can convert your points to four major cryptocurrencies: SOL (Solana), ETH (Ethereum), USDT (Tether), and USDC (USD Coin).'
      },
      {
        question: 'Is my data safe?',
        answer: 'Yes! We use industry-standard encryption and security measures to protect your data. Your personal information and crypto balances are stored securely in our database.'
      }
    ],
    games: [
      {
        question: 'What games can I play?',
        answer: 'Currently, we have 3 working games: Puzzle Challenge (50 pts + 10 exp), Spin Wheel (100 pts + 20 exp), and Memory Match (120 pts + 25 exp). Each game has a cooldown period before you can play again.'
      },
      {
        question: 'How do I earn points?',
        answer: 'You earn points by playing games, completing daily tasks, claiming daily rewards, maintaining login streaks, and referring friends. Each activity rewards you with points and experience.'
      },
      {
        question: 'What are cooldowns?',
        answer: 'Cooldowns are waiting periods between game plays to ensure fair gameplay. Puzzle Challenge has a 30-second cooldown, Spin Wheel has 60 seconds, and Memory Match has 45 seconds. VIP members get reduced cooldowns!'
      },
      {
        question: 'What is experience (EXP)?',
        answer: 'Experience points help you level up your VIP status. As you gain more EXP, you unlock higher VIP tiers with better benefits like reduced cooldowns, better conversion rates, and bonus point multipliers.'
      },
      {
        question: 'Can I play games on mobile?',
        answer: 'Yes! Cipro is fully responsive and works great on mobile devices, tablets, and desktop computers. Play anywhere, anytime!'
      }
    ],
    crypto: [
      {
        question: 'How do I convert points to crypto?',
        answer: 'Go to the "Convert & Withdraw" page, select your desired cryptocurrency, enter the amount of points you want to convert, and click "Convert to Crypto". Your crypto balance will be updated instantly. Note: A 10% platform fee applies to all conversions.'
      },
      {
        question: 'What are the conversion rates?',
        answer: 'Current rates: 10,000 points = 1 USDT/USDC, 1,000,000 points = 1 SOL (~$100), 20,000,000 points = 1 ETH (~$2,000). VIP members get better rates!'
      },
      {
        question: 'Is there a minimum conversion amount?',
        answer: 'Yes, the minimum conversion is 1,000 points. This ensures meaningful transactions and reduces processing overhead.'
      },
      {
        question: 'Are there any fees for conversion?',
        answer: 'Yes, there is a 10% platform fee on all point-to-crypto conversions. For example, if you convert 100,000 points, you receive 90% of the crypto value, and 10% goes to platform maintenance.'
      },
      {
        question: 'Can I convert crypto back to points?',
        answer: 'No, conversions are one-way only. Once you convert points to cryptocurrency, you cannot convert it back to points. Make sure you\'re ready to convert before proceeding.'
      }
    ],
    withdrawal: [
      {
        question: 'How do I withdraw my crypto?',
        answer: 'Go to "Convert & Withdraw", select the "Withdraw Crypto" tab, choose your cryptocurrency, enter the amount, select the network, provide your wallet address, and submit. All withdrawals are manually reviewed for security and processed within 24-48 hours.'
      },
      {
        question: 'What are the minimum withdrawal amounts?',
        answer: 'Minimum withdrawals: 0.01 SOL, 0.001 ETH, 10 USDT, 10 USDC. These minimums ensure cost-effective transactions after network fees.'
      },
      {
        question: 'What networks are supported?',
        answer: 'We support multiple networks: Solana Mainnet for SOL, Ethereum/Arbitrum/Optimism/Polygon/BSC for ETH, and TRC20/ERC20/BEP20/Polygon/Solana/Arbitrum for USDT/USDC. Choose the network that matches your wallet!'
      },
      {
        question: 'Are there withdrawal fees?',
        answer: 'Yes, there are two types of fees: Network fees (varies by blockchain) and a 5% platform fee. For example, withdrawing 100 USDT: Network fee ~1 USDT, Platform fee 5 USDT, You receive ~94 USDT.'
      },
      {
        question: 'How long do withdrawals take?',
        answer: 'Withdrawals are manually reviewed for security and typically processed within 24-48 hours. You\'ll receive notifications when your withdrawal is approved and processed.'
      },
      {
        question: 'Can I cancel a withdrawal?',
        answer: 'Once submitted, withdrawal requests cannot be cancelled. Please double-check all details (amount, address, network) before submitting.'
      },
      {
        question: 'What if I enter the wrong wallet address?',
        answer: 'Always double-check your wallet address and network before submitting. Cryptocurrency transactions are irreversible. If you send to the wrong address, we cannot recover your funds.'
      }
    ],
    account: [
      {
        question: 'How do I create an account?',
        answer: 'Click "Sign Up" on the homepage, enter your username, email, and password, and you\'re ready to start earning! It takes less than a minute.'
      },
      {
        question: 'What are VIP tiers?',
        answer: 'VIP tiers are membership levels (Bronze, Silver, Gold, Platinum, Diamond) that unlock better benefits as you level up. Higher tiers get reduced cooldowns, better conversion rates, and bonus point multipliers.'
      },
      {
        question: 'How do I level up my VIP status?',
        answer: 'Earn experience points (EXP) by playing games, completing tasks, and maintaining streaks. As your EXP increases, you automatically level up and unlock higher VIP tiers.'
      },
      {
        question: 'What is the referral program?',
        answer: 'Invite friends using your unique referral code and earn 10% commission on all their earnings! Your referral code is available on the Referral page.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Currently, password reset is handled through your email. Contact support if you need assistance recovering your account.'
      },
      {
        question: 'Can I have multiple accounts?',
        answer: 'No, each user is allowed only one account. Multiple accounts may result in suspension of all associated accounts.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Contact our support team to request account deletion. Please note that you should withdraw all your crypto before deleting your account.'
      }
    ]
  };

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="page-header">
        <h1 className="page-title">❓ Frequently Asked Questions</h1>
        <p className="page-subtitle">Find answers to common questions about Cipro</p>
      </div>

      <div className="faq-container">
        {/* Category Tabs */}
        <div className="faq-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(category.id);
                setOpenQuestion(null);
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="faq-list">
          {faqs[activeCategory].map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openQuestion === index ? 'open' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleQuestion(index)}
              >
                <span className="question-text">{faq.question}</span>
                <span className="question-icon">
                  {openQuestion === index ? '−' : '+'}
                </span>
              </button>
              {openQuestion === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="faq-support">
        <h3>Still have questions?</h3>
        <p>Can't find what you're looking for? Contact our support team!</p>
        <div className="support-buttons">
          <button className="support-btn">
            📧 Email Support
          </button>
          <button className="support-btn">
            💬 Live Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default FAQPage;
