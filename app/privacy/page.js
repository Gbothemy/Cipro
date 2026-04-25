import Link from 'next/link';
export const metadata = { title: 'Privacy Policy - Cipro' };
export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ padding: '5rem 1rem' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-muted text-sm" style={{ transition: 'color 0.2s' }}>← Back</Link>
        <h1 className="text-4xl font-black text-white mb-6">Privacy Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: January 2024</p>
        <div className="flex-col gap-6 text-muted text-sm" style={{ lineHeight: '1.6' }}>
          <section><h2 className="text-white font-bold text-lg mb-2">Information We Collect</h2><p>We collect username, email address, and gameplay data to provide our services. We do not collect financial information beyond wallet addresses for withdrawals.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">How We Use Your Data</h2><p>Your data is used to operate the platform, process withdrawals, calculate rewards, and improve our services. We do not sell your personal data to third parties.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Data Security</h2><p>We use industry-standard security measures to protect your data. Wallet addresses are stored securely and only used for processing withdrawals.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Cookies</h2><p>We use cookies for authentication and session management. You can disable cookies in your browser settings, but this may affect functionality.</p></section>
          <section><h2 className="text-white font-bold text-lg mb-2">Contact</h2><p>For privacy concerns, contact us via our <Link href="/support" className="text-primary">support page</Link>.</p></section>
        </div>
      </div>
    </div>
  );
}
