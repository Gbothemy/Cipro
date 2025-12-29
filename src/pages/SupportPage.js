import React, { useState } from 'react';
import SEOHead from '../components/SEOHead';
import './SupportPage.css';

function SupportPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const faqCategories = {
    general: {
      title: '🎮 General',
      faqs: [
        {
          question: 'What is Cipro?',
          answer: 'Cipro is a gaming platform where you can play games, complete tasks, and earn real cryptocurrency rewards including SOL, ETH, USDT, and USDC.'
        },
        {
          question: 'How do I get started?',
          answer: 'Simply create an account, start playing games, and begin earning Cipro points that can be converted to cryptocurrency.'
        },
        {
          question: 'Is Cipro free to use?',
          answer: 'Yes! Cipro offers a free Bronze tier that allows you to play games and earn rewards. Premium VIP tiers are available for enhanced benefits.'
        },
        {
          question: 'What devices can I use?',
          answer: 'Cipro works on all modern web browsers including desktop, tablet, and mobile devices.'
        }
      ]
    },
    rewards: {
      title: '💰 Rewards & Crypto',
      faqs: [
        {
          question: 'How do I earn cryptocurrency?',
          answer: 'Play games, complete daily tasks, claim airdrops, and participate in challenges to earn Cipro points. Then convert your points to cryptocurrency.'
        },
        {
          question: 'What cryptocurrencies can I earn?',
          answer: 'You can earn SOL (Solana), ETH (Ethereum), USDT (Tether), and USDC (USD Coin).'
        },
        {
          question: 'How do I withdraw my crypto?',
          answer: 'Go to the Convert & Withdraw page, select your cryptocurrency, enter your wallet address, and submit a withdrawal request.'
        },
        {
          question: 'Are there minimum withdrawal amounts?',
          answer: 'Yes, minimum withdrawal amounts vary by cryptocurrency to cover network fees. Check the withdrawal page for current minimums.'
        },
        {
          question: 'How long do withdrawals take?',
          answer: 'Withdrawals are manually reviewed for security and typically processed within 24-48 hours.'
        }
      ]
    },
    vip: {
      title: '💎 VIP & Subscriptions',
      faqs: [
        {
          question: 'What are VIP tiers?',
          answer: 'VIP tiers offer enhanced benefits like more daily games, higher mining rewards, lower withdrawal fees, and exclusive features.'
        },
        {
          question: 'How do I subscribe to VIP?',
          answer: 'Visit the VIP Tiers page, select your desired tier, and complete the cryptocurrency payment process.'
        },
        {
          question: 'Can I cancel my VIP subscription?',
          answer: 'Yes, you can cancel anytime. Your VIP benefits will remain active until the end of your current billing period.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept cryptocurrency payments (USDT, USDC, ETH, SOL) for VIP subscriptions.'
        }
      ]
    },
    technical: {
      title: '🔧 Technical Support',
      faqs: [
        {
          question: 'I\'m having trouble logging in',
          answer: 'Try clearing your browser cache and cookies. If the problem persists, contact our support team.'
        },
        {
          question: 'Games are not loading properly',
          answer: 'Ensure you have a stable internet connection and try refreshing the page. Disable ad blockers if necessary.'
        },
        {
          question: 'My rewards are not showing up',
          answer: 'Rewards may take a few minutes to appear. If they don\'t show up after 10 minutes, please contact support.'
        },
        {
          question: 'I can\'t access my account',
          answer: 'If you\'ve forgotten your password or username, contact our support team with your account details for assistance.'
        }
      ]
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send the form data to your backend
    console.log('Contact form submitted:', contactForm);
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({
        name: '',
        email: '',
        category: 'general',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="support-page">
      <div className="support-container">
        <div className="support-header">
          <h1>🆘 Support Center</h1>
          <p>Get help with your Cipro account, games, and cryptocurrency rewards</p>
        </div>

        {/* Quick Help Cards */}
        <div className="quick-help-section">
          <h2>🚀 Quick Help</h2>
          <div className="quick-help-grid">
            <div className="help-card">
              <div className="help-icon">🎮</div>
              <h3>Getting Started</h3>
              <p>New to Cipro? Learn how to play games and earn your first rewards.</p>
            </div>
            <div className="help-card">
              <div className="help-icon">💰</div>
              <h3>Earning Crypto</h3>
              <p>Discover all the ways to earn cryptocurrency on our platform.</p>
            </div>
            <div className="help-card">
              <div className="help-icon">💎</div>
              <h3>VIP Benefits</h3>
              <p>Learn about VIP tiers and how to maximize your earnings.</p>
            </div>
            <div className="help-card">
              <div className="help-icon">🔄</div>
              <h3>Withdrawals</h3>
              <p>Step-by-step guide to withdrawing your cryptocurrency.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>❓ Frequently Asked Questions</h2>
          
          {/* FAQ Categories */}
          <div className="faq-categories">
            {Object.entries(faqCategories).map(([key, category]) => (
              <button
                key={key}
                className={`category-btn ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
              >
                {category.title}
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="faq-content">
            {faqCategories[activeCategory].faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-section">
          <h2>📧 Contact Support</h2>
          <p>Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.</p>
          
          {submitted ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Message Sent Successfully!</h3>
              <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={contactForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={contactForm.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Issue</option>
                    <option value="rewards">Rewards & Crypto</option>
                    <option value="vip">VIP Subscription</option>
                    <option value="account">Account Issue</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows="6"
                  value={contactForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Please describe your issue or question in detail..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                📧 Send Message
              </button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="contact-info-section">
          <h2>📞 Other Ways to Reach Us</h2>
          <div className="contact-methods">
            <div className="contact-method">
              <div className="contact-icon">📧</div>
              <div className="contact-details">
                <h3>Email Support</h3>
                <p>support@ciprohub.site</p>
                <small>Response within 24 hours</small>
              </div>
            </div>
            <div className="contact-method">
              <div className="contact-icon">🌐</div>
              <div className="contact-details">
                <h3>Website</h3>
                <p>www.ciprohub.site</p>
                <small>Visit our main website</small>
              </div>
            </div>
            <div className="contact-method">
              <div className="contact-icon">⏰</div>
              <div className="contact-details">
                <h3>Support Hours</h3>
                <p>24/7 Online Support</p>
                <small>We're always here to help</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;