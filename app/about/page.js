import Link from 'next/link';
export const metadata = { title: 'About - Cipro' };
export default function About() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-slate-400 hover:text-white transition-colors text-sm">← Back</Link>
        <h1 className="text-4xl font-black text-white mb-6">About Cipro</h1>
        <div className="space-y-6 text-slate-400 leading-relaxed">
          <p>Cipro is a play-to-earn gaming platform where players earn real cryptocurrency by playing fun games and completing daily tasks.</p>
          <p>Our mission is simple: make crypto accessible to everyone through entertainment. No investment required — just play, earn, and withdraw.</p>
          <div className="card p-5">
            <h2 className="font-bold text-white mb-3">What We Offer</h2>
            <ul className="space-y-2 text-sm">
              {['4 fun games with daily rewards','Daily tasks and streak bonuses','Real crypto withdrawals (SOL, ETH, USDT, USDC)','VIP tiers with better rates','Referral program with 10% commission'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="text-primary">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm">© 2024 Cipro. All rights reserved. <Link href="/support" className="text-primary hover:underline">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
}
