import Link from 'next/link';
export const metadata = { title: 'Terms of Service - Cipro' };
export default function Terms() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-slate-400 hover:text-white transition-colors text-sm">← Back</Link>
        <h1 className="text-4xl font-black text-white mb-6">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-8">Last updated: January 2024</p>
        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <section><h2 className="text-white font-bold text-lg mb-2">Acceptance of Terms</h2><p>By using Cipro, you agree to these terms. If you do not agree, please do not use our platform.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Eligibility</h2><p>You must be 18 years or older to use Cipro. By registering, you confirm you meet this requirement.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Rewards & Withdrawals</h2><p>Points earned through gameplay can be converted to cryptocurrency at the rates displayed on the platform. Minimum withdrawal thresholds apply. We reserve the right to adjust conversion rates.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Prohibited Activities</h2><p>Cheating, botting, creating multiple accounts, or any form of fraud will result in immediate account termination and forfeiture of all rewards.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Limitation of Liability</h2><p>Cipro is not responsible for cryptocurrency market fluctuations or losses resulting from wallet errors. Always double-check withdrawal addresses.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Contact</h2><p>Questions? Visit our <Link href="/support" className="text-primary hover:underline">support page</Link>.</p></section>
        </div>
      </div>
    </div>
  );
}
