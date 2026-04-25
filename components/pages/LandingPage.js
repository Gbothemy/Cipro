'use client';
import Link from 'next/link';
import styles from './LandingPage.module.css';

const stats = [
  { value: '4',   label: 'Fun Games' },
  { value: '$1',  label: 'Per 10k Points' },
  { value: '$5',  label: 'Min Withdrawal' },
  { value: '24/7',label: 'Available' },
];
const features = [
  { icon: '🎮', title: 'Play Games',      desc: 'Puzzle, Memory, Trivia, and Spin Wheel' },
  { icon: '📋', title: 'Complete Tasks',  desc: 'Daily challenges for bonus points' },
  { icon: '💳', title: 'Earn Crypto',     desc: 'Convert points to USDT, SOL, ETH, USDC' },
  { icon: '🏆', title: 'Compete',         desc: 'Climb the leaderboard and win prizes' },
];
const cryptos = [
  { name: 'SOL',  icon: '◎', color: '#14F195' },
  { name: 'ETH',  icon: 'Ξ', color: '#627EEA' },
  { name: 'USDT', icon: '₮', color: '#26A17B' },
  { name: 'USDC', icon: '$', color: '#2775CA' },
];
const steps = [
  { num: '1', icon: '📝', title: 'Sign Up Free',  desc: 'Create your account in seconds. No credit card required.' },
  { num: '2', icon: '🎮', title: 'Play Games',    desc: 'Complete mining tasks and earn points through various games.' },
  { num: '3', icon: '💰', title: 'Earn Rewards',  desc: 'Convert points to crypto and withdraw to your wallet.' },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <div className={styles.navLogoIcon}>💎</div>
            <span className={styles.navLogoText}>Cipro</span>
          </div>
          <div className={styles.navBtns}>
            <Link href="/login" className={styles.navBtnGhost}>Login</Link>
            <Link href="/login" className={styles.navBtnPrimary}>Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroPill}>
              <span className={styles.heroPillDot} />
              Play-to-Earn Platform
            </div>
            <h1 className={styles.heroTitle}>
              Earn Crypto<br />
              <span className="text-gradient">While Playing</span><br />
              Games
            </h1>
            <p className={styles.heroSubtitle}>
              Join thousands of players earning real cryptocurrency through fun games,
              daily airdrops, and referral rewards. Start your journey today.
            </p>
            <div className={styles.heroBtns}>
              <Link href="/login" className={styles.heroBtnPrimary}>🚀 Start Earning Now</Link>
              <Link href="/login" className={styles.heroBtnSecondary}>🎮 Try Demo</Link>
            </div>
            <div className={styles.cryptoBadges}>
              {cryptos.map((c) => (
                <div key={c.name} className={styles.cryptoBadge} style={{ borderColor: c.color + '50' }}>
                  <span style={{ color: c.color }}>{c.icon}</span>
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardGlow} />
              <span className={styles.heroEmoji}>🎮</span>
            </div>
            <div className={`${styles.floatCard} ${styles.floatCard1}`}>
              <div className={styles.floatCardLabel}>Just earned</div>
              <div className={styles.floatCardValue} style={{ color: '#34d399' }}>+150 Points 💎</div>
            </div>
            <div className={`${styles.floatCard} ${styles.floatCard2}`}>
              <div className={styles.floatCardLabel}>Daily Reward</div>
              <div className={styles.floatCardValue} style={{ color: '#fbbf24' }}>🎁 Claimed!</div>
            </div>
            <div className={`${styles.floatCard} ${styles.floatCard3}`}>
              <div className={styles.floatCardLabel}>Achievement</div>
              <div className={styles.floatCardValue} style={{ color: '#667eea' }}>🏆 Level Up!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <div className={`${styles.statValue} text-gradient`}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose Cipro?</h2>
          <p className={styles.sectionSubtitle}>Everything you need to start earning crypto rewards today</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>Three simple steps to start earning</p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((s, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepIconWrap}>
                <span className={styles.stepEmoji}>{s.icon}</span>
                <span className={styles.stepNum}>{s.num}</span>
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaGlow} />
          <h2 className={styles.ctaTitle}>Ready to Start Earning?</h2>
          <p className={styles.ctaSubtitle}>Join thousands of players already earning crypto rewards</p>
          <Link href="/login" className={styles.ctaBtn}>🚀 Get Started — It&apos;s Free</Link>
          <p className={styles.ctaNote}>No credit card required · Start earning in minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoIcon}>💎</div>
                <span>Cipro</span>
              </div>
              <p className={styles.footerTagline}>Play games and earn cryptocurrency rewards</p>
            </div>
            <div>
              <h4 className={styles.footerHeading}>Product</h4>
              <a href="#" className={styles.footerLink}>Features</a>
              <a href="#" className={styles.footerLink}>How It Works</a>
            </div>
            <div>
              <h4 className={styles.footerHeading}>Company</h4>
              <Link href="/about"   className={styles.footerLink}>About Us</Link>
              <Link href="/support" className={styles.footerLink}>Contact</Link>
              <Link href="/faq"     className={styles.footerLink}>FAQ</Link>
            </div>
            <div>
              <h4 className={styles.footerHeading}>Legal</h4>
              <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              <Link href="/terms"   className={styles.footerLink}>Terms of Service</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 Cipro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
