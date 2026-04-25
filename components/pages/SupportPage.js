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
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-slate-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black text-white mb-3">Support</h1>
          <p className="text-slate-400">We&apos;re here to help. Send us a message.</p>
        </div>

        {sent ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-slate-400 mb-6">We&apos;ll get back to you within 24-48 hours.</p>
            <button onClick={() => setSent(false)} className="btn-secondary px-6 py-2.5 text-sm">Send Another</button>
          </div>
        ) : (
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="What's this about?" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue..."
                  rows={5}
                  className="input-field resize-none"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3.5">Send Message</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
