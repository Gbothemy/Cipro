'use client';
import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  { q: 'How do I earn points?', a: 'Play games (Trivia, Memory, Puzzle, Spin Wheel), complete daily tasks, log in daily for streak bonuses, and refer friends.' },
  { q: 'How do I convert points to crypto?', a: 'Go to Wallet → Convert. The base rate is 10,000 points = $1 USD. VIP members get better rates.' },
  { q: 'What is the minimum withdrawal?', a: 'Minimum withdrawals: 0.1 SOL, 0.005 ETH, 5 USDT, 5 USDC. Withdrawals are processed within 1-3 business days.' },
  { q: 'How does the referral program work?', a: 'Share your unique referral link. When friends sign up and earn rewards, you automatically receive 10% of their earnings.' },
  { q: 'What are VIP tiers?', a: 'VIP tiers unlock better conversion rates, more daily game attempts, and exclusive rewards. Earn XP by playing games and completing tasks.' },
  { q: 'Are the crypto rewards real?', a: 'Yes! All crypto rewards are real and withdrawable to your personal wallet once you reach the minimum threshold.' },
  { q: 'How many games can I play per day?', a: 'Free users get 5 attempts per game (3 for Spin Wheel). VIP members get additional attempts based on their tier.' },
  { q: 'Is Cipro free to use?', a: 'Yes, Cipro is completely free to use. You can earn crypto without any investment.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen py-20 px-4" style={{ background: '#0a0a0f' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted text-sm" style={{ transition: 'color 0.2s' }}>
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black text-white mb-3">FAQ</h1>
          <p className="text-muted">Frequently asked questions about Cipro</p>
        </div>

        <div className="flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
                <span 
                  className="text-primary flex-shrink-0"
                  style={{ 
                    transition: 'transform 0.2s',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)'
                  }}
                >+</span>
              </button>
              {open === i && (
                <div 
                  className="px-5 pb-5 text-sm text-muted pt-4"
                  style={{ 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    lineHeight: '1.6'
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-muted text-sm mb-3">Still have questions?</p>
          <Link href="/support" className="btn btn-primary inline-block px-6 py-3">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
