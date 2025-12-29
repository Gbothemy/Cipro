import React from 'react';
import SEOHead from '../components/SEOHead';
import './LegalPage.css';

function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <SEOHead 
        title="🔒 Privacy Policy - Cipro Data Protection | User Privacy"
        description="Learn how Cipro protects your privacy and handles your data. Our privacy policy covers information collection, cryptocurrency transactions, data security, and user rights."
        keywords="cipro privacy policy, data protection, user privacy, cryptocurrency privacy, gaming platform privacy, data security"
        url="https://www.ciprohub.site/privacy"
        noindex={true}
      />
      <div className="legal-container">
        <div className="legal-header">
          <h1>🔒 Privacy Policy</h1>
          <p className="last-updated">Last updated: December 29, 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>
              At Cipro, we collect information you provide directly to us, such as when you create an account, 
              play games, or contact us for support.
            </p>
            <ul>
              <li><strong>Account Information:</strong> Username, email address, and avatar selection</li>
              <li><strong>Gaming Data:</strong> Game scores, achievements, and progress</li>
              <li><strong>Cryptocurrency Data:</strong> Wallet addresses for withdrawals (we do not store private keys)</li>
              <li><strong>Usage Information:</strong> How you interact with our platform and games</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our gaming platform</li>
              <li>Process cryptocurrency rewards and withdrawals</li>
              <li>Track your progress and achievements</li>
              <li>Send you important updates about your account</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties, except:
            </p>
            <ul>
              <li>When required by law or legal process</li>
              <li>To protect our rights, property, or safety</li>
              <li>With service providers who help us operate our platform (under strict confidentiality agreements)</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Cryptocurrency and Blockchain</h2>
            <p>
              Our platform involves cryptocurrency transactions. Please note:
            </p>
            <ul>
              <li>Blockchain transactions are public and permanent</li>
              <li>We do not store your private keys or seed phrases</li>
              <li>You are responsible for the security of your wallet</li>
              <li>Cryptocurrency transactions cannot be reversed</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption of sensitive data</li>
              <li>Secure server infrastructure</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Update or correct your information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of non-essential communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience and analyze platform usage. 
              You can control cookie settings through your browser.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Children's Privacy</h2>
            <p>
              Our platform is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. International Users</h2>
            <p>
              Our services are available globally. By using our platform, you consent to the transfer 
              and processing of your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@ciprohub.site</p>
              <p><strong>Website:</strong> www.ciprohub.site</p>
            </div>
          </section>
        </div>

        <div className="legal-footer">
          <p>
            By using Cipro, you acknowledge that you have read and understood this Privacy Policy 
            and agree to the collection and use of your information as described herein.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;