'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen py-20 px-4" style={{ background: '#0a0a0f' }}>
      <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted text-sm" style={{ transition: 'color 0.2s' }}>
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black text-white mb-3">Support</h1>
          <p className="text-muted">We&apos;re here to help. Send us a message.</p>
        </div>

        {sent ? (
          <div className="card p-10 text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-muted mb-6">We&apos;ll get back to you within 24-48 hours.</p>
            <button onClick={() => setSent(false)} className="btn btn-secondary px-6 py-3 text-sm">Send Another</button>
          </div>
        ) : (
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div className="grid-2">
                <div>
                  <label className="block text-sm font-medium text-light mb-2">Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light mb-2">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-light mb-2">Subject</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="What's this about?" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-light mb-2">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue..."
                  rows={5}
                  className="input"
                  style={{ resize: 'none' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full py-4">Send Message</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
