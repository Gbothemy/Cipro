import Link from 'next/link';
export const metadata = { title: 'About - Cipro' };
export default function About() {
  return (
    <div className="min-h-screen" style={{ padding: '5rem 1rem' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-muted text-sm" style={{ transition: 'color 0.2s' }}>← Back</Link>
        <h1 className="text-4xl font-black text-white mb-6">About Cipro</h1>
        <div className="flex-col gap-6 text-muted" style={{ lineHeight: '1.6' }}>
          <p>Cipro is a play-to-earn gaming platform where players earn real cryptocurrency by playing fun games and completing daily tasks.</p>
          <p>Our mission is simple: make crypto accessible to everyone through entertainment. No investment required — just play, earn, and withdraw.</p>
          <div className="card p-5">
            <h2 className="font-bold text-white mb-3">What We Offer</h2>
            <ul className="flex-col gap-2 text-sm">
              {['4 fun games with daily rewards','Daily tasks and streak bonuses','Real crypto withdrawals (SOL, ETH, USDT, USDC)','VIP tiers with better rates','Referral program with 10% commission'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="text-primary">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm">© 2024 Cipro. All rights reserved. <Link href="/support" className="text-primary">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
}
