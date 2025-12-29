import React from 'react';
import SEOHead from '../components/SEOHead';
import './LegalPage.css';

function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <SEOHead 
        title="📋 Terms of Service - Cipro Legal | User Agreement"
        description="Read Cipro's Terms of Service covering user accounts, cryptocurrency rewards, VIP subscriptions, fair play policy, and platform rules. Updated December 2024."
        keywords="cipro terms of service, user agreement, legal terms, cryptocurrency gaming terms, VIP subscription terms, platform rules"
        url="https://www.ciprohub.site/terms"
        noindex={true}
      />
      <div className="legal-container">
        <div className="legal-header">
          <h1>📋 Terms of Service</h1>
          <p className="last-updated">Last updated: December 29, 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Cipro ("the Platform"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              Cipro is a gaming platform that allows users to:
            </p>
            <ul>
              <li>Play various games and earn cryptocurrency rewards</li>
              <li>Complete tasks and challenges for additional rewards</li>
              <li>Participate in daily airdrops and bonus programs</li>
              <li>Convert earned points to cryptocurrency</li>
              <li>Withdraw cryptocurrency to external wallets</li>
              <li>Subscribe to VIP tiers for enhanced benefits</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. User Accounts</h2>
            <p>
              To use our services, you must:
            </p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not share your account with others</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Cryptocurrency and Rewards</h2>
            <p>
              Regarding cryptocurrency rewards and transactions:
            </p>
            <ul>
              <li>Rewards are earned through legitimate gameplay and task completion</li>
              <li>Minimum withdrawal amounts apply for each cryptocurrency</li>
              <li>Network fees may apply to cryptocurrency transactions</li>
              <li>We reserve the right to verify large transactions</li>
              <li>Cryptocurrency values fluctuate and we are not responsible for market changes</li>
              <li>All transactions are final and cannot be reversed</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. VIP Subscriptions</h2>
            <p>
              For VIP subscription services:
            </p>
            <ul>
              <li>Subscriptions are billed monthly or yearly as selected</li>
              <li>Benefits are active during the subscription period</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>Refunds are not provided for partial subscription periods</li>
              <li>We reserve the right to modify VIP benefits with notice</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Prohibited Activities</h2>
            <p>
              Users are prohibited from:
            </p>
            <ul>
              <li>Using bots, scripts, or automated tools</li>
              <li>Creating multiple accounts to gain unfair advantages</li>
              <li>Attempting to hack, exploit, or manipulate the platform</li>
              <li>Engaging in fraudulent activities</li>
              <li>Harassing or abusing other users</li>
              <li>Violating any applicable laws or regulations</li>
              <li>Attempting to reverse engineer our software</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Fair Play Policy</h2>
            <p>
              We maintain a fair gaming environment:
            </p>
            <ul>
              <li>All games use verified random number generation</li>
              <li>Daily limits prevent excessive farming</li>
              <li>We monitor for suspicious activity</li>
              <li>Violations may result in account suspension or termination</li>
              <li>Appeals can be submitted through our support system</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Intellectual Property</h2>
            <p>
              All content on the platform, including games, graphics, text, and software, is owned by 
              Cipro or our licensors and is protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Disclaimers</h2>
            <p>
              The platform is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul>
              <li>Uninterrupted or error-free service</li>
              <li>The accuracy of cryptocurrency prices or rewards</li>
              <li>The availability of specific features</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Limitation of Liability</h2>
            <p>
              In no event shall Cipro be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Account Termination</h2>
            <p>
              We reserve the right to terminate or suspend accounts that violate these terms. 
              Upon termination:
            </p>
            <ul>
              <li>Access to the platform will be revoked</li>
              <li>Pending rewards may be forfeited</li>
              <li>VIP subscriptions will be cancelled</li>
              <li>Account data may be deleted after a reasonable period</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable international 
              laws and regulations regarding cryptocurrency and online gaming platforms.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified of 
              material changes, and continued use of the platform constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> legal@ciprohub.site</p>
              <p><strong>Support:</strong> support@ciprohub.site</p>
              <p><strong>Website:</strong> www.ciprohub.site</p>
            </div>
          </section>
        </div>

        <div className="legal-footer">
          <p>
            By using Cipro, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServicePage;